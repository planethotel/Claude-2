import { ShaderGradient } from './gradient.js'
import { DEFAULTS, PRESETS, paramsFromQuery } from './params.js'
import { createControls, createPresetButtons, randomParams, shareUrl } from './ui.js'

const canvas = document.querySelector('#stage')
const panel = document.querySelector('#panel')
const status = document.querySelector('#status')

// One mutable params object is shared by the renderer, the controls and the URL.
const params = paramsFromQuery(window.location.search)
let gradient

try {
  gradient = new ShaderGradient(canvas, params)
} catch (error) {
  const fallback = document.querySelector('#fallback')
  fallback.hidden = false
  fallback.querySelector('p').textContent = error.message
  panel.hidden = true
  throw error
}

const controls = createControls({
  root: document.querySelector('#controls'),
  params,
  onChange: commit,
})

createPresetButtons({
  root: document.querySelector('#presets'),
  onPick: (name) => {
    applyParams({ ...DEFAULTS, ...PRESETS[name] })
    flash(name)
  },
})

function applyParams(next) {
  Object.assign(params, next)
  commit()
  controls.sync()
}

function commit() {
  gradient.setParams(params)
  scheduleUrlWrite()
}

let urlTimer
function scheduleUrlWrite() {
  clearTimeout(urlTimer)
  urlTimer = setTimeout(() => {
    window.history.replaceState(null, '', shareUrl(params))
  }, 250)
}

function flash(message) {
  status.textContent = message
  status.classList.add('visible')
  clearTimeout(flash.timer)
  flash.timer = setTimeout(() => status.classList.remove('visible'), 1600)
}

document.querySelector('#randomize').addEventListener('click', () => {
  applyParams(randomParams(params))
  flash('Randomized')
})

document.querySelector('#reset').addEventListener('click', () => {
  applyParams({ ...DEFAULTS })
  flash('Reset to defaults')
})

document.querySelector('#share').addEventListener('click', async () => {
  const url = shareUrl(params)
  try {
    await navigator.clipboard.writeText(url)
    flash('Link copied')
  } catch {
    flash('Copy failed — the URL bar holds the same settings')
  }
})

document.querySelector('#snapshot').addEventListener('click', () => {
  gradient.render() // guarantee a fresh frame in the buffer before reading it
  canvas.toBlob((blob) => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `shader-gradient-${Date.now()}.png`
    link.click()
    URL.revokeObjectURL(link.href)
    flash('Saved PNG')
  })
})

const toggleButton = document.querySelector('#toggle-panel')
toggleButton.addEventListener('click', togglePanel)
function togglePanel() {
  const collapsed = panel.classList.toggle('collapsed')
  toggleButton.textContent = collapsed ? 'Show controls' : 'Hide controls'
  toggleButton.setAttribute('aria-expanded', String(!collapsed))
}

window.addEventListener('keydown', (event) => {
  if (event.target.matches('input, select, button')) return
  if (event.key === 'h') togglePanel()
  if (event.key === ' ') {
    event.preventDefault()
    applyParams({ animate: params.animate === 'on' ? 'off' : 'on' })
    flash(params.animate === 'on' ? 'Playing' : 'Paused')
  }
})

// Drag to orbit, wheel to dolly — driving the same camera params as the sliders.
let dragging = null
canvas.addEventListener('pointerdown', (event) => {
  dragging = { x: event.clientX, y: event.clientY }
  canvas.setPointerCapture(event.pointerId)
})
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return
  const dx = event.clientX - dragging.x
  const dy = event.clientY - dragging.y
  dragging = { x: event.clientX, y: event.clientY }
  applyParams({
    cAzimuthAngle: (params.cAzimuthAngle - dx * 0.3 + 360) % 360,
    cPolarAngle: Math.min(179, Math.max(1, params.cPolarAngle - dy * 0.3)),
  })
})
const endDrag = () => { dragging = null }
canvas.addEventListener('pointerup', endDrag)
canvas.addEventListener('pointercancel', endDrag)

canvas.addEventListener('wheel', (event) => {
  event.preventDefault()
  const distance = params.cDistance + event.deltaY * 0.004
  applyParams({ cDistance: Math.min(20, Math.max(1, distance)) })
}, { passive: false })

window.addEventListener('resize', () => gradient.resize())
gradient.resize()
gradient.start()

// Stop burning GPU time on a tab nobody is looking at.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) gradient.stop()
  else gradient.start()
})
