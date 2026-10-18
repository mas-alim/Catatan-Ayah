# Catatan Utang

Aplikasi pencatatan utang-piutang, pembayaran/cicilan, tagihan, laporan, serta backup/restore. Berbasis Firebase Authentication dan Firebase Realtime Database. Fitur lampiran bukti transaksi/foto sengaja dihilangkan.

## Arsitektur multi-tenant

- Satu akun Firebase Authentication = satu tenant/ruang data privat.
- Setiap tenant menyimpan data di `tenants/{uid}/catatan_keuangan_v1`.
- UID ruang data diambil dari sesi Firebase Authentication, bukan dari input pengguna.
- Security Rules hanya memberi akses ke `tenants/{uid}` ketika UID tersebut sama dengan UID yang terautentikasi.
- Login dan akses data menggunakan Firebase Authentication Email/Password; tidak ada PIN lokal. Pengguna diminta login kembali jika keluar atau sesi berakhir otomatis setelah 15 menit tanpa aktivitas.
- Data Catatan-Ayah tidak dimigrasikan atau dihapus otomatis. Untuk membawa data lama, buat backup dari aplikasi asal lalu pulihkan secara sadar di akun Catatan Utang yang dituju. Field lampiran lama diabaikan.

## Siapkan Firebase untuk Catatan Utang

**Gunakan Firebase project baru khusus Catatan Utang. Jangan deploy aturan dari branch ini ke project produksi `catatan-ayah`** karena aplikasi asal masih memakai project tersebut.

1. Buat project Firebase baru melalui Firebase Console.
2. Tambahkan aplikasi Web dan salin nilai konfigurasi Web Firebase.
3. Aktifkan **Authentication → Sign-in method → Email/Password**.
4. Buat/aktifkan Realtime Database pada project baru.
5. Konfigurasi Web pada `index.html`, termasuk `databaseURL`, sudah diisi untuk project `catatan-utang-prod`.
6. `.firebaserc` sudah diarahkan ke project `catatan-utang-prod`.
7. Ikuti bagian **Persetujuan akun oleh pemilik** di bawah untuk memublikasikan aturan yang sudah dikonfigurasi khusus untuk UID admin project ini. Jangan menggunakan Security Rules versi lama.

URL Realtime Database sudah dimasukkan. Aturan yang aktif di Firebase Console harus sama dengan aturan versi persetujuan akun pada branch pengembangan; jangan mengarahkan deployment aturan ke project Catatan-Ayah.

## Persetujuan akun oleh pemilik

Aplikasi tidak mengirim email verifikasi. Pengguna boleh membuat akun Firebase, tetapi akun baru hanya membuat permintaan akses berstatus `pending`. Pengguna tidak dapat membaca atau menulis tenant sampai pemilik menyetujui permintaan melalui **Pengaturan → Persetujuan Akun**. Pemilik juga dapat menolak atau mencabut akses. Security Rules, bukan hanya kontrol antarmuka, yang menjadi pengunci akses data.

UID admin untuk project `catatan-utang-prod` sudah dimasukkan ke konstanta `ADMIN_UID` di `index.html` dan ke aturan di `database.rules.json`.

**Urutan wajib sebelum deployment:**

1. Pastikan akun admin dengan UID yang sudah dikonfigurasi memang ada di Firebase Console → **Authentication → Users**.
2. Buka Firebase Console → **Realtime Database → Rules** untuk project `catatan-utang-prod`.
3. Ganti aturan yang ada dengan seluruh isi file `database.rules.json` dari branch `catatan-utang-approval`. UID admin sudah diisi; pastikan tidak ada teks placeholder sebelum Publish.
4. Klik **Publish** dan tunggu konfirmasi sukses.
5. Setelah aturan baru dipublikasikan, baru deploy aset aplikasi. Login admin memakai email/password akun yang dibuat melalui Firebase Console; tanpa pembuatan PIN lokal.
6. Pengguna umum membuat akun dan otomatis masuk ke layar **Menunggu Persetujuan Pengelola**. Pemilik yang sedang login dan membuka aplikasi akan melihat jumlah permintaan yang menunggu serta pemberitahuan dalam aplikasi ketika permintaan baru masuk. Pemberitahuan ini aktif ketika aplikasi pemilik terbuka dan tidak terkunci.
7. Admin membuka **Pengaturan → Persetujuan Akun** untuk menyetujui atau menolak permintaan. Setelah disetujui, pengguna menekan **Periksa Status Persetujuan** dan aplikasi akan memuat data otomatis setelah status akses terverifikasi.

Jangan deploy versi aplikasi persetujuan sebelum aturan persetujuan akun terpublikasi. Bila aturan dipasang lebih dulu dan belum benar, akses akan ditolak secara default; periksa kembali UID admin sebelum menekan Publish.


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

1. Buat akun A melalui tombol **Buat Akun Baru**, tunggu persetujuan, lalu catat transaksi uji.
2. Keluar dari akun A. Buat akun B menggunakan email berbeda.
3. Pastikan akun B membuka ruang data kosong dan tidak dapat membaca/mengubah data akun A.
4. Uji tambah/edit transaksi, pembayaran cicilan/lunas, tagihan, laporan, ekspor CSV, backup, dan restore pada masing-masing akun.
5. Uji Rules Simulator untuk akses baca/tulis pada `/tenants/{uid}` dengan UID cocok dan UID berbeda.
6. Periksa log Console/browser dan uji di perangkat lain.

GitHub Pages hanya menyajikan berkas web statis. Autentikasi dan isolasi data ditegakkan oleh Firebase Authentication serta Realtime Database Security Rules. Jangan menganggap aplikasi siap produksi sebelum konfigurasi project baru dan pengujian dua akun berhasil.
