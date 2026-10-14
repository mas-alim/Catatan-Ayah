# Catatan Utang Piutang
Aplikasi pencatatan utang-piutang, pembayaran, dan tagihan dengan autentikasi Firebase serta lampiran foto privat di Google Drive.

## Keamanan Firebase Realtime Database

Repository ini menyediakan `database.rules.json` untuk membatasi baca/tulis data ke akun Firebase pemilik aplikasi. Aturan hanya mengizinkan UID yang juga diizinkan oleh pemeriksaan login aplikasi, dan menolak akses di lokasi lain. Aturan ini tidak menghapus atau memigrasikan data.

Sebelum menerapkan, pastikan UID pemilik pada aturan cocok dengan UID akun Firebase yang benar. Deploy aturan ke project `catatan-ayah` hanya setelah memeriksa konfigurasi:

```bash
npx firebase-tools login
npx firebase-tools deploy --only database --project catatan-ayah
```

Setelah deploy, uji login sebagai pemilik, membaca data, menambah transaksi, mencatat pembayaran, dan menyimpan tagihan. Jangan mengandalkan Firebase Web API key sebagai kontrol akses; proteksi data dilakukan oleh Security Rules. `firebase.json` dan `.firebaserc` disertakan untuk konfigurasi Firebase CLI, sementara GitHub Pages tetap menyajikan halaman statis seperti sebelumnya.

