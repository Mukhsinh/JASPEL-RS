import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface GuideSection {
  title: string
  content: string[]
  subsections?: GuideSection[]
  images?: string[]
  examples?: string[]
}

export class SystemGuideGenerator {
  private doc: jsPDF
  private yPos: number = 20
  private pageHeight: number = 280
  private margin: number = 20

  constructor() {
    this.doc = new jsPDF()
  }

  private checkPageBreak(requiredSpace: number = 20) {
    if (this.yPos + requiredSpace > this.pageHeight) {
      this.doc.addPage()
      this.yPos = this.margin
    }
  }

  private addTitle(title: string, level: number = 1) {
    this.checkPageBreak(15)
    
    const fontSize = level === 1 ? 16 : level === 2 ? 14 : 12
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    
    if (level === 1) {
      this.doc.setTextColor(41, 128, 185) // Blue
    } else {
      this.doc.setTextColor(0, 0, 0) // Black
    }
    
    this.doc.text(title, this.margin, this.yPos)
    this.yPos += fontSize * 0.6
    
    // Add underline for main titles
    if (level === 1) {
      this.doc.setDrawColor(41, 128, 185)
      this.doc.line(this.margin, this.yPos, 190, this.yPos)
      this.yPos += 5
    }
    
    this.yPos += 5
  }

  private addParagraph(text: string) {
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(0, 0, 0)
    
    const lines = this.doc.splitTextToSize(text, 170)
    
    this.checkPageBreak(lines.length * 4)
    
    lines.forEach((line: string) => {
      this.doc.text(line, this.margin, this.yPos)
      this.yPos += 4
    })
    
    this.yPos += 3
  }
  private addBulletPoint(text: string, level: number = 1) {
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(0, 0, 0)
    
    const indent = this.margin + (level - 1) * 10
    const bullet = level === 1 ? '•' : level === 2 ? '◦' : '▪'
    
    this.checkPageBreak(8)
    
    this.doc.text(bullet, indent, this.yPos)
    
    const lines = this.doc.splitTextToSize(text, 170 - (level - 1) * 10)
    lines.forEach((line: string, index: number) => {
      this.doc.text(line, indent + 8, this.yPos)
      if (index < lines.length - 1) {
        this.yPos += 4
        this.checkPageBreak(4)
      }
    })
    
    this.yPos += 6
  }

  private addTable(headers: string[], rows: string[][]) {
    this.checkPageBreak(30)
    
    autoTable(this.doc, {
      head: [headers],
      body: rows,
      startY: this.yPos,
      theme: 'striped',
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 9,
        textColor: [0, 0, 0]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: this.margin, right: this.margin }
    })
    
    this.yPos = (this.doc as any).lastAutoTable.finalY + 10
  }

  private addWarningBox(title: string, content: string) {
    // Bersihkan konten dari kode formatting yang tidak diinginkan
    const cleanContent = content
      .replace(/&\s*b\s*/gi, '') // Hapus kode & b
      .replace(/[^\w\s\.,!?;:()\-→]/g, ' ') // Hapus karakter khusus kecuali tanda baca umum dan arrow
      .replace(/\s+/g, ' ') // Ganti multiple spaces dengan single space
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .trim()
    
    const lines = this.doc.splitTextToSize(cleanContent, 160)
    const boxHeight = Math.max(25, 15 + (lines.length * 4))
    
    this.checkPageBreak(boxHeight + 5)
    
    // Draw warning box
    this.doc.setFillColor(255, 243, 205) // Light yellow
    this.doc.setDrawColor(255, 193, 7) // Yellow border
    this.doc.setLineWidth(1)
    this.doc.rect(this.margin, this.yPos - 5, 170, boxHeight, 'FD')
    
    // Warning icon and title
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(138, 109, 59) // Dark yellow
    this.doc.text('⚠ ' + title, this.margin + 5, this.yPos + 3)
    
    // Content
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(0, 0, 0) // Black text for better readability
    lines.forEach((line: string, index: number) => {
      this.doc.text(line, this.margin + 5, this.yPos + 10 + (index * 4))
    })
    
    this.yPos += boxHeight + 5
  }

  private addInfoBox(title: string, content: string) {
    // Bersihkan konten dari kode formatting yang tidak diinginkan
    const cleanContent = content
      .replace(/&\s*b\s*/gi, '') // Hapus kode & b
      .replace(/[^\w\s\.,!?;:()\-→]/g, ' ') // Hapus karakter khusus kecuali tanda baca umum dan arrow
      .replace(/\s+/g, ' ') // Ganti multiple spaces dengan single space
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .trim()
    
    const lines = this.doc.splitTextToSize(cleanContent, 160)
    const boxHeight = Math.max(25, 15 + (lines.length * 4))
    
    this.checkPageBreak(boxHeight + 5)
    
    // Draw info box
    this.doc.setFillColor(217, 237, 247) // Light blue
    this.doc.setDrawColor(52, 152, 219) // Blue border
    this.doc.setLineWidth(1)
    this.doc.rect(this.margin, this.yPos - 5, 170, boxHeight, 'FD')
    
    // Info icon and title
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(31, 81, 255) // Dark blue
    this.doc.text('ℹ ' + title, this.margin + 5, this.yPos + 3)
    
    // Content
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(0, 0, 0) // Black text for better readability
    lines.forEach((line: string, index: number) => {
      this.doc.text(line, this.margin + 5, this.yPos + 10 + (index * 4))
    })
    
    this.yPos += boxHeight + 5
  }
  
  public async generateSystemGuide(): Promise<Buffer> {
    // Cover Page
    this.addCoverPage()
    
    // Table of Contents
    this.doc.addPage()
    this.addTableOfContents()
    
    // Main Content
    this.doc.addPage()
    this.yPos = this.margin
    
    // 1. Pengenalan Sistem
    this.addSystemIntroduction()
    
    // 2. Panduan Login dan Akses
    this.addLoginGuide()
    
    // 3. Panduan untuk Superadmin
    this.addSuperadminGuide()
    
    // 4. Panduan untuk Unit Manager
    this.addUnitManagerGuide()
    
    // 5. Panduan untuk Employee
    this.addEmployeeGuide()
    
    // 6. Troubleshooting
    this.addTroubleshootingGuide()
    
    // 7. FAQ
    this.addFAQSection()
    
    // Add page numbers
    this.addPageNumbers()
    
    return Buffer.from(this.doc.output('arraybuffer'))
  }

  private addCoverPage() {
    // Get settings for cover page
    this.addCoverPageWithSettings()
  }

  private async addCoverPageWithSettings() {
    // Get settings for developer name and company info
    const { getSetting } = await import('@/lib/services/settings.service')
    const { data: companyInfo } = await getSetting('company_info')
    
    // Logo placeholder or actual logo
    if (companyInfo?.logo) {
      try {
        this.doc.addImage(companyInfo.logo, 'PNG', 85, 30, 40, 40)
      } catch (e) {
        // Fallback to placeholder if logo fails
        this.doc.setFillColor(41, 128, 185)
        this.doc.rect(85, 30, 40, 40, 'F')
        this.doc.setTextColor(255, 255, 255)
        this.doc.setFontSize(16)
        this.doc.setFont('helvetica', 'bold')
        this.doc.text('JASPEL', 105, 55, { align: 'center' })
      }
    } else {
      this.doc.setFillColor(41, 128, 185)
      this.doc.rect(85, 30, 40, 40, 'F')
      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(16)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('JASPEL', 105, 55, { align: 'center' })
    }
    
    // Title
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('PANDUAN PENGGUNA SISTEM', 105, 90, { align: 'center' })
    
    this.doc.setFontSize(20)
    this.doc.text('JASPEL KPI MANAGEMENT', 105, 105, { align: 'center' })
    
    // Subtitle
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(100, 100, 100)
    this.doc.text('Sistem Manajemen KPI dan Insentif', 105, 120, { align: 'center' })
    
    // Organization name
    if (companyInfo?.name) {
      this.doc.setFontSize(12)
      this.doc.setTextColor(0, 0, 0)
      this.doc.text(companyInfo.name, 105, 140, { align: 'center' })
    }
    
    // Developer name - ensure it's displayed prominently
    if (companyInfo?.developerName) {
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(52, 73, 94) // Dark gray for better visibility
      this.doc.text(`Dikembangkan oleh: ${companyInfo.developerName}`, 105, 160, { align: 'center' })
    } else {
      // Fallback if no developer name in settings
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(52, 73, 94)
      this.doc.text('Dikembangkan oleh: Tim Pengembang JASPEL', 105, 160, { align: 'center' })
    }
    
    // Date
    this.doc.setFontSize(12)
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(new Date().toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), 105, 215, { align: 'center' })
    
    // Footer
    this.doc.setFontSize(10)
    this.doc.setTextColor(150, 150, 150)
    this.doc.text('Panduan Lengkap Penggunaan Sistem JASPEL', 105, 270, { align: 'center' })
  }

  private addTableOfContents() {
    this.yPos = this.margin
    this.addTitle('DAFTAR ISI', 1)
    
    const contents = [
      { title: '1. Pengenalan Sistem', page: '3' },
      { title: '   1.1 Tentang JASPEL', page: '3' },
      { title: '   1.2 Fitur Utama', page: '3' },
      { title: '   1.3 Peran Pengguna', page: '4' },
      { title: '2. Panduan Login dan Akses', page: '5' },
      { title: '   2.1 Cara Login', page: '5' },
      { title: '   2.2 Reset Password', page: '5' },
      { title: '   2.3 Navigasi Dasar', page: '6' },
      { title: '3. Panduan Superadmin', page: '7' },
      { title: '   3.1 Dashboard Admin', page: '7' },
      { title: '   3.2 Manajemen Unit', page: '8' },
      { title: '   3.3 Manajemen Pengguna', page: '9' },
      { title: '   3.4 Konfigurasi KPI', page: '10' },
      { title: '   3.5 Manajemen Pool', page: '12' },
      { title: '   3.6 Laporan dan Analisis', page: '13' },
      { title: '4. Panduan Unit Manager', page: '14' },
      { title: '   4.1 Dashboard Manager', page: '14' },
      { title: '   4.2 Input Realisasi KPI', page: '15' },
      { title: '   4.3 Monitoring Tim', page: '16' },
      { title: '5. Panduan Employee', page: '17' },
      { title: '   5.1 Dashboard Pegawai', page: '17' },
      { title: '   5.2 Melihat KPI Personal', page: '18' },
      { title: '   5.3 Download Slip Insentif', page: '18' },
      { title: '6. Troubleshooting', page: '19' },
      { title: '7. FAQ (Frequently Asked Questions)', page: '21' }
    ]
    
    contents.forEach(item => {
      this.checkPageBreak(6)
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(0, 0, 0)
      
      // Title
      this.doc.text(item.title, this.margin, this.yPos)
      
      // Dots
      const titleWidth = this.doc.getTextWidth(item.title)
      const pageWidth = this.doc.getTextWidth(item.page)
      const dotsWidth = 170 - titleWidth - pageWidth - 10
      const dotsCount = Math.floor(dotsWidth / 3)
      const dots = '.'.repeat(dotsCount)
      
      this.doc.text(dots, this.margin + titleWidth + 5, this.yPos)
      
      // Page number
      this.doc.text(item.page, 190 - pageWidth, this.yPos)
      
      this.yPos += 5
    })
  }
  private addSystemIntroduction() {
    this.addTitle('1. PENGENALAN SISTEM', 1)
    
    this.addTitle('1.1 Tentang JASPEL', 2)
    this.addParagraph(
      'JASPEL (Jasa Pelayanan) adalah sistem manajemen KPI dan insentif yang dirancang khusus untuk organisasi Indonesia. ' +
      'Sistem ini mengelola pelacakan kinerja pegawai dan distribusi insentif menggunakan kerangka KPI tiga tingkat (P1, P2, P3).'
    )
    
    this.addTitle('1.2 Fitur Utama', 2)
    this.addBulletPoint('Manajemen KPI dengan struktur P1 (Posisi), P2 (Kinerja), P3 (Potensi/Perilaku)')
    this.addBulletPoint('Perhitungan insentif otomatis dengan presisi tinggi menggunakan Decimal.js')
    this.addBulletPoint('Perhitungan PPh 21 otomatis sesuai peraturan Indonesia')
    this.addBulletPoint('Import/export Excel untuk operasi massal')
    this.addBulletPoint('Generasi slip PDF dengan rincian lengkap')
    this.addBulletPoint('Dashboard real-time dengan visualisasi kinerja')
    this.addBulletPoint('Row Level Security (RLS) untuk isolasi data antar unit')
    this.addBulletPoint('Sistem audit dan notifikasi terintegrasi')
    
    this.addTitle('1.3 Peran Pengguna', 2)
    
    const roleTable = [
      ['Peran', 'Deskripsi', 'Akses Utama'],
      ['Superadmin', 'Akses penuh sistem, mengelola master data, konfigurasi pool, dan menjalankan kalkulasi', 'Semua fitur sistem'],
      ['Unit Manager', 'Input data realisasi KPI untuk pegawai di unit mereka (isolasi data diterapkan)', 'Dashboard manager, input realisasi'],
      ['Employee', 'Melihat dashboard personal dan mengunduh slip insentif', 'Dashboard pegawai, slip insentif']
    ]
    
    this.addTable(roleTable[0], roleTable.slice(1))
    
    this.addInfoBox(
      'Alur Bisnis Sistem',
      '1. Superadmin mengkonfigurasi struktur KPI dan membuat pool bulanan → ' +
      '2. Unit Manager menginput data realisasi pegawai → ' +
      '3. Sistem menghitung skor dan mendistribusikan insentif secara proporsional → ' +
      '4. Pegawai melihat hasil dan mengunduh slip'
    )
  }

  private addLoginGuide() {
    this.addTitle('2. PANDUAN LOGIN DAN AKSES', 1)
    
    this.addTitle('2.1 Cara Login', 2)
    this.addParagraph('Untuk mengakses sistem JASPEL, ikuti langkah-langkah berikut:')
    
    this.addBulletPoint('Buka browser dan akses URL sistem JASPEL')
    this.addBulletPoint('Masukkan email dan password yang telah diberikan oleh administrator')
    this.addBulletPoint('Klik tombol "Masuk" untuk mengakses sistem')
    this.addBulletPoint('Sistem akan mengarahkan Anda ke dashboard sesuai dengan peran Anda')
    
    this.addWarningBox(
      'Keamanan Login',
      'Jangan pernah membagikan kredensial login Anda kepada orang lain. ' +
      'Selalu logout setelah selesai menggunakan sistem, terutama jika menggunakan komputer bersama.'
    )
    
    this.addTitle('2.2 Reset Password', 2)
    this.addParagraph('Jika Anda lupa password, ikuti langkah berikut:')
    
    this.addBulletPoint('Di halaman login, klik link "Lupa Password?"')
    this.addBulletPoint('Masukkan email yang terdaftar di sistem')
    this.addBulletPoint('Cek email Anda untuk link reset password')
    this.addBulletPoint('Klik link di email dan buat password baru')
    this.addBulletPoint('Login dengan password baru Anda')
    
    this.addTitle('2.3 Navigasi Dasar', 2)
    this.addParagraph('Setelah login, Anda akan melihat elemen-elemen berikut:')
    
    this.addBulletPoint('Sidebar Kiri: Menu navigasi utama sesuai peran Anda')
    this.addBulletPoint('Header Atas: Informasi pengguna, notifikasi, dan tombol logout')
    this.addBulletPoint('Area Konten: Halaman utama yang menampilkan informasi dan fitur')
    this.addBulletPoint('Footer: Informasi sistem dan copyright')
    
    this.addInfoBox(
      'Tips Navigasi',
      'Gunakan breadcrumb di bagian atas konten untuk mengetahui posisi Anda dalam sistem. ' +
      'Menu sidebar dapat diklik untuk berpindah antar halaman dengan cepat.'
    )
  }
  private addSuperadminGuide() {
    this.addTitle('3. PANDUAN SUPERADMIN', 1)
    
    this.addTitle('3.1 Dashboard Admin', 2)
    this.addParagraph(
      'Dashboard admin memberikan gambaran menyeluruh tentang sistem dan kinerja organisasi. ' +
      'Anda dapat melihat statistik utama, status pool, dan ringkasan kinerja unit.'
    )
    
    this.addBulletPoint('Statistik Utama: Total unit, pegawai, dan pool aktif')
    this.addBulletPoint('Grafik Kinerja: Visualisasi kinerja per unit dan periode')
    this.addBulletPoint('Status Pool: Informasi pool yang sedang berjalan')
    this.addBulletPoint('Notifikasi: Pemberitahuan penting yang memerlukan tindakan')
    
    this.addTitle('3.2 Manajemen Unit', 2)
    this.addParagraph('Kelola unit organisasi melalui menu "Unit". Fitur yang tersedia:')
    
    this.addBulletPoint('Tambah Unit Baru: Klik tombol "Tambah Unit"')
    this.addBulletPoint('Edit Unit: Klik ikon edit pada baris unit yang ingin diubah')
    this.addBulletPoint('Hapus Unit: Klik ikon hapus (hanya jika tidak ada data terkait)')
    this.addBulletPoint('Import Excel: Upload file Excel untuk menambah unit secara massal')
    this.addBulletPoint('Export Data: Unduh data unit dalam format Excel')
    
    const unitFields = [
      ['Field', 'Deskripsi', 'Wajib'],
      ['Kode Unit', 'Kode unik untuk identifikasi unit', 'Ya'],
      ['Nama Unit', 'Nama lengkap unit/departemen', 'Ya'],
      ['Persentase Proporsi', 'Bobot unit dalam distribusi insentif (0-100%)', 'Ya'],
      ['Status Aktif', 'Menentukan apakah unit masih aktif', 'Ya']
    ]
    
    this.addTable(unitFields[0], unitFields.slice(1))
    
    this.addWarningBox(
      'Perhatian Proporsi Unit',
      'Total persentase proporsi semua unit aktif harus sama dengan 100%. ' +
      'Sistem akan memberikan peringatan jika total tidak sesuai.'
    )
    
    this.addTitle('3.3 Manajemen Pengguna', 2)
    this.addParagraph('Kelola pengguna sistem melalui menu "Pengguna". Langkah-langkah:')
    
    this.addBulletPoint('Tambah Pengguna: Klik "Tambah Pengguna" dan isi form lengkap')
    this.addBulletPoint('Edit Pengguna: Klik ikon edit untuk mengubah data pengguna')
    this.addBulletPoint('Reset Password: Klik ikon reset untuk mengirim email reset password')
    this.addBulletPoint('Nonaktifkan Pengguna: Ubah status menjadi tidak aktif')
    
    const userFields = [
      ['Field', 'Deskripsi', 'Catatan'],
      ['Email', 'Email untuk login dan notifikasi', 'Harus unik'],
      ['Nama Lengkap', 'Nama lengkap pengguna', 'Sesuai identitas'],
      ['Unit', 'Unit tempat pengguna bekerja', 'Pilih dari daftar'],
      ['Peran', 'Peran dalam sistem (superadmin/unit_manager/employee)', 'Tentukan akses'],
      ['NIK', 'Nomor Induk Kependudukan', 'Opsional'],
      ['Jabatan', 'Jabatan/posisi dalam organisasi', 'Opsional'],
      ['Info Bank', 'Data rekening untuk transfer insentif', 'Untuk pegawai']
    ]
    
    this.addTable(userFields[0], userFields.slice(1))
    
    this.addTitle('3.4 Konfigurasi KPI', 2)
    this.addParagraph(
      'Konfigurasi KPI adalah fitur paling penting dalam sistem. Di sini Anda mengatur struktur KPI ' +
      'untuk setiap unit dengan kerangka P1, P2, P3.'
    )
    
    this.addTitle('3.4.1 Struktur KPI', 3)
    this.addParagraph('Sistem menggunakan struktur hierarkis tiga tingkat:')
    
    this.addBulletPoint('Kategori KPI (P1, P2, P3) - Level tertinggi dengan bobot persentase')
    this.addBulletPoint('Indikator KPI - Indikator spesifik dalam setiap kategori')
    this.addBulletPoint('Sub Indikator - Detail lebih spesifik dari indikator (opsional)')
    
    const kpiStructure = [
      ['Level', 'Deskripsi', 'Contoh', 'Bobot'],
      ['P1 (Posisi)', 'Indikator berbasis deskripsi jabatan', 'Kehadiran, Kedisiplinan', '30%'],
      ['P2 (Kinerja)', 'Target output/hasil kerja', 'Target Penjualan, Produktivitas', '50%'],
      ['P3 (Potensi)', 'Kompetensi dan perilaku', 'Kerjasama, Inovasi', '20%']
    ]
    
    this.addTable(kpiStructure[0], kpiStructure.slice(1))
    
    this.addTitle('3.4.2 Langkah Konfigurasi KPI', 3)
    this.addParagraph('Ikuti langkah-langkah berikut untuk mengkonfigurasi KPI:')
    
    this.addBulletPoint('Pilih unit yang akan dikonfigurasi dari dropdown')
    this.addBulletPoint('Tambah Kategori KPI (P1, P2, P3) dengan bobot masing-masing')
    this.addBulletPoint('Untuk setiap kategori, tambah indikator dengan bobot dan target')
    this.addBulletPoint('Jika diperlukan, tambah sub indikator dengan kriteria penilaian')
    this.addBulletPoint('Pastikan total bobot setiap level = 100%')
    this.addBulletPoint('Simpan dan validasi konfigurasi')
    
    this.addWarningBox(
      'Validasi Bobot',
      'Sistem akan memvalidasi bahwa total bobot di setiap level harus 100%. ' +
      'Kategori P1+P2+P3 = 100%, Indikator dalam kategori = 100%, Sub indikator = 100%.'
    )
    
    this.addTitle('3.4.3 Kriteria Penilaian Sub Indikator', 3)
    this.addParagraph('Sub indikator menggunakan sistem penilaian fleksibel dengan kriteria:')
    
    this.addBulletPoint('Rentang Nilai: Tentukan nilai minimum dan maksimum untuk setiap skor')
    this.addBulletPoint('Label Deskriptif: Berikan label yang menjelaskan tingkat pencapaian')
    this.addBulletPoint('Skor 1-5: Sistem mendukung skala penilaian 1 sampai 5')
    
    const scoringExample = [
      ['Skor', 'Rentang Nilai', 'Label', 'Deskripsi'],
      ['1', '0-20', 'Sangat Kurang', 'Pencapaian sangat rendah'],
      ['2', '21-40', 'Kurang', 'Pencapaian di bawah standar'],
      ['3', '41-60', 'Cukup', 'Pencapaian memenuhi standar minimum'],
      ['4', '61-80', 'Baik', 'Pencapaian di atas standar'],
      ['5', '81-100', 'Sangat Baik', 'Pencapaian excellent']
    ]
    
    this.addTable(scoringExample[0], scoringExample.slice(1))
    
    this.addTitle('3.4.4 Copy Struktur KPI', 3)
    this.addParagraph('Untuk efisiensi, Anda dapat menyalin struktur KPI dari unit lain:')
    
    this.addBulletPoint('Klik tombol "Copy Struktur" di halaman konfigurasi KPI')
    this.addBulletPoint('Pilih unit sumber yang akan disalin strukturnya')
    this.addBulletPoint('Pilih unit tujuan yang akan menerima struktur')
    this.addBulletPoint('Konfirmasi copy - struktur akan disalin lengkap dengan bobot')
    this.addBulletPoint('Sesuaikan jika diperlukan setelah copy selesai')
    
    this.addInfoBox(
      'Tips Konfigurasi KPI',
      'Mulai dengan struktur sederhana terlebih dahulu. Anda dapat menambah kompleksitas secara bertahap. ' +
      'Libatkan unit manager dalam menentukan indikator yang relevan untuk unit mereka.'
    )
    
    this.addTitle('3.5 Manajemen Pool', 2)
    this.addParagraph(
      'Pool adalah dana insentif yang akan didistribusikan kepada pegawai berdasarkan kinerja mereka. ' +
      'Kelola pool melalui menu "Pool".'
    )
    
    this.addTitle('3.5.1 Membuat Pool Baru', 3)
    this.addBulletPoint('Klik tombol "Tambah Pool" di halaman pool')
    this.addBulletPoint('Isi periode (format: YYYY-MM, contoh: 2024-01)')
    this.addBulletPoint('Tambah sumber pendapatan dengan deskripsi dan jumlah')
    this.addBulletPoint('Tambah potongan/deduction jika ada')
    this.addBulletPoint('Tentukan persentase alokasi global (biasanya 100%)')
    this.addBulletPoint('Simpan pool dengan status "draft"')
    
    const poolFields = [
      ['Field', 'Deskripsi', 'Contoh'],
      ['Periode', 'Bulan dan tahun pool', '2024-01'],
      ['Total Pendapatan', 'Jumlah total pendapatan', 'Rp 1.000.000.000'],
      ['Total Potongan', 'Jumlah total potongan', 'Rp 50.000.000'],
      ['Net Pool', 'Pendapatan - Potongan (otomatis)', 'Rp 950.000.000'],
      ['Alokasi Global', 'Persentase yang dialokasikan', '100%'],
      ['Jumlah Teralokasi', 'Net Pool × Alokasi (otomatis)', 'Rp 950.000.000']
    ]
    
    this.addTable(poolFields[0], poolFields.slice(1))
    
    this.addTitle('3.5.2 Approval dan Distribusi Pool', 3)
    this.addParagraph('Setelah pool dibuat, ikuti proses approval:')
    
    this.addBulletPoint('Review data pool yang telah dibuat')
    this.addBulletPoint('Klik "Approve" untuk menyetujui pool')
    this.addBulletPoint('Pool yang sudah diapprove dapat digunakan untuk kalkulasi')
    this.addBulletPoint('Jalankan kalkulasi insentif melalui menu "Kalkulasi"')
    this.addBulletPoint('Monitor hasil distribusi melalui laporan')
    
    this.addWarningBox(
      'Perhatian Pool',
      'Pool yang sudah diapprove tidak dapat diubah. Pastikan semua data sudah benar sebelum approval. ' +
      'Hanya satu pool yang dapat aktif per periode.'
    )
    
    this.addTitle('3.6 Laporan dan Analisis', 2)
    this.addParagraph('Sistem menyediakan berbagai laporan untuk analisis kinerja dan insentif:')
    
    this.addBulletPoint('Laporan Kinerja Unit: Perbandingan kinerja antar unit')
    this.addBulletPoint('Laporan Individual: Detail kinerja per pegawai')
    this.addBulletPoint('Laporan Distribusi Insentif: Rincian pembagian insentif')
    this.addBulletPoint('Laporan Audit: Log aktivitas sistem')
    this.addBulletPoint('Export Excel/PDF: Unduh laporan dalam berbagai format')
    
    const reportTypes = [
      ['Jenis Laporan', 'Deskripsi', 'Format'],
      ['Dashboard Summary', 'Ringkasan kinerja real-time', 'Web'],
      ['Unit Performance', 'Kinerja per unit per periode', 'Excel, PDF'],
      ['Individual Report', 'Detail kinerja pegawai', 'Excel, PDF'],
      ['Incentive Distribution', 'Rincian distribusi insentif', 'Excel, PDF'],
      ['Audit Trail', 'Log aktivitas dan perubahan', 'Excel']
    ]
    
    this.addTable(reportTypes[0], reportTypes.slice(1))
  }

  private addUnitManagerGuide() {
    this.addTitle('4. PANDUAN UNIT MANAGER', 1)
    
    this.addTitle('4.1 Dashboard Manager', 2)
    this.addParagraph(
      'Dashboard unit manager menampilkan informasi khusus untuk unit Anda. ' +
      'Anda hanya dapat melihat dan mengelola data pegawai di unit Anda sendiri.'
    )
    
    this.addBulletPoint('Statistik Unit: Jumlah pegawai, KPI aktif, status realisasi')
    this.addBulletPoint('Progress Realisasi: Persentase penyelesaian input realisasi')
    this.addBulletPoint('Grafik Kinerja: Visualisasi kinerja unit per periode')
    this.addBulletPoint('Notifikasi: Pengingat deadline dan update penting')
    
    this.addTitle('4.2 Input Realisasi KPI', 2)
    this.addParagraph('Tugas utama unit manager adalah menginput realisasi KPI pegawai:')
    
    this.addTitle('4.2.1 Langkah Input Realisasi', 3)
    this.addBulletPoint('Pilih periode yang akan diinput dari dropdown')
    this.addBulletPoint('Pilih pegawai dari daftar pegawai di unit Anda')
    this.addBulletPoint('Sistem akan menampilkan semua indikator KPI untuk pegawai tersebut')
    this.addBulletPoint('Input nilai realisasi untuk setiap indikator')
    this.addBulletPoint('Tambahkan catatan jika diperlukan')
    this.addBulletPoint('Simpan data realisasi')
    
    this.addTitle('4.2.2 Tips Input Realisasi', 3)
    this.addBulletPoint('Input data secara berkala, jangan menunggu akhir periode')
    this.addBulletPoint('Pastikan data yang diinput akurat dan dapat dipertanggungjawabkan')
    this.addBulletPoint('Gunakan fitur catatan untuk memberikan konteks tambahan')
    this.addBulletPoint('Review data sebelum menyimpan')
    
    const realizationFields = [
      ['Field', 'Deskripsi', 'Contoh'],
      ['Periode', 'Bulan/tahun realisasi', '2024-01'],
      ['Pegawai', 'Nama pegawai yang dinilai', 'John Doe'],
      ['Indikator', 'Nama indikator KPI', 'Target Penjualan'],
      ['Target', 'Nilai target (otomatis dari konfigurasi)', '100'],
      ['Realisasi', 'Nilai aktual yang dicapai', '85'],
      ['Pencapaian', 'Persentase pencapaian (otomatis)', '85%'],
      ['Skor', 'Skor yang diperoleh (otomatis)', '85'],
      ['Catatan', 'Keterangan tambahan', 'Terdampak kondisi pasar']
    ]
    
    this.addTable(realizationFields[0], realizationFields.slice(1))
    
    this.addInfoBox(
      'Perhitungan Otomatis',
      'Sistem akan menghitung persentase pencapaian dan skor secara otomatis berdasarkan realisasi yang Anda input. ' +
      'Untuk sub indikator dengan kriteria khusus, sistem akan menggunakan skala penilaian yang telah dikonfigurasi.'
    )
    
    this.addTitle('4.3 Monitoring Tim', 2)
    this.addParagraph('Monitor kinerja tim Anda melalui berbagai fitur:')
    
    this.addBulletPoint('Status Realisasi: Lihat pegawai mana yang sudah/belum input realisasi')
    this.addBulletPoint('Ranking Kinerja: Urutan kinerja pegawai dalam unit')
    this.addBulletPoint('Trend Analysis: Perkembangan kinerja dari waktu ke waktu')
    this.addBulletPoint('Export Data: Unduh data untuk analisis lebih lanjut')
  }

  private addEmployeeGuide() {
    this.addTitle('5. PANDUAN EMPLOYEE', 1)
    
    this.addTitle('5.1 Dashboard Pegawai', 2)
    this.addParagraph(
      'Dashboard pegawai menampilkan informasi personal tentang kinerja dan insentif Anda.'
    )
    
    this.addBulletPoint('Ringkasan Kinerja: Skor P1, P2, P3 periode terkini')
    this.addBulletPoint('Grafik Trend: Perkembangan kinerja beberapa periode terakhir')
    this.addBulletPoint('Status Insentif: Informasi insentif yang akan/sudah diterima')
    this.addBulletPoint('Ranking: Posisi Anda dalam unit (jika diaktifkan)')
    
    this.addTitle('5.2 Melihat KPI Personal', 2)
    this.addParagraph('Anda dapat melihat detail KPI dan realisasi Anda:')
    
    this.addBulletPoint('Daftar Indikator: Semua KPI yang berlaku untuk Anda')
    this.addBulletPoint('Target vs Realisasi: Perbandingan target dan pencapaian')
    this.addBulletPoint('Skor Detail: Breakdown skor per kategori dan indikator')
    this.addBulletPoint('History: Riwayat kinerja periode sebelumnya')
    
    this.addTitle('5.3 Download Slip Insentif', 2)
    this.addParagraph('Setelah kalkulasi selesai, Anda dapat mengunduh slip insentif:')
    
    this.addBulletPoint('Pilih periode yang ingin diunduh')
    this.addBulletPoint('Klik tombol "Download Slip PDF"')
    this.addBulletPoint('Slip akan berisi rincian lengkap perhitungan insentif')
    this.addBulletPoint('Simpan slip sebagai bukti penerimaan insentif')
    
    const slipContents = [
      ['Bagian Slip', 'Informasi yang Ditampilkan'],
      ['Header', 'Nama, NIP, Unit, Periode'],
      ['Kinerja', 'Skor P1, P2, P3 dan total'],
      ['Perhitungan', 'Unit score, individual score, final score'],
      ['Insentif', 'Gross incentive, pajak PPh 21, net incentive'],
      ['Bank', 'Informasi rekening untuk transfer'],
      ['Footer', 'Tanggal cetak dan validasi']
    ]
    
    this.addTable(slipContents[0], slipContents.slice(1))
  }

  private addTroubleshootingGuide() {
    this.addTitle('6. TROUBLESHOOTING', 1)
    
    this.addTitle('6.1 Masalah Login', 2)
    
    const loginIssues = [
      ['Masalah', 'Penyebab', 'Solusi'],
      ['Email/password salah', 'Kredensial tidak valid', 'Periksa kembali email dan password, gunakan reset password jika perlu'],
      ['Akun terkunci', 'Terlalu banyak percobaan login gagal', 'Hubungi administrator untuk unlock akun'],
      ['Halaman tidak bisa diakses', 'Masalah jaringan atau server', 'Periksa koneksi internet, coba refresh browser'],
      ['Session expired', 'Sesi login sudah habis', 'Login ulang ke sistem']
    ]
    
    this.addTable(loginIssues[0], loginIssues.slice(1))
    
    this.addTitle('6.2 Masalah Input Data', 2)
    
    const dataIssues = [
      ['Masalah', 'Penyebab', 'Solusi'],
      ['Data tidak tersimpan', 'Validasi gagal atau koneksi terputus', 'Periksa semua field wajib, pastikan koneksi stabil'],
      ['Bobot tidak valid', 'Total bobot tidak 100%', 'Sesuaikan bobot agar total = 100%'],
      ['Unit tidak muncul', 'Unit tidak aktif atau tidak ada akses', 'Hubungi administrator untuk aktivasi unit'],
      ['Pegawai tidak muncul', 'Pegawai tidak aktif atau beda unit', 'Periksa status pegawai dan unit assignment']
    ]
    
    this.addTable(dataIssues[0], dataIssues.slice(1))
    
    this.addTitle('6.3 Masalah Export/Download', 2)
    
    const exportIssues = [
      ['Masalah', 'Penyebab', 'Solusi'],
      ['File tidak terdownload', 'Browser block atau popup disabled', 'Enable popup, coba browser lain'],
      ['File kosong/error', 'Data tidak ada atau server error', 'Pastikan ada data untuk periode tersebut'],
      ['Format file rusak', 'Proses export terganggu', 'Coba download ulang, hubungi admin jika masih error'],
      ['PDF tidak bisa dibuka', 'File corrupt atau reader issue', 'Download ulang, update PDF reader']
    ]
    
    this.addTable(exportIssues[0], exportIssues.slice(1))
    
    this.addWarningBox(
      'Kapan Hubungi Administrator',
      'Hubungi administrator sistem jika: 1) Masalah berlanjut setelah mencoba solusi di atas, ' +
      '2) Ada error message yang tidak dipahami, 3) Butuh perubahan konfigurasi atau akses, ' +
      '4) Menemukan bug atau masalah sistem.'
    )
  }

  private addFAQSection() {
    this.addTitle('7. FAQ (FREQUENTLY ASKED QUESTIONS)', 1)
    
    const faqs = [
      {
        q: 'Bagaimana cara mengubah password saya?',
        a: 'Klik profil Anda di header, pilih "Ubah Password", masukkan password lama dan password baru, lalu simpan.'
      },
      {
        q: 'Mengapa saya tidak bisa melihat data unit lain?',
        a: 'Sistem menggunakan Row Level Security (RLS) untuk isolasi data. Unit Manager hanya dapat melihat data unit mereka sendiri untuk menjaga keamanan dan privasi.'
      },
      {
        q: 'Kapan deadline input realisasi KPI?',
        a: 'Deadline biasanya tanggal 5 bulan berikutnya. Misalnya realisasi Januari deadline 5 Februari. Cek notifikasi sistem untuk deadline spesifik.'
      },
      {
        q: 'Bagaimana cara menghitung skor KPI?',
        a: 'Skor dihitung otomatis: (Realisasi / Target) × 100. Untuk sub indikator dengan kriteria khusus, sistem menggunakan skala penilaian yang dikonfigurasi admin.'
      },
      {
        q: 'Mengapa insentif saya berbeda dengan rekan kerja?',
        a: 'Insentif dihitung berdasarkan: 1) Kinerja individual (P1+P2+P3), 2) Kinerja unit, 3) Proporsi dalam distribusi pool. Setiap pegawai memiliki perhitungan yang unik.'
      },
      {
        q: 'Bisakah saya mengubah data realisasi yang sudah disimpan?',
        a: 'Ya, selama periode masih terbuka dan belum dikunci admin. Setelah periode dikunci untuk kalkulasi, data tidak dapat diubah.'
      },
      {
        q: 'Bagaimana cara melihat riwayat kinerja saya?',
        a: 'Di dashboard pegawai, pilih periode yang ingin dilihat dari dropdown. Anda dapat melihat trend kinerja dalam grafik dan detail skor.'
      },
      {
        q: 'Apa itu PPh 21 dan bagaimana perhitungannya?',
        a: 'PPh 21 adalah pajak penghasilan yang dipotong dari insentif sesuai peraturan Indonesia. Sistem menghitung otomatis berdasarkan status pajak dan jumlah insentif.'
      },
      {
        q: 'Mengapa sistem lambat atau tidak responsif?',
        a: 'Periksa koneksi internet Anda. Jika masalah berlanjut, coba refresh browser atau clear cache. Hubungi admin jika masalah sistemik.'
      },
      {
        q: 'Bisakah saya mengakses sistem dari mobile?',
        a: 'Ya, sistem responsive dan dapat diakses dari mobile browser. Namun untuk pengalaman terbaik, disarankan menggunakan desktop/laptop.'
      }
    ]
    
    faqs.forEach((faq, index) => {
      this.addTitle(`${index + 1}. ${faq.q}`, 3)
      this.addParagraph(faq.a)
    })
    
    this.addInfoBox(
      'Butuh Bantuan Lebih Lanjut?',
      'Jika pertanyaan Anda tidak terjawab dalam FAQ ini, silakan hubungi administrator sistem atau tim IT support. ' +
      'Sertakan screenshot dan deskripsi detail masalah untuk penanganan yang lebih cepat.'
    )
  }

  private async addPageNumbers() {
    const pageCount = this.doc.getNumberOfPages()
    
    // Get footer text from settings
    const { getSetting } = await import('@/lib/services/settings.service')
    const { data: footerData } = await getSetting('footer')
    const footerText = footerData?.text || 'Panduan Pengguna Sistem JASPEL KPI Management'
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Skip page number on cover page
      if (i === 1) continue
      
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(100, 100, 100)
      
      // Page number
      this.doc.text(`Halaman ${i} dari ${pageCount}`, 105, 290, { align: 'center' })
      
      // Footer text from settings
      this.doc.text(footerText, 105, 295, { align: 'center' })
    }
  }
}

// Export function to generate guide
export async function generateSystemGuide(): Promise<Buffer> {
  const generator = new SystemGuideGenerator()
  return generator.generateSystemGuide()
}