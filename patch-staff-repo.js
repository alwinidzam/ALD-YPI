import fs from 'fs';
let code = fs.readFileSync('src/domains/attendance/repositories/FirestoreStaffRepository.ts', 'utf8');

code = code.replace(
  '  async findByBarcodeToken(token: string): Promise<Staff | null> {',
  `  async getAllStaff(): Promise<Staff[]> {
    const q = query(this.collectionRef, where('isDeleted', '==', false));
    const snap = await getDocs(q);
    return snap.docs.map(doc => this.mapToEntity(doc.id, doc.data()));
  }

  async findByBarcodeToken(token: string): Promise<Staff | null> {`
);

fs.writeFileSync('src/domains/attendance/repositories/FirestoreStaffRepository.ts', code);
