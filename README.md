# 🔪 Data Swiss Knife

> All-in-One Web Utility untuk Konversi & Transformasi Data — CSV, TXT, dan JSON menjadi Excel atau JSON yang bersih, langsung dari browser.

Data Swiss Knife adalah aplikasi web full-stack berbasis **arsitektur terpisah (Decoupled API Architecture)** yang memungkinkan pengguna mengunggah file data mentah, membersihkannya secara otomatis dengan Pandas, dan mengonversinya ke format fungsional lain melalui antarmuka Single Page Application (SPA) yang responsif.

---

## ✨ Fitur Utama

### 📥 Multi-Format Input
| Format | Metode Pembacaan |
|--------|------------------|
| `.csv` | `pd.read_csv()` dengan delimiter terpilih |
| `.txt` | `pd.read_csv()` dengan delimiter terpilih |
| `.json` | `pd.read_json()` (array of objects & NDJSON) |

**Delimiter yang didukung:** Koma `,` (default) · Tab `\t` · Titik-koma `;`
> Dilengkapi fallback auto-deteksi delimiter apabila pilihan tidak cocok dengan struktur berkas.

### 🧹 Data Cleaning Engine (Pandas)
- **Trim nama kolom** — `df.columns.str.strip()`
- **Hapus baris kosong penuh** — `df.dropna(how='all')`
- **Isi missing values** — `df.fillna('')`
- **Hapus baris duplikat** *(opsional)* — `df.drop_duplicates()`
- **Trim spasi isi sel** pada kolom teks

Setiap proses pembersihan menghasilkan **laporan ringkas**: jumlah baris sebelum/sesudah, duplikat dihapus, missing values diisi, dan kolom yang di-trim.

### 📤 Format Output
| Format | Mesin Ekspor |
|--------|--------------|
| Excel (`.xlsx`) | `df.to_excel()` via **Openpyxl** (in-memory BytesIO) |
| JSON (`.json`) | `df.to_json(orient='records', indent=2)` |

### 🖥️ Preview Hasil Real-Time
- Pilihan **Excel** → preview tabel HTML interaktif
- Pilihan **JSON** → teks JSON terformat dengan syntax highlight gelap
- Ringkasan report pembersihan dalam bentuk badge informatif
- Tombol *unduh ulang* tanpa request ulang ke server

---

## 🏗️ Arsitektur

```text
┌─────────────────────┐         FormData          ┌──────────────────────────┐
│   React SPA (Vite)  │  ──────────────────────▶  │   Django REST Framework   │
│                     │      Axios POST            │                          │
│  • Bootstrap 5 UI   │                            │  • MultiPartParser       │
│  • Spinner loading  │  ◀──────────────────────  │  • Validasi ekstensi     │
│  • Error banner     │    JSON Envelope           │  • Limit 10 MB           │
│  • Auto-download    │    (base64 + preview)      │                          │
└─────────────────────┘                            │  ┌────────────────────┐  │
                                                   │  │ Pandas Engine      │  │
                                                   │  │ read → clean →     │  │
                                                   │  │ export (in-memory) │  │
                                                   │  └────────────────────┘  │
                                                   └──────────────────────────┘
```

**Prinsip desain:**
- ⚡ **Stateless / In-Memory Processing** — tanpa database SQL/NoSQL
- 🔓 **Tanpa autentikasi** — semua fitur dapat diakses publik
- 🛡️ **Batas ukuran 10 MB** divalidasi di sisi klien *dan* server

---

## 🛠️ Tech Stack

### Frontend
| Teknologi | Peran |
|-----------|-------|
| [Vite](https://vitejs.dev) | Build tool & dev server |
| [React 19](https://react.dev) | Library UI komponen |
| [Bootstrap 5](https://getbootstrap.com) | Styling & tata letak responsif |
| [Axios](https://axios-http.com) | Klien HTTP asinkronus |

### Backend
| Teknologi | Peran |
|-----------|-------|
| [Django](https://www.djangoproject.com) + [DRF](https://www.django-rest-framework.org) | REST API & parsing multipart |
| [Pandas](https://pandas.pydata.org) | Pembacaan, pembersihan, dan transformasi data |
| [Openpyxl](https://openpyxl.readthedocs.io) | Penulisan spreadsheet `.xlsx` |
| [django-cors-headers](https://github.com/adamchainz/django-cors-headers) | Keamanan lintas domain (CORS) |

---

## 🚀 Cara Menjalankan

### Prasyarat
- Python 3.10+
- Node.js 18+ & pnpm

### 1️⃣ Backend

```bash
cd backend

# Buat & aktifkan virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Instal dependensi
pip install django djangorestframework pandas openpyxl django-cors-headers

# Jalankan server
python manage.py runserver
```

Backend berjalan di **http://localhost:8000**

### 2️⃣ Frontend

```bash
cd frontend

pnpm install
pnpm dev
```

Frontend berjalan di **http://localhost:5173**

---

## 📡 API Reference

### `POST /api/convert/`

Mengonversi berkas data mentah menjadi format tujuan.

**Request** (`multipart/form-data`):

| Field | Tipe | Default | Deskripsi |
|-------|------|---------|-----------|
| `file` | file | — | Berkas `.csv`, `.txt`, atau `.json` (maks 10 MB) |
| `output_format` | string | `xlsx` | Format tujuan: `xlsx` atau `json` |
| `delimiter` | string | `comma` | Delimiter input: `comma`, `tab`, `semicolon` |
| `clean_missing` | boolean | `true` | Aktifkan dropna/fillna |
| `trim_columns` | boolean | `true` | Trim spasi nama kolom |
| `drop_duplicates` | boolean | `false` | Hapus baris duplikat |

**Response** (`200 OK`) — JSON envelope:

```json
{
  "filename": "data.xlsx",
  "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "file_base64": "UEsDBBQ...",
  "file_size": 4897,
  "preview": {
    "columns": ["Nama", "Umur", "Kota"],
    "rows": [["Budi", 25, "Jakarta"], ["Ani", 30, "Bandung"]]
  },
  "report": {
    "rows_before": 120,
    "rows_after": 115,
    "empty_rows_removed": 2,
    "duplicates_removed": 3,
    "missing_filled": 8,
    "columns_trimmed": [" Nama "]
  }
}
```

**Error Response** (`400 Bad Request`):

```json
{ "detail": "Struktur CSV rusak atau tidak valid." }
```

---

## 📁 Struktur Proyek

```text
dataSwissKnife/
├── backend/
│   ├── config/                # Settings Django (CORS, limit upload)
│   ├── converter/
│   │   ├── serializers.py     # Validasi request (ekstensi, ukuran, field)
│   │   ├── services.py        # Engine Pandas: reader, cleaner, exporter
│   │   ├── views.py           # APIView endpoint /api/convert/
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # UI utama (form, preview, report)
│   │   ├── api.js             # Axios client + base64 decoder
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
├── PROJECT.md                 # Product Requirement Document
└── README.md
```

---

## 🧪 Kriteria Pengujian yang Terpenuhi

1. ✅ **Komunikasi CORS** — React mengirim `MultiPartParser` tanpa diblokir kebijakan cross-origin
2. ✅ **In-Memory Integrity** — hasil `.xlsx` valid (dapat dibuka openpyxl/Excel), struktur kolom dipetakan akurat oleh DataFrame
3. ✅ **Error Resilience** — berkas non-data/rusak mengembalikan `HTTP 400` berupa JSON error yang ditampilkan sebagai alert merah, tanpa mematikan server

---

## 👤 Author

**Fitra Riadi**
- GitHub: [@FitraRiadi](https://github.com/FitraRiadi)

---

## 📄 License

Proyek ini dibuat sebagai portofolio pembelajaran.
