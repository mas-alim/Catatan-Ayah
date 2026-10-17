# Catatan Utang

Aplikasi pencatatan utang, piutang, pembayaran/cicilan, tagihan, laporan, dan backup/restore. Aplikasi menggunakan Firebase Authentication dan Firebase Realtime Database. Fitur lampiran bukti transaksi/foto tidak disertakan.

## Arsitektur multi-tenant

- Satu akun Firebase Authentication = satu tenant/ruang data.
- Setiap tenant menyimpan data pada `tenants/{uid}/catatan_keuangan_v1`.
- UID yang sedang login ditentukan oleh Firebase Authentication, bukan dari input pengguna.
- PIN lokal disimpan terpisah per UID pada perangkat.
- Security Rules mengizinkan pengguna membaca/menulis hanya node milik UID yang sama.
- Aplikasi tidak memigrasikan data Catatan-Ayah lama secara otomatis. Data lama harus diekspor lalu diimpor dengan backup secara sadar jika memang diperlukan. Field lampiran lama diabaikan oleh versi ini.

## Pengaturan Firebase

1. Di Firebase Console, aktifkan **Authentication → Sign-in method → Email/Password**.
2. Pastikan project Realtime Database yang digunakan cocok dengan konfigurasi Firebase di `index.html`.
3. Periksa `database.rules.json` sebelum deploy. Aturan mempertahankan akses owner-only lama pada `/catatan_keuangan_v1` dan menambahkan aturan UID-scoped untuk `/tenants/{uid}`.
4. Untuk menggunakan Firebase CLI:

   ```bash
   npm install --global firebase-tools
   firebase login
   firebase deploy --only database --project catatan-ayah
   ```

**Penting:** `.firebaserc` dan konfigurasi web pada branch awal masih menunjuk ke project `catatan-ayah` sebagai basis pengujian. Sebelum aplikasi dipublikasikan ke pelanggan, sebaiknya siapkan project Firebase terpisah untuk Catatan Utang, perbarui konfigurasi web dan `.firebaserc`, tinjau aturan keamanan, serta uji dua akun untuk memastikan data benar-benar terisolasi. Jangan deploy aturan ke project produksi sebelum memeriksa perubahan terhadap aplikasi Catatan-Ayah yang sedang berjalan.

## Uji isolasi tenant

1. Buat akun A melalui tombol **Buat Akun Baru**, buat PIN, lalu catat transaksi uji.
2. Keluar dan buat akun B dengan email berbeda.
3. Pastikan akun B hanya melihat ruang data kosong dan tidak bisa membaca/mengubah data akun A.
4. Uji tambah/edit transaksi, pembayaran cicilan/lunas, tagihan, laporan, backup, dan restore pada masing-masing akun.
5. Periksa Firebase Realtime Database Rules Simulator untuk akses ke `/tenants/{uid}` dengan UID yang cocok dan tidak cocok.

GitHub Pages hanya menyajikan file web statis. Login dan isolasi data dilaksanakan oleh Firebase Authentication serta Realtime Database Security Rules.
