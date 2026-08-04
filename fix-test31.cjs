const fs = require('fs');
let valCode = fs.readFileSync('src/domains/attendance/__tests__/Validators.test.ts', 'utf8');

valCode = valCode.replace(
  /primaryInstitution: 'YPI',/g,
  "institutions: ['YPI'], primaryInstitution: 'YPI',"
);

// We need to fix the duplicate institutions just in case
valCode = valCode.replace(/institutions: \['YPI'\], institutions: \['YPI'\], primaryInstitution: 'YPI',/g, "institutions: ['YPI'], primaryInstitution: 'YPI',");

fs.writeFileSync('src/domains/attendance/__tests__/Validators.test.ts', valCode);

let polCode = fs.readFileSync('src/domains/attendance/__tests__/AttendancePolicy.test.ts', 'utf8');
polCode = polCode.replace("const barcode = { token: 'T1', employmentStatus: 'ACTIVE' } as any", "const barcode = { token: 'T1', status: 'ACTIVE' } as any");
fs.writeFileSync('src/domains/attendance/__tests__/AttendancePolicy.test.ts', polCode);

let svCode = fs.readFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', 'utf8');
svCode = svCode.replace(
  "vi.mocked(mockBarcodeRepo.findByToken).mockResolvedValue(null);",
  "vi.mocked(mockBarcodeRepo.findByToken).mockResolvedValue(null);\n      vi.mocked(mockStaffRepo.findAll).mockResolvedValue([]);"
);
fs.writeFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', svCode);

