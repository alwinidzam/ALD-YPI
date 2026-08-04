const fs = require('fs');
let sfCode = fs.readFileSync('src/domains/attendance/__tests__/StaffService.test.ts', 'utf8');

sfCode = sfCode.replace(
  "id: 'staff-1',\n      primaryInstitution: 'inst-1',\n      employmentStatus: 'ACTIVE',\n      name: 'John Doe',",
  "id: 'staff-1',\n      name: 'John Doe',\n      employmentStatus: 'ACTIVE',\n      primaryInstitution: 'inst-1',"
);
// Make sure it doesn't just do nothing if replace string doesn't exist
// Let's explicitly replace in validStaff
let valCode = fs.readFileSync('src/domains/attendance/__tests__/Validators.test.ts', 'utf8');
valCode = valCode.replace(
  "institutions: [],",
  "institutions: ['inst-1'],\n        primaryInstitution: 'inst-1',"
);
valCode = valCode.replace(
  "institutions: ['inst1'],",
  "institutions: ['inst-1'],\n        primaryInstitution: 'inst-1',"
);
valCode = valCode.replace(
  "institutions: ['YPI'],\n        primaryInstitution: 'YPI',",
  "institutions: ['inst-1'],\n        primaryInstitution: 'inst-1',"
);
fs.writeFileSync('src/domains/attendance/__tests__/Validators.test.ts', valCode);
