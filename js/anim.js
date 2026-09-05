/* =========================================================================
   anim.js — les mouvements de la page.
   Tout est piloté par une seule boucle d'affichage, qui ne tourne que
   lorsqu'un élément animé est réellement à l'écran. Si le visiteur a
   demandé à son système de réduire les animations, rien ne bouge.
   ========================================================================= */

const sobre = matchMedia('(prefers-reduced-motion: reduce)').matches;
const borne = (x, a, b) => Math.min(b, Math.max(a, x));

/* ------------------------------------------------------------------ */
/* Apparition à l'entrée dans le cadre                                  */
/* ------------------------------------------------------------------ */
export function apparitions(racine = document) {
  document.documentElement.classList.add('js');
  if (sobre) {
    racine.querySelectorAll('[data-rev]').forEach((e) => e.classList.add('est-vu'));
    return;
  }
  const obs = new IntersectionObserver((entrees) => {
    entrees.forEach((e, i) => {
      if (!e.isIntersecting) return;
      const retard = Number(e.target.dataset.rev) || Math.min(i, 5) * 70;
      setTimeout(() => e.target.classList.add('est-vu'), retard);
      obs.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  racine.querySelectorAll('[data-rev]').forEach((e) => obs.observe(e));
}

/* ------------------------------------------------------------------ */
/* Parallaxe : les photos glissent un peu moins vite que la page        */
/* ------------------------------------------------------------------ */
export function parallaxe(racine = document) {
  if (sobre) return;
  const cibles = [...racine.querySelectorAll('[data-parallaxe]')].map((el) => ({
    el,
    force: Number(el.dataset.parallaxe) || 0.12,
    visible: false
  }));
  if (!cibles.length) return;

  const obs = new IntersectionObserver((entrees) => {
    entrees.forEach((e) => {
      const c = cibles.find((x) => x.el === e.target);
      if (c) c.visible = e.isIntersecting;
    });
    relancer();
  }, { rootMargin: '20% 0px 20% 0px' });
  cibles.forEach((c) => obs.observe(c.el));

  let enCours = false;
  function boucle() {
    const actifs = cibles.filter((c) => c.visible);
    if (!actifs.length) { enCours = false; return; }
    const mi = innerHeight / 2;
    for (const c of actifs) {
      const r = c.el.getBoundingClientRect();
      const centre = r.top + r.height / 2;
      const d = borne((centre - mi) / (innerHeight / 2 + r.height / 2), -1, 1);
      c.el.style.setProperty('--glisse', (-d * c.force * 100).toFixed(2) + 'px');
    }
    requestAnimationFrame(boucle);
  }
  function relancer() { if (!enCours) { enCours = true; requestAnimationFrame(boucle); } }
  relancer();
}

/* ------------------------------------------------------------------ */
/* Progression d'une section : 0 à l'entrée, 1 à la sortie              */
/* ------------------------------------------------------------------ */
export function suivreSection(el, rappel, { debut = 0.85, fin = 0.25 } = {}) {
  let visible = false, enCours = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) relancer(); 
  }, { rootMargin: '10% 0px 10% 0px' }).observe(el);

  function mesurer() {
    const r = el.getBoundingClientRect();
    const h = innerHeight;
    const p = (h * debut - r.top) / Math.max(1, r.height + h * (debut - fin));
    return borne(p, 0, 1);
  }
  function boucle() {
    if (!visible) { enCours = false; return; }
    rappel(mesurer());
    requestAnimationFrame(boucle);
  }
  function relancer() { if (!enCours) { enCours = true; requestAnimationFrame(boucle); } }
  rappel(mesurer());
  return { mesurer };
}

/* ------------------------------------------------------------------ */
/* Plein écran sur une photo de la galerie                              */
/* ------------------------------------------------------------------ */
export function pleinEcran(grille, boite) {
  const image = boite.querySelector('img');
  const legende = boite.querySelector('.plein__legende');
  const compteur = boite.querySelector('.plein__compteur');
  let liste = [], index = 0;

  const montrer = (i) => {
    if (!liste.length) return;
    index = (i + liste.length) % liste.length;
    const p = liste[index];
    image.src = p.src;
    image.alt = p.alt;
    legende.textContent = p.legende;
    compteur.textContent = (index + 1) + ' / ' + liste.length;
  };

  const ouvrir = (i) => {
    liste = [...grille.querySelectorAll('img[data-plein]')].map((im) => ({
      src: im.dataset.plein || im.src,
      alt: im.alt,
      legende: im.dataset.legende || im.alt
    }));
    montrer(i);
    boite.hidden = false;
    document.body.style.overflow = 'hidden';
    boite.querySelector('.plein__fermer').focus();
  };
  const fermer = () => {
    boite.hidden = true;
    document.body.style.overflow = '';
    image.removeAttribute('src');
  };

  grille.addEventListener('click', (e) => {
    const im = e.target.closest('img[data-plein]');
    if (!im) return;
    const tous = [...grille.querySelectorAll('img[data-plein]')];
    ouvrir(tous.indexOf(im));
  });
  boite.querySelector('.plein__fermer').addEventListener('click', fermer);
  boite.querySelector('.plein__prec').addEventListener('click', () => montrer(index - 1));
  boite.querySelector('.plein__suiv').addEventListener('click', () => montrer(index + 1));
  boite.addEventListener('click', (e) => { if (e.target === boite) fermer(); });
  addEventListener('keydown', (e) => {
    if (boite.hidden) return;
    if (e.key === 'Escape') fermer();
    if (e.key === 'ArrowLeft') montrer(index - 1);
    if (e.key === 'ArrowRight') montrer(index + 1);
  });
  return { ouvrir, fermer };
}

export const animationsSobres = sobre;
