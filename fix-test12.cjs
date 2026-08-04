const fs = require('fs');

let txCode = fs.readFileSync('src/domains/attendance/__tests__/services/FirestoreAttendanceTransactionService.test.ts', 'utf8');
txCode = txCode.replace(
  "initializeFirestore: vi.fn()\n  };\n});",
  "// removed initializeFirestore here\n  };\n});"
);

fs.writeFileSync('src/domains/attendance/__tests__/services/FirestoreAttendanceTransactionService.test.ts', txCode);

let policyTestCode = fs.readFileSync('src/domains/attendance/__tests__/AttendancePolicy.test.ts', 'utf8');
policyTestCode = policyTestCode.replace(
  "isDeleted: false } as Staff;",
  "isDeleted: false, employmentStatus: 'ACTIVE' } as Staff;"
);
fs.writeFileSync('src/domains/attendance/__tests__/AttendancePolicy.test.ts', policyTestCode);

let attCode = fs.readFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', 'utf8');
attCode = attCode.replace(
  "TypeError {",
  "UnknownBarcodeError {"
);
fs.writeFileSync('src/domains/attendance/__tests__/AttendanceService.test.ts', attCode);
