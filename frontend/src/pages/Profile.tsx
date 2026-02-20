import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { profileApi } from '../api/profile';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { FileUpload } from '../components/ui/FileUpload';
import { AudioRecorder } from '../components/ui/AudioRecorder';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [specialization, setSpecialization] = useState(user?.specialization || '');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileApi.updateProfile({ full_name: fullName, specialization });
      await refreshUser();
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      await profileApi.uploadPhoto(file);
      await refreshUser();
      toast.success('Photo updated');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to upload photo');
    }
  };

  const handleVoiceUpload = async (blob: Blob) => {
    try {
      await profileApi.uploadVoiceSample(blob, 'voice.webm');
      await refreshUser();
      toast.success('Voice sample updated');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to upload voice sample');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Info</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email"
            value={user.email}
            disabled
          />
          <Input
            label="Specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          />
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo</h2>
        <FileUpload
          onFile={handlePhotoUpload}
          label="Update Photo"
          hint="JPEG or PNG, min 512x512, max 10MB"
          preview={user.photo_path ? `/storage/${user.photo_path}` : null}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Voice Sample</h2>
        <AudioRecorder
          onRecorded={handleVoiceUpload}
          existingUrl={user.voice_sample_path ? `/storage/${user.voice_sample_path}` : null}
        />
      </div>
    </div>
  );
}
