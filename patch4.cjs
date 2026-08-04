const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const additionalStyles = `
  .soft-input {
    width: 100%;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.625rem 0.75rem;
    font-size: 0.875rem;
    color: #1f2937;
    transition: all 0.2s ease-in-out;
  }
  .soft-input:focus {
    outline: none;
    border-color: #4a8c75;
    background-color: #ffffff;
    box-shadow: 0 0 0 1px #4a8c75;
  }
`;

code = code.replace(/@layer utilities \{/, '@layer utilities {' + additionalStyles);

fs.writeFileSync('src/index.css', code);
