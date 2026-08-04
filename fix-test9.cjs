const fs = require('fs');

let txCode = fs.readFileSync('src/domains/attendance/__tests__/services/FirestoreAttendanceTransactionService.test.ts', 'utf8');
txCode = txCode.replace(
  "import { setLogLevel } from 'firebase/firestore';",
  "// removed"
);
fs.writeFileSync('src/domains/attendance/__tests__/services/FirestoreAttendanceTransactionService.test.ts', txCode);

let svcTestCode = fs.readFileSync('src/domains/attendance/__tests__/StaffService.test.ts', 'utf8');
// Fix the validation failed error in StaffService (it says "At least one institution is required")
// This is because we set institutionId instead of institutions in params

svcTestCode = svcTestCode.replace(
  "const { id, createdAt, updatedAt, schemaVersion, isDeleted, createdBy, updatedBy, ...params } = validStaff;",
  "const { id, createdAt, updatedAt, schemaVersion, isDeleted, createdBy, updatedBy, ...params } = validStaff;\n      params.institutions = ['YPI']; params.primaryInstitution = 'YPI';"
);
fs.writeFileSync('src/domains/attendance/__tests__/StaffService.test.ts', svcTestCode);

