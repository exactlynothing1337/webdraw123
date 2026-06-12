import React from 'react'
import { useStore } from './store/useStore'
import CanvasSetup from './components/CanvasSetup'
import Header from './components/Header'
import Toolbar from './components/Toolbar'
import PropertiesPanel from './components/PropertiesPanel'
import LayersPanel from './components/LayersPanel'
import CanvasArea from './components/CanvasArea'
import styles from './App.module.css'

export default function App() {
  const canvasSetup = useStore(s => s.canvasSetup)

  return (
    <div className={styles.app}>
      {canvasSetup && <CanvasSetup />}
      <Header />
      <div className={styles.workspace}>
        <Toolbar />
        <PropertiesPanel />
        <CanvasArea />
        <LayersPanel />
      </div>
    </div>
  )
}
