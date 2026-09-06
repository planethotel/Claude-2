// Minimal WebGL2 + matrix helpers. No dependencies.

export function createProgram(gl, vertSrc, fragSrc) {
  const vs = compile(gl, gl.VERTEX_SHADER, vertSrc)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc)
  const program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Program link failed: ' + gl.getProgramInfoLog(program))
  }
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  return program
}

function compile(gl, type, src) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const kind = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'
    throw new Error(`${kind} shader failed:\n` + gl.getShaderInfoLog(shader))
  }
  return shader
}

// Caches uniform locations so the render loop stays allocation-free.
export function uniformLocations(gl, program) {
  const locations = {}
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < count; i++) {
    const name = gl.getActiveUniform(program, i).name.replace(/\[0\]$/, '')
    locations[name] = gl.getUniformLocation(program, name)
  }
  return locations
}

export const mat4 = {
  identity: () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),

  perspective(out, fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY / 2)
    const nf = 1 / (near - far)
    out.set([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ])
    return out
  },

  lookAt(out, eye, target, up) {
    const z = normalize(sub(eye, target))
    const x = normalize(cross(up, z))
    const y = cross(z, x)
    out.set([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
    ])
    return out
  },

  // Translation * Rz * Ry * Rx, angles in radians.
  compose(out, position, rotation) {
    const [sx, sy, sz] = rotation.map(Math.sin)
    const [cx, cy, cz] = rotation.map(Math.cos)
    out.set([
      cy * cz, cy * sz, -sy, 0,
      sx * sy * cz - cx * sz, sx * sy * sz + cx * cz, sx * cy, 0,
      cx * sy * cz + sx * sz, cx * sy * sz - sx * cz, cx * cy, 0,
      position[0], position[1], position[2], 1,
    ])
    return out
  },

  // Upper-left 3x3 of a rigid transform is already orthonormal, so no inverse needed.
  normalMatrix(out, m) {
    out.set([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]])
    return out
  },
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
function normalize(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

export function hexToRgb(hex) {
  const value = parseInt(hex.replace('#', ''), 16)
  return [(value >> 16 & 255) / 255, (value >> 8 & 255) / 255, (value & 255) / 255]
}
