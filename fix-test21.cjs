const fs = require('fs');
let sfCode = fs.readFileSync('src/domains/attendance/__tests__/StaffService.test.ts', 'utf8');

sfCode = sfCode.replace(
  "validStaff = {",
  "validStaff = {\n      primaryInstitution: 'inst-1',\n      employmentStatus: 'ACTIVE',"
);

// try replace the right one if it failed before
sfCode = sfCode.replace(
  "primaryInstitution: 'inst-1',\n      employmentStatus: 'ACTIVE',\n      id: 'staff-1',",
  "id: 'staff-1',"
);


fs.writeFileSync('src/domains/attendance/__tests__/StaffService.test.ts', sfCode);

let vpCode = fs.readFileSync('src/domains/attendance/__tests__/AttendancePolicy.test.ts', 'utf8');
vpCode = vpCode.replace(
  "const staff = { id: 'S1', employmentStatus: 'ACTIVE', isDeleted: false } as Staff;",
  "const staff = { id: 'S1', employmentStatus: 'ACTIVE', isDeleted: false, primaryInstitution: 'inst1' } as Staff;"
);
vpCode = vpCode.replace(
  "const barcode = { token: 'T1', employmentStatus: 'ACTIVE' } as BarcodeDocument;",
  "const barcode = { token: 'T1', employmentStatus: 'ACTIVE', staffId: 'S1' } as BarcodeDocument;"
);
fs.writeFileSync('src/domains/attendance/__tests__/AttendancePolicy.test.ts', vpCode);

let valCode = fs.readFileSync('src/domains/attendance/__tests__/Validators.test.ts', 'utf8');
// Fix staff validator failure
valCode = valCode.replace(
  "institutions: [],",
  "institutions: ['inst1'], primaryInstitution: 'inst1',"
);
fs.writeFileSync('src/domains/attendance/__tests__/Validators.test.ts', valCode);
