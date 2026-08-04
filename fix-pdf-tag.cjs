const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewer.tsx', 'utf8');
const lastDiv = code.lastIndexOf('</div>');
if (lastDiv !== -1) {
  code = code.substring(0, lastDiv) + '</motion.div>' + code.substring(lastDiv + 6);
  fs.writeFileSync('src/components/PdfViewer.tsx', code);
}
