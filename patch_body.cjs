const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const baseLayer = `
@layer base {
  body {
    @apply antialiased text-[#12221d] bg-[#f0f4f2] selection:bg-[#4a8c75]/30 selection:text-[#12221d];
  }
}
`;

code = code.replace(/@import "tailwindcss";/, '@import "tailwindcss";\n' + baseLayer);

fs.writeFileSync('src/index.css', code);
