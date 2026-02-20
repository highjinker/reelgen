import logging
import os
import subprocess
import uuid

from config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


def _has_drawtext() -> bool:
    """Check if FFmpeg was compiled with the drawtext filter."""
    try:
        result = subprocess.run(
            ["ffmpeg", "-filters"],
            capture_output=True, text=True, timeout=10,
        )
        return "drawtext" in result.stdout
    except Exception:
        return False


# Cache the check at module level
DRAWTEXT_AVAILABLE = _has_drawtext()


def post_process_video(
    video_raw_path: str,
    doctor_name: str,
    topic: str,
) -> str:
    """
    Post-process video: scale to 9:16 (1080x1920), add text overlays if available, encode H.264.
    Returns (relative path to final video, duration in seconds).
    """
    output_filename = f"{uuid.uuid4().hex}.mp4"
    output_rel_path = os.path.join("generated", "video_final", output_filename)
    output_abs_path = os.path.join(settings.STORAGE_PATH, output_rel_path)
    os.makedirs(os.path.dirname(output_abs_path), exist_ok=True)

    input_abs_path = os.path.join(settings.STORAGE_PATH, video_raw_path)

    # Base filter: scale and pad to 9:16
    vf = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black"

    # Add text overlays only if drawtext is available
    if DRAWTEXT_AVAILABLE:
        safe_name = _escape_ffmpeg_text(doctor_name)
        safe_topic = _escape_ffmpeg_text(topic[:60])
        vf += (
            f",drawtext=text='{safe_topic}'"
            ":fontcolor=white:fontsize=36:borderw=2:bordercolor=black"
            ":x=(w-text_w)/2:y=80"
            f",drawtext=text='Dr. {safe_name}'"
            ":fontcolor=white:fontsize=32:borderw=2:bordercolor=black"
            ":x=(w-text_w)/2:y=h-120"
        )
    else:
        logger.warning("drawtext filter not available — skipping text overlays")

    cmd = [
        "ffmpeg", "-y",
        "-i", input_abs_path,
        "-vf", vf,
        "-c:v", "libx264", "-preset", "medium", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-r", "25",
        "-movflags", "+faststart",
        output_abs_path,
    ]

    logger.info(f"Running FFmpeg post-processing")

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=300,
    )

    if result.returncode != 0:
        logger.error(f"FFmpeg error: {result.stderr}")
        raise RuntimeError(f"FFmpeg post-processing failed: {result.stderr[-500:]}")

    duration = _get_video_duration(output_abs_path)
    logger.info(f"Post-processed video: {output_rel_path} ({duration:.1f}s)")

    return output_rel_path, duration


def _escape_ffmpeg_text(text: str) -> str:
    """Escape special characters for FFmpeg drawtext filter."""
    return text.replace("'", "'\\''").replace(":", "\\:").replace("\\", "\\\\")


def _get_video_duration(video_path: str) -> float:
    """Get video duration in seconds using ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "quiet",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                video_path,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        return float(result.stdout.strip())
    except Exception:
        return 0.0
