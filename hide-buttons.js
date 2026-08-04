import fs from 'fs';
let code = fs.readFileSync('src/components/InstitutionProfileView.tsx', 'utf8');

// Hide "Tambah Pengajar" button in the teachers tab
code = code.replace(
  /<button\s*onClick=\{\(\) => handleOpenTeacherModal\(null\)\}\s*className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors"\s*>\s*<Plus className="w-4 h-4" \/> Tambah Pengajar\s*<\/button>/g,
  ""
);

// We need to also hide the action menu in the teachers table row
code = code.replace(
  /<td className="px-6 py-4 text-right">\s*<div className="flex items-center justify-end gap-2">\s*<button\s*onClick=\{\(\) => handleOpenTeacherModal\(teacher\)\}\s*className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"\s*title="Edit Data"\s*>\s*<Edit2 className="w-3.5 h-3.5" \/>\s*<\/button>\s*<button\s*onClick=\{\(\) => requestDelete\('guru', teacher\.id, teacher\.name\)\}\s*className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"\s*title="Hapus Data"\s*>\s*<Trash2 className="w-3.5 h-3.5" \/>\s*<\/button>\s*<\/div>\s*<\/td>/g,
  '<td className="px-6 py-4 text-right"></td>'
);

// Add a note above the table
code = code.replace(
  /<div className="overflow-x-auto">/g,
  '<div className="px-6 py-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-3"><Shield className="w-4 h-4 text-emerald-600" /><p className="text-xs text-emerald-800 font-bold">Data guru & pengajar ditampilkan secara live dari Master Database Kepegawaian. Untuk menambah atau mengubah data, silakan gunakan modul Kepegawaian.</p></div>\n              <div className="overflow-x-auto">'
);

fs.writeFileSync('src/components/InstitutionProfileView.tsx', code);
