import { useState } from 'react'
import './App.css'
import { convertFile, envelopeToBlob, triggerDownload } from './api.js'

const MAX_SIZE = 10 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['.csv', '.txt', '.json']

export default function App() {
  const [file, setFile] = useState(null)
  const [outputFormat, setOutputFormat] = useState('xlsx')
  const [delimiter, setDelimiter] = useState('comma')
  const [cleanMissing, setCleanMissing] = useState(true)
  const [trimColumns, setTrimColumns] = useState(true)
  const [dropDuplicates, setDropDuplicates] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const isJsonInput = file ? file.name.toLowerCase().endsWith('.json') : false

  const handleFileChange = (event) => {
    setError('')
    setResult(null)
    const selected = event.target.files[0]
    if (!selected) {
      setFile(null)
      return
    }
    const ext = '.' + selected.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError('Hanya berkas .csv, .txt, atau .json yang diterima.')
      event.target.value = ''
      setFile(null)
      return
    }
    if (selected.size > MAX_SIZE) {
      setError('Ukuran berkas melebihi batas maksimal 10 MB.')
      event.target.value = ''
      setFile(null)
      return
    }
    if (ext === '.json') setDelimiter('comma')
    setFile(selected)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setResult(null)
    if (!file) {
      setError('Silakan pilih berkas terlebih dahulu.')
      return
    }
    setLoading(true)
    const res = await convertFile({
      file,
      outputFormat,
      delimiter: isJsonInput ? 'comma' : delimiter,
      cleanMissing,
      trimColumns,
      dropDuplicates,
    })
    setLoading(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    const blob = envelopeToBlob(res.envelope)
    triggerDownload(blob, res.envelope.filename)
    setResult({ envelope: res.envelope, blob, autoDownloaded: true })
  }

  const handleRedownload = () => {
    if (!result) return
    triggerDownload(result.blob, result.envelope.filename)
  }

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="app-wrapper bg-light min-vh-100 py-5">
      <div className="container" style={{ maxWidth: '820px' }}>
        <div className="text-center mb-4">
          <h1 className="fw-bold">Data Swiss Knife</h1>
          <p className="text-muted mb-0">
            Konversi &amp; bersihkan data CSV / TXT / JSON Anda menjadi Excel atau JSON — langsung di browser.
          </p>
          <hr />
        </div>

        <div className="card shadow-sm mb-4">
          <div className="card-body p-4">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="dataFile" className="form-label fw-semibold">
                  Pilih Berkas (.csv / .txt / .json)
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="dataFile"
                  accept=".csv,.txt,.json"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                {file && (
                  <div className="form-text">
                    {file.name} ({formatBytes(file.size)})
                  </div>
                )}
              </div>

              {!isJsonInput && (
                <div className="mb-3">
                  <label htmlFor="delimiterSelect" className="form-label fw-semibold">
                    Delimiter Input
                  </label>
                  <select
                    id="delimiterSelect"
                    className="form-select"
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                    disabled={loading}
                    style={{ maxWidth: '240px' }}
                  >
                    <option value="comma">Koma ( , )</option>
                    <option value="tab">Tab ( ⇥ )</option>
                    <option value="semicolon">Titik-koma ( ; )</option>
                  </select>
                </div>
              )}

              <div className="mb-3">
                <span className="form-label fw-semibold d-block">Pilih Format Tujuan:</span>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="outputFormat"
                    id="formatXlsx"
                    value="xlsx"
                    checked={outputFormat === 'xlsx'}
                    onChange={() => setOutputFormat('xlsx')}
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="formatXlsx">
                    Excel (.xlsx)
                  </label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="outputFormat"
                    id="formatJson"
                    value="json"
                    checked={outputFormat === 'json'}
                    onChange={() => setOutputFormat('json')}
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="formatJson">
                    JSON (.json)
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <span className="form-label fw-semibold d-block">Fitur Pembersihan (Pandas):</span>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="cleanMissing"
                    checked={cleanMissing}
                    onChange={(e) => setCleanMissing(e.target.checked)}
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="cleanMissing">
                    Clean Missing Values <code>.dropna()</code> / <code>.fillna()</code>
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="trimColumns"
                    checked={trimColumns}
                    onChange={(e) => setTrimColumns(e.target.checked)}
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="trimColumns">
                    Trim Spaces Column Names <code>.columns.str.strip()</code>
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="dropDuplicates"
                    checked={dropDuplicates}
                    onChange={(e) => setDropDuplicates(e.target.checked)}
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="dropDuplicates">
                    Hapus Baris Duplikat <code>.drop_duplicates()</code>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading || !file}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Memproses...
                  </>
                ) : (
                  'Proses & Unduh'
                )}
              </button>
            </form>
          </div>
        </div>

        {result && (
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <h5 className="fw-bold mb-0">
                  Hasil Konversi{' '}
                  <span className={`badge ${outputFormat === 'xlsx' ? 'bg-success' : 'bg-dark'}`}>
                    {result.envelope.filename}
                  </span>
                </h5>
                <button className="btn btn-outline-primary btn-sm" onClick={handleRedownload}>
                  Unduh Ulang ({formatBytes(result.envelope.file_size)})
                </button>
              </div>

              {result.autoDownloaded && (
                <div className="alert alert-success py-2 small" role="alert">
                  Berkas otomatis terunduh. Gunakan tombol di atas untuk mengunduh ulang.
                </div>
              )}

              <h6 className="text-muted">Ringkasan Pembersihan</h6>
              <ul className="list-inline small">
                <li className="list-inline-item badge text-bg-light border me-1">
                  Baris: {result.envelope.report.rows_before} → {result.envelope.report.rows_after}
                </li>
                {result.envelope.report.empty_rows_removed > 0 && (
                  <li className="list-inline-item badge text-bg-warning me-1">
                    Baris kosong dihapus: {result.envelope.report.empty_rows_removed}
                  </li>
                )}
                {result.envelope.report.duplicates_removed > 0 && (
                  <li className="list-inline-item badge text-bg-warning me-1">
                    Duplikat dihapus: {result.envelope.report.duplicates_removed}
                  </li>
                )}
                {result.envelope.report.missing_filled > 0 && (
                  <li className="list-inline-item badge text-bg-info me-1">
                    Missing values diisi: {result.envelope.report.missing_filled}
                  </li>
                )}
                {result.envelope.report.columns_trimmed.length > 0 && (
                  <li className="list-inline-item badge text-bg-info">
                    Kolom di-trim: {result.envelope.report.columns_trimmed.join(', ')}
                  </li>
                )}
              </ul>

              <h6 className="text-muted mt-3">
                Preview Data {result.envelope.preview.rows.length === 50 && '(50 baris pertama)'}
              </h6>
              {outputFormat === 'json' ? (
                <pre className="bg-dark text-light rounded p-3 small overflow-auto" style={{ maxHeight: '420px' }}>
                  {JSON.stringify(
                    result.envelope.preview.rows.map((row) =>
                      Object.fromEntries(result.envelope.preview.columns.map((col, i) => [col, row[i]]))
                    ),
                    null,
                    2
                  )}
                </pre>
              ) : (
                <div className="table-responsive border rounded overflow-auto" style={{ maxHeight: '420px' }}>
                  <table className="table table-striped table-sm table-bordered mb-0 small">
                    <thead className="table-dark sticky-top">
                      <tr>
                        {result.envelope.preview.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.envelope.preview.rows.map((row, idx) => (
                        <tr key={idx}>
                          {row.map((cell, i) => (
                            <td key={i}>{cell ?? ''}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-muted small mt-3 mb-0">
          Maksimal 10 MB · Diproses in-memory · Tidak ada file yang disimpan di server
        </p>
      </div>
    </div>
  )
}
