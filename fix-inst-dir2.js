import fs from 'fs';
let code = fs.readFileSync('src/components/InstitutionDirectory.tsx', 'utf8');

code = code.replace(
  "return allStaff.filter(s => s.institutions?.includes(instId as any) || s.primaryInstitution === instId).length;",
  "const upperId = instId.toUpperCase();\n    return allStaff.filter(s => s.institutions?.includes(upperId as any) || s.primaryInstitution === upperId).length;"
);

// We need to replace instances of `inst.stats.teachers` when rendering.
// Let's find where they are rendered.
code = code.replace(
  /{inst\.stats\.teachers}/g,
  "{getTeacherCount(inst.id, inst.stats.teachers)}"
);

fs.writeFileSync('src/components/InstitutionDirectory.tsx', code);
