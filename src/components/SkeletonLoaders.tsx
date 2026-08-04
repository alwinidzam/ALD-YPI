import React from 'react';

export function InstitutionSkeleton() {
  return (
    <div className="relative overflow-hidden soft-gradient-dark/5 text-white rounded-xl p-5 sm:p-6 border border-[#015e2a]/10 animate-pulse flex flex-col justify-between min-h-[160px]">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shrink-0 soft-gradient-dark/15"></div>
        <div className="flex-1 space-y-2 w-full text-center sm:text-left flex flex-col items-center sm:items-start">
          <div className="h-5 sm:h-7 soft-gradient-dark/15 rounded-md w-32"></div>
          <div className="h-7 sm:h-9 soft-gradient-dark/20 rounded-md w-48 mt-1"></div>
          <div className="h-3 sm:h-4 soft-gradient-dark/10 rounded-md w-64 mt-2"></div>
        </div>
      </div>
      <div className="border-t border-[#015e2a]/10 my-4 w-full"></div>
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
        <div className="h-7 w-28 soft-gradient-dark/15 rounded-xl"></div>
        <div className="h-7 w-40 soft-gradient-dark/15 rounded-xl"></div>
      </div>
    </div>
  );
}

export function ProgramEventSkeleton() {
  return (
    <div className="relative overflow-hidden soft-gradient-dark/5 rounded-xl p-3 sm:p-4 pb-2.5 sm:pb-3.5 border border-[#015e2a]/10 animate-pulse w-full">
      <div className="w-full soft-bg/60 border border-white/40 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 soft-gradient-dark/15 rounded-lg"></div>
          <div className="w-16 h-6 soft-gradient-dark/15 rounded-lg"></div>
        </div>
        <div className="space-y-2 mt-2">
          <div className="h-5 sm:h-6 soft-gradient-dark/25 rounded-md w-3/4"></div>
          <div className="h-3 sm:h-4 soft-gradient-dark/15 rounded-md w-full"></div>
          <div className="h-3 sm:h-4 soft-gradient-dark/15 rounded-md w-5/6"></div>
        </div>
        <div className="border-t border-[#015e2a]/10 my-1"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-3 soft-gradient-dark/15 rounded-md w-24"></div>
            <div className="h-3 soft-gradient-dark/15 rounded-md w-32"></div>
          </div>
          <div className="h-6 w-28 soft-gradient-dark/15 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
