const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(/className="w-full flex items-center justify-between px-3\.5 py-3 rounded-xl bg-\[#10b981\] hover:bg-\[#059669\] text-white font-extrabold text-xs shadow-sm border border-transparent hover:from-emerald-700 hover:to-emerald-800 transition-all cursor-pointer group hover:scale-\[1\.02\]"/g, 
'className="soft-button-primary w-full px-3.5 py-3 text-xs flex items-center justify-between group"');

code = code.replace(/className="p-2 rounded-xl bg-white\/10 text-\[#ffb300\]"/g, 
'className="p-2 rounded-xl bg-white/20 text-yellow-300"');

fs.writeFileSync('src/components/Sidebar.tsx', code);
