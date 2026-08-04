import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { hapticService } from '../../services/HapticService';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  className = '',
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const PULL_THRESHOLD = 70;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      // Resistance curve calculation
      const resistance = Math.min(diff * 0.45, 120);
      setPullDistance(resistance);

      if (resistance >= PULL_THRESHOLD && pullDistance < PULL_THRESHOLD) {
        hapticService.trigger('click');
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current || isRefreshing) return;
    isPullingRef.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      hapticService.trigger('softConfirmation');

      try {
        await onRefresh();
        setLastUpdated(
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      } catch (e) {
        console.error('Pull to refresh failed', e);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative overflow-y-auto ${className}`}
    >
      {/* Pull Indicator */}
      <div
        className="w-full flex flex-col items-center justify-center transition-all duration-200 pointer-events-none overflow-hidden"
        style={{
          height: `${isRefreshing ? PULL_THRESHOLD : pullDistance}px`,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold text-xs py-2">
          <RefreshCw
            className={`w-4 h-4 text-emerald-600 transition-transform ${
              isRefreshing
                ? 'animate-spin'
                : pullDistance >= PULL_THRESHOLD
                ? 'rotate-180'
                : ''
            }`}
          />
          <span>
            {isRefreshing
              ? 'Memperbarui data...'
              : pullDistance >= PULL_THRESHOLD
              ? 'Lepaskan untuk memperbarui'
              : 'Tarik ke bawah untuk memperbarui'}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">
          Terakhir diperbarui: {lastUpdated}
        </span>
      </div>

      {children}
    </div>
  );
};
