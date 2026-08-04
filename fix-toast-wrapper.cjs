const fs = require('fs');

let code = fs.readFileSync('src/main.tsx', 'utf8');

code = code.replace(
  "<ToastProvider>\n    <App />\n    </ToastProvider>",
  "<>\n      <ToastProvider />\n      <App />\n    </>"
);
code = code.replace(
  "<ErrorBoundary>\n    <ToastProvider>",
  "<ErrorBoundary>\n    <>"
);
fs.writeFileSync('src/main.tsx', code);
