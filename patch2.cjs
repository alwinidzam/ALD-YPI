const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');
code = code.replace(/  \.soft-card \{[\s\S]*?  \}/g, `  .soft-card {
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.04);
    border-radius: 12px;
    box-shadow: 
       0 1px 2px rgba(0, 0, 0, 0.02), 
       0 4px 12px rgba(0, 0, 0, 0.03);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }`);
code = code.replace(/  \.soft-card-hover:hover \{[\s\S]*?  \}/g, `  .soft-card-hover:hover {
    box-shadow: 
       0 4px 8px rgba(0, 0, 0, 0.04),
       0 12px 24px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }`);
code = code.replace(/  \.soft-inset \{[\s\S]*?  \}/g, `  .soft-inset {
    background: #f9fafb;
    border: 1px solid rgba(0, 0, 0, 0.04);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
  }`);
code = code.replace(/  \.soft-button-primary \{[\s\S]*?  \}/g, `  .soft-button-primary {
    background: #10b981;
    color: #ffffff;
    border: 1px solid transparent;
    box-shadow: 0 1px 2px rgba(16, 185, 129, 0.2);
    border-radius: 8px;
    transition: all 0.2s ease-in-out;
  }`);
code = code.replace(/  \.soft-button-primary:hover \{[\s\S]*?  \}/g, `  .soft-button-primary:hover {
    background: #059669;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
    transform: translateY(-1px);
  }`);
code = code.replace(/  \.soft-button-primary:active \{[\s\S]*?  \}/g, `  .soft-button-primary:active {
    background: #047857;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    transform: translateY(0);
  }`);
code = code.replace(/  \.soft-button-secondary \{[\s\S]*?  \}/g, `  .soft-button-secondary {
    background: #ffffff;
    color: #374151;
    border: 1px solid #d1d5db;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    transition: all 0.2s ease-in-out;
  }`);
code = code.replace(/  \.soft-button-secondary:hover \{[\s\S]*?  \}/g, `  .soft-button-secondary:hover {
    background: #f3f4f6;
    color: #111827;
  }`);
code = code.replace(/  \.soft-button-secondary:active \{[\s\S]*?  \}/g, `  .soft-button-secondary:active {
    background: #e5e7eb;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  }`);
fs.writeFileSync('src/index.css', code);
