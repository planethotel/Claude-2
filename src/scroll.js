import { ShaderGradient } from './gradient.js'
import { DEFAULTS } from './params.js'
import { mixHex } from './gl.js'

// The scroll rig owns every parameter named in these keyframes for the whole
// page: nothing else writes them, so there is no second animator to fight.
const KEYFRAMES = [
  {
    type: 'waterPlane', uSpeed: 0.4, uStrength: 0.55, uDensity: 0.9,
    uFrequency: 2, uAmplitude: 0.3, wireframe: false,
    color1: '#ff5005', color2: '#ffcfa0', color3: '#9d7cf0', bgColor: '#0b0b0f',
    rotationX: -45, cAzimuthAngle: 180, cPolarAngle: 105, cDistance: 7.5,
    lightType: '3d', envPreset: 'city', brightness: 1.05, reflection: 0.2,
    metalness: 0, roughness: 0.12, grain: 'on', grainBlending: 0.07,
  },
  {
    type: 'plane', uSpeed: 0.3, uStrength: 0.75, uDensity: 1.6,
    uFrequency: 2, uAmplitude: 0.3, wireframe: false,
    color1: '#00d2ff', color2: '#0b5d9e', color3: '#e8fbff', bgColor: '#03131f',
    rotationX: -55, cAzimuthAngle: 205, cPolarAngle: 82, cDistance: 9,
    lightType: 'env', envPreset: 'dawn', brightness: 1.25, reflection: 0.35,
    metalness: 0, roughness: 0.12, grain: 'on', grainBlending: 0.07,
  },
  {
    type: 'sphere', uSpeed: 0.35, uStrength: 0.35, uDensity: 1.4,
    uFrequency: 2, uAmplitude: 0.3, wireframe: false,
    color1: '#ffd9c0', color2: '#cfd6ff', color3: '#ffffff', bgColor: '#08060f',
    rotationX: 0, cAzimuthAngle: 250, cPolarAngle: 95, cDistance: 6.5,
    lightType: '3d', envPreset: 'city', brightness: 1.15, reflection: 0.4,
    metalness: 1, roughness: 0.06, grain: 'on', grainBlending: 0.07,
  },
  {
    type: 'plane', uSpeed: 0.5, uStrength: 0.6, uDensity: 1.1,
    uFrequency: 2, uAmplitude: 0.3, wireframe: true,
    color1: '#00ffa3', color2: '#0066ff', color3: '#ff00c8', bgColor: '#05060a',
    rotationX: -62, cAzimuthAngle: 300, cPolarAngle: 96, cDistance: 11,
    lightType: '3d', envPreset: 'city', brightness: 1.6, reflection: 0.2,
    metalness: 0, roughness: 0.12, grain: 'off', grainBlending: 0.07,
  },
]

const NUMERIC = Object.keys(KEYFRAMES[0]).filter((key) => typeof KEYFRAMES[0][key] === 'number')
const COLORS = Object.keys(KEYFRAMES[0]).filter((key) => /^(color|bg)/.test(key))
const DISCRETE = Object.keys(KEYFRAMES[0]).filter((key) => !NUMERIC.includes(key) && !COLORS.includes(key))

// How fast the eased value chases the scroll position, per second. Frame-rate
// independent, so a 144Hz display and a 30fps one settle at the same speed.
const DAMPING = 6

const canvas = document.querySelector('#stage')
const progressBar = document.querySelector('#progress span')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

let gradient
try {
  gradient = new ShaderGradient(canvas, { ...DEFAULTS, ...KEYFRAMES[0] })
} catch (error) {
  const fallback = document.querySelector('#fallback')
  fallback.hidden = false
  fallback.querySelector('p').textContent = error.message
  throw error
}

if (reducedMotion) gradient.setParams({ animate: 'off' })

const listeners = new AbortController()
const { signal } = listeners

let target = scrollProgress()
let eased = target

function scrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight
  return scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
}

const smoothstep = (t) => t * t * (3 - 2 * t)

// Blend the keyframe pair surrounding the eased progress. Continuous values
// interpolate; discrete ones (mesh type, light rig, grain) step at the midpoint
// between two keyframes, since there is no halfway sphere-and-plane.
function paramsAt(progress) {
  const position = progress * (KEYFRAMES.length - 1)
  const index = Math.min(KEYFRAMES.length - 2, Math.floor(position))
  const t = smoothstep(position - index)
  const from = KEYFRAMES[index]
  const to = KEYFRAMES[index + 1]

  const params = {}
  for (const key of NUMERIC) params[key] = from[key] + (to[key] - from[key]) * t
  for (const key of COLORS) params[key] = mixHex(from[key], to[key], t)
  for (const key of DISCRETE) params[key] = KEYFRAMES[Math.round(position)][key]
  return params
}

// The renderer drives the clock; the rig only decides what to draw.
gradient.onFrame = (delta) => {
  const follow = reducedMotion ? 1 : 1 - Math.exp(-DAMPING * delta)
  eased += (target - eased) * follow
  if (Math.abs(target - eased) < 0.0002) eased = target
  gradient.setParams(paramsAt(eased))
  progressBar.style.transform = `scaleX(${eased})`
}

window.addEventListener('scroll', () => { target = scrollProgress() }, { passive: true, signal })
window.addEventListener('resize', () => {
  gradient.resize()
  target = scrollProgress()
}, { signal })

document.addEventListener('visibilitychange', () => {
  if (document.hidden) gradient.stop()
  else gradient.start()
}, { signal })

// Cleanup, the counterpart to setup: drop the listeners, release the GL objects.
window.addEventListener('pagehide', () => {
  listeners.abort()
  gradient.dispose()
}, { signal })

gradient.resize()
gradient.start()
