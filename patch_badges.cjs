const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const additionalStyles = `
  .soft-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    border: 1px solid transparent;
  }
  .soft-badge-emerald {
    background-color: var(--color-emerald-50);
    color: var(--color-emerald-700);
    border-color: var(--color-emerald-200);
  }
  .soft-badge-amber {
    background-color: var(--color-yellow-50);
    color: var(--color-amber-500);
    border-color: var(--color-yellow-400);
  }
  .soft-badge-slate {
    background-color: var(--color-slate-50);
    color: var(--color-slate-700);
    border-color: var(--color-slate-200);
  }
  .soft-badge-rose {
    background-color: #fff1f2;
    color: #e11d48;
    border-color: #fecdd3;
  }
`;

code = code.replace(/@layer utilities \{/, '@layer utilities {' + additionalStyles);

fs.writeFileSync('src/index.css', code);
