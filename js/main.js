/* =========================================================================
   main.js — assemblage de la page à partir de js/data.js
   ========================================================================= */
import {
  MAISON, ANNONCE, PHOTOS, SERVICES, PILIERS, QUESTIONS, PRESTATIONS,
  GALERIE, AVANT_APRES, BOUTIQUE, RAYONS, ARTISAN
} from './data.js';
import { DESSINS } from './dessins.js';
import { creerFondu } from './transition.js';
import { apparitions, parallaxe, suivreSection, pleinEcran, animationsSobres } from './anim.js';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
                                  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ------------------------------------------------------------------ */
/* Photographies : la vraie image si le fichier existe, sinon un cadre  */
/* légendé qui dit exactement quelle photo doit venir là.               */
/* ------------------------------------------------------------------ */
function attente(titre, note) {
  return `<div class="attente">
    <b>${esc(titre)}</b>
    ${note ? `<span>${esc(note)}</span>` : ''}
    <em>Photo à ajouter</em>
  </div>`;
}

function photo({ src, alt, titre, note, legende, parallaxeForce, plein }) {
  if (!src) return attente(titre, note);
  return `<figure class="photo"${parallaxeForce ? ` data-parallaxe="${parallaxeForce}"` : ''}>
    <img src="${esc(src)}" alt="${esc(alt || titre)}" loading="lazy" decoding="async"
         ${plein ? `data-plein="${esc(src)}" data-legende="${esc(legende || titre)}"` : ''}>
    ${legende ? `<figcaption><b>${esc(titre)}</b>${esc(note || '')}</figcaption>` : ''}
  </figure>`;
}

/* Peu importe l'extension du fichier déposé : on essaie les formats courants
   avant de renoncer. « devanture.jpg » trouve aussi devanture.png ou .webp. */
const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG'];
function variantes(src) {
  const base = src.replace(/\.[a-z]+$/i, '');
  const vues = new Set([src]);
  const liste = [src];
  for (const e of EXTENSIONS) {
    const v = base + e;
    if (!vues.has(v)) { vues.add(v); liste.push(v); }
  }
  return liste;
}

/* Une image absente ne doit pas laisser un trou : on essaie les autres
   extensions, puis on la remplace par un cadre légendé. */
function brancherPhotos(racine = document) {
  $$('figure.photo img', racine).forEach((im) => {
    if (im.dataset.branche) return;
    im.dataset.branche = '1';
    const reste = variantes(im.getAttribute('src')).slice(1);
    im.addEventListener('error', function suivant() {
      if (reste.length) {
        const v = reste.shift();
        if (im.dataset.plein) im.dataset.plein = v;
        im.src = v;
        im.addEventListener('error', suivant, { once: true });
        return;
      }
      const fig = im.closest('figure.photo');
      if (!fig) return;
      const cap = fig.querySelector('figcaption b');
      fig.outerHTML = attente(cap ? cap.textContent : (im.alt || 'Photo'), '');
    }, { once: true });
  });
}

/* ------------------------------------------------------------------ */
/* 1. Bandeau d'annonce — s'efface seul après sa date de fin            */
/* ------------------------------------------------------------------ */
function annonce() {
  const el = $('#annonce');
  if (!ANNONCE.actif || !ANNONCE.texte) return;
  const fin = new Date(ANNONCE.jusquau + 'T23:59:59');
  if (!isNaN(fin) && Date.now() > fin.getTime()) return;
  try { if (sessionStorage.getItem('annonce') === ANNONCE.texte) return; } catch (e) { /* rien */ }

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
  $('#hero-services').innerHTML = SERVICES.map(esc).join('<i></i>');

  const fond = $('#hero-fond');
  trouver(PHOTOS.devanture.src).then((url) => {
    if (url) fond.innerHTML = `<img src="${esc(url)}" alt="${esc(PHOTOS.devanture.alt)}">`;
  });

  $('#photo-atelier-1').innerHTML = photo({
    src: PHOTOS.atelier1.src, alt: PHOTOS.atelier1.alt,
    titre: PHOTOS.atelier1.attente, parallaxeForce: 0.16
  });
  $('#photo-atelier-2').innerHTML = photo({
    src: PHOTOS.atelier2.src, alt: PHOTOS.atelier2.alt,
    titre: PHOTOS.atelier2.attente, parallaxeForce: 0.22
  });

  $('#piliers').innerHTML = PILIERS.map((p) => `
    <li data-rev>
      <span class="piliers__num">${esc(p.num)}</span>
      <h3>${esc(p.titre)}</h3>
      <p>${esc(p.texte)}</p>
    </li>`).join('');

  $('#questions').innerHTML = QUESTIONS.map((q) => `<li data-rev>${esc(q)}</li>`).join('');
}

function prestations() {
  const cats = ['Tout', ...new Set(PRESTATIONS.map((p) => p.cat))];
  $('#filtres').innerHTML = cats.map((c, i) =>
    `<button role="tab" data-cat="${esc(c)}" aria-selected="${i === 0}">${esc(c)}</button>`).join('');

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
    $$('#liste-prestations li').forEach((li) =>
      li.classList.toggle('est-cache', b.dataset.cat !== 'Tout' && li.dataset.cat !== b.dataset.cat));
  });
}

function galerie() {
  $('#galerie-grille').innerHTML = GALERIE.map((g) => `
    <li class="${g.format === 'haut' ? 'est-haut' : ''}" data-rev>
      ${photo({ src: g.src, alt: `${g.titre} — ${g.note}`, titre: g.titre, note: g.note,
                legende: g.titre, parallaxeForce: 0.05, plein: true })}
    </li>`).join('');
}

function boutique() {
  $('#onglets').innerHTML = RAYONS.map((cle, i) =>
    `<button role="tab" data-rayon="${esc(cle)}" aria-selected="${i === 0}">${esc(BOUTIQUE[cle].titre)}</button>`).join('');

  const rendre = (cle) => {
    const r = BOUTIQUE[cle];
    $('#boutique-chapo').textContent = r.chapo;
    $('#boutique-pied').textContent = r.pied;
    $('#rayon').innerHTML = r.articles.map((a) => {
      const badge = a.statut
        ? `<span class="article__badge ${a.statut === 'Vendu' ? 'est-vendu' : ''}">${esc(a.statut)}</span>` : '';
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
  $('#artisan-texte').innerHTML = ARTISAN.paragraphes.map((p) => `<p data-rev>${esc(p)}</p>`).join('');
  $('#artisan-signature').textContent = ARTISAN.signature;
  $('#photo-artisan').innerHTML = photo({
    src: PHOTOS.artisan.src, alt: PHOTOS.artisan.alt, titre: PHOTOS.artisan.attente
  });
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

  const liens = [['Facebook', MAISON.facebook], ['Instagram', MAISON.instagram],
                 ['E-mail', 'mailto:' + MAISON.email]];
  const rendreLiens = (style = '') => liens.map(([n, u]) =>
    `<a href="${esc(u)}"${u.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}${style}>${esc(n)}</a>`).join('');

  $('#reseaux').innerHTML = rendreLiens();
  $('#lien-maps').href = MAISON.maps;
  $('#carte-plan').href = MAISON.maps;
  $('#annee').textContent = new Date().getFullYear();
  $('#pied-droite').innerHTML = `
    <a class="lien-fort" href="tel:${esc(MAISON.telLien)}" style="font-size:1.3rem">${esc(MAISON.tel)}</a>
    <div class="reseaux">${rendreLiens(' style="color:inherit;border-color:rgba(169,124,58,.3)"')}</div>`;
}

/* ------------------------------------------------------------------ */
/* 3. Le fondu avant / après                                           */
/* ------------------------------------------------------------------ */
/* Renvoie l'URL qui répond, en essayant les extensions courantes. */
function trouver(src) {
  if (!src) return Promise.resolve(null);
  const liste = variantes(src);
  return new Promise((ok) => {
    let i = 0;
    const essayer = () => {
      if (i >= liste.length) return ok(null);
      const url = liste[i++];
      const im = new Image();
      im.onload = () => ok(url);
      im.onerror = essayer;
      im.src = url;
    };
    essayer();
  });
}

async function fondu() {
  const bloc = $('#fondu'), scene = $('#fondu-scene');
  $('#ap-chapo').textContent = AVANT_APRES.chapo;

  /* on ne garde que les cas dont les deux photos sont réellement là */
  const dispo = [];
  for (const c of AVANT_APRES.cas) {
    const [a, b] = await Promise.all([trouver(c.avant), trouver(c.apres)]);
    if (a && b) dispo.push({ ...c, avant: a, apres: b });
  }
  if (!dispo.length) return;                     // le cadre d'attente reste affiché

  bloc.classList.add('a-photos');
  $('#fondu-cas').innerHTML = dispo.map((c, i) =>
    `<li><button role="tab" data-i="${i}" aria-selected="${i === 0}">${esc(c.titre)}</button></li>`).join('');

  /* WebGL si possible, fondu enchaîné sinon */
  let moteur = null;
  try { moteur = creerFondu({ canvas: $('#fondu-canvas') }); } catch (e) { moteur = null; }
  if (moteur) bloc.classList.add('mode-webgl');

  const range = $('#fondu-range');
  let progres = 0, anim = null, courant = -1;

  function poser(p) {
    progres = Math.min(1, Math.max(0, p));
    if (moteur) moteur.progres = progres;
    scene.style.setProperty('--melange', progres.toFixed(3));
    scene.style.setProperty('--avancement', progres.toFixed(3));
    range.style.setProperty('--rempli', (progres * 100).toFixed(1) + '%');
    range.value = String(Math.round(progres * 1000));
  }

  function jouer(depuis = 0) {
    if (anim) cancelAnimationFrame(anim);
    if (animationsSobres) { poser(1); return; }
    const t0 = performance.now(), duree = 1900;
    const pas = (t) => {
      const x = Math.min(1, (t - t0) / duree);
      poser(depuis + (1 - depuis) * (x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x + 2, 2) / 2));
      if (x < 1) anim = requestAnimationFrame(pas);
    };
    anim = requestAnimationFrame(pas);
  }

  async function choisir(i) {
    if (i === courant) return;
    courant = i;
    const c = dispo[i];
    $$('#fondu-cas button').forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.i === i)));
    $('#fondu-titre').textContent = c.titre;
    $('#fondu-geste').textContent = c.geste;
    $('#fondu-images').innerHTML =
      `<img src="${esc(c.avant)}" alt="${esc(c.titre)} — avant">
       <img src="${esc(c.apres)}" alt="${esc(c.titre)} — après">`;
    if (moteur) { try { await moteur.charger(c.avant, c.apres); } catch (e) { bloc.classList.remove('mode-webgl'); } }
    poser(0);
    jouer(0);
  }

  $('#fondu-cas').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) choisir(Number(b.dataset.i));
  });
  range.addEventListener('input', () => {
    if (anim) cancelAnimationFrame(anim);
    poser(Number(range.value) / 1000);
  });
  $('#fondu-rejouer').addEventListener('click', () => { poser(0); jouer(0); });
  addEventListener('resize', () => { if (moteur) moteur.dessiner(); });

  await choisir(0);

  /* la transition se rejoue quand la section revient à l'écran */
  let dejaVu = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !dejaVu) { dejaVu = true; poser(0); jouer(0); }
    if (!e.isIntersecting) dejaVu = false;
  }, { threshold: 0.45 }).observe(scene);
}

/* ------------------------------------------------------------------ */
/* 4. Navigation, formulaire                                           */
/* ------------------------------------------------------------------ */
function navigation() {
  const entete = $('#entete'), burger = $('#burger'), menu = $('#menu');
  const sombres = ['#haut', '#avantapres', '#artisan', '#bandeau-atelier']
    .map((s) => $(s)).filter(Boolean);

  const auDefilement = () => {
    const h = entete.offsetHeight + 2;   // juste sous la barre
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
      liens.forEach((a) => a.classList.toggle('est-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  cibles.forEach((c) => obs.observe(c));
}

function formulaire() {
  const f = $('#form'), retour = $('#form-retour');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(f);
    const nom = (d.get('nom') || '').toString().trim();
    const coord = (d.get('contact') || '').toString().trim();
    const msg = (d.get('message') || '').toString().trim();
    if (!nom || !coord || !msg) { retour.textContent = 'Merci de remplir les trois champs.'; return; }
    const corps = encodeURIComponent(`${msg}\n\n— ${nom}\nPour me joindre : ${coord}`);
    const sujet = encodeURIComponent('Demande de devis — ' + nom);
    retour.textContent = `Votre messagerie s’ouvre… sinon, écrivez à ${MAISON.email} ou appelez le ${MAISON.tel}.`;
    location.href = `mailto:${MAISON.email}?subject=${sujet}&body=${corps}`;
  });
}

/* ------------------------------------------------------------------ */
annonce();
accueil();
prestations();
galerie();
boutique();
artisan();
contact();
navigation();
formulaire();
brancherPhotos();
apparitions();
parallaxe();
pleinEcran($('#galerie-grille'), $('#plein'));
fondu();
