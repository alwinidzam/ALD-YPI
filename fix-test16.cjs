const fs = require('fs');
let fb = fs.readFileSync('src/firebase.ts', 'utf8');
fb = fb.replace(
  "setLogLevel('error');",
  "// setLogLevel('error');"
);
fs.writeFileSync('src/firebase.ts', fb);

