import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/staff/StaffFormModal.tsx', 'utf8');

code = code.replace(
  "interface StaffFormModalProps {",
  "interface StaffFormModalProps {\n  currentUser?: any;"
);

code = code.replace(
  "export const StaffFormModal: React.FC<StaffFormModalProps> = ({",
  "export const StaffFormModal: React.FC<StaffFormModalProps> = ({\n  currentUser,"
);

code = code.replace(
  "const [institutionId, setInstitutionId] = useState<InstitutionType>('SMA');",
  "const [institutionId, setInstitutionId] = useState<InstitutionType>(currentUser?.role?.startsWith('ADMIN_') && currentUser.role !== 'SUPER_ADMIN' ? (currentUser.role.replace('ADMIN_', '') as InstitutionType) : 'SMA');"
);

code = code.replace(
  '<select\n                required\n                value={institutionId}\n                onChange={(e) => setInstitutionId(e.target.value as InstitutionType)}',
  `<select
                required
                value={institutionId}
                disabled={currentUser?.role?.startsWith('ADMIN_') && currentUser.role !== 'SUPER_ADMIN'}
                onChange={(e) => setInstitutionId(e.target.value as InstitutionType)}`
);

fs.writeFileSync('src/domains/attendance/ui/staff/StaffFormModal.tsx', code);
