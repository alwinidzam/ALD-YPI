const fs = require('fs');
let sfCode = fs.readFileSync('src/domains/attendance/__tests__/StaffService.test.ts', 'utf8');

sfCode = sfCode.replace(
  "id: 'staff-1',\n      primaryInstitution: 'inst-1',\n      employmentStatus: 'ACTIVE',\n    fullName: 'John Doe',\n    institutions: ['YPI'],\n    primaryInstitution: 'YPI',\n    role: 'TEACHER',",
  "id: 'staff-1',\n    employmentStatus: 'ACTIVE',\n    fullName: 'John Doe',\n    institutions: ['YPI'],\n    primaryInstitution: 'YPI',\n    role: 'TEACHER',"
);
fs.writeFileSync('src/domains/attendance/__tests__/StaffService.test.ts', sfCode);
