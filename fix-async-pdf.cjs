const fs = require('fs');

function makeAsync(path, funcName) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  if (code.includes(`const ${funcName} = () => {`)) {
    code = code.replace(`const ${funcName} = () => {`, `const ${funcName} = async () => {`);
    fs.writeFileSync(path, code);
  }
}

makeAsync('src/components/events/HarlahManagementView.tsx', 'handleExportLPJPdf');
makeAsync('src/components/events/SelapananManagementView.tsx', 'handleExportLPJPdf');
makeAsync('src/components/DocumentScannerModal.tsx', 'handleUpload');

