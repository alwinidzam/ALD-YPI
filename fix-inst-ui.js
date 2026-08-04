import fs from 'fs';
let code = fs.readFileSync('src/components/InstitutionDirectory.tsx', 'utf8');

// Fix grid layout
code = code.replace(
  'className="soft-card soft-card-hover p-6 transition-all flex flex-col justify-between group relative overflow-hidden h-[385px] w-full"',
  'className="soft-card soft-card-hover p-6 transition-all flex flex-col group relative overflow-hidden h-full w-full"'
);

// We need to make the container flex column to push the bottom elements
code = code.replace(
  '<div className="relative z-10 space-y-4">',
  '<div className="relative z-10 flex flex-col h-full">'
);

// We should wrap the top content in a div and add `flex-1` to it so the buttons stick to the bottom
code = code.replace(
  '{/* Header info */}',
  '<div className="flex flex-col gap-4 flex-1">\n                {/* Header info */}'
);

code = code.replace(
  '{/* Action Buttons */}',
  '</div>\n                {/* Action Buttons */}\n                <div className="flex gap-2.5 mt-5 pt-5 border-t border-slate-100">'
);

// Wait, the action buttons div already has a definition. Let's see it.
