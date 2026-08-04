const fs = require('fs');
let code = fs.readFileSync('src/components/ToastProvider.tsx', 'utf8');
code = code.replace(
  "    </motion.div>\n  );\n}",
  "    </motion.div>\n  );\n};"
);
fs.writeFileSync('src/components/ToastProvider.tsx', code);
