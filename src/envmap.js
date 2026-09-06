// A procedural studio environment, built on the CPU as a cubemap. Chrome only
// reads as chrome when it has something to reflect, and this project ships no
// image assets — so the studio is generated: sky, floor, horizon line and three
// softboxes, evaluated per direction so the six faces meet without seams.

const FACE_SIZE = 128

const SKY = [0.62, 0.68, 0.78]
const HORIZON = [0.86, 0.88, 0.92]
const GROUND = [0.10, 0.10, 0.12]

const SOFTBOXES = [
  { dir: [0.30, 0.85, 0.35], radius: 0.42, softness: 0.30, color: [1, 0.98, 0.94], power: 1.6 },
  { dir: [-0.70, 0.30, -0.45], radius: 0.34, softness: 0.35, color: [0.72, 0.82, 1], power: 0.9 },
  { dir: [0.75, 0.05, -0.60], radius: 0.16, softness: 0.20, color: [1, 0.86, 0.72], power: 1.1 },
]

// Direction for a point on a cube face, in the order WebGL expects the targets.
const FACE_DIRECTION = [
  (u, v) => [1, -v, -u],
  (u, v) => [-1, -v, u],
  (u, v) => [u, 1, v],
  (u, v) => [u, -1, -v],
  (u, v) => [u, -v, 1],
  (u, v) => [-u, -v, -1],
]

function sample(dir) {
  const [x, y, z] = dir

  // Sky above, floor below, with a bright line where they meet — the detail
  // that makes a curved metal surface read as metal.
  const sky = smoothstep(-0.05, 0.55, y)
  const horizon = Math.exp(-Math.abs(y) * 26) * 0.85
  const color = [0, 0, 0]
  for (let i = 0; i < 3; i++) {
    color[i] = GROUND[i] + (SKY[i] - GROUND[i]) * sky + HORIZON[i] * horizon
  }

  // Floor falls off away from the centre so reflections have somewhere to go.
  if (y < 0) {
    const fade = 1 - Math.min(1, Math.hypot(x, z) * 0.35)
    for (let i = 0; i < 3; i++) color[i] += fade * 0.05
  }

  for (const box of SOFTBOXES) {
    const n = normalize(box.dir)
    const cosine = x * n[0] + y * n[1] + z * n[2]
    const angle = Math.acos(Math.min(1, Math.max(-1, cosine)))
    const intensity = 1 - smoothstep(box.radius, box.radius + box.softness, angle)
    if (intensity <= 0) continue
    for (let i = 0; i < 3; i++) color[i] += box.color[i] * intensity * box.power
  }

  return color
}

function faceData(face) {
  const pixels = new Uint8Array(FACE_SIZE * FACE_SIZE * 3)
  const toDirection = FACE_DIRECTION[face]
  let o = 0
  for (let py = 0; py < FACE_SIZE; py++) {
    const v = ((py + 0.5) / FACE_SIZE) * 2 - 1
    for (let px = 0; px < FACE_SIZE; px++) {
      const u = ((px + 0.5) / FACE_SIZE) * 2 - 1
      const color = sample(normalize(toDirection(u, v)))
      for (let i = 0; i < 3; i++) pixels[o++] = Math.round(Math.min(1, color[i]) * 255)
    }
  }
  return pixels
}

// Uploads the six faces and their mip chain. Blurrier mips stand in for a
// rougher surface: the shader picks a level from the roughness parameter.
export function createEnvironmentMap(gl) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)

  for (let face = 0; face < 6; face++) {
    gl.texImage2D(
      gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.RGB8,
      FACE_SIZE, FACE_SIZE, 0, gl.RGB, gl.UNSIGNED_BYTE, faceData(face),
    )
  }

  gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)

  return { texture, maxLod: Math.log2(FACE_SIZE) }
}

const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function normalize(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / length, v[1] / length, v[2] / length]
}
