import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/barcode/BarcodeManagementModal.tsx', 'utf8');

code = code.replace(
  'await barcodeService.recordPrint(activeBarcode.id, "OP-SYSTEM");',
  'if (activeBarcode.id) await barcodeService.recordPrint(activeBarcode.id, "OP-SYSTEM");'
);

fs.writeFileSync('src/domains/attendance/ui/barcode/BarcodeManagementModal.tsx', code);
