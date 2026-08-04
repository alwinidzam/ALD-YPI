const fs = require('fs');

// 1. Fix StaffService.test.ts (institutions array vs institutionId)
let staffServiceCode = fs.readFileSync('src/domains/attendance/services/StaffService.ts', 'utf8');
let staffTestCode = fs.readFileSync('src/domains/attendance/__tests__/StaffService.test.ts', 'utf8');
staffTestCode = staffTestCode.replace(
  "institutions: ['YPI'],",
  "institutionId: 'YPI',"
);
fs.writeFileSync('src/domains/attendance/__tests__/StaffService.test.ts', staffTestCode);

// 2. Fix StaffValidator.ts (primaryInstitution vs institution array check logic in test)
let valTestCode = fs.readFileSync('src/domains/attendance/__tests__/Validators.test.ts', 'utf8');
valTestCode = valTestCode.replace(
  "institutions: ['YPI'],",
  "institutions: ['YPI'],\n        primaryInstitution: 'YPI',"
);
fs.writeFileSync('src/domains/attendance/__tests__/Validators.test.ts', valTestCode);

// 3. Fix StaffService test for createStaff
staffTestCode = fs.readFileSync('src/domains/attendance/__tests__/StaffService.test.ts', 'utf8');
staffTestCode = staffTestCode.replace(
  "institutions: ['YPI'],",
  "institutions: ['YPI'],\n    primaryInstitution: 'YPI',"
);
fs.writeFileSync('src/domains/attendance/__tests__/StaffService.test.ts', staffTestCode);


// 4. Fix DuplicateAttendanceError mapping in test
let attTestCode = fs.readFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', 'utf8');
attTestCode = attTestCode.replace(
  "checkIn: new Date()",
  "checkIn: new Date(),\n        staff: validStaff"
);
// The mock return value for findByStaffAndDate was missing staff info, let's just make validAttendance complete
fs.writeFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', attTestCode);
