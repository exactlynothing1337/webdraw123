import React from 'react'
import { useStore } from '../store/useStore'
import styles from './LayersPanel.module.css'

function LayerItem({ layer, isActive }) {
  const { setActiveLayer, moveLayerUp, moveLayerDown, deleteLayer, addDrawingLayer } = useStore()

  const typeLabel = layer.type === 'background' ? 'BG'
    : layer.type === 'shape' ? 'VEC' : 'BMP'

  const typeClass = layer.type === 'background' ? styles.tagBg
    : layer.type === 'shape' ? styles.tagVec : styles.tagBmp

  return (
    <div
      className={`${styles.layer} ${isActive ? styles.active : ''} ${layer.id === 'background' ? styles.bgLayer : ''}`}
      onClick={() => setActiveLayer(layer.id)}
    >
      <div className={styles.layerLeft}>
        <span className={`${styles.tag} ${typeClass}`}>{typeLabel}</span>
        <span className={styles.layerName}>{layer.name}</span>
      </div>
      {layer.id !== 'background' && (
        <div className={styles.layerActions}>
          <button onClick={e => { e.stopPropagation(); moveLayerUp(layer.id) }} title="Move up">↑</button>
          <button onClick={e => { e.stopPropagation(); moveLayerDown(layer.id) }} title="Move down">↓</button>
          <button onClick={e => { e.stopPropagation(); deleteLayer(layer.id) }} title="Delete" className={styles.deleteBtn}>×</button>
        </div>
      )}
    </div>
  )
}

export default function LayersPanel() {
  const layers = useStore(s => s.layers)
  const activeLayerId = useStore(s => s.activeLayerId)
  const addDrawingLayer = useStore(s => s.addDrawingLayer)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span>Layers</span>
        <button className={styles.addBtn} onClick={addDrawingLayer} title="Add layer">+</button>
      </div>
      <div className={styles.list}>
        {layers.map(layer => (
          <LayerItem
            key={layer.id}
            layer={layer}
            isActive={layer.id === activeLayerId}
          />
        ))}
      </div>
    </div>
  )
}
