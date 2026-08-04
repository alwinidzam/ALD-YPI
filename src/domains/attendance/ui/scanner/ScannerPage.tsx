import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Zap, ZapOff, Bug } from 'lucide-react';
import { feedbackService } from '../../../../lib/FeedbackService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Keyboard, Activity, CheckCircle2, XCircle, 
  LogOut, Clock, ShieldAlert,
  History, Flashlight, FlashlightOff
} from 'lucide-react';
import { UnifiedScannerService, ScannerSessionState, ScannerType } from '../../scanner';
import { AttendanceService } from '../../services/AttendanceService';
import { FirestoreAttendanceRepository } from '../../repositories/FirestoreAttendanceRepository';
import { FirestoreAttendanceTransactionService } from '../../services/FirestoreAttendanceTransactionService';
import { FirestoreStaffRepository } from '../../repositories/FirestoreStaffRepository';
import { FirestoreBarcodeRepository } from '../../repositories/FirestoreBarcodeRepository';
import { StaffResultPanel, ScanResultProps } from './components/StaffResultPanel';
import { DetectionOverlay } from '../../scanner/DetectionOverlay';
import { DebugPanel } from '../../scanner/components/DebugPanel';
import { StabilizedDetection } from '../../scanner/DetectionStabilizer';
import { ScannerMetricsData } from '../../scanner/ScannerMetrics';

// Initialize services
const attendanceRepo = new FirestoreAttendanceRepository();
const transactionService = new FirestoreAttendanceTransactionService();
const staffRepo = new FirestoreStaffRepository();
const barcodeRepo = new FirestoreBarcodeRepository();

const attendanceService = new AttendanceService(
  attendanceRepo,
  transactionService,
  staffRepo,
  barcodeRepo,
  undefined
);

const scannerService = new UnifiedScannerService(attendanceService, {
  debounceMs: 1500,
  soundFeedbackEnabled: true,
});

export const ScannerPage: React.FC<{
  operatorId: string;
  operatorName: string;
  onClose: () => void;
}> = ({ operatorId, operatorName, onClose }) => {
  const [sessionState, setSessionState] = useState<ScannerSessionState>(scannerService.getSessionState());
  const [recentScans, setRecentScans] = useState<ScanResultProps[]>([]);
  const [latestScan, setLatestScan] = useState<ScanResultProps | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanFlash, setScanFlash] = useState<'success' | 'error' | 'duplicate' | null>(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  // Live Engine V2 Overlay & Metrics State
  const [liveDetection, setLiveDetection] = useState<StabilizedDetection | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<ScannerMetricsData | null>(null);
  const [tapFocusPoint, setTapFocusPoint] = useState<{ x: number; y: number } | null>(null);

  const [allStaff, setAllStaff] = useState<any[]>([]);

  useEffect(() => {
    staffRepo.findAll().then(setAllStaff).catch(console.error);
  }, []);

  const getStaffName = (id: string | undefined) => {
    if (!id) return 'Ditolak';
    const s = allStaff.find(x => x.id === id);
    return s ? s.fullName : id;
  };
  
  const [cameraStatus, setCameraStatus] = useState<string>('DISCONNECTED');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const adapterRef = useRef<any>(null);

  useEffect(() => {
    adapterRef.current = scannerService.getCameraAdapter();
    
    // Subscribe to session state
    const unsubscribeSession = scannerService.subscribeSessionState((state) => {
      setSessionState(state);
    });

    // Subscribe to camera status changes
    const unsubscribeCameraStatus = adapterRef.current.onStatusChange((status: string) => {
      setCameraStatus(status);
    });
    setCameraStatus(adapterRef.current.getStatus());

    // Subscribe to live Detection Overlay events from Engine V2
    const unsubscribeDetection = adapterRef.current.onDetection((stabilized: StabilizedDetection | null) => {
      setLiveDetection(stabilized);
    });

    // Subscribe to live Metrics from Engine V2
    const unsubscribeMetrics = adapterRef.current.subscribeMetrics((metrics: ScannerMetricsData) => {
      setLiveMetrics(metrics);
    });

    // Initialize USB as default
    scannerService.initialize('USB');

    // Subscribe to scan events
    const unsubscribeSuccess = scannerService.onScanSuccess((attendance, payload) => {
      const result: ScanResultProps = { attendance, status: 'SUCCESS', timestamp: new Date() };
      setLatestScan(result);
      setScanFlash('success');
      feedbackService.notify('success');
      setTimeout(() => setScanFlash(null), 400);
      setRecentScans(prev => [result, ...prev].slice(0, 50));
    });

    const unsubscribeError = scannerService.onScanError((error, payload) => {
      if (payload) {
        const result: ScanResultProps = { error, status: 'ERROR', timestamp: new Date() };
        setLatestScan(result);
        const isDuplicate = error.message.toLowerCase().includes('sudah');
        setScanFlash(isDuplicate ? 'duplicate' : 'error');
        feedbackService.notify(isDuplicate ? 'warning' : 'error');
        setTimeout(() => setScanFlash(null), 500);
        setRecentScans(prev => [result, ...prev].slice(0, 50));
      }
    });

    return () => {
      unsubscribeSession();
      unsubscribeCameraStatus();
      unsubscribeDetection();
      unsubscribeMetrics();
      unsubscribeSuccess();
      unsubscribeError();
      scannerService.destroy();
    };
  }, []);

  // Manage camera state and auto-start when switching to CAMERA tab
  useEffect(() => {
    let isMounted = true;

    const setupCamera = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoCameras = devices.filter(d => d.kind === 'videoinput');
        if (isMounted && videoCameras.length > 0) {
          setAvailableCameras(videoCameras);
          if (!selectedCameraId) {
            setSelectedCameraId(videoCameras[0].deviceId);
          }
        }
      } catch (err) {
        console.error('Failed to load cameras', err);
      }
    };
    setupCamera();

    if (sessionState.activeScannerType === 'CAMERA') {
      const startStream = async () => {
        try {
          if (videoRef.current) {
            adapterRef.current.setVideoElement(videoRef.current);
          }
          await adapterRef.current.startCamera(selectedCameraId || undefined);
        } catch (err) {
          console.error('Camera startup failed:', err);
        }
      };
      startStream();

      return () => {
        isMounted = false;
        if (adapterRef.current) {
          adapterRef.current.stopCamera();
        }
      };
    } else {
      if (adapterRef.current) {
        adapterRef.current.stopCamera();
      }
    }
  }, [sessionState.activeScannerType, selectedCameraId]);

  useEffect(() => {
    if (sessionState.activeScannerType === 'CAMERA' && cameraStatus === 'CONNECTED') {
      const timer = setTimeout(() => {
        if (adapterRef.current && typeof adapterRef.current.isTorchSupported === 'function') {
          setTorchSupported(adapterRef.current.isTorchSupported());
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setTorchSupported(false);
      setTorchOn(false);
    }
  }, [cameraStatus, sessionState.activeScannerType]);

  const handleScannerSwitch = async (type: ScannerType) => {
    try {
      await scannerService.switchScannerType(type);
    } catch (error) {
      console.error('Failed to switch scanner:', error);
      scannerService.switchScannerType('USB');
    }
  };

  const handleManualScan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = formData.get('token') as string;
    if (token) {
      scannerService.processManualToken(token, operatorId, operatorName).catch(console.error);
      e.currentTarget.reset();
    }
  };

  const handleTapToFocus = (x: number, y: number) => {
    setTapFocusPoint({ x, y });
    if (adapterRef.current && typeof adapterRef.current.tapToFocus === 'function') {
      adapterRef.current.tapToFocus(x, y);
    }
    setTimeout(() => setTapFocusPoint(null), 1200);
  };

  const handlePinchZoom = (zoomDelta: number) => {
    if (adapterRef.current && liveMetrics) {
      const newZoom = liveMetrics.zoomLevel + zoomDelta;
      adapterRef.current.setZoom(newZoom);
    }
  };

  const isCamera = sessionState.activeScannerType === 'CAMERA';
  const displayedStatus = isCamera ? cameraStatus : sessionState.connectionStatus;

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Scanner Kehadiran V2</h1>
            <p className="text-sm text-slate-500 font-medium">Sistem Scanning Ultra Fast & Real-time</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Debug V2 Toggle */}
          <button
            onClick={() => setIsDebugOpen(!isDebugOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              isDebugOpen
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <Bug className="w-4 h-4" />
            <span>Debug V2</span>
          </button>

          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operator</span>
            <span className="text-sm font-bold text-slate-700">{operatorName}</span>
          </div>
          <div className="w-px h-8 bg-slate-200 hidden md:block" />
          
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {isCamera ? (
          /* =========================================
             CAMERA MODE - IMMERSIVE FULL-SCREEN LAYOUT 
             ========================================= */
          <div className="flex-1 flex relative">
            {/* Immersive Video Background */}
            <div className="absolute inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
              <video 
                ref={(el) => {
                  videoRef.current = el;
                  if (el && adapterRef.current) {
                    adapterRef.current.setVideoElement(el);
                  }
                }} 
                autoPlay
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover" 
              />

              {/* Engine V2 Live Detection Overlay */}
              <DetectionOverlay
                boundingBox={liveDetection?.stabilizedBoundingBox}
                detectedFormat={liveDetection?.format}
                confidence={liveDetection?.confidence}
                rawToken={liveDetection?.rawValue}
                isScanning={cameraStatus === 'CONNECTED'}
                lowLightWarning={liveMetrics?.lowLightWarning}
                tapFocusPoint={tapFocusPoint}
                onTapToFocus={handleTapToFocus}
                onPinchZoom={handlePinchZoom}
                scanSuccessFlash={scanFlash === 'success'}
              />
              
              {/* Camera Loading Overlay */}
              {cameraStatus !== 'CONNECTED' && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-30 pointer-events-none gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
                  <p className="text-sm font-bold tracking-wider animate-pulse">
                    {cameraStatus === 'CONNECTING' || cameraStatus === 'INITIALIZING' ? 'Menyiapkan Kamera V2...' : cameraStatus === 'DISCONNECTED' ? 'Kamera Terputus' : 'Kamera Error'}
                  </p>
                </div>
              )}
            </div>

            {/* Top Right Controls Overlay */}
            <div className="absolute top-6 right-6 z-30 flex flex-col gap-3 pointer-events-auto">
              <div className="flex bg-slate-900/80 backdrop-blur-md rounded-xl p-1 border border-white/10 shadow-xl">
                <button
                  onClick={() => handleScannerSwitch('USB')}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <Keyboard className="w-4 h-4" />
                  Ke USB Scanner
                </button>
              </div>

              {torchSupported && (
                <button
                  onClick={async () => {
                    if (adapterRef.current && typeof adapterRef.current.toggleTorch === 'function') {
                      const newStatus = await adapterRef.current.toggleTorch();
                      setTorchOn(newStatus);
                    }
                  }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border shadow-xl backdrop-blur-md ${
                    torchOn 
                      ? 'bg-amber-400 border-amber-300 text-amber-950' 
                      : 'bg-slate-900/80 border-white/10 text-white hover:bg-white/10'
                  }`}
                  title="Flashlight"
                >
                  {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
                </button>
              )}
            </div>

            {/* Developer Debug Panel Floating Modal */}
            {isDebugOpen && liveMetrics && (
              <div className="absolute top-6 left-6 z-40">
                <DebugPanel metrics={liveMetrics} onClose={() => setIsDebugOpen(false)} />
              </div>
            )}
            
            {/* Foreground: Result Panel overlay (Bottom Left) */}
            <div className="relative z-20 flex-1 p-6 lg:p-10 flex flex-col justify-end pointer-events-none">
              <div className="w-full max-w-2xl pointer-events-auto">
                <AnimatePresence mode="wait">
                  {latestScan && (
                    <motion.div
                      key={latestScan.timestamp.getTime()}
                      initial={{ opacity: 0, y: 50, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/20"
                    >
                      <StaffResultPanel scan={latestScan} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Foreground: Sidebar Panel (Right side) */}
            <div className="relative z-30 w-[380px] bg-slate-900/90 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl shrink-0">
              {/* Mode Switcher */}
              <div className="p-6 border-b border-white/10">
                <div className="flex p-1 bg-slate-800/80 rounded-xl mb-6">
                  <button
                    onClick={() => handleScannerSwitch('USB')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-400 hover:text-slate-200"
                  >
                    <Keyboard className="w-4 h-4" />
                    USB
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  >
                    <Camera className="w-4 h-4" />
                    Kamera
                  </button>
                </div>

                {/* Status Indicator */}
                <div className={`rounded-2xl p-4 border transition-all ${
                  displayedStatus === 'CONNECTED' 
                    ? 'bg-emerald-500/20 border-emerald-500/30' 
                    : displayedStatus === 'ERROR'
                      ? 'bg-red-500/20 border-red-500/30'
                      : 'bg-amber-500/20 border-amber-500/30'
                }`}>
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      displayedStatus === 'CONNECTED' 
                        ? 'bg-emerald-500 text-white'
                        : displayedStatus === 'ERROR'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-500 text-white'
                    }`}>
                      {displayedStatus === 'CONNECTED' && <CheckCircle2 className="w-6 h-6" />}
                      {displayedStatus === 'ERROR' && <XCircle className="w-6 h-6" />}
                      {displayedStatus !== 'CONNECTED' && displayedStatus !== 'ERROR' && (
                        <Activity className="w-6 h-6 animate-spin" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Status Kamera V2
                        </h3>
                      </div>
                      <p className="text-sm mt-0.5 font-bold text-white truncate">
                        {displayedStatus === 'CONNECTED' 
                          ? 'Scanner V2 Aktif'
                          : displayedStatus === 'ERROR'
                            ? 'Akses Ditolak'
                            : 'Menyiapkan...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Camera Controls */}
                <div className="mt-4 flex flex-col gap-3">
                  <div className="relative">
                    <select 
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-10 pr-8 py-3 text-xs font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                    >
                      {availableCameras.map(cam => (
                        <option key={cam.deviceId} value={cam.deviceId}>
                          {cam.label || `Kamera ${cam.deviceId.substring(0, 8)}`}
                        </option>
                      ))}
                    </select>
                    <Camera className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  
                  <div className="flex gap-2">
                    {torchSupported && (
                      <button
                        onClick={async () => {
                          if (adapterRef.current && typeof adapterRef.current.toggleTorch === 'function') {
                            const newStatus = await adapterRef.current.toggleTorch();
                            setTorchOn(newStatus);
                          }
                        }}
                        className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          torchOn 
                            ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-[0_0_15px_rgba(251,191,36,0.4)]' 
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {torchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                        Senter
                      </button>
                    )}
                    
                    {displayedStatus === 'CONNECTED' ? (
                      <button 
                        onClick={() => adapterRef.current?.stopCamera()}
                        className="flex-[2] py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold hover:bg-red-500/30 transition-colors"
                      >
                        Stop
                      </button>
                    ) : (
                      <button 
                        onClick={() => adapterRef.current?.startCamera(selectedCameraId || undefined)}
                        className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>

                {/* Manual Entry Fallback in Dark Mode */}
                <div className="mt-6">
                  <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Input Manual</h4>
                  <form onSubmit={handleManualScan} className="flex gap-2">
                    <input
                      name="token"
                      type="text"
                      placeholder="Ketik ID atau Token..."
                      className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-semibold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoComplete="off"
                    />
                    <button 
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm"
                    >
                      OK
                    </button>
                  </form>
                </div>
              </div>

              {/* Activity Feed Header */}
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  Riwayat
                </h3>
                <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-lg">
                  {recentScans.length}
                </span>
              </div>

              {/* Activity Feed List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {recentScans.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-slate-500 py-10"
                    >
                      <Clock className="w-10 h-10 mb-3 opacity-50" />
                      <p className="font-semibold text-xs uppercase tracking-wide">Belum ada scan.</p>
                    </motion.div>
                  ) : (
                    recentScans.map((scan, index) => (
                      <motion.div
                        key={scan.timestamp.getTime() + index}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`bg-slate-800/80 backdrop-blur-md rounded-xl p-4 border ${
                          scan.status === 'SUCCESS' ? 'border-emerald-500/20' : 'border-red-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            scan.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {scan.status === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className={`text-sm font-bold truncate ${scan.status === 'SUCCESS' ? 'text-slate-100' : 'text-red-400'}`}>
                                {scan.status === 'SUCCESS' ? getStaffName(scan.attendance?.staffId) : 'Ditolak'}
                              </h4>
                              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                {scan.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">
                              {scan.status === 'SUCCESS' ? scan.attendance?.institutionNameSnapshot : (scan.error?.message || 'Error')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================
             USB MODE - STANDARD LIGHT LAYOUT 
             ========================================= */
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Scanner & Activity List */}
            <div className="w-[420px] lg:w-[480px] bg-white border-r border-slate-200 flex flex-col shrink-0 relative z-10 shadow-lg">
              <div className="p-6 border-b border-slate-100 bg-slate-50">
                {/* Mode Switcher */}
                <div className="flex p-1 bg-slate-200/50 rounded-xl mb-4">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                  >
                    <Keyboard className="w-4 h-4" />
                    USB Scanner
                  </button>
                  <button
                    onClick={() => handleScannerSwitch('CAMERA')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                  >
                    <Camera className="w-4 h-4" />
                    Kamera
                  </button>
                </div>

                {/* Status Panel */}
                <div className={`rounded-2xl p-4 border transition-all ${
                  displayedStatus === 'CONNECTED'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950'
                    : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      displayedStatus === 'CONNECTED' 
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-400 text-white'
                    }`}>
                      {displayedStatus === 'CONNECTED' ? <CheckCircle2 className="w-6 h-6" /> : <Activity className="w-6 h-6 animate-spin" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Scanner USB
                        </h3>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
                          displayedStatus === 'CONNECTED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {displayedStatus === 'CONNECTED' ? 'AKTIF' : displayedStatus}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 font-semibold text-slate-700 truncate">
                        Standby - Siap menerima input barcode
                      </p>
                    </div>
                  </div>
                </div>

                {/* Manual Entry Fallback */}
                <div className="mt-4">
                  <form onSubmit={handleManualScan} className="flex gap-2">
                    <input
                      name="token"
                      type="text"
                      placeholder="Input manual ID..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                      autoComplete="off"
                    />
                    <button 
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm"
                    >
                      Proses
                    </button>
                  </form>
                </div>
              </div>

              {/* Activity Feed Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)] relative z-10">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" />
                  Riwayat Sesi Ini
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                  {recentScans.length}
                </span>
              </div>

              {/* Activity Feed List */}
              <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {recentScans.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-slate-400 py-10"
                    >
                      <Clock className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="font-semibold text-sm">Belum ada aktivitas.</p>
                    </motion.div>
                  ) : (
                    recentScans.map((scan, index) => (
                      <motion.div
                        key={scan.timestamp.getTime() + index}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`bg-white rounded-xl p-4 border shadow-sm ${
                          scan.status === 'SUCCESS' ? 'border-emerald-100' : 'border-red-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            scan.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                          }`}>
                            {scan.status === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className={`text-sm font-bold truncate ${scan.status === 'SUCCESS' ? 'text-slate-800' : 'text-red-700'}`}>
                                {scan.status === 'SUCCESS' ? getStaffName(scan.attendance?.staffId) : 'Ditolak'}
                              </h4>
                              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                {scan.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                              {scan.status === 'SUCCESS' ? scan.attendance?.institutionNameSnapshot : (scan.error?.message || 'Error')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: Large Result Panel */}
            <div className="flex-1 p-8 lg:p-12 overflow-y-auto flex flex-col items-center justify-center bg-slate-100/50 relative">
              <div className="w-full max-w-2xl">
                <StaffResultPanel scan={latestScan} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
