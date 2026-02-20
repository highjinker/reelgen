import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePolling } from '../hooks/usePolling';
import { ReelTimeline } from '../components/features/ReelTimeline';
import { ScriptEditor } from '../components/features/ScriptEditor';
import { VideoPlayer } from '../components/ui/VideoPlayer';
import { Button } from '../components/ui/Button';
import { reelsApi } from '../api/reels';
import { ArrowLeft, Download, Trash2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export function ReelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reelId = id ? parseInt(id) : null;
  const { reel, error, setReel, restartPolling } = usePolling(reelId);

  const handleDelete = async () => {
    if (!reelId || !confirm('Delete this reel?')) return;
    try {
      await reelsApi.delete(reelId);
      toast.success('Reel deleted');
      navigate('/');
    } catch {
      toast.error('Failed to delete reel');
    }
  };

  const handleRetry = async () => {
    if (!reelId || !reel) return;
    try {
      const { data } = await reelsApi.generate(reelId);
      setReel(data);
      restartPolling();
      toast.success('Retrying generation...');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to retry');
    }
  };

  const handleDownload = async () => {
    if (!reelId) return;
    try {
      const { data } = await reelsApi.download(reelId);
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reel_${reelId}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download reel');
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <Link to="/" className="text-indigo-600 mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!reel) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{reel.topic}</h1>
          <p className="text-sm text-gray-500">
            {reel.language === 'hi' ? 'Hindi' : 'English'} &middot;{' '}
            {new Date(reel.created_at).toLocaleString()}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Timeline */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Progress</h2>
            <ReelTimeline currentStatus={reel.status} />
          </div>
        </div>

        {/* Right: Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Script Editor (when script is ready or failed) */}
          {(reel.status === 'script_ready' || reel.status === 'failed') && reel.script_text && (
            <div className="bg-white rounded-lg shadow p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Review Script</h2>
              <ScriptEditor
                reelId={reel.id}
                initialScript={reel.script_text}
                onGenerate={() => {
                  restartPolling();
                }}
              />
            </div>
          )}

          {/* Script display (when not editable) */}
          {reel.script_text && reel.status !== 'script_ready' && reel.status !== 'failed' && (
            <div className="bg-white rounded-lg shadow p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Script</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{reel.script_text}</p>
            </div>
          )}

          {/* Video preview */}
          {reel.status === 'completed' && reel.video_final_path && (
            <div className="bg-white rounded-lg shadow p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Preview</h2>
              <VideoPlayer src={`/storage/${reel.video_final_path}`} />
              {reel.duration_seconds && (
                <p className="mt-2 text-xs text-gray-500">
                  Duration: {Math.round(reel.duration_seconds)} seconds
                </p>
              )}
              <Button onClick={handleDownload} className="mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Download Reel
              </Button>
            </div>
          )}

          {/* Error state */}
          {reel.status === 'failed' && (
            <div className="bg-red-50 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-red-800 mb-2">Generation Failed</h2>
              <p className="text-sm text-red-700">{reel.error_message}</p>
              {reel.script_text && (
                <Button variant="secondary" size="sm" onClick={handleRetry} className="mt-3">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Generation
                </Button>
              )}
            </div>
          )}

          {/* Loading states */}
          {['pending', 'generating_script', 'generating_audio', 'generating_video', 'post_processing'].includes(reel.status) && (
            <div className="bg-white rounded-lg shadow p-5 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-600">Processing... This page updates automatically.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
