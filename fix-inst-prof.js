import fs from 'fs';
let code = fs.readFileSync('src/components/InstitutionProfileView.tsx', 'utf8');

// replace display of totalTeachers
code = code.replace(
  /{profile\.totalTeachers}/g,
  "{realStaffList.length}"
);

// We replace `(realStaffList.length > 0 ? realStaffList : profile.teachersList)`
// Wait, if a school truly has 0 teachers right now, `realStaffList.length > 0` is false, and it falls back to profile.teachersList (the static default). This means the static defaults STILL show up if the school has no staff! This is wrong according to the prompt!

code = code.replace(
  /\(realStaffList\.length > 0 \? realStaffList \: profile\.teachersList\)/g,
  "realStaffList"
);

code = code.replace(
  /realStaffList\.length > 0 \? realStaffList\.length \: profile\.teachersList\.length/g,
  "realStaffList.length"
);

// We should also look at other places where profile.totalTeachers is used, like setGeneralTotalTeachers
code = code.replace(
  /setGeneralTotalTeachers\(profile\.totalTeachers\);/g,
  "setGeneralTotalTeachers(realStaffList.length);"
);


fs.writeFileSync('src/components/InstitutionProfileView.tsx', code);
