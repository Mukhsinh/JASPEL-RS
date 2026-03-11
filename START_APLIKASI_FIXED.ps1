#!/usr/bin/env pwsh

Write-Host "🚀 Memulai Aplikasi JASPEL (Setelah Perbaikan)" -ForegroundColor Green

# Stop any existing processes on port 3002
Write-Host "⏹️ Menghentikan proses yang ada..." -ForegroundColor Blue
$processes = netstat -ano | findstr :3002
if ($processes) {
    $pids = $processes | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
    foreach ($pid in $pids) {
        if ($pid -and $pid -ne "0") {
            try {
                taskkill /PID $pid /F 2>$null
                Write-Host "✅ Process $pid dihentikan" -ForegroundColor Green
            } catch {
                # Process might already be stopped
            }
        }
    }
}

Write-Host "🔧 Memastikan konfigurasi optimal..." -ForegroundColor Blue

# Check if .next exists and remove if needed
if (Test-Path ".next") {
    Write-Host "🧹 Membersihkan cache lama..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

Write-Host "🚀 Memulai server development..." -ForegroundColor Green
Write-Host "📍 URL: http://localhost:3002" -ForegroundColor Cyan
Write-Host "⚡ Mode: Development (Tanpa Turbopack)" -ForegroundColor Cyan
Write-Host "" 

# Start the development server
npm run dev