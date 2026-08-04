const fs = require('fs');
let sfCode = fs.readFileSync('src/domains/attendance/__tests__/StaffService.test.ts', 'utf8');

// Ensure staff has primaryInstitution set in beforeEach
sfCode = sfCode.replace(
  "institutions: ['inst-1'],\n      createdAt:",
  "institutions: ['inst-1'],\n      primaryInstitution: 'inst-1',\n      createdAt:"
);

// We should mock out findById to return the updated validStaff. Wait, that should be covered by beforeEach.

fs.writeFileSync('src/domains/attendance/__tests__/StaffService.test.ts', sfCode);
