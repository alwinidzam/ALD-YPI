import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "<StaffManagementPage onClose={() => setCurrentView('attendance-dashboard')} />",
  "<StaffManagementPage currentUser={currentUser} onClose={() => setCurrentView('attendance-dashboard')} />"
);

code = code.replace(
  "<AttendanceDashboardPage />",
  "<AttendanceDashboardPage currentUser={currentUser} />"
);

fs.writeFileSync('src/App.tsx', code);
