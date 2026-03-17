# Cara Login - Instruksi Singkat

## Status Backend
✅ Backend login sudah bekerja sempurna
✅ User data valid
✅ Session creation OK

## Masalah
Browser storage mungkin corrupt, perlu dibersihkan.

## Solusi Cepat

### Cara 1: Gunakan Tombol di Halaman Login (PALING MUDAH)
1. Buka http://localhost:3002/login
2. Login dengan: `mukhsin9@gmail.com` / `admin123`
3. Jika gagal, klik tombol **"Bersihkan Storage & Coba Lagi"**
4. Login lagi

### Cara 2: Clear Manual (Jika Cara 1 Gagal)
1. Buka http://localhost:3002/login
2. Tekan **F12** (buka DevTools)
3. Pilih tab **"Application"**
4. Klik **"Clear site data"**
5. Refresh halaman (**Ctrl+F5**)
6. Login lagi

### Cara 3: Incognito Window
1. Buka browser dalam mode **Incognito/Private**
2. Buka http://localhost:3002/login
3. Login dengan: `mukhsin9@gmail.com` / `admin123`

## Jika Masih Gagal
Buka Console (F12) dan screenshot error yang muncul.
