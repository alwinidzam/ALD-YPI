const fs = require('fs');

let code = fs.readFileSync('src/components/DocumentScannerModal.tsx', 'utf8');

code = code.replace(
  "import {",
  "import { toast } from '../lib/toastManager';\nimport {"
);

code = code.replace(
  "alert(err.message || 'Terjadi kesalahan saat memproses PDF. Silakan coba lagi.');",
  "toast.error(err.message || 'Terjadi kesalahan saat memproses PDF. Silakan coba lagi.');"
);

code = code.replace(
  /alert\(`Dokumen "\\\${title}" telah berhasil dipindai dan disimpan ke antrean upload.`\);/g,
  "toast.success(`Dokumen \"${title}\" telah berhasil dipindai dan diantrekan untuk unggah.`);"
);

fs.writeFileSync('src/components/DocumentScannerModal.tsx', code);
