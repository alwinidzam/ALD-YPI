const fs = require('fs');
let valCode = fs.readFileSync('src/domains/attendance/__tests__/Validators.test.ts', 'utf8');

valCode = valCode.replace(
  "primaryInstitution: 'YPI',",
  "institutions: ['YPI'], primaryInstitution: 'YPI',"
);

valCode = valCode.replace(
  "status: 'ACTIVE',",
  "employmentStatus: 'ACTIVE',"
);

valCode = valCode.replace(
  "status: 'ACTIVE',",
  "employmentStatus: 'ACTIVE',"
);

valCode = valCode.replace(
  "institutions: ['YPI'], institutions: ['YPI'], primaryInstitution: 'YPI',",
  "institutions: ['YPI'], primaryInstitution: 'YPI',"
);

fs.writeFileSync('src/domains/attendance/__tests__/Validators.test.ts', valCode);
