import fs from 'fs';
let code = fs.readFileSync('src/components/InstitutionProfileView.tsx', 'utf8');

code = code.replace(
  'setTeacherName(teacher.fullName);',
  'setTeacherName(teacher.name);'
);

fs.writeFileSync('src/components/InstitutionProfileView.tsx', code);
