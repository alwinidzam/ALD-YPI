const fs = require('fs');

let fbCode = fs.readFileSync('src/firebase.ts', 'utf8');
fbCode = fbCode.replace(
  "import { setLogLevel } from 'firebase/firestore';\nsetLogLevel('error');",
  ""
);
fs.writeFileSync('src/firebase.ts', fbCode);

let svcTestCode = fs.readFileSync('src/domains/attendance/__tests__/StaffService.test.ts', 'utf8');
// Fix getActiveStaffByInstitution
svcTestCode = svcTestCode.replace(
  "expect(mockRepository.findAll).toHaveBeenCalledWith({\n        institutionId: 'YPI',\n        employmentStatus: 'ACTIVE',\n        isDeleted: false\n      });",
  "expect(mockRepository.findAll).toHaveBeenCalledWith({\n        institutions: ['YPI'],\n        employmentStatus: 'ACTIVE',\n        isDeleted: false\n      });"
);

// We need to fix the actual service logic
let svcCode = fs.readFileSync('src/domains/attendance/services/StaffService.ts', 'utf8');
svcCode = svcCode.replace(
  "institutionId,",
  "institutions: [institutionId],"
);
fs.writeFileSync('src/domains/attendance/services/StaffService.ts', svcCode);


fs.writeFileSync('src/domains/attendance/__tests__/StaffService.test.ts', svcTestCode);

