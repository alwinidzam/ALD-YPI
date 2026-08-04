import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Printer, RefreshCw, AlertTriangle, Key, History } from 'lucide-react';
import { Staff, Barcode } from '../../types';
import { BarcodeService } from '../../services/BarcodeService';
import { FirestoreBarcodeRepository } from '../../repositories/FirestoreBarcodeRepository';
import { FirestoreStaffRepository } from '../../repositories/FirestoreStaffRepository';

const barcodeService = new BarcodeService(
  new FirestoreBarcodeRepository()
);

export const BarcodeManagementModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
}> = ({ isOpen, onClose, staff }) => {
  const [activeBarcode, setActiveBarcode] = useState<Barcode | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && staff) {
      loadBarcode();
    }
  }, [isOpen, staff]);

  const loadBarcode = async () => {
    if (!staff) return;
    setLoading(true);
    try {
      if (staff.barcodeToken) {
        // Find barcode by staffId and active status
        // Use the token directly from staff record since it's canonical
        setActiveBarcode({ token: staff.barcodeToken } as Barcode);
        QRCode.toDataURL(staff.barcodeToken, { width: 256, margin: 2 }).then(setQrDataUrl).catch(console.error);
      } else {
        setActiveBarcode(null);
        setQrDataUrl('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!staff || !window.confirm('Yakin ingin generate ulang barcode? Barcode lama akan otomatis hangus.')) return;
    try {
      setLoading(true);
      const newBarcode = await barcodeService.generateForStaff(staff.id, "OP-SYSTEM");
      setActiveBarcode(newBarcode);
      setActiveBarcode({ token: newBarcode.token } as Barcode);
      QRCode.toDataURL(newBarcode.token, { width: 256, margin: 2 }).then(setQrDataUrl).catch(console.error);
      alert('Barcode berhasil di-generate.');
    } catch (e) {
      console.error(e);
      alert('Gagal generate barcode.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!activeBarcode) return;
    try {
      setLoading(true);
      if (activeBarcode.id) await barcodeService.recordPrint(activeBarcode.id, "OP-SYSTEM");
      
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `QR-${staff.fullName.replace(/[^a-zA-Z0-9]/g, '_')}-${activeBarcode.token}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert('QR Code berhasil diunduh.');
      loadBarcode(); // Refresh print count
    } catch (e) {
      console.error(e);
      alert('Gagal mencetak.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Manajemen Barcode</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Kelola akses fisik untuk {staff.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : activeBarcode ? (
            <div className="space-y-6">
              {/* Preview Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-48 h-48 bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm relative">
                  {qrDataUrl ? <img src={qrDataUrl} alt="QR Code" className="w-32 h-32 object-contain rounded-lg" /> : <QrCode className="w-24 h-24 text-slate-800" />}
                  <div className="mt-4 text-xs font-mono font-bold text-slate-600">{activeBarcode.token}</div>
                  
                  {/* Status badge overlay */}
                  <div className="absolute -top-3 -right-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200">
                      <Key className="w-3.5 h-3.5" /> Aktif
                    </span>
                  </div>
                </div>
                
                <p className="text-sm font-medium text-slate-500 mt-6 max-w-sm">
                  Barcode ini dapat digunakan untuk Check-In dan Check-Out. Jangan bagikan kepada orang lain.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-white">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Dicetak</span>
                  <span className="text-xl font-bold text-slate-800">{activeBarcode.printCount}x</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-white">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Dicetak Terakhir</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    {activeBarcode.lastPrintedAt 
                      ? new Date(activeBarcode.lastPrintedAt).toLocaleDateString('id-ID')
                      : 'Belum pernah'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Unduh QR Code
                </button>
                <button 
                  onClick={handleRegenerate}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100 transition-all border border-red-200 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Barcode Belum Ada</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm">
                Staf ini belum memiliki barcode aktif. Silakan generate barcode baru untuk memberikan akses absensi.
              </p>
              <button 
                onClick={handleRegenerate}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Generate Barcode Baru
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
