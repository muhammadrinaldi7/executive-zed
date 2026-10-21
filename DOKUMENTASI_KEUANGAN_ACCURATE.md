# 📊 DOKUMENTASI LENGKAP: INTEGRASI KEUANGAN RIIL ACCURATE ONLINE
**Executive App & Tokopon Backend**

> **Tanggal Dokumen:** 20 Oktober 2026  
> **Target Pengguna:** Direktur Keuangan, Owner, Tim Akuntansi, dan Developer  
> **Status:** Terverifikasi & Sinkron dengan Database Accurate Online (ID: 2635401)  

---

## DAFTAR ISI
1. [Latar Belakang & Masalah Sebelumnya](#1-latar-belakang--masalah-sebelumnya)
2. [Daftar File yang Dibuat & Dimodifikasi](#2-daftar-file-yang-dibuat--dimodifikasi)
3. [Sumber Data Resmi Accurate Online (API Endpoints)](#3-sumber-data-resmi-accurate-online-api-endpoints)
4. [Rumus-Rumus Perhitungan Lengkap (Format Bersih & Mudah Dibaca)](#4-rumus-rumus-perhitungan-lengkap)
   - [Rumus 1: Total Piutang Riil (Accounts Receivable / AR)](#rumus-1-total-piutang-riil-accounts-receivable--ar)
   - [Rumus 2: Total Hutang Supplier (Accounts Payable / AP)](#rumus-2-total-hutang-supplier-accounts-payable--ap)
   - [Rumus 3: Modal Kerja Bersih (Net Working Capital)](#rumus-3-modal-kerja-bersih-net-working-capital)
   - [Rumus 4: Total Kas & Rekening Bank Likuid](#rumus-4-total-kas--rekening-bank-likuid)
   - [Rumus 5: Rasio Kecukupan Kas terhadap Hutang Supplier](#rumus-5-rasio-kecukupan-kas-terhadap-hutang-supplier)
   - [Rumus 6: Umur Faktur (Aging Days)](#rumus-6-umur-faktur-aging-days)
   - [Rumus 7: Klasifikasi Kelompok Umur (Aging Buckets)](#rumus-7-klasifikasi-kelompok-umur-aging-buckets)
   - [Rumus 8: Persentase Porsi Debitur & Supplier](#rumus-8-persentase-porsi-debitur--supplier)
   - [Rumus 9: Tanda Tangan Keamanan Otentikasi API Accurate](#rumus-9-tanda-tangan-keamanan-otentikasi-api-accurate)
5. [Perbandingan: Logika POS Lama vs Logika Akuntansi Accurate](#5-perbandingan-logika-pos-lama-vs-logika-akuntansi-accurate)
6. [Panduan Deployment & Menjalankan Sistem](#6-panduan-deployment--menjalankan-sistem)

---

## 1. LATAR BELAKANG & MASALAH SEBELUMNYA

### Masalah Utama Pada Sistem POS Lama:
Sebelum integrasi ini, dashboard eksekutif mengambil angka piutang dari tabel pesanan kasir (`orders`) dengan filter tanggal terbatas (misalnya filter bulan berjalan: 1 s/d 20 Oktober). Hal ini menyebabkan:
1. **Faktur Piutang Menghilang:** Tagihan penjualan tempo atau cicilan (seperti Kredivo, Akulaku, Shopee, dan pelanggan grosir) yang terbit di bulan sebelumnya (misal bulan September) otomatis hilang dari laporan jika filter tanggal diarahkan ke bulan Oktober, padahal pembeli **belum melunasi tagihannya**.
2. **Angka Semu (Tidak Real):** Nilai piutang hanya tercatat belasan juta rupiah, sangat jauh dari kondisi riil keuangan perusahaan di Accurate yang mencapai **Rp 406 Juta**.
3. **Tidak Menghitung Sisa Angsuran:** POS hanya mencatat total awal nota penjualan (`grand_total`), bukan sisa tagihan berjalan setelah dipotong angsuran sebagian.

### Solusi yang Diterapkan:
1. Menghubungkan dashboard langsung ke server **Buku Besar Accurate Online** melalui API resmi.
2. Menggunakan metode akuntansi neraca **As-of-Date (Per Tanggal Berjalan)**: Menarik seluruh faktur yang belum lunas sejak awal berdirinya database hingga hari ini tanpa terpotong filter bulan.
3. Menghitung nilai berdasarkan kolom **`primeOwing`** (saldo murni yang belum lunas di Accurate).

---

## 2. DAFTAR FILE YANG DIBUAT & DIMODIFIKASI

### A. Sisi Backend: `tokopon-zed` (Laravel Framework)

| No | Lokasi File | Status | Fungsi Utama |
|---|---|---|---|
| 1 | `app/Services/AccurateFinancialService.php` | **File Baru** | Service engine untuk komunikasi API Accurate, penarikan faktur AR/AP dengan metode *Early Stopping*, penarikan saldo buku besar Kas & Bank, pengelompokan umur piutang (*aging*), dan caching sistem 10 menit. |
| 2 | `app/Http/Controllers/Api/Executive/ExecutiveFinancialController.php` | **File Baru** | Controller khusus eksekutif dengan 5 endpoint: Ringkasan AR/AP, Detail Faktur Piutang, Detail Faktur Hutang, Saldo Kas/Bank, dan tombol Sinkronisasi Paksa (*Force Refresh*). |
| 3 | `routes/api.php` | **Dimodifikasi** | Mendaftarkan rute API `/v1/executive/financial/*` dengan pengamanan token Sanctum dan pembatasan hak akses (*director*, *admin*, *superadmin*). |
| 4 | `app/Http/Controllers/Api/Executive/ExecutiveDashboardController.php` | **Dimodifikasi** | Menambahkan parameter filter global `category` pada fungsi `extractFilters()`. |
| 5 | `app/Services/ExecutiveMetricsService.php` | **Dimodifikasi** | Menambahkan opsi daftar kategori produk di `getFilterOptions()`, filter kategori di `baseOrderQuery()`, perhitungan proporsional kategori di `computeSingleOrderMetrics()`, dan filter kategori di `getTopProducts()` serta `getBrandAnalytics()`. |

### B. Sisi Frontend: `executive-app` (React + TypeScript)

| No | Lokasi File | Status | Fungsi Utama |
|---|---|---|---|
| 1 | `src/types/index.ts` | **Dimodifikasi** | Menambahkan tipe data TypeScript untuk modul keuangan, tipe `categories` & `CategoryFilterItem` di `FilterOptions`, dan properti `category` di `FilterParams`. |
| 2 | `src/api/executive.ts` | **Dimodifikasi** | Menyediakan fungsi pemanggil API backend: `getFinancialArApSummary()`, `getFinancialReceivables()`, `getFinancialPayables()`, `getFinancialCashBank()`, dan `syncFinancialAccurate()`. |
| 3 | `src/context/FilterContext.tsx` | **Dimodifikasi** | Menambahkan state `filters.category` dan fungsi `setCategory` untuk mengontrol filter kategori produk secara reaktif di seluruh dashboard. Otomatis mereset branch & category saat BU berganti. |
| 4 | `src/components/SearchableSelect.tsx` | **File Baru** | Komponen dropdown modern dengan fitur pencarian teks instan (searchable combobox), keyboard accessibility, visual badge, dan click-outside detection. |
| 5 | `src/components/FilterBar.tsx` | **Dimodifikasi** | Menerapkan `SearchableSelect` untuk Business Unit, Cabang, dan Kategori Produk dengan logika bertingkat (*cascading filter*): memilih BU secara dinamis menyaring daftar cabang dan kategori yang relevan. |
| 6 | `src/components/NavigationTabs.tsx` | **Dimodifikasi** | Menambahkan tombol navigasi baru **"Keuangan Accurate"** dengan ikon Landmark dan badge status *"Real GL"*. |
| 7 | `src/pages/DashboardPage.tsx` | **Dimodifikasi** | Merender tab `<AccurateFinancialTab />` ketika pengguna memilih menu Keuangan Accurate. |
| 8 | `src/components/tabs/AccurateFinancialTab.tsx` | **File Baru** | Halaman utama modul keuangan yang mengelola siklus data, pemanggilan API, dan modal pop-up detail faktur. |
| 9 | `src/components/financial/FinancialHeaderSyncBar.tsx` | **File Baru** | Bar informasi status koneksi Accurate Online, waktu sinkronisasi terakhir, tanggal acuan data, dan tombol sinkronisasi ulang. |
| 10 | `src/components/financial/ArApOverviewCards.tsx` | **File Baru** | 4 Kartu KPI Utama: Total Piutang Pelanggan, Total Hutang Supplier, Modal Kerja Bersih, dan Kas/Bank Likuid. |
| 11 | `src/components/financial/ArAgingCard.tsx` | **File Baru** | Visualisasi klasifikasi umur piutang (0–7 hari, 8–14 hari, 15–30 hari, >30 hari) serta daftar 5 debitur penunggak terbesar. |
| 12 | `src/components/financial/ApAgingCard.tsx` | **File Baru** | Visualisasi jatuh tempo hutang ke supplier dan daftar 5 distributor dengan kewajiban pembayaran terbesar. |
| 13 | `src/components/financial/CashBankGrid.tsx` | **File Baru** | Kartu rincian saldo rekening bank (BCA, BNI, Mandiri) dan uang fisik kasir di brankas toko. |
| 14 | `src/components/financial/InvoiceDrilldownModal.tsx` | **File Baru** | Jendela modal interaktif untuk melihat seluruh daftar nomor faktur belum lunas lengkap dengan fitur filter dan pencarian nomor nota/nama pelanggan. |
| 15 | `src/components/Header.tsx` | **Dimodifikasi** | Menggunakan `SearchableSelect` pada pemilihan Unit Bisnis di header desktop. |

---

## 3. SUMBER DATA RESMI ACCURATE ONLINE (API ENDPOINTS)

Seluruh data ditarik secara resmi dari server Open API Accurate Online:

- **Host API:** `https://odin.accurate.id/accurate/api`
- **Database ID:** `2635401` (Perusahaan: GSK Second / ZED Group)
- **Tipe Akses:** Bearer Token Akses + HMAC-SHA256 Signature

### Daftar Endpoint yang Digunakan:

```
1. Piutang Penjualan (Sales Invoice):
   GET /sales-invoice/list.do
   Parameter: fields=id,number,transDate,dueDate,customer,totalAmount,primeOwing,status
   Pengurutan: sp.sort=primeOwing|desc (mengurutkan dari tagihan terbesar agar proses cepat)

2. Hutang Pembelian (Purchase Invoice):
   GET /purchase-invoice/list.do
   Parameter: fields=id,number,transDate,dueDate,vendor,totalAmount,primeOwing,status
   Pengurutan: sp.sort=primeOwing|desc

3. Daftar Akun Buku Besar Kas & Bank (Chart of Accounts):
   GET /glaccount/list.do
   Parameter: fields=id,no,name,accountType & filter.leafOnly=true (hanya akun anak kas/bank)

4. Saldo Riil Akun Kas & Bank:
   GET /glaccount/get-balance.do
   Parameter: id=[ID Akun] & asOfDate=[dd/mm/yyyy]
```

---

## 4. RUMUS-RUMUS PERHITUNGAN LENGKAP

Seluruh rumus di bawah ini ditulis dalam format teks biasa dan aritmatika langsung agar mudah dipahami oleh siapa pun tanpa simbol kode matematika rumit.

---

### Rumus 1: Total Piutang Riil (Accounts Receivable / AR)

Piutang riil adalah jumlah seluruh sisa tagihan pelanggan dan tagihan mitra pembayaran yang uangnya **belum masuk ke rekening kas perusahaan**, dihitung dari semua faktur yang pernah dibuat.

#### Bentuk Rumus:
```
Total Piutang = Sisa Tagihan Faktur 1 + Sisa Tagihan Faktur 2 + ... + Sisa Tagihan Faktur N
```
*(Hanya faktur yang memiliki Sisa Tagihan > 0)*

#### Keterangan Komponen:
- **Sisa Tagihan (`primeOwing`):** Nilai sisa yang benar-benar belum dibayar. Jika nota senilai Rp 10.000.000 sudah dicicil Rp 4.000.000, maka yang dihitung hanyalah sisanya yaitu Rp 6.000.000.
- **Cakupan Waktu:** Dihitung kumulatif dari awal toko berdiri sampai tanggal hari ini (tidak dibatasi filter bulan).

#### Contoh Perhitungan Riil Saat Ini:
```
- Jumlah Faktur Belum Lunas : 72 Faktur
- Contoh 5 Debitur Terbesar  :
    1. Ikbal                    : Rp 129.500.000,00
    2. Mitra Cicilan Kredivo    : Rp  76.627.180,00
    3. Syihab Jaya Utama        : Rp  72.700.000,00
    4. Mitra Cicilan Akulaku    : Rp  47.339.483,00
    5. Shopee                   : Rp  47.096.000,00
    6. Faktur Lainnya (67 nota) : Rp  33.000.000,00
-----------------------------------------------------------
Total Piutang Resmi di Accurate = Rp 406.262.663,00
```

---

### Rumus 2: Total Hutang Supplier (Accounts Payable / AP)

Hutang supplier adalah kewajiban pembayaran tempo pembelian stok barang (unit HP, aksesoris, sparepart) kepada pihak distributor/vendor yang **belum dibayarkan oleh perusahaan**.

#### Bentuk Rumus:
```
Total Hutang Supplier = Sisa Hutang Faktur Pembelian 1 + Sisa Hutang Faktur Pembelian 2 + ... + Sisa Hutang Faktur Pembelian M
```
*(Hanya faktur pembelian yang memiliki Sisa Hutang > 0)*

#### Keterangan Komponen:
- **Sisa Hutang (`primeOwing`):** Nilai sisa hutang pembelian yang belum dibayar lunas ke supplier.
- **Cakupan Waktu:** Dihitung kumulatif sejak transaksi pembelian pertama hingga saat ini.

#### Contoh Perhitungan Riil Saat Ini:
```
- Jumlah Faktur Pembelian Tempo : 17 Faktur
- Rincian Supplier Terbesar     :
    1. RIJ NEW / SUDI           : Rp 3.080.000.000,00  (Kewajiban Utama)
    2. Dapur Grading            : Rp   500.000.000,00
    3. Hendro YH Store          : Rp   179.817.999,91
    4. Supplier Lainnya         : Rp   124.000.000,00
-----------------------------------------------------------
Total Hutang Supplier Resmi     = Rp 3.883.817.999,91  (~Rp 3,88 Miliar)
```

---

### Rumus 3: Modal Kerja Bersih (Net Working Capital)

Mengukur posisi likuiditas jangka pendek antara piutang yang akan masuk dengan hutang yang harus dibayar ke supplier.

#### Bentuk Rumus:
```
Modal Kerja Bersih = Total Piutang Pelanggan - Total Hutang Supplier
```

#### Contoh Perhitungan Riil Saat Ini:
```
Modal Kerja Bersih = Rp 406.262.663,00 - Rp 3.883.817.999,91
                   = - Rp 3.477.555.336,91  (Defisit Tempo Rp 3,47 Miliar)
```

#### Makna Bisnis Bagi Owner & Direktur Keuangan:
- Posisi minus (**-Rp 3,47 Miliar**) adalah hal wajar pada industri retail handphone dengan sistem konsinyasi atau tempo supplier.
- Artinya, tagihan piutang keluar (Rp 406 Juta) tidak cukup untuk menutup hutang supplier (Rp 3,88 Miliar).
- **Strategi Manajemen:** Perusahaan harus mengandalkan **arus kas tunai harian kasir (*cash retail*)** dan mempercepat **perputaran stok barang (*inventory turnover*)** agar uang hasil penjualan HP tunai langsung tersedia saat jatuh tempo tagihan distributor.

---

### Rumus 4: Total Kas & Rekening Bank Likuid

Menghitung seluruh dana segar yang dimiliki perusahaan saat ini, baik yang tersimpan di rekening bank maupun uang tunai fisik di kasir toko.

#### Bentuk Rumus:
```
Total Kas & Bank = Total Saldo Rekening Bank + Total Saldo Kas Fisik Toko
```

#### Rincian Akun:
```
Total Saldo Rekening Bank = Saldo BCA Operasional
                          + Saldo BNI Utama
                          + Saldo BNI Giro
                          + Saldo Bank Mandiri
                          + Saldo QRIS Settlement BNI

Total Saldo Kas Fisik Toko = Saldo Kas Besar Kantor
                           + Saldo Kasir Banjarbaru
                           + Saldo Kasir Martapura
                           + Saldo Kasir Veteran
                           + Saldo Kasir Sultan Adam
                           + Saldo Kasir Kayu Tangi
                           + Saldo Kasir Sampit
```

#### Contoh Perhitungan Riil Saat Ini:
```
1. Saldo Rekening Bank Operasional :
   - Rekening BCA                  : Rp   858.986.721,00
   - Rekening BNI 1                : Rp   678.528.212,00
   - Rekening BNI 2                : Rp   361.800.000,00
   - Rekening QRIS                 : Rp     9.200.000,00
   - Rekening Mandiri              : Rp       500.000,00
   -----------------------------------------------------
   Subtotal Rekening Bank          = Rp 1.909.014.933,00

2. Saldo Kas Fisik di Toko :
   - Kas Besar (Brankas)           : Rp    60.793.000,00
   - Kasir Cabang-Cabang           : Rp     7.422.000,00
   -----------------------------------------------------
   Subtotal Kas Fisik              = Rp    68.215.000,00

--------------------------------------------------------
Total Keseluruhan Dana Likuid      = Rp 1.977.229.933,00 (~Rp 1,97 Miliar)
```

---

### Rumus 5: Rasio Kecukupan Kas terhadap Hutang Supplier

Mengukur berapa persen dari hutang supplier yang dapat langsung dilunasi menggunakan seluruh uang kas dan rekening bank yang ada hari ini.

#### Bentuk Rumus:
```
Rasio Kas terhadap Hutang = (Total Kas & Rekening Bank / Total Hutang Supplier) x 100%
```

#### Contoh Perhitungan Riil Saat Ini:
```
Rasio Kas terhadap Hutang = (Rp 1.977.229.933,00 / Rp 3.883.817.999,91) x 100%
                          = 50,91%
```

#### Makna Bisnis Bagi Direktur:
- Sebanyak **50,91%** dari total seluruh hutang pembelian barang ke supplier dapat dilunasi seketika menggunakan saldo bank dan kas yang ada hari ini.
- Kondisi keuangan dinilai **sangat sehat (likuid)** karena biasanya batas aman retail adalah di atas 30%.

---

### Rumus 6: Umur Faktur (Aging Days)

Menghitung berapa hari sebuah faktur piutang atau faktur hutang telah beredar terhitung sejak tanggal terbitnya.

#### Bentuk Rumus:
```
Umur Faktur (Hari) = Tanggal Hari Ini - Tanggal Terbit Faktur
```

#### Contoh Perhitungan:
- Tanggal Hari Ini: 20 Oktober 2026
- Tanggal Terbit Faktur: 15 September 2026
- Umur Faktur: 35 Hari (Masuk kategori jatuh tempo berat / > 30 hari).

---

### Rumus 7: Klasifikasi Kelompok Umur (Aging Buckets)

Setiap faktur yang belum lunas otomatis dimasukkan ke dalam 4 kelompok risiko penagihan/pembayaran:

```
1. Kategori 0 - 7 Hari   : Faktur dengan Umur 0 sampai 7 hari   (Status: Lancar / Baru Terbit)
2. Kategori 8 - 14 Hari  : Faktur dengan Umur 8 sampai 14 hari  (Status: Mulai Diwaspadai)
3. Kategori 15 - 30 Hari : Faktur dengan Umur 15 sampai 30 hari (Status: Mendesak Ditagih)
4. Kategori > 30 Hari    : Faktur dengan Umur di atas 30 hari   (Status: Kritis / Jatuh Tempo)
```

---

### Rumus 8: Persentase Porsi Debitur & Supplier

Menghitung persentase kontribusi satu pelanggan atau satu supplier terhadap total keseluruhan.

#### Bentuk Rumus:
```
Porsi Debitur (%)  = (Sisa Tagihan Debitur Tersebut / Total Seluruh Piutang) x 100%
Porsi Supplier (%) = (Sisa Hutang ke Supplier Tersebut / Total Seluruh Hutang) x 100%
```

#### Contoh Perhitungan Riil:
```
1. Porsi Mitra Kredivo :
   = (Rp 76.627.180,00 / Rp 406.262.663,00) x 100%
   = 18,86%

2. Porsi Supplier RIJ NEW :
   = (Rp 3.080.000.000,00 / Rp 3.883.817.999,91) x 100%
   = 79,30% (Konsentrasi hutang supplier terbesar terpusat pada 1 vendor utama)
```

---

### Rumus 9: Tanda Tangan Keamanan Otentikasi API Accurate

Setiap kali server Tokopon menghubungi Accurate Online, server wajib mengirimkan tanda tangan digital untuk mencegah kebocoran data:

#### Bentuk Rumus:
```
1. Waktu Permintaan = Waktu lokal WIB (Format: Tanggal/Bulan/Tahun Jam:Menit:Detik, contoh: 20/10/2026 13:30:00)
2. Tanda Tangan Digital = Hash HMAC-SHA256 dari teks Waktu Permintaan menggunakan Kunci Rahasia Accurate (Secret Key)
```

*Catatan Teknis:* Format tanggal wajib menggunakan `d/m/Y H:i:s` dengan zona waktu `Asia/Jakarta`. Format ISO8601 atau UTC akan ditolak oleh Accurate dengan error *401 Data Session Key Tidak Tepat*.

---

## 5. PERBANDINGAN LOGIKA: SISTEM LAMA VS SISTEM BARU

| Indikator | Logika Lama (POS Kasir Toko) | Logika Baru (Accurate Real GL) |
|---|---|---|
| **Metode Filter Tanggal** | Menggunakan rentang tanggal `order_date` (misal 1 s/d 20 Oktober). | Menggunakan metode **As-of-Date (Kumulatif)**: Menarik seluruh transaksi sejak toko buka hingga hari ini. |
| **Kelemahan Sistem Lama** | Faktur tempo bulan lalu (September) **otomatis hilang** dari laporan saat berganti bulan. | Semua faktur yang belum lunas **pasti muncul dan tidak akan pernah hilang** sampai uang masuk ke kas. |
| **Nilai yang Dihitung** | Nilai kotor belanjaan (`grand_total`). Tidak memperhitungkan cicilan sebagian. | Sisa saldo tagihan riil (`primeOwing`), otomatis berkurang setiap kali ada angsuran masuk. |
| **Total Piutang Tampil** | Hanya belasan juta rupiah (data tidak lengkap). | **Rp 406.262.663,00 (100% Cocok dengan Laporan Resmi Accurate)** |
| **Data Kas & Bank** | Hanya mencatat uang kasir yang ada di sistem POS. | **Mencatat saldo rekening bank operasional (BCA, BNI, Mandiri) dan brankas toko secara live.** |

---

## 6. PANDUAN DEPLOYMENT & MENJALANKAN SISTEM

### Opsi 1: Menjalankan di Server Lokal (Localhost)
1. Buka file konfigurasi frontend: `d:\APP\executive-app\.env`
2. Pastikan `VITE_API_URL` mengarah ke server Laravel lokal Anda:
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```
3. Pastikan backend Laravel di `D:\APP\tokopon-zed` sedang berjalan:
   ```powershell
   php artisan serve --port=8000
   ```
4. Buka browser pada alamat `http://localhost:5173` dan klik menu tab **"Keuangan Accurate"**.

### Opsi 2: Menjalankan di Server Produksi (`mobile-api.zedgroup.tech`)
1. Salin 3 file backend yang telah kita buat dari `D:\APP\tokopon-zed` ke server produksi Anda:
   - `app/Services/AccurateFinancialService.php`
   - `app/Http/Controllers/Api/Executive/ExecutiveFinancialController.php`
   - `routes/api.php`
2. Jalankan perintah pembersihan cache di server produksi:
   ```bash
   php artisan route:clear
   php artisan config:clear
   php artisan cache:clear
   ```
3. Dashboard frontend `executive-app` yang mengarah ke `https://mobile-api.zedgroup.tech` akan langsung membaca data keuangan riil dari Accurate secara otomatis.

---

> **Dokumen ini dibuat otomatis oleh Sistem Executive Dashboard - ZED Group**  
> Disimpan sebagai file panduan permanen di: `d:\APP\executive-app\DOKUMENTASI_KEUANGAN_ACCURATE.md`
