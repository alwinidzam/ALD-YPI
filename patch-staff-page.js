import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/staff/StaffManagementPage.tsx', 'utf8');

code = code.replace(
  "export const StaffManagementPage: React.FC<{\n  onClose: () => void;\n}> = ({ onClose }) => {",
  "export const StaffManagementPage: React.FC<{\n  currentUser: any;\n  onClose: () => void;\n}> = ({ currentUser, onClose }) => {"
);

// We need to filter staffList based on user's role.
code = code.replace(
  "const filtered = staffList.filter(s =>",
  `const allowedInstitution = currentUser?.role?.startsWith('ADMIN_') ? currentUser.role.replace('ADMIN_', '') : null;
  const adminFilteredStaff = allowedInstitution && currentUser.role !== 'SUPER_ADMIN'
    ? staffList.filter(s => (s.institutions || []).map((i:any) => i.toUpperCase()).includes(allowedInstitution) || s.primaryInstitution?.toUpperCase() === allowedInstitution)
    : staffList;

  const filtered = adminFilteredStaff.filter(s =>`
);

fs.writeFileSync('src/domains/attendance/ui/staff/StaffManagementPage.tsx', code);
