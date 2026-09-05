/* =========================================================================
   transition.js — le fondu « avant / après ».

   Deux photographies, une seule image à l'écran : la seconde apparaît par
   dissolution, guidée par un bruit procédural, avec un léger déplacement et
   un liseré chaud sur le front — comme un coup de chiffon qui passe.

   Rien n'est simulé : ce sont les photos de l'atelier, et rien d'autre.
   Aucune bibliothèque : une centaine de lignes de WebGL. Si la carte
   graphique fait défaut, on retombe sur un fondu enchaîné classique.
   ========================================================================= */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uA, uB;
uniform vec2  uTailleA, uTailleB, uCadre;
uniform float uProgres;

/* bruit de valeur : la dissolution suit ses veines, comme un grain de cuir */
float alea(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float bruit(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(alea(i), alea(i + vec2(1.0, 0.0)), u.x),
             mix(alea(i + vec2(0.0, 1.0)), alea(i + vec2(1.0, 1.0)), u.x), u.y);
}
float veines(vec2 p){
  return bruit(p * 3.2) * 0.50 + bruit(p * 8.0) * 0.32 + bruit(p * 17.0) * 0.18;
}

/* recadrage « couvrant » : la photo remplit le cadre sans se déformer */
vec2 couvrir(vec2 uv, vec2 image, vec2 cadre){
  float ri = image.x / max(image.y, 1.0);
  float rc = cadre.x / max(cadre.y, 1.0);
  vec2 e = ri > rc ? vec2(rc / ri, 1.0) : vec2(1.0, ri / rc);
  return (uv - 0.5) * e + 0.5;
}

void main(){
  /* le front balaie de gauche à droite ; le bruit lui donne son irrégularité,
     comme le passage d'un chiffon plutôt qu'un rideau mécanique */
  float grain = clamp(veines(vUv * vec2(3.0, 3.0 * uCadre.y / max(uCadre.x, 1.0)) * 2.2), 0.0, 1.0);
  float n = clamp(vUv.x * 0.70 + grain * 0.30, 0.0, 1.0);

  /* le déplacement culmine au milieu de la transition, puis s'efface */
  float elan = sin(clamp(uProgres, 0.0, 1.0) * 3.14159265);
  vec2 pousse = vec2((grain - 0.5) * 0.045 * elan, (grain - 0.5) * 0.016 * elan);

  vec2 uvA = couvrir(vUv, uTailleA, uCadre);
  vec2 uvB = couvrir(vUv, uTailleB, uCadre);
  uvA = (uvA - 0.5) * (1.0 - 0.05 * uProgres) + 0.5 + pousse;
  uvB = (uvB - 0.5) * (1.0 + 0.05 * (1.0 - uProgres)) + 0.5 - pousse;

  vec4 a = texture2D(uA, clamp(uvA, 0.001, 0.999));
  vec4 b = texture2D(uB, clamp(uvB, 0.001, 0.999));

  /* chaque point bascule au moment que son bruit lui assigne */
  float seuil = uProgres * 1.20 - 0.10;
  float m = smoothstep(n - 0.075, n + 0.075, seuil);

  /* liseré chaud sur le front, très discret */
  float front = 1.0 - smoothstep(0.0, 0.055, abs(n - seuil));
  vec3 c = mix(a.rgb, b.rgb, m) + vec3(0.90, 0.66, 0.34) * front * 0.20 * elan;

  gl_FragColor = vec4(c, 1.0);
}`;

function compiler(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) || 'compilation du nuanceur');
  }
  return s;
}

function texture(gl, image) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

const charger = (src) => new Promise((ok, ko) => {
  const i = new Image();
  i.crossOrigin = 'anonymous';
  i.onload = () => ok(i);
  i.onerror = () => ko(new Error('image introuvable : ' + src));
  i.src = src;
});

/* ------------------------------------------------------------------ */
export function creerFondu({ canvas }) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
          || canvas.getContext('experimental-webgl');
  if (!gl) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, compiler(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compiler(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) || 'édition de liens');
  }
  gl.useProgram(prog);

  const tampon = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = (n) => gl.getUniformLocation(prog, n);
  const uA = u('uA'), uB = u('uB'), uTailleA = u('uTailleA'), uTailleB = u('uTailleB'),
        uCadre = u('uCadre'), uProgres = u('uProgres');
  gl.uniform1i(uA, 0);
  gl.uniform1i(uB, 1);

  let texA = null, texB = null, dimA = [1, 1], dimB = [1, 1];
  let l = 1, h = 1, progres = 0, pret = false;

  function dimensionner() {
    const r = canvas.getBoundingClientRect();
    const px = Math.min(devicePixelRatio || 1, 2);
    l = Math.max(1, Math.round(r.width  * px));
    h = Math.max(1, Math.round(r.height * px));
    if (canvas.width !== l || canvas.height !== h) {
      canvas.width = l; canvas.height = h;
    }
    gl.viewport(0, 0, l, h);
    gl.uniform2f(uCadre, l, h);
  }

  function dessiner() {
    if (!pret) return;
    dimensionner();
    gl.uniform1f(uProgres, progres);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texB);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  async function charger2(srcA, srcB) {
    pret = false;
    const [a, b] = await Promise.all([charger(srcA), charger(srcB)]);
    if (texA) gl.deleteTexture(texA);
    if (texB) gl.deleteTexture(texB);
    texA = texture(gl, a); dimA = [a.naturalWidth, a.naturalHeight];
    texB = texture(gl, b); dimB = [b.naturalWidth, b.naturalHeight];
    gl.uniform2f(uTailleA, dimA[0], dimA[1]);
    gl.uniform2f(uTailleB, dimB[0], dimB[1]);
    pret = true;
    dessiner();
  }

  return {
    charger: charger2,
    get pret() { return pret; },
    set progres(p) { progres = Math.min(1, Math.max(0, p)); dessiner(); },
    get progres() { return progres; },
    dessiner,
    dimensionner
  };
}
