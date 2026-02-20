from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserProfile, UserUpdate
from app.middleware.auth import get_current_user
from app.services.storage_service import save_upload, delete_file
from app.utils.validation import validate_image, validate_audio, convert_audio_to_wav
from config import get_settings

settings = get_settings()
router = APIRouter()


@router.get("/me", response_model=UserProfile)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserProfile)
def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.specialization is not None:
        current_user.specialization = data.specialization
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/photo", response_model=UserProfile)
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_bytes = await file.read()
    is_valid, error = validate_image(
        file_bytes,
        max_size_mb=settings.MAX_IMAGE_SIZE_MB,
        min_dimension=settings.MIN_IMAGE_DIMENSION,
    )
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    # Delete old photo if exists
    if current_user.photo_path:
        delete_file(current_user.photo_path)

    rel_path = save_upload(file_bytes, "uploads/photos", file.filename or "photo.jpg")
    current_user.photo_path = rel_path
    _check_onboarded(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/voice-sample", response_model=UserProfile)
async def upload_voice_sample(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_bytes = await file.read()
    is_valid, error = validate_audio(
        file_bytes,
        file.filename or "audio.wav",
        max_size_mb=settings.MAX_AUDIO_SIZE_MB,
        min_duration_s=settings.MIN_VOICE_DURATION_S,
        max_duration_s=settings.MAX_VOICE_DURATION_S,
    )
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    # Convert to WAV 22050Hz mono
    wav_bytes = convert_audio_to_wav(file_bytes, file.filename or "audio.wav")

    # Delete old voice sample if exists
    if current_user.voice_sample_path:
        delete_file(current_user.voice_sample_path)

    rel_path = save_upload(wav_bytes, "uploads/voice_samples", "voice.wav")
    current_user.voice_sample_path = rel_path
    _check_onboarded(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


def _check_onboarded(user: User) -> None:
    if user.photo_path and user.voice_sample_path:
        user.is_onboarded = True
