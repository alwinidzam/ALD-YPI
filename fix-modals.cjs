const fs = require('fs');

const fixModal = (path, find, replace, imports) => {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  if (!code.includes('motion.div') && code.includes(find)) {
    code = code.replace("import React,", "import React," + imports);
    code = code.replace(find, replace);
    code = code.replace(/<\/div>\s*$/, "</motion.div>\n");
    // This regex replace might fail if the ending is different, we can just do last index of </div>
    const lastDiv = code.lastIndexOf("</div>");
    if (lastDiv !== -1 && lastDiv > code.length - 20) {
      code = code.substring(0, lastDiv) + "</motion.div>" + code.substring(lastDiv + 6);
    }
    fs.writeFileSync(path, code);
  }
}

// Hmm, this might be fragile. Let's just do it manually for ConfirmDialog
