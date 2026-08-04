const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');
code = code.replace(
  "import { ToastProvider } from './components/ToastProvider';",
  "import { ToastProvider } from './components/ToastProvider';\nimport { ErrorBoundary } from './components/ErrorBoundary';"
);
code = code.replace(
  "<ToastProvider>",
  "<ErrorBoundary>\n    <ToastProvider>"
);
code = code.replace(
  "</ToastProvider>",
  "</ToastProvider>\n    </ErrorBoundary>"
);
fs.writeFileSync('src/main.tsx', code);
