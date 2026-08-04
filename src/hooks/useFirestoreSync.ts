import React, { useState, useEffect } from 'react';
import { onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { User, DocumentMetadata, Announcement, AuditLog, UserRole } from '../types';
import { ALDDatabase, hashPassword, compressBase64Image } from '../data';
import { dbSaveUser, dbDeleteUser, dbCleanOldAuditLogs } from '../firebase';
import { usersCol, docsCol, annsCol, logsCol } from '../firebase';

interface UseFirestoreSyncProps {
  syncTrigger: number;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export function useFirestoreSync({ syncTrigger, setCurrentUser }: UseFirestoreSyncProps) {
  // Automatic cleanup of audit logs older than 90 days to maintain Firestore DB performance
  useEffect(() => {
    dbCleanOldAuditLogs()
      .then((deletedCount) => {
        if (deletedCount > 0) {
          console.log(`[Pembersihan Otomatis] Berhasil menghapus ${deletedCount} data audit log yang berusia lebih dari 90 hari.`);
        }
      })
      .catch((err) => {
        // Soft fallback for background auto-cleanup
        console.warn('Proses pembersihan otomatis audit log dilewati:', err?.message || err);
      });
  }, [syncTrigger]);

  const [users, setUsers] = useState<User[]>(() => {
    const dbUsers = ALDDatabase.getUsers();
    const targetHash = hashPassword('Atmin0405');
    
    const requiredRoles: { role: UserRole; username: string; name: string; id: string; contact: string }[] = [
      { role: 'SUPER_ADMIN', username: 'admin', name: 'Muhammad Alwi Nidzam', id: 'u-1', contact: '081122334455' },
      { role: 'VIEWER', username: 'viewer', name: 'Akun Viewer Yayasan', id: 'u-viewer', contact: '081122334400' },
      { role: 'ADMIN_SMA', username: 'adminsma', name: 'Admin SMA Raudhotut', id: 'u-adminsma', contact: '081122334411' },
      { role: 'ADMIN_MTS', username: 'adminmts', name: 'Admin MTs Raudhotut', id: 'u-adminmts', contact: '081122334422' },
      { role: 'ADMIN_MADIN', username: 'adminmadin', name: 'Admin Madin Raudhotut', id: 'u-adminmadin', contact: '081122334433' },
      { role: 'ADMIN_TK', username: 'admintk', name: 'Admin TK Raudhotut', id: 'u-admintk', contact: '081122334444' },
      { role: 'ADMIN_PESANTREN', username: 'adminpesantren', name: 'Admin Pesantren', id: 'u-adminpesantren', contact: '081122334466' },
      { role: 'ADMIN_SELAPANAN', username: 'adminselapanan', name: 'Admin Selapanan', id: 'u-adminselapanan', contact: '081122334477' }
    ];

    let updated = [...dbUsers];
    let changed = false;

    requiredRoles.forEach((req) => {
      const existingIdx = updated.findIndex((u) => u.role === req.role || u.username.toLowerCase() === req.username.toLowerCase());
      if (existingIdx === -1) {
        updated.push({
          id: req.id,
          username: req.username,
          name: req.name,
          role: req.role,
          status: 'ACTIVE',
          passwordHash: targetHash,
          contact: req.contact
        });
        changed = true;
      } else {
        if (req.role === 'SUPER_ADMIN') {
          const sa = updated[existingIdx];
          if (sa.passwordHash !== targetHash || sa.role !== 'SUPER_ADMIN') {
            updated[existingIdx] = {
              ...sa,
              passwordHash: targetHash,
              role: 'SUPER_ADMIN',
              status: 'ACTIVE'
            };
            changed = true;
          }
        }
      }
    });

    const finalUsers = updated.filter((u) => u.username.toLowerCase() !== 'superadmin');
    
    if (changed || finalUsers.length !== dbUsers.length) {
      ALDDatabase.saveUsers(finalUsers);
    }
    
    return finalUsers;
  });
  
  const [documents, setDocuments] = useState<DocumentMetadata[]>(() => ALDDatabase.getDocuments());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => ALDDatabase.getAnnouncements());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => ALDDatabase.getAuditLogs());

  const [isUsersLoading, setIsUsersLoading] = useState(() => users.length === 0);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [isDocsLoading, setIsDocsLoading] = useState(() => documents.length === 0);
  const [docsError, setDocsError] = useState<string | null>(null);

  const [isAnnsLoading, setIsAnnsLoading] = useState(() => announcements.length === 0);
  const [annsError, setAnnsError] = useState<string | null>(null);

  const [isLogsLoading, setIsLogsLoading] = useState(() => auditLogs.length === 0);
  const [logsError, setLogsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (users.length === 0) setIsUsersLoading(true);
    if (documents.length === 0) setIsDocsLoading(true);
    if (announcements.length === 0) setIsAnnsLoading(true);
    if (auditLogs.length === 0) setIsLogsLoading(true);

    // Safety fallback timer to prevent infinite loading state if Firestore connection hangs
    const safetyTimer = setTimeout(() => {
      if (!isMounted) return;
      setIsUsersLoading(false);
      setIsDocsLoading(false);
      setIsAnnsLoading(false);
      setIsLogsLoading(false);
    }, 5000);

    const unsubUsers = onSnapshot(usersCol, (snapshot) => {
      if (!isMounted) return;
      
      const fetchedUsers: User[] = [];
      snapshot.forEach((docSnap) => {
        const u = docSnap.data() as User;
        if (u.id?.startsWith('u-gen-') || docSnap.id.startsWith('u-gen-')) {
          dbDeleteUser(docSnap.id);
        } else {
          fetchedUsers.push(u);
        }
      });
      
      const requiredRoles: { role: UserRole; username: string; name: string; id: string; contact: string }[] = [
        { role: 'SUPER_ADMIN', username: 'admin', name: 'Muhammad Alwi Nidzam', id: 'u-1', contact: '081122334455' },
        { role: 'VIEWER', username: 'viewer', name: 'Akun Viewer Yayasan', id: 'u-viewer', contact: '081122334400' },
        { role: 'ADMIN_SMA', username: 'adminsma', name: 'Admin SMA Raudhotut', id: 'u-adminsma', contact: '081122334411' },
        { role: 'ADMIN_MTS', username: 'adminmts', name: 'Admin MTs Raudhotut', id: 'u-adminmts', contact: '081122334422' },
        { role: 'ADMIN_MADIN', username: 'adminmadin', name: 'Admin Madin Raudhotut', id: 'u-adminmadin', contact: '081122334433' },
        { role: 'ADMIN_TK', username: 'admintk', name: 'Admin TK Raudhotut', id: 'u-admintk', contact: '081122334444' },
        { role: 'ADMIN_PESANTREN', username: 'adminpesantren', name: 'Admin Pesantren', id: 'u-adminpesantren', contact: '081122334466' },
        { role: 'ADMIN_SELAPANAN', username: 'adminselapanan', name: 'Admin Selapanan', id: 'u-adminselapanan', contact: '081122334477' }
      ];

      const targetHash = hashPassword('Atmin0405');
      const usersToSeed: User[] = [];

      requiredRoles.forEach((req) => {
        const exists = fetchedUsers.some((u) => u.role === req.role || u.username.toLowerCase() === req.username.toLowerCase());
        if (!exists) {
          usersToSeed.push({
            id: req.id,
            username: req.username,
            name: req.name,
            role: req.role,
            status: 'ACTIVE',
            passwordHash: targetHash,
            contact: req.contact
          });
        }
      });

      if (usersToSeed.length > 0) {
        Promise.all(usersToSeed.map((u) => dbSaveUser(u))).then(() => {
          if (!isMounted) return;
          const combined = [...fetchedUsers, ...usersToSeed];
          setUsers(combined);
          ALDDatabase.saveUsers(combined);
          setIsUsersLoading(false);
          setUsersError(null);
        }).catch((err) => {
          if (!isMounted) return;
          console.error('Error seeding missing role accounts:', err);
          setIsUsersLoading(false);
          setUsersError('Gagal melakukan sinkronisasi seeder pengguna');
        });
      } else {
        setUsers(fetchedUsers);
        ALDDatabase.saveUsers(fetchedUsers);
        setIsUsersLoading(false);
        setUsersError(null);
        
        setCurrentUser((current) => {
          if (!current) return null;
          const currentInDb = fetchedUsers.find((u) => u.id === current.id || u.username === current.username);
          if (currentInDb) {
            if (
              currentInDb.name !== current.name ||
              currentInDb.role !== current.role ||
              currentInDb.status !== current.status ||
              currentInDb.contact !== current.contact ||
              currentInDb.photoURL !== current.photoURL
            ) {
              localStorage.setItem('ald_current_session', JSON.stringify(currentInDb));
              return currentInDb;
            }
          }
          return current;
        });
      }
    }, (error) => {
      if (!isMounted) return;
      setIsUsersLoading(false);
      setUsersError(error.message || 'Gagal tersambung dengan data pengguna');
      console.error('Error in users listener:', error);
    });

    const unsubDocs = onSnapshot(docsCol, (snapshot) => {
      if (!isMounted) return;
      const fetchedDocs: DocumentMetadata[] = [];
      snapshot.forEach((docSnap) => {
        fetchedDocs.push(docSnap.data() as DocumentMetadata);
      });
      fetchedDocs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      setDocuments(fetchedDocs);
      ALDDatabase.saveDocuments(fetchedDocs);
      setIsDocsLoading(false);
      setDocsError(null);
    }, (error) => {
      if (!isMounted) return;
      setIsDocsLoading(false);
      setDocsError(error.message || 'Gagal memuat arsip dokumen');
      console.error('Error in documents listener:', error);
    });

    const unsubAnns = onSnapshot(annsCol, (snapshot) => {
      if (!isMounted) return;
      const fetchedAnns: Announcement[] = [];
      snapshot.forEach((docSnap) => {
        fetchedAnns.push(docSnap.data() as Announcement);
      });
      fetchedAnns.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setAnnouncements(fetchedAnns);
      ALDDatabase.saveAnnouncements(fetchedAnns);
      setIsAnnsLoading(false);
      setAnnsError(null);
    }, (error) => {
      if (!isMounted) return;
      setIsAnnsLoading(false);
      setAnnsError(error.message || 'Gagal memuat Program & Kegiatan Yayasan');
      console.error('Error in announcements listener:', error);
    });

    const logsQuery = query(logsCol, orderBy('timestamp', 'desc'), limit(500));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      if (!isMounted) return;
      const fetchedLogs: AuditLog[] = [];
      snapshot.forEach((docSnap) => {
        fetchedLogs.push(docSnap.data() as AuditLog);
      });
      fetchedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditLogs(fetchedLogs);
      ALDDatabase.saveAuditLogs(fetchedLogs);
      setIsLogsLoading(false);
      setLogsError(null);
    }, (error) => {
      if (!isMounted) return;
      setIsLogsLoading(false);
      setLogsError(error.message || 'Gagal memuat audit log');
      console.error('Error in logs listener:', error);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubUsers();
      unsubDocs();
      unsubAnns();
      unsubLogs();
    };
  }, [syncTrigger, setCurrentUser]);

  return {
    users, setUsers, isUsersLoading, usersError, setIsUsersLoading, setUsersError,
    documents, setDocuments, isDocsLoading, docsError, setIsDocsLoading, setDocsError,
    announcements, setAnnouncements, isAnnsLoading, annsError, setIsAnnsLoading, setAnnsError,
    auditLogs, setAuditLogs, isLogsLoading, logsError, setIsLogsLoading, setLogsError,
  };
}
