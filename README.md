# Catatan Utang

Aplikasi pencatatan utang-piutang, pembayaran/cicilan, tagihan, laporan, serta backup/restore. Berbasis Firebase Authentication dan Firebase Realtime Database. Fitur lampiran bukti transaksi/foto sengaja dihilangkan.

## Arsitektur multi-tenant

- Satu akun Firebase Authentication = satu tenant/ruang data privat.
- Setiap tenant menyimpan data di `tenants/{uid}/catatan_keuangan_v1`.
- UID ruang data diambil dari sesi Firebase Authentication, bukan dari input pengguna.
- Security Rules hanya memberi akses ke `tenants/{uid}` ketika UID tersebut sama dengan UID yang terautentikasi.
- PIN lokal disimpan terpisah per UID pada perangkat.
- Data Catatan-Ayah tidak dimigrasikan atau dihapus otomatis. Untuk membawa data lama, buat backup dari aplikasi asal lalu pulihkan secara sadar di akun Catatan Utang yang dituju. Field lampiran lama diabaikan.

## Siapkan Firebase untuk Catatan Utang

**Gunakan Firebase project baru khusus Catatan Utang. Jangan deploy aturan dari branch ini ke project produksi `catatan-ayah`** karena aplikasi asal masih memakai project tersebut.

1. Buat project Firebase baru melalui Firebase Console.
2. Tambahkan aplikasi Web dan salin nilai konfigurasi Web Firebase.
3. Aktifkan **Authentication → Sign-in method → Email/Password**.
4. Buat/aktifkan Realtime Database pada project baru.
5. Konfigurasi Web pada `index.html`, termasuk `databaseURL`, sudah diisi untuk project `catatan-utang-prod`.
6. `.firebaserc` sudah diarahkan ke project `catatan-utang-prod`.
7. Tinjau `database.rules.json` lalu deploy aturan hanya ke project baru:

   ```bash
   npm install --global firebase-tools
   firebase login
   firebase deploy --only database --project catatan-utang-prod
   ```

URL Realtime Database telah dimasukkan ke konfigurasi. Sebelum menguji aplikasi, deploy dan verifikasi aturan hanya ke project baru `catatan-utang-prod`; jangan mengarahkannya ke project Catatan-Ayah.

## Persetujuan akun oleh pemilik

Aplikasi tidak mengirim email verifikasi. Pengguna boleh membuat akun Firebase, tetapi akun baru hanya membuat permintaan akses berstatus `pending`. Pengguna tidak bisa membaca atau menulis tenant sampai pemilik menyetujui permintaan dari **Pengaturan → Persetujuan Akun**. Pemilik juga dapat menolak atau mencabut akses; Security Rules yang menjadi pengunci sebenarnya.

**Penting: atur admin pertama sebelum memublikasikan versi ini.**

1. Buka Firebase Console → **Authentication → Users → Add user** dan buat akun pemilik secara manual. Jangan gunakan tombol pendaftaran publik untuk membuat akun admin pertama.
2. Salin **UID** akun pemilik dari tabel Users.
3. Ganti `GANTI_ADMIN_FIREBASE_UID` dengan UID tersebut pada konstanta `ADMIN_UID` di `index.html` dan di setiap kemunculan string admin pada `database.rules.json`.
4. Publikasikan isi `database.rules.json` melalui **Realtime Database → Rules**. Pastikan semua kemunculan placeholder sudah diganti sebelum Publish.
5. Setelah aturan terpasang, deploy aset aplikasi. Login pertama admin memakai email/password yang dibuat di Firebase Console; kemudian admin membuat PIN lokal.
6. Pengguna umum membuat akun dan otomatis masuk ke layar **Menunggu Persetujuan Pengelola**. Admin membuka **Pengaturan → Persetujuan Akun** untuk menyetujui atau menolak. Setelah disetujui, pengguna menekan **Periksa Status Persetujuan** dan dapat membuat PIN.

Jangan menerbitkan file aturan yang masih berisi placeholder. Tanpa UID admin yang benar, admin tidak dapat menyetujui permintaan. Membuat akun dari Firebase Console tidak mengirim tautan verifikasi email oleh aplikasi ini.

## Deployment ke Firebase Hosting

Konten Hosting disiapkan di `firebase.json`; workflow GitHub Actions ada di `.github/workflows/firebase-hosting.yml` dan hanya men-deploy branch `catatan-utang-multitenant` ke project `catatan-utang-prod`. Branch `main` Catatan-Ayah tidak dipakai workflow ini.

Sebelum deployment berjalan, tambahkan secret GitHub bernama `FIREBASE_SERVICE_ACCOUNT_CATATAN_UTANG_PROD` berisi JSON key untuk service account khusus deployment Firebase Hosting. Berikan peran **Firebase Hosting Admin** dan **API Keys Viewer** (`roles/serviceusage.apiKeysViewer`) pada project `catatan-utang-prod`; API Keys Viewer diperlukan oleh deployment melalui Firebase CLI. Jangan menyimpan atau mengirim JSON key ke source code atau chat.

1. Di Google Cloud Console untuk project `catatan-utang-prod`, buat service account khusus deployment, berikan peran **Firebase Hosting Admin**, lalu buat key JSON.
2. Di GitHub repository, buka **Settings → Environments → New environment** dan beri nama `catatan-utang-prod`.
3. Batasi **Deployment branches** pada environment itu hanya ke branch `catatan-utang-multitenant`.
4. Pada environment `catatan-utang-prod`, tambahkan secret bernama `FIREBASE_SERVICE_ACCOUNT_CATATAN_UTANG_PROD`, lalu masukkan seluruh isi JSON key sebagai nilainya. Gunakan **environment secret**, bukan repository secret, agar workflow Catatan-Ayah di branch `main` tidak dapat mengakses key deployment ini.
5. Pastikan Firebase Hosting sudah diinisialisasi untuk project `catatan-utang-prod`. Jika belum, buka Firebase Console → Hosting → Get started.
6. Setelah environment dan secret siap, lakukan commit perubahan aset aplikasi pada branch `catatan-utang-multitenant`; workflow akan men-deploy ke kanal live secara otomatis. Workflow memantau aset inti/PWA dan akan mengirim semua file publik yang tidak masuk daftar pengecualian, termasuk halaman privasi, ketentuan, dan tentang.

URL live yang diharapkan: `https://catatan-utang-prod.web.app` (setelah deployment berhasil). Deployment belum dianggap selesai sampai workflow GitHub Actions berstatus sukses dan URL tersebut berhasil dibuka.

## Uji isolasi tenant sebelum publikasi

1. Buat akun A melalui tombol **Buat Akun Baru**, buat PIN, dan catat transaksi uji.
2. Keluar dari akun A. Buat akun B menggunakan email berbeda.
3. Pastikan akun B membuka ruang data kosong dan tidak dapat membaca/mengubah data akun A.
4. Uji tambah/edit transaksi, pembayaran cicilan/lunas, tagihan, laporan, ekspor CSV, backup, dan restore pada masing-masing akun.
5. Uji Rules Simulator untuk akses baca/tulis pada `/tenants/{uid}` dengan UID cocok dan UID berbeda.
6. Periksa log Console/browser dan uji di perangkat lain.

GitHub Pages hanya menyajikan berkas web statis. Autentikasi dan isolasi data ditegakkan oleh Firebase Authentication serta Realtime Database Security Rules. Jangan menganggap aplikasi siap produksi sebelum konfigurasi project baru dan pengujian dua akun berhasil.
