# Setup Google Drive untuk Catatan Ayah

Catatan Ayah sekarang menggunakan Google Drive pemilik untuk foto. Aplikasi tidak lagi memanggil ImageKit atau Vercel untuk upload/menampilkan foto.

## Arsitektur dan privasi

- Firebase Authentication tetap menangani login.
- Firebase Realtime Database tetap menyimpan transaksi.
- Foto diunggah langsung dari browser ke Google Drive akun Google yang disambungkan.
- File masuk ke folder privat **Catatan Ayah** di Drive. Aplikasi tidak mengubah izin file menjadi publik.
- Firebase menyimpan referensi `gdrive:<fileId>`, bukan URL publik. ID file digunakan agar foto privat dapat diambil melalui Google Drive API dengan token OAuth yang sah.
- Kompresi dilakukan di perangkat. Upload ditolak jika hasil kompresi masih lebih dari 100 KiB (102.400 byte).
- Token OAuth hanya disimpan di memori halaman dan dihapus ketika aplikasi dikunci. Pengguna perlu menyambungkan Drive lagi setelah halaman dimuat ulang atau aplikasi dikunci.
- Hanya akun Firebase dengan UID pemilik yang dikonfigurasi di `OWNER_UID` yang dapat memakai koneksi Drive.

## Konfigurasi Google Cloud satu kali

1. Buka [Google Cloud Console](https://console.cloud.google.com/). Gunakan project yang sesuai dengan Catatan Ayah atau buat project khusus.
2. Buka **APIs & Services → Library**, cari **Google Drive API**, lalu klik **Enable**.
3. Buka **Google Auth Platform** (atau halaman OAuth consent screen pada antarmuka lama). Isi nama aplikasi dan email dukungan. Untuk pengujian, pilih tipe audiens yang sesuai dan tambahkan akun Google pemilik sebagai **Test user** jika aplikasi masih berstatus Testing.
4. Buka **Clients → Create client → Web application**.
5. Tambahkan Authorized JavaScript origin:
   - `https://mas-alim.github.io`
   - Opsional untuk server lokal: origin lokal yang benar-benar digunakan saat menguji.
6. Buat client dan salin **Client ID** yang berakhiran `.apps.googleusercontent.com`. Jangan membuat atau menaruh Client Secret di HTML.
7. Buka `index.html` dan ganti nilai `GOOGLE_DRIVE_CLIENT_ID` yang masih berisi placeholder dengan Client ID tersebut.
8. Commit dan push perubahan ke branch `main`, lalu tunggu GitHub Pages selesai memperbarui aplikasi.

Aplikasi memakai scope `https://www.googleapis.com/auth/drive.file`, bukan izin untuk membaca semua file Drive. Folder dan foto yang dibuat aplikasi akan tetap privat secara default.

## Uji pertama

1. Buka `https://mas-alim.github.io/Catatan-Ayah/` dan login memakai akun Firebase pemilik.
2. Buka **Pengaturan → Hubungkan Google Drive**.
3. Pilih akun Google pemilik Drive dan setujui izin yang diminta.
4. Buat transaksi uji dengan foto kecil. Pastikan foto yang dihasilkan tidak lebih dari 100 KiB.
5. Buka kembali foto dari transaksi. Pastikan tampil setelah halaman dimuat ulang dan setelah menyambungkan Drive kembali.
6. Unduh backup JSON dari aplikasi sebelum melakukan migrasi foto lama.

## Foto lama dan migrasi

- Foto Base64 lama dapat dipindahkan melalui tombol **Migrasi Foto Lama**. Satu foto diproses per kali; referensi di Firebase hanya diganti setelah upload berhasil.
- Referensi yang diawali `imagekit:` tetap dipertahankan di Firebase, tetapi aplikasi baru tidak lagi memanggil ImageKit untuk membukanya. File tersebut belum otomatis dipindahkan ke Google Drive.
- Jangan menghapus file atau menutup akun ImageKit sebelum foto lama yang masih diperlukan sudah diekspor atau dimigrasikan. Jangan menghapus referensi lama secara manual dari Firebase.
- Referensi berformat `drive:` dari percobaan integrasi lama tidak otomatis dianggap sebagai referensi baru. Referensi Google Drive yang dibuat versi ini memakai awalan `gdrive:`.

## Memutus hubungan Vercel

Kode aplikasi di `index.html` sudah tidak memakai endpoint Vercel. Untuk memutus integrasi GitHub di sisi akun Vercel juga, buka dashboard Vercel:

1. Buka project backend Catatan Ayah.
2. Masuk ke **Settings → Git**.
3. Pilih **Disconnect** untuk repository yang terhubung.
4. Setelah integrasi Drive lulus pengujian dan tidak diperlukan lagi, project Vercel dapat dihapus dari **Settings → General**. Pastikan memilih project backend yang benar.

Folder `vercel-backend/` di repository sengaja belum dihapus pada perubahan ini agar ada jejak pemulihan selama pengujian migrasi. Folder itu tidak dipanggil oleh aplikasi. Hapus setelah pengujian Drive berhasil dan Anda yakin backend lama tidak lagi diperlukan.

## Batasan

- Koneksi Google Drive menggunakan akun Google yang dipilih saat OAuth. Pastikan akun itu adalah akun pemilik yang memang akan menyimpan foto.
- Jika OAuth Client ID belum diisi, Drive API belum aktif, atau akun Google belum memberi izin, upload foto akan gagal dengan pesan diagnostik; transaksi lama tidak dihapus.
- URL/ID file tidak membuat file publik. Aplikasi harus tersambung ke Google Drive untuk menampilkan file privat.
