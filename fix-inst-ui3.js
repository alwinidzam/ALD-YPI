import fs from 'fs';
let code = fs.readFileSync('src/components/InstitutionDirectory.tsx', 'utf8');

code = code.replace(
  '              {/* View Profile Action Link */}\n              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3 relative z-10">',
  '              </div>\n              {/* View Profile Action Link */}\n              <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between gap-3 relative z-10">'
);

// We should also remove the extra </div> that was already there.
// Wait, the previous block ends with:
//                  </AnimatePresence>
//                </div>
//              </div>
//              {/* View Profile Action Link */}
code = code.replace(
  '                </div>\n              </div>\n              {/* View Profile Action Link */}\n              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3 relative z-10">',
  '                </div>\n              </div>\n              {/* View Profile Action Link */}\n              <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between gap-3 relative z-10">'
);

fs.writeFileSync('src/components/InstitutionDirectory.tsx', code);
