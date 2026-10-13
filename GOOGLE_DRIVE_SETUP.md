# Setup Google Drive untuk Catatan Utang Piutang

Catatan Utang Piutang menggunakan Google Drive pemilik untuk foto. Aplikasi tidak lagi memanggil ImageKit atau Vercel untuk upload/menampilkan foto.

## Arsitektur dan privasi

- Firebase Authentication tetap menangani login.
- Firebase Realtime Database tetap menyimpan transaksi.
- Foto diunggah langsung dari browser ke Google Drive akun Google yang disambungkan.
- File masuk ke folder privat **Catatan Ayah** di Drive. Nama folder lama ini dipertahankan agar referensi foto yang sudah tersimpan tetap bekerja. Aplikasi tidak mengubah izin file menjadi publik.
- Firebase menyimpan referensi `gdrive:<fileId>`, bukan URL publik. ID file digunakan agar foto privat dapat diambil melalui Google Drive API dengan token OAuth yang sah.
- Kompresi dilakukan di perangkat. Upload ditolak jika hasil kompresi masih lebih dari 100 KiB (102.400 byte).
- Token OAuth hanya disimpan di memori halaman dan dihapus ketika aplikasi dikunci. Pengguna perlu menekan kontrol akses Google Drive lagi setelah halaman dimuat ulang atau aplikasi dikunci. Foto baru langsung diunggah ketika transaksi disimpan selama token Drive masih aktif.
- Hanya akun Firebase dengan UID pemilik yang dikonfigurasi di `OWNER_UID` yang dapat memakai koneksi Drive.

## Konfigurasi Google Cloud satu kali

1. Buka [Google Cloud Console](https://console.cloud.google.com/). Gunakan project yang sesuai dengan Catatan Utang Piutang atau buat project khusus.
2. Buka **APIs & Services → Library**, cari **Google Drive API**, lalu klik **Enable**.
3. Buka **Google Auth Platform** (atau halaman OAuth consent screen pada antarmuka lama). Isi nama aplikasi dan email dukungan. Untuk pengujian, pilih tipe audiens yang sesuai dan tambahkan akun Google pemilik sebagai **Test user** jika aplikasi masih berstatus Testing.
4. Buka **Clients → Create client → Web application**.
5. Tambahkan Authorized JavaScript origin:
   - `https://mas-alim.github.io`
   - Opsional untuk server lokal: origin lokal yang benar-benar digunakan saat menguji.
6. Buat client dan salin **Client ID** yang berakhiran `.apps.googleusercontent.com`. Jangan membuat atau menaruh Client Secret di HTML.
7. Masukkan Client ID ke konfigurasi `GOOGLE_DRIVE_CLIENT_ID` di `index.html`.
8. Pastikan perubahan sudah dipublikasikan melalui GitHub Pages.

Aplikasi memakai scope `https://www.googleapis.com/auth/drive.file`, bukan izin untuk membaca semua file Drive. Folder dan foto yang dibuat aplikasi akan tetap privat secara default.

## Uji pertama

1. Buka `https://mas-alim.github.io/Catatan-Ayah/` dan login memakai akun Firebase pemilik.
2. Buka **Pengaturan → Aktifkan Akses Google Drive**.
3. Pilih akun Google pemilik Drive dan setujui izin yang diminta.
4. Buat transaksi uji dengan foto kecil. Pastikan foto yang dihasilkan tidak lebih dari 100 KiB.
5. Buka kembali foto dari transaksi. Pastikan tampil setelah halaman dimuat ulang dan setelah menyambungkan Drive kembali.
6. Unduh backup JSON secara berkala sebelum melakukan perubahan penting pada data.

## Foto Base64 lama

- Saat aplikasi dibuka dan data Firebase berhasil dimuat, aplikasi otomatis menghapus referensi foto `data:image/...` lama dari field foto transaksi dan riwayat pembayaran. Data transaksi, nominal, tanggal, dan pembayaran tetap dipertahankan.
- Foto Base64 lama yang dihapus dari Firebase tidak lagi dapat ditampilkan atau dipulihkan melalui aplikasi. Unduh backup terlebih dahulu bila foto historis masih dibutuhkan.
- Referensi berformat `drive:` dari percobaan integrasi lama tidak otomatis dianggap sebagai referensi baru. Referensi Google Drive yang dibuat versi ini memakai awalan `gdrive:`.

## Integrasi lama

- Kode aktif tidak lagi memanggil ImageKit atau endpoint Vercel.
- Backend `vercel-backend/` telah dihapus dari repository dan project backend Vercel telah dihapus secara terpisah.
- Referensi foto `imagekit:` tetap dipertahankan sebagai penanda foto lama yang belum dimigrasikan. Jangan menghapus file atau akun ImageKit sebelum semua foto lama yang masih dibutuhkan berhasil diselamatkan.

## Batasan

- Koneksi Google Drive menggunakan akun Google yang dipilih saat OAuth. Pastikan akun itu adalah akun pemilik yang memang akan menyimpan foto.
- Jika OAuth Client ID belum diisi, Drive API belum aktif, atau akun Google belum memberi izin, upload foto akan gagal dengan pesan diagnostik; transaksi lama tidak dihapus.
- URL/ID file tidak membuat file publik. Aplikasi harus tersambung ke Google Drive untuk menampilkan file privat.
