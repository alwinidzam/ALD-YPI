import { collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';




const staffData = [
  // MTs
  { fullName: "Kurdi, S.Pd.I", title: "S.Pd.I", position: "Kepala Sekolah", role: "PRINCIPAL", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "H. Abdur Rohim, S.Pd.I", title: "S.Pd.I", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "H. Syarifuddin, S.Pd.I", title: "S.Pd.I", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Akhrowi, S.Pd.I", title: "S.Pd.I", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Puji Rohmawati, S.Pd.", title: "S.Pd.", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Suwarso, S.Ag", title: "S.Ag", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Sudarsono, S.Pd", title: "S.Pd", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Dewi Setiyowati, S.Pd.", title: "S.Pd.", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Qomariyah", title: "", position: "Guru", role: "TEACHER", institutions: ["MTS", "SMA"], primaryInstitution: "MTS" },
  { fullName: "Bahroni, S.Ag.", title: "S.Ag.", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Rini Windarsih, S.E.", title: "S.E.", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Hidayah Febrieni, S.Pd.I.", title: "S.Pd.I.", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Farida Zahro', S.Pd.I", title: "S.Pd.I", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Ulya Zulfa, S.Pd", title: "S.Pd", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Durrotun Nafisah, S.Pd.", title: "S.Pd.", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Rozanah, A.H.", title: "A.H.", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Atik Zuhriyyah, S.Pd.", title: "S.Pd.", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Lisa Maryaniati, S.Pd.", title: "S.Pd.", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Yaroh Mustikawati, S.Pd.", title: "S.Pd.", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Neli Maryam, S.Pd.I", title: "S.Pd.I", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Supita Sari", title: "", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Fahat Muzani, S.Ag.", title: "S.Ag.", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },
  { fullName: "Khawariyin, S.Pd.I", title: "S.Pd.I", position: "Guru", role: "TEACHER", institutions: ["MTS"], primaryInstitution: "MTS" },

  // SMA
  { fullName: "Ahmad Muthohar, M.Pd.I", title: "M.Pd.I", position: "Kepala Sekolah", role: "PRINCIPAL", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Drs. H. Mas'ad Masyhur", title: "Drs.", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "H. Suyono, S.Pd", title: "S.Pd", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "M. Sulaiman Zuhdi, S.Pd.I", title: "S.Pd.I", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Nuroniyah, S.Pd", title: "S.Pd", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Kumayati, S.Pd", title: "S.Pd", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Farida Yusrina, S.Pd", title: "S.Pd", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Eka Nur Saviyanah, M.Pd", title: "M.Pd", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Qumi Fardhiyah, S.Pd", title: "S.Pd", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Fitriani Nur H., S.Pd", title: "S.Pd", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Ananda Bakhtiar, S.Or", title: "S.Or", position: "Guru", role: "TEACHER", institutions: ["SMA", "MTS"], primaryInstitution: "SMA" },
  { fullName: "Nailul Muna Faridatun N.", title: "", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Ana Wahyuni, S.S.", title: "S.S.", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Aulia Maulidatun Nisa', S.Sos.", title: "S.Sos.", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Ratna Artika Devi", title: "", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Khaerotul Izah, S.Sos.", title: "S.Sos.", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Anis Zakiyah", title: "", position: "Guru", role: "TEACHER", institutions: ["SMA"], primaryInstitution: "SMA" },
  { fullName: "Atsna Maziyah", title: "", position: "Guru", role: "TEACHER", institutions: ["SMA", "MTS", "PESANTREN"], primaryInstitution: "SMA" },

  // TK
  { fullName: "Junaedah, S.Pd", title: "S.Pd", position: "Kepala Sekolah", role: "PRINCIPAL", institutions: ["TK"], primaryInstitution: "TK" },
  { fullName: "Sholekah, S.Pd", title: "S.Pd", position: "Guru", role: "TEACHER", institutions: ["TK"], primaryInstitution: "TK" },
  { fullName: "Siti Ma'rufah, S.Pd", title: "S.Pd", position: "Guru", role: "TEACHER", institutions: ["TK"], primaryInstitution: "TK" },
  { fullName: "Mudrikah, S.Pd.AUD", title: "S.Pd.AUD", position: "Guru", role: "TEACHER", institutions: ["TK"], primaryInstitution: "TK" },
  { fullName: "Laili Maulida, S.Pd", title: "S.Pd", position: "Guru", role: "TEACHER", institutions: ["TK"], primaryInstitution: "TK" },

  // Pondok Pesantren
  { fullName: "Afrida Luthfiyah", title: "", position: "Pengurus", role: "ADMIN", institutions: ["PESANTREN"], primaryInstitution: "PESANTREN" },
  // Atsna Maziyah already covered in SMA

  // YPI
  { fullName: "Muhammad Alwi Nidzam", title: "", position: "Staff Yayasan", role: "ADMIN", institutions: ["YPI"], primaryInstitution: "YPI" },
  { fullName: "Khoirul Anam, S.Pd", title: "S.Pd", position: "Staff Yayasan", role: "ADMIN", institutions: ["YPI"], primaryInstitution: "YPI" },
  { fullName: "Dwi", title: "", position: "Staff Yayasan", role: "ADMIN", institutions: ["YPI"], primaryInstitution: "YPI" },
  { fullName: "Falah", title: "", position: "Staff Yayasan", role: "ADMIN", institutions: ["YPI"], primaryInstitution: "YPI" },
  { fullName: "A. Baihaqi", title: "", position: "Staff Yayasan", role: "ADMIN", institutions: ["YPI"], primaryInstitution: "YPI" },
];

async function seed() {
  console.log('Seeding Staff Data...');
  let i = 1;
  for (const staff of staffData) {
    const id = doc(collection(db, 'staff')).id;
    const barcodeToken = `YPI-STAFF-${String(i).padStart(6, '0')}`;
    
    const staffDoc = {
      schemaVersion: 1,
      fullName: staff.fullName,
      title: staff.title,
      institutions: staff.institutions,
      primaryInstitution: staff.primaryInstitution,
      employmentType: 'FULL_TIME',
      role: staff.role,
      position: staff.position,
      employmentStatus: 'ACTIVE',
      accountStatus: 'NO_ACCOUNT',
      barcodeToken,
      profilePhoto: '',
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'system_seed',
      updatedBy: 'system_seed',
    };
    
    await setDoc(doc(db, 'staff', id), staffDoc);
    
    // Auto-generate barcode record too if we still want it, but the instruction says
    // "QR Code generated from barcodeToken ONLY... The QR Code must NOT contain the person's name...
    // Attendance Scanner should resolve: QR -> barcodeToken -> Staff Record -> Attendance"
    // So we don't strictly need a Barcodes collection, we can just query staff where barcodeToken == scannedToken.
    
    console.log(`Inserted ${staff.fullName} with barcode ${barcodeToken}`);
    i++;
  }
  
  console.log('Done!');
  process.exit(0);
}

seed().catch(console.error);
