import { useState, useEffect } from 'react';
import { Attendance, Staff } from '../../types';
import { FirestoreAttendanceQueryService } from '../../services/FirestoreAttendanceQueryService';
import { FirestoreStaffRepository } from '../../repositories/FirestoreStaffRepository';

const queryService = new FirestoreAttendanceQueryService();
const staffRepo = new FirestoreStaffRepository();

export interface DashboardStats {
  totalPresent: number;
  totalLate: number;
  totalCheckedOut: number;
  totalManual: number;
  totalAbsent: number;
  
  // Staff Stats
  totalStaff: number;
  totalTeachers: number;
  totalPrincipals: number;
  activeStaff: number;
  inactiveStaff: number;
}

export function useAttendanceDashboard(currentUser?: any) {
  const allowedInstitution = currentUser?.role?.startsWith('ADMIN_') && currentUser.role !== 'SUPER_ADMIN' ? currentUser.role.replace('ADMIN_', '') : null;
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPresent: 0,
    totalLate: 0,
    totalCheckedOut: 0,
    totalManual: 0,
    totalAbsent: 0,
    totalStaff: 0,
    totalTeachers: 0,
    totalPrincipals: 0,
    activeStaff: 0,
    inactiveStaff: 0
  });

  useEffect(() => {
    // 1. Fetch Staff Data
    staffRepo.findAll().then(staffListRaw => {
      const staffList = allowedInstitution 
        ? staffListRaw.filter(s => (s.institutions || []).map((i:any) => i.toUpperCase()).includes(allowedInstitution) || s.primaryInstitution?.toUpperCase() === allowedInstitution)
        : staffListRaw;
      setStaffData(staffList);
      
      const totalStaff = staffList.length;
      const totalTeachers = staffList.filter(s => s.role === 'TEACHER').length;
      const totalPrincipals = staffList.filter(s => s.role === 'PRINCIPAL').length;
      const activeStaff = staffList.filter(s => s.employmentStatus === 'ACTIVE').length;
      const inactiveStaff = staffList.filter(s => s.employmentStatus !== 'ACTIVE').length;

      setStats(prev => ({
        ...prev,
        totalStaff,
        totalTeachers,
        totalPrincipals,
        activeStaff,
        inactiveStaff
      }));
    });

    // 2. Fetch Attendances
    const todayStr = new Date().toLocaleDateString('en-CA');
    const unsubscribe = queryService.observeTodayAttendances(todayStr, (data) => {
      const sorted = [...data].sort((a, b) => {
        const timeA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
        const timeB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
        return timeB - timeA;
      });
      const filteredAttendances = allowedInstitution 
        ? sorted.filter(att => att.institutionNameSnapshot?.toUpperCase() === allowedInstitution || att.institutions?.map((i:any) => i.toUpperCase()).includes(allowedInstitution))
        : sorted;
      setAttendances(filteredAttendances);

      let present = 0;
      let checkedOut = 0;
      let manual = 0;
      
      filteredAttendances.forEach(att => {
        if (att.status === 'CHECKED_IN') present++;
        if (att.status === 'CHECKED_OUT') checkedOut++;
        if (att.status === 'MANUAL') manual++;
      });

      setStats(prev => ({
        ...prev,
        totalPresent: present + checkedOut + manual,
        totalCheckedOut: checkedOut,
        totalManual: manual,
        totalLate: 0, 
        totalAbsent: 0, 
      }));
    });

    return () => unsubscribe();
  }, []);

  return {
    attendances,
    stats,
    staffData // optionally export this if needed
  };
}
