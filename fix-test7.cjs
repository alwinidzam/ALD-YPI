const fs = require('fs');

// 1. Fix AttendancePolicy test (status -> employmentStatus)
let code = fs.readFileSync('src/domains/attendance/__tests__/AttendancePolicy.test.ts', 'utf8');
code = code.replace(/status: 'ACTIVE'/g, "employmentStatus: 'ACTIVE'");
code = code.replace(/status: 'SUSPENDED'/g, "employmentStatus: 'SUSPENDED'");
fs.writeFileSync('src/domains/attendance/__tests__/AttendancePolicy.test.ts', code);

// 2. Fix setLogLevel missing in mock
let txCode = fs.readFileSync('src/domains/attendance/__tests__/services/FirestoreAttendanceTransactionService.test.ts', 'utf8');
txCode = txCode.replace(
  "Timestamp\n  };\n});",
  "Timestamp,\n    setLogLevel: vi.fn()\n  };\n});"
);
fs.writeFileSync('src/domains/attendance/__tests__/services/FirestoreAttendanceTransactionService.test.ts', txCode);

// 3. Fix AttendanceValidator test again for real this time
let valCode = fs.readFileSync('src/domains/attendance/__tests__/Validators.test.ts', 'utf8');
valCode = valCode.replace(
  "id: 'att-1',",
  "id: 'att-1',\n        institutions: ['YPI'],\n        primaryInstitution: 'YPI',"
);
fs.writeFileSync('src/domains/attendance/__tests__/Validators.test.ts', valCode);

