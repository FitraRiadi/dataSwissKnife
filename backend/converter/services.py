import base64
import io
import json

import pandas as pd


MAX_UPLOAD_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {'.csv', '.txt', '.json'}
DELIMITERS = {'comma': ',', 'tab': '\t', 'semicolon': ';'}
PREVIEW_ROW_LIMIT = 50


class ConversionError(Exception):
    """Digunakan saat berkas tidak valid atau gagal diproses."""


def validate_file(file):
    import os

    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ConversionError('Hanya berkas .csv, .txt, atau .json yang diterima.')
    if file.size > MAX_UPLOAD_SIZE:
        raise ConversionError('Ukuran berkas melebihi batas maksimal 10 MB.')


def read_to_dataframe(file, delimiter='comma'):
    """Membaca unggahan csv/txt/json menjadi DataFrame beserta laporan awal."""
    ext = None
    import os
    ext = os.path.splitext(file.name)[1].lower()

    report = {
        'rows_before': 0,
        'rows_after': 0,
        'empty_rows_removed': 0,
        'duplicates_removed': 0,
        'missing_filled': 0,
        'columns_trimmed': [],
    }

    if ext == '.json':
        try:
            df = pd.read_json(file)
        except ValueError:
            file.seek(0)
            try:
                df = pd.read_json(file, lines=True)
            except Exception:
                raise ConversionError(
                    'Struktur JSON tidak valid. Gunakan array of objects atau NDJSON.'
                )
        except Exception:
            raise ConversionError('Gagal membaca berkas JSON.')
        if not isinstance(df, pd.DataFrame) or df.empty:
            raise ConversionError('Berkas JSON tidak mengandung data yang bisa dibaca.')
        return df, report

    sep = DELIMITERS.get(delimiter, ',')
    try:
        df = pd.read_csv(file, sep=sep)
    except UnicodeDecodeError:
        file.seek(0)
        try:
            df = pd.read_csv(file, sep=sep, encoding='latin-1')
        except Exception:
            raise ConversionError('Gagal membaca berkas: encoding tidak dikenali.')
    except pd.errors.EmptyDataError:
        raise ConversionError('Berkas kosong atau tidak memiliki data.')
    except pd.errors.ParserError:
        raise ConversionError('Struktur berkas rusak atau tidak valid. Periksa pilihan delimiter.')

    # Fallback: jika hasil hanya 1 kolom dan delimiter terpilih masih ada di
    # dalam nama kolomnya, kemungkinan delimiter salah — coba deteksi otomatis.
    if len(df.columns) == 1 and sep in df.columns[0]:
        file.seek(0)
        try:
            sniffed = pd.read_csv(file, sep=None, engine='python')
            if len(sniffed.columns) > 1:
                df = sniffed
        except Exception:
            pass
    if df.empty:
        raise ConversionError('Berkas tidak mengandung baris data.')
    return df, report


def clean_dataframe(df, report, clean_missing=True, trim_columns=True, drop_dupes=False):
    if trim_columns:
        stripped = {old for old in df.columns if old != old.strip()}
        if stripped:
            report['columns_trimmed'] = sorted(stripped)
        df.columns = df.columns.str.strip()
    else:
        df.columns = [str(col) for col in df.columns]

    if clean_missing:
        rows_before_dropna = len(df)
        df = df.dropna(how='all')
        report['empty_rows_removed'] = rows_before_dropna - len(df)
        report['missing_filled'] = int(df.isna().sum().sum())
        df = df.fillna('')

    if drop_dupes:
        rows_before_dedup = len(df)
        df = df.drop_duplicates()
        report['duplicates_removed'] = rows_before_dedup - len(df)

    report['rows_before'] = report['rows_before'] or 0
    return df.reset_index(drop=True)


def build_report(df_before_len, df_after_len, report):
    report['rows_after'] = int(df_after_len)
    return report


def export_dataframe(df, output_format):
    if output_format == 'xlsx':
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Sheet1')
        content = buffer.getvalue()
        content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        extension = 'xlsx'
    elif output_format == 'json':
        content = df.to_json(orient='records', indent=2).encode('utf-8')
        content_type = 'application/json'
        extension = 'json'
    else:
        raise ConversionError("Format tujuan tidak valid. Gunakan 'xlsx' atau 'json'.")
    return content, content_type, extension


def convert_uploaded_file(file, output_format='xlsx', delimiter='comma',
                          clean_missing=True, trim_columns=True, drop_dupes=False):
    """Memproses unggahan menjadi envelope: file base64 + preview + report."""
    validate_file(file)

    df, report = read_to_dataframe(file, delimiter=delimiter)
    report['rows_before'] = int(len(df))
    df = clean_dataframe(df, report, clean_missing=clean_missing,
                         trim_columns=trim_columns, drop_dupes=drop_dupes)
    report['rows_after'] = int(len(df))

    content, content_type, extension = export_dataframe(df, output_format)

    preview_df = df.head(PREVIEW_ROW_LIMIT).convert_dtypes()
    preview = {
        'columns': [str(col) for col in preview_df.columns],
        'rows': [[None if pd.isna(val) else (val.item() if hasattr(val, 'item') else val)
                  for val in row] for row in preview_df.itertuples(index=False)],
    }

    base_name = file.name.rsplit('.', 1)[0] or 'converted'
    filename = f'{base_name}.{extension}'

    return {
        'filename': filename,
        'content_type': content_type,
        'file_base64': base64.b64encode(content).decode('ascii'),
        'file_size': len(content),
        'preview': preview,
        'report': report,
    }
