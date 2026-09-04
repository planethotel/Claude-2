/* =========================================================================
   compare.js — « Avant / Après » en volume.
   Le même soulier, dans la même pose, rendu deux fois : à gauche tel qu'il
   arrive à l'atelier, à droite tel qu'il en repart. Une seule image, coupée
   en deux par le curseur que l'on fait glisser.
   ========================================================================= */
import * as THREE from 'three';
import {
  construireSoulier, environnementAtelier, eclairageAtelier, ombreDouce
} from './shoe.js';

export function lancerComparateur({ canvas, conteneur, poignee, fraction = 0.5 }) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClear = false;

  const env = environnementAtelier(renderer);

  function scene(use) {
    const s = new THREE.Scene();
    s.environment = env;
    eclairageAtelier(s);
    const g = new THREE.Group();
    g.add(construireSoulier({ use }));
    g.add(ombreDouce());
    s.add(g);
    const sol = new THREE.Mesh(new THREE.PlaneGeometry(20, 20),
      new THREE.ShadowMaterial({ opacity: 0.3 }));
    sol.rotation.x = -Math.PI / 2;
    sol.receiveShadow = true;
    s.add(sol);
    return { s, g };
  }

  const avant = scene(true);
  const apres = scene(false);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  let l = 1, h = 1;
  function redimensionner() {
    const r = conteneur.getBoundingClientRect();
    l = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    renderer.setSize(l, h, false);
    camera.aspect = l / h;
    camera.fov = l < 700 ? 40 : 30;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', redimensionner);
  /* le cadre peut changer de taille sans que la fenêtre bouge
     (rotation, barre d'adresse mobile, chargement des polices) */
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(redimensionner).observe(conteneur);
  }
  redimensionner();

  /* ---------------- le curseur ---------------- */
  let f = fraction, fCible = fraction;
  const majPoignee = () => {
    poignee.style.left = (fCible * 100).toFixed(2) + '%';
    conteneur.style.setProperty('--split', (fCible * 100).toFixed(2) + '%');
  };
  majPoignee();

  let attrape = false;
  const depuisEvenement = (e) => {
    const r = conteneur.getBoundingClientRect();
    fCible = THREE.MathUtils.clamp((e.clientX - r.left) / r.width, 0.04, 0.96);
    majPoignee();
  };
  conteneur.addEventListener('pointerdown', (e) => {
    attrape = true;
    conteneur.setPointerCapture(e.pointerId);
    depuisEvenement(e);
  });
  conteneur.addEventListener('pointermove', (e) => { if (attrape) depuisEvenement(e); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) =>
    conteneur.addEventListener(n, () => { attrape = false; }));
  poignee.addEventListener('keydown', (e) => {
    const pas = e.shiftKey ? 0.10 : 0.03;
    if (e.key === 'ArrowLeft')  { fCible = Math.max(0.04, fCible - pas); majPoignee(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { fCible = Math.min(0.96, fCible + pas); majPoignee(); e.preventDefault(); }
  });

  /* ---------------- boucle ---------------- */
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 })
    .observe(conteneur);

  const horloge = new THREE.Clock();
  function boucle() {
    requestAnimationFrame(boucle);
    if (!visible) return;
    const t = horloge.getElapsedTime();
    f += (fCible - f) * 0.18;

    const rot = -0.75 + Math.sin(t * 0.22) * 0.32;
    avant.g.rotation.y = apres.g.rotation.y = rot;
    avant.g.rotation.x = apres.g.rotation.x = -0.06;

    /* on recule assez pour que le soulier entier tienne dans le cadre */
    const d = l < 700 ? 5.9 : 5.45;
    const az = 0.46;
    camera.position.set(Math.sin(az) * d, 1.72, Math.cos(az) * d);
    camera.lookAt(0, 0.40, 0);

    const px = renderer.getPixelRatio();
    const coupe = Math.round(l * f * px);
    const L = Math.round(l * px), H = Math.round(h * px);

    renderer.setScissorTest(true);
    renderer.setViewport(0, 0, l, h);

    renderer.setScissor(0, 0, coupe / px, h);
    renderer.clear(true, true, true);
    renderer.render(avant.s, camera);

    renderer.setScissor(coupe / px, 0, l - coupe / px, h);
    renderer.clear(true, true, true);
    renderer.render(apres.s, camera);

    renderer.setScissorTest(false);
  }
  boucle();

  return { redimensionner };
}
