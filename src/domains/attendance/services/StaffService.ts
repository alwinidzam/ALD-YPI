import { Staff, StaffStatus } from '../types';
import { StaffRepository, StaffQueryOptions } from '../repositories/StaffRepository';
import { StaffValidator } from '../validators/StaffValidator';
import { ATTENDANCE_CONSTANTS } from '../constants';
import { InactiveStaffError } from '../errors';

export class StaffService {
  constructor(private staffRepository: StaffRepository) {}

  async getStaffById(id: string): Promise<Staff | null> {
    return this.staffRepository.findById(id);
  }

  async getAllStaff(options?: StaffQueryOptions): Promise<Staff[]> {
    return this.staffRepository.findAll(options);
  }

  async getActiveStaffByInstitution(institutionId: string): Promise<Staff[]> {
    return this.staffRepository.findAll({
      institutionId: institutionId,
      employmentStatus: 'ACTIVE',
      isDeleted: false
    });
  }

  async createStaff(
    params: Omit<Staff, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion' | 'isDeleted' | 'deletedAt' | 'deletedBy'>,
    operatorId: string
  ): Promise<Staff> {
    const newStaff: Omit<Staff, 'id'> = {
      ...params,
      schemaVersion: ATTENDANCE_CONSTANTS.SCHEMA_VERSION_STAFF,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: operatorId,
      updatedBy: operatorId,
    };

    StaffValidator.validateForCreate(newStaff);

    return this.staffRepository.create(newStaff);
  }

  async updateStaff(
    id: string,
    updates: Partial<Omit<Staff, 'id' | 'createdAt' | 'createdBy' | 'isDeleted' | 'deletedAt' | 'deletedBy' | 'schemaVersion'>>,
    operatorId: string
  ): Promise<void> {
    StaffValidator.validateForUpdate(updates);

    const staff = await this.staffRepository.findById(id);
    if (!staff) {
      throw new Error(`Staff with ID ${id} not found.`);
    }

    if (staff.isDeleted) {
      throw new Error(`Cannot update deleted staff ${id}.`);
    }

    await this.staffRepository.update(id, {
      ...updates,
      updatedBy: operatorId,
      updatedAt: new Date(), // Repository will override with serverTimestamp, but this keeps interface consistent
    });
  }

  async suspendStaff(id: string, operatorId: string): Promise<void> {
    const staff = await this.staffRepository.findById(id);
    if (!staff) throw new Error(`Staff with ID ${id} not found.`);
    
    await this.staffRepository.update(id, {
      employmentStatus: 'SUSPENDED',
      updatedBy: operatorId,
    });
  }

  async activateStaff(id: string, operatorId: string): Promise<void> {
    const staff = await this.staffRepository.findById(id);
    if (!staff) throw new Error(`Staff with ID ${id} not found.`);
    if (staff.isDeleted) throw new Error(`Cannot activate deleted staff ${id}.`);
    
    await this.staffRepository.update(id, {
      employmentStatus: 'ACTIVE',
      updatedBy: operatorId,
    });
  }

  async deleteStaff(id: string, operatorId: string): Promise<void> {
    const staff = await this.staffRepository.findById(id);
    if (!staff) {
      throw new Error(`Staff with ID ${id} not found.`);
    }

    if (staff.isDeleted) {
      return; // Already deleted
    }

    await this.staffRepository.softDelete(id, operatorId);
  }

  async validateStaffActive(id: string): Promise<Staff> {
    const staff = await this.staffRepository.findById(id);
    
    if (!staff) {
      throw new Error(`Staff with ID ${id} not found.`);
    }

    if (staff.isDeleted || staff.employmentStatus !== 'ACTIVE') {
      throw new InactiveStaffError(id);
    }

    return staff;
  }
}
