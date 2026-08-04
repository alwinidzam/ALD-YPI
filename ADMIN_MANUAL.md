# Administrator Manual

Welcome to the Administrator Manual for the ALD (Arsip Laporan Digital) Platform.

## 1. User Roles & Access
Administrators have full system access.
- **ADMIN_YPI:** Can view and manage all institutions, documents, and staff.
- **ADMIN_UNIT:** Can view and manage only their specific institution (e.g., MTs or SMA).
- **OPERATOR:** Can upload and manage documents within their unit.
- **VIEWER:** Read-only access to documents.

## 2. Managing Staff & Directory
To manage staff members:
1. Navigate to the **Direktori** tab.
2. Select the specific institution.
3. Click **Tambah Staff** to register a new employee.
4. Fill in the required details (Name, NIK, Position, etc.).
5. Once created, you can generate and download their QR Code ID Card for attendance scanning.

## 3. Managing Users & Access
To manage application access:
1. Navigate to the **Dashboard** and access **Manajemen Pengguna**.
2. From here, you can add new administrators or operators.
3. Assign them the appropriate Role and Unit to ensure secure compartmentalization of data.

## 4. Monitoring Audit Logs
Every critical action in the system (deletions, large exports, permission changes) is recorded.
- Navigate to **Log Sistem** to view the audit trail.
- Logs are automatically purged after 90 days to conserve database space.

## 5. Offline Data Management
- The application automatically synchronizes data. If an operator reports stuck uploads, advise them to check the "Background Sync Status Bar" at the bottom of the screen and ensure their device has a stable internet connection.
