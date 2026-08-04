const fs = require('fs');
let code = fs.readFileSync('src/components/DocumentScannerModal.tsx', 'utf8');

code = code.replace(/flex-1 py-2\.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1\.5/g, 
'soft-button-primary flex-1');

code = code.replace(/px-6 py-2\.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50/g, 
'soft-button-primary px-6');

fs.writeFileSync('src/components/DocumentScannerModal.tsx', code);
