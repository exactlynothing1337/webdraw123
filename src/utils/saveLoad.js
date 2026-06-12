function getTimestamp() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const Y = now.getFullYear()
  const M = pad(now.getMonth() + 1)
  const D = pad(now.getDate())
  const H = pad(now.getHours())
  const I = pad(now.getMinutes())
  const S = pad(now.getSeconds())
  return `${Y}${M}${D}_${H}${I}${S}`
}

// Save as JPEG - flatten all layers onto one canvas
export function saveAsJpeg(layers, canvasWidth, canvasHeight, bgColor) {
  const flat = document.createElement('canvas')
  flat.width = canvasWidth
  flat.height = canvasHeight
  const ctx = flat.getContext('2d')

  // Fill background
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Draw layers bottom to top
  const reversed = [...layers].reverse()
  for (const layer of reversed) {
    if (!layer.visible) continue
    if (layer.id === 'background') continue

    if (layer.type === 'drawing' && layer.canvas) {
      ctx.drawImage(layer.canvas, layer.x, layer.y, layer.width, layer.height)
    } else if (layer.type === 'shape' && layer.shapeData) {
      // Re-render shape
      const { drawShape } = require('./drawing')
      const { shapeData, x, y, width, height } = layer
      drawShape(ctx, shapeData, x, y, width, height,
        shapeData.brushColor, shapeData.fillColor,
        shapeData.filled, shapeData.brushSize, false)
    }
  }

  const dataUrl = flat.toDataURL('image/jpeg', 0.95)
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${getTimestamp()}.jpg`
  a.click()
}

// Save as SDP (JSON plain text)
export function saveAsSdp(layers, canvasWidth, canvasHeight, bgColor, brushColor, fillColor) {
  const data = {
    version: '1.0',
    canvasWidth, canvasHeight, bgColor, brushColor, fillColor,
    layers: layers.map(l => ({
      id: l.id,
      type: l.type,
      name: l.name,
      x: l.x, y: l.y,
      width: l.width, height: l.height,
      visible: l.visible,
      bgColor: l.bgColor,
      shapeData: l.shapeData || null,
      // canvas pixel data serialized as dataURL
      canvasData: l.canvas ? l.canvas.toDataURL() : null,
    }))
  }

  const text = JSON.stringify(data, null, 2)
  const blob = new Blob([text], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${getTimestamp()}.sdp`
  a.click()
}

// Load SDP file
export function loadSdp(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        // Restore canvases from dataURLs
        const layers = await Promise.all(data.layers.map(async l => {
          if (l.canvasData) {
            const canvas = document.createElement('canvas')
            canvas.width = l.width
            canvas.height = l.height
            const ctx = canvas.getContext('2d')
            const img = new Image()
            await new Promise(res => {
              img.onload = () => { ctx.drawImage(img, 0, 0); res() }
              img.src = l.canvasData
            })
            l.canvas = canvas
          }
          delete l.canvasData
          return l
        }))
        resolve({ ...data, layers })
      } catch (err) { reject(err) }
    }
    reader.readAsText(file)
  })
}
