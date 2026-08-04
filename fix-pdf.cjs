const fs = require('fs');

let code = fs.readFileSync('src/components/PdfViewer.tsx', 'utf8');

if (!code.includes('motion.div')) {
  code = code.replace(
    "import React, { useEffect, useRef, useState } from 'react';",
    "import React, { useEffect, useRef, useState } from 'react';\nimport { motion } from 'motion/react';"
  );
  
  code = code.replace(
    "<div className=\"fixed inset-0 z-50 bg-[#1e1e1e]/95 backdrop-blur-md flex flex-col font-sans\">",
    `<motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed inset-0 z-50 bg-[#1e1e1e]/95 backdrop-blur-md flex flex-col font-sans"
    >`
  );
  
  code = code.replace(
    "    </div>\n  );\n};",
    "    </motion.div>\n  );\n};"
  );
}

fs.writeFileSync('src/components/PdfViewer.tsx', code);
