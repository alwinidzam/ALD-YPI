const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const newDark = `  .soft-gradient-dark {
    background: #12221d; /* emerald-950 */
    box-shadow: 
      -5px -5px 15px rgba(255,255,255,0.85),
       5px  5px 15px rgba(0,0,0,0.06),
       inset 0 1px 1px rgba(255,255,255,0.1);
  }`;

code = code.replace(/  \.soft-gradient-dark \{[\s\S]*?\}/, newDark);

fs.writeFileSync('src/index.css', code);
