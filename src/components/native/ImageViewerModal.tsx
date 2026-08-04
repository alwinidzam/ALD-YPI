import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { hapticService } from '../../services/HapticService';

interface ImageViewerModalProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ src, alt = 'Preview', onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number; dist: number } | null>(null);

  const handleDoubleTap = () => {
    hapticService.trigger('click');
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  const handleZoomIn = () => {
    hapticService.trigger('click');
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    hapticService.trigger('click');
    setScale(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    hapticService.trigger('click');
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 overflow-hidden">
      {/* Top bar */}
      <div className="w-full flex items-center justify-between z-20 pt-safe">
        <span className="text-xs font-bold text-slate-300 truncate max-w-[200px]">{alt}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center border border-slate-700"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center border border-slate-700"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleReset}
            className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center border border-slate-700"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport with double-tap gesture */}
      <div
        className="flex-1 w-full flex items-center justify-center relative overflow-hidden cursor-grab active:cursor-grabbing"
        onDoubleClick={handleDoubleTap}
      >
        <img
          src={src}
          alt={alt}
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transition: scale === 1 ? 'transform 0.2s ease-out' : 'none',
          }}
          className="max-w-full max-h-full object-contain select-none pointer-events-auto"
        />
      </div>

      <div className="pb-safe text-[11px] text-slate-400 font-semibold tracking-wide">
        Double tap / pinch untuk zoom
      </div>
    </div>
  );
};
