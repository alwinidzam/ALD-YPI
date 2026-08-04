# Catatan Perubahan (ALD)

Semua berkas asli tetap ada — tidak ada yang dihapus. Perubahan di bawah ini
bersifat tambahan/perbaikan pada berkas yang disebutkan.

## 1. Pembaca PDF — diganti total (`src/components/PdfViewer.tsx`)

**Kondisi sebelumnya (diverifikasi dari kode, bukan asumsi):**
- Ketika dokumen belum di-resolve, komponen menampilkan **3 halaman palsu yang
  di-hardcode** (teks & tabel dummy), bukan isi PDF sesungguhnya.
- Ketika berkas asli tersedia, seluruh data base64 dimasukkan langsung sebagai
  `src` sebuah `<iframe>` (`data:application/pdf;base64,...`). Ini yang membuat
  pratinjau terasa lambat: browser harus menahan satu string raksasa di memori
  dan me-render seluruh dokumen sekaligus, tanpa lazy-loading.

**Sekarang:** dibangun ulang di atas PDF.js (dimuat sekali dari CDN saat
runtime, pendekatan yang sama dipakai Google Drive/Docs), dengan:
- Rendering halaman ke `<canvas>` yang **malas (lazy)** — hanya halaman yang
  mendekati area pandang yang dirender (`IntersectionObserver`), bukan seluruh
  dokumen sekaligus.
- Panel thumbnail nyata (bukan ilustrasi statis), juga dirender lazy.
- Zoom, rotasi, navigasi halaman, dan **pencarian teks dalam dokumen** yang
  benar-benar bekerja pada isi PDF.
- Cetak & unduh beroperasi pada byte berkas asli, bukan simulasi.
- Base64 dikonversi langsung ke `Uint8Array` (tidak pernah menjadi data: URL
  raksasa di DOM) — ini akar penyebab "lambat" yang dilaporkan.
- Penanganan galat yang jujur: jika berkas rusak atau CDN diblokir, tampil
  pesan yang jelas + tombol unduh berkas asli — bukan tema dokumen palsu.

## 2. Modul "Unduh Aplikasi" (PWA) — sebelumnya tidak berfungsi sama sekali

**Bug terverifikasi:** `App.tsx` sudah punya seluruh logika `beforeinstallprompt`
dan tombol "Pasang Aplikasi ALD", tapi **tidak ada `manifest.json`/`manifest.webmanifest`
dan tidak ada service worker terdaftar** di proyek ini. Tanpa keduanya, event
`beforeinstallprompt` Chrome tidak akan pernah terpicu — tombol instalasi
selama ini adalah kode mati.

**Perbaikan:**
- `public/manifest.webmanifest` — nama, ikon (semua ukuran wajib + maskable),
  warna tema, shortcut, `display: standalone`.
- `public/icons/*` — ikon dibuat dari nol (motif buku/arsip + aksen emas,
  senada dengan identitas emerald/gold yang sudah ada).
- `public/sw.js` — service worker: app-shell di-cache (stale-while-revalidate)
  agar buka ulang terasa instan seperti aplikasi native, panggilan
  Firebase/Firestore/Google API sengaja **tidak** disentuh cache ini (aplikasi
  sudah punya `persistentLocalCache` sendiri untuk itu).
- `public/offline.html` — halaman fallback jika benar-benar tanpa koneksi.
- `src/main.tsx` — mendaftarkan service worker tersebut.
- `index.html` — `<link rel="manifest">`, `theme-color`, ikon Apple/Android.

## 3. Bug unduh berkas (`src/App.tsx`, `handleDownloadDocument`)

`URL.revokeObjectURL(url)` dipanggil **persis setelah** `a.click()`. Pada
banyak browser (terutama Firefox, atau berkas besar), pembatalan URL objek
sebelum browser selesai membaca blob bisa menggagalkan unduhan secara
sporadis. Diperbaiki dengan menunda revoke + memastikan elemen `<a>`
ditempel ke DOM sebelum diklik (beberapa browser mensyaratkan ini).

## 4. Animasi & scrollbar yang selama ini tidak pernah aktif (`src/index.css`)

Kelas `animate-fade-in`, `animate-slide-in-left`, dan `scrollbar-thin` dipakai
di banyak komponen (`PdfViewer`, `UserManagementView`, dll.) tapi **tidak
pernah didefinisikan** di mana pun dalam proyek — secara diam-diam tidak
berefek sama sekali (bukan error, hanya tidak melakukan apa-apa). Ditambahkan
`@keyframes` dan definisi kelasnya, sehingga transisi yang sudah "ditulis" di
seluruh aplikasi akhirnya benar-benar tampil.

## 5. Polesan visual (LMS premium), dampak terbatas & aman

Sistem soft-UI emerald/gold yang sudah ada dipertahankan (sudah cukup baik),
ditambah:
- Token elevasi (`elevate-1/2/3`) — bayangan berlapis, bukan drop-shadow
  tunggal, gaya yang umum di LMS kelas atas.
- Kartu "Pasang sebagai Aplikasi" di sidebar dirombak agar terasa seperti
  ajakan instal aplikasi native, bukan tombol polos.
- Indikator menu aktif di sidebar diberi aksen garis kiri (pola umum di
  LMS/produk produktivitas premium).

**Catatan jujur soal cakupan:** `src/App.tsx` berisi ~4.100 baris (dashboard,
arsip, direktori lembaga, dll.) dan seluruh proyek ~9.400 baris. Merombak
total tampilan setiap layar dalam satu proses tanpa kemampuan build/test di
lingkungan ini (lihat bawah) berisiko merusak fungsi yang sudah berjalan.
Karena itu, pekerjaan visual difokuskan pada elemen yang tampil di **setiap**
halaman (sidebar, bottom nav, PDF viewer, token desain global) plus perbaikan
bug yang terverifikasi — bukan menulis ulang keseluruhan 4.000+ baris secara
membabi buta.

## Yang TIDAK bisa saya lakukan di sandbox ini (mohon jalankan sendiri)

Sandbox pengerjaan ini **tidak memiliki akses jaringan**, jadi saya tidak bisa
menjalankan `npm install` atau `npm run build`/`tsc` penuh (dengan seluruh
type dari `react`, `lucide-react`, dst.) untuk memverifikasi build 100% bersih.
Saya sudah melakukan pengecekan sintaks TypeScript/JSX manual (tidak ada error
sintaks) dan pemeriksaan keseimbangan kurung kurawal di seluruh berkas
`.ts`/`.tsx`, tapi **mohon jalankan** sebelum deploy:

```bash
npm install
npm run build   # atau: npm run lint  (tsc --noEmit)
npm run dev
```

Uji pratinjau PDF dengan berkas nyata (termasuk yang di-chunk/berukuran besar)
dan uji tombol "Pasang Aplikasi" di Chrome/Edge (harus muncul prompt instal
asli, bukan `confirm()` fallback).
