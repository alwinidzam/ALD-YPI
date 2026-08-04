const fs = require('fs');
let fb = fs.readFileSync('src/domains/attendance/__tests__/services/FirestoreAttendanceTransactionService.test.ts', 'utf8');

fb = fb.replace(
  "initializeFirestore: vi.fn(),\n    ",
  "initializeFirestore: vi.fn(),\n    setLogLevel: vi.fn(),\n    "
);
fs.writeFileSync('src/domains/attendance/__tests__/services/FirestoreAttendanceTransactionService.test.ts', fb);

let qsCode = fs.readFileSync('src/domains/attendance/__tests__/services/FirestoreAttendanceQueryService.test.ts', 'utf8');
qsCode = qsCode.replace(
  "initializeFirestore: vi.fn()\n  };",
  "initializeFirestore: vi.fn(),\n    setLogLevel: vi.fn()\n  };"
);
fs.writeFileSync('src/domains/attendance/__tests__/services/FirestoreAttendanceQueryService.test.ts', qsCode);
