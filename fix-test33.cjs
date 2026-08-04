const fs = require('fs');
let polCode = fs.readFileSync('src/domains/attendance/__tests__/AttendancePolicy.test.ts', 'utf8');
polCode = polCode.replace(/employmentStatus/g, "status");
fs.writeFileSync('src/domains/attendance/__tests__/AttendancePolicy.test.ts', polCode);
