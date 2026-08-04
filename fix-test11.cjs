const fs = require('fs');

let fbCode = fs.readFileSync('src/firebase.ts', 'utf8');
fbCode = fbCode.replace(
  "import { initializeApp } from 'firebase/app';",
  "import { setLogLevel } from 'firebase/firestore';\nsetLogLevel('error');\nimport { initializeApp } from 'firebase/app';"
);
fs.writeFileSync('src/firebase.ts', fbCode);

let txCode = fs.readFileSync('src/domains/attendance/__tests__/services/FirestoreAttendanceTransactionService.test.ts', 'utf8');
txCode = txCode.replace(
  "Timestamp,\n    setLogLevel: vi.fn()",
  "Timestamp,\n    setLogLevel: vi.fn(),\n    initializeFirestore: vi.fn()"
);
fs.writeFileSync('src/domains/attendance/__tests__/services/FirestoreAttendanceTransactionService.test.ts', txCode);

