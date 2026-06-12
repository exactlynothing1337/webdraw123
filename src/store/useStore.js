import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

let layerIdCounter = 0
export const newId = () => `layer_${++layerIdCounter}`

const createBackgroundLayer = (w, h, color) => ({
  id: 'background',
  type: 'background',
  name: 'Background',
  x: 0, y: 0,
  width: w, height: h,
  visible: true,
  locked: true,
  bgColor: color,
  canvas: null,
})

const createDrawingLayer = (x, y, w, h, name) => ({
  id: newId(),
  type: 'drawing',
  name: name || 'Drawing Layer',
  x, y, width: w, height: h,
  visible: true,
  locked: false,
  canvas: null,
})

const createShapeLayer = (x, y, w, h, shapeData, name) => ({
  id: newId(),
  type: 'shape',
  name: name || 'Shape Layer',
  x, y, width: w, height: h,
  visible: true,
  locked: false,
  shapeData,
})

export const useStore = create(immer((set, get) => ({
  // Canvas setup
  canvasSetup: true,
  canvasWidth: 800,
  canvasHeight: 600,
  bgColor: '#FFFFFF',

  // Layers: ordered top-to-bottom (index 0 = top)
  layers: [],
  activeLayerId: null,

  // Tools
  activeTool: 'brush',
  brushSize: 2, // 1=small, 2=medium, 3=large
  brushColor: '#1A1916',
  fillColor: '#D4500A',

  // Shape tool options
  shapeType: 'rectangle',
  shapeFilled: true,
  polygonSides: 6,
  starPoints: 5,
  starR1: 60,
  starR2: 30,

  // Stamp tool
  stampTemplate: 'star',
  customStampImage: null,

  // Undo/Redo (max 3)
  history: [],
  historyIndex: -1,

  // Recent colors
  recentColors: ['#1A1916', '#D4500A', '#2563EB', '#16A34A', '#EF4444', '#F59E0B'],

  confirmSetup(width, height, color) {
    const bg = createBackgroundLayer(width, height, color)
    const drawLayer = createDrawingLayer(0, 0, width, height, 'Layer 1')
    set(s => {
      s.canvasSetup = false
      s.canvasWidth = width
      s.canvasHeight = height
      s.bgColor = color
      s.layers = [drawLayer, bg]
      s.activeLayerId = drawLayer.id
    })
  },

  setActiveTool(tool) { set(s => { s.activeTool = tool }) },
  setBrushSize(size) { set(s => { s.brushSize = size }) },
  setBrushColor(color) {
    set(s => {
      s.brushColor = color
      if (!s.recentColors.includes(color)) {
        s.recentColors = [color, ...s.recentColors.slice(0, 5)]
      }
    })
  },
  setFillColor(color) {
    set(s => {
      s.fillColor = color
      if (!s.recentColors.includes(color)) {
        s.recentColors = [color, ...s.recentColors.slice(0, 5)]
      }
    })
  },
  setShapeType(t) { set(s => { s.shapeType = t }) },
  setShapeFilled(v) { set(s => { s.shapeFilled = v }) },
  setPolygonSides(n) { set(s => { s.polygonSides = n }) },
  setStarPoints(n) { set(s => { s.starPoints = n }) },
  setStarR1(n) { set(s => { s.starR1 = n }) },
  setStarR2(n) { set(s => { s.starR2 = n }) },
  setStampTemplate(t) { set(s => { s.stampTemplate = t }) },
  setCustomStampImage(img) { set(s => { s.customStampImage = img }) },

  setActiveLayer(id) { set(s => { s.activeLayerId = id }) },

  addDrawingLayer() {
    const { canvasWidth, canvasHeight } = get()
    const layer = createDrawingLayer(0, 0, canvasWidth, canvasHeight, `Layer ${get().layers.length}`)
    set(s => {
      const bgIdx = s.layers.findIndex(l => l.id === 'background')
      s.layers.splice(bgIdx, 0, layer)
      s.activeLayerId = layer.id
    })
    get().pushHistory()
  },

  addShapeLayer(x, y, w, h, shapeData) {
    const { layers } = get()
    const activeIdx = layers.findIndex(l => l.id === get().activeLayerId)
    const layer = createShapeLayer(x, y, w, h, shapeData, `${shapeData.type} Layer`)
    set(s => {
      s.layers.splice(activeIdx, 0, layer)
      s.activeLayerId = layer.id
    })
    get().pushHistory()
  },

  moveLayerUp(id) {
    set(s => {
      const idx = s.layers.findIndex(l => l.id === id)
      if (idx > 0 && s.layers[idx - 1].id !== 'background') {
        const [removed] = s.layers.splice(idx, 1)
        s.layers.splice(idx - 1, 0, removed)
      }
    })
  },

  moveLayerDown(id) {
    set(s => {
      const idx = s.layers.findIndex(l => l.id === id)
      const next = s.layers[idx + 1]
      if (next && next.id !== 'background') {
        const [removed] = s.layers.splice(idx, 1)
        s.layers.splice(idx + 1, 0, removed)
      }
    })
  },

  deleteLayer(id) {
    if (id === 'background') return
    set(s => {
      const idx = s.layers.findIndex(l => l.id === id)
      s.layers.splice(idx, 1)
      const nonBg = s.layers.filter(l => l.id !== 'background')
      s.activeLayerId = nonBg.length > 0 ? nonBg[0].id : null
    })
    get().pushHistory()
  },

  setLayerCanvas(id, canvas) {
    set(s => {
      const l = s.layers.find(l => l.id === id)
      if (l) l.canvas = canvas
    })
  },

  updateLayerBounds(id, x, y, w, h) {
    const { canvasWidth, canvasHeight } = get()
    set(s => {
      const l = s.layers.find(l => l.id === id)
      if (!l) return
      l.x = Math.max(0, Math.min(x, canvasWidth - 1))
      l.y = Math.max(0, Math.min(y, canvasHeight - 1))
      l.width = Math.max(10, Math.min(w, canvasWidth - l.x))
      l.height = Math.max(10, Math.min(h, canvasHeight - l.y))
    })
  },

  updateCanvasSize(w, h) {
    set(s => {
      s.canvasWidth = w
      s.canvasHeight = h
      const bg = s.layers.find(l => l.id === 'background')
      if (bg) { bg.width = w; bg.height = h }
    })
  },

  // Undo/Redo (snapshot layer positions & shape data — canvas pixels snapshotted separately)
  pushHistory() {
    const { layers, history, historyIndex } = get()
    const snapshot = JSON.stringify(layers.map(l => ({
      id: l.id, type: l.type, name: l.name,
      x: l.x, y: l.y, width: l.width, height: l.height,
      visible: l.visible, shapeData: l.shapeData, bgColor: l.bgColor
    })))
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(snapshot)
    if (newHistory.length > 4) newHistory.shift()
    set(s => {
      s.history = newHistory
      s.historyIndex = newHistory.length - 1
    })
  },

  undo() {
    const { historyIndex } = get()
    if (historyIndex <= 0) return
    set(s => { s.historyIndex -= 1 })
  },

  redo() {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return
    set(s => { s.historyIndex += 1 })
  },
})))
