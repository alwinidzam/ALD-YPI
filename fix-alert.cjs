const fs = require('fs');

let code = fs.readFileSync('src/main.tsx', 'utf8');
if (!code.includes('window.alert =')) {
  code = code.replace(
    "import { ToastProvider } from './components/ToastProvider';",
    "import { ToastProvider } from './components/ToastProvider';\nimport { toast } from './lib/toastManager';\n\n// Override window.alert globally for unified feedback\nwindow.alert = (msg) => {\n  if (msg.toString().toLowerCase().includes('gagal') || msg.toString().toLowerCase().includes('error')) {\n    toast.error(msg.toString());\n  } else if (msg.toString().toLowerCase().includes('harus') || msg.toString().toLowerCase().includes('tidak boleh')) {\n    toast.warning(msg.toString());\n  } else {\n    toast.success(msg.toString());\n  }\n};\n"
  );
  fs.writeFileSync('src/main.tsx', code);
}
