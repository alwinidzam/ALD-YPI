const fs = require('fs');
let sfCode = fs.readFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', 'utf8');
sfCode = sfCode.replace(
  "mockBarcodeRepo.findByToken.mockResolvedValue(null);",
  "mockBarcodeRepo.findByToken.mockResolvedValue(undefined);"
);
// Make sure mock is right.
sfCode = sfCode.replace(
  "mockResolvedValue(null);",
  "mockResolvedValue(undefined);"
);
fs.writeFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', sfCode);
