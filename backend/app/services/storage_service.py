import os
import uuid
from pathlib import Path

from config import get_settings

settings = get_settings()


def get_storage_path(*parts: str) -> str:
    path = os.path.join(settings.STORAGE_PATH, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


def save_upload(file_bytes: bytes, subdir: str, filename: str) -> str:
    """Save uploaded file and return relative path from storage root."""
    ext = Path(filename).suffix
    unique_name = f"{uuid.uuid4().hex}{ext}"
    rel_path = os.path.join(subdir, unique_name)
    abs_path = get_storage_path(rel_path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    with open(abs_path, "wb") as f:
        f.write(file_bytes)
    return rel_path


def delete_file(rel_path: str) -> None:
    abs_path = os.path.join(settings.STORAGE_PATH, rel_path)
    if os.path.exists(abs_path):
        os.remove(abs_path)


def get_absolute_path(rel_path: str) -> str:
    return os.path.join(settings.STORAGE_PATH, rel_path)
