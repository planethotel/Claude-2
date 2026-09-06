// CPU-side meshes. Each vertex carries a normal and a tangent so the vertex
// shader can rebuild a displaced normal from three surface samples.

export function plane(segments = 200, size = 8) {
  const stride = segments + 1
  const positions = new Float32Array(stride * stride * 3)
  const normals = new Float32Array(stride * stride * 3)
  const tangents = new Float32Array(stride * stride * 3)
  const uvs = new Float32Array(stride * stride * 2)

  for (let y = 0; y <= segments; y++) {
    for (let x = 0; x <= segments; x++) {
      const i = y * stride + x
      const u = x / segments
      const v = y / segments
      positions[i * 3] = (u - 0.5) * size
      positions[i * 3 + 1] = (v - 0.5) * size
      positions[i * 3 + 2] = 0
      normals[i * 3 + 2] = 1
      tangents[i * 3] = 1
      uvs[i * 2] = u
      uvs[i * 2 + 1] = v
    }
  }

  return { positions, normals, tangents, uvs, indices: gridIndices(segments, segments), grid: { cols: segments, rows: segments } }
}

export function sphere(segments = 200, radius = 2) {
  const rings = Math.max(3, Math.round(segments / 2))
  const stride = segments + 1
  const count = stride * (rings + 1)
  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const tangents = new Float32Array(count * 3)
  const uvs = new Float32Array(count * 2)

  for (let ring = 0; ring <= rings; ring++) {
    const v = ring / rings
    const phi = v * Math.PI
    for (let seg = 0; seg <= segments; seg++) {
      const u = seg / segments
      const theta = u * Math.PI * 2
      const i = ring * stride + seg
      const nx = Math.sin(phi) * Math.sin(theta)
      const ny = Math.cos(phi)
      const nz = Math.sin(phi) * Math.cos(theta)
      positions[i * 3] = nx * radius
      positions[i * 3 + 1] = ny * radius
      positions[i * 3 + 2] = nz * radius
      normals[i * 3] = nx
      normals[i * 3 + 1] = ny
      normals[i * 3 + 2] = nz
      // d/dtheta of the surface point, normalised: always perpendicular to the normal.
      tangents[i * 3] = Math.cos(theta)
      tangents[i * 3 + 1] = 0
      tangents[i * 3 + 2] = -Math.sin(theta)
      uvs[i * 2] = u
      uvs[i * 2 + 1] = v
    }
  }

  return { positions, normals, tangents, uvs, indices: gridIndices(segments, rings), grid: { cols: segments, rows: rings } }
}

function gridIndices(cols, rows) {
  const stride = cols + 1
  const indices = new Uint32Array(cols * rows * 6)
  let o = 0
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const a = y * stride + x
      const b = a + 1
      const c = a + stride
      const d = c + 1
      indices[o++] = a; indices[o++] = c; indices[o++] = b
      indices[o++] = b; indices[o++] = c; indices[o++] = d
    }
  }
  return indices
}

// Wireframe drawn as grid lines rather than every triangle edge: at these
// tessellation levels an edge-per-triangle mesh reads as solid fill.
export function gridWireframe(cols, rows, step = 3) {
  const stride = cols + 1
  const lines = []
  for (let y = 0; y <= rows; y += step) {
    for (let x = 0; x < cols; x++) lines.push(y * stride + x, y * stride + x + 1)
  }
  for (let x = 0; x <= cols; x += step) {
    for (let y = 0; y < rows; y++) lines.push(y * stride + x, (y + 1) * stride + x)
  }
  return new Uint32Array(lines)
}
