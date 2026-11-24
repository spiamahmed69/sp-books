// POST /api/upload — Vercel serverless function.
//
// Accepts one multipart image field named "image" (max 5 MB), validates its
// type + size, forwards it to ImgBB with the server-side IMGBB_API_KEY, and
// returns { url }.
//
// The ImgBB key comes ONLY from process.env.IMGBB_API_KEY (set as a Vercel
// env var) — it is never written into code or any committed file.
//
// Known limitation: this endpoint is unauthenticated — anyone who can reach
// it can upload an image through the ImgBB key. Verifying the caller's
// Firebase ID token would need the Firebase Admin SDK; see DEPLOYMENT.md.
export const config = { api: { bodyParser: false } }

const MAX_BYTES = 5 * 1024 * 1024

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => {
      chunks.push(c)
      const size = chunks.reduce((s, b) => s + b.length, 0)
      if (size > MAX_BYTES + 1024 * 1024) {
        req.destroy()
        reject(Object.assign(new Error('File too large.'), { status: 413 }))
      }
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function parseMultipart(body, boundary) {
  const boundaryBuf = Buffer.from(`--${boundary}`)
  const parts = []
  let start = 0
  for (;;) {
    const idx = body.indexOf(boundaryBuf, start)
    if (idx === -1) break
    if (start > 0) parts.push(body.subarray(start, idx))
    start = idx + boundaryBuf.length
  }
  for (const part of parts) {
    if (part.length < 4) continue
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
    if (headerEnd === -1) continue
    const headers = part.subarray(0, headerEnd).toString('utf8')
    const data = part.subarray(headerEnd + 4)
    // Strip the trailing CRLF before the next boundary.
    const clean = data.length >= 2 && data[data.length - 2] === 13 && data[data.length - 1] === 10
      ? data.subarray(0, data.length - 2)
      : data
    const nameMatch = headers.match(/name="([^"]+)"/)
    const fileMatch = headers.match(/filename="([^"]*)"/)
    const typeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i)
    if (nameMatch?.[1] === 'image') {
      return {
        filename: fileMatch?.[1] || 'upload',
        contentType: (typeMatch?.[1] || '').trim(),
        data: clean,
      }
    }
  }
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  const apiKey = process.env.IMGBB_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Image upload is not configured on the server.' })
  }
  const contentType = req.headers['content-type'] || ''
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2]
  if (!boundary) {
    return res.status(400).json({ error: 'Expected a multipart upload.' })
  }
  try {
    const body = await readBody(req)
    const file = parseMultipart(body, boundary.trim())
    if (!file || file.data.length === 0) {
      return res.status(400).json({ error: 'No image file received.' })
    }
    if (!file.contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed.' })
    }
    if (file.data.length > MAX_BYTES) {
      return res.status(413).json({ error: 'Image must be under 5 MB.' })
    }
    const form = new FormData()
    form.append('image', file.data.toString('base64'))
    form.append('name', file.filename)
    const imgbb = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      body: form,
    })
    const result = await imgbb.json()
    if (!imgbb.ok || !result?.data?.url) {
      return res.status(502).json({ error: 'Image host rejected the upload.' })
    }
    return res.status(200).json({ url: result.data.url })
  } catch (err) {
    const status = err.status || 500
    return res.status(status).json({ error: err.message || 'Upload failed.' })
  }
}
