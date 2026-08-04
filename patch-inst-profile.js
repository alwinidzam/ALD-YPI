import fs from 'fs';
let code = fs.readFileSync('src/components/InstitutionProfileView.tsx', 'utf8');

// Hide the add button
code = code.replace(
  '{canEdit && (\n              <button \n                onClick={() => handleOpenTeacherModal()}\n                className="px-4 py-2.5 soft-button-primary rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"\n              >\n                <Plus className="w-4 h-4 stroke-[2.5]" /> Tambah Guru\n              </button>\n            )}',
  ''
);

// Hide edit/delete actions for teachers in table
code = code.replace(
  '{canEdit && <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-500 text-right">Aksi</th>}',
  ''
);

code = code.replace(
  /{canEdit && \(\s*<td className="px-6 py-4 text-right">[\s\S]*?<\/td>\s*\)}/,
  ''
);

// We should also replace the option mapping to use fullName
code = code.replace(
  '<option key={t.id} value={t.name}>{t.name} ({t.role})</option>',
  '<option key={t.id} value={t.fullName}>{t.fullName} ({t.role})</option>'
);

fs.writeFileSync('src/components/InstitutionProfileView.tsx', code);
