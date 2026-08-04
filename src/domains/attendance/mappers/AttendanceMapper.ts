import { Attendance } from '../types';
import { AttendanceDTO } from '../dto/AttendanceDTO';
import { Timestamp } from 'firebase/firestore';

export class AttendanceMapper {
  static toDomain(id: string, dto: AttendanceDTO): Attendance {
    return {
      id,
      schemaVersion: dto.schemaVersion,
      staffId: dto.staffId,
      barcodeId: dto.barcodeId,
      institutions: dto.institutions || [],
      primaryInstitution: dto.primaryInstitution,
      institutionNameSnapshot: dto.institutionNameSnapshot,
      date: dto.date,
      
      checkIn: dto.checkIn && typeof dto.checkIn.toDate === "function" ? dto.checkIn.toDate() : dto.checkIn,
      checkOut: dto.checkOut && typeof dto.checkOut.toDate === "function" ? dto.checkOut.toDate() : dto.checkOut,
      
      status: dto.status,
      source: dto.source,
      
      manualReason: dto.manualReason || undefined,
      manualApprovedBy: dto.manualApprovedBy || undefined,
      manualApprovedAt: dto.manualApprovedAt && typeof dto.manualApprovedAt.toDate === "function" ? dto.manualApprovedAt.toDate() : dto.manualApprovedAt,
      
      createdAt: dto.createdAt && typeof dto.createdAt.toDate === "function" ? dto.createdAt.toDate() : dto.createdAt,
      updatedAt: dto.updatedAt && typeof dto.updatedAt.toDate === "function" ? dto.updatedAt.toDate() : dto.updatedAt,
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy,
    };
  }

  static toDTO(domain: Omit<Attendance, 'id'>): AttendanceDTO {
    return {
      schemaVersion: domain.schemaVersion,
      staffId: domain.staffId,
      barcodeId: domain.barcodeId,
      institutions: domain.institutions || [],
      primaryInstitution: domain.primaryInstitution,
      institutionNameSnapshot: domain.institutionNameSnapshot,
      date: domain.date,
      
      checkIn: domain.checkIn || null,
      checkOut: domain.checkOut || null,
      
      status: domain.status,
      source: domain.source,
      
      manualReason: domain.manualReason || null,
      manualApprovedBy: domain.manualApprovedBy || null,
      manualApprovedAt: domain.manualApprovedAt || null,
      
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      createdBy: domain.createdBy,
      updatedBy: domain.updatedBy,
    };
  }
}
