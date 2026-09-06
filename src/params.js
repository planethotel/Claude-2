// Parameter schema. Names follow @shadergradient/react so URLs and settings read
// the same way, but the value ranges are tuned for this renderer's own scale.

export const SCHEMA = [
  { key: 'type', label: 'Mesh', group: 'Mesh', kind: 'select', options: ['plane', 'sphere', 'waterPlane'] },
  { key: 'animate', label: 'Animate', group: 'Mesh', kind: 'select', options: ['on', 'off'] },
  { key: 'uSpeed', label: 'Speed', group: 'Mesh', kind: 'range', min: 0, max: 2, step: 0.01 },
  { key: 'uStrength', label: 'Strength', group: 'Mesh', kind: 'range', min: 0, max: 2, step: 0.01 },
  { key: 'uDensity', label: 'Density', group: 'Mesh', kind: 'range', min: 0.05, max: 4, step: 0.01 },
  { key: 'uFrequency', label: 'Frequency', group: 'Mesh', kind: 'range', min: 0, max: 8, step: 0.01, only: 'waterPlane' },
  { key: 'uAmplitude', label: 'Amplitude', group: 'Mesh', kind: 'range', min: 0, max: 2, step: 0.01, only: 'waterPlane' },
  { key: 'wireframe', label: 'Wireframe', group: 'Mesh', kind: 'toggle' },

  { key: 'color1', label: 'Color 1', group: 'Colors', kind: 'color' },
  { key: 'color2', label: 'Color 2', group: 'Colors', kind: 'color' },
  { key: 'color3', label: 'Color 3', group: 'Colors', kind: 'color' },
  { key: 'bgColor', label: 'Background', group: 'Colors', kind: 'color' },

  { key: 'positionX', label: 'Position X', group: 'Transform', kind: 'range', min: -6, max: 6, step: 0.05 },
  { key: 'positionY', label: 'Position Y', group: 'Transform', kind: 'range', min: -6, max: 6, step: 0.05 },
  { key: 'positionZ', label: 'Position Z', group: 'Transform', kind: 'range', min: -6, max: 6, step: 0.05 },
  { key: 'rotationX', label: 'Rotation X', group: 'Transform', kind: 'range', min: -180, max: 180, step: 1 },
  { key: 'rotationY', label: 'Rotation Y', group: 'Transform', kind: 'range', min: -180, max: 180, step: 1 },
  { key: 'rotationZ', label: 'Rotation Z', group: 'Transform', kind: 'range', min: -180, max: 180, step: 1 },

  { key: 'cAzimuthAngle', label: 'Azimuth', group: 'Camera', kind: 'range', min: 0, max: 360, step: 1 },
  { key: 'cPolarAngle', label: 'Polar', group: 'Camera', kind: 'range', min: 1, max: 179, step: 1 },
  { key: 'cDistance', label: 'Distance', group: 'Camera', kind: 'range', min: 1, max: 20, step: 0.1 },
  { key: 'cameraZoom', label: 'Zoom', group: 'Camera', kind: 'range', min: 0.4, max: 3, step: 0.01 },

  { key: 'lightType', label: 'Light', group: 'Light', kind: 'select', options: ['3d', 'env'] },
  { key: 'envPreset', label: 'Env preset', group: 'Light', kind: 'select', options: ['city', 'dawn', 'lobby'], only: 'env' },
  { key: 'brightness', label: 'Brightness', group: 'Light', kind: 'range', min: 0, max: 3, step: 0.01 },
  { key: 'reflection', label: 'Reflection', group: 'Light', kind: 'range', min: 0, max: 1, step: 0.01 },

  { key: 'grain', label: 'Grain', group: 'Light', kind: 'select', options: ['on', 'off'] },
  { key: 'grainBlending', label: 'Grain amount', group: 'Light', kind: 'range', min: 0, max: 0.6, step: 0.005, only: 'grain' },
]

export const DEFAULTS = {
  type: 'waterPlane',
  animate: 'on',
  uSpeed: 0.4,
  uStrength: 0.55,
  uDensity: 0.9,
  uFrequency: 2.0,
  uAmplitude: 0.3,
  wireframe: false,

  color1: '#ff5005',
  color2: '#ffcfa0',
  color3: '#9d7cf0',
  bgColor: '#0b0b0f',

  positionX: 0,
  positionY: 0,
  positionZ: 0,
  rotationX: -45,
  rotationY: 0,
  rotationZ: 0,

  cAzimuthAngle: 180,
  cPolarAngle: 105,
  cDistance: 7.5,
  cameraZoom: 1,

  lightType: '3d',
  envPreset: 'city',
  brightness: 1.05,
  reflection: 0.2,

  grain: 'on',
  grainBlending: 0.07,
}

export const ENV_PRESETS = {
  city: { sky: '#b9c6d8', ground: '#3d4048' },
  dawn: { sky: '#ffd2a8', ground: '#3a3350' },
  lobby: { sky: '#fff1dc', ground: '#6d5a48' },
}

export const PRESETS = {
  Halo: {},
  Lagoon: {
    type: 'plane', color1: '#00d2ff', color2: '#0b5d9e', color3: '#e8fbff',
    uSpeed: 0.3, uStrength: 0.75, uDensity: 1.6, rotationX: -40, cPolarAngle: 78,
    lightType: 'env', envPreset: 'dawn', brightness: 1.25, reflection: 0.35, bgColor: '#03131f',
  },
  Orbit: {
    type: 'sphere', color1: '#e879f9', color2: '#4338ca', color3: '#22d3ee',
    uSpeed: 0.35, uStrength: 0.35, uDensity: 1.4, rotationX: 0, cDistance: 6.5,
    cPolarAngle: 95, brightness: 1.3, reflection: 0.4, bgColor: '#08060f',
  },
  Dune: {
    type: 'waterPlane', color1: '#f6d365', color2: '#fda085', color3: '#7b3f00',
    uSpeed: 0.22, uStrength: 0.5, uDensity: 0.9, uFrequency: 1.6, uAmplitude: 0.45,
    rotationX: -62, cPolarAngle: 82, cDistance: 5.0, brightness: 1.1,
    lightType: 'env', envPreset: 'lobby', grainBlending: 0.2, bgColor: '#120a06',
  },
  Mesh: {
    type: 'plane', wireframe: true, color1: '#00ffa3', color2: '#0066ff', color3: '#ff00c8',
    uSpeed: 0.5, uStrength: 0.6, uDensity: 1.1, rotationX: -62, cPolarAngle: 96,
    cDistance: 11, brightness: 1.6, grain: 'off', bgColor: '#05060a',
  },
}

// Query strings round-trip through the same schema the UI is built from.
export function paramsFromQuery(search, base = DEFAULTS) {
  const query = new URLSearchParams(search)
  const params = { ...base }
  for (const item of SCHEMA) {
    if (!query.has(item.key)) continue
    const raw = query.get(item.key)
    if (item.kind === 'range') {
      const value = Number(raw)
      if (Number.isFinite(value)) params[item.key] = clamp(value, item.min, item.max)
    } else if (item.kind === 'toggle') {
      params[item.key] = raw === 'true' || raw === 'on' || raw === '1'
    } else if (item.kind === 'select') {
      if (item.options.includes(raw)) params[item.key] = raw
    } else if (item.kind === 'color') {
      if (/^#[0-9a-f]{6}$/i.test(raw)) params[item.key] = raw
    }
  }
  return params
}

// Only non-default values are emitted, so shared URLs stay short.
export function paramsToQuery(params) {
  const query = new URLSearchParams()
  for (const item of SCHEMA) {
    const value = params[item.key]
    if (value === DEFAULTS[item.key]) continue
    query.set(item.key, item.kind === 'range' ? String(round(value)) : String(value))
  }
  return query.toString()
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const round = (value) => Math.round(value * 1000) / 1000
