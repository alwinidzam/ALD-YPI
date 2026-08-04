import fs from 'fs';
let code = fs.readFileSync('src/components/UserManagementView.tsx', 'utf8');

// Add import
code = code.replace(
  "import { hashPassword } from '../data';",
  "import { hashPassword } from '../data';\nimport { FirestoreStaffRepository } from '../domains/attendance/repositories/FirestoreStaffRepository';\nconst staffRepo = new FirestoreStaffRepository();"
);

// Add state and effect
code = code.replace(
  "const [searchTerm, setSearchTerm] = useState('');",
  `const [searchTerm, setSearchTerm] = useState('');
  const [allStaff, setAllStaff] = useState<any[]>([]);
  React.useEffect(() => {
    staffRepo.getAllStaff().then(setAllStaff);
  }, []);
`
);

// We need to merge `users` and `allStaff`
// Let's create `mergedList`
code = code.replace(
  "const filteredUsers = users.filter(user =>",
  `
  // Merge users and staff
  // Every staff member is displayed. If they have a user account (matching by name or email), show it.
  const mergedUsers = React.useMemo(() => {
    const list: any[] = [];
    const usedUserIds = new Set();

    // 1. Add all staff
    allStaff.forEach(staff => {
      // Find matching user (exact name match or if we had email, but we use name here, or we can just try)
      const matchingUser = users.find(u => u.name.toLowerCase() === staff.fullName.toLowerCase());
      if (matchingUser) {
        usedUserIds.add(matchingUser.id);
        list.push({ ...matchingUser, staffId: staff.id, noAccount: false, fullName: staff.fullName, position: staff.position });
      } else {
        list.push({
          id: 'staff-' + staff.id,
          username: '-',
          name: staff.fullName,
          role: staff.role === 'PRINCIPAL' ? 'GUEST' : 'TEACHER', // default visual
          institution: staff.primaryInstitution,
          noAccount: true,
          position: staff.position,
          staffId: staff.id
        });
      }
    });

    // 2. Add remaining users who aren't staff
    users.forEach(u => {
      if (!usedUserIds.has(u.id)) {
        list.push({ ...u, noAccount: false });
      }
    });

    return list;
  }, [users, allStaff]);

  const filteredUsers = mergedUsers.filter(user =>`
);

// Change how we render "No Login Account"
code = code.replace(
  /<td className="px-6 py-4 whitespace-nowrap">\s*<div className="text-sm font-semibold text-slate-800">{user.username}<\/div>\s*<\/td>/g,
  `<td className="px-6 py-4 whitespace-nowrap">
                          {user.noAccount ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">No Login Account</span>
                          ) : (
                            <div className="text-sm font-semibold text-slate-800">{user.username}</div>
                          )}
                        </td>`
);

// Hide edit/delete for noAccount? Or maybe when clicking Add/Edit it allows creating one? 
// The prompt just says "Display 'No Login Account' instead of hiding them." 

fs.writeFileSync('src/components/UserManagementView.tsx', code);
