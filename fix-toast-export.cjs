const fs = require('fs');

let code = fs.readFileSync('src/main.tsx', 'utf8');

if (!code.includes("import { toast } from './lib/toastManager';")) {
  console.log('Needs toast manager in main');
}

