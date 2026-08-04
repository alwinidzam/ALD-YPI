const fs = require('fs');

// Fix PdfViewer.tsx
let pdfCode = fs.readFileSync('src/components/PdfViewer.tsx', 'utf8');
if (!pdfCode.includes("import { motion }")) {
  pdfCode = pdfCode.replace(
    "import React, { useEffect, useRef, useState } from 'react';",
    "import React, { useEffect, useRef, useState } from 'react';\nimport { motion } from 'motion/react';"
  );
  fs.writeFileSync('src/components/PdfViewer.tsx', pdfCode);
}

// Fix ScannerPage.tsx
let scannerCode = fs.readFileSync('src/domains/attendance/ui/scanner/ScannerPage.tsx', 'utf8');
if (!scannerCode.includes('isTorchOn')) {
  scannerCode = scannerCode.replace(
    "const [cameraStatus, setCameraStatus] = useState<ScannerConnectionStatus>('DISCONNECTED');",
    `const [cameraStatus, setCameraStatus] = useState<ScannerConnectionStatus>('DISCONNECTED');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  
  useEffect(() => {
    let interval: any;
    if (cameraStatus === 'CONNECTED' && adapterRef.current) {
      interval = setInterval(() => {
        const supported = (adapterRef.current as any).isTorchSupported?.();
        if (hasTorch !== supported) setHasTorch(supported);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cameraStatus, hasTorch]);
  
  const handleToggleTorch = async () => {
    if (adapterRef.current && (adapterRef.current as any).toggleTorch) {
      const isOn = await (adapterRef.current as any).toggleTorch();
      setIsTorchOn(isOn);
    }
  };`
  );
  if (!scannerCode.includes('Zap,')) {
    scannerCode = scannerCode.replace(
      "import { Activity, LogOut, CheckCircle2, FileX2, Loader2, Camera, Keyboard, Smartphone, Clock, ShieldAlert, History } from 'lucide-react';",
      "import { Activity, LogOut, CheckCircle2, FileX2, Loader2, Camera, Keyboard, Smartphone, Clock, ShieldAlert, History, Zap, ZapOff } from 'lucide-react';"
    );
  }
  fs.writeFileSync('src/domains/attendance/ui/scanner/ScannerPage.tsx', scannerCode);
}

// Fix pdfAccountGenerator.ts
let pdfGenCode = fs.readFileSync('src/lib/pdfAccountGenerator.ts', 'utf8');
// The issue is `doc` type or `jsPDF` type missing since the import was removed.
if (pdfGenCode.includes("const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([")) {
  // We can just add type import back
  if (!pdfGenCode.includes("import type { jsPDF as JsPDFType }")) {
    pdfGenCode = "import type { jsPDF as JsPDFType } from 'jspdf';\n" + pdfGenCode;
    // Replace doc definition if it has an explicit type using jsPDF? 
    // Actually the error is: `Cannot find name 'jsPDF'` at line 70. Let's see what is on line 70.
  }
  fs.writeFileSync('src/lib/pdfAccountGenerator.ts', pdfGenCode);
}
