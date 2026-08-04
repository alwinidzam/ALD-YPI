/**
 * Document Scanner Modal Component
 * Camera-based scanner for physical documents with multi-page capture,
 * auto image processing/filters (B&W High Contrast, Grayscale, Magic Color),
 * rotation, PDF conversion via jsPDF, and direct upload with background sync support.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from '../lib/toastManager';
import {
  Camera,
  RotateCw,
  Trash2,
  Plus,
  Check,
  X,
  FileText,
  Sliders,
  Sparkles,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building,
  Calendar,
  Lock,
  Layers,
  RefreshCw,
  AlertCircle,
  Eye
} from 'lucide-react';
import { User, CategoryType, InstitutionType, DocumentMetadata } from '../types';
import { generateFileName } from '../data';
import { enqueueDocumentUpload } from '../lib/uploadSyncQueue';

export interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess?: (docTitle: string) => void;
  onLogAction: (action: string, details: string) => void;
}

export type PageFilterMode = 'bw' | 'magic' | 'grayscale' | 'original';

export interface ScannedPage {
  id: string;
  rawImageDataUrl: string;
  processedDataUrl: string;
  rotation: number; // 0, 90, 180, 270
  filter: PageFilterMode;
}

export function DocumentScannerModal({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  onLogAction
}: DocumentScannerModalProps) {
  // Camera state
  const [cameraStatus, setCameraStatus] = useState<'starting' | 'ready' | 'denied' | 'unavailable'>('starting');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Pages state
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [step, setStep] = useState<'SCAN' | 'EDIT' | 'METADATA'>('SCAN');

  // Flash effect state
  const [isFlashing, setIsFlashing] = useState(false);

  // Document metadata state
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<CategoryType>('SK_SURAT_KEPUTUSAN');
  const [docInstitution, setDocInstitution] = useState<InstitutionType>('YPI');
  const [docDate, setDocDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [docConfidential, setDocConfidential] = useState<boolean>(false);
  const [docDescription, setDocDescription] = useState<string>('');

  // PDF Generation & Upload state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setCameraStatus('starting');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('unavailable');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus('ready');
    } catch (err) {
      console.warn('Gagal membuka kamera pemindai:', err);
      setCameraStatus('denied');
    }
  }, [facingMode]);

  useEffect(() => {
    if (isOpen && step === 'SCAN') {
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, step, startCamera]);

  // Apply filter and rotation to a canvas
  const processImageCanvas = (
    rawImgSrc: string,
    filter: PageFilterMode,
    rotation: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(rawImgSrc);

        // Account for rotation swaps
        const isLandscape = rotation === 90 || rotation === 270;
        canvas.width = isLandscape ? img.height : img.width;
        canvas.height = isLandscape ? img.width : img.height;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        // Pixel processing for filters
        if (filter !== 'original') {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Luminance
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            if (filter === 'grayscale') {
              data[i] = gray;
              data[i + 1] = gray;
              data[i + 2] = gray;
            } else if (filter === 'bw') {
              // High contrast document thresholding (turn light gray paper to white, text to black)
              const threshold = 140;
              const val = gray > threshold ? 255 : 0;
              data[i] = val;
              data[i + 1] = val;
              data[i + 2] = val;
            } else if (filter === 'magic') {
              // Enhanced contrast + brightness boost
              const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.35 + 140));
              data[i] = Math.min(255, r * (enhanced / (gray || 1)));
              data[i + 1] = Math.min(255, g * (enhanced / (gray || 1)));
              data[i + 2] = Math.min(255, b * (enhanced / (gray || 1)));
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = rawImgSrc;
    });
  };

  // Capture frame from live camera
  const capturePhoto = async () => {
    if (!videoRef.current || cameraStatus !== 'ready') return;

    // Flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // Default filter for document: B&W High Contrast for crisp text
      const processed = await processImageCanvas(rawDataUrl, 'bw', 0);

      const newPage: ScannedPage = {
        id: 'page_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        rawImageDataUrl: rawDataUrl,
        processedDataUrl: processed,
        rotation: 0,
        filter: 'bw'
      };

      setPages((prev) => {
        const updated = [...prev, newPage];
        setActivePageIndex(updated.length - 1);
        return updated;
      });
    }
  };

  // Update filter or rotation for active page
  const updateActivePageFilter = async (filter: PageFilterMode) => {
    if (pages.length === 0) return;
    const active = pages[activePageIndex];
    const newProcessed = await processImageCanvas(active.rawImageDataUrl, filter, active.rotation);

    setPages((prev) =>
      prev.map((p, idx) =>
        idx === activePageIndex ? { ...p, filter, processedDataUrl: newProcessed } : p
      )
    );
  };

  const rotateActivePage = async () => {
    if (pages.length === 0) return;
    const active = pages[activePageIndex];
    const nextRot = (active.rotation + 90) % 360;
    const newProcessed = await processImageCanvas(active.rawImageDataUrl, active.filter, nextRot);

    setPages((prev) =>
      prev.map((p, idx) =>
        idx === activePageIndex ? { ...p, rotation: nextRot, processedDataUrl: newProcessed } : p
      )
    );
  };

  const deletePage = (index: number) => {
    setPages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (activePageIndex >= updated.length) {
        setActivePageIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  // Build PDF file using jsPDF
  const buildPdfDataUrl = async (): Promise<string> => {
    const pdf = new (await import('jspdf')).default({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // ~210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // ~297 mm

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();

      const page = pages[i];

      // Load image dimensions
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const imgRatio = img.width / img.height;
          const pageRatio = pdfWidth / pdfHeight;

          let renderW = pdfWidth;
          let renderH = pdfHeight;
          let x = 0;
          let y = 0;

          if (imgRatio > pageRatio) {
            renderH = pdfWidth / imgRatio;
            y = (pdfHeight - renderH) / 2;
          } else {
            renderW = pdfHeight * imgRatio;
            x = (pdfWidth - renderW) / 2;
          }

          pdf.addImage(page.processedDataUrl, 'JPEG', x, y, renderW, renderH);
          resolve();
        };
        img.src = page.processedDataUrl;
      });
    }

    return pdf.output('datauristring');
  };

  // Download PDF locally
  const handleDownloadPdf = async () => {
    if (pages.length === 0) return;
    setIsGeneratingPdf(true);
    try {
      const pdfDataUrl = await buildPdfDataUrl();
      const link = document.createElement('a');
      link.href = pdfDataUrl;
      link.download = `Scan_YPI_${docTitle || 'Dokumen'}_${Date.now()}.pdf`;
      link.click();
      onLogAction('DOCUMENT_EXPORT', `Mengunduh hasil pemindaian PDF: ${docTitle || 'Dokumen Pindaian'}`);
    } catch (err) {
      console.error('Gagal membuat PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Final submit & upload to database / background sync queue
  const handleSubmitAndUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pages.length === 0 || !docTitle.trim()) return;

    setIsGeneratingPdf(true);
    setUploadProgress('Menyusun berkas PDF...');

    try {
      const pdfDataUrl = await buildPdfDataUrl();

      setUploadProgress('Menyimpan ke Arsip YPI...');

      const docDateObj = new Date(docDate);
      const monthNames = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
      const monthStr = monthNames[docDateObj.getMonth()] || 'JANUARI';
      const yearStr = String(docDateObj.getFullYear());
      const fileName = generateFileName(docCategory, docInstitution, monthStr, yearStr);

      const newDocMeta: DocumentMetadata = {
        id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        fileName: docTitle.trim() ? `${docTitle.trim()} - ${fileName}` : fileName,
        category: docCategory,
        institution: docInstitution,
        year: yearStr,
        month: monthStr,
        description: docDescription.trim() || `Dokumen hasil pindaian kamera (${pages.length} halaman).`,
        fileSize: `${(pdfDataUrl.length * 0.75 / 1024 / 1024).toFixed(2)} MB`,
        uploadDate: new Date().toISOString(),
        uploader: currentUser.name,
        downloadCount: 0,
        visibility: docConfidential ? 'PRIVATE' : 'PUBLIC',
        sourceType: 'FILE'
      };

      // Enqueue upload (handles background sync if offline)
      enqueueDocumentUpload(newDocMeta, pdfDataUrl, currentUser);

      onLogAction('DOCUMENT_SCAN', `Memindai ${pages.length} halaman dokumen: "${docTitle}"`);
      if (onSuccess) onSuccess(docTitle);

      // Reset & close
      setPages([]);
      setStep('SCAN');
    } catch (err: any) {
      console.error('Gagal memproses pindaian:', err);
      toast.error(err.message || 'Terjadi kesalahan saat memproses PDF. Silakan coba lagi.');
    } finally {
      setIsGeneratingPdf(false);
      setUploadProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#091f13] border border-emerald-500/30 rounded-xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#013317] to-[#012410] border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#ffb300]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Pemindai Dokumen Kamera
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full lowercase">
                  auto-pdf
                </span>
              </h3>
              <p className="text-[11px] text-emerald-200/70 font-medium">
                Pindai berkas fisik, filter kontras teks, dan ubah langsung ke PDF resmi.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-emerald-300 hover:text-white soft-bg/5 hover:soft-bg/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div className="px-5 py-2.5 bg-[#03170d] border-b border-emerald-500/15 flex items-center justify-between text-xs font-bold text-emerald-300/80">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setStep('SCAN')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                step === 'SCAN' ? 'bg-emerald-600 text-white font-semibold' : 'hover:text-white'
              }`}
            >
              <span className="w-4 h-4 rounded-full soft-bg/20 text-[10px] flex items-center justify-center">1</span>
              Kamera Pindai ({pages.length})
            </button>
            <button
              disabled={pages.length === 0}
              onClick={() => setStep('EDIT')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                step === 'EDIT' ? 'bg-emerald-600 text-white font-semibold' : 'hover:text-white disabled:opacity-40'
              }`}
            >
              <span className="w-4 h-4 rounded-full soft-bg/20 text-[10px] flex items-center justify-center">2</span>
              Filter & Edit
            </button>
            <button
              disabled={pages.length === 0}
              onClick={() => setStep('METADATA')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                step === 'METADATA' ? 'bg-emerald-600 text-white font-semibold' : 'hover:text-white disabled:opacity-40'
              }`}
            >
              <span className="w-4 h-4 rounded-full soft-bg/20 text-[10px] flex items-center justify-center">3</span>
              Metadata & Simpan
            </button>
          </div>

          {pages.length > 0 && (
            <span className="hidden sm:inline-block text-[11px] text-[#ffb300] font-semibold">
              Total {pages.length} Halaman Siap
            </span>
          )}
        </div>

        {/* STEP 1: CAMERA SCANNER */}
        {step === 'SCAN' && (
          <div className="p-4 sm:p-6 flex flex-col items-center gap-4 overflow-y-auto">
            <div className="relative w-full max-w-xl aspect-[4/3] bg-black rounded-xl overflow-hidden border-2 border-emerald-500/30 flex items-center justify-center">
              {/* Flash effect */}
              {isFlashing && <div className="absolute inset-0 soft-bg z-30 animate-ping" />}

              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />

              {/* Document framing overlay guides */}
              <div className="absolute inset-6 border-2 border-dashed border-[#ffb300]/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between text-[10px] text-[#ffb300] font-semibold uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-md self-center backdrop-blur-sm">
                  Posisikan Dokumen Dalam Bingkai
                </div>
                <div className="w-full text-center text-[10px] text-white/80 font-medium bg-black/40 py-1 rounded-md backdrop-blur-sm">
                  Pencahayaan terang akan menghasilkan dokumen lebih jelas
                </div>
              </div>

              {/* Switch camera button */}
              <button
                onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                className="absolute top-3 right-3 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-xl border border-white/20 backdrop-blur-md transition-all cursor-pointer z-20"
                title="Ganti Kamera Front/Back"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {cameraStatus === 'starting' && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4">
                  <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-[#ffb300] rounded-full animate-spin mb-3" />
                  <p className="text-xs font-bold">Membuka Kamera Pemindai...</p>
                </div>
              )}

              {cameraStatus === 'denied' && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6 text-white space-y-3">
                  <AlertCircle className="w-10 h-10 text-red-400 animate-bounce" />
                  <h4 className="text-sm font-bold">Akses Kamera Dibatasi Browser</h4>
                  <p className="text-xs text-white/70 max-w-sm">
                    Mohon izinkan akses kamera di setelan browser Anda untuk memindai berkas fisik.
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 soft-button-primary text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Coba Akses Lagi
                  </button>
                </div>
              )}
            </div>

            {/* Shutter Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={capturePhoto}
                disabled={cameraStatus !== 'ready'}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ffb300] to-amber-300 text-emerald-950 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Ambil Foto Dokumen"
              >
                <div className="w-13 h-13 rounded-full border-2 border-emerald-950 flex items-center justify-center soft-bg">
                  <Camera className="w-6 h-6 text-emerald-900" />
                </div>
              </button>
            </div>

            {/* Scanned Pages Strip */}
            {pages.length > 0 && (
              <div className="w-full bg-[#03170d] p-3 rounded-xl border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Halaman Terpindai ({pages.length})</span>
                  <button
                    onClick={() => setStep('EDIT')}
                    className="text-[#ffb300] hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    Lanjut Edit Filter & Order <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {pages.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setActivePageIndex(idx);
                        setStep('EDIT');
                      }}
                      className={`relative shrink-0 w-20 h-28 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        activePageIndex === idx ? 'border-[#ffb300] scale-105' : 'border-emerald-500/30 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={p.processedDataUrl} alt={`Halaman ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        Hal {idx + 1}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePage(idx);
                        }}
                        className="absolute bottom-1 right-1 p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all cursor-pointer"
                        title="Hapus Halaman"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => setStep('SCAN')}
                    className="shrink-0 w-20 h-28 rounded-xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-900/20 flex flex-col items-center justify-center text-emerald-300 gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Tambah</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: EDIT FILTERS & ROTATION */}
        {step === 'EDIT' && pages.length > 0 && (
          <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-6 overflow-y-auto max-h-[75vh]">
            {/* Active page preview */}
            <div className="flex-1 flex flex-col items-center justify-center bg-black/60 p-4 rounded-xl border border-emerald-500/20 relative min-h-[360px]">
              <img
                src={pages[activePageIndex]?.processedDataUrl}
                alt={`Halaman ${activePageIndex + 1}`}
                className="max-h-[460px] object-contain rounded-xl border border-white/10"
              />

              <div className="absolute top-3 left-3 bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10">
                Halaman {activePageIndex + 1} dari {pages.length}
              </div>

              {/* Rotation controller */}
              <button
                onClick={rotateActivePage}
                className="absolute bottom-3 right-3 px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl border border-white/15 flex items-center gap-2 transition-all cursor-pointer"
              >
                <RotateCw className="w-4 h-4" /> Putar 90°
              </button>
            </div>

            {/* Filter controls panel */}
            <div className="w-full md:w-80 space-y-4">
              <div className="bg-[#03170d] p-4 rounded-xl border border-emerald-500/20 space-y-3">
                <h4 className="text-xs font-bold uppercase text-[#ffb300] tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" /> Mode Filter Dokumen
                </h4>
                <p className="text-[11px] text-emerald-200/70 leading-relaxed">
                  Pilih pemrosesan gambar untuk memastikan teks surat/dokumen terbaca jernih.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => updateActivePageFilter('bw')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      pages[activePageIndex]?.filter === 'bw'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'soft-bg/5 hover:soft-bg/10 text-emerald-200 border-emerald-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#ffb300]" /> Dokumen B&W
                    </div>
                    <span className="text-[10px] opacity-80 block leading-tight">
                      Teks hitam tajam, latar putih bersih
                    </span>
                  </button>

                  <button
                    onClick={() => updateActivePageFilter('magic')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      pages[activePageIndex]?.filter === 'magic'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'soft-bg/5 hover:soft-bg/10 text-emerald-200 border-emerald-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Color Boost
                    </div>
                    <span className="text-[10px] opacity-80 block leading-tight">
                      Warna stempel & tanda tangan lebih cerah
                    </span>
                  </button>

                  <button
                    onClick={() => updateActivePageFilter('grayscale')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      pages[activePageIndex]?.filter === 'grayscale'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'soft-bg/5 hover:soft-bg/10 text-emerald-200 border-emerald-500/20'
                    }`}
                  >
                    <div className="font-bold text-xs mb-1">Grayscale</div>
                    <span className="text-[10px] opacity-80 block leading-tight">
                      Abu-abu netral hemat tinta
                    </span>
                  </button>

                  <button
                    onClick={() => updateActivePageFilter('original')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      pages[activePageIndex]?.filter === 'original'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'soft-bg/5 hover:soft-bg/10 text-emerald-200 border-emerald-500/20'
                    }`}
                  >
                    <div className="font-bold text-xs mb-1">Warna Asli</div>
                    <span className="text-[10px] opacity-80 block leading-tight">
                      Tanpa modifikasi filter
                    </span>
                  </button>
                </div>
              </div>

              {/* Navigation between pages */}
              <div className="flex items-center justify-between gap-2">
                <button
                  disabled={activePageIndex === 0}
                  onClick={() => setActivePageIndex((prev) => Math.max(0, prev - 1))}
                  className="flex-1 py-2 soft-bg/5 hover:soft-bg/10 text-white font-bold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-1 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Hal Sebelumnya
                </button>

                <button
                  disabled={activePageIndex === pages.length - 1}
                  onClick={() => setActivePageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
                  className="flex-1 py-2 soft-bg/5 hover:soft-bg/10 text-white font-bold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-1 disabled:opacity-30 cursor-pointer"
                >
                  Hal Berikutnya <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setStep('SCAN')}
                  className="flex-1 py-2.5 soft-bg/10 hover:soft-bg/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Tambah Halaman
                </button>

                <button
                  onClick={() => setStep('METADATA')}
                  className="soft-button-primary flex-1"
                >
                  Lanjut ke Simpan <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: METADATA & SAVE */}
        {step === 'METADATA' && (
          <form onSubmit={handleSubmitAndUpload} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
            <div className="bg-[#03170d] p-4 rounded-xl border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#ffb300]">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Ringkasan Dokumen Pindaian</h4>
                  <p className="text-xs text-emerald-200/70">
                    Siap dikompilasi menjadi <b>1 berkas PDF ({pages.length} halaman)</b>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-[#ffb300] border border-amber-500/40 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Unduh PDF Saja
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Document Title */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                  Judul Dokumen / Arsip <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SK Pengangkatan Guru YPI 2026"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 soft-bg/10 border border-emerald-500/30 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#ffb300]"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-200">Kategori Arsip</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as CategoryType)}
                  className="w-full px-3.5 py-2.5 bg-[#03170d] border border-emerald-500/30 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#ffb300]"
                >
                  <option value="SK_SURAT_KEPUTUSAN">SK & Surat Keputusan</option>
                  <option value="SURAT_MASUK">Surat Masuk</option>
                  <option value="SURAT_KELUAR">Surat Keluar</option>
                  <option value="LAPORAN_KEUANGAN">Laporan Keuangan</option>
                  <option value="SERTIFIKAT_IJAZAH">Sertifikat & Ijazah</option>
                  <option value="DOKUMENTASI_KEGIATAN">Dokumentasi Kegiatan</option>
                  <option value="UMUM">Umum</option>
                </select>
              </div>

              {/* Institution */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-200">Lembaga / Unit YPI</label>
                <select
                  value={docInstitution}
                  onChange={(e) => setDocInstitution(e.target.value as InstitutionType)}
                  className="w-full px-3.5 py-2.5 bg-[#03170d] border border-emerald-500/30 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#ffb300]"
                >
                  <option value="YPI">Yayasan Pendidikan Islam (YPI)</option>
                  <option value="RA">RA Raudhotut Tholibin</option>
                  <option value="MI">MI Raudhotut Tholibin</option>
                  <option value="MTS">MTs Raudhotut Tholibin</option>
                  <option value="MA">MA Raudhotut Tholibin</option>
                  <option value="SMK">SMK Raudhotut Tholibin</option>
                  <option value="PONPES">Pondok Pesantren</option>
                </select>
              </div>

              {/* Document Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-200">Tanggal Dokumen</label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 soft-bg/10 border border-emerald-500/30 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#ffb300]"
                />
              </div>

              {/* Confidential Toggle */}
              <div className="flex items-center justify-between p-3 soft-bg/5 rounded-xl border border-emerald-500/20">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" /> Berkas Rahasia
                  </span>
                  <span className="text-[10px] text-emerald-200/70 block">
                    Hanya dapat diakses Pengurus YPI & Super Admin
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={docConfidential}
                  onChange={(e) => setDocConfidential(e.target.checked)}
                  className="w-4 h-4 accent-[#ffb300] cursor-pointer"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-emerald-200">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat ringkasan isi surat..."
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 soft-bg/10 border border-emerald-500/30 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#ffb300]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-emerald-500/20">
              <button
                type="button"
                onClick={() => setStep('EDIT')}
                className="px-4 py-2.5 soft-bg/10 hover:soft-bg/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Kembali Edit
              </button>

              <button
                type="submit"
                disabled={isGeneratingPdf || !docTitle.trim()}
                className="soft-button-primary px-6"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{uploadProgress || 'Memproses PDF...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Simpan & Unggah Ke Arsip YPI
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
