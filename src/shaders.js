// GLSL ES 3.00 sources for the gradient mesh.

// Simplex noise by Ashima Arts / Stefan Gustavson (MIT), the usual webgl-noise port.
const SIMPLEX_3D = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

export const VERTEX_SHADER = /* glsl */ `#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;
in vec3 aTangent;
in vec2 aUv;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;
uniform mat3 uNormalMatrix;

uniform float uTime;
uniform float uSpeed;
uniform float uStrength;
uniform float uDensity;
uniform float uFrequency;
uniform float uAmplitude;
uniform int uType; // 0 plane, 1 sphere, 2 waterPlane

out vec3 vNormal;
out vec3 vWorldPosition;
out vec2 vUv;
out float vMix;

${SIMPLEX_3D}

// Signed displacement along the surface normal, in object space.
float field(vec3 p) {
  float t = uTime * uSpeed;

  if (uType == 1) {
    return snoise(p * uDensity + vec3(0.0, 0.0, t * 0.6)) * uStrength;
  }

  float base = snoise(vec3(p.xy * uDensity, t * 0.5)) * uStrength;

  if (uType == 2) {
    float waves = sin(p.x * uFrequency + t * 1.6) * cos(p.y * uFrequency * 0.8 - t * 1.1);
    base += waves * uAmplitude;
  }

  return base;
}

vec3 displace(vec3 p, vec3 n) { return p + n * field(p); }

void main() {
  vec3 n = normalize(aNormal);
  vec3 tangent = normalize(aTangent - n * dot(n, aTangent));
  vec3 bitangent = cross(n, tangent);

  // Rebuild the normal from three neighbouring samples of the displaced surface.
  const float eps = 0.05;
  vec3 p0 = displace(aPosition, n);
  vec3 pT = displace(aPosition + tangent * eps, n);
  vec3 pB = displace(aPosition + bitangent * eps, n);
  vec3 displacedNormal = normalize(cross(pT - p0, pB - p0));

  // A second, slower noise field drives the colour ramp so it flows
  // independently of the silhouette.
  float t = uTime * uSpeed;
  float blend = clamp(snoise(aPosition * uDensity * 0.55 + vec3(31.4, 7.2, t * 0.35)) * 0.62 + 0.5, 0.0, 1.0);
  // Noise clusters around its midpoint; this curve gives colours 1 and 3 as
  // much of the surface as colour 2 instead of leaving a wash of the middle.
  vMix = smoothstep(0.1, 0.9, blend);

  vec4 world = uModel * vec4(p0, 1.0);
  vWorldPosition = world.xyz;
  vNormal = normalize(uNormalMatrix * displacedNormal);
  vUv = aUv;
  gl_Position = uProjection * uView * world;
}
`

export const FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vWorldPosition;
in vec2 vUv;
in float vMix;

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uCameraPosition;
uniform samplerCube uEnvMap;
uniform float uEnvMaxLod;
uniform float uMetalness;
uniform float uRoughness;
uniform vec3 uEnvSky;
uniform vec3 uEnvGround;
uniform float uBrightness;
uniform float uReflection;
uniform float uGrainBlending;
uniform float uTime;
uniform int uLightType; // 0 three-point, 1 environment
uniform int uGrain;     // 0 off, 1 on
uniform int uWireframe;

out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  // Overlapping smoothsteps keep each colour recognisable instead of spending
  // half the ramp in a muddy 50/50 blend.
  vec3 albedo = mix(
    mix(uColor1, uColor2, smoothstep(0.05, 0.52, vMix)),
    uColor3,
    smoothstep(0.5, 0.96, vMix));

  if (uWireframe == 1) {
    outColor = vec4(albedo * uBrightness, 1.0);
    return;
  }

  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
  if (dot(normal, viewDir) < 0.0) normal = -normal; // keep back faces lit

  vec3 lighting;
  if (uLightType == 1) {
    // Hemisphere approximation of an environment: sky above, bounce below.
    vec3 ambient = mix(uEnvGround, uEnvSky, normal.y * 0.5 + 0.5);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    lighting = ambient * 0.9 + uEnvSky * fresnel * uReflection * 2.0;
  } else {
    vec3 key = normalize(vec3(-0.6, 0.9, 0.8));
    vec3 fill = normalize(vec3(0.9, 0.2, 0.4));
    float diffuse = max(dot(normal, key), 0.0) * 0.85 + max(dot(normal, fill), 0.0) * 0.25;
    vec3 halfway = normalize(key + viewDir);
    float specular = pow(max(dot(normal, halfway), 0.0), 48.0) * uReflection * 2.5;
    lighting = vec3(0.45 + diffuse) + specular;
  }

  vec3 color = albedo * lighting * uBrightness;

  if (uMetalness > 0.0) {
    // Chrome: what you see is the room, tinted by the surface. Roughness picks
    // a blurrier mip of the same environment, and the Fresnel term keeps the
    // grazing angles bright the way real metal does.
    vec3 reflection = reflect(-viewDir, normal);
    vec3 env = textureLod(uEnvMap, reflection, uRoughness * uEnvMaxLod).rgb;
    vec3 tint = mix(vec3(1.0), albedo, 0.75);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0);
    vec3 metal = env * tint * (1.0 + fresnel * 1.5) * uBrightness;
    color = mix(color, metal, uMetalness);
  }

  if (uGrain == 1) {
    float noise = hash(gl_FragCoord.xy + fract(uTime) * 137.0) - 0.5;
    color += noise * uGrainBlending;
  }

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`
