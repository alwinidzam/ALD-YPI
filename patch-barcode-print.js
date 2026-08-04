import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/barcode/BarcodeManagementModal.tsx', 'utf8');

code = code.replace(
  "alert('Perintah cetak dikirim ke printer thermal.');",
  `
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = \`QR-\${staff.fullName}-\${activeBarcode.token}.png\`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert('QR Code berhasil diunduh.');`
);

// update button text
code = code.replace(
  "Cetak Thermal",
  "Unduh QR Code"
);

fs.writeFileSync('src/domains/attendance/ui/barcode/BarcodeManagementModal.tsx', code);
