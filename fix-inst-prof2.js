import fs from 'fs';
let code = fs.readFileSync('src/components/InstitutionProfileView.tsx', 'utf8');

code = code.replace(
  "const instStaff = allStaff.filter(s => s.institutions?.includes(institutionId as any) || s.primaryInstitution === (institutionId as any));",
  "const upperId = institutionId.toUpperCase();\n        const instStaff = allStaff.filter(s => (s.institutions || []).map((x: string) => x.toUpperCase()).includes(upperId) || s.primaryInstitution?.toUpperCase() === upperId);"
);

// We should also replace `teacher.name.charAt(0)` with `teacher.fullName.charAt(0)`
code = code.replace(
  /teacher\.name/g,
  "teacher.fullName"
);

fs.writeFileSync('src/components/InstitutionProfileView.tsx', code);
