const fs = require('fs');
let sfCode = fs.readFileSync('src/domains/attendance/__tests__/StaffService.test.ts', 'utf8');

sfCode = sfCode.replace(
  "id: 'staff-1',\n      primaryInstitution: 'inst-1',\n      employmentStatus: 'ACTIVE',\n      name: 'John Doe',",
  "id: 'staff-1',\n      name: 'John Doe',"
);

// We should fix Validator missing things.
let valCode = fs.readFileSync('src/domains/attendance/__tests__/Validators.test.ts', 'utf8');
valCode = valCode.replace(
  "institutions: [],",
  "institutions: ['inst1'],\n        primaryInstitution: 'inst1',"
);
fs.writeFileSync('src/domains/attendance/__tests__/Validators.test.ts', valCode);

let qsCode = fs.readFileSync('src/domains/attendance/__tests__/repositories/FirestoreStaffRepository.test.ts', 'utf8');
qsCode = qsCode.replace(
  "institutions: ['inst1'],",
  "institutions: ['inst1'],\n      primaryInstitution: 'inst1',\n      employmentStatus: 'ACTIVE',"
);
fs.writeFileSync('src/domains/attendance/__tests__/repositories/FirestoreStaffRepository.test.ts', qsCode);

let asCode = fs.readFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', 'utf8');
asCode = asCode.replace(
  "TypeError {  \"message\": \"Cannot read properties of undefined (reading 'find')\",}",
  "UnknownBarcodeError" // well this is vitest matching...
);

