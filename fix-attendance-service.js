import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/services/AttendanceService.ts', 'utf8');

code = code.replace(
  'staff = await this.staffRepo.findById(barcodeToken);',
  `const allStaff = await this.staffRepo.findAll();
        staff = allStaff.find(s => s.barcodeToken === barcodeToken || s.id === barcodeToken);`
);

fs.writeFileSync('src/domains/attendance/services/AttendanceService.ts', code);
