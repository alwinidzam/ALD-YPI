import { motion } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { DocumentMetadata } from '../types';
import { viewerStrategyFactory } from '../domains/documents/dependencies';
import { ViewerStrategy, ViewerRenderContext } from '../domains/documents/viewer/ViewerStrategy';

interface PdfViewerProps {
  document: DocumentMetadata;
  onClose: () => void;
  onDownload: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export default function PdfViewer({ document, onClose, onDownload }: PdfViewerProps) {
  const [zoom, setZoom] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [numPages, setNumPages] = useState(1);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const strategyRef = useRef<ViewerStrategy | null>(null);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    window.document.body.style.overflow = 'hidden';
    return () => {
      window.document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    const strategy = viewerStrategyFactory.determineStrategy(document);
    strategyRef.current = strategy;

    const context: ViewerRenderContext = {
      containerElement: containerRef.current,
      document,
      onLoadProgress: (progress) => {
        if (isMounted) setLoadProgress(progress);
      },
      onPageChange: (page) => {
        if (isMounted) setCurrentPage(page);
      },
      onNumPagesLoaded: (total) => {
        if (isMounted) setNumPages(total);
      },
      onError: (error) => {
        if (isMounted) {
          console.error("Viewer error:", error);
          setLoadError(error.message || 'Gagal memuat dokumen.');
        }
      }
    };

    strategy.render(context);

    return () => {
      isMounted = false;
      if (strategyRef.current) {
        strategyRef.current.destroy();
        strategyRef.current = null;
      }
    };
  }, [document]);

  const handleZoomIn = () => {
    const newZoom = Math.min(MAX_ZOOM, zoom + ZOOM_STEP);
    setZoom(newZoom);
    strategyRef.current?.setZoom?.(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(MIN_ZOOM, zoom - ZOOM_STEP);
    setZoom(newZoom);
    strategyRef.current?.setZoom?.(newZoom);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
      strategyRef.current?.goToPage?.(page);
    }
  };

  const isBusy = loadProgress < 100 && !loadError;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed inset-0 z-50 bg-[#1e1e1e]/95 backdrop-blur-md flex flex-col font-sans"
    >
      {/* HEADER */}
      <div className="h-14 flex-none border-b border-white/10 bg-[#282a2d] flex items-center justify-between px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 soft-bg rounded-lg shrink-0">
            <FileText className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-bold text-white truncate pr-4">
              {document.fileName || 'Dokumen Tanpa Nama'}
            </span>
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
              PDF Document
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onDownload}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 hover:soft-bg/20 text-stone-300 hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Unduh
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-1 hidden md:block"></div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500/10 text-stone-300 hover:text-red-400 rounded-lg transition-all cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MAIN RENDER AREA */}
      <div className="flex-1 relative flex overflow-hidden">
        {loadError && (
           <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1e1e1e]/90">
             <div className="p-3 bg-amber-500/10 rounded-full mb-4">
               <AlertTriangle className="w-8 h-8 text-amber-400" />
             </div>
             <p className="text-sm font-bold text-white mb-1">Pratinjau Tidak Tersedia</p>
             <p className="text-[12px] text-stone-400 leading-relaxed">{loadError}</p>
             <button
               onClick={onDownload}
               className="mt-5 flex items-center gap-2 soft-button-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95"
             >
               <Download className="w-4 h-4" /> Unduh Berkas Asli
             </button>
           </div>
        )}
        
        {isBusy && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1e1e1e]/80 backdrop-blur-sm transition-opacity duration-300">
            {/* PDF Skeleton Layout */}
            <div className="w-[90%] max-w-2xl bg-white/5 border border-white/10 h-[70vh] rounded-xl overflow-hidden flex flex-col animate-pulse relative shadow-2xl">
              {/* Header skeleton */}
              <div className="h-12 border-b border-white/5 bg-white/[0.02] flex items-center px-4 gap-4">
                <div className="w-8 h-8 rounded bg-white/10"></div>
                <div className="h-4 w-1/3 rounded bg-white/10"></div>
              </div>
              {/* Body skeleton lines */}
              <div className="p-8 flex flex-col gap-4">
                <div className="h-6 w-3/4 rounded bg-white/10"></div>
                <div className="h-4 w-full rounded bg-white/10"></div>
                <div className="h-4 w-full rounded bg-white/10"></div>
                <div className="h-4 w-5/6 rounded bg-white/10"></div>
                <div className="h-4 w-full rounded bg-white/10"></div>
                <div className="h-32 w-full rounded bg-white/5 mt-4"></div>
              </div>
              
              {/* Overlay Loader */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e1e]/60 backdrop-blur-sm">
                <div className="relative flex items-center justify-center mb-5">
                  <div className="w-14 h-14 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
                  <FileText className="w-5 h-5 text-emerald-500 absolute" />
                </div>
                <p className="text-xs font-bold text-white uppercase tracking-widest animate-pulse mb-3">
                  Memuat Pratinjau Dokumen...
                </p>
                {/* Progress Bar */}
                <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.max(5, loadProgress)}%` }}
                  />
                </div>
                <p className="text-[10px] text-stone-400 font-medium mt-2">{Math.round(loadProgress)}%</p>
              </div>
            </div>
          </div>
        )}
        
        

        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* FLOATING CONTROL PILL */}
      {!loadError && !isBusy && strategyRef.current?.type !== 'NATIVE' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#282a2d] text-white px-4 py-2 rounded-full flex items-center gap-4 border border-white/10 z-50 shadow-2xl backdrop-blur-md">
          {numPages > 1 && (
            <>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className="p-1.5 hover:soft-bg/10 text-white/80 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-all cursor-pointer active:scale-90"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 text-xs select-none">
                  <input
                    type="text"
                    value={pageInput}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) setPageInput(e.target.value);
                    }}
                    onBlur={() => {
                      const n = parseInt(pageInput, 10);
                      if (!isNaN(n)) goToPage(n);
                      else setPageInput(String(currentPage));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const n = parseInt(pageInput, 10);
                        if (!isNaN(n)) goToPage(n);
                        else setPageInput(String(currentPage));
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-10 h-7 soft-bg/10 text-white font-bold text-center rounded border border-white/10 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs transition-all selection:bg-emerald-500 selection:text-white"
                  />
                  <span className="text-white/40 font-semibold">/ {numPages}</span>
                </div>
                <button
                  disabled={currentPage >= numPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className="p-1.5 hover:soft-bg/10 text-white/80 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-all cursor-pointer active:scale-90"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="w-[1px] h-5 soft-bg/15"></div>
            </>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="p-1.5 hover:soft-bg/10 text-white/80 hover:text-white rounded-full transition-all cursor-pointer active:scale-90 disabled:opacity-30"
              title="Perkecil Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold select-none min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="p-1.5 hover:soft-bg/10 text-white/80 hover:text-white rounded-full transition-all cursor-pointer active:scale-90 disabled:opacity-30"
              title="Perbesar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <div className="w-[1px] h-5 soft-bg/15"></div>
          <div className="text-xs font-medium px-1 text-stone-300 select-none flex items-center gap-1.5 py-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Aman
          </div>
        </div>
      )}
    </motion.div>
  );
}
