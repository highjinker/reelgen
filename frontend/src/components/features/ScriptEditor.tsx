import { useState } from 'react';
import { Button } from '../ui/Button';
import { reelsApi } from '../../api/reels';
import toast from 'react-hot-toast';

interface ScriptEditorProps {
  reelId: number;
  initialScript: string;
  onGenerate: () => void;
}

export function ScriptEditor({ reelId, initialScript, onGenerate }: ScriptEditorProps) {
  const [script, setScript] = useState(initialScript);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await reelsApi.updateScript(reelId, { script_text: script });
      toast.success('Script saved');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save script');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Save first, then generate
      await reelsApi.updateScript(reelId, { script_text: script });
      await reelsApi.generate(reelId);
      toast.success('Reel generation started!');
      onGenerate();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to start generation');
    } finally {
      setGenerating(false);
    }
  };

  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Script ({wordCount} words)
        </label>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          placeholder="Your reel script..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Aim for 80-120 words (~30-60 seconds when spoken)
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
        <Button onClick={handleGenerate} loading={generating}>
          Approve &amp; Generate Reel
        </Button>
      </div>
    </div>
  );
}
