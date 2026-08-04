const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const neumorphismVariables = `
  --radius-sm: 12px;
  --radius-md: 14px;
  --radius-lg: 16px;

  --shadow-soft:
    -5px -5px 15px rgba(255,255,255,0.85),
     5px  5px 15px rgba(0,0,0,0.06);

  --shadow-soft-hover:
    -6px -6px 18px rgba(255,255,255,0.9),
     6px  6px 18px rgba(0,0,0,0.08);

  --shadow-soft-inset:
    inset -3px -3px 8px rgba(255,255,255,0.7),
    inset  3px  3px 8px rgba(0,0,0,0.05);

  --shadow-soft-btn-primary:
    -3px -3px 8px rgba(255,255,255,0.3),
     4px  4px 12px rgba(20,83,45,0.3);

  --shadow-soft-btn-primary-hover:
    -4px -4px 12px rgba(255,255,255,0.4),
     5px  5px 15px rgba(20,83,45,0.4);

  --shadow-soft-btn-primary-active:
    inset -2px -2px 6px rgba(255,255,255,0.2),
    inset  2px  2px 6px rgba(20,83,45,0.4);
`;

code = code.replace(/@theme \{/, '@theme {' + neumorphismVariables);

const softCardReplacement = `  .soft-bg {
    background-color: #f0f4f2;
  }
  
  .soft-card {
    background: #f0f4f2;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-soft);
    border: 1px solid rgba(255,255,255,0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .soft-card-hover:hover {
    box-shadow: var(--shadow-soft-hover);
    transform: translateY(-2px);
  }
  .soft-inset {
    background: #f0f4f2;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-soft-inset);
    border: 1px solid rgba(255,255,255,0.2);
  }`;

code = code.replace(/  \.soft-bg \{[\s\S]*?  \.soft-inset \{[\s\S]*?\}/, softCardReplacement);

const softButtonPrimaryReplacement = `  .soft-button-primary {
    background: linear-gradient(145deg, #37715c, #2d5a4a);
    color: #ffffff;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-soft-btn-primary);
    border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .soft-button-primary:hover {
    background: linear-gradient(145deg, #428e75, #37715c);
    box-shadow: var(--shadow-soft-btn-primary-hover);
    transform: translateY(-1px);
  }
  .soft-button-primary:active {
    background: #2d5a4a;
    box-shadow: var(--shadow-soft-btn-primary-active);
    transform: translateY(1px);
  }`;

code = code.replace(/  \.soft-button-primary \{[\s\S]*?  \.soft-button-primary:active \{[\s\S]*?\}/, softButtonPrimaryReplacement);

const softButtonSecondaryReplacement = `  .soft-button-secondary {
    background: #f0f4f2;
    color: #374151;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-soft);
    border: 1px solid rgba(255,255,255,0.5);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .soft-button-secondary:hover {
    box-shadow: var(--shadow-soft-hover);
    color: #111827;
    transform: translateY(-1px);
  }
  .soft-button-secondary:active {
    box-shadow: var(--shadow-soft-inset);
    transform: translateY(1px);
  }`;

code = code.replace(/  \.soft-button-secondary \{[\s\S]*?  \.soft-button-secondary:active \{[\s\S]*?\}/, softButtonSecondaryReplacement);

const softInputReplacement = `  .soft-input {
    width: 100%;
    background-color: #f0f4f2;
    border: 1px solid rgba(255,255,255,0.5);
    border-radius: var(--radius-sm);
    padding: 0.625rem 0.75rem;
    font-size: 0.875rem;
    color: #1f2937;
    box-shadow: var(--shadow-soft-inset);
    transition: all 0.2s ease-in-out;
  }
  .soft-input:focus {
    outline: none;
    border-color: rgba(55, 113, 92, 0.4);
    box-shadow: var(--shadow-soft-inset), 0 0 0 2px rgba(55, 113, 92, 0.1);
  }`;

code = code.replace(/  \.soft-input \{[\s\S]*?  \.soft-input:focus \{[\s\S]*?\}/, softInputReplacement);

fs.writeFileSync('src/index.css', code);
