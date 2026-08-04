// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StaffService } from '../services/StaffService';
import { StaffRepository } from '../repositories/StaffRepository';
import { Staff } from '../types';
import { InactiveStaffError } from '../errors';

describe('StaffService', () => {
  let mockRepository: StaffRepository;
  let service: StaffService;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    service = new StaffService(mockRepository);
  });

  const validStaff: Staff = {
    id: 'staff-1',
    employmentStatus: 'ACTIVE',
    fullName: 'John Doe',
    institutions: ['YPI'],
    primaryInstitution: 'YPI',
    role: 'TEACHER',
    position: 'Guru Matematika',
    employmentType: 'FULL_TIME',
    employmentStatus: 'ACTIVE',
    schemaVersion: 1,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
    updatedBy: 'admin',
  };

  describe('getStaffById', () => {
    it('should return staff if found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(validStaff);
      const result = await service.getStaffById('staff-1');
      expect(result).toEqual(validStaff);
      expect(mockRepository.findById).toHaveBeenCalledWith('staff-1');
    });

    it('should return null if not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);
      const result = await service.getStaffById('unknown');
      expect(result).toBeNull();
    });
  });

  describe('createStaff', () => {
    it('should create and return new staff', async () => {
      const { id, createdAt, updatedAt, schemaVersion, isDeleted, createdBy, updatedBy, ...params } = validStaff;
      params.institutions = ['YPI']; params.primaryInstitution = 'YPI';
      vi.mocked(mockRepository.create).mockResolvedValue(validStaff);
      
      const result = await service.createStaff(params as any, 'operator-1');
      
      expect(result).toEqual(validStaff);
      expect(mockRepository.create).toHaveBeenCalled();
    });
  });

  describe('updateStaff', () => {
    it('should update staff properties', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(validStaff);
      await service.updateStaff('staff-1', { fullName: 'Jane Doe' }, 'operator-1');
      expect(mockRepository.update).toHaveBeenCalledWith('staff-1', expect.objectContaining({ fullName: 'Jane Doe', updatedBy: 'operator-1' }));
    });

    it('should throw error if staff not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);
      await expect(service.updateStaff('unknown', { fullName: 'Jane' }, 'op-1')).rejects.toThrow();
    });

    it('should throw error if staff is deleted', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue({ ...validStaff, isDeleted: true });
      await expect(service.updateStaff('staff-1', { fullName: 'Jane' }, 'op-1')).rejects.toThrow();
    });
  });

  describe('getAllStaff', () => {
    it('should return all staff', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue([validStaff]);
      const result = await service.getAllStaff();
      expect(result).toEqual([validStaff]);
    });
  });

  describe('getActiveStaffByInstitution', () => {
    it('should return active staff for an institution', async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue([validStaff]);
      const result = await service.getActiveStaffByInstitution('YPI');
      expect(result).toEqual([validStaff]);
      expect(mockRepository.findAll).toHaveBeenCalledWith({
        institutionId: 'YPI',
        employmentStatus: 'ACTIVE',
        isDeleted: false
      });
    });
  });

  describe('suspendStaff', () => {
    it('should suspend active staff', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(validStaff);
      await service.suspendStaff('staff-1', 'op-1');
      expect(mockRepository.update).toHaveBeenCalledWith('staff-1', expect.objectContaining({ employmentStatus: 'SUSPENDED' }));
    });

    
  });

  describe('deleteStaff', () => {
    it('should soft delete staff', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(validStaff);
      await service.deleteStaff('staff-1', 'op-1');
      expect(mockRepository.softDelete).toHaveBeenCalledWith('staff-1', 'op-1');
    });
  });
});
