import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useStore } from '../store/useStore'
import {
  drawLine, drawDot, drawShape, floodFill, applyStamp, buildShapePath, BRUSH_PX
} from '../utils/drawing'
import styles from './CanvasArea.module.css'

function drawStampPreview(ctx, x, y, template, color) {
  const size = 24
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.translate(x, y)
  if (template === 'star') {
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i / 10) - Math.PI / 2
      const r = i % 2 === 0 ? size : size * 0.4
      const px = r * Math.cos(angle), py = r * Math.sin(angle)
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.closePath(); ctx.stroke()
  } else if (template === 'heart') {
    const s = size
    ctx.beginPath()
    ctx.moveTo(0, s * 0.3)
    ctx.bezierCurveTo(-s*.1,-s*.2,-s,-s*.2,-s,s*.2)
    ctx.bezierCurveTo(-s,s*.7,0,s,0,s)
    ctx.bezierCurveTo(0,s,s,s*.7,s,s*.2)
    ctx.bezierCurveTo(s,-s*.2,s*.1,-s*.2,0,s*.3)
    ctx.stroke()
  } else if (template === 'arrow') {
    const s = size
    ctx.beginPath()
    ctx.moveTo(-s,-s*.3);ctx.lineTo(s*.2,-s*.3);ctx.lineTo(s*.2,-s*.6)
    ctx.lineTo(s,0);ctx.lineTo(s*.2,s*.6);ctx.lineTo(s*.2,s*.3);ctx.lineTo(-s,s*.3)
    ctx.closePath(); ctx.stroke()
  } else if (template === 'checkmark') {
    const s = size
    ctx.beginPath()
    ctx.moveTo(-s*.8,0);ctx.lineTo(-s*.2,s*.6);ctx.lineTo(s*.8,-s*.6)
    ctx.lineCap = 'round'; ctx.lineWidth = s * 0.3; ctx.stroke()
  }
  ctx.restore()
}

function ShapeLayerCanvas({ layer }) {
  const canvasRef = useRef()
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = layer.width
    canvas.height = layer.height
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, layer.width, layer.height)
    if (!layer.shapeData) return
    const { shapeData } = layer
    drawShape(ctx, shapeData, 0, 0, layer.width, layer.height,
      shapeData.brushColor, shapeData.fillColor,
      shapeData.filled, shapeData.brushSize, false)
  }, [layer])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        left: layer.x, top: layer.y,
        width: layer.width, height: layer.height,
        pointerEvents: 'none',
      }}
    />
  )
}

export default function CanvasArea() {
  const store = useStore()
  const {
    layers, activeLayerId, canvasWidth, canvasHeight, bgColor,
    activeTool, brushSize, brushColor, fillColor,
    shapeType, shapeFilled, polygonSides, starPoints, starR1, starR2,
    stampTemplate, customStampImage,
    setLayerCanvas, addShapeLayer, updateLayerBounds, updateCanvasSize,
    pushHistory,
  } = store

  const containerRef = useRef()
  const overlayRef = useRef()
  const canvasRefs = useRef({})
  const ds = useRef({
    isDrawing: false, lastX: 0, lastY: 0,
    shapeStartX: 0, shapeStartY: 0,
    dragStartX: 0, dragStartY: 0,
  })

  const storeRef = useRef(store)
  useEffect(() => { storeRef.current = store }, [store])

  // Initialize canvases for drawing layers
  useEffect(() => {
    layers.forEach(layer => {
      if (layer.type === 'drawing' && !layer.canvas) {
        const canvas = document.createElement('canvas')
        canvas.width = layer.width
        canvas.height = layer.height
        setLayerCanvas(layer.id, canvas)
      }
    })
  }, [layers])

  const getCanvasPos = (e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const getActiveLayer = () => {
    const s = storeRef.current
    return s.layers.find(l => l.id === s.activeLayerId)
  }

  const drawHandles = (ctx, layer) => {
  if (!ctx || !layer) return

  const x = Number(layer.x ?? 0)
  const y = Number(layer.y ?? 0)
  const width = Number(layer.width ?? 0)
  const height = Number(layer.height ?? 0)

  if (!Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height)) {
    console.error('Invalid layer:', layer)
    return
  }

  ctx.save()

  ctx.strokeStyle = 'rgba(212,80,10,0.7)'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 4])
  ctx.strokeRect(x + 0.5, y + 0.5, width, height)

  ctx.setLineDash([])

  ;[
    [x, y],
    [x + width, y],
    [x, y + height],
    [x + width, y + height],
  ].forEach(([cx, cy]) => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(cx - 6, cy - 6, 12, 12)

    ctx.strokeStyle = '#D4500A'
    ctx.lineWidth = 1.5
    ctx.strokeRect(cx - 6, cy - 6, 12, 12)
  })

  ctx.restore()
}

  const renderOverlay = useCallback((mx, my, shiftHeld) => {
    const canvas = overlayRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Shape preview
    const s = storeRef.current
    if (s.activeTool === 'shape' && ds.current.isDrawing && mx !== undefined) {
      const w = mx - ds.current.shapeStartX, h = my - ds.current.shapeStartY
      ctx.save()
      drawShape(ctx,
        { type: s.shapeType, polygonSides: s.polygonSides, starPoints: s.starPoints, starR1: s.starR1, starR2: s.starR2 },
        ds.current.shapeStartX, ds.current.shapeStartY, w, h,
        s.brushColor, s.fillColor, s.shapeFilled, s.brushSize, shiftHeld)
      ctx.restore()
    }

    // Stamp preview
    if (s.activeTool === 'stamp' && mx !== undefined && !ds.current.isDrawing) {
      drawStampPreview(ctx, mx, my, s.stampTemplate, s.brushColor)
    }

    // Active layer handles
    const al = s.layers.find(l => l.id === s.activeLayerId)
    if (al && al.id !== 'background') drawHandles(ctx, al)
  }, [])

  useEffect(() => { renderOverlay() }, [activeLayerId, layers])

  const onMouseDown = (e) => {
    if (e.button !== 0) return
    const { x, y } = getCanvasPos(e)
    ds.current.isDrawing = true
    ds.current.lastX = x; ds.current.lastY = y
    ds.current.shapeStartX = x; ds.current.shapeStartY = y
    ds.current.dragStartX = x; ds.current.dragStartY = y

    const al = getActiveLayer()
    if (!al) return
    const s = storeRef.current

    if (s.activeTool === 'brush' && al.type === 'drawing' && al.canvas) {
      const ctx = al.canvas.getContext('2d')
      drawDot(ctx, x - al.x, y - al.y, s.brushColor, s.brushSize)
    }
    if (s.activeTool === 'fill' && al.type === 'drawing' && al.canvas) {
      floodFill(al.canvas, x - al.x, y - al.y, s.fillColor)
      pushHistory()
      ds.current.isDrawing = false
    }
    if (s.activeTool === 'stamp' && al.type === 'drawing' && al.canvas) {
      applyStamp(al.canvas, x - al.x, y - al.y, s.stampTemplate, s.customStampImage, s.brushColor)
    }
    renderOverlay(x, y, e.shiftKey)
  }

  const onMouseMove = (e) => {
    const { x, y } = getCanvasPos(e)
    const al = getActiveLayer()
    const s = storeRef.current

    if (ds.current.isDrawing) {
      if (s.activeTool === 'brush' && al?.type === 'drawing' && al?.canvas) {
        if (e.ctrlKey) {
          // Move layer
          const dx = x - ds.current.dragStartX, dy = y - ds.current.dragStartY
          updateLayerBounds(al.id, al.x + dx, al.y + dy, al.width, al.height)
          ds.current.dragStartX = x; ds.current.dragStartY = y
        } else {
          const ctx = al.canvas.getContext('2d')
          let tx = x - al.x, ty = y - al.y
          let fx = ds.current.lastX - al.x, fy = ds.current.lastY - al.y
          if (e.shiftKey) {
            const dx = Math.abs(x - ds.current.shapeStartX), dy = Math.abs(y - ds.current.shapeStartY)
            if (dx > dy) ty = ds.current.shapeStartY - al.y
            else tx = ds.current.shapeStartX - al.x
          }
          drawLine(ctx, fx, fy, tx, ty, s.brushColor, s.brushSize)
          ds.current.lastX = x; ds.current.lastY = y
        }
      }
      if (s.activeTool === 'stamp' && al?.type === 'drawing' && al?.canvas) {
        applyStamp(al.canvas, x - al.x, y - al.y, s.stampTemplate, s.customStampImage, s.brushColor)
      }
    }

    renderOverlay(x, y, e.shiftKey)
  }

  const onMouseUp = (e) => {
    const { x, y } = getCanvasPos(e)
    if (!ds.current.isDrawing) return
    ds.current.isDrawing = false

    const al = getActiveLayer()
    const s = storeRef.current

    if (s.activeTool === 'shape' && al) {
      const w = x - ds.current.shapeStartX, h = y - ds.current.shapeStartY
      if (Math.abs(w) >= 4 || Math.abs(h) >= 4) {
        const shapeData = {
          type: s.shapeType, polygonSides: s.polygonSides,
          starPoints: s.starPoints, starR1: s.starR1, starR2: s.starR2,
          filled: s.shapeFilled, brushColor: s.brushColor,
          fillColor: s.fillColor, brushSize: s.brushSize,
        }
        const minX = Math.min(ds.current.shapeStartX, x)
        const minY = Math.min(ds.current.shapeStartY, y)
        const maxX = Math.max(ds.current.shapeStartX, x)
        const maxY = Math.max(ds.current.shapeStartY, y)
        addShapeLayer(minX, minY, maxX - minX, maxY - minY, shapeData)
      }
    }
    if (s.activeTool === 'brush') pushHistory()
    if (s.activeTool === 'stamp') pushHistory()

    renderOverlay(x, y, e.shiftKey)
  }

  // Render drawing layers to their DOM canvases
  useEffect(() => {
    let raf
    const loop = () => {
      const s = storeRef.current
      s.layers.forEach(layer => {
        if (layer.type === 'drawing' && layer.canvas) {
          const domCanvas = canvasRefs.current[layer.id]
          if (!domCanvas) return
          if (domCanvas.width !== layer.canvas.width) domCanvas.width = layer.canvas.width
          if (domCanvas.height !== layer.canvas.height) domCanvas.height = layer.canvas.height
          const ctx = domCanvas.getContext('2d')
          ctx.clearRect(0, 0, domCanvas.width, domCanvas.height)
          ctx.drawImage(layer.canvas, 0, 0)
        }
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Canvas resize
  const resizeRef = useRef({ active: false, startX: 0, startY: 0, startW: 0, startH: 0 })

  const onCanvasResizeStart = (e) => {
    e.stopPropagation()
    resizeRef.current = { active: true, startX: e.clientX, startY: e.clientY, startW: canvasWidth, startH: canvasHeight }
    const move = (e2) => {
      if (!resizeRef.current.active) return
      const dx = e2.clientX - resizeRef.current.startX
      const dy = e2.clientY - resizeRef.current.startY
      updateCanvasSize(Math.max(200, resizeRef.current.startW + dx), Math.max(150, resizeRef.current.startH + dy))
    }
    const up = () => {
      resizeRef.current.active = false
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        className={styles.canvasContainer}
        style={{ width: canvasWidth, height: canvasHeight, background: bgColor }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { ds.current.isDrawing = false; renderOverlay() }}
      >
        {[...layers].reverse().map(layer => {
          if (layer.id === 'background') return null
          if (layer.type === 'drawing') {
            return (
              <canvas
                key={layer.id}
                ref={el => { if (el) canvasRefs.current[layer.id] = el }}
                style={{
                  position: 'absolute',
                  left: layer.x, top: layer.y,
                  width: layer.width, height: layer.height,
                  pointerEvents: 'none',
                }}
              />
            )
          }
          if (layer.type === 'shape') {
            return <ShapeLayerCanvas key={layer.id} layer={layer} />
          }
          return null
        })}

        <canvas
          ref={overlayRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />

        <div className={styles.resizeHandle} onMouseDown={onCanvasResizeStart} title="Resize canvas" />
      </div>
    </div>
  )
}
