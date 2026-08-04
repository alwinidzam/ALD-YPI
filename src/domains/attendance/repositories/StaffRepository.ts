import { Staff, StaffStatus } from '../types';

export interface StaffQueryOptions {
  institutionId?: string; // We'll query against the 'institutions' array
  employmentStatus?: StaffStatus;
  isDeleted?: boolean;
  limit?: number;
}

export interface StaffRepository {
  findById(id: string): Promise<Staff | null>;
  findAll(options?: StaffQueryOptions): Promise<Staff[]>;
  create(staff: Omit<Staff, 'id'>): Promise<Staff>;
  update(id: string, staff: Partial<Omit<Staff, 'id'>>): Promise<void>;
  softDelete(id: string, deletedBy: string): Promise<void>;
}
