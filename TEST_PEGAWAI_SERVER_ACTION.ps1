#!/usr/bin/env pwsh

Write-Host "=== Testing Pegawai Page After Server Action Fix ===" -ForegroundColor Cyan
Write-Host ""

# Run the fix script first
Write-Host "Menjalankan perbaikan..." -ForegroundColor Yellow
& ".\scripts\fix-pegawai-server-action.ps1"

Write-Host ""
Write-Host "Memulai development server..." -ForegroundColor Yellow
Write-Host ""

# Start dev server
npm run dev
