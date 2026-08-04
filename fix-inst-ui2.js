import fs from 'fs';
let code = fs.readFileSync('src/components/InstitutionDirectory.tsx', 'utf8');

code = code.replace(
  '</div>\n                {/* Action Buttons */}\n                <div className="flex gap-2.5 mt-5 pt-5 border-t border-slate-100">\n                <div className="flex gap-2 pt-1 mt-auto">',
  '</div>\n                {/* Action Buttons */}\n                <div className="flex gap-2 pt-1 mt-5">'
);

// In case the above was wrong, let's fix it properly using sed or similar by checking exactly what it looks like.
