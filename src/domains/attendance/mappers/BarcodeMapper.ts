import { Barcode } from '../types';
import { BarcodeDTO } from '../dto/BarcodeDTO';
import { Timestamp } from 'firebase/firestore';

export class BarcodeMapper {
  static toDomain(id: string, dto: BarcodeDTO): Barcode {
    return {
      id,
      schemaVersion: dto.schemaVersion,
      token: dto.token,
      staffId: dto.staffId,
      status: dto.status,

      issuedAt: dto.issuedAt && typeof dto.issuedAt.toDate === "function" ? dto.issuedAt.toDate() : dto.issuedAt,
      issuedBy: dto.issuedBy || undefined,
      printedAt: dto.printedAt instanceof Timestamp ? dto.printedAt.toDate() : dto.printedAt,
      lastPrintedAt: dto.lastPrintedAt instanceof Timestamp ? dto.lastPrintedAt.toDate() : dto.lastPrintedAt,
      printCount: dto.printCount || 0,

      invalidatedAt: dto.invalidatedAt instanceof Timestamp ? dto.invalidatedAt.toDate() : dto.invalidatedAt,
      replacedByBarcodeId: dto.replacedByBarcodeId || undefined,
      previousBarcodeId: dto.previousBarcodeId || undefined,

      createdAt: dto.createdAt && typeof dto.createdAt.toDate === "function" ? dto.createdAt.toDate() : dto.createdAt,
      updatedAt: dto.updatedAt && typeof dto.updatedAt.toDate === "function" ? dto.updatedAt.toDate() : dto.updatedAt,
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy,
    };
  }

  static toDTO(domain: Omit<Barcode, 'id'>): BarcodeDTO {
    return {
      schemaVersion: domain.schemaVersion,
      token: domain.token,
      staffId: domain.staffId,
      status: domain.status,

      issuedAt: domain.issuedAt || null,
      issuedBy: domain.issuedBy || null,
      printedAt: domain.printedAt || null,
      lastPrintedAt: domain.lastPrintedAt || null,
      printCount: domain.printCount || 0,

      invalidatedAt: domain.invalidatedAt || null,
      replacedByBarcodeId: domain.replacedByBarcodeId || null,
      previousBarcodeId: domain.previousBarcodeId || null,

      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      createdBy: domain.createdBy,
      updatedBy: domain.updatedBy,
    };
  }
}
