import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import styles from './ColorPicker.module.css'

const PALETTE = [
  '#1A1916','#FFFFFF','#F5F5F4','#E7E5E4',
  '#EF4444','#F97316','#EAB308','#22C55E',
  '#14B8A6','#3B82F6','#8B5CF6','#EC4899',
  '#D4500A','#92400E','#1D4ED8','#166534',
]

export default function ColorPicker() {
  const { brushColor, setBrushColor, fillColor, setFillColor, recentColors } = useStore()
  const [activeTarget, setActiveTarget] = useState('brush') // 'brush' | 'fill'

  const setColor = (color) => {
    if (activeTarget === 'brush') setBrushColor(color)
    else setFillColor(color)
  }

  const currentColor = activeTarget === 'brush' ? brushColor : fillColor

  return (
    <div className={styles.root}>
      <div className={styles.swatchRow}>
        <button
          className={`${styles.bigSwatch} ${activeTarget === 'brush' ? styles.selected : ''}`}
          style={{ background: brushColor, border: '2px solid var(--border-strong)' }}
          onClick={() => setActiveTarget('brush')}
          title="Brush color"
        />
        <button
          className={`${styles.bigSwatch} ${styles.fillSwatch} ${activeTarget === 'fill' ? styles.selected : ''}`}
          style={{ background: fillColor, border: '2px solid var(--border-strong)' }}
          onClick={() => setActiveTarget('fill')}
          title="Fill color"
        />
        <div className={styles.swatchLabels}>
          <span className={activeTarget === 'brush' ? styles.activeLabel : ''}>Brush</span>
          <span className={activeTarget === 'fill' ? styles.activeLabel : ''}>Fill</span>
        </div>
      </div>

      <div className={styles.pickerRow}>
        <input
          type="color"
          value={currentColor}
          onChange={e => setColor(e.target.value)}
          className={styles.nativePicker}
        />
        <input
          type="text"
          value={currentColor}
          onChange={e => {
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) setColor(e.target.value)
          }}
          maxLength={7}
          className={styles.hexInput}
          placeholder="#000000"
        />
      </div>

      <div className={styles.label}>Palette</div>
      <div className={styles.palette}>
        {PALETTE.map(c => (
          <button
            key={c}
            className={`${styles.swatch} ${currentColor === c ? styles.active : ''}`}
            style={{ background: c, border: c === '#FFFFFF' ? '1px solid var(--border)' : 'none' }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>

      {recentColors.length > 0 && (
        <>
          <div className={styles.label}>Recent</div>
          <div className={styles.palette}>
            {recentColors.slice(0, 8).map((c, i) => (
              <button
                key={c + i}
                className={`${styles.swatch} ${currentColor === c ? styles.active : ''}`}
                style={{ background: c, border: c === '#FFFFFF' ? '1px solid var(--border)' : 'none' }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
