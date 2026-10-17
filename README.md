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

## Uji isolasi tenant sebelum publikasi

1. Buat akun A melalui tombol **Buat Akun Baru**, buat PIN, dan catat transaksi uji.
2. Keluar dari akun A. Buat akun B menggunakan email berbeda.
3. Pastikan akun B membuka ruang data kosong dan tidak dapat membaca/mengubah data akun A.
4. Uji tambah/edit transaksi, pembayaran cicilan/lunas, tagihan, laporan, ekspor CSV, backup, dan restore pada masing-masing akun.
5. Uji Rules Simulator untuk akses baca/tulis pada `/tenants/{uid}` dengan UID cocok dan UID berbeda.
6. Periksa log Console/browser dan uji di perangkat lain.

GitHub Pages hanya menyajikan berkas web statis. Autentikasi dan isolasi data ditegakkan oleh Firebase Authentication serta Realtime Database Security Rules. Jangan menganggap aplikasi siap produksi sebelum konfigurasi project baru dan pengujian dua akun berhasil.
