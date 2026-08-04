const fs = require('fs');

let code = fs.readFileSync('src/domains/attendance/__tests__/StaffService.test.ts', 'utf8');

// Fix getActiveStaffByInstitution test expectation
code = code.replace(
  "institutionId: 'YPI',",
  "institutions: ['YPI'],\n        primaryInstitution: 'YPI',"
);

// We need to carefully revert that wrong regex replace
code = code.replace(
  "institutionId: 'YPI',",
  "institutions: ['YPI'],\n        primaryInstitution: 'YPI',"
);

// Actually, wait, let's just rewrite the mockRepository.findAll call expectation
code = code.replace(
  "expect(mockRepository.findAll).toHaveBeenCalledWith({\n        institutions: ['YPI'],\n    primaryInstitution: 'YPI',\n        employmentStatus: 'ACTIVE',\n        isDeleted: false\n      });",
  "expect(mockRepository.findAll).toHaveBeenCalledWith({\n        institutionId: 'YPI',\n        employmentStatus: 'ACTIVE',\n        isDeleted: false\n      });"
);


fs.writeFileSync('src/domains/attendance/__tests__/StaffService.test.ts', code);

// AttendanceValidator test fix
let valTestCode = fs.readFileSync('src/domains/attendance/__tests__/Validators.test.ts', 'utf8');
valTestCode = valTestCode.replace(
  "status: 'PRESENT',",
  "status: 'PRESENT',\n        institutions: ['YPI'],"
);
fs.writeFileSync('src/domains/attendance/__tests__/Validators.test.ts', valTestCode);

