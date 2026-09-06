import { SCHEMA, DEFAULTS, PRESETS, paramsToQuery } from './params.js'

// Rows whose `only` flag is unmet are hidden rather than removed, so control
// positions stay stable while you sweep through mesh types.
function isVisible(item, params) {
  switch (item.only) {
    case undefined: return true
    case 'waterPlane': return params.type === 'waterPlane'
    case 'env': return params.lightType === 'env'
    case 'grain': return params.grain === 'on'
    default: return true
  }
}

export function createControls({ root, params, onChange }) {
  const rows = new Map()
  const groups = new Map()

  for (const item of SCHEMA) {
    if (!groups.has(item.group)) {
      const section = document.createElement('section')
      section.className = 'group'
      section.innerHTML = `<h2>${item.group}</h2>`
      root.append(section)
      groups.set(item.group, section)
    }

    const row = document.createElement('label')
    row.className = 'row'
    const name = document.createElement('span')
    name.className = 'name'
    name.textContent = item.label
    const value = document.createElement('span')
    value.className = 'value'
    const input = buildInput(item)

    row.append(name, value, input)
    groups.get(item.group).append(row)
    rows.set(item.key, { item, input, value, row })

    input.addEventListener('input', () => {
      const next = readInput(item, input)
      params[item.key] = next
      onChange(item.key, next)
      sync()
    })
  }

  function sync() {
    for (const { item, input, value, row } of rows.values()) {
      const current = params[item.key]
      if (item.kind === 'toggle') input.checked = current
      else if (String(input.value) !== String(current)) input.value = current
      value.textContent = item.kind === 'range' ? formatNumber(current) : ''
      row.hidden = !isVisible(item, params)
    }
  }

  sync()
  return { sync }
}

function buildInput(item) {
  if (item.kind === 'select') {
    const select = document.createElement('select')
    for (const option of item.options) {
      const el = document.createElement('option')
      el.value = option
      el.textContent = option
      select.append(el)
    }
    return select
  }
  const input = document.createElement('input')
  if (item.kind === 'range') {
    Object.assign(input, { type: 'range', min: item.min, max: item.max, step: item.step })
  } else if (item.kind === 'color') {
    input.type = 'color'
  } else {
    input.type = 'checkbox'
  }
  return input
}

function readInput(item, input) {
  if (item.kind === 'range') return Number(input.value)
  if (item.kind === 'toggle') return input.checked
  return input.value
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function createPresetButtons({ root, onPick }) {
  for (const name of Object.keys(PRESETS)) {
    const button = document.createElement('button')
    button.className = 'preset'
    button.textContent = name
    button.addEventListener('click', () => onPick(name))
    root.append(button)
  }
}

export function randomParams(params) {
  const pick = (list) => list[Math.floor(Math.random() * list.length)]
  const between = (min, max) => min + Math.random() * (max - min)
  const hue = Math.random() * 360
  return {
    ...params,
    type: pick(['plane', 'sphere', 'waterPlane']),
    color1: hsl(hue, 0.85, 0.55),
    color2: hsl((hue + between(30, 90)) % 360, 0.7, 0.6),
    color3: hsl((hue + between(150, 240)) % 360, 0.75, 0.7),
    uSpeed: between(0.15, 0.8),
    uStrength: between(0.25, 0.9),
    uDensity: between(0.6, 2.2),
    uFrequency: between(0.8, 4),
    uAmplitude: between(0.1, 0.6),
    rotationX: between(-80, 10),
    cPolarAngle: between(55, 120),
    cDistance: between(4.5, 8),
    reflection: between(0, 0.5),
    brightness: between(0.9, 1.5),
  }
}

function hsl(h, s, l) {
  const a = s * Math.min(l, 1 - l)
  const channel = (n) => {
    const k = (n + h / 30) % 12
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(value * 255).toString(16).padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

export function shareUrl(params) {
  const query = paramsToQuery(params)
  const { origin, pathname } = window.location
  return query ? `${origin}${pathname}?${query}` : `${origin}${pathname}`
}

export const defaultsCopy = () => ({ ...DEFAULTS })
