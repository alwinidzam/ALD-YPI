import React from 'react';

interface SkeletonProps {
  type?: 'dashboard' | 'attendance' | 'directory' | 'reporting' | 'pdf' | 'card' | 'list';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ type = 'card', count = 3 }) => {
  if (type === 'dashboard') {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-7 bg-slate-300 rounded w-3/4" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 bg-slate-200 rounded w-1/3" />
            <div className="h-8 bg-slate-200 rounded-lg w-24" />
          </div>
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (type === 'attendance') {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-12 bg-slate-200 rounded-xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl md:col-span-2" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-100 border border-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'directory') {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'pdf') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-900 animate-pulse space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center" />
        <div className="h-4 bg-slate-700 rounded w-48" />
        <div className="w-full max-w-xl h-[500px] bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-2/3" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
};
