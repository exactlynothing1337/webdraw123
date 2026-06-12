import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import styles from './CanvasSetup.module.css'

export default function CanvasSetup() {
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [color, setColor] = useState('#FFFFFF')
  const confirmSetup = useStore(s => s.confirmSetup)

  const presets = [
    { label: 'HD 1280×720', w: 1280, h: 720 },
    { label: 'Default 800×600', w: 800, h: 600 },
    { label: 'Square 600×600', w: 600, h: 600 },
    { label: 'A4 794×1123', w: 794, h: 1123 },
  ]

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div className={styles.logo}>WebDraw</div>
          <p className={styles.subtitle}>Set up your canvas to get started</p>
        </div>

        <div className={styles.presets}>
          {presets.map(p => (
            <button
              key={p.label}
              className={styles.preset}
              onClick={() => { setWidth(p.w); setHeight(p.h) }}
            >
              <span className={styles.presetLabel}>{p.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.fields}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Width (px)</label>
              <input
                type="number"
                value={width}
                min={100} max={4000}
                onChange={e => setWidth(+e.target.value)}
              />
            </div>
            <div className={styles.divider}>×</div>
            <div className={styles.field}>
              <label>Height (px)</label>
              <input
                type="number"
                value={height}
                min={100} max={4000}
                onChange={e => setHeight(+e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Background Color</label>
            <div className={styles.colorRow}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} />
              <span className={styles.colorHex}>{color.toUpperCase()}</span>
              <button className={styles.whiteBtn} onClick={() => setColor('#FFFFFF')}>White</button>
              <button className={styles.transparentBtn} onClick={() => setColor('#F0F0F0')}>Light gray</button>
            </div>
          </div>
        </div>

        <button
          className={styles.confirm}
          onClick={() => confirmSetup(width, height, color)}
        >
          Create Canvas
        </button>
      </div>
    </div>
  )
}
