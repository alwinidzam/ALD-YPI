const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const themeReplacement = `@theme {
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  --font-serif: "Playfair Display", Georgia, Cambria, "Times New Roman", Times, serif;
  
  --color-emerald-50: #f6f9f7;
  --color-emerald-100: #e3f0ea;
  --color-emerald-200: #c5dfd3;
  --color-emerald-300: #9cc7b5;
  --color-emerald-400: #6ca891;
  --color-emerald-500: #4a8c75;
  --color-emerald-600: #37715c;
  --color-emerald-700: #2d5a4a;
  --color-emerald-800: #26483c;
  --color-emerald-900: #203c33;
  --color-emerald-950: #12221d;
  
  --color-slate-50: #fcfcfc;
  --color-slate-100: #f5f5f5;
  --color-slate-200: #e5e5e5;
  --color-slate-800: #262626;
  --color-slate-900: #171717;

  --color-yellow-50: #fff9eb;
  --color-yellow-400: #fbbf24;
  --color-yellow-500: #e6a100;
  
  --color-amber-500: #d58900;

  --animate-scan-line: scan-line 2.2s ease-in-out infinite;
}`;

code = code.replace(/@theme \{[\s\S]*?--animate-scan-line: scan-line 2.2s ease-in-out infinite;\n\}/g, themeReplacement);

fs.writeFileSync('src/index.css', code);
