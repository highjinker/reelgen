import type { ReelStatus } from '../../types';
import { Check, Loader2 } from 'lucide-react';

interface ReelTimelineProps {
  currentStatus: ReelStatus;
}

const STEPS = [
  { key: 'generating_script', label: 'Generating Script' },
  { key: 'script_ready', label: 'Script Ready' },
  { key: 'generating_audio', label: 'Generating Audio' },
  { key: 'generating_video', label: 'Generating Video' },
  { key: 'post_processing', label: 'Post Processing' },
  { key: 'completed', label: 'Completed' },
];

const STATUS_ORDER = [
  'pending', 'generating_script', 'script_ready',
  'generating_audio', 'generating_video', 'post_processing', 'completed',
];

export function ReelTimeline({ currentStatus }: ReelTimelineProps) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const isFailed = currentStatus === 'failed';

  return (
    <div className="space-y-3">
      {STEPS.map((step, idx) => {
        const stepIdx = STATUS_ORDER.indexOf(step.key);
        const isCompleted = !isFailed && (currentIdx > stepIdx || (currentStatus === 'completed' && step.key === 'completed'));
        const isCurrent = !isFailed && currentStatus === step.key;
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isCurrent
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-xs">{idx + 1}</span>
              )}
            </div>
            <span
              className={`text-sm ${
                isCompleted
                  ? 'text-green-700 font-medium'
                  : isCurrent
                  ? 'text-indigo-700 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}

      {isFailed && (
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-red-500 text-white">
            !
          </div>
          <span className="text-sm text-red-700 font-medium">Failed</span>
        </div>
      )}
    </div>
  );
}
