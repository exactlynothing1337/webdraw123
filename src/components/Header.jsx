import React from 'react'
import { useStore } from '../store/useStore'
import { drawShape } from '../utils/drawing'
import styles from './Header.module.css'

function getTimestamp() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

export default function Header() {
  const { layers, canvasWidth, canvasHeight, bgColor, brushColor, fillColor } = useStore()

  const handleSaveJpeg = () => {
    const flat = document.createElement('canvas')
    flat.width = canvasWidth; flat.height = canvasHeight
    const ctx = flat.getContext('2d')
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ;[...layers].reverse().forEach(layer => {
      if (!layer.visible || layer.id === 'background') return
      if (layer.type === 'drawing' && layer.canvas) {
        ctx.drawImage(layer.canvas, layer.x, layer.y, layer.width, layer.height)
      } else if (layer.type === 'shape' && layer.shapeData) {
        const { shapeData, x, y, width, height } = layer
        drawShape(ctx, shapeData, x, y, width, height,
          shapeData.brushColor, shapeData.fillColor, shapeData.filled, shapeData.brushSize, false)
      }
    })
    const a = document.createElement('a')
    a.href = flat.toDataURL('image/jpeg', 0.95)
    a.download = `${getTimestamp()}.jpg`
    a.click()
  }

  const handleSaveSdp = async () => {
    const layerData = await Promise.all(layers.map(async l => ({
      id: l.id, type: l.type, name: l.name,
      x: l.x, y: l.y, width: l.width, height: l.height,
      visible: l.visible, bgColor: l.bgColor,
      shapeData: l.shapeData || null,
      canvasData: l.canvas ? l.canvas.toDataURL() : null,
    })))
    const text = JSON.stringify({ version: '1.0', canvasWidth, canvasHeight, bgColor, brushColor, fillColor, layers: layerData }, null, 2)
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${getTimestamp()}.sdp`
    a.click()
  }

  const handleLoadSdp = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    try {
      const data = JSON.parse(text)
      const restoredLayers = await Promise.all(data.layers.map(async l => {
        if (l.canvasData) {
          const canvas = document.createElement('canvas')
          canvas.width = l.width || 100; canvas.height = l.height || 100
          const ctx = canvas.getContext('2d')
          await new Promise(res => {
            const img = new Image()
            img.onload = () => { ctx.drawImage(img, 0, 0); res() }
            img.src = l.canvasData
          })
          l.canvas = canvas
        }
        delete l.canvasData
        return l
      }))
      useStore.setState({
        canvasWidth: data.canvasWidth || 800,
        canvasHeight: data.canvasHeight || 600,
        bgColor: data.bgColor || '#FFFFFF',
        brushColor: data.brushColor || '#1A1916',
        fillColor: data.fillColor || '#D4500A',
        layers: restoredLayers,
        activeLayerId: restoredLayers.find(l => l.id !== 'background')?.id || null,
        canvasSetup: false,
      })
    } catch { alert('Invalid .sdp file') }
    e.target.value = ''
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.title}>WebDraw</span>
        <span className={styles.size}>{canvasWidth} × {canvasHeight}px</span>
      </div>
      <div className={styles.right}>
        <button className={`${styles.btn} ${styles.accent}`} onClick={handleSaveJpeg}>
          <ExportIcon /> Export JPEG
        </button>
        <button className={styles.btn} onClick={handleSaveSdp}>
          <SaveIcon /> Save Project
        </button>
        <label className={styles.btn}>
          <input type="file" accept=".sdp" hidden onChange={handleLoadSdp} />
          <LoadIcon /> Load Project
        </label>
      </div>
    </header>
  )
}

const ExportIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v8M5 7l3 3 3-3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1"/>
  </svg>
)
const SaveIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 2v4h6V2M5 9h6"/>
  </svg>
)
const LoadIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 10V2M5 5l3-3 3 3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1"/>
  </svg>
)
