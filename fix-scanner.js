import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/ui/scanner/ScannerPage.tsx', 'utf8');

if (!code.includes("const [allStaff, setAllStaff] = useState")) {
  code = code.replace(
    "const [torchOn, setTorchOn] = useState(false);",
    "const [torchOn, setTorchOn] = useState(false);\n  const [allStaff, setAllStaff] = useState<any[]>([]);\n\n  useEffect(() => {\n    staffRepo.findAll().then(setAllStaff).catch(console.error);\n  }, []);\n\n  const getStaffName = (id: string | undefined) => {\n    if (!id) return 'Ditolak';\n    const s = allStaff.find(x => x.id === id);\n    return s ? s.fullName : id;\n  };"
  );

  code = code.replace(
    /\{scan\.status === 'SUCCESS' \? scan\.attendance\?\.staffId : 'Ditolak'\}/g,
    "{scan.status === 'SUCCESS' ? getStaffName(scan.attendance?.staffId) : 'Ditolak'}"
  );

  fs.writeFileSync('src/domains/attendance/ui/scanner/ScannerPage.tsx', code);
}
