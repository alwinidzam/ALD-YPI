import fs from 'fs';
let code = fs.readFileSync('src/components/InstitutionDirectory.tsx', 'utf8');

if (!code.includes("const staffRepo = new FirestoreStaffRepository();")) {
  code = code.replace(
    "import { InstitutionType } from '../types';",
    "import { InstitutionType } from '../types';\nimport { FirestoreStaffRepository } from '../domains/attendance/repositories/FirestoreStaffRepository';\nconst staffRepo = new FirestoreStaffRepository();"
  );
  fs.writeFileSync('src/components/InstitutionDirectory.tsx', code);
}
