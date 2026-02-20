import { useState, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from './Button';

interface AudioRecorderProps {
  onRecorded: (blob: Blob) => void;
  existingUrl?: string | null;
}

export function AudioRecorder({ onRecorded, existingUrl }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingUrl || null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setDuration(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecorded(blob);
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setRecording(true);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Voice Sample (10-30 seconds)
      </label>
      <div className="flex items-center gap-4">
        {recording ? (
          <Button variant="danger" onClick={stopRecording}>
            <Square className="h-4 w-4 mr-2" />
            Stop ({duration}s)
          </Button>
        ) : (
          <Button variant="secondary" onClick={startRecording}>
            <Mic className="h-4 w-4 mr-2" />
            {audioUrl ? 'Re-record' : 'Record Voice'}
          </Button>
        )}
        {audioUrl && !recording && (
          <audio controls src={audioUrl} className="h-8" />
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Record 10-30 seconds of natural speech for voice cloning
      </p>
    </div>
  );
}
