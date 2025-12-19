import { useState, useRef, useCallback, TouchEvent } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export const usePullToRefresh = ({ onRefresh, threshold = 80 }: UsePullToRefreshOptions) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>, currentScrollTop: number) => {
    startY.current = e.touches[0].clientY;
    scrollTop.current = currentScrollTop;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (scrollTop.current > 0 || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      setIsPulling(true);
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
    }
  }, [isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1),
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
