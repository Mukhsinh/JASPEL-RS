#!/usr/bin/env pwsh

Write-Host "🧪 Testing Sub Indicator Criteria Implementation" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Test database structure
Write-Host "1. 🗄️ Testing database structure..." -ForegroundColor Yellow
npx tsx scripts/test-sub-indicator-criteria.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database structure test passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Database structure test failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. 🌐 Starting development server..." -ForegroundColor Yellow

# Check if server is already running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Development server is already running" -ForegroundColor Green
} catch {
    Write-Host "🚀 Starting development server..." -ForegroundColor Blue
    Start-Process powershell -ArgumentList "-Command", "npm run dev" -WindowStyle Minimized
    
    # Wait for server to start
    Write-Host "⏳ Waiting for server to start..." -ForegroundColor Blue
    $maxAttempts = 30
    $attempt = 0
    
    do {
        Start-Sleep -Seconds 2
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3002" -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✅ Development server is ready!" -ForegroundColor Green
            break
        } catch {
            Write-Host "⏳ Attempt $attempt/$maxAttempts - Server not ready yet..." -ForegroundColor Yellow
        }
    } while ($attempt -lt $maxAttempts)
    
    if ($attempt -eq $maxAttempts) {
        Write-Host "❌ Server failed to start within timeout" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "3. 🎯 Manual Testing Instructions" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 CHECKLIST - Form Sub Indikator dengan Kriteria Pengukuran:" -ForegroundColor Cyan
Write-Host ""

Write-Host "LANGKAH 1: Login" -ForegroundColor White
Write-Host "  ✓ Buka: http://localhost:3002/login" -ForegroundColor Gray
Write-Host "  ✓ Login sebagai superadmin" -ForegroundColor Gray
Write-Host "  ✓ Pastikan berhasil masuk ke dashboard" -ForegroundColor Gray
Write-Host ""

Write-Host "LANGKAH 2: Akses Halaman KPI Config" -ForegroundColor White
Write-Host "  ✓ Navigasi ke: http://localhost:3002/kpi-config" -ForegroundColor Gray
Write-Host "  ✓ Pastikan halaman load tanpa error" -ForegroundColor Gray
Write-Host "  ✓ Pastikan KPI tree tampil" -ForegroundColor Gray
Write-Host ""

Write-Host "LANGKAH 3: Buka Form Tambah Sub Indikator" -ForegroundColor White
Write-Host "  ✓ Klik pada salah satu indikator di KPI tree" -ForegroundColor Gray
Write-Host "  ✓ Klik tombol 'Tambah Sub Indikator'" -ForegroundColor Gray
Write-Host "  ✓ Pastikan dialog terbuka dengan judul 'Tambah Sub Indikator'" -ForegroundColor Gray
Write-Host ""

Write-Host "LANGKAH 4: VERIFIKASI KRITERIA PENGUKURAN (POIN UTAMA)" -ForegroundColor Red
Write-Host "  ✓ Scroll ke bawah dalam dialog" -ForegroundColor Gray
Write-Host "  ✓ CARI section 'Kriteria Pengukuran Nilai/Skor'" -ForegroundColor Red
Write-Host "  ✓ PASTIKAN ada 5 baris kriteria skor:" -ForegroundColor Red
Write-Host "    - Skor 1 (field nilai + field label)" -ForegroundColor Gray
Write-Host "    - Skor 2 (field nilai + field label)" -ForegroundColor Gray
Write-Host "    - Skor 3 (field nilai + field label)" -ForegroundColor Gray
Write-Host "    - Skor 4 (field nilai + field label)" -ForegroundColor Gray
Write-Host "    - Skor 5 (field nilai + field label)" -ForegroundColor Gray
Write-Host "  ✓ PASTIKAN nilai default sudah terisi:" -ForegroundColor Red
Write-Host "    - Nilai skor: 20, 40, 60, 80, 100" -ForegroundColor Gray
Write-Host "    - Label: Sangat Kurang, Kurang, Cukup, Baik, Sangat Baik" -ForegroundColor Gray
Write-Host ""

Write-Host "LANGKAH 5: Test Form Interaction" -ForegroundColor White
Write-Host "  ✓ Isi 'Nama Sub Indikator': 'Test Kriteria'" -ForegroundColor Gray
Write-Host "  ✓ Isi 'Bobot (%)': '25'" -ForegroundColor Gray
Write-Host "  ✓ Isi 'Nilai Target': '100'" -ForegroundColor Gray
Write-Host "  ✓ Isi 'Satuan': '%'" -ForegroundColor Gray
Write-Host "  ✓ Ubah beberapa label kriteria untuk test" -ForegroundColor Gray
Write-Host ""

Write-Host "LANGKAH 6: Test Validasi" -ForegroundColor White
Write-Host "  ✓ Coba submit dengan nama kosong - harus error" -ForegroundColor Gray
Write-Host "  ✓ Coba submit dengan bobot kosong - harus error" -ForegroundColor Gray
Write-Host "  ✓ Coba kosongkan label skor - harus error" -ForegroundColor Gray
Write-Host ""

Write-Host "LANGKAH 7: Test Simpan Data" -ForegroundColor White
Write-Host "  ✓ Isi semua field dengan benar" -ForegroundColor Gray
Write-Host "  ✓ Klik tombol 'Buat'" -ForegroundColor Gray
Write-Host "  ✓ Pastikan berhasil tersimpan" -ForegroundColor Gray
Write-Host "  ✓ Pastikan sub indikator muncul di tree" -ForegroundColor Gray
Write-Host ""

Write-Host "LANGKAH 8: Test Edit" -ForegroundColor White
Write-Host "  ✓ Klik sub indikator yang baru dibuat" -ForegroundColor Gray
Write-Host "  ✓ Klik tombol edit (ikon pensil)" -ForegroundColor Gray
Write-Host "  ✓ Pastikan dialog 'Ubah Sub Indikator' terbuka" -ForegroundColor Gray
Write-Host "  ✓ PASTIKAN semua data kriteria pengukuran ter-load" -ForegroundColor Red
Write-Host ""

Write-Host "🎯 HASIL YANG DIHARAPKAN:" -ForegroundColor Green
Write-Host "  ✅ Section 'Kriteria Pengukuran Nilai/Skor' HARUS TAMPIL" -ForegroundColor Green
Write-Host "  ✅ 5 baris skor dengan field nilai dan label HARUS ADA" -ForegroundColor Green
Write-Host "  ✅ Validasi form HARUS BEKERJA untuk semua field" -ForegroundColor Green
Write-Host "  ✅ Data kriteria HARUS TERSIMPAN dan TER-LOAD saat edit" -ForegroundColor Green
Write-Host ""

Write-Host "❌ MASALAH YANG MUNGKIN TERJADI:" -ForegroundColor Red
Write-Host "  ❌ Section kriteria pengukuran tidak tampil" -ForegroundColor Red
Write-Host "  ❌ Field skor atau label tidak ada" -ForegroundColor Red
Write-Host "  ❌ Validasi tidak bekerja" -ForegroundColor Red
Write-Host "  ❌ Data tidak tersimpan atau tidak ter-load" -ForegroundColor Red
Write-Host ""

# Open browser
Write-Host "🌐 Opening browser..." -ForegroundColor Blue
Start-Process "http://localhost:3002/login"

Write-Host ""
Write-Host "🚀 SIAP UNTUK TESTING!" -ForegroundColor Green
Write-Host "Silakan ikuti checklist di atas untuk memverifikasi" -ForegroundColor Green
Write-Host "bahwa form sub indikator sudah menampilkan kriteria pengukuran." -ForegroundColor Green
Write-Host ""
Write-Host "Tekan Enter untuk melanjutkan atau Ctrl+C untuk keluar..." -ForegroundColor Yellow
Read-Host