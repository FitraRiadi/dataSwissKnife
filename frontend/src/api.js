import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 60000,
})

function extractErrorMessage(data, status) {
  if (typeof data === 'object' && data !== null) {
    return Object.values(data).flat().join(' ')
  }
  if (status === 413) return 'Ukuran berkas melebihi batas maksimal 10 MB.'
  return `Server merespons dengan error ${status}.`
}

export async function convertFile({ file, outputFormat, delimiter, cleanMissing, trimColumns, dropDuplicates }) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('output_format', outputFormat)
  formData.append('delimiter', delimiter)
  formData.append('clean_missing', cleanMissing)
  formData.append('trim_columns', trimColumns)
  formData.append('drop_duplicates', dropDuplicates)

  try {
    const response = await api.post('/convert/', formData)
    return { envelope: response.data, ok: true }
  } catch (error) {
    let message = 'Terjadi kesalahan saat menghubungi server.'
    if (error.response) {
      message = extractErrorMessage(error.response.data, error.response.status)
    } else if (error.request) {
      message = 'Server tidak dapat dijangkau. Pastikan backend berjalan di port 8000.'
    }
    return { message, ok: false }
  }
}

export function envelopeToBlob(envelope) {
  const binary = atob(envelope.file_base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: envelope.content_type })
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
