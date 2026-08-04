const fs = require('fs');

let code = fs.readFileSync('src/components/UserManagementView.tsx', 'utf8');

code = code.replace(
  "            onClick={async () => {\n              try {\n                await generateUsersPdf(users);\n              } catch (e) {\n                console.error(\"PDF generation error:\", e);\n                alert(\"Gagal mengunduh PDF daftar akun pengguna.\");\n              }\n            }}",
  `            onClick={async () => {
              const toastId = toast.loading('Sedang menghasilkan dokumen PDF Akun...');
              try {
                await generateUsersPdf(users);
                toast.completeLoading(toastId, 'Dokumen PDF berhasil diunduh.', 'success');
              } catch (e) {
                console.error("PDF generation error:", e);
                toast.completeLoading(toastId, 'Gagal mengunduh dokumen PDF', 'error');
              }
            }}`
);
fs.writeFileSync('src/components/UserManagementView.tsx', code);
