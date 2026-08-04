const fs = require('fs');
let code = fs.readFileSync('src/domains/attendance/ui/scanner/ScannerPage.tsx', 'utf8');

code = code.replace(
  "const [torchOn, setTorchOn] = useState(false);",
  "const [torchOn, setTorchOn] = useState(false);\n  const [scanFlash, setScanFlash] = useState<'success' | 'error' | 'duplicate' | null>(null);\n  const [hasTorch, setHasTorch] = useState(false);\n  const [isTorchOn, setIsTorchOn] = useState(false);\n  const handleToggleTorch = () => {};\n"
);

fs.writeFileSync('src/domains/attendance/ui/scanner/ScannerPage.tsx', code);
