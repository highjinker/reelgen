import { useState, useEffect, useCallback } from 'react';
import type { Reel } from '../types';
import { reelsApi } from '../api/reels';

export function useReels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchReels = useCallback(async (p: number = page) => {
    setLoading(true);
    try {
      const { data } = await reelsApi.list(p);
      setReels(data.reels);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  return { reels, total, page, loading, setPage, refetch: fetchReels };
}
