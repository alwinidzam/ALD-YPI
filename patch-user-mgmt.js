import fs from 'fs';
let code = fs.readFileSync('src/components/UserManagementView.tsx', 'utf8');

code = code.replace(
  /<td className="p-4 font-mono text-emerald-800 font-bold">\s*@\{u\.username\}\s*<\/td>/g,
  `<td className="p-4 font-mono text-emerald-800 font-bold">
                    {u.noAccount ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 font-sans">No Login Account</span>
                    ) : (
                      <>\u0040{u.username}</>
                    )}
                  </td>`
);

fs.writeFileSync('src/components/UserManagementView.tsx', code);
