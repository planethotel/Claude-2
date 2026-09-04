/* =========================================================================
   shoe.js — Soulier construit entièrement par le code.
   Aucun modèle 3D téléchargé : la forme (le « last » du cordonnier),
   la semelle, le talon empilé, le laçage et les cuirs sont générés
   mathématiquement, puis texturés sur des canvas peints à la volée.
   ========================================================================= */
import * as THREE from 'three';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (t) => t * t * (3 - 2 * t);

/* ---- petite interpolation type Catmull-Rom sur une courbe 1D ---- */
function courbe(pts) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return function (t) {
    t = clamp(t, xs[0], xs[xs.length - 1]);
    let i = 0;
    while (i < xs.length - 2 && t > xs[i + 1]) i++;
    const s = (t - xs[i]) / (xs[i + 1] - xs[i]);
    const y0 = ys[i], y1 = ys[i + 1];
    const m0 = (y1 - ys[Math.max(0, i - 1)]) * 0.5;
    const m1 = (ys[Math.min(ys.length - 1, i + 2)] - y0) * 0.5;
    const s2 = s * s, s3 = s2 * s;
    return (2*s3 - 3*s2 + 1) * y0 + (s3 - 2*s2 + s) * m0
         + (-2*s3 + 3*s2) * y1 + (s3 - s2) * m1;
  };
}

/* =========================================================================
   1. LA FORME  (t = 0 talon  →  t = 1 bout)
   ========================================================================= */
const LONGUEUR = 2.75;                       // le soulier fait 2.75 unités
const demiLargeur = courbe([
  [0, 0.022], [0.02, 0.190], [0.06, 0.330], [0.12, 0.386], [0.22, 0.366],
  [0.38, 0.336], [0.55, 0.386], [0.70, 0.442], [0.80, 0.428], [0.90, 0.352],
  [0.955, 0.238], [0.99, 0.098], [1, 0.014]
]);
const hautY = courbe([
  [0, 0.700], [0.03, 0.760], [0.09, 0.712], [0.16, 0.606], [0.28, 0.522],
  [0.42, 0.470], [0.58, 0.436], [0.72, 0.400], [0.86, 0.346], [0.95, 0.292],
  [0.99, 0.252], [1, 0.238]
]);
const basY = courbe([
  [0, 0.104], [0.20, 0.092], [0.55, 0.086], [0.80, 0.088],
  [0.90, 0.100], [0.96, 0.136], [1, 0.196]
]);
/* demi-angle de l'ouverture (col + claque). 0 = section fermée */
const ouverture = courbe([
  [0, 0.00], [0.025, 0.42], [0.08, 0.96], [0.18, 1.16], [0.32, 1.14],
  [0.44, 0.92], [0.53, 0.46], [0.60, 0.00], [1, 0.00]
]);
const T_FERME = 0.60;

/* densité de sections : plus fine au talon et au bout */
const repartition = (u) => u + 0.12 * Math.sin(2 * Math.PI * u) / (2 * Math.PI) * -1
                             + 0.10 * (u - u * u) * (0.5 - u) * 2;

function section(t, theta, inset = 0) {
  const w  = Math.max(0.004, demiLargeur(t) - inset * 0.55);
  const yb = basY(t) + inset * 0.35;
  const yt = hautY(t) - inset * 0.9;
  const c = Math.cos(theta), s = Math.sin(theta);
  const z = w * Math.sign(c) * Math.pow(Math.abs(c), 0.80);
  const y = s >= 0
    ? yb + (yt - yb) * Math.pow(s, 0.60)
    : yb - 0.045 * Math.pow(-s, 2.6);
  return [t * LONGUEUR - LONGUEUR * 0.5, y, z];
}

/* ---- surface de la tige, ouverture comprise ---- */
function geometrieTige({ S = 150, R = 76, inset = 0 } = {}) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= S; i++) {
    const t = clamp(repartition(i / S), 0, 1);
    const a = ouverture(t);
    const d = Math.PI - a;                       // demi-parcours utile
    for (let j = 0; j <= R; j++) {
      const u = j / R;
      const theta = 1.5 * Math.PI + (u - 0.5) * 2 * d;
      const p = section(t, theta, inset);
      pos.push(p[0], p[1], p[2]);
      uv.push(u, t);
    }
  }
  for (let i = 0; i < S; i++) {
    for (let j = 0; j < R; j++) {
      const a = i * (R + 1) + j, b = a + R + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setIndex(idx);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/* ---- contour du pied, pour la semelle et le talon ---- */
function contour(t0, t1, marge, n = 90) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = lerp(t0, t1, i / n);
    pts.push(new THREE.Vector2(t * LONGUEUR - LONGUEUR * 0.5, demiLargeur(t) + marge));
  }
  for (let i = n; i >= 0; i--) {
    const t = lerp(t0, t1, i / n);
    pts.push(new THREE.Vector2(t * LONGUEUR - LONGUEUR * 0.5, -(demiLargeur(t) + marge)));
  }
  return pts;
}

function galette(t0, t1, marge, epaisseur, biseau) {
  const shape = new THREE.Shape(contour(t0, t1, marge));
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: epaisseur, bevelEnabled: true, bevelThickness: biseau,
    bevelSize: biseau, bevelSegments: 3, curveSegments: 6
  });
  g.rotateX(Math.PI / 2);                        // à plat dans le plan XZ
  return g;
}

/* =========================================================================
   2. LES CUIRS — textures peintes sur canvas
   ========================================================================= */
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, x: c.getContext('2d') };
}
function bruit(x, w, h, n, alpha, taille, teinte) {
  for (let i = 0; i < n; i++) {
    const px = Math.random() * w, py = Math.random() * h;
    const r = taille * (0.4 + Math.random());
    x.globalAlpha = alpha * (0.35 + Math.random() * 0.65);
    x.fillStyle = teinte;
    x.beginPath();
    x.ellipse(px, py, r, r * (0.5 + Math.random()), Math.random() * 3.14, 0, 6.3);
    x.fill();
  }
  x.globalAlpha = 1;
}
/* v = position le long du soulier (0 talon → 1 bout) */
const V = (h, v) => v * h;

function couture(x, w, h, v, teinte, largeur, pointille = true) {
  x.save();
  x.strokeStyle = teinte;
  x.lineWidth = largeur;
  x.lineCap = 'round';
  if (pointille) x.setLineDash([largeur * 2.1, largeur * 2.3]);
  x.beginPath();
  x.moveTo(0, V(h, v));
  x.lineTo(w, V(h, v));
  x.stroke();
  x.restore();
}

function perforations(x, w, h, v, nb, r, teinte) {
  x.fillStyle = teinte;
  for (let i = 0; i < nb; i++) {
    const px = (i + 0.5) / nb * w;
    x.beginPath();
    x.arc(px, V(h, v), r, 0, 6.3);
    x.fill();
  }
}

/* --- carte de couleur du cuir : patine, bout et talon assombris --- */
export function textureCuir({ base = '#7a4520', sombre = '#2f1a0d', clair = '#a9713a',
                              use = false } = {}) {
  const W = 1600, H = 900;
  const { c, x } = canvas(W, H);

  x.fillStyle = base; x.fillRect(0, 0, W, H);

  /* patine longitudinale : sombre au talon (bas) et au bout (haut) */
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0.00, sombre);
  g.addColorStop(0.14, base);
  g.addColorStop(0.42, clair);
  g.addColorStop(0.62, base);
  g.addColorStop(0.86, sombre);
  g.addColorStop(1.00, '#1b0f07');
  x.globalAlpha = 0.85; x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalAlpha = 1;

  /* le dessous (u ≈ 0.5) est caché par la semelle : on l'assombrit */
  const gu = x.createLinearGradient(0, 0, W, 0);
  gu.addColorStop(0.00, 'rgba(0,0,0,0.22)');
  gu.addColorStop(0.18, 'rgba(0,0,0,0)');
  gu.addColorStop(0.50, 'rgba(0,0,0,0.74)');
  gu.addColorStop(0.82, 'rgba(0,0,0,0)');
  gu.addColorStop(1.00, 'rgba(0,0,0,0.22)');
  x.fillStyle = gu; x.fillRect(0, 0, W, H);

  /* grain du cuir */
  bruit(x, W, H, 5200, 0.035, 2.6, '#000');
  bruit(x, W, H, 3400, 0.030, 2.2, '#fff');
  bruit(x, W, H, 260, 0.05, 16, '#000');

  /* claque : couture du bout (captoe) + perforations anglaises */
  couture(x, W, H, 0.795, 'rgba(30,16,8,0.75)', 7, false);
  couture(x, W, H, 0.795, 'rgba(232,198,150,0.55)', 3.4);
  perforations(x, W, H, 0.775, 44, 3.6, 'rgba(24,13,6,0.65)');

  /* couture de la claque sur les quartiers */
  couture(x, W, H, 0.585, 'rgba(30,16,8,0.55)', 5.5, false);
  couture(x, W, H, 0.585, 'rgba(226,190,142,0.40)', 2.8);

  /* contrefort du talon */
  couture(x, W, H, 0.145, 'rgba(30,16,8,0.55)', 5.5, false);
  couture(x, W, H, 0.145, 'rgba(226,190,142,0.38)', 2.8);
  perforations(x, W, H, 0.128, 34, 2.8, 'rgba(24,13,6,0.45)');

  if (use) {
    /* éraflures, cuir mat et fatigué */
    x.globalAlpha = 0.5; x.fillStyle = '#5b4433'; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
    x.strokeStyle = 'rgba(226,205,180,0.30)';
    for (let i = 0; i < 130; i++) {
      const px = Math.random() * W, py = Math.random() * H;
      const l = 12 + Math.random() * 130, a = (Math.random() - 0.5) * 1.1;
      x.lineWidth = 0.7 + Math.random() * 2.2;
      x.beginPath(); x.moveTo(px, py);
      x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
    }
    /* bout écorché */
    const gs = x.createRadialGradient(W * 0.02, H * 0.93, 10, W * 0.02, H * 0.93, 420);
    gs.addColorStop(0, 'rgba(198,176,150,0.55)'); gs.addColorStop(1, 'rgba(198,176,150,0)');
    x.fillStyle = gs; x.fillRect(0, 0, W, H);
    const gs2 = x.createRadialGradient(W * 0.98, H * 0.93, 10, W * 0.98, H * 0.93, 420);
    gs2.addColorStop(0, 'rgba(198,176,150,0.55)'); gs2.addColorStop(1, 'rgba(198,176,150,0)');
    x.fillStyle = gs2; x.fillRect(0, 0, W, H);
    bruit(x, W, H, 900, 0.05, 6, '#d8c9b4');
  } else {
    /* glaçage : reflet doux sur le bout et le contrefort */
    const gl = x.createLinearGradient(0, H * 0.80, 0, H);
    gl.addColorStop(0, 'rgba(255,236,205,0)');
    gl.addColorStop(1, 'rgba(255,236,205,0.14)');
    x.fillStyle = gl; x.fillRect(0, H * 0.80, W, H * 0.20);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* rugosité : miroir au bout et au talon, mat au milieu.
   Le dessous (u ≈ 0,5), que la semelle cache d'ordinaire, reste franchement
   mat : sans cela il renvoie un large reflet dès qu'on l'aperçoit. */
export function textureRugosite({ use = false } = {}) {
  const W = 512, H = 512;
  const { c, x } = canvas(W, H);
  const g = x.createLinearGradient(0, 0, 0, H);
  if (use) {
    g.addColorStop(0.00, '#c8c8c8'); g.addColorStop(0.5, '#dcdcdc'); g.addColorStop(1, '#c4c4c4');
  } else {
    g.addColorStop(0.00, '#3a3a3a');   // talon glacé
    g.addColorStop(0.22, '#8e8e8e');
    g.addColorStop(0.55, '#a2a2a2');   // corps satiné
    g.addColorStop(0.80, '#5a5a5a');
    g.addColorStop(1.00, '#242424');   // bout glacé miroir
  }
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  const gd = x.createLinearGradient(0, 0, W, 0);
  gd.addColorStop(0.00, 'rgba(255,255,255,0)');
  gd.addColorStop(0.26, 'rgba(255,255,255,0)');
  gd.addColorStop(0.50, 'rgba(255,255,255,0.92)');
  gd.addColorStop(0.74, 'rgba(255,255,255,0)');
  gd.addColorStop(1.00, 'rgba(255,255,255,0)');
  x.fillStyle = gd; x.fillRect(0, 0, W, H);

  bruit(x, W, H, 2600, 0.10, 3, '#fff');
  bruit(x, W, H, 1800, 0.10, 3, '#000');
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

/* relief : grain + coutures en creux */
export function textureRelief({ use = false } = {}) {
  const W = 1024, H = 1024;
  const { c, x } = canvas(W, H);
  x.fillStyle = '#808080'; x.fillRect(0, 0, W, H);
  bruit(x, W, H, 9000, 0.13, 2.4, '#fff');
  bruit(x, W, H, 9000, 0.13, 2.4, '#000');
  couture(x, W, H, 0.795, '#3a3a3a', 5, false);
  couture(x, W, H, 0.795, '#e8e8e8', 2.6);
  couture(x, W, H, 0.585, '#4a4a4a', 4, false);
  couture(x, W, H, 0.145, '#4a4a4a', 4, false);
  perforations(x, W, H, 0.775, 44, 2.6, '#303030');
  if (use) bruit(x, W, H, 1400, 0.16, 5, '#fff');
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

/* semelle cuir : tranche rainurée, fibres visibles */
export function textureSemelle({ use = false } = {}) {
  const W = 700, H = 700;
  const { c, x } = canvas(W, H);
  x.fillStyle = use ? '#4a3a2c' : '#8a6236'; x.fillRect(0, 0, W, H);
  bruit(x, W, H, 5000, 0.06, 3, '#3a2716');
  bruit(x, W, H, 3000, 0.05, 3, '#c99a63');
  x.strokeStyle = 'rgba(52,34,18,0.35)';
  for (let i = 0; i < 90; i++) {
    x.lineWidth = 0.6 + Math.random() * 1.6;
    const y = Math.random() * H;
    x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(W*0.3, y+8, W*0.6, y-8, W, y); x.stroke();
  }
  if (use) { x.globalAlpha = .45; x.fillStyle = '#2b2119'; x.fillRect(0,0,W,H); x.globalAlpha = 1; }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

/* =========================================================================
   3. ŒILLETS ET LACETS
   ========================================================================= */
function pointOeillet(t, cote) {
  const a = ouverture(t);
  const theta = 1.5 * Math.PI + cote * (Math.PI - a - 0.14);
  const p = section(t, theta);
  return new THREE.Vector3(p[0], p[1], p[2]);
}

function laçage(groupe, matLacet, matOeillet) {
  const ts = [0.560, 0.512, 0.464, 0.416, 0.368];
  const G = [], D = [];
  const geoOeillet = new THREE.TorusGeometry(0.026, 0.0075, 8, 20);

  ts.forEach((t) => {
    [-1, 1].forEach((cote) => {
      const p = pointOeillet(t, cote);
      const centre = new THREE.Vector3(p.x, basY(t) + 0.05, 0);
      const n = p.clone().sub(centre).normalize();
      const m = new THREE.Mesh(geoOeillet, matOeillet);
      m.position.copy(p).addScaledVector(n, -0.006);
      m.lookAt(p.clone().add(n));
      m.castShadow = true;
      groupe.add(m);
      (cote < 0 ? G : D).push(p.clone().addScaledVector(n, 0.014));
    });
  });

  const brin = (dep, arr) => {
    const pts = [];
    for (let i = 0; i < dep.length; i++) {
      pts.push(dep[i]);
      if (i < arr.length - 1) {
        const a = dep[i], b = arr[i + 1];
        const mid = a.clone().lerp(b, 0.5);
        mid.y += 0.035; mid.z *= 0.35;
        pts.push(mid);
      }
      if (i + 1 < arr.length) pts.push(arr[i + 1]);
    }
    const courbe3 = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
    return new THREE.Mesh(
      new THREE.TubeGeometry(courbe3, 140, 0.0125, 8, false), matLacet);
  };
  const b1 = brin(G, D), b2 = brin(D, G);
  b1.castShadow = b2.castShadow = true;
  groupe.add(b1, b2);

  /* les deux boucles du nœud + les aiguillettes */
  const haut = G[G.length - 1].clone().lerp(D[D.length - 1], 0.5);
  haut.y += 0.02;
  [-1, 1].forEach((s) => {
    const boucle = new THREE.CatmullRomCurve3([
      haut.clone(),
      haut.clone().add(new THREE.Vector3(-0.055, 0.075, s * 0.10)),
      haut.clone().add(new THREE.Vector3(-0.165, 0.055, s * 0.155)),
      haut.clone().add(new THREE.Vector3(-0.185, -0.015, s * 0.065)),
      haut.clone().add(new THREE.Vector3(-0.055, 0.005, s * 0.02))
    ], false, 'catmullrom', 0.5);
    const mb = new THREE.Mesh(new THREE.TubeGeometry(boucle, 90, 0.0125, 8, false), matLacet);
    mb.castShadow = true;
    groupe.add(mb);

    const tail = new THREE.CatmullRomCurve3([
      haut.clone().add(new THREE.Vector3(-0.02, 0.005, s * 0.02)),
      haut.clone().add(new THREE.Vector3(0.075, -0.035, s * 0.115)),
      haut.clone().add(new THREE.Vector3(0.175, -0.085, s * 0.175))
    ], false, 'catmullrom', 0.5);
    const mt = new THREE.Mesh(new THREE.TubeGeometry(tail, 60, 0.0115, 8, false), matLacet);
    mt.castShadow = true;
    groupe.add(mt);
  });
}

/* =========================================================================
   4. ASSEMBLAGE
   ========================================================================= */
export function construireSoulier({ use = false } = {}) {
  const racine = new THREE.Group();

  const cuirBase = use
    ? { base: '#5e4530', sombre: '#33251a', clair: '#7d604a' }
    : { base: '#77401d', sombre: '#2c180b', clair: '#ab7038' };

  /* --- matières --- */
  /* la même carte pilote la rugosité du cuir ET celle du vernis : sans quoi
     le glaçage renvoie un large reflet blanc jusque sous la chaussure */
  const texRugosite = textureRugosite({ use });
  const matTige = new THREE.MeshPhysicalMaterial({
    map: textureCuir({ ...cuirBase, use }),
    roughnessMap: texRugosite,
    bumpMap: textureRelief({ use }),
    bumpScale: use ? 0.020 : 0.012,
    roughness: 1, metalness: 0,
    clearcoat: use ? 0.06 : 0.62,
    clearcoatRoughnessMap: texRugosite,
    clearcoatRoughness: 1,
    sheen: 0.25, sheenColor: new THREE.Color('#c98f52'),
    side: THREE.FrontSide
  });

  /* l'intérieur reste dans l'ombre : peu de réflexions, cuir mat */
  const matDoublure = new THREE.MeshStandardMaterial({
    color: use ? '#1d1611' : '#241a12', roughness: 1, metalness: 0,
    envMapIntensity: 0.18, side: THREE.BackSide
  });

  const texSemelle = textureSemelle({ use });
  const matSemelle = new THREE.MeshStandardMaterial({
    map: texSemelle, color: use ? '#7d6448' : '#b98a4e',
    roughness: use ? 0.95 : 0.72, metalness: 0
  });
  const matTalon = new THREE.MeshStandardMaterial({
    map: texSemelle, color: use ? '#5d4a36' : '#8d6234',
    roughness: use ? 0.96 : 0.68, metalness: 0
  });
  const matBonbout = new THREE.MeshStandardMaterial({
    color: use ? '#1c1a19' : '#141312', roughness: use ? 0.98 : 0.75, metalness: 0
  });
  const matLacet = new THREE.MeshStandardMaterial({
    color: use ? '#8d8375' : '#d8c19a', roughness: 0.88, metalness: 0
  });
  const matOeillet = new THREE.MeshStandardMaterial({
    color: use ? '#6d6152' : '#b9945a', roughness: use ? 0.7 : 0.28, metalness: 0.95
  });
  const matBiais = new THREE.MeshPhysicalMaterial({
    color: use ? '#3d2c1e' : '#5a3116', roughness: 0.55, metalness: 0,
    clearcoat: 0.4, clearcoatRoughness: 0.35
  });

  /* --- la tige et sa doublure --- */
  const tige = new THREE.Mesh(geometrieTige({}), matTige);
  tige.castShadow = tige.receiveShadow = true;
  const doublure = new THREE.Mesh(geometrieTige({ S: 90, R: 46, inset: 0.030 }), matDoublure);
  const hautDeForme = new THREE.Group();
  hautDeForme.add(tige, doublure);

  /* biais du col : on suit l'arête de l'ouverture */
  const bord = [];
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * T_FERME;
    const a = ouverture(t);
    const p = section(t, 1.5 * Math.PI + (Math.PI - a));
    bord.push(new THREE.Vector3(p[0], p[1], p[2]));
  }
  for (let i = 60; i >= 0; i--) {
    const t = (i / 60) * T_FERME;
    const a = ouverture(t);
    const p = section(t, 1.5 * Math.PI - (Math.PI - a));
    bord.push(new THREE.Vector3(p[0], p[1], p[2]));
  }
  const biais = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bord, true, 'catmullrom', 0.5),
      420, 0.0145, 8, true), matBiais);
  biais.castShadow = true;
  hautDeForme.add(biais);

  /* première (l'intérieur qu'on aperçoit par l'ouverture) */
  const premiere = new THREE.Mesh(galette(0.02, 0.66, -0.045, 0.012, 0.004),
    new THREE.MeshStandardMaterial({ color: '#2b2016', roughness: 1, envMapIntensity: 0.22 }));
  premiere.position.y = 0.098;
  hautDeForme.add(premiere);

  laçage(hautDeForme, matLacet, matOeillet);
  racine.add(hautDeForme);

  /* --- semelle : galette extrudée, cintrée pour épouser la forme --- */
  const gSemelle = galette(0.0, 1.0, 0.034, 0.052, 0.012);
  const posS = gSemelle.attributes.position;
  for (let i = 0; i < posS.count; i++) {
    const t = clamp((posS.getX(i) + LONGUEUR * 0.5) / LONGUEUR, 0, 1);
    posS.setY(i, posS.getY(i) + basY(t) - 0.030);
  }
  gSemelle.computeVertexNormals();
  const semelle = new THREE.Mesh(gSemelle, matSemelle);
  semelle.castShadow = semelle.receiveShadow = true;

  /* trépointe : le liseré cousu qui déborde */
  const gTrepointe = galette(0.0, 1.0, 0.050, 0.020, 0.008);
  const posT = gTrepointe.attributes.position;
  for (let i = 0; i < posT.count; i++) {
    const t = clamp((posT.getX(i) + LONGUEUR * 0.5) / LONGUEUR, 0, 1);
    posT.setY(i, posT.getY(i) + basY(t) - 0.004);
  }
  gTrepointe.computeVertexNormals();
  const trepointe = new THREE.Mesh(gTrepointe, matTalon);
  trepointe.castShadow = true;

  const blocSemelle = new THREE.Group();
  blocSemelle.add(semelle, trepointe);
  racine.add(blocSemelle);

  /* --- talon empilé + bonbout --- */
  const blocTalon = new THREE.Group();
  const couches = 5;
  for (let i = 0; i < couches; i++) {
    const g = galette(0.0, 0.285 - i * 0.004, 0.030 - i * 0.002, 0.030, 0.006);
    const m = new THREE.Mesh(g, matTalon);
    m.position.y = 0.038 - i * 0.032;
    m.castShadow = true;
    blocTalon.add(m);
  }
  const gBonbout = galette(0.0, 0.272, 0.024, 0.026, 0.007);
  const bonbout = new THREE.Mesh(gBonbout, matBonbout);
  bonbout.position.y = 0.038 - couches * 0.032;
  bonbout.castShadow = bonbout.receiveShadow = true;
  blocTalon.add(bonbout);
  racine.add(blocTalon);

  /* le talon usé s'affaisse vers l'extérieur arrière */
  if (use) {
    blocTalon.scale.y = 0.74;
    blocTalon.rotation.z = -0.035;
    blocTalon.position.y = -0.028;
  }

  /* on pose le soulier sur y = 0 */
  const bas = -(0.038 - couches * 0.032) + 0.033;
  racine.position.y = bas;

  racine.userData = { hautDeForme, blocSemelle, blocTalon, tige, matTige, matSemelle };
  return racine;
}

/* =========================================================================
   5. STUDIO — éclairage, environnement, sol
   ========================================================================= */
export function environnementAtelier(renderer) {
  const scn = new THREE.Scene();
  const boite = (c, i, x, y, z, sx, sy, sz) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i) })
    );
    m.position.set(x, y, z);
    scn.add(m);
  };
  scn.add(new THREE.Mesh(new THREE.SphereGeometry(28, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x1c1512, side: THREE.BackSide })));
  boite('#fff1d8', 3.4, -4, 6, 3, 9, 0.3, 9);     // grande boîte à lumière chaude
  boite('#ffd9a0', 1.5, 6, 2.5, -4, 6, 6, 0.3);   // renvoi latéral cuivré
  boite('#cfe4ff', 0.55, -6, 1.5, -5, 0.3, 6, 6); // contre-jour froid
  boite('#ffffff', 0.9, 0, -4, 0, 10, 0.3, 10);   // rebond du plan de travail
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scn, 0.06);
  pmrem.dispose();
  return rt.texture;
}

export function eclairageAtelier(scene) {
  scene.add(new THREE.AmbientLight(0xffe6c4, 0.32));

  const cle = new THREE.DirectionalLight(0xfff0d4, 2.35);
  cle.position.set(2.6, 4.4, 3.1);
  cle.castShadow = true;
  cle.shadow.mapSize.set(1536, 1536);
  cle.shadow.camera.near = 0.5;
  cle.shadow.camera.far = 16;
  const d = 3.2;
  cle.shadow.camera.left = -d; cle.shadow.camera.right = d;
  cle.shadow.camera.top = d;   cle.shadow.camera.bottom = -d;
  cle.shadow.bias = -0.0012;
  cle.shadow.radius = 3;
  scene.add(cle);

  const chaud = new THREE.PointLight(0xff9d4a, 4.2, 12, 2);
  chaud.position.set(-2.4, 1.5, -2.2);
  scene.add(chaud);

  const froid = new THREE.DirectionalLight(0x9fc3ff, 0.55);
  froid.position.set(-3.4, 1.8, -2.6);
  scene.add(froid);

  return { cle, chaud, froid };
}

export function ombreDouce() {
  const { c, x } = canvas(256, 256);
  const g = x.createRadialGradient(128, 128, 4, 128, 128, 126);
  g.addColorStop(0.00, 'rgba(0,0,0,0.62)');
  g.addColorStop(0.35, 'rgba(0,0,0,0.34)');
  g.addColorStop(0.70, 'rgba(0,0,0,0.09)');
  g.addColorStop(1.00, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 2.6),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.002;
  m.renderOrder = -1;
  return m;
}
