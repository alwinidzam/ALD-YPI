import fs from 'fs';
let code = fs.readFileSync('src/components/InstitutionDirectory.tsx', 'utf8');

code = code.replace(
  '                  </AnimatePresence>\n                </div>\n              </div>\n\n              </div>\n              {/* View Profile Action Link */}\n              <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between gap-3 relative z-10">',
  '                  </AnimatePresence>\n                </div>\n              </div>\n              {/* View Profile Action Link */}\n              <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between gap-3 relative z-10">'
);

fs.writeFileSync('src/components/InstitutionDirectory.tsx', code);
