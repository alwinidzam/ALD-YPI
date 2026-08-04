const fs = require('fs');

let attTestCode = fs.readFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', 'utf8');
attTestCode = attTestCode.replace(
  "checkIn: new Date() // just checked in",
  "checkIn: new Date(),\n        staff: validStaff // just checked in"
);
fs.writeFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', attTestCode);
