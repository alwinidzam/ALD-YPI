import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/dashboard/components/AttendanceTable.tsx', 'utf8');

// We need to pass staffList to AttendanceTable
if (!code.includes("staffList: any[]")) {
  code = code.replace(
    "interface AttendanceTableProps {\n  attendances: Attendance[];\n}",
    "interface AttendanceTableProps {\n  attendances: Attendance[];\n  staffList: any[];\n}"
  );

  code = code.replace(
    "export const AttendanceTable: React.FC<AttendanceTableProps> = ({ attendances }) => {",
    "export const AttendanceTable: React.FC<AttendanceTableProps> = ({ attendances, staffList }) => {\n  const getStaffName = (id: string) => {\n    const s = staffList.find(x => x.id === id);\n    return s ? s.fullName : id;\n  };"
  );
  
  // replace {att.staffId} rendering
  code = code.replace(
    /<div className="text-sm font-bold text-slate-800">\{att\.staffId\}<\/div>/g,
    `<div className="text-sm font-bold text-slate-800">{getStaffName(att.staffId)}</div>`
  );
  
  // Also fix search to search by name
  code = code.replace(
    /att\.staffId\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)/g,
    "(getStaffName(att.staffId).toLowerCase().includes(searchQuery.toLowerCase()) || att.staffId.toLowerCase().includes(searchQuery.toLowerCase()))"
  );
  
  fs.writeFileSync('src/domains/attendance/ui/dashboard/components/AttendanceTable.tsx', code);
}
