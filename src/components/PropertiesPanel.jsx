import React from 'react'
import { useStore } from '../store/useStore'
import ColorPicker from './ColorPicker'
import styles from './PropertiesPanel.module.css'

const BRUSH_SIZES = [
  { id: 1, label: 'S', px: 2 },
  { id: 2, label: 'M', px: 5 },
  { id: 3, label: 'L', px: 12 },
]

const SHAPES = [
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'oval', label: 'Oval', icon: '⬭' },
  { id: 'polygon', label: 'Polygon', icon: '⬡' },
  { id: 'star', label: 'Star', icon: '★' },
]

const STAMPS = [
  { id: 'star', label: 'Star' },
  { id: 'heart', label: 'Heart' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'checkmark', label: 'Check' },
]

export default function PropertiesPanel() {
  const {
    activeTool, brushSize, setBrushSize,
    brushColor, setBrushColor, fillColor, setFillColor,
    shapeType, setShapeType, shapeFilled, setShapeFilled,
    polygonSides, setPolygonSides,
    starPoints, setStarPoints, starR1, setStarR1, starR2, setStarR2,
    stampTemplate, setStampTemplate, setCustomStampImage,
  } = useStore()

  const handleCustomStamp = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => setCustomStampImage(img)
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Colors</div>
        <ColorPicker />
      </div>

      {(activeTool === 'brush' || activeTool === 'shape') && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Brush Size</div>
          <div className={styles.brushSizes}>
            {BRUSH_SIZES.map(b => (
              <button
                key={b.id}
                className={`${styles.sizeBtn} ${brushSize === b.id ? styles.active : ''}`}
                onClick={() => setBrushSize(b.id)}
                title={`${b.px}px`}
              >
                <div
                  className={styles.sizeCircle}
                  style={{ width: b.px * 2 + 4, height: b.px * 2 + 4 }}
                />
                <span>{b.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTool === 'shape' && (
        <>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Shape</div>
            <div className={styles.shapeGrid}>
              {SHAPES.map(s => (
                <button
                  key={s.id}
                  className={`${styles.shapeBtn} ${shapeType === s.id ? styles.active : ''}`}
                  onClick={() => setShapeType(s.id)}
                >
                  <span className={styles.shapeIcon}>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={shapeFilled}
                onChange={e => setShapeFilled(e.target.checked)}
              />
              <span className={styles.toggleLabel}>Fill shape</span>
            </label>
          </div>

          {shapeType === 'polygon' && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Sides</div>
              <div className={styles.numberRow}>
                <button onClick={() => setPolygonSides(Math.max(3, polygonSides - 1))}>−</button>
                <span>{polygonSides}</span>
                <button onClick={() => setPolygonSides(polygonSides + 1)}>+</button>
              </div>
            </div>
          )}

          {shapeType === 'star' && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Star Options</div>
              <div className={styles.starOptions}>
                <div className={styles.numberRow}>
                  <span className={styles.numberLabel}>Points</span>
                  <button onClick={() => setStarPoints(Math.max(3, starPoints - 1))}>−</button>
                  <span>{starPoints}</span>
                  <button onClick={() => setStarPoints(starPoints + 1)}>+</button>
                </div>
                <label className={styles.sliderLabel}>
                  R1 (outer) <span>{starR1}</span>
                  <input type="range" min={20} max={200} value={starR1}
                    onChange={e => setStarR1(+e.target.value)} />
                </label>
                <label className={styles.sliderLabel}>
                  R2 (inner) <span>{starR2}</span>
                  <input type="range" min={5} max={180} value={starR2}
                    onChange={e => setStarR2(+e.target.value)} />
                </label>
              </div>
            </div>
          )}
        </>
      )}

      {activeTool === 'stamp' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Template</div>
          <div className={styles.stamps}>
            {STAMPS.map(s => (
              <button
                key={s.id}
                className={`${styles.stampBtn} ${stampTemplate === s.id ? styles.active : ''}`}
                onClick={() => setStampTemplate(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <label className={styles.uploadBtn}>
            <input type="file" accept="image/*" onChange={handleCustomStamp} hidden />
            + Custom Image
          </label>
        </div>
      )}
    </div>
  )
}
