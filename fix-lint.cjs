const fs = require('fs');

// 1. Fix PdfViewer.tsx
let pdfViewer = fs.readFileSync('src/components/PdfViewer.tsx', 'utf8');
if (!pdfViewer.includes("import { motion } from 'motion/react';")) {
  pdfViewer = pdfViewer.replace(
    "import React, ",
    "import { motion } from 'motion/react';\nimport React, "
  );
  fs.writeFileSync('src/components/PdfViewer.tsx', pdfViewer);
}

// 2. Fix UserManagementView.tsx
let userMgmt = fs.readFileSync('src/components/UserManagementView.tsx', 'utf8');
if (!userMgmt.includes("import { toast } from '../lib/toastManager';")) {
  userMgmt = userMgmt.replace(
    "import {",
    "import { toast } from '../lib/toastManager';\nimport {"
  );
  fs.writeFileSync('src/components/UserManagementView.tsx', userMgmt);
}

// 3. Fix ScannerPage.tsx
let scannerPage = fs.readFileSync('src/domains/attendance/ui/scanner/ScannerPage.tsx', 'utf8');
// Check if setScanFlash is defined
if (!scannerPage.includes("const [scanFlash, setScanFlash]")) {
  scannerPage = scannerPage.replace(
    "export function ScannerPage() {",
    "export function ScannerPage() {\n  const [scanFlash, setScanFlash] = useState<'success' | 'error' | 'duplicate' | null>(null);\n  const [hasTorch, setHasTorch] = useState(false);\n  const [isTorchOn, setIsTorchOn] = useState(false);\n  const handleToggleTorch = () => {};\n"
  );
}
if (!scannerPage.includes("import { feedbackService }")) {
  scannerPage = scannerPage.replace(
    "import {",
    "import { feedbackService } from '../../../../lib/FeedbackService';\nimport {"
  );
}
if (!scannerPage.includes("Loader2,")) {
  scannerPage = scannerPage.replace(
    "import { Activity,",
    "import { Activity, Loader2, Zap, ZapOff, "
  );
}

fs.writeFileSync('src/domains/attendance/ui/scanner/ScannerPage.tsx', scannerPage);

