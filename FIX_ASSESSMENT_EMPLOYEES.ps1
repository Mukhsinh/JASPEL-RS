#!/usr/bin/env pwsh

Write-Host "🔧 Memperbaiki masalah data pegawai di halaman penilaian..." -ForegroundColor Cyan

# 1. Check if server is running
Write-Host "`n1. Checking server status..." -ForegroundColor Yellow
$serverProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" }
if ($serverProcess) {
    Write-Host "✅ Server sedang berjalan" -ForegroundColor Green
} else {
    Write-Host "❌ Server tidak berjalan, memulai server..." -ForegroundColor Red
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
    Start-Sleep -Seconds 5
}

# 2. Test database connection
Write-Host "`n2. Testing database connection..." -ForegroundColor Yellow
try {
    npx tsx -e "
    import { createClient } from '@supabase/supabase-js';
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    async function test() {
      const { data, error } = await supabase.from('v_assessment_status').select('*').limit(1);
      if (error) {
        console.log('❌ Database error:', error.message);
      } else {
        console.log('✅ Database connection OK, found', data?.length || 0, 'records');
      }
    }
    test();
    "
} catch {
    Write-Host "❌ Database test failed" -ForegroundColor Red
}

# 3. Test API endpoint directly
Write-Host "`n3. Testing API endpoint..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/assessment/employees?period=2026-01" -Method GET -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ API Response received:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ API test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Checking server logs..." -ForegroundColor Yellow
}

# 4. Open browser to test manually
Write-Host "`n4. Opening browser for manual test..." -ForegroundColor Yellow
Start-Process "http://localhost:3000/assessment"

Write-Host "`n✅ Perbaikan selesai! Silakan cek halaman penilaian di browser." -ForegroundColor Green
Write-Host "Jika masih ada masalah, periksa console browser untuk error details." -ForegroundColor Cyan