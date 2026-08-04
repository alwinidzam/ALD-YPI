const fs = require('fs');
let code = fs.readFileSync('src/components/ConfirmDialog.tsx', 'utf8');

code = code.replace(/<button[\s]*onClick=\{onCancel\}[\s]*className="flex-1 px-4 py-2\.5 rounded-xl text-xs font-black text-stone-600 hover:text-stone-800 bg-stone-50 hover:bg-stone-100\/80 border border-stone-200\/40 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"/, 
`<button
              onClick={onCancel}
              className="soft-button-secondary flex-1 font-semibold uppercase tracking-wider"`);

code = code.replace(/<button[\s]*onClick=\{onConfirm\}[\s]*className=\{`flex-1 px-4 py-2\.5 rounded-xl text-xs font-black text-white transition-all active:scale-95 cursor-pointer uppercase tracking-wider shadow-sm \$\{[\s]*isDanger[\s]*\? 'bg-red-600 hover:bg-red-500 shadow-red-200'[\s]*: 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-650 shadow-emerald-250'[\s]*\}`\}/, 
`<button
              onClick={onConfirm}
              className={\`soft-button-primary flex-1 font-semibold uppercase tracking-wider \${
                isDanger 
                  ? '!bg-red-600 hover:!bg-red-500' 
                  : ''
              }\`}`);

fs.writeFileSync('src/components/ConfirmDialog.tsx', code);
