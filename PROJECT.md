# Product Requirement Document (PRD)

## Proyek: All-in-One Data Swiss Knife (Web SaaS Konverter & Transformer Data)

---

## 1. Ringkasan Eksekutif (Executive Summary)
Aplikasi Data Swiss Knife adalah platform web berbasis arsitektur terpisah (Decoupled API Architecture). Aplikasi ini memungkinkan pengguna non-teknis untuk mengunggah file data mentah bertipe CSV, membersihkannya secara otomatis dari spasi atau baris kosong, dan mengonversinya ke format fungsional lain (Excel atau JSON) melalui antarmuka Single Page Application (SPA) yang dibangun menggunakan React dan Bootstrap.

---

## 2. Sasaran Proyek (Project Goals) & Audiens
* **Tujuan Proyek**: Menyediakan utilitas web full-stack berbasis API untuk memanipulasi format file data tanpa penyimpanan permanen di sisi server.
* **Indikator Sukses Portofolio**: Menunjukkan integrasi seamless antara komunikasi asinkronus Frontend (React + Axios) dan penanganan stream API serta pemrosesan data di Backend (Django REST Framework + Pandas).
* **Target Audiens**: Praktisi data pemula, staf admin kantor, dan developer yang membutuhkan alat konversi data instan.

---

## 3. Alur Pengguna (User Journey)
1. **Akses SPA**: Pengguna membuka aplikasi web berbasis React + Bootstrap.
2. **Konfigurasi & Unggah**: Pengguna memilih file CSV, memilih format luaran (Excel/JSON), dan melihat opsi pembersihan bawaan.
3. **Pengiriman API**: Pengguna menekan tombol proses; Axios mengirim data menggunakan struktur FormData ke API backend.
4. **Unduhan Otomatis**: Django REST Framework memproses file di memori dan mengembalikan data biner. React menangkap respon tersebut dan memicu fungsi auto-download file secara langsung di browser pengguna.

---

## 4. Ruang Lingkup Fitur (Feature Scope)

### Fitur Fase 1 (MVP - Minimum Viable Product)
* **React File Uploader**: Komponen input file berbasis Bootstrap yang divalidasi khusus untuk ekstensi .csv.
* **Asynchronous API Handler (Axios)**: Mengirimkan berkas mentah ke backend dengan penanganan status loading spinner yang interaktif.
* **Data Cleaning Engine (Pandas)**:
  * Otomatis menghapus baris yang sepenuhnya kosong menggunakan fungsi `.dropna(how='all')`.
  * Otomatis menghapus spasi tidak sengaja di awal/akhir nama kolom menggunakan fungsi `.columns.str.strip()`.
  * Mengisi atau membersihkan nilai kosong (missing values) langsung menggunakan fungsi bawaan Pandas seperti `.fillna()`.
* **Format Converter Engine**: Mengekspor hasil akhir dari struktur DataFrame langsung menjadi berkas biner `.xlsx` (Excel) atau format teks `.json` melalui fungsi `.to_excel()` dan `.to_json()`.

### Fitur Fase 2 (Pengembangan Masa Depan / Batasan)
* **Tanpa Database**: Sistem bekerja secara Stateless / In-Memory Processing tanpa database SQL/NoSQL.
* **Tanpa Autentikasi**: Semua fitur dapat diakses secara publik tanpa login atau registrasi.
* **Batasan Ukuran**: Ukuran file dibatasi maksimal 10 MB langsung di sisi klien dan server untuk efisiensi alokasi RAM.

---

## 5. Persyaratan Teknis (Technical Specifications)

### Sisi Frontend
* **Build Tool & Inti Framework**: Vite + React.js (Diinstal via `pnpm add vite`)
* **Gaya & Tata Letak UI**: Bootstrap 5 (Diinstal via `pnpm add bootstrap`)
* **Klien HTTP**: Axios (Diinstal via `pnpm add axios`)

### Sisi Backend
* **Framework Utama**: Django 5.x + Django REST Framework (DRF)
* **Pustaka Pengolah Data**: Pandas (Tanpa dependensi NumPy)
* **Mesin Penulisan Spreadsheet**: Openpyxl (Dependensi internal Pandas untuk menulis ekstensi .xlsx)
* **Keamanan Lintas Domain**: `django-cors-headers` (Wajib dikonfigurasi agar React dapat berkomunikasi dengan port Django).

---

## 6. Rancangan Antarmuka & Komponen React

### Struktur Komponen Dashboard (App.jsx)
```text
+-------------------------------------------------------------+

|                     DATA SWISS KNIFE                        |
|        (Bootstrap Card Layout - Centered Container)         |
+-------------------------------------------------------------+

|                                                             |
|   [ Form File Input: Pilih Berkas CSV ]                     |
|                                                             |
|   Pilih Format Tujuan:                                      |
|   (o) Excel (.xlsx)    ( ) JSON (.json)                     |
|                                                             |
|   Fitur Otomatis Aktif:                                     |
|   [x] Clean Missing Values (Pandas Handling)                |
|   [x] Trim Spaces Column Names                              |
|                                                             |
|   +-----------------------------------------------------+   |
|   |             [ BUTTON: PROSES & UNDUH ]              |   |
|   |      (Menampilkan Spinner saat Axios loading)       |   |
|   +-----------------------------------------------------+   |
+-------------------------------------------------------------+
```

---

## 7. Metrik Keberhasilan & Pengujian (Testing Criteria)
1. **Komunikasi CORS API**: Klien React harus dapat mengirim berkas MultiPartParser ke endpoint Django REST Framework tanpa terblokir oleh kebijakan Cross-Origin Resource Sharing.
2. **In-Memory Integrity**: Berkas yang dikonversi ke Excel tidak boleh korup dan struktur kolom data harus dipetakan secara akurat oleh struktur Pandas DataFrame.
3. **Kekebalan Error API**: Jika berkas yang dikirim bukan CSV atau strukturnya rusak, Backend harus mengembalikan status HTTP 400 bad request berupa pesan JSON error, yang kemudian ditangkap oleh blok .catch Axios untuk ditampilkan sebagai alert banner merah di React (bukan menyebabkan server mati).
