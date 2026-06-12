import React from 'react'
import { useStore } from '../store/useStore'
import styles from './Toolbar.module.css'

const tools = [
  {
    id: 'brush',
    label: 'Paintbrush',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
        <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
    )
  },
  {
    id: 'shape',
    label: 'Shapes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="8" height="8" rx="1"/>
        <circle cx="17" cy="7" r="4"/>
        <polygon points="12,20 20,20 16,13"/>
      </svg>
    )
  },
  {
    id: 'stamp',
    label: 'Stamp',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11V6a3 3 0 0 1 6 0v5"/>
        <rect x="5" y="11" width="14" height="4" rx="1"/>
        <line x1="5" y1="19" x2="19" y2="19"/>
      </svg>
    )
  },
  {
    id: 'fill',
    label: 'Bucket Fill',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 11.5a4 4 0 0 1 0 5"/>
        <path d="M3.5 8.5l9-5 9 5-9 5-9-5z"/>
        <path d="M3.5 8.5v7l9 5 9-5v-7"/>
        <path d="M12 13.5v8"/>
      </svg>
    )
  },
]

const actionBtns = [
  {
    id: 'undo',
    label: 'Undo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7v6h6"/>
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
      </svg>
    )
  },
  {
    id: 'redo',
    label: 'Redo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 7v6h-6"/>
        <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
      </svg>
    )
  },
]

export default function Toolbar() {
  const activeTool = useStore(s => s.activeTool)
  const setActiveTool = useStore(s => s.setActiveTool)
  const undo = useStore(s => s.undo)
  const redo = useStore(s => s.redo)
  const history = useStore(s => s.history)
  const historyIndex = useStore(s => s.historyIndex)

  const handleAction = (id) => {
    if (id === 'undo') undo()
    if (id === 'redo') redo()
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.logo}>
        <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="var(--accent)"/>
          <path d="M7 14l3-4 2 3 2-2 3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className={styles.sep} />

      <div className={styles.tools}>
        {tools.map(t => (
          <button
            key={t.id}
            className={`${styles.toolBtn} ${activeTool === t.id ? styles.active : ''}`}
            onClick={() => setActiveTool(t.id)}
            title={t.label}
          >
            {t.icon}
            <span className={styles.tooltip}>{t.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.spacer} />

      <div className={styles.actions}>
        {actionBtns.map(a => (
          <button
            key={a.id}
            className={styles.actionBtn}
            onClick={() => handleAction(a.id)}
            title={a.label}
            disabled={
              (a.id === 'undo' && historyIndex <= 0) ||
              (a.id === 'redo' && historyIndex >= history.length - 1)
            }
          >
            {a.icon}
            <span className={styles.tooltip}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
