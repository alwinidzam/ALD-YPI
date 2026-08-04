const fs = require('fs');

let code = fs.readFileSync('vite.config.ts', 'utf8');

code = code.replace(
  "'scanner': ['html5-qrcode'],",
  "'scanner': ['@zxing/library', '@zxing/browser'],"
);

// also let's split firebase and pdf-export and motion/lucide more granularly
code = code.replace(
  "            'firebase-vendor': ['firebase/app', 'firebase/firestore', 'firebase/auth'],",
  `            'firebase-core': ['firebase/app', 'firebase/auth'],
            'firebase-db': ['firebase/firestore'],`
);

code = code.replace(
  "            'ui-vendor': ['lucide-react', 'framer-motion', 'recharts'],",
  `            'ui-icons': ['lucide-react'],
            'ui-motion': ['motion/react', 'framer-motion'],
            'ui-charts': ['recharts'],`
);

fs.writeFileSync('vite.config.ts', code);
