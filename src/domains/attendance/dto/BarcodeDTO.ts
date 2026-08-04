import { BarcodeStatus } from '../types';

export interface BarcodeDTO {
  schemaVersion: number;
  token: string;
  staffId: string;
  status: BarcodeStatus;
  
  issuedAt: any | null; // Firestore Timestamp
  issuedBy: string | null;
  printedAt: any | null;
  lastPrintedAt: any | null;
  printCount: number;

  invalidatedAt: any | null;
  replacedByBarcodeId: string | null;
  previousBarcodeId: string | null;

  createdAt: any;
  updatedAt: any;
  createdBy: string;
  updatedBy: string;
}
