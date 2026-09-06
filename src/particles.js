import { createProgram, uniformLocations, mat4, hexToRgb } from './gl.js'
import { SIMPLEX_3D } from './shaders.js'

// A point cloud that morphs between a rippling sheet and a sphere, pushed
// around by the cursor. Same discipline as the mesh renderer: the geometry is
// uploaded once and every frame's motion happens in the vertex shader.

const COLUMNS = 420
const ROWS = 170

const VERTEX = /* glsl */ `#version 300 es
precision highp float;

in vec2 aCell;    // 0..1 grid coordinate
in float aSeed;   // per-point jitter

uniform mat4 uProjection;
uniform mat4 uView;
uniform float uTime;
uniform float uMorph;       // 0 sheet, 1 sphere
uniform float uAmplitude;
uniform float uSpread;
uniform vec3 uMouse;        // world-space cursor, z = strength
uniform float uPointScale;

out float vGlow;
out float vDepth;

${SIMPLEX_3D}

void main() {
  vec2 centered = aCell - 0.5;

  // Sheet: a wide swell, tilted away from the camera so it recedes to a
  // horizon instead of facing us flat. Two octaves — long rollers plus chop.
  vec2 ground = centered * uSpread;
  float swell = snoise(vec3(ground * 0.085, uTime * 0.18));
  float chop = snoise(vec3(ground * 0.26, uTime * 0.4)) * 0.35;
  float wave = swell + chop;

  float tilt = 1.15;
  vec3 sheet = vec3(
    ground.x,
    ground.y * cos(tilt) - wave * uAmplitude * sin(tilt) - 4.0,
    ground.y * sin(tilt) + wave * uAmplitude * cos(tilt)
  );

  // Sphere: the same grid wrapped, so points keep their neighbours and the
  // morph reads as folding rather than teleporting.
  float theta = aCell.x * 6.2831853;
  float phi = aCell.y * 3.1415926;
  float radius = uSpread * 0.3 * (1.0 + wave * 0.1);
  vec3 sphere = radius * vec3(sin(phi) * sin(theta), cos(phi), sin(phi) * cos(theta));

  vec3 position = mix(sheet, sphere, uMorph);
  position += aSeed * 0.06;

  // Cursor repulsion, falling off smoothly so the crowd parts instead of
  // snapping.
  vec2 toMouse = position.xy - uMouse.xy;
  float distance = length(toMouse);
  float push = uMouse.z * exp(-distance * distance * 0.5);
  position.xy += normalize(toMouse + 1e-5) * push;

  vec4 viewPosition = uView * vec4(position, 1.0);
  gl_Position = uProjection * viewPosition;

  vDepth = -viewPosition.z;
  vGlow = clamp(wave * 0.45 + 0.5 + push * 0.5, 0.0, 1.0);
  gl_PointSize = uPointScale / max(vDepth, 0.1);
}
`

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in float vGlow;
in float vDepth;

uniform vec3 uColorLow;
uniform vec3 uColorHigh;
uniform float uOpacity;

out vec4 outColor;

void main() {
  // Round, soft-edged points; additive blending turns overlaps into glow.
  float d = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.0, d);
  if (alpha <= 0.001) discard;

  vec3 color = mix(uColorLow, uColorHigh, vGlow);
  float fade = clamp(1.25 - vDepth * 0.012, 0.3, 1.0);
  outColor = vec4(color * fade, alpha * uOpacity * fade * 0.6);
}
`

export class ParticleField {
  constructor(canvas, options = {}) {
    this.canvas = canvas
    this.options = {
      colorLow: '#1f5fd0',
      colorHigh: '#d6f7ff',
      amplitude: 3.2,
      spread: 34,
      morph: 0,
      opacity: 1,
      distance: 21,
      ...options,
    }

    const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: false })
    if (!gl) throw new Error('WebGL2 is not available in this browser.')
    this.gl = gl

    this.program = createProgram(gl, VERTEX, FRAGMENT)
    this.uniforms = uniformLocations(gl, this.program)
    this.count = COLUMNS * ROWS

    const cells = new Float32Array(this.count * 2)
    const seeds = new Float32Array(this.count)
    let o = 0
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLUMNS; x++) {
        cells[o * 2] = x / (COLUMNS - 1)
        cells[o * 2 + 1] = y / (ROWS - 1)
        seeds[o] = Math.random() * 2 - 1
        o++
      }
    }

    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)
    this.buffers = [
      this.attribute('aCell', cells, 2),
      this.attribute('aSeed', seeds, 1),
    ]
    gl.bindVertexArray(null)

    this.projection = mat4.identity()
    this.view = mat4.identity()
    this.mouse = [0, 0, 0]
    this.time = 0
    this.running = false

    this.resize()
  }

  attribute(name, data, size) {
    const gl = this.gl
    const buffer = gl.createBuffer()
    const location = gl.getAttribLocation(this.program, name)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
    return buffer
  }

  set(options) {
    Object.assign(this.options, options)
  }

  // Cursor position in normalised device coordinates, converted to the world
  // plane the points live on.
  pointer(ndcX, ndcY, strength) {
    const height = 2 * Math.tan(0.5 * 0.7) * this.options.distance
    const width = height * (this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight))
    this.mouse = [ndcX * width * 0.5, ndcY * height * 0.5, strength]
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr))
    const height = Math.max(1, Math.round(this.canvas.clientHeight * dpr))
    if (this.canvas.width === width && this.canvas.height === height) return
    this.canvas.width = width
    this.canvas.height = height
  }

  start() {
    if (this.running) return
    this.running = true
    let last = performance.now()
    const frame = (now) => {
      if (!this.running) return
      this.time += Math.min((now - last) / 1000, 0.1)
      last = now
      this.render()
      this.handle = requestAnimationFrame(frame)
    }
    this.handle = requestAnimationFrame(frame)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.handle)
  }

  render() {
    const gl = this.gl
    const u = this.uniforms
    const o = this.options
    const aspect = this.canvas.width / Math.max(1, this.canvas.height)

    mat4.perspective(this.projection, 0.7, aspect, 0.1, 200)
    mat4.lookAt(this.view, [0, 0, o.distance], [0, 0, 0], [0, 1, 0])

    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

    gl.useProgram(this.program)
    gl.uniformMatrix4fv(u.uProjection, false, this.projection)
    gl.uniformMatrix4fv(u.uView, false, this.view)
    gl.uniform1f(u.uTime, this.time)
    gl.uniform1f(u.uMorph, o.morph)
    gl.uniform1f(u.uAmplitude, o.amplitude)
    gl.uniform1f(u.uSpread, o.spread)
    gl.uniform1f(u.uOpacity, o.opacity)
    gl.uniform1f(u.uPointScale, 62 * Math.min(window.devicePixelRatio || 1, 1.75))
    gl.uniform3fv(u.uMouse, this.mouse)
    gl.uniform3fv(u.uColorLow, hexToRgb(o.colorLow))
    gl.uniform3fv(u.uColorHigh, hexToRgb(o.colorHigh))

    gl.bindVertexArray(this.vao)
    gl.drawArrays(gl.POINTS, 0, this.count)
    gl.bindVertexArray(null)
  }

  dispose() {
    this.stop()
    const gl = this.gl
    for (const buffer of this.buffers) gl.deleteBuffer(buffer)
    gl.deleteVertexArray(this.vao)
    gl.useProgram(null)
    gl.deleteProgram(this.program)
  }
}
