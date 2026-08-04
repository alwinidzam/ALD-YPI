const fs = require('fs');

let code = fs.readFileSync('src/main.tsx', 'utf8');

// Use a regular expression to cleanly replace the whole render block
code = code.replace(
  /createRoot\(document\.getElementById\('root'\)!\)\.render\([\s\S]*?\);/,
  `createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider />
      <App />
    </ErrorBoundary>
  </StrictMode>,
);`
);

fs.writeFileSync('src/main.tsx', code);
