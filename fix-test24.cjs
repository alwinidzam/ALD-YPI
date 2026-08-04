const fs = require('fs');
let sfCode = fs.readFileSync('src/domains/attendance/__tests__/StaffService.test.ts', 'utf8');

sfCode = sfCode.replace(
  "id: 'staff-1',",
  "id: 'staff-1',\n      primaryInstitution: 'inst-1',\n      employmentStatus: 'ACTIVE',"
);

// We should replace any occurences of mockResolvedValue(validStaff) with a deep clone to prevent mutation
// Actually let's just make sure softDelete is fixed

sfCode = sfCode.replace(
  "expect(service.suspendStaff('staff-1', 'op-1')).rejects.toThrow();",
  "expect(service.suspendStaff('staff-1', 'op-1')).rejects.toThrow();"
);
fs.writeFileSync('src/domains/attendance/__tests__/StaffService.test.ts', sfCode);
