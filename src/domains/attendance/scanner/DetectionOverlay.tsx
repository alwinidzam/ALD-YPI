import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, SunMedium, Eye, Check } from 'lucide-react';

export interface BoundingBox {
  x: number;       // percentage 0-100
  y: number;       // percentage 0-100
  width: number;   // percentage 0-100
  height: number;  // percentage 0-100
  cornerPoints?: { x: number; y: number }[];
}

export interface DetectionOverlayProps {
  boundingBox?: BoundingBox | null;
  detectedFormat?: string | null;
  confidence?: number;
  rawToken?: string | null;
  isScanning: boolean;
  lowLightWarning?: boolean;
  tapFocusPoint?: { x: number; y: number } | null;
  onTapToFocus?: (xPercentage: number, yPercentage: number) => void;
  onPinchZoom?: (zoomDelta: number) => void;
  scanSuccessFlash?: boolean;
}

export const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  boundingBox,
  detectedFormat,
  confidence,
  rawToken,
  isScanning,
  lowLightWarning,
  tapFocusPoint,
  onTapToFocus,
  onPinchZoom,
  scanSuccessFlash
}) => {
  // Touch gesture handling for tap-to-focus & pinch-to-zoom
  const touchStartDistRef = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null && onPinchZoom) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = (dist - touchStartDistRef.current) * 0.01;
      onPinchZoom(delta);
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onTapToFocus) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onTapToFocus(x, y);
  };

  return (
    <div
      className="absolute inset-0 pointer-events-auto select-none overflow-hidden touch-none"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Visual Scan Reticle (Guide only - Full frame detection active) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.02]">
          {/* Subtle Corner Brackets */}
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-emerald-400/60 rounded-tl-xl" />
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-emerald-400/60 rounded-tr-xl" />
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-emerald-400/60 rounded-bl-xl" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-emerald-400/60 rounded-br-xl" />

          {/* Continuous Laser Line */}
          {isScanning && (
            <motion.div
              animate={{ y: [0, 250, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.9)]"
            />
          )}

          {/* Mode Pill */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full border border-emerald-500/30 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-emerald-300 uppercase">
              SCAN FULL FRAME V2
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Animated Green Bounding Box around Detected Code */}
      <AnimatePresence>
        {boundingBox && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              left: `${boundingBox.x}%`,
              top: `${boundingBox.y}%`,
              width: `${boundingBox.width}%`,
              height: `${boundingBox.height}%`
            }}
            className="absolute border-2 border-emerald-400 rounded-2xl bg-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.8)] pointer-events-none z-20 flex flex-col justify-between p-1.5"
          >
            {/* Corner Markers */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-300 rounded-tl" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-300 rounded-tr" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-300 rounded-bl" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-300 rounded-br" />

            {/* Badge Label Header */}
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 rounded-md font-black text-[10px] uppercase tracking-wider shadow-md flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" />
                {detectedFormat || 'QR CODE'}
              </span>
              {confidence !== undefined && (
                <span className="px-1.5 py-0.5 bg-slate-900/90 text-emerald-300 rounded text-[9px] font-mono font-bold border border-emerald-500/30">
                  {confidence}%
                </span>
              )}
            </div>

            {/* Decoded raw token preview at bottom of bounding box */}
            {rawToken && (
              <div className="mt-auto px-2 py-0.5 bg-slate-900/95 text-white rounded text-[10px] font-mono truncate border border-emerald-500/40 shadow-md">
                {rawToken}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap-To-Focus Target Indicator Ring */}
      <AnimatePresence>
        {tapFocusPoint && (
          <motion.div
            initial={{ scale: 1.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              left: `${tapFocusPoint.x * 100}%`,
              top: `${tapFocusPoint.y * 100}%`
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-amber-400 rounded-full pointer-events-none z-30 shadow-[0_0_15px_rgba(251,191,36,0.9)] flex items-center justify-center"
          >
            <div className="w-2 h-2 rounded-full bg-amber-400" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Low-Light Warning Banner */}
      <AnimatePresence>
        {lowLightWarning && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500/90 text-slate-950 font-bold text-xs rounded-xl shadow-xl backdrop-blur-md border border-amber-300 flex items-center gap-2 pointer-events-none z-30"
          >
            <SunMedium className="w-4 h-4 animate-spin" />
            <span>Pencahayaan Rendah — Aktifkan Senter</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instant Success Scan Flash Pulse */}
      {scanSuccessFlash && (
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-emerald-500/30 border-8 border-emerald-400 pointer-events-none z-40"
        />
      )}
    </div>
  );
};
