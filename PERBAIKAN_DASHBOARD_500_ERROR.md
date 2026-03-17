# Perbaikan Dashboard Error 500

## Masalah
Dashboard menampilkan error 500 (Internal Server Error) saat diakses oleh superadmin.

## Penyebab
1. **Query ke tabel yang salah**: Dashboard service menggunakan tabel `t_kpi_assessments` yang tidak memiliki kolom `p1_score`, `p2_score`, `p3_score`, dan `final_score`
2. **Nama tabel audit salah**: Menggunakan `t_audit_logs` padahal tabel yang benar adalah `t_audit_log`
3. **RLS Policy tidak lengkap**: Superadmin tidak memiliki akses SELECT ke tabel `t_calculation_results` dan `t_individual_scores`

## Solusi yang Diterapkan

### 1. Update Dashboard Service (`lib/services/dashboard.service.ts`)
Mengubah query untuk menggunakan tabel yang benar:
- `t_kpi_assessments` → `t_calculation_results` (untuk final scores)
- `t_kpi_assessments` → `t_individual_scores` (untuk P1/P2/P3 breakdown)
- `t_audit_logs` → `t_audit_log` (untuk activity logs)

### 2. Tambah RLS Policies
Menambahkan policies baru untuk akses superadmin:
```sql
-- Superadmin dapat melihat semua calculation results
CREATE POLICY "Superadmin can view all calculation results"
ON t_calculation_results FOR SELECT USING (is_superadmin());

-- Superadmin dapat melihat semua individual scores
CREATE POLICY "Superadmin can view all individual scores"
ON t_individual_scores FOR SELECT USING (is_superadmin());

-- Unit manager dapat melihat data unit mereka
CREATE POLICY "Unit managers can view their unit calculation results"
ON t_calculation_results FOR SELECT USING (...);

CREATE POLICY "Unit managers can view their unit individual scores"
ON t_individual_scores FOR SELECT USING (...);
```

## Testing
Jalankan script test:
```powershell
.\TEST_DASHBOARD_FIXED.ps1
```

## Hasil
- Dashboard dapat diakses tanpa error 500
- Superadmin dapat melihat statistik sistem
- Data masih kosong karena belum ada perhitungan KPI (normal)

## Catatan
Dashboard akan menampilkan data setelah:
1. Konfigurasi KPI structure di menu KPI Config
2. Input realisasi KPI
3. Buat pool dan jalankan kalkulasi
