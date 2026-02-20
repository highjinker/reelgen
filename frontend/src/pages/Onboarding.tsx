import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { profileApi } from '../api/profile';
import { FileUpload } from '../components/ui/FileUpload';
import { AudioRecorder } from '../components/ui/AudioRecorder';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

export function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    user?.photo_path ? `/storage/${user.photo_path}` : null
  );
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoSelect = (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    setUploading(true);
    try {
      await profileApi.uploadPhoto(photoFile);
      toast.success('Photo uploaded');
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadVoice = async () => {
    if (!voiceBlob) return;
    setUploading(true);
    try {
      await profileApi.uploadVoiceSample(voiceBlob, 'voice.webm');
      await refreshUser();
      toast.success('Voice sample uploaded! Onboarding complete.');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to upload voice sample');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
      <p className="text-gray-600 mb-8">
        Upload your photo and voice sample to start creating AI-generated reels.
      </p>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        <div className={`h-1 flex-1 rounded ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
        <div className={`h-1 flex-1 rounded ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <FileUpload
            onFile={handlePhotoSelect}
            label="Your Photo"
            hint="JPEG or PNG, min 512x512, max 10MB. This will be used for lip-sync."
            preview={photoPreview}
          />
          <Button
            onClick={handleUploadPhoto}
            loading={uploading}
            disabled={!photoFile}
            className="w-full"
          >
            Upload &amp; Continue
          </Button>
          {user?.photo_path && (
            <button
              onClick={() => setStep(2)}
              className="w-full text-sm text-indigo-600 hover:text-indigo-500"
            >
              Skip (photo already uploaded)
            </button>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <AudioRecorder
            onRecorded={(blob) => setVoiceBlob(blob)}
            existingUrl={user?.voice_sample_path ? `/storage/${user.voice_sample_path}` : null}
          />
          <p className="text-sm text-gray-600">
            Or upload an existing audio file:
          </p>
          <FileUpload
            onFile={(file) => setVoiceBlob(file)}
            accept={{
              'audio/wav': ['.wav'],
              'audio/mpeg': ['.mp3'],
              'audio/webm': ['.webm'],
            }}
            maxSize={50 * 1024 * 1024}
            label="Upload Voice File"
            hint="WAV, MP3, or WebM, 10-30 seconds, max 50MB"
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              onClick={handleUploadVoice}
              loading={uploading}
              disabled={!voiceBlob}
              className="flex-1"
            >
              Complete Onboarding
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
