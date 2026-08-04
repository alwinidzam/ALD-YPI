import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BarcodeService } from '../services/BarcodeService';
import { BarcodeRepository } from '../repositories/BarcodeRepository';
import { Barcode } from '../types';

describe('BarcodeService', () => {
  let mockRepository: BarcodeRepository;
  let service: BarcodeService;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByToken: vi.fn(),
      findActiveByStaffId: vi.fn(),
      createInitialForStaff: vi.fn(),
      regenerate: vi.fn(),
      updateStatus: vi.fn(),
      updatePrintMetadata: vi.fn(),
    };
    service = new BarcodeService(mockRepository);
    
    // Mock crypto.getRandomValues for deterministic token generation test if needed,
    // but we can just let it run normally in jsdom environment.
  });

  const validBarcode: Barcode = {
    id: 'barcode-1',
    staffId: 'staff-1',
    token: 'BARCODE-ABC',
    status: 'ACTIVE',
    printCount: 0,
    issuedAt: new Date(),
    issuedBy: 'op-1',
    schemaVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'op-1',
    updatedBy: 'op-1',
  };

  describe('getters', () => {
    it('should get barcode by id', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(validBarcode);
      expect(await service.getBarcodeById('barcode-1')).toEqual(validBarcode);
    });
    
    it('should get barcode by token', async () => {
      vi.mocked(mockRepository.findByToken).mockResolvedValue(validBarcode);
      expect(await service.getBarcodeByToken('BARCODE-ABC')).toEqual(validBarcode);
    });

    it('should get active barcode for staff', async () => {
      vi.mocked(mockRepository.findActiveByStaffId).mockResolvedValue(validBarcode);
      expect(await service.getActiveBarcodeForStaff('staff-1')).toEqual(validBarcode);
    });
  });

  describe('generateForStaff', () => {
    it('should generate a new barcode if none exists', async () => {
      vi.mocked(mockRepository.findActiveByStaffId).mockResolvedValue(null);
      vi.mocked(mockRepository.findByToken).mockResolvedValue(null);
      vi.mocked(mockRepository.createInitialForStaff).mockImplementation(async (data) => ({ ...data, id: 'new-id' } as Barcode));
      
      const result = await service.generateForStaff('staff-1', 'op-1');
      
      expect(result.staffId).toBe('staff-1');
      expect(result.status).toBe('ACTIVE');
      expect(mockRepository.createInitialForStaff).toHaveBeenCalled();
    });

    it('should throw error if active barcode already exists', async () => {
      vi.mocked(mockRepository.findActiveByStaffId).mockResolvedValue(validBarcode);
      await expect(service.generateForStaff('staff-1', 'op-1')).rejects.toThrow(/already has an active barcode/);
    });

    it('should throw error if it fails to generate a unique token after max attempts', async () => {
      vi.mocked(mockRepository.findActiveByStaffId).mockResolvedValue(null);
      // Always return a barcode to simulate collision
      vi.mocked(mockRepository.findByToken).mockResolvedValue(validBarcode);
      await expect(service.generateForStaff('staff-1', 'op-1')).rejects.toThrow(/Failed to generate a unique barcode token/);
    });
  });

  describe('regenerateForStaff', () => {
    it('should replace old barcode with a new one', async () => {
      vi.mocked(mockRepository.findActiveByStaffId).mockResolvedValue(validBarcode);
      vi.mocked(mockRepository.findByToken).mockResolvedValue(null);
      vi.mocked(mockRepository.regenerate).mockImplementation(async (oldId, data, op) => ({ ...data, id: 'new-id' } as Barcode));
      
      const result = await service.regenerateForStaff('staff-1', 'op-1');
      
      expect(result.staffId).toBe('staff-1');
      expect(mockRepository.regenerate).toHaveBeenCalledWith('barcode-1', expect.any(Object), 'op-1');
    });

    it('should throw error if no active barcode to regenerate', async () => {
      vi.mocked(mockRepository.findActiveByStaffId).mockResolvedValue(null);
      await expect(service.regenerateForStaff('staff-1', 'op-1')).rejects.toThrow(/does not have an active barcode/);
    });
  });

  describe('invalidateBarcode', () => {
    it('should invalidate an active barcode', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(validBarcode);
      await service.invalidateBarcode('barcode-1', 'op-1', 'LOST');
      expect(mockRepository.updateStatus).toHaveBeenCalledWith('barcode-1', 'LOST', 'op-1');
    });

    it('should throw error if barcode not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);
      await expect(service.invalidateBarcode('barcode-1', 'op-1')).rejects.toThrow(/not found/);
    });

    it('should throw error if already inactive', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue({ ...validBarcode, status: 'LOST' });
      await expect(service.invalidateBarcode('barcode-1', 'op-1')).rejects.toThrow(/already in status/);
    });
  });

  describe('recordPrint', () => {
    it('should call repository updatePrintMetadata', async () => {
      await service.recordPrint('barcode-1', 'op-1');
      expect(mockRepository.updatePrintMetadata).toHaveBeenCalledWith('barcode-1', 'op-1');
    });
  });
});
