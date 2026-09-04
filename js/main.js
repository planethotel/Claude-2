/* =========================================================================
   main.js — assemblage de la page
   ========================================================================= */
import { MAISON, PILIERS, PRESTATIONS, BOUTIQUE, AVANT_APRES } from './data.js';
import { DESSINS } from './dessins.js';
import { lancerScene } from './hero.js';
import { lancerComparateur } from './compare.js';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const romain = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/* ------------------------------------------------------------------ */
/* 1. Contenus injectés depuis data.js                                  */
/* ------------------------------------------------------------------ */
function piliers() {
  $('#piliers').innerHTML = PILIERS.map((p) => `
    <li data-rev>
      <span class="piliers__num">${p.num}</span>
      <h3>${p.titre}</h3>
      <p>${p.texte}</p>
    </li>`).join('');
}

function prestations() {
  const cats = ['Tout', ...new Set(PRESTATIONS.map((p) => p.cat))];
  $('#filtres').innerHTML = cats.map((c, i) => `
    <button role="tab" data-cat="${c}" aria-selected="${i === 0}">${c}</button>`).join('');

  $('#liste-prestations').innerHTML = PRESTATIONS.map((p, i) => `
    <li data-cat="${p.cat}">
      <span class="presta__idx">${String(i + 1).padStart(2, '0')}</span>
      <h3 class="presta__nom">${p.nom}</h3>
      <span class="presta__cat">${p.cat}</span>
      <p class="presta__desc">${p.desc}</p>
    </li>`).join('');

  $('#filtres').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('#filtres button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    const c = b.dataset.cat;
    $$('#liste-prestations li').forEach((li) =>
      li.classList.toggle('est-cache', c !== 'Tout' && li.dataset.cat !== c));
  });
}

function boutique() {
  const rendre = (cle) => {
    const rayon = BOUTIQUE[cle];
    $('#boutique-chapo').textContent = rayon.chapo;
    $('#rayon').innerHTML = rayon.articles.map((a, i) => `
      <li class="article">
        <div class="article__visuel">
          <span class="article__num">N° ${String(i + 1).padStart(2, '0')}</span>
          <span class="article__etat">${a.etat}</span>
          <div class="article__cuir" style="background-color:${a.teinte}"></div>
          <div class="article__trait">${DESSINS[a.dessin] || ''}</div>
        </div>
        <div class="article__corps">
          <h3>${a.nom}</h3>
          <p class="article__detail">${a.detail}</p>
          <div class="article__pied">
            <span class="article__taille">${a.taille}</span>
            <span class="article__prix">${a.prix}</span>
          </div>
        </div>
      </li>`).join('');
  };
  rendre('seconde-vie');

  $('#onglets').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('#onglets button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    rendre(b.dataset.rayon);
  });
}

function galerie() {
  $('#galerie').innerHTML = AVANT_APRES.map((p) => `
    <li data-rev>
      <div class="duo" style="--split:50%">
        <img src="${p.avant}" alt="${p.titre} — avant intervention" loading="lazy" decoding="async">
        <img class="duo__apres" src="${p.apres}" alt="${p.titre} — après intervention" loading="lazy" decoding="async">
        <span class="duo__barre"></span>
      </div>
      <div class="galerie__texte">
        <h3>${p.titre}</h3>
        <p>${p.texte}</p>
      </div>
    </li>`).join('');

  /* chaque vignette se compare au doigt ou à la souris */
  $$('#galerie .duo').forEach((duo) => {
    const maj = (e) => {
      const r = duo.getBoundingClientRect();
      const f = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
      duo.style.setProperty('--split', f.toFixed(1) + '%');
    };
    let actif = false;
    duo.addEventListener('pointerdown', (e) => { actif = true; duo.setPointerCapture(e.pointerId); maj(e); });
    duo.addEventListener('pointermove', (e) => { if (actif || e.pointerType === 'mouse') maj(e); });
    ['pointerup', 'pointercancel'].forEach((n) => duo.addEventListener(n, () => { actif = false; }));
    duo.addEventListener('pointerleave', () => {
      actif = false;
      duo.style.setProperty('--split', '50%');
    });
  });
}

function horaires() {
  const auj = new Date().getDay();               // 0 = dimanche
  const ordre = [1, 2, 3, 4, 5, 6, 0];           // lundi → dimanche
  $('#horaires').innerHTML = MAISON.horaires.map((h, i) => `
    <li class="${h.ferme ? 'est-ferme' : ''} ${ordre[i] === auj ? 'est-aujourdhui' : ''}">
      <span>${h.j}</span><span>${h.h}</span>
    </li>`).join('');
  $('#lien-maps').href = MAISON.maps;
  $('#carte-plan').href = MAISON.maps;
  $('#annee').textContent = new Date().getFullYear();
}

/* ------------------------------------------------------------------ */
/* 2. Navigation, apparitions, formulaire                              */
/* ------------------------------------------------------------------ */
function navigation() {
  const entete = $('#entete'), burger = $('#burger'), menu = $('#menu');

  const auDefilement = () => entete.classList.toggle('est-collee', scrollY > 40);
  addEventListener('scroll', auDefilement, { passive: true });
  auDefilement();

  burger.addEventListener('click', () => {
    const ouvert = menu.classList.toggle('est-ouverte');
    burger.setAttribute('aria-expanded', String(ouvert));
    burger.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
  });
  menu.addEventListener('click', (e) => {
    if (e.target.tagName !== 'A') return;
    menu.classList.remove('est-ouverte');
    burger.setAttribute('aria-expanded', 'false');
  });

  /* rubrique active */
  const liens = $$('#menu a');
  const cibles = liens.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const obs = new IntersectionObserver((entrees) => {
    entrees.forEach((e) => {
      if (!e.isIntersecting) return;
      liens.forEach((a) =>
        a.classList.toggle('est-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  cibles.forEach((c) => obs.observe(c));
}

function apparitions() {
  const obs = new IntersectionObserver((entrees) => {
    entrees.forEach((e, i) => {
      if (!e.isIntersecting) return;
      /* décalage plafonné : un lot nombreux ne doit pas retarder l'affichage */
      setTimeout(() => e.target.classList.add('est-vu'), Math.min(i, 5) * 70);
      obs.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  $$('[data-rev]').forEach((el) => obs.observe(el));
}

function formulaire() {
  const f = $('#form'), retour = $('#form-retour');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(f);
    const nom = (d.get('nom') || '').toString().trim();
    const coord = (d.get('contact') || '').toString().trim();
    const msg = (d.get('message') || '').toString().trim();
    if (!nom || !coord || !msg) {
      retour.textContent = 'Merci de remplir les trois champs.';
      return;
    }
    /* pas de serveur : on prépare l'e-mail, et on rappelle le téléphone */
    const corps = encodeURIComponent(
      `${msg}\n\n— ${nom}\nPour me joindre : ${coord}`);
    const sujet = encodeURIComponent('Demande de réparation — ' + nom);
    retour.textContent = 'Votre messagerie s’ouvre… sinon, appelez le ' + MAISON.tel + '.';
    location.href = `mailto:contact@cordonnerie-bonnet.fr?subject=${sujet}&body=${corps}`;
  });
}

/* ------------------------------------------------------------------ */
/* 3. Les deux scènes 3D                                               */
/* ------------------------------------------------------------------ */
function troisD() {
  const leger = matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    lancerScene({
      canvas: $('#canvas3d'),
      zone: $('#scene'),
      sectionDebut: $('#haut'),
      sectionFin: $('#savoirfaire'),
      annotations: $$('#annotations .anno'),
      onReady: fermerLeVoile
    });
  } catch (err) {
    console.warn('Scène principale indisponible :', err);
    $('#scene').classList.add('sans-3d');
    fermerLeVoile();
  }

  if (!leger) {
    try {
      lancerComparateur({
        canvas: $('#canvas-compare'),
        conteneur: $('#compare-zone'),
        poignee: $('#compare-poignee')
      });
    } catch (err) {
      console.warn('Comparateur indisponible :', err);
    }
  }
}

/* ------------------------------------------------------------------ */
/* 4. Démarrage                                                        */
/* ------------------------------------------------------------------ */
let voileFerme = false;
function fermerLeVoile() {
  if (voileFerme) return;
  voileFerme = true;
  $('#chargement').classList.add('est-fini');
}

piliers();
prestations();
boutique();
galerie();
horaires();
navigation();
apparitions();
formulaire();
troisD();

/* filet de sécurité : la page ne reste jamais bloquée sur le voile */
addEventListener('load', () => setTimeout(fermerLeVoile, 200));
setTimeout(fermerLeVoile, 2600);
