import React from 'react';
import { motion } from 'motion/react';
import { ScannerMetricsData } from '../ScannerMetrics';
import { Gauge, Cpu, Zap, Maximize2, ShieldAlert, Activity, Eye } from 'lucide-react';

export interface DebugPanelProps {
  metrics: ScannerMetricsData;
  onClose?: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ metrics, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="bg-slate-950/95 border border-emerald-500/40 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-xl font-mono text-xs max-w-sm w-full z-40"
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-bold tracking-widest text-emerald-400 uppercase text-[11px]">
            SCANNER ENGINE V2 DEBUG
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* FPS */}
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5 mb-1">
            <Gauge className="w-3 h-3 text-cyan-400" />
            <span>Frame Rate</span>
          </div>
          <div className="text-base font-bold text-cyan-300">
            {metrics.fps} <span className="text-[10px] font-normal text-slate-400">FPS</span>
          </div>
        </div>

        {/* Latency */}
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5 mb-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Latency</span>
          </div>
          <div className={`text-base font-bold ${metrics.decodeLatencyMs < 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {metrics.decodeLatencyMs} <span className="text-[10px] font-normal text-slate-400">ms</span>
          </div>
        </div>

        {/* Confidence */}
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5 mb-1">
            <Eye className="w-3 h-3 text-indigo-400" />
            <span>Confidence</span>
          </div>
          <div className="text-base font-bold text-indigo-300">
            {metrics.confidence}%
          </div>
        </div>

        {/* Engine */}
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5 mb-1">
            <Cpu className="w-3 h-3 text-purple-400" />
            <span>Decoder</span>
          </div>
          <div className="text-xs font-bold text-purple-300 truncate">
            {metrics.engine}
          </div>
        </div>

        {/* Resolution */}
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5 mb-1">
            <Maximize2 className="w-3 h-3 text-slate-400" />
            <span>Resolution</span>
          </div>
          <div className="text-xs font-bold text-slate-200">
            {metrics.resolution.width}×{metrics.resolution.height}
          </div>
        </div>

        {/* Format */}
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Format</span>
          </div>
          <div className="text-xs font-bold text-amber-300 truncate">
            {metrics.detectedFormat || 'Searching...'}
          </div>
        </div>
      </div>

      {/* Hardware Status Row */}
      <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-sans">
        <span>Focus: <strong className="text-slate-200 font-mono">{metrics.focusMode}</strong></span>
        <span>Zoom: <strong className="text-slate-200 font-mono">{metrics.zoomLevel.toFixed(1)}x</strong></span>
        <span>Torch: <strong className={metrics.torchState ? "text-amber-400 font-mono" : "text-slate-500 font-mono"}>{metrics.torchState ? "ON" : "OFF"}</strong></span>
      </div>

      {metrics.lowLightWarning && (
        <div className="mt-2 p-1.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 text-[10px] flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Low light level detected</span>
        </div>
      )}
    </motion.div>
  );
};
