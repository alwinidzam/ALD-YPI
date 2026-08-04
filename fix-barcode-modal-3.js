import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/barcode/BarcodeManagementModal.tsx', 'utf8');

code = code.replace(
  `        const active = await barcodeService['barcodeRepo'].findByStaffId(staff.id);\n        const current = active.find(b => b.status === 'ACTIVE');\n        setActiveBarcode(current || null);\n        if (current) {\n          QRCode.toDataURL(current.token, { width: 256, margin: 2 }).then(setQrDataUrl).catch(console.error);\n        } else {\n          setQrDataUrl('');\n        }`,
  `        // Use the token directly from staff record since it's canonical
        setActiveBarcode({ token: staff.barcodeToken } as Barcode);
        QRCode.toDataURL(staff.barcodeToken, { width: 256, margin: 2 }).then(setQrDataUrl).catch(console.error);`
);

code = code.replace(
  "QRCode.toDataURL(newBarcode.token, { width: 256, margin: 2 }).then(setQrDataUrl).catch(console.error);",
  "setActiveBarcode({ token: newBarcode.token } as Barcode);\n      QRCode.toDataURL(newBarcode.token, { width: 256, margin: 2 }).then(setQrDataUrl).catch(console.error);"
);

// We should also replace activeBarcode.id with activeBarcode.token for the download link if id is missing
code = code.replace(
  "link.download = `QR-${staff.fullName}-${activeBarcode.token}.png`;",
  "link.download = `QR-${staff.fullName.replace(/[^a-zA-Z0-9]/g, '_')}-${activeBarcode.token}.png`;"
);

fs.writeFileSync('src/domains/attendance/ui/barcode/BarcodeManagementModal.tsx', code);
