import logging
import os
import time
import uuid

import httpx
import replicate

from config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


def generate_lipsync_video(photo_path: str, audio_path: str) -> str:
    """
    Generate lip-synced video using Sonic via Replicate.
    Returns relative path to generated video file.
    """
    output_filename = f"{uuid.uuid4().hex}.mp4"
    output_rel_path = os.path.join("generated", "video_raw", output_filename)
    output_abs_path = os.path.join(settings.STORAGE_PATH, output_rel_path)
    os.makedirs(os.path.dirname(output_abs_path), exist_ok=True)

    photo_abs_path = os.path.join(settings.STORAGE_PATH, photo_path)
    audio_abs_path = os.path.join(settings.STORAGE_PATH, audio_path)

    logger.info(f"Starting lip-sync generation (Sonic): photo={photo_path}, audio={audio_path}")

    max_retries = 3
    for attempt in range(max_retries):
        try:
            with open(photo_abs_path, "rb") as photo_file, open(audio_abs_path, "rb") as audio_file:
                output = replicate.run(
                    "zf-kbot/sonic:c6d80220ce71d8df04d5dbf2b189b70b9f4937aea6a030de12cb46951b24d134",
                    input={
                        "image": photo_file,
                        "audio": audio_file,
                        "dynamic_scale": 1.0,
                        "inference_steps": 25,
                        "keep_resolution": True,
                    },
                )
            break
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                wait = 15 * (attempt + 1)
                logger.warning(f"Rate limited, retrying in {wait}s (attempt {attempt + 1})")
                time.sleep(wait)
            else:
                raise

    # Output may be a FileOutput URL or a list
    video_url = str(output) if not isinstance(output, list) else str(output[0])

    # Download the generated video
    response = httpx.get(video_url, timeout=180, follow_redirects=True)
    with open(output_abs_path, "wb") as f:
        f.write(response.content)

    logger.info(f"Lip-sync video generated: {output_rel_path}")
    return output_rel_path
