/* =========================================================================
   main.js — assemblage de la page à partir de js/data.js
   ========================================================================= */
import {
  MAISON, ANNONCE, SERVICES, PILIERS, QUESTIONS, PRESTATIONS,
  GALERIE, AVANT_APRES, BOUTIQUE, RAYONS, ARTISAN
} from './data.js';
import { DESSINS } from './dessins.js';
import { lancerScene } from './hero.js';
import { lancerComparateur } from './compare.js';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Une photo si elle existe, sinon un emplacement réservé clairement annoncé. */
function visuel(item, titre, note = '') {
  if (item && item.photo) {
    return `<img src="${esc(item.photo)}" alt="${esc(titre)}" loading="lazy" decoding="async">`;
  }
  return `<div class="attente">
    <b>${esc(titre)}</b>
    ${note ? `<span>${esc(note)}</span>` : ''}
    <em>Photo à ajouter</em>
  </div>`;
}

/* ------------------------------------------------------------------ */
/* 1. Bandeau d'annonce — il s'efface tout seul après sa date de fin    */
/* ------------------------------------------------------------------ */
function annonce() {
  const el = $('#annonce');
  if (!ANNONCE.actif || !ANNONCE.texte) return;

  const fin = new Date(ANNONCE.jusquau + 'T23:59:59');
  if (!isNaN(fin) && Date.now() > fin.getTime()) return;   // périmée : on ne l'affiche pas

  let ecarte = false;
  try { ecarte = sessionStorage.getItem('annonce') === ANNONCE.texte; } catch (e) { /* rien */ }
  if (ecarte) return;

  $('#annonce-texte').textContent = ANNONCE.texte;
  el.hidden = false;
  $('#annonce-fermer').addEventListener('click', () => {
    el.hidden = true;
    try { sessionStorage.setItem('annonce', ANNONCE.texte); } catch (e) { /* rien */ }
  });
}

/* ------------------------------------------------------------------ */
/* 2. Contenus                                                         */
/* ------------------------------------------------------------------ */
function accueil() {
  $('#hero-services').innerHTML =
    SERVICES.map(esc).join('<i></i>');

  $('#piliers').innerHTML = PILIERS.map((p) => `
    <li data-rev>
      <div class="piliers__tete">
        <span class="piliers__num">${esc(p.num)}</span>
        <span class="piliers__dessin">${DESSINS[p.dessin] || ''}</span>
      </div>
      <h3>${esc(p.titre)}</h3>
      <p>${esc(p.texte)}</p>
    </li>`).join('');

  $('#questions').innerHTML = QUESTIONS.map((q) => `<li data-rev>${esc(q)}</li>`).join('');
}

function prestations() {
  const cats = ['Tout', ...new Set(PRESTATIONS.map((p) => p.cat))];
  $('#filtres').innerHTML = cats.map((c, i) => `
    <button role="tab" data-cat="${esc(c)}" aria-selected="${i === 0}">${esc(c)}</button>`).join('');

  $('#liste-prestations').innerHTML = PRESTATIONS.map((p, i) => `
    <li data-cat="${esc(p.cat)}">
      <span class="presta__idx">${String(i + 1).padStart(2, '0')}</span>
      <h3 class="presta__nom">${esc(p.nom)}</h3>
      <span class="presta__cat">${esc(p.cat)}</span>
      <p class="presta__desc">${esc(p.desc)}</p>
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

function avantApres() {
  $('#ap-chapo').textContent = AVANT_APRES.chapo;
  $('#exemple').innerHTML = `
    <div><b>Avant</b><p>${esc(AVANT_APRES.exemple.avant)}</p></div>
    <div><b>Après</b><p>${esc(AVANT_APRES.exemple.apres)}</p></div>`;

  $('#paires').innerHTML = AVANT_APRES.paires.map((p) => `
    <li data-rev>
      <div class="duo" style="--split:50%">
        <img src="${esc(p.avant)}" alt="${esc(p.titre)} — avant intervention" loading="lazy" decoding="async">
        <img class="duo__apres" src="${esc(p.apres)}" alt="${esc(p.titre)} — après intervention" loading="lazy" decoding="async">
        <span class="duo__barre"></span>
      </div>
      <div class="paires__texte">
        <h3>${esc(p.titre)}</h3>
        <p>${esc(p.texte)}</p>
      </div>
    </li>`).join('');

  $$('#paires .duo').forEach(curseurImage);
}

/* curseur avant/après sur une paire de photos */
function curseurImage(duo) {
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
}

function galerie() {
  $('#galerie-grille').innerHTML = GALERIE.map((g) => `
    <li class="${g.format === 'haut' ? 'est-haut' : ''}" data-rev>
      <figure>
        ${visuel(g, g.titre, g.note)}
        ${g.photo ? `<figcaption><b>${esc(g.titre)}</b>${esc(g.note || '')}</figcaption>` : ''}
      </figure>
    </li>`).join('');
}

function boutique() {
  $('#onglets').innerHTML = RAYONS.map((cle, i) => `
    <button role="tab" data-rayon="${esc(cle)}" aria-selected="${i === 0}">
      ${esc(BOUTIQUE[cle].titre)}
    </button>`).join('');

  const rendre = (cle) => {
    const r = BOUTIQUE[cle];
    $('#boutique-chapo').textContent = r.chapo;
    $('#boutique-pied').textContent = r.pied;

    $('#rayon').innerHTML = r.articles.map((a) => {
      const badge = a.statut
        ? `<span class="article__badge ${a.statut === 'Vendu' ? 'est-vendu' : ''}">${esc(a.statut)}</span>`
        : '';
      const image = a.photo
        ? `<img src="${esc(a.photo)}" alt="${esc(a.nom)}" loading="lazy" decoding="async">`
        : (DESSINS[a.dessin] || '');
      return `
      <li class="article">
        <div class="article__visuel">${badge}${image}</div>
        <div class="article__corps">
          ${a.marque ? `<span class="article__marque">${esc(a.marque)}</span>` : ''}
          ${a.taille ? `<span class="article__taille">${esc(a.taille)}</span>` : ''}
          <h3>${esc(a.nom)}${a.precision ? ` <small>${esc(a.precision)}</small>` : ''}</h3>
          ${a.desc ? `<p class="article__desc">${esc(a.desc)}</p>` : ''}
        </div>
      </li>`;
    }).join('');
  };
  rendre(RAYONS[0]);

  $('#onglets').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('#onglets button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    rendre(b.dataset.rayon);
  });
}

function artisan() {
  $('#artisan-texte').innerHTML =
    ARTISAN.paragraphes.map((p) => `<p data-rev>${esc(p)}</p>`).join('');
  $('#artisan-signature').textContent = ARTISAN.signature;
  $('#artisan-portrait').innerHTML =
    visuel(ARTISAN, 'L’artisan à l’établi', 'Une photo au travail, à l’atelier');
}

function contact() {
  const auj = new Date().getDay();
  const ordre = [1, 2, 3, 4, 5, 6, 0];
  $('#horaires').innerHTML = MAISON.horaires.map((h, i) => `
    <li class="${h.ferme ? 'est-ferme' : ''} ${ordre[i] === auj ? 'est-aujourdhui' : ''}">
      <span>${esc(h.j)}</span><span>${esc(h.h)}</span>
    </li>`).join('');

  $('#horaires-note').innerHTML =
    `Une question avant de passer ? <a href="tel:${esc(MAISON.telLien)}">${esc(MAISON.tel)}</a>`;

  const liens = [
    ['Facebook', MAISON.facebook],
    ['Instagram', MAISON.instagram],
    ['E-mail', 'mailto:' + MAISON.email]
  ];
  $('#reseaux').innerHTML = liens.map(([n, u]) =>
    `<a href="${esc(u)}"${u.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(n)}</a>`).join('');

  $('#lien-maps').href = MAISON.maps;
  $('#carte-plan').href = MAISON.maps;
  $('#annee').textContent = new Date().getFullYear();

  $('#pied-droite').innerHTML = `
    <a class="lien-fort" href="tel:${esc(MAISON.telLien)}" style="font-size:1.3rem">${esc(MAISON.tel)}</a>
    <div class="reseaux">${liens.map(([n, u]) =>
      `<a href="${esc(u)}"${u.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}
          style="color:inherit;border-color:rgba(169,124,58,.3)">${esc(n)}</a>`).join('')}</div>`;
}

/* ------------------------------------------------------------------ */
/* 3. Navigation, apparitions, formulaire                              */
/* ------------------------------------------------------------------ */
function navigation() {
  const entete = $('#entete'), burger = $('#burger'), menu = $('#menu');

  /* la barre prend la couleur de la section qu'elle survole :
     claire sur les sections claires, sombre sur les moments en volume */
  const sombres = ['#scene', '#avantapres', '#artisan'].map((s) => $(s)).filter(Boolean);
  const auDefilement = () => {
    const h = entete.offsetHeight * 0.55;
    const surSombre = sombres.some((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= h && r.bottom >= h;
    });
    entete.classList.toggle('est-collee', scrollY > 24);
    entete.classList.toggle('est-sombre', surSombre);
  };
  addEventListener('scroll', auDefilement, { passive: true });
  addEventListener('resize', auDefilement);
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
      setTimeout(() => e.target.classList.add('est-vu'), Math.min(i, 5) * 70);
      obs.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
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
    const corps = encodeURIComponent(`${msg}\n\n— ${nom}\nPour me joindre : ${coord}`);
    const sujet = encodeURIComponent('Demande de devis — ' + nom);
    retour.textContent = `Votre messagerie s’ouvre… sinon, écrivez à ${MAISON.email} ou appelez le ${MAISON.tel}.`;
    location.href = `mailto:${MAISON.email}?subject=${sujet}&body=${corps}`;
  });
}

/* ------------------------------------------------------------------ */
/* 4. Les deux scènes 3D                                               */
/* ------------------------------------------------------------------ */
let voileFerme = false;
function fermerLeVoile() {
  if (voileFerme) return;
  voileFerme = true;
  $('#chargement').classList.add('est-fini');
}

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
annonce();
accueil();
prestations();
avantApres();
galerie();
boutique();
artisan();
contact();
navigation();
apparitions();
formulaire();
troisD();

addEventListener('load', () => setTimeout(fermerLeVoile, 200));
setTimeout(fermerLeVoile, 2600);
