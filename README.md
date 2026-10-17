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

## Deployment ke Firebase Hosting

Konten Hosting disiapkan di `firebase.json`; workflow GitHub Actions ada di `.github/workflows/firebase-hosting.yml` dan hanya men-deploy branch `catatan-utang-multitenant` ke project `catatan-utang-prod`. Branch `main` Catatan-Ayah tidak dipakai workflow ini.

Sebelum deployment berjalan, tambahkan secret GitHub bernama `FIREBASE_SERVICE_ACCOUNT_CATATAN_UTANG_PROD` berisi JSON key untuk service account khusus deployment Firebase Hosting. Berikan peran minimum **Firebase Hosting Admin** pada project `catatan-utang-prod`. Jangan menyimpan atau mengirim JSON key ke source code atau chat.

1. Di Google Cloud Console untuk project `catatan-utang-prod`, buat service account khusus deployment, berikan peran **Firebase Hosting Admin**, lalu buat key JSON.
2. Di GitHub repository, buka **Settings → Secrets and variables → Actions → New repository secret**.
3. Isi nama secret persis `FIREBASE_SERVICE_ACCOUNT_CATATAN_UTANG_PROD`, lalu masukkan seluruh isi JSON key sebagai nilainya.
4. Pastikan Firebase Hosting sudah diinisialisasi untuk project `catatan-utang-prod`. Jika belum, buka Firebase Console → Hosting → Get started.
5. Setelah secret siap, lakukan commit perubahan aset aplikasi pada branch `catatan-utang-multitenant`; workflow akan men-deploy ke kanal live secara otomatis.

URL live yang diharapkan: `https://catatan-utang-prod.web.app` (setelah deployment berhasil). Deployment belum dianggap selesai sampai workflow GitHub Actions berstatus sukses dan URL tersebut berhasil dibuka.

## Uji isolasi tenant sebelum publikasi

1. Buat akun A melalui tombol **Buat Akun Baru**, buat PIN, dan catat transaksi uji.
2. Keluar dari akun A. Buat akun B menggunakan email berbeda.
3. Pastikan akun B membuka ruang data kosong dan tidak dapat membaca/mengubah data akun A.
4. Uji tambah/edit transaksi, pembayaran cicilan/lunas, tagihan, laporan, ekspor CSV, backup, dan restore pada masing-masing akun.
5. Uji Rules Simulator untuk akses baca/tulis pada `/tenants/{uid}` dengan UID cocok dan UID berbeda.
6. Periksa log Console/browser dan uji di perangkat lain.

GitHub Pages hanya menyajikan berkas web statis. Autentikasi dan isolasi data ditegakkan oleh Firebase Authentication serta Realtime Database Security Rules. Jangan menganggap aplikasi siap produksi sebelum konfigurasi project baru dan pengujian dua akun berhasil.
