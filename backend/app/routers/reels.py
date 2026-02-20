import os

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models import User, Reel
from app.schemas import ReelCreate, ReelResponse, ReelList, ScriptUpdate
from app.middleware.auth import get_current_user
from app.services.pipeline_service import run_script_generation, run_full_pipeline
from config import get_settings

settings = get_settings()
router = APIRouter()


@router.post("/", response_model=ReelResponse, status_code=status.HTTP_201_CREATED)
def create_reel(
    data: ReelCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_onboarded:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete onboarding first (upload photo and voice sample)",
        )

    reel = Reel(
        user_id=current_user.id,
        topic=data.topic,
        language=data.language,
        status="pending",
    )
    db.add(reel)
    db.commit()
    db.refresh(reel)

    # Trigger script generation in background
    background_tasks.add_task(run_script_generation, reel.id, SessionLocal)

    return reel


@router.get("/", response_model=ReelList)
def list_reels(
    page: int = 1,
    per_page: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Reel).filter(Reel.user_id == current_user.id)
    total = query.count()
    reels = query.order_by(Reel.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return ReelList(reels=reels, total=total, page=page, per_page=per_page)


@router.get("/{reel_id}", response_model=ReelResponse)
def get_reel(
    reel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.user_id == current_user.id).first()
    if not reel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reel not found")
    return reel


@router.put("/{reel_id}/script", response_model=ReelResponse)
def update_script(
    reel_id: int,
    data: ScriptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.user_id == current_user.id).first()
    if not reel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reel not found")

    if reel.status not in ("script_ready", "failed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Script can only be edited when status is 'script_ready' or 'failed' (current: {reel.status})",
        )

    reel.script_text = data.script_text
    db.commit()
    db.refresh(reel)
    return reel


@router.post("/{reel_id}/generate", response_model=ReelResponse)
def generate_reel(
    reel_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.user_id == current_user.id).first()
    if not reel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reel not found")

    if reel.status not in ("script_ready", "failed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can only generate when status is 'script_ready' or 'failed' (current: {reel.status})",
        )

    reel.error_message = None
    # Trigger full pipeline in background
    background_tasks.add_task(run_full_pipeline, reel.id, SessionLocal)

    reel.status = "generating_audio"
    db.commit()
    db.refresh(reel)
    return reel


@router.get("/{reel_id}/download")
def download_reel(
    reel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.user_id == current_user.id).first()
    if not reel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reel not found")

    if reel.status != "completed" or not reel.video_final_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reel is not ready for download",
        )

    abs_path = os.path.join(settings.STORAGE_PATH, reel.video_final_path)
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video file not found")

    return FileResponse(
        abs_path,
        media_type="video/mp4",
        filename=f"reel_{reel.id}.mp4",
    )


@router.delete("/{reel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reel(
    reel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reel = db.query(Reel).filter(Reel.id == reel_id, Reel.user_id == current_user.id).first()
    if not reel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reel not found")

    db.delete(reel)
    db.commit()
