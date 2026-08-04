import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/staff/StaffFormModal.tsx', 'utf8');

code = code.replace(/schemaVersion: 1,\n          barcodeToken: `YPI-STAFF-\$\{Date.now\(\)\}`,\n          barcodeToken: `YPI-STAFF-\$\{Date.now\(\)\}`,/g, 'schemaVersion: 1,');
code = code.replace(/schemaVersion: 1,\n          barcodeToken: `YPI-STAFF-\$\{Date.now\(\)\}`,/g, 'schemaVersion: 1,');

code = code.replace(
  /employmentType,\n\s+status,/g,
  "employmentType,\n          employmentStatus: status,\n          accountStatus: 'NO_ACCOUNT',"
);
code = code.replace(
  /schemaVersion: 1,/g,
  "schemaVersion: 1,\n          barcodeToken: `YPI-STAFF-${Date.now()}`,"
);

fs.writeFileSync('src/domains/attendance/ui/staff/StaffFormModal.tsx', code);
