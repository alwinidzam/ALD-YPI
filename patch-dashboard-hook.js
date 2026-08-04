import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/hooks/useAttendanceDashboard.ts', 'utf8');

code = code.replace(
  "export function useAttendanceDashboard() {",
  "export function useAttendanceDashboard(currentUser?: any) {\n  const allowedInstitution = currentUser?.role?.startsWith('ADMIN_') && currentUser.role !== 'SUPER_ADMIN' ? currentUser.role.replace('ADMIN_', '') : null;"
);

// update staff filtering
code = code.replace(
  "staffRepo.findAll().then(staffList => {",
  `staffRepo.findAll().then(staffListRaw => {
      const staffList = allowedInstitution 
        ? staffListRaw.filter(s => (s.institutions || []).map((i:any) => i.toUpperCase()).includes(allowedInstitution) || s.primaryInstitution?.toUpperCase() === allowedInstitution)
        : staffListRaw;`
);

// update attendance filtering
code = code.replace(
  "setAttendances(sorted);",
  `const filteredAttendances = allowedInstitution 
        ? sorted.filter(att => att.institutionNameSnapshot?.toUpperCase() === allowedInstitution || att.institutions?.map((i:any) => i.toUpperCase()).includes(allowedInstitution))
        : sorted;
      setAttendances(filteredAttendances);`
);

code = code.replace(
  "sorted.forEach(att => {",
  "filteredAttendances.forEach(att => {"
);

fs.writeFileSync('src/domains/attendance/ui/hooks/useAttendanceDashboard.ts', code);
