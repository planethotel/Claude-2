import { createProgram, uniformLocations, mat4, hexToRgb } from './gl.js'
import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders.js'
import { plane, sphere, gridWireframe } from './geometry.js'
import { DEFAULTS, ENV_PRESETS } from './params.js'

const SEGMENTS = 200
const TYPE_IDS = { plane: 0, sphere: 1, waterPlane: 2 }

export class ShaderGradient {
  constructor(canvas, params = {}) {
    this.canvas = canvas
    this.params = { ...DEFAULTS, ...params }
    this.time = 0
    this.lastFrame = 0
    this.running = false

    const gl = canvas.getContext('webgl2', {
      antialias: true,
      alpha: false,
      // Required so a still can be grabbed with toBlob() outside of a draw call.
      preserveDrawingBuffer: true,
    })
    if (!gl) throw new Error('WebGL2 is not available in this browser.')
    this.gl = gl

    gl.enable(gl.DEPTH_TEST)
    this.program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER)
    this.uniforms = uniformLocations(gl, this.program)

    this.meshes = {
      plane: this.createMesh(plane(SEGMENTS, 14)),
      sphere: this.createMesh(sphere(SEGMENTS, 2.2)),
    }
    this.meshes.waterPlane = this.meshes.plane

    this.projection = mat4.identity()
    this.view = mat4.identity()
    this.model = mat4.identity()
    this.normal = new Float32Array(9)
    this.cameraPosition = [0, 0, 1]

    this.resize()
    this.render()
  }

  createMesh(geometry) {
    const gl = this.gl
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    const attributes = [
      ['aPosition', geometry.positions, 3],
      ['aNormal', geometry.normals, 3],
      ['aTangent', geometry.tangents, 3],
      ['aUv', geometry.uvs, 2],
    ]
    for (const [name, data, size] of attributes) {
      const location = gl.getAttribLocation(this.program, name)
      if (location < 0) continue
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
      gl.enableVertexAttribArray(location)
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
    }

    const triangles = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangles)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW)

    const wireIndices = gridWireframe(geometry.grid.cols, geometry.grid.rows)
    const lines = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lines)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, wireIndices, gl.STATIC_DRAW)

    gl.bindVertexArray(null)
    return { vao, triangles, lines, triangleCount: geometry.indices.length, lineCount: wireIndices.length }
  }

  setParams(params) {
    Object.assign(this.params, params)
    if (!this.running) this.render()
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr))
    const height = Math.max(1, Math.round(this.canvas.clientHeight * dpr))
    if (this.canvas.width === width && this.canvas.height === height) return
    this.canvas.width = width
    this.canvas.height = height
    if (!this.running) this.render()
  }

  start() {
    if (this.running) return
    this.running = true
    this.lastFrame = performance.now()
    const frame = (now) => {
      if (!this.running) return
      const delta = Math.min((now - this.lastFrame) / 1000, 0.1)
      this.lastFrame = now
      if (this.params.animate === 'on') this.time += delta
      this.render()
      this.frameHandle = requestAnimationFrame(frame)
    }
    this.frameHandle = requestAnimationFrame(frame)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.frameHandle)
  }

  updateCamera() {
    const p = this.params
    const azimuth = (p.cAzimuthAngle * Math.PI) / 180
    const polar = (p.cPolarAngle * Math.PI) / 180
    const d = p.cDistance
    this.cameraPosition = [
      d * Math.sin(polar) * Math.sin(azimuth),
      d * Math.cos(polar),
      d * Math.sin(polar) * Math.cos(azimuth),
    ]
    mat4.lookAt(this.view, this.cameraPosition, [0, 0, 0], [0, 1, 0])

    const aspect = this.canvas.width / this.canvas.height
    const fov = (45 * Math.PI) / 180 / p.cameraZoom
    mat4.perspective(this.projection, Math.min(fov, Math.PI * 0.9), aspect, 0.1, 200)
  }

  render() {
    const gl = this.gl
    const p = this.params
    const u = this.uniforms
    const mesh = this.meshes[p.type] || this.meshes.plane

    this.updateCamera()
    mat4.compose(
      this.model,
      [p.positionX, p.positionY, p.positionZ],
      [p.rotationX, p.rotationY, p.rotationZ].map((deg) => (deg * Math.PI) / 180),
    )
    mat4.normalMatrix(this.normal, this.model)

    const bg = hexToRgb(p.bgColor)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(bg[0], bg[1], bg[2], 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(this.program)
    gl.uniformMatrix4fv(u.uProjection, false, this.projection)
    gl.uniformMatrix4fv(u.uView, false, this.view)
    gl.uniformMatrix4fv(u.uModel, false, this.model)
    gl.uniformMatrix3fv(u.uNormalMatrix, false, this.normal)

    gl.uniform1f(u.uTime, this.time)
    gl.uniform1f(u.uSpeed, p.uSpeed)
    gl.uniform1f(u.uStrength, p.uStrength)
    gl.uniform1f(u.uDensity, p.uDensity)
    gl.uniform1f(u.uFrequency, p.uFrequency)
    gl.uniform1f(u.uAmplitude, p.uAmplitude)
    gl.uniform1i(u.uType, TYPE_IDS[p.type] ?? 0)

    gl.uniform3fv(u.uColor1, hexToRgb(p.color1))
    gl.uniform3fv(u.uColor2, hexToRgb(p.color2))
    gl.uniform3fv(u.uColor3, hexToRgb(p.color3))
    gl.uniform3fv(u.uCameraPosition, this.cameraPosition)

    const env = ENV_PRESETS[p.envPreset] || ENV_PRESETS.city
    gl.uniform3fv(u.uEnvSky, hexToRgb(env.sky))
    gl.uniform3fv(u.uEnvGround, hexToRgb(env.ground))
    gl.uniform1f(u.uBrightness, p.brightness)
    gl.uniform1f(u.uReflection, p.reflection)
    gl.uniform1f(u.uGrainBlending, p.grainBlending)
    gl.uniform1i(u.uLightType, p.lightType === 'env' ? 1 : 0)
    gl.uniform1i(u.uGrain, p.grain === 'on' ? 1 : 0)
    gl.uniform1i(u.uWireframe, p.wireframe ? 1 : 0)

    gl.bindVertexArray(mesh.vao)
    if (p.wireframe) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.lines)
      gl.drawElements(gl.LINES, mesh.lineCount, gl.UNSIGNED_INT, 0)
    } else {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.triangles)
      gl.drawElements(gl.TRIANGLES, mesh.triangleCount, gl.UNSIGNED_INT, 0)
    }
    gl.bindVertexArray(null)
  }
}
