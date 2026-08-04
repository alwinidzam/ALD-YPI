const fs = require('fs');

let attTestCode = fs.readFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', 'utf8');
attTestCode = attTestCode.replace(
  "mockBarcodeRepo = {\n      findByStaff: vi.fn(),\n    };",
  "mockBarcodeRepo = {\n      findByStaff: vi.fn(),\n      findByToken: vi.fn(),\n    };"
);

// also let's make sure it's actually initialized in beforeEach
attTestCode = attTestCode.replace(
  "mockBarcodeRepo = {",
  "mockBarcodeRepo = {\n      findByToken: vi.fn(),"
);

fs.writeFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', attTestCode);
