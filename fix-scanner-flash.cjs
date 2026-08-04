const fs = require('fs');

let code = fs.readFileSync('src/domains/attendance/ui/scanner/ScannerPage.tsx', 'utf8');

if (!code.includes('scanFlash')) {
  code = code.replace(
    "const [hasTorch, setHasTorch] = useState(false);",
    "const [hasTorch, setHasTorch] = useState(false);\n  const [scanFlash, setScanFlash] = useState<'success' | 'error' | 'duplicate' | null>(null);"
  );
  
  code = code.replace(
    "import { Activity, LogOut, CheckCircle2, FileX2, Loader2, Camera, Keyboard, Smartphone, Clock, ShieldAlert, History, Zap, ZapOff } from 'lucide-react';",
    "import { Activity, LogOut, CheckCircle2, FileX2, Loader2, Camera, Keyboard, Smartphone, Clock, ShieldAlert, History, Zap, ZapOff } from 'lucide-react';\nimport { feedbackService } from '../../../../lib/FeedbackService';"
  );
  
  code = code.replace(
    "const result: ScanResultProps = { attendance, status: 'SUCCESS', timestamp: new Date() };\n      setLatestScan(result);",
    `const result: ScanResultProps = { attendance, status: 'SUCCESS', timestamp: new Date() };
      setLatestScan(result);
      
      const isDuplicate = error?.message?.toLowerCase().includes('sudah');
      if (attendance.status === 'LATE' || attendance.status === 'ON_TIME' || attendance.status === 'EARLY') {
        setScanFlash('success');
        feedbackService.notify('success');
      }
      setTimeout(() => setScanFlash(null), 400);`
  );
  
  // Wait, in onScanSuccess, `error` is not defined. Duplicate might be in onScanError.
  code = code.replace(
    "const result: ScanResultProps = { attendance, status: 'SUCCESS', timestamp: new Date() };\n      setLatestScan(result);\n      \n      const isDuplicate = error?.message?.toLowerCase().includes('sudah');\n      if (attendance.status === 'LATE' || attendance.status === 'ON_TIME' || attendance.status === 'EARLY') {\n        setScanFlash('success');\n        feedbackService.notify('success');\n      }\n      setTimeout(() => setScanFlash(null), 400);",
    `const result: ScanResultProps = { attendance, status: 'SUCCESS', timestamp: new Date() };
      setLatestScan(result);
      setScanFlash('success');
      feedbackService.notify('success');
      setTimeout(() => setScanFlash(null), 400);`
  );

  code = code.replace(
    "const result: ScanResultProps = { error, status: 'ERROR', timestamp: new Date() };\n        setLatestScan(result);",
    `const result: ScanResultProps = { error, status: 'ERROR', timestamp: new Date() };
        setLatestScan(result);
        const isDuplicate = error.message.toLowerCase().includes('sudah');
        setScanFlash(isDuplicate ? 'duplicate' : 'error');
        feedbackService.notify(isDuplicate ? 'warning' : 'error');
        setTimeout(() => setScanFlash(null), 500);`
  );
  
  // Add visual flash overlay to the view
  code = code.replace(
    "{/* Camera Controls Overlay (Top Right) */}",
    `{/* Visual Flash Overlay */}
            {scanFlash && (
              <div className={\`absolute inset-0 z-30 pointer-events-none transition-colors duration-200 \${
                scanFlash === 'success' ? 'bg-emerald-500/30' :
                scanFlash === 'duplicate' ? 'bg-amber-500/40' :
                'bg-red-500/40'
              }\`} />
            )}
            
            {/* Camera Controls Overlay (Top Right) */}`
  );
  
  fs.writeFileSync('src/domains/attendance/ui/scanner/ScannerPage.tsx', code);
}
