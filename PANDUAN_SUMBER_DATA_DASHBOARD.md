# 📘 PANDUAN LENGKAP SUMBER DATA & ARSITEKTUR ENDPOINT
**ZED Executive Intelligence Suite &bull; Dashboard Direksi & C-Level**

> **Tujuan Dokumen:**  
> Panduan resmi dan komprehensif bagi Direktur, Komisaris, Tim Finance, Tim Audit, dan Developer mengenai **dari mana setiap data dan angka di dashboard berasal** — apakah bersumber dari **Database Lokal (POS Tokopon)**, langsung secara realtime dari **Accurate Online API (Buku Besar/GL)**, atau kombinasi keduanya (**Hybrid**).

---

## 📑 DAFTAR ISI
1. [Ringkasan Matriks Sumber Data (Executive Matrix)](#1-ringkasan-matriks-sumber-data-executive-matrix)
2. [Detail Modul 1: Ringkasan Eksekutif & Finansial POS](#detail-modul-1-ringkasan-eksekutif--finansial-pos-overview)
3. [Detail Modul 2: Keuangan & Akuntansi Accurate Online](#detail-modul-2-keuangan--akuntansi-accurate-online-accuratefinancial)
4. [Detail Modul 3: Stok & Valuasi Persediaan Accurate](#detail-modul-3-stok--valuasi-persediaan-accurate-inventoryvaluation)
5. [Detail Modul 4: Kinerja Karyawan & Kasir](#detail-modul-4-kinerja-karyawan--kasir-staffkpi)
6. [Detail Modul 5: Analisis Pangsa Pasar Brand](#detail-modul-5-analisis-pangsa-pasar-brand-brandanalytics)
7. [Detail Modul 6: Audit Kasir & Pembatalan Transaksi](#detail-modul-6-audit-kasir--pembatalan-transaksi-cashieraudit)
8. [Detail Modul 7: Klaim Promo & Subsidi](#detail-modul-7-klaim-promo--subsidi-promoclaims)
9. [Detail Modul 8: Penjualan Proyek B2B / Tender](#detail-modul-8-penjualan-proyek-b2b--tender-projectsales)
10. [Detail Modul 9: Executive AI Strategic Assistant](#detail-modul-9-executive-ai-strategic-assistant-aiassistant)
11. [Mekanisme Pemisahan Multi-Unit Bisnis (BU Isolation)](#11-mekanisme-pemisahan-multi-unit-bisnis-bu-isolation)
12. [Pertanyaan Umum (FAQ) Direksi & Auditor](#12-pertanyaan-umum-faq-direksi--auditor)

---

## 1. Ringkasan Matriks Sumber Data (Executive Matrix)

| Nama Menu / Tab | Sumber Utama Data | Backend Endpoint (Tokopon API) | Remote Accurate Online API | Tabel Database Terkait |
| :--- | :--- | :--- | :--- | :--- |
| **Ringkasan Eksekutif** | **Database Lokal POS** | `GET /v1/executive/overview`<br>`GET /v1/executive/kpi-summary`<br>`GET /v1/executive/sales-trend` | *Tidak ada* | `orders`, `order_items`, `order_payments`, `branches` |
| **Benchmarking Toko** | **Database Lokal POS** | `GET /v1/executive/branch-comparison`<br>`GET /v1/executive/branch-transactions` | *Tidak ada* | `orders`, `branches`, `order_payments` |
| **Metode Pembayaran** | **Database Lokal POS** | `GET /v1/executive/payment-breakdown` | *Tidak ada* | `order_payments`, `orders` |
| **Keuangan Accurate** | **Accurate API (Live)** | `GET /v1/executive/financial/ar-ap-summary`<br>`GET /v1/executive/financial/receivables`<br>`GET /v1/executive/financial/payables`<br>`GET /v1/executive/financial/cash-bank` | `/sales-invoice/list.do`<br>`/purchase-invoice/list.do`<br>`/glaccount/get-balance.do` | Cache Redis/File + Kredensial `business_units` |
| **Stok & Valuasi** | **Hybrid (Live Accurate + DB)** | `GET /v1/executive/inventory/valuation`<br>`POST /v1/executive/inventory/sync` | `/glaccount/get-balance.do`<br>`/warehouse/list.do`<br>`/item/list.do` | `product_accurates`, `business_units` |
| **Kinerja Karyawan** | **Database Lokal POS** | `GET /v1/executive/staff-kpi` | *Tidak ada* | `orders`, `users`, `employes` |
| **Analisis Brand** | **Database Lokal POS** | `GET /v1/executive/brand-analytics` | *Tidak ada* | `order_items`, `products`, `second_products` |
| **Audit Kasir** | **Database Lokal POS** | `GET /v1/executive/cashier-audit` | *Tidak ada* | `order_reset_logs`, `orders`, `order_issues` |
| **Klaim Promo** | **Database Lokal POS** | `GET /v1/executive/promo-claims` | *Tidak ada* | `order_promos`, `order_item_promos`, `promo_branches` |
| **Penjualan Proyek** | **Database Lokal POS** | `GET /v1/executive/project-sales`<br>`GET /v1/executive/project-sales/detail` | *Tidak ada* | `orders`, `order_items`, `product_accurates` |
| **AI Assistant** | **9router AI Gateway** | `POST /v1/executive/ai/chat`<br>`POST /v1/executive/ai/summarize` | *Tidak ada* | Snapshot metrik dashboard + API 9router |

---

## Detail Modul 1: Ringkasan Eksekutif & Finansial POS (`Overview`)

* **Tujuan Menu:** Memantau pendapatan harian/bulanan, omset kotor, HPP, laba kotor toko fisik, dan tren penjualan kasir.
* **Klasifikasi Sumber Data:** **DATABASE LOKAL (Sistem POS Tokopon)**
* **Endpoint Backend:**
  * `GET /api/v1/executive/overview` (Semua metrik dalam 1 payload)
  * `GET /api/v1/executive/kpi-summary`
  * `GET /api/v1/executive/branch-comparison`
  * `GET /api/v1/executive/sales-trend`
  * `GET /api/v1/executive/top-products`
  * `GET /api/v1/executive/payment-breakdown`
* **Controller & Service Backend:**
  * Controller: `App\Http\Controllers\Api\Executive\ExecutiveDashboardController`
  * Service: `App\Services\ExecutiveMetricsService`
* **Tabel Database yang Dikuari:**
  * `orders`: Kolom `grand_total`, `subtotal`, `discount_total`, `tax_total`, `status` (*completed*), `paid_at`, `shipping_address_snapshot->store` (nama cabang).
  * `order_items`: Kolom `quantity`, `price`, `cost_price` (HPP barang yang terjual).
  * `order_payments`: Kolom `payment_method`, `amount`, `mdr_fee`.
  * `branches`: Filter id cabang dan unit bisnis.
* **Jawaban jika Ditanya Direksi:**  
  *"Data omset, laba kotor, dan leaderboard cabang berasal dari database transaksi kasir POS Tokopon secara langsung yang mencatat setiap nota penjualan yang sukses diselesaikan."*

---

## Detail Modul 2: Keuangan & Akuntansi Accurate Online (`AccurateFinancial`)

* **Tujuan Menu:** Memantau kesehatan arus kas murni, piutang pelanggan (AR), hutang supplier (AP), saldo kas kecil & rekening bank, serta modal kerja bersih (*Net Working Capital*).
* **Klasifikasi Sumber Data:** **100% ACCURATE ONLINE OPEN API (REAL-TIME BUKU BESAR)**
* **Endpoint Backend:**
  * `GET /api/v1/executive/financial/ar-ap-summary` (Ringkasan KPI Keuangan)
  * `GET /api/v1/executive/financial/receivables` (Daftar Faktur Piutang Penjualan)
  * `GET /api/v1/executive/financial/payables` (Daftar Faktur Hutang Pembelian)
  * `GET /api/v1/executive/financial/cash-bank` (Saldo Riil Kas & Rekening Bank)
  * `POST /api/v1/executive/financial/sync` (Tombol Sinkronisasi Paksa)
* **Controller & Service Backend:**
  * Controller: `App\Http\Controllers\Api\Executive\ExecutiveFinancialController`
  * Service: `App\Services\AccurateFinancialService`
* **Endpoint Resmi Accurate Online yang Ditembak:**
  1. **Piutang Pelanggan (AR):**  
     `GET https://odin.accurate.id/accurate/api/sales-invoice/list.do`  
     Parameter: `fields=id,number,transDate,dueDate,customer,totalAmount,primeOwing,status`, `sp.sort=primeOwing|desc`. Menarik seluruh nota yang memiliki sisa tagihan (`primeOwing > 0`) per tanggal acuan (*as-of-date*).
  2. **Hutang Supplier (AP):**  
     `GET https://odin.accurate.id/accurate/api/purchase-invoice/list.do`  
     Parameter: `fields=id,number,transDate,dueDate,vendor,totalAmount,primeOwing,status`, `sp.sort=primeOwing|desc`.
  3. **Kas & Bank Likuid:**  
     `GET https://odin.accurate.id/accurate/api/glaccount/list.do` dengan `filter.accountType=BANK` dilanjutkan pemanggilan `GET /glaccount/get-balance.do` untuk setiap rekening bank (BCA, Mandiri, Kas Kasir, dll).
* **Jawaban jika Ditanya Direksi / Auditor:**  
  *"Nilai Piutang, Hutang, dan Kas/Bank 100% diambil langsung dari server Buku Besar Accurate Online secara live via REST API resmi, bukan dari estimasi kasir POS. Angka mencerminkan sisa saldo faktur berjalan (primeOwing) per detik ini."*

---

## Detail Modul 3: Stok & Valuasi Persediaan Accurate (`InventoryValuation`)

* **Tujuan Menu:** Mengetahui nilai total modal uang yang tertahan dalam bentuk persediaan barang (*Total Inventory Valuation*), sebaran persediaan per gudang cabang, komposisi kategori, dan daftar 10 barang paling berharga.
* **Klasifikasi Sumber Data:** **HYBRID (Accurate Online API Live + Database Lokal `product_accurates`)**
* **Endpoint Backend:**
  * `GET /api/v1/executive/inventory/valuation`
  * `POST /api/v1/executive/inventory/sync`
* **Controller & Service Backend:**
  * Controller: `App\Http\Controllers\Api\Executive\ExecutiveInventoryController`
  * Service: `App\Services\AccurateInventoryService`
* **Rincian Sumber per Komponen Kartu:**
  1. **Total Nilai Modal Persediaan (GL Balance):**  
     *Sumber:* **Accurate API Live** (`/glaccount/list.do` & `/glaccount/get-balance.do` untuk Akun `10.06.001 - Persediaan`).  
     *Nilai Riil Detik Ini:*
     - Syihab Store (HP Baru): **Rp 20.836.078.924,81**
     - GSK Second (HP Second): **Rp 10.153.892.700,20**
     - Gabungan Semua Unit Bisnis: **Rp 30.990.037.826,36**
  2. **Daftar Gudang Resmi & Status Gudang:**  
     *Sumber:* **Accurate API Live** (`/warehouse/list.do`).  
     Mengambil 8 gudang fisik Syihab dan 10 gudang fisik GSK Second (Total 18 Gudang resmi).
  3. **Komposisi Kategori & Komposisi Brand:**  
     *Sumber:* **Database Lokal Tokopon (`product_accurates`)**  
     Dihitung via query agregasi SQL: `GROUP BY categoryName` dan `GROUP BY brandName`.
  4. **Top 10 SKU Valuasi Termahal:**  
     *Sumber:* **Database Lokal Tokopon (`product_accurates`)**  
     Dihitung via query SQL: `ORDER BY (stock * base_cost) DESC LIMIT 10`.
  5. **Barang Bergerak Lambat (Slow Moving Items):**  
     *Sumber:* **Database Lokal Tokopon (`product_accurates`)**  
     Dihitung dari barang yang memiliki stok > 0 dengan umur stok di atas 60 hari.
* **Jawaban jika Ditanya Direksi:**  
  *"Total nilai nominal rupiah persediaan (Rp 30,99 Miliar) diambil langsung detik itu juga dari Akun Buku Besar 10.06.001 Accurate Online, sedangkan rincian katalog produk, brand, dan kategori diolah dari tabel product_accurates yang tersinkronisasi otomatis dari Accurate."*

---

## Detail Modul 4: Kinerja Karyawan & Kasir (`StaffKpi`)

* **Tujuan Menu:** Leaderboard staf toko, mencakup ranking kasir dan ranking pramuniaga/salesperson berdasarkan omset dan kecepatan transaksi.
* **Klasifikasi Sumber Data:** **DATABASE LOKAL (Sistem POS Tokopon)**
* **Endpoint Backend:** `GET /api/v1/executive/staff-kpi`
* **Controller & Service Backend:**
  * Controller: `App\Http\Controllers\Api\Executive\ExecutiveDashboardController`
  * Service: `App\Services\ExecutiveMetricsService` (method `getStaffKpi`)
* **Tabel Database yang Dikuari:**
  * `orders` berelasi dengan `users` (sebagai Kasir / `cashier_id`).
  * `orders` berelasi dengan `employes` (sebagai Sales / `sales_id`).
* **Metrik yang Dihasilkan:**
  * Total invoice yang diproses per kasir.
  * Total unit produk yang dijual per salesperson.
  * Rata-rata nominal per struk belanja (*Average Basket Size*).

---

## Detail Modul 5: Analisis Pangsa Pasar Brand (`BrandAnalytics`)

* **Tujuan Menu:** Mengetahui dominasi merek gadget di jaringan toko (Apple vs Samsung vs Android lainnya vs Aksesoris), margin laba per merek, dan harga jual rata-rata (ASP).
* **Klasifikasi Sumber Data:** **DATABASE LOKAL (Sistem POS Tokopon)**
* **Endpoint Backend:** `GET /api/v1/executive/brand-analytics`
* **Controller & Service Backend:**
  * Controller: `App\Http\Controllers\Api\Executive\ExecutiveDashboardController`
  * Service: `App\Services\ExecutiveMetricsService` (method `getBrandAnalytics`)
* **Tabel Database yang Dikuari:**
  * `order_items` join ke `products` (HP Baru) dan `second_products` (HP Second).
  * Kolom: `brandName`, `itemBrandId`, `price`, `cost_price`, `quantity`.

---

## Detail Modul 6: Audit Kasir & Pembatalan Transaksi (`CashierAudit`)

* **Tujuan Menu:** Pengawasan kecurangan (*fraud prevention*), audit pembatalan nota penjualan oleh kasir, dan audit selisih lebih bayar (*overpayment*) program tukar tambah Buyback SellPhone.
* **Klasifikasi Sumber Data:** **DATABASE LOKAL (Log Audit Tokopon)**
* **Endpoint Backend:** `GET /api/v1/executive/cashier-audit`
* **Controller & Service Backend:**
  * Controller: `App\Http\Controllers\Api\Executive\ExecutiveDashboardController`
  * Service: `App\Services\ExecutiveMetricsService` (method `getCashierAudit`)
* **Tabel Database yang Dikuari:**
  * `order_reset_logs`: Mencatat setiap pembatalan/reset pesanan yang dilakukan kasir (nama kasir, nomor nota lama, alasan pembatalan, nominal pembatalan, waktu kejadian).
  * `order_issues` & transaksi tukar tambah: Mendeteksi anomali selisih harga taksiran HP bekas vs uang yang diserahkan kasir.

---

## Detail Modul 7: Klaim Promo & Subsidi (`PromoClaims`)

* **Tujuan Menu:** Memantau dana piutang klaim subsidi diskon yang harus ditagihkan perusahaan ke pihak ketiga (Bank EDC, Finansial/Leasing, Distributor, atau Vendor Brand).
* **Klasifikasi Sumber Data:** **DATABASE LOKAL (Sistem Promosi Tokopon)**
* **Endpoint Backend:** `GET /api/v1/executive/promo-claims`
* **Controller & Service Backend:**
  * Controller: `App\Http\Controllers\Api\Executive\ExecutiveDashboardController`
  * Service: `App\Services\ExecutiveMetricsService` (method `getPromoClaims`)
* **Tabel Database yang Dikuari:**
  * `order_promos`, `order_item_promos`, `promo_branches`.
* **Metrik:**
  * Total subsidi yang sudah dipotong di kasir namun belum diganti oleh sponsor/vendor.
  * Status klaim: *Draft / Diajukan / Terbayar*.

---

## Detail Modul 8: Penjualan Proyek B2B / Tender (`ProjectSales`)

* **Tujuan Menu:** Memantau penjualan jalur pengadaan instansi, kantor, tender, dan B2B Corporate.
* **Klasifikasi Sumber Data:** **DATABASE LOKAL (Sistem POS Tokopon)**
* **Endpoint Backend:**
  * `GET /api/v1/executive/project-sales` (Matriks penjualan per proyek & per cabang)
  * `GET /api/v1/executive/project-sales/detail` (Drilldown daftar nota & barang proyek)
* **Controller & Service Backend:**
  * Controller: `App\Http\Controllers\Api\Executive\ExecutiveDashboardController`
  * Service: `App\Services\ExecutiveMetricsService` (method `getProjectSalesReport`)
* **Tabel Database yang Dikuari:**
  * `orders` dengan flag `proyek` / `project_id`.

---

## Detail Modul 9: Executive AI Strategic Assistant (`AiAssistant`)

* **Tujuan Menu:** Memberikan analisa naratif kecerdasan buatan (AI) 1-klik yang dapat disalin ke pesan WhatsApp/Telegram Direksi, serta chat konsultasi strategi bisnis.
* **Klasifikasi Sumber Data:** **HYBRID (9router AI Gateway + Snapshot Data Realtime Dashboard)**
* **Endpoint Backend:**
  * `POST /api/v1/executive/ai/chat` (Percakapan interaktif)
  * `POST /api/v1/executive/ai/summarize` (Ringkasan eksekutif instan 1-klik)
  * `GET /api/v1/executive/ai/history` (Riwayat percakapan sesi)
  * `DELETE /api/v1/executive/ai/history` (Hapus riwayat chat)
* **Controller & Service Backend:**
  * Controller: `App\Http\Controllers\Api\Executive\ExecutiveAiController`
  * Service: `App\Services\ExecutiveAiService`
* **Cara Kerja:**  
  Dashboard mengemas snapshot angka metrik yang sedang tampil di layar (omset, profit, piutang, valuasi stok), lalu mengirimkannya sebagai data konteks ke model AI melalui gateway **9router**, sehingga analisis AI selalu relevan dengan angka keuangan detik itu juga.

---

## 11. Mekanisme Pemisahan Multi-Unit Bisnis (BU Isolation)

Dashboard mendukung pemisahan penuh antar entitas usaha:
1. **Unit Bisnis 1: Syihab Store (`syihab` / ID: 1)**
   * Karakteristik: Khusus Retail HP Baru Resmi (Garansi Resmi iBox, GDN, Samsung Resmi).
   * Kredensial Accurate: Token khusus database Syihab di tabel `business_units`.
   * Saldo Persediaan: Mengakses Buku Besar Syihab (**~Rp 20,83 Miliar**).
   * Gudang: 8 Gudang Retail Syihab (*Head Office, Banjarbaru, Martapura, Premium, Retur, Rusak, Sultan Adam, Veteran*).
2. **Unit Bisnis 2: GSK Second (`second` / ID: 2)**
   * Karakteristik: Khusus Retail HP Second & ECO Second (Grade B/C).
   * Kredensial Accurate: Token khusus database GSK Second di tabel `business_units`.
   * Saldo Persediaan: Mengakses Buku Besar GSK Second (**~Rp 10,15 Miliar**).
   * Gudang: 10 Gudang GSK (*Head Office, Kayutangi, Banjarbaru, Veteran, Sultan Adam, Martapura, Sampit, Service, Return, Rusak*).
3. **Semua Unit Bisnis (`all` / Default)**
   * Menggabungkan saldo buku besar Accurate kedua entitas (**~Rp 30,99 Miliar**).
   * Menampilkan total 18 gudang fisik lengkap.

---

## 12. Pertanyaan Umum (FAQ) Direksi & Auditor

### Q1: "Apakah data omset di menu Ringkasan Eksekutif sama dengan Laporan Penjualan Accurate?"
> **Jawaban:** Menu Ringkasan Eksekutif mencatat penjualan riil kasir toko detik per detik melalui database POS Tokopon. Ketika nota penjualan POS diekspor / disinkronkan ke Accurate, faktur penjualan (*Sales Invoice*) akan terbentuk di Accurate. Jadi angka penjualan POS adalah data operasional toko terdepan, sedangkan Accurate adalah pencatatan akuntansinya.

### Q2: "Dari mana angka Piutang (AR) Rp 400+ Juta didapatkan?"
> **Jawaban:** Angka piutang berasal **100% dari Accurate Online API** (`/sales-invoice/list.do`). Angka ini menghitung seluruh faktur penjualan tempo/cicilan pelanggan (Kredivo, ShopeePayLater, Pelanggan Grosir) yang statusnya belum lunas (*primeOwing > 0*) per tanggal berjalan, mencakup sisa angsuran berjalan.

### Q3: "Mengapa nilai persediaan tertulis Rp 30,99 Miliar, padahal stok fisik di toko kelihatan tidak sebanyak itu?"
> **Jawaban:** Nilai Rp 30,99 Miliar adalah **Saldo Buku Besar Resmi Akun 10.06.001 (Persediaan)** yang ditarik langsung dari server Accurate Online. Nilai ini mencakup seluruh unit barang yang ada di 18 gudang jaringan perusahaan (Gudang Pusat, Toko Retail, Pusat Servis, maupun stok transit antar cabang).

### Q4: "Bagaimana cara memastikan data yang saya lihat adalah data terbaru?"
> **Jawaban:** Setiap modul yang terhubung ke Accurate Online memiliki tombol **"Sinkronkan Sekarang"** / **"Force Refresh"**. Menekan tombol ini akan menghapus cache sementara dan memaksa backend menembak ulang API server Accurate detik itu juga.
