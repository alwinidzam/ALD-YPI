const fs = require('fs');
let code = fs.readFileSync('src/components/ToastProvider.tsx', 'utf8');
code = code.replace(
  "function ToastItem({ toast, onDismiss }: { toast: ToastOptions, onDismiss: () => void }) {",
  "const ToastItem: React.FC<{ toast: ToastOptions, onDismiss: () => void }> = ({ toast, onDismiss }) => {"
);
code = code.replace("  return (\n    <motion.div", "  return (\n    <motion.div");
code = code.replace("  );\n}\n", "  );\n};\n");
fs.writeFileSync('src/components/ToastProvider.tsx', code);
