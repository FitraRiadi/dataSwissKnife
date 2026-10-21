# Data Swiss Knife

> All-in-One Web Utility for Data Conversion & Transformation — convert raw CSV, TXT, and JSON files into clean Excel or JSON directly from your browser.

Data Swiss Knife is a full-stack web application built on a **Decoupled API Architecture**. It enables users to upload raw data files, automatically clean them using Pandas, and convert them into other functional formats through a responsive Single Page Application (SPA) interface.

---

## Main Features

### Multi-Format Input
| Format | Read Method |
|--------|-------------|
| `.csv` | `pd.read_csv()` with selected delimiter |
| `.txt` | `pd.read_csv()` with selected delimiter |
| `.json` | `pd.read_json()` (array of objects & NDJSON) |

**Supported delimiters:** Comma `,` (default) · Tab `\t` · Semicolon `;`
> Includes an auto-detection fallback if the chosen delimiter does not match the file structure.

### Data Cleaning Engine (Pandas)
- **Trim column names** — `df.columns.str.strip()`
- **Remove empty rows** — `df.dropna(how='all')`
- **Fill missing values** — `df.fillna('')`
- **Remove duplicate rows** *(optional)* — `df.drop_duplicates()`
- **Trim string whitespace** across text columns

Every cleaning process generates a **concise report**: row count before/after, duplicates removed, missing values filled, and trimmed columns.

### Output Formats
| Format | Export Engine |
|--------|---------------|
| Excel (`.xlsx`) | `df.to_excel()` via **Openpyxl** (in-memory BytesIO) |
| JSON (`.json`) | `df.to_json(orient='records', indent=2)` |

### Real-Time Result Preview
- **Excel** output → interactive HTML table preview
- **JSON** output → formatted JSON text with dark syntax highlighting
- Informative badge summary of the data cleaning report
- *Re-download* button without sending duplicate server requests

---

## Architecture

```text
┌─────────────────────┐         FormData          ┌──────────────────────────┐
│    React SPA (Vite) │  ──────────────────────▶  │   Django REST Framework  │
│                     │       Axios POST          │                          │
│  • Bootstrap 5 UI   │                           │  • MultiPartParser       │
│  • Loading spinner  │  ◀──────────────────────  │  • Extension validation  │
│  • Error banner     │    JSON Envelope          │  • 10 MB limit           │
│  • Auto-download    │    (base64 + preview)     │                          │
└─────────────────────┘                           │  ┌────────────────────┐  │
                                                  │  │ Pandas Engine      │  │
                                                  │  │ read → clean →     │  │
                                                  │  │ export (in-memory) │  │
                                                  │  └────────────────────┘  │
                                                  └──────────────────────────┘
