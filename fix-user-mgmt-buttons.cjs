const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementView.tsx', 'utf8');

if (!code.includes('isSubmitting')) {
  code = code.replace(
    "const [showAddModal, setShowAddModal] = useState(false);",
    "const [showAddModal, setShowAddModal] = useState(false);\n  const [isSubmitting, setIsSubmitting] = useState(false);"
  );
  
  code = code.replace(
    "import { Download, Plus, Search, Shield, UserX, UserCheck, Key, Edit, AlertTriangle, Users, Trash2 } from 'lucide-react';",
    "import { Download, Plus, Search, Shield, UserX, UserCheck, Key, Edit, AlertTriangle, Users, Trash2, Loader2 } from 'lucide-react';"
  );
  
  // Make form handlers async and use isSubmitting
  code = code.replace(
    "const handleSaveNewUser = (e: React.FormEvent) => {",
    "const handleSaveNewUser = async (e: React.FormEvent) => {"
  );
  code = code.replace(
    "onAddUser({",
    "setIsSubmitting(true);\n    await onAddUser({"
  );
  code = code.replace(
    "setShowAddModal(false);\n  };",
    "setShowAddModal(false);\n    setIsSubmitting(false);\n  };"
  );
  
  // Replace buttons
  code = code.replace(
    /<button\s+type="submit"\s+className="soft-button-primary flex-1 py-2\.5 rounded-xl font-bold uppercase tracking-wider text-xs"\s*>\s*Simpan\s*<\/button>/g,
    `<button type="submit" disabled={isSubmitting} className="soft-button-primary flex-1 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2">
      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
    </button>`
  );
  
  code = code.replace(
    /<button\s+type="submit"\s+className="soft-button-primary flex-1 py-2\.5 rounded-xl font-bold uppercase tracking-wider text-xs !bg-emerald-600 hover:!bg-emerald-500 text-white"\s*>\s*Reset Kata Sandi\s*<\/button>/g,
    `<button type="submit" disabled={isSubmitting} className="soft-button-primary flex-1 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs !bg-emerald-600 hover:!bg-emerald-500 text-white flex items-center justify-center gap-2">
      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Kata Sandi'}
    </button>`
  );
  
  // Same for handleSaveEditUser
  code = code.replace(
    "const handleSaveEditUser = (e: React.FormEvent) => {",
    "const handleSaveEditUser = async (e: React.FormEvent) => {"
  );
  code = code.replace(
    "onUpdateUser(selectedUser.id, {",
    "setIsSubmitting(true);\n    await onUpdateUser(selectedUser.id, {"
  );
  code = code.replace(
    "setShowEditModal(false);\n  };",
    "setShowEditModal(false);\n    setIsSubmitting(false);\n  };"
  );
  
  // handleSaveResetPassword
  code = code.replace(
    "const handleSaveResetPassword = (e: React.FormEvent) => {",
    "const handleSaveResetPassword = async (e: React.FormEvent) => {"
  );
  code = code.replace(
    "onUpdateUser(selectedUser.id, {",
    "setIsSubmitting(true);\n    await onUpdateUser(selectedUser.id, {"
  );
  code = code.replace(
    "setShowResetModal(false);\n  };",
    "setShowResetModal(false);\n    setIsSubmitting(false);\n  };"
  );
  
  fs.writeFileSync('src/components/UserManagementView.tsx', code);
}
