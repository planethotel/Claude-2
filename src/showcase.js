import { ShaderGradient } from './gradient.js'
import { ParticleField } from './particles.js'
import { DEFAULTS } from './params.js'
import { mixHex } from './gl.js'

// LUMEN — the two renderers share one page. Scroll position picks the scene,
// each scene owns the parameters it names, and nothing animates a value that
// another scene is also writing.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const listeners = new AbortController()
const { signal } = listeners

const meshCanvas = document.querySelector('#mesh')
const fieldCanvas = document.querySelector('#field')

// Palettes lifted from the paintings on the mood board: warm cloister shadow,
// sunlit sailcloth, renaissance sky.
const SCENES = {
  chrome: {
    mesh: {
      type: 'sphere', color1: '#ffd9c0', color2: '#cfd6ff', color3: '#ffffff',
      uSpeed: 0.22, uStrength: 0.3, uDensity: 1.15, rotationX: 0,
      cAzimuthAngle: 165, cPolarAngle: 92, cDistance: 6.6,
      positionX: 2.1, positionY: 0.35,
      metalness: 1, roughness: 0.06, brightness: 1.1, grain: 'off',
      bgColor: '#08070a',
    },
    field: 0,
  },
  'chrome-close': {
    mesh: {
      type: 'waterPlane', color1: '#ffe9d2', color2: '#d7e3ff', color3: '#ffffff',
      uSpeed: 0.3, uStrength: 0.45, uDensity: 0.8, uFrequency: 1.8, uAmplitude: 0.3,
      rotationX: -20, cAzimuthAngle: 180, cPolarAngle: 118, cDistance: 6.2,
      metalness: 1, roughness: 0.14, brightness: 1.15, grain: 'off',
      bgColor: '#05060a',
    },
    field: 0,
  },
  cloister: {
    mesh: {
      type: 'waterPlane', color1: '#221a12', color2: '#c9a36a', color3: '#e8e2d0',
      uSpeed: 0.2, uStrength: 0.62, uDensity: 0.5, uFrequency: 1.1, uAmplitude: 0.35,
      rotationX: -44, cAzimuthAngle: 186, cPolarAngle: 100, cDistance: 10.5,
      metalness: 0.15, roughness: 0.45, brightness: 1.15, grain: 'on', grainBlending: 0.06,
      lightType: 'env', envPreset: 'lobby', bgColor: '#0a0806',
    },
    field: 0,
  },
  sail: {
    mesh: {
      type: 'plane', color1: '#f4f1e6', color2: '#8fb0c9', color3: '#6c8f4a',
      uSpeed: 0.26, uStrength: 0.7, uDensity: 0.55, rotationX: -34,
      cAzimuthAngle: 205, cPolarAngle: 92, cDistance: 11,
      metalness: 0.1, roughness: 0.5, brightness: 1.3, grain: 'on', grainBlending: 0.05,
      lightType: 'env', envPreset: 'dawn', bgColor: '#0b0d10',
    },
    field: 0,
  },
  empyrean: {
    mesh: {
      type: 'sphere', color1: '#2f6fa8', color2: '#d1495b', color3: '#f2d3b0',
      uSpeed: 0.24, uStrength: 0.4, uDensity: 0.8, rotationX: 0,
      cAzimuthAngle: 240, cPolarAngle: 94, cDistance: 7.4,
      metalness: 0.2, roughness: 0.35, brightness: 1.2, grain: 'on', grainBlending: 0.05,
      lightType: '3d', bgColor: '#07080e',
    },
    field: 0,
  },
  field: { mesh: null, field: 1 },
}

let gradient
let particles
try {
  gradient = new ShaderGradient(meshCanvas, { ...DEFAULTS, ...SCENES.chrome.mesh })
  particles = new ParticleField(fieldCanvas)
} catch (error) {
  const fallback = document.querySelector('#fallback')
  fallback.hidden = false
  fallback.querySelector('p').textContent = error.message
  throw error
}

// Debugging handle, same as the sandbox page.
window.__lumen = { gradient, particles }

/* ---- scene sequencing ---------------------------------------------------- */

// Sections declare their scene; palette cards override it as they pass the
// middle of the viewport, so the mesh re-lights while the copy explains why.
const scenes = [...document.querySelectorAll('[data-scene]')]
const palettes = [...document.querySelectorAll('[data-palette]')]

let current = null
let target = { ...SCENES.chrome.mesh }
let blend = { ...SCENES.chrome.mesh }
const NUMERIC = Object.keys(SCENES.chrome.mesh).filter((k) => typeof SCENES.chrome.mesh[k] === 'number')

function activeScene() {
  const middle = window.innerHeight * 0.5

  for (const card of palettes) {
    const box = card.getBoundingClientRect()
    if (box.top < middle && box.bottom > middle * 0.4) return card.dataset.palette
  }
  for (const section of scenes) {
    const box = section.getBoundingClientRect()
    if (box.top <= middle && box.bottom >= middle) return section.dataset.scene
  }
  return scenes[0].dataset.scene
}

function selectScene(name) {
  if (name === current) return
  current = name
  const scene = SCENES[name] || SCENES.chrome

  fieldCanvas.style.opacity = String(scene.field)
  meshCanvas.style.opacity = String(1 - scene.field)

  if (scene.field) {
    particles.start()
    gradient.stop()
  } else {
    particles.stop()
    gradient.start()
    target = { ...DEFAULTS, ...scene.mesh }
  }
}

// Numeric parameters ease toward the active scene; strings and toggles switch
// outright, since there is no halfway between a sphere and a plane.
function easeScene(delta) {
  const follow = reduceMotion ? 1 : 1 - Math.exp(-2.6 * delta)
  const next = {}
  for (const [key, value] of Object.entries(target)) {
    if (NUMERIC.includes(key) && typeof blend[key] === 'number') {
      next[key] = blend[key] + (value - blend[key]) * follow
    } else if (/^(color|bg)/.test(key) && typeof blend[key] === 'string') {
      next[key] = mixHex(blend[key], value, follow)
    } else {
      next[key] = value
    }
  }
  blend = next
  gradient.setParams(blend)
}

gradient.onFrame = easeScene

/* ---- particle field: morph on scroll, part under the cursor -------------- */

const fieldSection = document.querySelector('#mouvement')
let pointerStrength = 0

const smoothstep = (t) => t * t * (3 - 2 * t)

function updateField() {
  const box = fieldSection.getBoundingClientRect()
  const span = box.height + window.innerHeight
  const progress = Math.min(1, Math.max(0, (window.innerHeight - box.top) / span))
  particles.set({ morph: smoothstep(progress), amplitude: 1.4 + progress * 1.6 })
}

/* ---- entrances ----------------------------------------------------------- */

for (const heading of document.querySelectorAll('.split')) {
  const words = heading.textContent.trim().split(/\s+/)
  heading.textContent = ''
  let index = 0
  words.forEach((word, w) => {
    const line = document.createElement('span')
    line.className = 'line'
    for (const character of word) {
      const span = document.createElement('span')
      span.className = 'char'
      span.style.setProperty('--i', index++)
      span.textContent = character
      line.append(span)
    }
    heading.append(line)
    if (w < words.length - 1) heading.append(' ')
  })
}

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue
    entry.target.classList.add('in')
    observer.unobserve(entry.target)
  }
}, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' })

for (const group of document.querySelectorAll('section, .marquee')) {
  const items = group.querySelectorAll('.reveal')
  items.forEach((item, i) => item.style.setProperty('--i', i))
}
for (const element of document.querySelectorAll('.reveal, .split')) observer.observe(element)

// Counters tick up the first time their card appears.
const counters = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue
    const element = entry.target
    counters.unobserve(element)
    const final = Number(element.dataset.count)
    if (!final || reduceMotion) continue
    const started = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - started) / 1200)
      const value = Math.round(final * (1 - Math.pow(1 - t, 3)))
      element.textContent = value.toLocaleString('fr-FR')
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
}, { threshold: 0.6 })
for (const counter of document.querySelectorAll('[data-count]')) counters.observe(counter)

/* ---- cursor -------------------------------------------------------------- */

const cursor = document.querySelector('#cursor')
const pointerFine = window.matchMedia('(pointer: fine)').matches
if (pointerFine) document.body.classList.add('pointer-fine')

let cursorTarget = { x: innerWidth / 2, y: innerHeight / 2 }
let cursorAt = { ...cursorTarget }

// Buttons lean toward the cursor when it comes close.
const magnets = [...document.querySelectorAll('.magnetic')]
function magnetise(element, event) {
  const box = element.getBoundingClientRect()
  const dx = event.clientX - (box.left + box.width / 2)
  const dy = event.clientY - (box.top + box.height / 2)
  const distance = Math.hypot(dx, dy)
  const radius = 130
  if (distance > radius || reduceMotion) {
    element.style.transform = ''
    return
  }
  const pull = (1 - distance / radius) * 0.32
  element.style.transform = `translate(${dx * pull}px, ${dy * pull}px)`
}

window.addEventListener('pointermove', (event) => {
  cursorTarget = { x: event.clientX, y: event.clientY }
  pointerStrength = 1.6
  particles.pointer(
    (event.clientX / window.innerWidth) * 2 - 1,
    -((event.clientY / window.innerHeight) * 2 - 1),
    pointerStrength,
  )
  for (const element of magnets) magnetise(element, event)
}, { passive: true, signal })

/* ---- loop ---------------------------------------------------------------- */

let last = performance.now()
function frame(now) {
  const delta = Math.min((now - last) / 1000, 0.1)
  last = now

  cursorAt.x += (cursorTarget.x - cursorAt.x) * (reduceMotion ? 1 : 0.12)
  cursorAt.y += (cursorTarget.y - cursorAt.y) * (reduceMotion ? 1 : 0.12)
  cursor.style.transform = `translate(${cursorAt.x}px, ${cursorAt.y}px)`

  pointerStrength *= 0.94
  particles.mouse[2] = pointerStrength

  selectScene(activeScene())
  updateField()
  if (!gradient.running) easeScene(delta)   // keep easing while the field is up

  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

window.addEventListener('resize', () => {
  gradient.resize()
  particles.resize()
}, { signal })

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    gradient.stop()
    particles.stop()
  } else {
    current = null   // re-pick the scene, which restarts the right renderer
  }
}, { signal })

window.addEventListener('pagehide', () => {
  listeners.abort()
  gradient.dispose()
  particles.dispose()
}, { signal })

selectScene(activeScene())
gradient.resize()
particles.resize()
gradient.start()
