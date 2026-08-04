import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/staff/StaffManagementPage.tsx', 'utf8');

if (!code.includes("barcodeService")) {
  code = code.replace(
    "import { BarcodeManagementModal } from '../barcode/BarcodeManagementModal';",
    "import { BarcodeManagementModal } from '../barcode/BarcodeManagementModal';\nimport { BarcodeService } from '../../services/BarcodeService';\nimport { FirestoreBarcodeRepository } from '../../repositories/FirestoreBarcodeRepository';\nconst barcodeService = new BarcodeService(new FirestoreBarcodeRepository());"
  );
  
  code = code.replace(
    "const data = await staffRepo.findAll();",
    `const data = await staffRepo.findAll();
      
      // Auto-generate barcodes for any staff missing them
      let needsReload = false;
      for (const s of data) {
        if (!s.activeBarcodeId) {
          try {
            await barcodeService.generateForStaff(s.id, 'SYSTEM_AUTO');
            needsReload = true;
          } catch(e) {
            console.error("Auto barcode gen failed for", s.id, e);
          }
        }
      }
      
      if (needsReload) {
        const updatedData = await staffRepo.findAll();
        setStaffList(updatedData);
      } else {
        setStaffList(data);
      }`
  );
  
  // Also remove `setStaffList(data);` since we handle it in the if/else block above.
  code = code.replace(
    /const data = await staffRepo\.findAll\(\);\s*setStaffList\(data\);/g,
    `const data = await staffRepo.findAll();
      
      // Auto-generate barcodes for any staff missing them
      let needsReload = false;
      for (const s of data) {
        if (!s.activeBarcodeId) {
          try {
            await barcodeService.generateForStaff(s.id, 'SYSTEM_AUTO');
            needsReload = true;
          } catch(e) {
            console.error("Auto barcode gen failed for", s.id, e);
          }
        }
      }
      
      if (needsReload) {
        const updatedData = await staffRepo.findAll();
        setStaffList(updatedData);
      } else {
        setStaffList(data);
      }`
  );

  fs.writeFileSync('src/domains/attendance/ui/staff/StaffManagementPage.tsx', code);
}
