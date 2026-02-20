import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import Reel, User
from app.services.script_service import generate_script
from app.services.tts_service import generate_tts_audio
from app.services.lipsync_service import generate_lipsync_video
from app.services.video_service import post_process_video

logger = logging.getLogger(__name__)


def run_script_generation(reel_id: int, db_session_factory) -> None:
    """Generate script for a reel (background task)."""
    db = db_session_factory()
    try:
        reel = db.query(Reel).filter(Reel.id == reel_id).first()
        if not reel:
            return

        reel.status = "generating_script"
        db.commit()

        try:
            script = generate_script(reel.topic, reel.language)
            reel.script_text = script
            reel.status = "script_ready"
            db.commit()
            logger.info(f"Reel {reel_id}: script generated successfully")
        except Exception as e:
            logger.error(f"Reel {reel_id}: script generation failed: {e}")
            reel.status = "failed"
            reel.error_message = f"Script generation failed: {str(e)}"
            db.commit()
    finally:
        db.close()


def run_full_pipeline(reel_id: int, db_session_factory) -> None:
    """Run full pipeline: TTS → lip-sync → post-processing (background task)."""
    db = db_session_factory()
    try:
        reel = db.query(Reel).filter(Reel.id == reel_id).first()
        if not reel:
            return

        user = db.query(User).filter(User.id == reel.user_id).first()
        if not user or not user.is_onboarded:
            reel.status = "failed"
            reel.error_message = "User profile incomplete (photo or voice sample missing)"
            db.commit()
            return

        # Step 1: TTS
        reel.status = "generating_audio"
        db.commit()
        try:
            audio_path = generate_tts_audio(reel.script_text, user.voice_sample_path, reel.language)
            reel.audio_path = audio_path
            db.commit()
            logger.info(f"Reel {reel_id}: TTS audio generated")
        except Exception as e:
            logger.error(f"Reel {reel_id}: TTS failed: {e}")
            reel.status = "failed"
            reel.error_message = f"TTS generation failed: {str(e)}"
            db.commit()
            return

        # Step 2: Lip-sync
        reel.status = "generating_video"
        db.commit()
        try:
            video_raw_path = generate_lipsync_video(user.photo_path, reel.audio_path)
            reel.video_raw_path = video_raw_path
            db.commit()
            logger.info(f"Reel {reel_id}: lip-sync video generated")
        except Exception as e:
            logger.error(f"Reel {reel_id}: lip-sync failed: {e}")
            reel.status = "failed"
            reel.error_message = f"Lip-sync generation failed: {str(e)}"
            db.commit()
            return

        # Step 3: Post-processing
        reel.status = "post_processing"
        db.commit()
        try:
            video_final_path, duration = post_process_video(
                reel.video_raw_path,
                user.full_name,
                reel.topic,
            )
            reel.video_final_path = video_final_path
            reel.duration_seconds = duration
            reel.status = "completed"
            reel.completed_at = datetime.now(timezone.utc)
            db.commit()
            logger.info(f"Reel {reel_id}: pipeline completed successfully")
        except Exception as e:
            logger.error(f"Reel {reel_id}: post-processing failed: {e}")
            reel.status = "failed"
            reel.error_message = f"Video post-processing failed: {str(e)}"
            db.commit()
    finally:
        db.close()
