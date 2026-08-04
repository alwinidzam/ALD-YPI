const fs = require('fs');

let valTestCode = fs.readFileSync('src/domains/attendance/__tests__/Validators.test.ts', 'utf8');

// Fix primaryInstitution in Validators
valTestCode = valTestCode.replace(
  "institutions: ['YPI'],",
  "institutions: ['YPI'],\n        primaryInstitution: 'YPI',"
);

// We should be careful not to duplicate it if it's already there
fs.writeFileSync('src/domains/attendance/__tests__/Validators.test.ts', valTestCode);

