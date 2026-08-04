import fs from 'fs';
let code = fs.readFileSync('src/components/UserManagementView.tsx', 'utf8');

code = code.replace(
  /const filteredUsers = users\.filter\(\(u\) => \{\n\s*return \(\n\s*u\.name\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\) \|\|\n\s*u\.username\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\) \|\|\n\s*u\.role\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)\n\s*\);\n\s*\}\);/m,
  `
  // Merge users and staff
  const mergedUsers = React.useMemo(() => {
    const list: any[] = [];
    const usedUserIds = new Set();

    allStaff.forEach(staff => {
      const matchingUser = users.find(u => u.name.toLowerCase() === staff.fullName.toLowerCase());
      if (matchingUser) {
        usedUserIds.add(matchingUser.id);
        list.push({ ...matchingUser, staffId: staff.id, noAccount: false, fullName: staff.fullName, position: staff.position });
      } else {
        list.push({
          id: 'staff-' + staff.id,
          username: '-',
          name: staff.fullName,
          role: staff.role === 'PRINCIPAL' ? 'GUEST' : 'TEACHER',
          institution: staff.primaryInstitution,
          noAccount: true,
          position: staff.position,
          staffId: staff.id
        });
      }
    });

    users.forEach(u => {
      if (!usedUserIds.has(u.id)) {
        list.push({ ...u, noAccount: false });
      }
    });

    return list;
  }, [users, allStaff]);

  const filteredUsers = (mergedUsers as any[]).filter(u => {
    return (
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
`
);

fs.writeFileSync('src/components/UserManagementView.tsx', code);
