/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  FileText,
  Printer,
  CheckCircle2,
  ArrowLeft,
  Sidebar
} from 'lucide-react';
import { DocumentMetadata } from '../types';
import { dbGetDocumentData } from '../firebase';

interface PdfViewerProps {
  document: DocumentMetadata;
  onClose: () => void;
  onDownload: () => void;
}

export default function PdfViewer({ document, onClose, onDownload }: PdfViewerProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [page, setPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [resolvedFileData, setResolvedFileData] = useState<string | null>(null);
  const [loadingChunks, setLoadingChunks] = useState<boolean>(false);

  const totalPages = 3;

  useEffect(() => {
    setPageInput(page.toString());
  }, [page]);

  useEffect(() => {
    // Lock body scroll when previewer is open
    window.document.body.style.overflow = 'hidden';
    return () => {
      window.document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (document.fileData === 'CHUNKS_EXIST') {
      setLoadingChunks(true);
      dbGetDocumentData(document.id)
        .then((data) => {
          setResolvedFileData(data);
          setLoadingChunks(false);
        })
        .catch((err) => {
          console.error('Failed to load document chunks:', err);
          setLoadingChunks(false);
        });
    } else {
      setResolvedFileData(document.fileData || null);
    }
  }, [document]);

  // Zoom helpers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  const handlePrint = () => {
    // If we have an iframe, we can try to print it, else print the window
    if (resolvedFileData) {
      const iframe = window.document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.print();
          return;
        } catch (e) {
          console.warn('Cannot print iframe cross-origin, printing main window', e);
        }
      }
    }
    window.print();
  };

  return (
    <div
      id="pdf_viewer_modal"
      className="fixed inset-0 bg-[#0c0c0d]/95 backdrop-blur-md z-50 flex flex-col justify-between select-none animate-fade-in text-white font-sans"
    >
      {/* GOOGLE DRIVE-STYLE HEADER BAR */}
      <div className="h-16 bg-[#131314] px-4 md:px-6 flex items-center justify-between border-b border-white/5 shrink-0 z-10 shadow-lg">
        {/* Left Side: Back Arrow, File Icon, & Title */}
        <div className="flex items-center gap-3 truncate max-w-[60%]">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 text-white/80 hover:text-white rounded-full transition-all cursor-pointer mr-1 active:scale-95"
            title="Tutup Preview"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {!resolvedFileData && (
            <button
              onClick={() => setShowThumbnails(prev => !prev)}
              className={`p-2 rounded-full transition-all cursor-pointer mr-1 active:scale-95 ${
                showThumbnails 
                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
              title="Tampilkan/Sembunyikan Panel Samping"
            >
              <Sidebar className="w-5 h-5" />
            </button>
          )}
          
          <div className="p-2 bg-red-600 text-white rounded-lg shrink-0 shadow-sm">
            <FileText className="w-4 h-4" />
          </div>
          
          <div className="truncate text-left">
            <h3 className="text-sm font-medium text-white/95 truncate tracking-tight">
              {document.fileName}
            </h3>
            <p className="text-[11px] text-white/45 truncate mt-0.5 font-medium">
              {document.category} • {document.institution} • {document.fileSize}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onDownload}
            className="p-2.5 hover:bg-white/10 text-white/80 hover:text-white rounded-full transition-all cursor-pointer active:scale-95"
            title="Unduh Berkas PDF"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handlePrint}
            className="p-2.5 hover:bg-white/10 text-white/80 hover:text-white rounded-full transition-all cursor-pointer active:scale-95"
            title="Cetak Berkas"
          >
            <Printer className="w-5 h-5" />
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-2 hidden sm:block"></div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/10 text-white/80 hover:text-white rounded-full transition-all cursor-pointer active:scale-95"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF CONTENT INNER VIEWPORT */}
      <div className="flex-1 flex overflow-hidden relative select-none bg-[#1f1f1f]">
        {/* SIDE THUMBNAIL PANEL (Collapsible, only for Simulated PDF View) */}
        {!resolvedFileData && !loadingChunks && showThumbnails && (
          <div className="w-[180px] shrink-0 bg-[#131314] border-r border-white/5 flex flex-col justify-start overflow-y-auto p-4 gap-4 scrollbar-thin scrollbar-thumb-white/10 select-none animate-slide-in-left">
            <div className="flex items-center justify-between text-white/50 px-1 border-b border-white/5 pb-2 shrink-0">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500">
                Panel Halaman
              </span>
              <span className="text-[10px] font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded text-white/80">
                {totalPages} Halaman
              </span>
            </div>
            
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((pNum) => {
                const isActive = page === pNum;
                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`group relative text-left rounded-lg p-2 border-2 transition-all cursor-pointer focus:outline-none flex flex-col gap-1.5 ${
                      isActive 
                        ? 'border-emerald-500 bg-emerald-950/25 shadow-md shadow-black/30' 
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/80'
                    }`}
                  >
                    {/* Visual Miniature Page Representation */}
                    <div className="w-full h-24 bg-white rounded flex flex-col justify-between p-2 shadow-inner border border-stone-200 select-none pointer-events-none transition-transform group-hover:scale-[1.02]">
                      {/* Miniature Letterhead */}
                      <div className="flex items-center justify-between border-b-[0.5px] border-emerald-900/50 pb-0.5 mb-1 text-[4px] leading-none">
                        <div className="flex items-center gap-0.5">
                          <div className="w-2.5 h-2.5 bg-emerald-900 rounded-full flex items-center justify-center font-bold text-[3px] text-white">
                            YPI
                          </div>
                          <span className="font-extrabold text-[3px] text-emerald-950 scale-90 origin-left">YPI RT</span>
                        </div>
                        <span className="text-[2px] font-black text-yellow-600 scale-75 origin-right uppercase truncate max-w-[40px]">
                          {document.institution}
                        </span>
                      </div>

                      {/* Miniature content lines depending on page */}
                      {pNum === 1 && (
                        <div className="flex-1 flex flex-col gap-0.5 justify-center">
                          <div className="h-1 bg-emerald-950/30 rounded w-11/12 mx-auto"></div>
                          <div className="h-0.5 bg-stone-300 rounded w-10/12 mx-auto"></div>
                          <div className="h-0.5 bg-stone-200 rounded w-8/12 mx-auto"></div>
                          <div className="h-2 bg-yellow-500/10 border border-yellow-500/20 rounded-sm w-9/12 mx-auto mt-1"></div>
                        </div>
                      )}

                      {pNum === 2 && (
                        <div className="flex-1 flex flex-col gap-0.5 justify-center">
                          {document.category === 'KEUANGAN' ? (
                            /* mini table grid lines */
                            <div className="border border-emerald-900/10 rounded overflow-hidden text-[1px] leading-none w-full">
                              <div className="h-1 bg-emerald-900/25"></div>
                              <div className="h-0.5 bg-stone-100"></div>
                              <div className="h-0.5 bg-stone-50"></div>
                            </div>
                          ) : (
                            /* mini document paragraphs */
                            <div className="flex flex-col gap-0.5">
                              <div className="h-0.5 bg-stone-300 rounded w-11/12"></div>
                              <div className="h-0.5 bg-stone-200 rounded w-10/12"></div>
                              <div className="h-0.5 bg-stone-300 rounded w-9/12"></div>
                            </div>
                          )}
                        </div>
                      )}

                      {pNum === 3 && (
                        <div className="flex-1 flex flex-col justify-between mt-1">
                          <div className="h-1 bg-emerald-100/40 rounded w-full"></div>
                          {/* Miniature signatures block */}
                          <div className="flex justify-between items-end text-[2px] leading-none text-stone-400 mt-2">
                            <div className="w-1/3">
                              <div className="h-0.5 bg-stone-200 rounded w-full"></div>
                            </div>
                            <div className="w-1/3 flex flex-col items-center gap-0.5 scale-75 origin-bottom">
                              <div className="w-4 h-1.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-600 text-[2px] flex items-center justify-center font-bold">STAMP</div>
                              <div className="h-0.5 bg-emerald-950/40 rounded w-full"></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mini watermark footer */}
                      <div className="border-t-[0.5px] border-stone-100 pt-0.5 mt-1 text-[2px] scale-75 origin-left text-stone-300 truncate font-semibold uppercase">
                        Halaman {pNum} dari 3
                      </div>
                    </div>

                    {/* Thumbnail Footer Text inside button */}
                    <div className="flex items-center justify-between w-full px-0.5">
                      <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-400' : 'text-white/60 group-hover:text-white/90'}`}>
                        Halaman {pNum}
                      </span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MAIN VIEWPORT BODY */}
        <div className={`flex-1 relative overflow-auto scrollbar-thin scrollbar-thumb-white/10 ${
          resolvedFileData 
            ? 'p-0 w-full h-full' 
            : 'p-4 md:p-8 flex items-start justify-center'
        }`}>
          {loadingChunks ? (
            /* Sleek Dark-Themed Spinner */
            <div className="self-center flex flex-col items-center justify-center p-8 max-w-md text-center w-full h-full">
              <div className="relative flex items-center justify-center mb-5">
                <div className="w-12 h-12 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
                <FileText className="w-5 h-5 text-emerald-500 absolute" />
              </div>
              <p className="text-xs font-bold text-white uppercase tracking-widest animate-pulse">
                Mengunduh Berkas Fisik...
              </p>
              <p className="mt-2 text-[11px] text-stone-400 leading-relaxed font-medium">
                Mohon tunggu sebentar, sistem ALD sedang memuat dokumen secara utuh dari penyimpanan awan yang terenkripsi.
              </p>
            </div>
          ) : resolvedFileData ? (
            /* Full Screen Iframe without outer box or card container */
            <iframe
              src={resolvedFileData}
              title={document.fileName}
              className="w-full h-full border-0 bg-[#1f1f1f]"
            />
          ) : (
            /* Clean Simulation Sheet styled perfectly on the dark background */
            <div className="py-4 flex justify-center w-full">
            <div
              id="pdf_rendered_page"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              className="bg-white text-stone-850 shadow-[0_24px_60px_rgba(0,0,0,0.8)] rounded-md p-12 max-w-full w-[210mm] min-h-[297mm] transition-all duration-200 flex flex-col justify-between text-left shrink-0 mb-12"
            >
              {/* OFFICIAL LETTERHEAD */}
              <div>
                <div className="flex items-center justify-between border-b-[3px] border-emerald-900 pb-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-full flex items-center justify-center font-black text-xl border-2 border-yellow-400 shadow-md flex-shrink-0">
                      YPI
                    </div>
                    <div>
                      <h2 className="text-xs sm:text-sm font-black tracking-wide text-emerald-950 leading-snug">
                        YAYASAN PENDIDIKAN ISLAM RAUDHOTUT THOLIBIN
                      </h2>
                      <p className="text-[10px] font-bold text-emerald-800 tracking-tight leading-snug uppercase mt-0.5">
                        Akta Notaris No. 42 Tanggal 15 Juni 2012
                      </p>
                      <p className="text-[9px] text-stone-500 leading-snug font-medium">
                        Jl. KH. Abdul Hamid No. 12, Kec. Margoyoso, Kab. Pati, Jawa Tengah 59154
                      </p>
                    </div>
                  </div>
                  <div className="text-right border-l pl-4 border-emerald-100 hidden sm:block">
                    <span className="text-[9px] font-extrabold text-emerald-800/60 block tracking-wider uppercase">
                      UNIT LEMBAGA
                    </span>
                    <span className="text-xs font-black text-yellow-600 tracking-widest uppercase block mt-0.5">
                      {document.institution}
                    </span>
                  </div>
                </div>
              </div>

              {/* REPORT TYPE DYNAMIC CONTENT */}
              {document.category === 'KEUANGAN' && (
                  <div className="space-y-6">
                    {page === 1 && (
                      <div className="space-y-6 animate-fade-in">
                        {/* Title block */}
                        <div className="text-center">
                          <h1 className="text-xs sm:text-sm font-black text-emerald-950 tracking-wide underline uppercase">
                            LAPORAN REALISASI ANGGARAN & BELANJA BULANAN
                          </h1>
                          <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mt-1">
                            PERIODE: {document.month} {document.year}
                          </p>
                          <div className="mt-2 text-[10px] text-yellow-600 font-extrabold tracking-widest uppercase bg-yellow-50/50 py-1 rounded border border-yellow-200/50">
                            Halaman 1: Ringkasan Eksekutif & Ikhtisar Saldo
                          </div>
                        </div>

                        {/* General details */}
                        <div className="grid grid-cols-2 gap-4 bg-emerald-50/20 p-3 rounded-xl border border-emerald-100/50 text-[10px] font-semibold text-emerald-900">
                          <div>
                            <p>Kategori: <span className="text-emerald-950 font-extrabold">{document.category}</span></p>
                            <p className="mt-1">Nama Arsip: <span className="text-emerald-950 font-extrabold">{document.fileName}</span></p>
                          </div>
                          <div>
                            <p>Pengunggah: <span className="text-emerald-950 font-extrabold">{document.uploader}</span></p>
                            <p className="mt-1">Tanggal Arsip: <span className="text-emerald-950 font-extrabold">{new Date(document.uploadDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span></p>
                          </div>
                        </div>

                        {/* Executive summary paragraph */}
                        <div className="border border-emerald-100/50 rounded-xl p-4 bg-emerald-50/10 text-[10px] text-stone-700 leading-relaxed space-y-3">
                          <p className="font-extrabold text-emerald-950 uppercase tracking-wider">
                            I. Pendahuluan & Ringkasan Eksekutif
                          </p>
                          <p>
                            Dokumen ini merupakan laporan realisasi penggunaan kas bulanan pada unit kerja <strong className="text-emerald-900">{document.institution}</strong> di bawah Yayasan Pendidikan Islam Raudhotut Tholibin Margoyoso, Pati. Laporan ini disusun secara elektronik dan otomatis tersinkronisasi dalam server ALD (Arsip Laporan Digital).
                          </p>
                          <p>
                            Seluruh rincian transaksi pengeluaran dan pemasukan pada periode <strong className="text-emerald-900">{document.month} {document.year}</strong> telah terekonsiliasi dengan baik. Komite audit internal yayasan telah memverifikasi keabsahan kuitansi dan kesesuaian nominal guna memastikan prinsip transparansi dan akuntabilitas kearsipan lembaga syariah.
                          </p>
                        </div>

                        <div className="bg-yellow-50/40 p-4 rounded-xl border border-yellow-200/50 text-center">
                          <p className="text-[9px] font-bold text-yellow-800 uppercase tracking-wider">IKHTISAR SALDO KEUANGAN UNIT</p>
                          <p className="text-lg font-black text-emerald-950 mt-1">Rp 39.800.000</p>
                          <p className="text-[8px] text-stone-500 font-semibold mt-0.5">(Sisa Saldo Kas Bersih Siap Alokasi Periode Berikutnya)</p>
                        </div>
                      </div>
                    )}

                    {page === 2 && (
                      <div className="space-y-6 animate-fade-in">
                        {/* Title block */}
                        <div className="text-center">
                          <h1 className="text-xs sm:text-sm font-black text-emerald-950 tracking-wide underline uppercase">
                            BUKU BESAR & RINCIAN TRANSAKSI ALOKASI KAS
                          </h1>
                          <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mt-1">
                            PERIODE: {document.month} {document.year}
                          </p>
                          <div className="mt-2 text-[10px] text-yellow-600 font-extrabold tracking-widest uppercase bg-yellow-50/50 py-1 rounded border border-yellow-200/50">
                            Halaman 2: Rincian Anggaran & Buku Besar
                          </div>
                        </div>

                        {/* Financial Ledger Table */}
                        <div className="border border-emerald-100/60 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                              <tr className="bg-[#0b2212] text-emerald-50 font-bold border-b border-emerald-800/40">
                                <th className="p-2 border-r border-emerald-800/20 text-center w-10">No</th>
                                <th className="p-2 border-r border-emerald-800/20">Deskripsi Uraian Kegiatan</th>
                                <th className="p-2 border-r border-emerald-800/20 text-right w-24">Penerimaan (Rp)</th>
                                <th className="p-2 text-right w-24">Pengeluaran (Rp)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50">
                              <tr className="hover:bg-emerald-50/10">
                                <td className="p-2 border-r border-emerald-100/30 text-center">1</td>
                                <td className="p-2 border-r border-emerald-100/30">Saldo Awal Kas Lembaga {document.institution}</td>
                                <td className="p-2 border-r border-emerald-100/30 text-right font-mono font-bold">14.500.000</td>
                                <td className="p-2 text-right font-mono">-</td>
                              </tr>
                              <tr className="hover:bg-emerald-50/10">
                                <td className="p-2 border-r border-emerald-100/30 text-center">2</td>
                                <td className="p-2 border-r border-emerald-100/30">Penerimaan Dana BOS Yayasan Terintegrasi</td>
                                <td className="p-2 border-r border-emerald-100/30 text-right font-mono font-bold">45.000.000</td>
                                <td className="p-2 text-right font-mono">-</td>
                              </tr>
                              <tr className="hover:bg-emerald-50/10">
                                <td className="p-2 border-r border-emerald-100/30 text-center">3</td>
                                <td className="p-2 border-r border-emerald-100/30">Pemasukan Iuran SPP Bulanan Wali Santri</td>
                                <td className="p-2 border-r border-emerald-100/30 text-right font-mono font-bold">22.800.000</td>
                                <td className="p-2 text-right font-mono">-</td>
                              </tr>
                              <tr className="hover:bg-emerald-50/10">
                                <td className="p-2 border-r border-emerald-100/30 text-center">4</td>
                                <td className="p-2 border-r border-emerald-100/30">Belanja Gaji Tenaga Pendidik & Karyawan</td>
                                <td className="p-2 border-r border-emerald-100/30 text-right font-mono">-</td>
                                <td className="p-2 text-right font-mono font-bold text-red-600">34.200.000</td>
                              </tr>
                              <tr className="hover:bg-emerald-50/10">
                                <td className="p-2 border-r border-emerald-100/30 text-center">5</td>
                                <td className="p-2 border-r border-emerald-100/30">Pengadaan Alat Tulis Kantor (ATK) & Fotokopi</td>
                                <td className="p-2 border-r border-emerald-100/30 text-right font-mono">-</td>
                                <td className="p-2 text-right font-mono font-bold text-red-600">2.150.000</td>
                              </tr>
                              <tr className="hover:bg-emerald-50/10">
                                <td className="p-2 border-r border-emerald-100/30 text-center">6</td>
                                <td className="p-2 border-r border-emerald-100/30">Biaya Operasional Token Listrik & Wifi Fiber</td>
                                <td className="p-2 border-r border-emerald-100/30 text-right font-mono">-</td>
                                <td className="p-2 text-right font-mono font-bold text-red-600">1.850.000</td>
                              </tr>
                              <tr className="hover:bg-emerald-50/10">
                                <td className="p-2 border-r border-emerald-100/30 text-center">7</td>
                                <td className="p-2 border-r border-emerald-100/30">Pemeliharaan Sarana Gedung & Kebersihan</td>
                                <td className="p-2 border-r border-emerald-100/30 text-right font-mono">-</td>
                                <td className="p-2 text-right font-mono font-bold text-red-600">4.300.000</td>
                              </tr>
                              <tr className="bg-emerald-50/30 font-bold border-t border-emerald-100">
                                <td colSpan={2} className="p-2.5 border-r border-emerald-100/30 text-right uppercase text-emerald-950">Jumlah Total</td>
                                <td className="p-2.5 border-r border-emerald-100/30 text-right font-mono text-emerald-700">82.300.000</td>
                                <td className="p-2.5 text-right font-mono text-red-600">42.500.000</td>
                              </tr>
                              <tr className="bg-yellow-50/40 font-black border-t-2 border-emerald-900">
                                <td colSpan={2} className="p-2.5 border-r border-yellow-100/40 text-right uppercase text-emerald-950">Saldo Akhir Kumulatif</td>
                                <td colSpan={2} className="p-2.5 text-right font-mono text-xs text-[#07140b] bg-yellow-50/20">
                                  Rp 39.800.000
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {page === 3 && (
                      <div className="space-y-6 animate-fade-in">
                        {/* Title block */}
                        <div className="text-center">
                          <h1 className="text-xs sm:text-sm font-black text-emerald-950 tracking-wide underline uppercase">
                            LEMBAR PENGESAHAN & DESKRIPSI TAMBAHAN
                          </h1>
                          <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mt-1">
                            PERIODE: {document.month} {document.year}
                          </p>
                          <div className="mt-2 text-[10px] text-yellow-600 font-extrabold tracking-widest uppercase bg-yellow-50/50 py-1 rounded border border-yellow-200/50">
                            Halaman 3: Legalitas & Keterangan Tambahan
                          </div>
                        </div>

                        <div className="border border-dashed border-emerald-300 rounded-xl p-4 bg-emerald-50/5 text-[10px] text-stone-750 space-y-2">
                          <p className="font-bold text-emerald-950">Catatan Keterangan Tambahan:</p>
                          <p className="italic leading-relaxed text-stone-600">
                            {document.description || "Tidak ada keterangan tambahan pada berkas ini."}
                          </p>
                        </div>

                        {/* Audit Verification Checklist */}
                        <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-emerald-950 bg-emerald-50/10 p-3 rounded-xl border border-emerald-100">
                          <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Rekonsiliasi Kas: Match</p>
                          <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Audit Internal: Selesai</p>
                          <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Sifat Laporan: Valid Sah</p>
                          <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Log Transaksi: Terarsipkan</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {document.category === 'SURAT' && (
                  <div className="space-y-6">
                    {page === 1 && (
                      <div className="space-y-6 animate-fade-in">
                        {/* Document metadata info */}
                        <div className="text-right text-[9px] font-bold text-emerald-800 tracking-tight">
                          <p>No Surat: 124/YPI-RT/VI/2026</p>
                          <p className="mt-0.5">Sifat: Penting / Segera</p>
                          <p className="mt-0.5">Lampiran: -</p>
                        </div>

                        <div className="text-center">
                          <h1 className="text-xs sm:text-sm font-black text-emerald-950 tracking-wide underline uppercase">
                            SURAT PENGANTAR KEPUTUSAN PENGURUS
                          </h1>
                          <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mt-1">
                            TENTANG LAYANAN KEARSIPAN DIGITAL LEMBAGA
                          </p>
                          <div className="mt-2 text-[10px] text-yellow-600 font-extrabold tracking-widest uppercase bg-yellow-50/50 py-1 rounded border border-yellow-200/50">
                            Halaman 1: Surat Pengantar & Konsideran
                          </div>
                        </div>

                        <div className="text-[10px] text-stone-800 leading-relaxed space-y-3">
                          <p>Kepada Yth,<br /><strong className="text-emerald-950">Kepala Unit Lembaga {document.institution}</strong><br />Di Tempat</p>
                          <p className="indent-8 text-justify">
                            Dengan hormat, sehubungan dengan dimulainya operasional Sistem Arsip Laporan Digital (ALD) Yayasan Raudhotut Tholibin Pati, pengurus pusat menyampaikan salinan keputusan resmi terkait mekanisme pengunggahan, pengamanan, dan penyimpanan dokumen kearsipan dalam cloud storage yayasan.
                          </p>
                          <p className="indent-8 text-justify">
                            Surat keputusan ini wajib dipelajari dan diimplementasikan secara saksama oleh seluruh jajaran pengurus unit guna menunjang target digitalisasi pelaporan lembaga syariah yang akuntabel.
                          </p>
                        </div>
                      </div>
                    )}

                    {page === 2 && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="text-center">
                          <h1 className="text-xs sm:text-sm font-black text-emerald-950 tracking-wide underline uppercase">
                            SURAT KEPUTUSAN PENGURUS YAYASAN
                          </h1>
                          <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mt-1">
                            NOMOR: 412/YPI-RT/VI/2026
                          </p>
                          <div className="mt-2 text-[10px] text-yellow-600 font-extrabold tracking-widest uppercase bg-yellow-50/50 py-1 rounded border border-yellow-200/50">
                            Halaman 2: Batang Tubuh Surat Keputusan
                          </div>
                        </div>

                        {/* Letter Body */}
                        <div className="text-[10px] text-stone-800 leading-relaxed space-y-4">
                          <p className="font-bold text-emerald-950">Menimbang:</p>
                          <ol className="list-decimal pl-5 space-y-1">
                            <li className="text-justify">Bahwa untuk kelancaran administrasi laporan lembaga di lingkungan Yayasan Pendidikan Islam Raudhotut Tholibin, maka perlu ditunjuk koordinator unit kearsipan digital.</li>
                            <li className="text-justify">Bahwa demi ketertiban operasional, unit kerja berkewajiban melaporkan realisasi anggaran bulanan secara tertib.</li>
                          </ol>

                          <p className="font-bold text-emerald-950">Mengingat:</p>
                          <ol className="list-decimal pl-5 space-y-1">
                            <li className="text-justify">Anggaran Dasar dan Anggaran Rumah Tangga Yayasan Pendidikan Islam Raudhotut Tholibin Pati.</li>
                            <li className="text-justify">Keputusan Rapat Pleno Dewan Pengustus Yayasan pada tanggal 10 Juni 2026.</li>
                          </ol>

                          <div className="border-t border-b border-emerald-100 py-3 my-2">
                            <p className="font-black text-center text-emerald-950 uppercase tracking-widest text-[10px] mb-1">MEMUTUSKAN</p>
                            <p className="font-bold">Menetapkan:</p>
                            <p className="mt-1 leading-relaxed pl-4 text-stone-750 text-justify">
                              Mengangkat dan menunjuk nama pengunggah berkas ini sebagai Koordinator Penyusunan Arsip Laporan Digital (ALD) untuk lingkup unit <strong className="text-emerald-950">{document.institution}</strong> tahun buku 2026.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {page === 3 && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="text-center">
                          <h1 className="text-xs sm:text-sm font-black text-emerald-950 tracking-wide underline uppercase">
                            LEMBAR PENGESAHAN & KETERANGAN SURAT
                          </h1>
                          <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mt-1">
                            UNIT KERJA: {document.institution}
                          </p>
                          <div className="mt-2 text-[10px] text-yellow-600 font-extrabold tracking-widest uppercase bg-yellow-50/50 py-1 rounded border border-yellow-200/50">
                            Halaman 3: Pengesahan & Keterangan
                          </div>
                        </div>

                        <p className="font-bold text-emerald-950 text-[10px]">Keterangan Tambahan:</p>
                        <p className="text-stone-600 bg-emerald-50/20 p-2.5 rounded-xl border border-emerald-100/45 text-[10px] leading-relaxed italic">
                          {document.description || "Surat penunjukan resmi berlaku sejak tanggal dikeluarkan dan wajib dijalankan dengan penuh amanah."}
                        </p>

                        <div className="bg-emerald-50/10 border border-emerald-100 p-3 rounded-xl text-[9px] font-bold text-emerald-950 space-y-1">
                          <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Salinan Resmi Tercatat di Database Yayasan</p>
                          <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Diunggah Aman oleh Operator Unit {document.uploader}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {document.category !== 'KEUANGAN' && document.category !== 'SURAT' && (
                  <div className="space-y-6">
                    {page === 1 && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="text-center">
                          <h1 className="text-xs sm:text-sm font-black text-emerald-950 tracking-wide underline uppercase">
                            ARSIP DOKUMEN & LAPORAN RESMI
                          </h1>
                          <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mt-1">
                            UNIT: {document.institution} • {document.category}
                          </p>
                          <div className="mt-2 text-[10px] text-yellow-600 font-extrabold tracking-widest uppercase bg-yellow-50/50 py-1 rounded border border-yellow-200/50">
                            Halaman 1: Ringkasan Laporan Resmi
                          </div>
                        </div>

                        {/* Page contents description */}
                        <div className="border border-emerald-100/60 rounded-2xl p-4 bg-emerald-50/10 text-[10px] text-stone-700 leading-relaxed space-y-3">
                          <p className="font-bold text-emerald-950 text-xs flex items-center gap-1.5 border-b pb-1.5 border-emerald-100/55">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Metadata Terverifikasi Sistem
                          </p>
                          
                          <div className="grid grid-cols-2 gap-3 text-stone-600">
                            <div>
                              <p className="text-[9px] text-emerald-800/60 font-bold uppercase">Nama Berkas</p>
                              <p className="text-emerald-950 font-bold font-mono truncate">{document.fileName}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-emerald-800/60 font-bold uppercase">Ukuran Berkas</p>
                              <p className="text-emerald-950 font-bold">{document.fileSize}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-emerald-800/60 font-bold uppercase">Tanggal Diunggah</p>
                              <p className="text-emerald-950 font-semibold">
                                {new Date(document.uploadDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-emerald-800/60 font-bold uppercase">Otoritas Pengunggah</p>
                              <p className="text-emerald-950 font-semibold">{document.uploader}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {page === 2 && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="text-center">
                          <h1 className="text-xs sm:text-sm font-black text-emerald-950 tracking-wide underline uppercase">
                            DESKRIPSI & EVALUASI INTEGRITAS BERKAS
                          </h1>
                          <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mt-1">
                            KATEGORI LAPORAN: {document.category}
                          </p>
                          <div className="mt-2 text-[10px] text-yellow-600 font-extrabold tracking-widest uppercase bg-yellow-50/50 py-1 rounded border border-yellow-200/50">
                            Halaman 2: Lembar Evaluasi & Uraian
                          </div>
                        </div>

                        <div className="border-t border-emerald-100/60 pt-3 text-[10px]">
                          <p className="text-[9px] text-emerald-800/60 font-bold uppercase">Uraian / Keterangan Dokumen</p>
                          <p className="text-stone-800 font-medium mt-1 leading-relaxed italic bg-emerald-50/10 p-3 rounded-xl border border-emerald-100 text-justify">
                            "{document.description || "Tidak ada keterangan atau penjelasan tambahan yang disertakan pada laporan ini."}"
                          </p>
                        </div>

                        {/* Dummy visual graphics container */}
                        <div className="border border-dashed border-emerald-200 rounded-2xl p-6 text-center bg-emerald-50/5">
                          <FileText className="w-10 h-10 text-emerald-600/50 mx-auto mb-2" />
                          <h3 className="text-xs font-bold text-emerald-950">Lampiran Dokumen Tambahan</h3>
                          <p className="text-[9px] text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed text-justify">
                            Laporan kegiatan pendukung, foto dokumentasi, atau sertifikat penunjang tersimpan aman dalam sistem cloud storage ALD.
                          </p>
                        </div>
                      </div>
                    )}

                    {page === 3 && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="text-center">
                          <h1 className="text-xs sm:text-sm font-black text-emerald-950 tracking-wide underline uppercase">
                            LEMBAR PENGESAHAN DOKUMEN ARSIP
                          </h1>
                          <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mt-1">
                            UNIT KERJA: {document.institution}
                          </p>
                          <div className="mt-2 text-[10px] text-yellow-600 font-extrabold tracking-widest uppercase bg-yellow-50/50 py-1 rounded border border-yellow-200/50">
                            Halaman 3: Otorisasi & Legalitas
                          </div>
                        </div>

                        <div className="bg-emerald-50/10 border border-emerald-100 p-3 rounded-xl text-[9px] font-bold text-emerald-950 space-y-1.5">
                          <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Dokumen Berstatus Terverifikasi Sah (Verified)</p>
                          <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Log audit terdaftar secara otomatis di pusat data</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              

              {/* FOOTER AREA (SIGNATURES ON PAGE 3, SIMPLE METADATA ON PAGE 1 & 2) */}
              {page === 3 ? (
                <div className="border-t border-emerald-100 pt-6 mt-12 flex flex-col sm:flex-row items-start justify-between text-[9px] text-stone-500 font-medium gap-4 animate-fade-in">
                  <div>
                    <p className="font-bold text-emerald-950 uppercase">SISTEM ALD YAYASAN RAUDHOTUT THOLIBIN</p>
                    <p className="mt-1 leading-relaxed text-stone-500 font-medium">
                      Dokumen ini telah diarsipkan secara elektronik dan sah sebagai arsip resmi yayasan.<br />
                      Log audit id: <span className="font-mono font-bold text-emerald-800">{document.id}</span> • Diunduh sebanyak: {document.downloadCount} kali.
                    </p>
                  </div>

                  {/* Signature block */}
                  <div className="text-center w-40 mt-4 sm:mt-0 self-end sm:self-auto flex flex-col items-center">
                    <p>Pati, {new Date(document.uploadDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="font-extrabold text-emerald-950 uppercase mt-1">Ketua Yayasan,</p>
                    
                    {/* Digitally Signed Stamp / Seal */}
                    <div className="my-1 border border-yellow-500 text-yellow-600 font-black tracking-widest px-2.5 py-1 rounded-xl text-[7px] uppercase transform -rotate-2 select-none bg-yellow-50/30">
                      DIGITALLY SIGNED • ALD
                    </div>
                    
                    <p className="underline font-bold text-emerald-950 mt-2">H. Ahmad Syarifuddin, M.Pd.</p>
                    <p className="text-[8px] text-stone-400">NIPY. 19740512.201206.01</p>
                  </div>
                </div>
              ) : (
                <div className="border-t border-stone-100 pt-4 mt-12 flex items-center justify-between text-[8px] text-stone-400 font-semibold tracking-wider uppercase animate-fade-in">
                  <span>SISTEM ARSIP LAPORAN DIGITAL (ALD)</span>
                  <span>HALAMAN {page} DARI {totalPages}</span>
                  <span>CONFIDENTIAL</span>
                </div>
              )}
            </div>
            </div>
          )}
        </div>
      </div>

      {/* GOOGLE DRIVE-STYLE FLOATING CONTROL PILL (Bottom Center) */}
      {!loadingChunks && !resolvedFileData && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#282a2d] text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-4 py-2 rounded-full flex items-center gap-4 border border-white/10 z-50 backdrop-blur-md">
          {/* Pagination Controls inside floating pill if more than 1 page (simulated) */}
          {totalPages > 1 && !resolvedFileData && (
            <>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 hover:bg-white/10 text-white/80 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-all cursor-pointer active:scale-90"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1 text-xs select-none">
                  <input
                    type="text"
                    value={pageInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        setPageInput(val);
                      }
                    }}
                    onBlur={() => {
                      const pNum = parseInt(pageInput, 10);
                      if (!isNaN(pNum) && pNum >= 1 && pNum <= totalPages) {
                        setPage(pNum);
                      } else {
                        setPageInput(page.toString());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const pNum = parseInt(pageInput, 10);
                        if (!isNaN(pNum) && pNum >= 1 && pNum <= totalPages) {
                          setPage(pNum);
                          e.currentTarget.blur();
                        } else {
                          setPageInput(page.toString());
                          e.currentTarget.blur();
                        }
                      }
                    }}
                    className="w-10 h-7 bg-white/10 text-white font-bold text-center rounded border border-white/10 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs transition-all selection:bg-emerald-500 selection:text-white"
                  />
                  <span className="text-white/40 font-semibold">/ {totalPages}</span>
                </div>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 hover:bg-white/10 text-white/80 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-all cursor-pointer active:scale-90"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="w-[1px] h-5 bg-white/15"></div>
            </>
          )}

          {/* Zoom Controls inside floating pill */}
          {!resolvedFileData && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-white/10 text-white/80 hover:text-white rounded-full transition-all cursor-pointer active:scale-90"
                title="Perkecil Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold select-none min-w-[35px] text-center">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-white/10 text-white/80 hover:text-white rounded-full transition-all cursor-pointer active:scale-90"
                title="Perbesar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* If resolved file is displaying, show quick tag info inside floating pill */}
          {resolvedFileData && (
            <div className="text-xs font-medium px-2.5 text-stone-300 select-none flex items-center gap-1.5 py-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Arsip Terenkripsi Aman
            </div>
          )}
        </div>
      )}

    </div>
  );
}
