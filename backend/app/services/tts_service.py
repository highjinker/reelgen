import logging
import os
import uuid

from config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


def generate_tts_audio(text: str, voice_sample_path: str, language: str = "en") -> str:
    """
    Generate TTS audio using voice cloning.
    Returns relative path to generated audio file.
    """
    output_filename = f"{uuid.uuid4().hex}.wav"
    output_rel_path = os.path.join("generated", "audio", output_filename)
    output_abs_path = os.path.join(settings.STORAGE_PATH, output_rel_path)
    os.makedirs(os.path.dirname(output_abs_path), exist_ok=True)

    voice_abs_path = os.path.join(settings.STORAGE_PATH, voice_sample_path)

    if settings.TTS_BACKEND == "replicate":
        _generate_via_replicate(text, voice_abs_path, output_abs_path, language)
    else:
        _generate_local(text, voice_abs_path, output_abs_path, language)

    logger.info(f"TTS audio generated: {output_rel_path}")
    return output_rel_path


def _generate_local(text: str, voice_path: str, output_path: str, language: str):
    """Generate TTS locally using Coqui XTTS v2."""
    try:
        from TTS.api import TTS

        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
        tts.tts_to_file(
            text=text,
            speaker_wav=voice_path,
            language=language,
            file_path=output_path,
        )
    except ImportError:
        logger.warning("Coqui TTS not installed, generating silent placeholder audio")
        _generate_placeholder(output_path, text)


def _generate_via_replicate(text: str, voice_path: str, output_path: str, language: str):
    """Generate TTS via Replicate API."""
    import time
    import replicate
    import httpx

    max_retries = 3
    for attempt in range(max_retries):
        try:
            with open(voice_path, "rb") as f:
                output = replicate.run(
                    "lucataco/xtts-v2:684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e",
                    input={
                        "text": text,
                        "speaker": f,
                        "language": language,
                    },
                )
            break
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                wait = 15 * (attempt + 1)
                logger.warning(f"TTS rate limited, retrying in {wait}s")
                time.sleep(wait)
            else:
                raise

    # Output may be a URL string or FileOutput
    audio_url = str(output)
    response = httpx.get(audio_url, timeout=120, follow_redirects=True)
    with open(output_path, "wb") as f:
        f.write(response.content)


def _generate_placeholder(output_path: str, text: str):
    """Generate a silent WAV placeholder when TTS is unavailable."""
    import struct
    import math

    # Generate silent audio proportional to text length
    duration_s = max(5, len(text.split()) * 0.4)
    sample_rate = 22050
    num_samples = int(sample_rate * duration_s)

    # WAV header + silent samples
    data_size = num_samples * 2
    with open(output_path, "wb") as f:
        # RIFF header
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + data_size))
        f.write(b"WAVE")
        # fmt chunk
        f.write(b"fmt ")
        f.write(struct.pack("<I", 16))  # chunk size
        f.write(struct.pack("<H", 1))   # PCM
        f.write(struct.pack("<H", 1))   # mono
        f.write(struct.pack("<I", sample_rate))
        f.write(struct.pack("<I", sample_rate * 2))  # byte rate
        f.write(struct.pack("<H", 2))   # block align
        f.write(struct.pack("<H", 16))  # bits per sample
        # data chunk
        f.write(b"data")
        f.write(struct.pack("<I", data_size))
        # Silent samples
        f.write(b"\x00" * data_size)
