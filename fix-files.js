import fs from 'fs';

// 1. Fix InstitutionDirectory.tsx
let instCode = fs.readFileSync('src/components/InstitutionDirectory.tsx', 'utf8');
instCode = instCode.replace(
  "export function InstitutionDirectory({ onNavigate }: { onNavigate: (view: string) => void }) {",
  `export function InstitutionDirectory({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [allStaff, setAllStaff] = React.useState<any[]>([]);
  React.useEffect(() => {
    staffRepo.findAll().then(setAllStaff);
  }, []);

  const getTeacherCount = (instId: string, fallback: number) => {
    if (allStaff.length === 0) return fallback;
    const upperId = instId.toUpperCase();
    return allStaff.filter(s => s.institutions?.includes(upperId as any) || s.primaryInstitution === upperId).length;
  };`
);
fs.writeFileSync('src/components/InstitutionDirectory.tsx', instCode);

// 2. Fix AttendanceTable.tsx
let attCode = fs.readFileSync('src/domains/attendance/ui/dashboard/components/AttendanceTable.tsx', 'utf8');
attCode = attCode.replace(
  "export const AttendanceTable: React.FC<{ attendances: Attendance[] }> = ({ attendances }) => {",
  `export const AttendanceTable: React.FC<{ attendances: Attendance[], staffList: any[] }> = ({ attendances, staffList }) => {
  const getStaffName = (id: string) => {
    if (!staffList) return id;
    const s = staffList.find(x => x.id === id);
    return s ? s.fullName : id;
  };`
);
fs.writeFileSync('src/domains/attendance/ui/dashboard/components/AttendanceTable.tsx', attCode);

