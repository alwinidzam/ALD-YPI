import fs from 'fs';
let code = fs.readFileSync('src/components/InstitutionProfileView.tsx', 'utf8');

// Add import
code = code.replace(
  "import { getRoleInstitution } from '../data';",
  "import { getRoleInstitution } from '../data';\nimport { FirestoreStaffRepository } from '../domains/attendance/repositories/FirestoreStaffRepository';\nconst staffRepo = new FirestoreStaffRepository();"
);

// Add state and effect to fetch staff
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'guru' | 'pengurus' | 'kelas'>('guru');",
  `const [activeTab, setActiveTab] = useState<'guru' | 'pengurus' | 'kelas'>('guru');
  const [realStaffList, setRealStaffList] = useState<any[]>([]);

  useEffect(() => {
    if (institutionId) {
      staffRepo.getAllStaff().then(allStaff => {
        const instStaff = allStaff.filter(s => s.institutions?.includes(institutionId) || s.primaryInstitution === institutionId);
        setRealStaffList(instStaff.map(s => ({
          id: s.id,
          name: s.fullName,
          nip: '',
          role: s.role === 'PRINCIPAL' ? 'Kepala Sekolah/Madrasah' : (s.role === 'ADMIN' ? 'Staf TU/Admin' : 'Guru'),
          subject: s.position || '-',
          contact: '-'
        })));
      });
    }
  }, [institutionId]);
  `
);

// Replace profile.teachersList usage with realStaffList
// First, we need to make sure we don't break the default fallback when editing, 
// but wait, editing is disabled if it's auto-generated from Master Directory!
// To be safe, we just override the render:
code = code.replace(
  /{profile\.teachersList\.length}/g,
  "{realStaffList.length > 0 ? realStaffList.length : profile.teachersList.length}"
);

code = code.replace(
  /profile\.teachersList\.length === 0/g,
  "(realStaffList.length > 0 ? realStaffList : profile.teachersList).length === 0"
);

code = code.replace(
  /profile\.teachersList\.map/g,
  "(realStaffList.length > 0 ? realStaffList : profile.teachersList).map"
);

fs.writeFileSync('src/components/InstitutionProfileView.tsx', code);
