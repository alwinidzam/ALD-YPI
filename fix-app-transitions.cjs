const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('AnimatePresence mode="wait"')) {
  // We need to find the main switch block and wrap it
  // In App.tsx, the main content is rendered using:
  // const renderMainContent = () => { ... }
  // and then inside return:
  // <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative">
  //   {renderMainContent()}
  // </main>
  
  if (code.includes('const renderMainContent = () => {') && !code.includes('motion.div key={currentView}')) {
     code = code.replace(
       /const renderMainContent = \(\) => \{\n    switch \(currentView\) \{/g,
       `const renderMainContent = () => {
    let content;
    switch (currentView) {`
     );
     
     // Replace all returns with content =
     // This is tricky with regex. Let's just wrap the {renderMainContent()} in return statement.
  }
  
  code = code.replace(
    `<main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative pb-safe">
          {renderMainContent()}
        </main>`,
    `<main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative pb-safe">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              {renderMainContent()}
            </motion.div>
          </AnimatePresence>
        </main>`
  );
  
  // Need to import AnimatePresence and motion if not present
  if (!code.includes('import { motion, AnimatePresence }')) {
    code = code.replace(
      "import React,",
      "import React,\nimport { motion, AnimatePresence } from 'motion/react';"
    );
    // But React import might be: import React, { useState, useEffect } from 'react';
    code = code.replace(
      "import React, {",
      "import { motion, AnimatePresence } from 'motion/react';\nimport React, {"
    );
  }
  
  fs.writeFileSync('src/App.tsx', code);
}
