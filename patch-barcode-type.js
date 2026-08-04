import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/staff/StaffManagementPage.tsx', 'utf8');

code = code.replace(
  /!s\.activeBarcodeId/g,
  '!s.barcodeToken'
);

code = code.replace(
  /staff\.activeBarcodeId/g,
  'staff.barcodeToken'
);

fs.writeFileSync('src/domains/attendance/ui/staff/StaffManagementPage.tsx', code);
