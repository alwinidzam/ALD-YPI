import { Staff } from '../types';
import { StaffDTO } from '../dto/StaffDTO';
import { Timestamp } from 'firebase/firestore';

export class StaffMapper {
  static toDomain(id: string, dto: StaffDTO): Staff {
    return {
      id,
      schemaVersion: dto.schemaVersion,
      fullName: dto.fullName,
      title: dto.title,
      institutions: dto.institutions || [],
      primaryInstitution: dto.primaryInstitution,
      employmentType: dto.employmentType,
      role: dto.role,
      position: dto.position,
      employmentStatus: dto.employmentStatus,
      accountStatus: dto.accountStatus || 'NO_ACCOUNT',
      barcodeToken: dto.barcodeToken,
      profilePhoto: dto.profilePhoto,

      // Audit
      createdAt: dto.createdAt && typeof dto.createdAt.toDate === "function" ? dto.createdAt.toDate() : dto.createdAt,
      updatedAt: dto.updatedAt && typeof dto.updatedAt.toDate === "function" ? dto.updatedAt.toDate() : dto.updatedAt,
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy,

      // Soft delete
      isDeleted: dto.isDeleted,
      deletedAt: dto.deletedAt && typeof dto.deletedAt.toDate === "function" ? dto.deletedAt.toDate() : dto.deletedAt,
      deletedBy: dto.deletedBy || undefined,
    };
  }

  static toDTO(domain: Omit<Staff, 'id'>): StaffDTO {
    return {
      schemaVersion: domain.schemaVersion,
      fullName: domain.fullName,
      title: domain.title,
      institutions: domain.institutions || [],
      primaryInstitution: domain.primaryInstitution,
      employmentType: domain.employmentType,
      role: domain.role,
      position: domain.position,
      employmentStatus: domain.employmentStatus,
      accountStatus: domain.accountStatus || 'NO_ACCOUNT',
      barcodeToken: domain.barcodeToken,
      profilePhoto: domain.profilePhoto,

      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      createdBy: domain.createdBy,
      updatedBy: domain.updatedBy,

      isDeleted: domain.isDeleted,
      deletedAt: domain.deletedAt || null,
      deletedBy: domain.deletedBy || null,
    };
  }
}
