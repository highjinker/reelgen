import { useState, useEffect, useRef, useCallback } from 'react';
import type { Reel } from '../types';
import { reelsApi } from '../api/reels';

export function usePolling(reelId: number | null, intervalMs: number = 3000) {
  const [reel, setReel] = useState<Reel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const activeRef = useRef(true);

  const isTerminal = (status: string) =>
    ['completed', 'failed'].includes(status);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!reelId) return;

    // Clear any existing interval first
    stopPolling();

    const fetchReel = async () => {
      try {
        const { data } = await reelsApi.get(reelId);
        setReel(data);
        if (isTerminal(data.status)) {
          stopPolling();
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch reel');
        stopPolling();
      }
    };

    fetchReel();
    intervalRef.current = setInterval(fetchReel, intervalMs);
  }, [reelId, intervalMs, stopPolling]);

  // Start polling on mount / reelId change
  useEffect(() => {
    activeRef.current = true;
    startPolling();
    return () => {
      activeRef.current = false;
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // Restart polling when reel state changes from terminal to non-terminal
  // (e.g., user clicks "Generate" on a script_ready or failed reel)
  const restartPolling = useCallback(() => {
    startPolling();
  }, [startPolling]);

  return { reel, error, setReel, restartPolling };
}
