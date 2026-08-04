import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "ai-studio-arsiplaporandigi-5aab8e26-79ed-4706-8c75-8e62bfa756f2",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const qs = await getDocs(collection(db, 'staff'));
  let count = 0;
  let hasBarcode = 0;
  let qomariyah = false;
  let bakhtiar = false;
  let atsna = false;
  qs.forEach(d => {
    count++;
    const data = d.data();
    if (data.barcodeToken) hasBarcode++;
    if (data.fullName?.includes('Qomariyah')) qomariyah = true;
    if (data.fullName?.includes('Bakhtiar')) bakhtiar = true;
    if (data.fullName?.includes('Atsna')) atsna = true;
  });
  console.log(`Total staff: ${count}`);
  console.log(`With barcode: ${hasBarcode}`);
  console.log(`Qomariyah: ${qomariyah}`);
  console.log(`Bakhtiar: ${bakhtiar}`);
  console.log(`Atsna: ${atsna}`);
  process.exit(0);
}
run();
