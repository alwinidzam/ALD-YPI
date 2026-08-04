const fs = require('fs');

let code = fs.readFileSync('src/lib/pdfAccountGenerator.ts', 'utf8');

code = code.replace(
  "export function generateUsersPdf(usersList: User[]) {",
  `export async function generateUsersPdf(usersList: User[]) {
  const [{ default: jsPDF }] = await Promise.all([
    import('jspdf')
  ]);
  // @ts-ignore
  await import('jspdf-autotable');`
);

fs.writeFileSync('src/lib/pdfAccountGenerator.ts', code);
