const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const elevationClasses = `
  .soft-surface {
    background: #f0f4f2;
    box-shadow: var(--elevation-surface);
  }
  .soft-dropdown {
    background: #f0f4f2;
    box-shadow: var(--elevation-dropdown);
    border-radius: var(--radius-md);
  }
  .soft-modal {
    background: #f0f4f2;
    box-shadow: var(--elevation-modal);
    border-radius: var(--radius-lg);
  }
  .soft-tooltip {
    background: #f0f4f2;
    box-shadow: var(--elevation-tooltip);
    border-radius: var(--radius-sm);
  }
`;

code = code.replace(/  \.elevate-1 \{[\s\S]*?  \}/g, '');
code = code.replace(/  \.elevate-2 \{[\s\S]*?  \}/g, '');
code = code.replace(/  \.elevate-3 \{[\s\S]*?  \}/g, '');

code += '\n' + elevationClasses;

fs.writeFileSync('src/index.css', code);
