const MAX_DIMENSION = 400
const JPEG_QUALITY = 0.85
const MAX_INPUT_SIZE = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateImage(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { error: `Unsupported file type: ${file.type}` }
  }
  if (file.size > MAX_INPUT_SIZE) {
    return { error: 'Image must be under 10 MB' }
  }
  return { ok: true }
}

export async function resizeImage(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY })
  return blob
}

export async function blobToDataUri(blob) {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return `data:image/jpeg;base64,${btoa(binary)}`
}

export async function uploadProfileImage({ dataUri, webId, authenticatedFetch }) {
  const cardUrl = webId.replace('#me', '')
  const escaped = dataUri.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  // Delete old image if one exists (ignore failure — may not have one yet)
  await authenticatedFetch(cardUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/sparql-update' },
    body: `
      PREFIX sid: <https://solidid.stucco.software/vocabulary#>
      DELETE { <${webId}> sid:image ?old . }
      WHERE  { <${webId}> sid:image ?old . }
    `
  })

  // Insert new image
  const response = await authenticatedFetch(cardUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/sparql-update' },
    body: `
      PREFIX sid: <https://solidid.stucco.software/vocabulary#>
      INSERT DATA { <${webId}> sid:image "${escaped}" . }
    `
  })
  if (!response.ok) {
    throw new Error(`Profile update failed: ${response.status}`)
  }

  return dataUri
}
