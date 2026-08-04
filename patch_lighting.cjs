const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const lightingVariables = `
  /* Lighting System (Neumorphism / Soft UI) */
  --elevation-surface: 
    0 0 0 1px rgba(255,255,255,0.7) inset,
    0 0 0 1px rgba(0,0,0,0.02);
    
  --elevation-card: 
    -5px -5px 15px rgba(255,255,255,0.85),
     5px  5px 15px rgba(0,0,0,0.06),
     0 0 0 1px rgba(255,255,255,0.5) inset;
     
  --elevation-dropdown: 
    -8px -8px 24px rgba(255,255,255,0.9),
     8px  8px 24px rgba(0,0,0,0.08),
     0 0 0 1px rgba(255,255,255,0.6) inset;
     
  --elevation-modal: 
    -12px -12px 32px rgba(255,255,255,0.95),
     12px  12px 32px rgba(0,0,0,0.12),
     0 0 0 1px rgba(255,255,255,0.7) inset;

  --elevation-tooltip: 
    -3px -3px 8px rgba(255,255,255,0.8),
     3px  3px 8px rgba(0,0,0,0.1),
     0 0 0 1px rgba(255,255,255,0.8) inset;
`;

code = code.replace(/  --shadow-soft-btn-primary-active:[\s\S]*?;/, '$&\n' + lightingVariables);

const softCardLighting = `  .soft-card {
    background: #f0f4f2;
    border-radius: var(--radius-lg);
    box-shadow: var(--elevation-card);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }`;

code = code.replace(/  \.soft-card \{[\s\S]*?  \}/, softCardLighting);

fs.writeFileSync('src/index.css', code);
