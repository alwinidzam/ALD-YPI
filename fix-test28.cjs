const fs = require('fs');
let sfCode = fs.readFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', 'utf8');

sfCode = sfCode.replace(
  "mockBarcodeRepo.findByToken.mockResolvedValue(undefined);",
  "mockBarcodeRepo.findByToken.mockResolvedValue(undefined);\n      vi.mocked(mockStaffRepo.findAll).mockResolvedValue([]);"
);

fs.writeFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', sfCode);
