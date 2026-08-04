const fs = require('fs');

let code = fs.readFileSync('src/components/BackgroundSyncStatusBar.tsx', 'utf8');

code = code.replace(
  "import {",
  "import { toast } from '../lib/toastManager';\nimport {"
);

// We need to listen to online/offline events and show toasts
code = code.replace(
  "    const handleUpdate = () => refresh();",
  `    const handleUpdate = () => refresh();
    
    const handleOnline = () => {
      toast.success('Koneksi kembali pulih. Sinkronisasi latar belakang dilanjutkan.');
      refresh();
    };
    
    const handleOffline = () => {
      toast.warning('Koneksi terputus. Anda sedang Offline. Pekerjaan akan disinkronkan nanti.');
      refresh();
    };`
);

code = code.replace(
  "    window.addEventListener('online', handleUpdate);",
  "    window.addEventListener('online', handleOnline);"
);
code = code.replace(
  "    window.addEventListener('offline', handleUpdate);",
  "    window.addEventListener('offline', handleOffline);"
);

code = code.replace(
  "    return () => {\n      window.removeEventListener('ald_upload_queue_updated', handleUpdate);\n      window.removeEventListener('online', handleUpdate);\n      window.removeEventListener('offline', handleUpdate);",
  "    return () => {\n      window.removeEventListener('ald_upload_queue_updated', handleUpdate);\n      window.removeEventListener('online', handleOnline);\n      window.removeEventListener('offline', handleOffline);"
);

// When force sync happens
code = code.replace(
  "    await processUploadQueue();\n    setIsSyncing(false);\n    refresh();",
  `    await processUploadQueue();
    setIsSyncing(false);
    refresh();
    const currentQueue = getUploadQueue();
    const failed = currentQueue.filter(q => q.status === 'FAILED');
    if (failed.length === 0 && currentQueue.length > 0) {
      toast.success('Semua antrean berkas berhasil disinkronkan.');
    } else if (failed.length > 0) {
      toast.error(\`Gagal mensinkronkan \${failed.length} berkas. Pastikan koneksi stabil.\`);
    }`
);

fs.writeFileSync('src/components/BackgroundSyncStatusBar.tsx', code);
