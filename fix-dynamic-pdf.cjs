const fs = require('fs');

function replaceImport(path) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  if (code.includes("import jsPDF from 'jspdf';")) {
    code = code.replace("import jsPDF from 'jspdf';\n", "");
    code = code.replace(/new jsPDF\(/g, "new (await import('jspdf')).default(");
    fs.writeFileSync(path, code);
  }
}

replaceImport('src/components/DocumentScannerModal.tsx');
replaceImport('src/components/events/HarlahManagementView.tsx');
replaceImport('src/components/events/SelapananManagementView.tsx');

let generator = fs.readFileSync('src/lib/pdfAccountGenerator.ts', 'utf8');
if (generator.includes("import jsPDF from 'jspdf';")) {
  generator = generator.replace("import jsPDF from 'jspdf';\n", "");
  generator = generator.replace("import 'jspdf-autotable';\n", "");
  generator = generator.replace("import html2canvas from 'html2canvas';\n", "");
  
  generator = generator.replace(
    "export async function generateAccountCardsPdf(users: AppUser[]): Promise<Blob> {",
    `export async function generateAccountCardsPdf(users: AppUser[]): Promise<Blob> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ]);
  // @ts-ignore
  await import('jspdf-autotable');`
  );
  
  fs.writeFileSync('src/lib/pdfAccountGenerator.ts', generator);
}

