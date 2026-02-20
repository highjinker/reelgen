import { Link } from 'react-router-dom';
import type { Reel } from '../../types';
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ReelCardProps {
  reel: Reel;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'text-gray-500', icon: Clock },
  generating_script: { label: 'Writing Script...', color: 'text-yellow-600', icon: Loader2 },
  script_ready: { label: 'Script Ready', color: 'text-blue-600', icon: CheckCircle },
  generating_audio: { label: 'Generating Audio...', color: 'text-yellow-600', icon: Loader2 },
  generating_video: { label: 'Generating Video...', color: 'text-yellow-600', icon: Loader2 },
  post_processing: { label: 'Processing...', color: 'text-yellow-600', icon: Loader2 },
  completed: { label: 'Completed', color: 'text-green-600', icon: CheckCircle },
  failed: { label: 'Failed', color: 'text-red-600', icon: AlertCircle },
};

export function ReelCard({ reel }: ReelCardProps) {
  const config = STATUS_CONFIG[reel.status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  const isLoading = ['generating_script', 'generating_audio', 'generating_video', 'post_processing'].includes(reel.status);

  return (
    <Link
      to={`/reels/${reel.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{reel.topic}</h3>
          <p className="mt-1 text-xs text-gray-500">
            {reel.language === 'hi' ? 'Hindi' : 'English'} &middot;{' '}
            {new Date(reel.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium ${config.color}`}>
          <Icon className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {config.label}
        </span>
      </div>

      {reel.script_text && (
        <p className="mt-3 text-xs text-gray-600 line-clamp-2">{reel.script_text}</p>
      )}

      {reel.error_message && (
        <p className="mt-2 text-xs text-red-600 truncate">{reel.error_message}</p>
      )}

      {reel.duration_seconds && (
        <p className="mt-2 text-xs text-gray-500">
          Duration: {Math.round(reel.duration_seconds)}s
        </p>
      )}
    </Link>
  );
}
