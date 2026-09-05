/* =========================================================================
   hero.js — la scène 3D principale.
   Le soulier reste à l'écran pendant les deux premières sections :
   d'abord présenté en vitrine, puis démonté pièce par pièce
   au fil du défilement, avec les annotations de l'atelier.
   ========================================================================= */
import * as THREE from 'three';
import {
  construireSoulier, environnementAtelier, eclairageAtelier,
  ombreDouce, lerp, smoothstep
} from './shoe.js';

export function lancerScene({ canvas, zone, sectionDebut, sectionFin, annotations, onProgress, onReady }) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.environment = environnementAtelier(renderer);
  const lampes = eclairageAtelier(scene);
  scene.add(lampes.cle.target);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const cible = new THREE.Vector3(0, 0.42, 0);

  const socle = new THREE.Group();
  scene.add(socle);

  const soulier = construireSoulier({ use: false });
  socle.add(soulier);
  socle.add(ombreDouce());

  /* le plateau de l'établi : capte l'ombre portée sans se voir */
  const sol = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.ShadowMaterial({ opacity: 0.34 })
  );
  sol.rotation.x = -Math.PI / 2;
  sol.receiveShadow = true;
  scene.add(sol);

  const { hautDeForme, blocSemelle, blocTalon } = soulier.userData;
  const yTige = hautDeForme.position.y;
  const ySemelle = blocSemelle.position.y;
  const yTalon = blocTalon.position.y;

  /* ------------------------------------------------------------------ */
  const souris = { x: 0, y: 0, cx: 0, cy: 0 };
  addEventListener('pointermove', (e) => {
    souris.x = (e.clientX / innerWidth) * 2 - 1;
    souris.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  let l = 0, h = 0;
  function redimensionner() {
    l = innerWidth; h = innerHeight;
    renderer.setSize(l, h, false);
    camera.aspect = l / h;
    /* sur mobile on recule un peu pour que le soulier tienne dans le cadre */
    camera.fov = l < 760 ? 44 : 34;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', redimensionner);
  redimensionner();

  /* ------------------------------------------------------------------ */
  /* Progression du défilement : 0 = vitrine, 1 = vue éclatée annotée     */
  let p = 0, pCible = 0;
  function mesurer() {
    const d = sectionDebut.offsetTop;
    const f = sectionFin.offsetTop + sectionFin.offsetHeight - innerHeight * 1.55;
    pCible = THREE.MathUtils.clamp((scrollY - d) / Math.max(1, f - d), 0, 1);
  }
  addEventListener('scroll', mesurer, { passive: true });
  addEventListener('resize', mesurer);
  mesurer();
  p = pCible;

  /* ------------------------------------------------------------------ */
  const projete = new THREE.Vector3();
  /* Points d'accroche, exprimés dans le repère du soulier lui-même :
     x va du talon vers le bout, y donne la hauteur, z le côté visible ;
     les deux derniers nombres décalent l'étiquette à l'écran. */
  const ancres = {
    tige:      () => [-0.28, hautDeForme.position.y + 0.50, 0.30, 22, -34],
    trepointe: () => [-0.30, blocSemelle.position.y + 0.20, 0.44, 22, -14],
    semelle:   () => [ 0.20, blocSemelle.position.y - 0.02, 0.42, 22,  20],
    talon:     () => [-1.06, blocTalon.position.y   + 0.02, 0.26, 22,  56]
  };

  function placerAnnotations(actif) {
    const etroit = l < 980;
    const largeurEtiq = etroit ? 165 : 235;
    const gaucheMin = etroit ? 8 : l * 0.415;
    const poses = [];

    for (const el of annotations) {
      const cle = el.dataset.anno;
      if (!ancres[cle]) continue;
      const a = ancres[cle]();
      projete.set(a[0], a[1], a[2]);
      soulier.localToWorld(projete);
      projete.project(camera);
      poses.push({
        el,
        devant: projete.z < 1,
        x: THREE.MathUtils.clamp((projete.x * 0.5 + 0.5) * l + a[3],
                                 gaucheMin, l - largeurEtiq - 14),
        y: THREE.MathUtils.clamp((-projete.y * 0.5 + 0.5) * h + (etroit ? 0 : a[4]),
                                 92, h - 108)
      });
    }

    /* Les étiquettes gardent l'ordre du soulier — tige, trépointe, semelle,
       talon — et se poussent vers le bas pour ne jamais se recouvrir. */
    const ECART = etroit ? 44 : 82;
    for (let i = 1; i < poses.length; i++) {
      poses[i].y = Math.max(poses[i].y, poses[i - 1].y + ECART);
    }
    const debord = poses.length ? poses[poses.length - 1].y - (h - 108) : 0;
    if (debord > 0) poses.forEach((p) => { p.y -= debord; });

    for (const p of poses) {
      p.el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      p.el.classList.toggle('is-on', actif && p.devant);
    }
  }

  /* ------------------------------------------------------------------ */
  let visible = true;
  new IntersectionObserver(
    ([e]) => { visible = e.isIntersecting; },
    { threshold: 0 }
  ).observe(zone || canvas);

  let entree = 0;
  const horloge = new THREE.Clock();

  function boucle() {
    requestAnimationFrame(boucle);
    const brut = Math.min(horloge.getDelta(), 0.5);
    const dt = Math.min(brut, 0.05);
    if (!visible) return;

    /* lissage exponentiel : même vitesse quel que soit le nombre d'images/s */
    p += (pCible - p) * (1 - Math.exp(-brut * 7));
    entree = Math.min(1, entree + dt * 0.85);
    const e0 = smoothstep(entree);

    /* deux temps : présentation (0 → 0.42) puis démontage (0.42 → 1) */
    const pa = THREE.MathUtils.clamp(p / 0.42, 0, 1);
    const pb = smoothstep(THREE.MathUtils.clamp((p - 0.42) / 0.58, 0, 1));

    /* rotation : libre au début, verrouillée de trois quarts ensuite */
    const t = horloge.getElapsedTime();
    const libre = -0.62 + Math.sin(t * 0.16) * 0.30 + Math.sin(t * 0.37) * 0.05;
    const fixe = -1.02;
    socle.rotation.y = lerp(libre, fixe, pb);
    socle.rotation.x = lerp(0, -0.06, pb) + souris.cy * 0.045 * (1 - pb);
    socle.rotation.z = souris.cx * 0.025 * (1 - pb);
    /* le soulier se tient à droite ; sur petit écran il passe au-dessus
       du texte, dans le tiers haut de l'écran */
    const large = l >= 980;
    const versDroite = large ? 0.92 : 0.0;
    socle.scale.setScalar(lerp(0.70, 1, e0) * (large ? 1 : 0.80));
    socle.position.x = versDroite;
    socle.position.y = (large ? 0 : 1.30) - (large ? 0.18 : 0.06) * pb;

    /* démontage */
    /* le démontage est un peu plus resserré sur petit écran */
    const etale = (large ? 1 : 0.68) * pb;
    hautDeForme.position.y = yTige + 0.52 * etale;
    blocSemelle.position.y = ySemelle + 0.13 * etale;
    blocTalon.position.y   = yTalon - 0.24 * etale;

    /* caméra : on recule à mesure que le soulier se démonte */
    souris.cx += (souris.x - souris.cx) * Math.min(1, dt * 3.2);
    souris.cy += (souris.y - souris.cy) * Math.min(1, dt * 3.2);

    const etroit = l < 760;
    const distance = lerp(lerp(3.75, 4.15, pa), etroit ? 6.1 : 5.05, pb)
                   * lerp(1.28, 1, e0);
    const hauteur  = lerp(lerp(1.72, 1.92, pa), 1.98, pb);
    const azimut   = lerp(0.60, 0.34, pb);

    camera.position.set(
      versDroite + Math.sin(azimut) * distance + souris.cx * 0.20 * (1 - pb),
      hauteur - souris.cy * 0.14 * (1 - pb),
      Math.cos(azimut) * distance
    );
    cible.set(versDroite, lerp(0.42, 0.50, pb), 0);
    camera.lookAt(cible);

    /* la lumière et le plan d'ombre suivent le soulier : l'ombre portée
       reste sous l'objet, quelle que soit sa position à l'écran */
    lampes.cle.position.set(socle.position.x + 2.6, socle.position.y + 4.4, 3.1);
    lampes.cle.target.position.set(socle.position.x, socle.position.y, 0);
    lampes.cle.target.updateMatrixWorld();
    sol.position.set(socle.position.x, socle.position.y, 0);

    placerAnnotations(pb > 0.55);
    if (onProgress) onProgress(p, pb);

    renderer.render(scene, camera);

    if (onReady) { const f = onReady; onReady = null; f(); }
  }
  boucle();

  return { renderer, scene, camera, soulier };
}
