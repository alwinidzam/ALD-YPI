import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/dashboard/AttendanceDashboardPage.tsx', 'utf8');

code = code.replace(
  "export const AttendanceDashboardPage: React.FC = () => {",
  "export const AttendanceDashboardPage: React.FC<{ currentUser?: any }> = ({ currentUser }) => {"
);

code = code.replace(
  "const { attendances, stats, staffData } = useAttendanceDashboard();",
  "const { attendances, stats, staffData } = useAttendanceDashboard(currentUser);"
);

fs.writeFileSync('src/domains/attendance/ui/dashboard/AttendanceDashboardPage.tsx', code);
