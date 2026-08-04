import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/barcode/BarcodeManagementModal.tsx', 'utf8');

if (!code.includes("import QRCode from 'qrcode';")) {
  code = code.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport QRCode from 'qrcode';"
  );
  
  // Add state for qrDataUrl
  code = code.replace(
    "const [activeBarcode, setActiveBarcode] = useState<Barcode | null>(null);",
    "const [activeBarcode, setActiveBarcode] = useState<Barcode | null>(null);\n  const [qrDataUrl, setQrDataUrl] = useState<string>('');"
  );
  
  // Generate QR on barcode load
  code = code.replace(
    "setActiveBarcode(current || null);",
    "setActiveBarcode(current || null);\n        if (current) {\n          QRCode.toDataURL(current.token, { width: 256, margin: 2 }).then(setQrDataUrl).catch(console.error);\n        } else {\n          setQrDataUrl('');\n        }"
  );
  code = code.replace(
    "setActiveBarcode(null);",
    "setActiveBarcode(null);\n        setQrDataUrl('');"
  );
  code = code.replace(
    "setActiveBarcode(newBarcode);",
    "setActiveBarcode(newBarcode);\n      QRCode.toDataURL(newBarcode.token, { width: 256, margin: 2 }).then(setQrDataUrl).catch(console.error);"
  );
  
  // Replace the icon with the actual QR image
  code = code.replace(
    "<QrCode className=\"w-24 h-24 text-slate-800\" />",
    "{qrDataUrl ? <img src={qrDataUrl} alt=\"QR Code\" className=\"w-32 h-32 object-contain rounded-lg\" /> : <QrCode className=\"w-24 h-24 text-slate-800\" />}"
  );

  fs.writeFileSync('src/domains/attendance/ui/barcode/BarcodeManagementModal.tsx', code);
}
