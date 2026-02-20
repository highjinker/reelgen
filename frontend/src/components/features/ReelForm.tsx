import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { reelsApi } from '../../api/reels';
import toast from 'react-hot-toast';

export function ReelForm() {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const { data } = await reelsApi.create({ topic, language });
      toast.success('Reel created! Generating script...');
      navigate(`/reels/${data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create reel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Topic"
        placeholder="e.g., 5 tips for managing diabetes"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        required
        minLength={3}
        maxLength={500}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="language"
              value="en"
              checked={language === 'en'}
              onChange={() => setLanguage('en')}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">English</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="language"
              value="hi"
              checked={language === 'hi'}
              onChange={() => setLanguage('hi')}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Hindi</span>
          </label>
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Generate Script
      </Button>
    </form>
  );
}
