import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/barcode/BarcodeManagementModal.tsx', 'utf8');

code = code.replace(
  'if (staff.activeBarcodeId) {',
  'if (staff.barcodeToken) {'
);

fs.writeFileSync('src/domains/attendance/ui/barcode/BarcodeManagementModal.tsx', code);
