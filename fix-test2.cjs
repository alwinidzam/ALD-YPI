const fs = require('fs');

let code = fs.readFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', 'utf8');

// Fix staff properties to match Staff type
code = code.replace(
  "name: 'John Doe',",
  "fullName: 'John Doe',"
);
code = code.replace(
  "institutionId: 'YPI',",
  "institutions: ['YPI'], primaryInstitution: 'YPI',"
);
code = code.replace(
  "status: 'ACTIVE',",
  "employmentStatus: 'ACTIVE',"
);

fs.writeFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', code);
