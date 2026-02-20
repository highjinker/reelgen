from __future__ import annotations

import io
from PIL import Image
from pydub import AudioSegment


def validate_image(file_bytes: bytes, max_size_mb: int = 10, min_dimension: int = 512) -> tuple[bool, str]:
    """Validate uploaded image. Returns (is_valid, error_message)."""
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > max_size_mb:
        return False, f"Image too large: {size_mb:.1f}MB (max {max_size_mb}MB)"

    try:
        img = Image.open(io.BytesIO(file_bytes))
    except Exception:
        return False, "Invalid image file"

    if img.format not in ("JPEG", "PNG"):
        return False, f"Unsupported format: {img.format}. Use JPEG or PNG."

    w, h = img.size
    if w < min_dimension or h < min_dimension:
        return False, f"Image too small: {w}x{h} (min {min_dimension}x{min_dimension})"

    return True, ""


def validate_audio(file_bytes: bytes, filename: str, max_size_mb: int = 50, min_duration_s: int = 10, max_duration_s: int = 30) -> tuple[bool, str]:
    """Validate uploaded audio. Returns (is_valid, error_message)."""
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > max_size_mb:
        return False, f"Audio too large: {size_mb:.1f}MB (max {max_size_mb}MB)"

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ("wav", "mp3", "m4a", "ogg", "webm"):
        return False, f"Unsupported audio format: .{ext}"

    try:
        audio = AudioSegment.from_file(io.BytesIO(file_bytes), format=ext if ext != "m4a" else "mp4")
        duration_s = len(audio) / 1000.0
    except Exception:
        return False, "Could not read audio file"

    if duration_s < min_duration_s:
        return False, f"Audio too short: {duration_s:.1f}s (min {min_duration_s}s)"
    if duration_s > max_duration_s:
        return False, f"Audio too long: {duration_s:.1f}s (max {max_duration_s}s)"

    return True, ""


def convert_audio_to_wav(file_bytes: bytes, filename: str, sample_rate: int = 22050) -> bytes:
    """Convert any audio to WAV 22050Hz mono."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    audio = AudioSegment.from_file(io.BytesIO(file_bytes), format=ext if ext != "m4a" else "mp4")
    audio = audio.set_frame_rate(sample_rate).set_channels(1)
    buf = io.BytesIO()
    audio.export(buf, format="wav")
    return buf.getvalue()
