import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/staff/StaffManagementPage.tsx', 'utf8');

code = code.replace(
  '<StaffFormModal\n        isOpen={isFormOpen}\n        onClose={() => setIsFormOpen(false)}\n        staff={editingStaff}\n        onSuccess={() => loadStaff()}\n      />',
  '<StaffFormModal\n        currentUser={currentUser}\n        isOpen={isFormOpen}\n        onClose={() => setIsFormOpen(false)}\n        staff={editingStaff}\n        onSuccess={() => loadStaff()}\n      />'
);

fs.writeFileSync('src/domains/attendance/ui/staff/StaffManagementPage.tsx', code);
