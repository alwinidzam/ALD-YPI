const fs = require('fs');

let code = fs.readFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', 'utf8');
code = code.replace(
  "vi.mocked(mockStaffRepo.findById).mockResolvedValue(validStaff);",
  "vi.mocked(mockStaffRepo.findById).mockResolvedValue(validStaff);\n      vi.mocked(mockBarcodeRepo.findByToken).mockResolvedValue(validBarcode);"
);
fs.writeFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', code);
