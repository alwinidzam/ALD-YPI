const fs = require('fs');

let code = fs.readFileSync('src/domains/attendance/ui/scanner/ScannerPage.tsx', 'utf8');

code = code.replace(
  "{/* Darkened Viewfinder Overlay */}",
  `{/* Camera Loading Overlay */}
              {cameraStatus !== 'CONNECTED' && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-10 pointer-events-none gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
                  <p className="text-sm font-bold tracking-wider animate-pulse">
                    {cameraStatus === 'CONNECTING' || cameraStatus === 'INITIALIZING' ? 'Menyiapkan Kamera...' : cameraStatus === 'DISCONNECTED' ? 'Kamera Terputus' : 'Kamera Error'}
                  </p>
                </div>
              )}
              
              {/* Darkened Viewfinder Overlay */}`
);

fs.writeFileSync('src/domains/attendance/ui/scanner/ScannerPage.tsx', code);
