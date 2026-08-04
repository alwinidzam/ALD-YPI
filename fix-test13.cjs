const fs = require('fs');

let txCode = fs.readFileSync('src/domains/attendance/__tests__/services/FirestoreAttendanceTransactionService.test.ts', 'utf8');
txCode = txCode.replace(
  "initializeFirestore: vi.fn()\n    };\n});",
  "initializeFirestore: vi.fn(),\n    setLogLevel: vi.fn()\n    };\n});"
);

// Actually, wait, let's just make it right.
txCode = txCode.replace(
  "initializeFirestore: vi.fn()\n  };\n});",
  "initializeFirestore: vi.fn(),\n    setLogLevel: vi.fn()\n  };\n});"
);

// We need to just write a simple script to fix that file
