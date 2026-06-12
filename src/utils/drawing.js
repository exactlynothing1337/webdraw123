export const BRUSH_PX = { 1: 2, 2: 5, 3: 12 }

export function drawLine(ctx, x1, y1, x2, y2, color, size) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = BRUSH_PX[size] || 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}

export function drawDot(ctx, x, y, color, size) {
  const r = (BRUSH_PX[size] || 2) / 2
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function buildShapePath(ctx, shapeData, x, y, w, h, shift) {
  const { type, polygonSides, starPoints, starR1, starR2 } = shapeData
  ctx.beginPath()

  if (type === 'rectangle') {
    if (shift) {
      const s = Math.min(Math.abs(w), Math.abs(h))
      ctx.rect(x, y, w >= 0 ? s : -s, h >= 0 ? s : -s)
    } else {
      ctx.rect(x, y, w, h)
    }
  } else if (type === 'oval') {
    let rx = Math.abs(w) / 2, ry = Math.abs(h) / 2
    if (shift) { rx = ry = Math.min(rx, ry) }
    const cx = x + (w >= 0 ? rx : -rx)
    const cy = y + (h >= 0 ? ry : -ry)
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  } else if (type === 'polygon') {
    const n = polygonSides || 6
    let rx = Math.abs(w) / 2, ry = Math.abs(h) / 2
    if (shift) { rx = ry = Math.min(rx, ry) }
    const cx = x + (w >= 0 ? rx : -rx)
    const cy = y + (h >= 0 ? ry : -ry)
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2
      const px = cx + rx * Math.cos(angle)
      const py = cy + ry * Math.sin(angle)
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.closePath()
  } else if (type === 'star') {
    const n = starPoints || 5
    let outerR = starR1 || 60
    let innerR = starR2 || 30
    const cx = x + w / 2, cy = y + h / 2
    if (!shift) {
      const scale = Math.min(Math.abs(w) / (outerR * 2), Math.abs(h) / (outerR * 2))
      outerR *= scale; innerR *= scale
    }
    for (let i = 0; i < n * 2; i++) {
      const angle = (Math.PI * 2 * i / (n * 2)) - Math.PI / 2
      const r = i % 2 === 0 ? outerR : innerR
      const px = cx + r * Math.cos(angle)
      const py = cy + r * Math.sin(angle)
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.closePath()
  }
}

export function drawShape(ctx, shapeData, x, y, w, h, brushColor, fillColor, filled, brushSize, shift) {
  ctx.save()
  buildShapePath(ctx, shapeData, x, y, w, h, shift)
  if (filled) {
    ctx.fillStyle = fillColor
    ctx.fill()
    ctx.strokeStyle = brushColor
    ctx.lineWidth = 1
    ctx.stroke()
  } else {
    ctx.strokeStyle = brushColor
    ctx.lineWidth = BRUSH_PX[brushSize] || 2
    ctx.stroke()
  }
  ctx.restore()
}

export function floodFill(canvas, startX, startY, fillColor) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  const idx = (x, y) => (y * width + x) * 4
  startX = Math.floor(startX); startY = Math.floor(startY)
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return

  const si = idx(startX, startY)
  const [tR, tG, tB, tA] = [data[si], data[si+1], data[si+2], data[si+3]]

  const fr = parseInt(fillColor.slice(1, 3), 16)
  const fg = parseInt(fillColor.slice(3, 5), 16)
  const fb = parseInt(fillColor.slice(5, 7), 16)

  if (tR === fr && tG === fg && tB === fb && tA === 255) return

  const queue = [[startX, startY]]
  const visited = new Uint8Array(width * height)

  while (queue.length) {
    const [x, y] = queue.shift()
    if (x < 0 || x >= width || y < 0 || y >= height) continue
    const vi = y * width + x
    if (visited[vi]) continue
    visited[vi] = 1
    const i = idx(x, y)
    if (data[i] !== tR || data[i+1] !== tG || data[i+2] !== tB || data[i+3] !== tA) continue
    data[i] = fr; data[i+1] = fg; data[i+2] = fb; data[i+3] = 255
    queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1])
  }
  ctx.putImageData(imageData, 0, 0)
}

export function applyStamp(canvas, x, y, template, customImg, brushColor) {
  const ctx = canvas.getContext('2d')
  const size = 24
  ctx.save()
  ctx.translate(x, y)

  if (customImg) {
    ctx.drawImage(customImg, -size, -size, size*2, size*2)
  } else if (template === 'star') {
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i / 10) - Math.PI / 2
      const r = i % 2 === 0 ? size : size * 0.4
      const px = r * Math.cos(angle), py = r * Math.sin(angle)
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fillStyle = brushColor; ctx.fill()
  } else if (template === 'heart') {
    const s = size
    ctx.beginPath()
    ctx.moveTo(0, s*0.3)
    ctx.bezierCurveTo(-s*.1,-s*.2,-s,-s*.2,-s,s*.2)
    ctx.bezierCurveTo(-s,s*.7,0,s,0,s)
    ctx.bezierCurveTo(0,s,s,s*.7,s,s*.2)
    ctx.bezierCurveTo(s,-s*.2,s*.1,-s*.2,0,s*.3)
    ctx.fillStyle = brushColor; ctx.fill()
  } else if (template === 'arrow') {
    const s = size
    ctx.beginPath()
    ctx.moveTo(-s,-s*.3);ctx.lineTo(s*.2,-s*.3);ctx.lineTo(s*.2,-s*.6)
    ctx.lineTo(s,0);ctx.lineTo(s*.2,s*.6);ctx.lineTo(s*.2,s*.3);ctx.lineTo(-s,s*.3)
    ctx.closePath(); ctx.fillStyle = brushColor; ctx.fill()
  } else if (template === 'checkmark') {
    const s = size
    ctx.beginPath()
    ctx.moveTo(-s*.8,0);ctx.lineTo(-s*.2,s*.6);ctx.lineTo(s*.8,-s*.6)
    ctx.strokeStyle = brushColor; ctx.lineWidth = s*0.3; ctx.lineCap='round'; ctx.stroke()
  }
  ctx.restore()
}
