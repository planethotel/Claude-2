/* ============================================================
   MYSTÈRE FRAGRANCES — interactions
   Vanilla JS, aucune dépendance.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse  = window.matchMedia('(hover:none), (pointer:coarse)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------------------------------------------------------
     1. Voile d'ouverture
     --------------------------------------------------------- */
  var veil = $('#veil');
  function liftVeil() {
    if (!veil || veil.classList.contains('is-gone')) return;
    veil.classList.add('is-gone');
    document.body.classList.add('is-ready');
    setTimeout(function () { veil.parentNode && veil.parentNode.removeChild(veil); }, 900);
    startHero();
  }
  window.addEventListener('load', function () { setTimeout(liftVeil, reduced ? 120 : 1700); });
  setTimeout(liftVeil, 4200); // filet de sécurité

  /* ---------------------------------------------------------
     2. Curseur sur mesure
     --------------------------------------------------------- */
  if (!coarse) {
    var cur = $('#cursor');
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    var dx = cx, dy = cy, rx = cx, ry = cy;
    var dot = $('.cursor__dot', cur), ring = $('.cursor__ring', cur);

    document.addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; }, { passive: true });

    (function loop() {
      dx += (cx - dx) * 0.85; dy += (cy - dy) * 0.85;
      rx += (cx - rx) * 0.16;  ry += (cy - ry) * 0.16;
      dot.style.transform  = 'translate(' + dx + 'px,' + dy + 'px) translate(-50%,-50%)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest('[data-cursor], a, button');
      cur.className = 'cursor';
      if (!t) return;
      var k = t.getAttribute('data-cursor');
      if (k === 'drag') cur.classList.add('is-drag');
      else if (k === 'zoom') cur.classList.add('is-zoom');
      else cur.classList.add('is-link');
    });
  }

  /* ---------------------------------------------------------
     3. Navigation : collée, masquée, progression, lien actif
     --------------------------------------------------------- */
  var nav = $('#nav'), bar = $('#progress'), lastY = 0;
  var navLinks = $$('.nav__links a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);

  function onScroll() {
    var y = window.pageYOffset;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';

    nav.classList.toggle('is-stuck', y > 40);
    nav.classList.toggle('is-hidden', y > 600 && y > lastY && !$('#drawer').classList.contains('is-open'));
    lastY = y;

    var mid = y + window.innerHeight * 0.38, current = -1;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= mid) current = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('is-current', i === current); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     4. Menu mobile
     --------------------------------------------------------- */
  var burger = $('#burger'), drawer = $('#drawer');
  function toggleDrawer(open) {
    var on = open === undefined ? !drawer.classList.contains('is-open') : open;
    drawer.classList.toggle('is-open', on);
    burger.classList.toggle('is-open', on);
    burger.setAttribute('aria-expanded', String(on));
    drawer.setAttribute('aria-hidden', String(!on));
    document.body.style.overflow = on ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { toggleDrawer(); });
  $$('#drawer a').forEach(function (a) { a.addEventListener('click', function () { toggleDrawer(false); }); });

  /* ---------------------------------------------------------
     5. Titre héro : découpage lettre à lettre
     --------------------------------------------------------- */
  $$('[data-split]').forEach(function (el) {
    var txt = el.textContent, frag = document.createDocumentFragment();
    txt.split('').forEach(function (ch) {
      var s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch === ' ' ? ' ' : ch;
      frag.appendChild(s);
    });
    el.textContent = '';
    el.appendChild(frag);
  });

  function startHero() {
    var chars = $$('.hero__title .char');
    chars.forEach(function (c, i) {
      setTimeout(function () { c.classList.add('in'); }, reduced ? 0 : 60 + i * 42);
    });
    $$('.hero .reveal').forEach(function (el) {
      var d = parseInt(el.getAttribute('data-delay') || 0, 10) + 520;
      setTimeout(function () { el.classList.add('in'); }, reduced ? 0 : d);
    });
  }

  /* ---------------------------------------------------------
     6. Révélations au défilement
     --------------------------------------------------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, d = parseInt(el.getAttribute('data-delay') || 0, 10);
      setTimeout(function () { el.classList.add('in'); }, reduced ? 0 : d);
      io.unobserve(el);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

  $$('.reveal, .reveal-mask').forEach(function (el) {
    if (el.closest('.hero')) return;
    io.observe(el);
  });

  // Filet : si un élément reste caché après 6 s (observer capricieux), on l'affiche.
  setTimeout(function () {
    $$('.reveal, .reveal-mask').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    });
  }, 6000);

  /* ---------------------------------------------------------
     7. Parallaxe
     --------------------------------------------------------- */
  var pxEls = $$('[data-parallax]');
  if (pxEls.length && !reduced) {
    var ticking = false;
    var paint = function () {
      var vh = window.innerHeight;
      pxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var k = parseFloat(el.getAttribute('data-parallax'));
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = 'translate3d(0,' + (p * k * 100).toFixed(2) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    paint();
  }

  /* ---------------------------------------------------------
     8. Poussière d'or (canvas)
     --------------------------------------------------------- */
  (function dust() {
    var cv = $('#dust');
    if (!cv || reduced) return;
    var ctx = cv.getContext('2d'), parts = [], w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      var r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(clamp(w / 14, 40, 130));
      parts = [];
      for (var i = 0; i < n; i++) parts.push(spawn(true));
    }
    function spawn(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + 12,
        r: Math.random() * 1.7 + 0.35,
        vy: -(Math.random() * 0.28 + 0.06),
        vx: (Math.random() - 0.5) * 0.16,
        a: Math.random() * 0.5 + 0.12,
        tw: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.72 ? 'rgba(226,59,192,' : 'rgba(243,224,175,'
      };
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y += p.vy; p.x += p.vx + Math.sin(p.tw) * 0.14; p.tw += 0.012;
        if (p.y < -12) parts[i] = spawn(false);
        var alpha = p.a * (0.55 + Math.sin(p.tw * 1.7) * 0.45);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.hue + alpha.toFixed(3) + ')';
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    size();
    window.addEventListener('resize', size);
    frame();
  })();

  /* ---------------------------------------------------------
     9. Compteurs
     --------------------------------------------------------- */
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      var end = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-decimals') || 0, 10);
      var t0 = null, dur = 1100;
      function step(t) {
        if (!t0) t0 = t;
        var k = clamp((t - t0) / dur, 0, 1);
        var eased = 1 - Math.pow(1 - k, 3);
        el.textContent = (end * eased).toFixed(dec).replace('.', ',');
        if (k < 1) requestAnimationFrame(step);
        else el.textContent = end.toFixed(dec).replace('.', ',');
      }
      if (reduced) el.textContent = end.toFixed(dec).replace('.', ',');
      else requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(function (el) { cio.observe(el); });

  /* ---------------------------------------------------------
     10. Le Cercle — carrousel 3D
     --------------------------------------------------------- */
  var CERCLE = [
    {
      img: 'assets/img/eclaire.jpg',
      alt: 'Deux flacons dorés Éclaire posés sur un plateau, en boutique',
      name: 'Éclaire',
      house: 'Lattafa',
      family: 'Gourmand doré',
      desc: "L'or liquide du rayon. Un flacon qui coule comme du miel figé, et une composition sucrée qui s'installe sans jamais crier.",
      notes: ['Vanillé', 'Sucré', 'Enveloppant']
    },
    {
      img: 'assets/img/club-de-nuit.jpg',
      alt: 'Club de Nuit Intense Man d\'Armaf, flacon noir et son étui bleu nuit',
      name: 'Club de Nuit Intense Man',
      house: 'Armaf',
      family: 'Fruité boisé',
      desc: "Le classique que tout le monde reconnaît à trois mètres. Ouverture fruitée, fond fumé, présence immédiate.",
      notes: ['Fruité', 'Fumé', 'Signature']
    },
    {
      img: 'assets/img/vulcan.jpg',
      alt: 'Vulcan de French Avenue, flacon bleu ceinturé d\'un serpent doré',
      name: 'Vulcan',
      house: 'French Avenue',
      family: 'Bleu minéral',
      desc: "Un bleu franc, un serpent d'or enroulé autour du flacon. La pièce que l'on regarde avant même de la sentir.",
      notes: ['Frais', 'Vif', 'Contrasté']
    },
    {
      img: 'assets/img/liquid-brun.jpg',
      alt: 'Liquid Brun, flacon bordeaux à facettes et capuchon doré',
      name: 'Liquid Brun',
      house: 'Maison Alhambra',
      family: 'Ambré profond',
      desc: "Bordeaux et or, taillé comme un carafon. On le sort le soir, quand le froid tombe sur l'avenue.",
      notes: ['Chaud', 'Boisé', 'Nocturne']
    },
    {
      img: 'assets/img/prive-blue.jpg',
      alt: 'Prive Blue, flacon bleu profond en forme de bouteille',
      name: 'Prive Blue',
      house: 'Prive',
      family: 'Bleu net',
      desc: "Une silhouette de bouteille, un bleu de nuit profond. Le geste propre, celui que l'on porte au bureau comme en terrasse.",
      notes: ['Aquatique', 'Net', 'Élégant']
    },
    {
      img: 'assets/img/her-confession.jpg',
      alt: 'Her Confession, buste sculpté blanc et or posé devant son coffret',
      name: 'Her Confession',
      house: 'French Avenue',
      family: 'Floral lumineux',
      desc: "Un buste sculpté, blanc et or, plus proche de l'objet de décoration que du simple flacon. Le cadeau qui se remarque.",
      notes: ['Floral', 'Poudré', 'Lumineux']
    }
  ];

  (function ring() {
    var stage = $('#stage'), ringEl = $('#ring');
    if (!stage || !ringEl) return;

    var cap = $('#ringCaption'), dots = $('#ringDots');
    var n = CERCLE.length, step = 360 / n, index = 0, radius = 0;

    CERCLE.forEach(function (item, i) {
      var fig = document.createElement('figure');
      fig.className = 'fig';
      fig.setAttribute('data-i', i);
      fig.innerHTML =
        '<img src="' + item.img + '" alt="' + item.alt + '" loading="lazy" draggable="false">' +
        '<figcaption class="fig__tag">' + item.house + '</figcaption>';
      ringEl.appendChild(fig);

      var d = document.createElement('button');
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', item.name);
      d.addEventListener('click', function () { goTo(i); });
      dots.appendChild(d);
    });

    var figs = $$('.fig', ringEl);

    function layout() {
      var vw = window.innerWidth;
      var cardw = clamp(vw * 0.22, 155, 250);
      var cardh = cardw * 1.42;
      ringEl.style.setProperty('--cardw', cardw + 'px');
      ringEl.style.setProperty('--cardh', cardh + 'px');
      radius = Math.round((cardw / 2) / Math.tan(Math.PI / n) * 1.62);
      figs.forEach(function (f, i) {
        f.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + radius + 'px)';
      });
      render();
    }

    function render() {
      ringEl.style.transform = 'translateZ(-' + radius + 'px) rotateY(' + (-index * step) + 'deg)';
      var active = ((index % n) + n) % n;
      figs.forEach(function (f, i) { f.classList.toggle('is-active', i === active); });
      $$('button', dots).forEach(function (d, i) { d.classList.toggle('is-on', i === active); });
      paintCaption(CERCLE[active]);
    }

    var capTimer;
    function paintCaption(item) {
      if (cap.getAttribute('data-name') === item.name) return;
      cap.setAttribute('data-name', item.name);
      cap.classList.add('is-swap');
      clearTimeout(capTimer);
      capTimer = setTimeout(function () {
        $('.cercle__family', cap).textContent = item.family;
        $('.cercle__name', cap).textContent = item.name;
        $('.cercle__desc', cap).textContent = item.desc;
        $('.cercle__notes', cap).innerHTML = item.notes.map(function (x) { return '<li>' + x + '</li>'; }).join('');
        cap.classList.remove('is-swap');
      }, reduced ? 0 : 260);
    }

    function goTo(target) {
      var active = ((index % n) + n) % n;
      var diff = target - active;
      if (diff > n / 2) diff -= n;
      if (diff < -n / 2) diff += n;
      index += diff;
      render();
      pause();
    }
    function move(d) { index += d; render(); pause(); }

    $('#ringPrev').addEventListener('click', function () { move(-1); });
    $('#ringNext').addEventListener('click', function () { move(1); });
    figs.forEach(function (f) {
      f.addEventListener('click', function () { goTo(parseInt(f.getAttribute('data-i'), 10)); });
    });

    /* glisser-déposer */
    var dragging = false, startX = 0, startIdx = 0, moved = 0;
    function down(x) { dragging = true; startX = x; startIdx = index; moved = 0; ringEl.classList.add('is-dragging'); pause(); }
    function movePtr(x) {
      if (!dragging) return;
      moved = x - startX;
      var frac = -moved / 180;
      ringEl.style.transform = 'translateZ(-' + radius + 'px) rotateY(' + (-(startIdx + frac) * step) + 'deg)';
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      ringEl.classList.remove('is-dragging');
      index = Math.round(startIdx - moved / 180);
      render();
    }
    stage.addEventListener('mousedown', function (e) { e.preventDefault(); down(e.clientX); });
    window.addEventListener('mousemove', function (e) { movePtr(e.clientX); });
    window.addEventListener('mouseup', up);
    stage.addEventListener('touchstart', function (e) { down(e.touches[0].clientX); }, { passive: true });
    stage.addEventListener('touchmove', function (e) {
      if (dragging && Math.abs(e.touches[0].clientX - startX) > 8) e.preventDefault();
      movePtr(e.touches[0].clientX);
    }, { passive: false });
    stage.addEventListener('touchend', up);

    /* clavier */
    stage.setAttribute('tabindex', '0');
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { move(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { move(1); e.preventDefault(); }
    });

    /* dérive automatique */
    var auto = null, idle = null;
    function play() { if (reduced || auto) return; auto = setInterval(function () { index += 1; render(); }, 5200); }
    function stop() { clearInterval(auto); auto = null; }
    function pause() { stop(); clearTimeout(idle); idle = setTimeout(play, 9000); }

    stage.addEventListener('mouseenter', stop);
    stage.addEventListener('mouseleave', function () { if (!dragging) pause(); });

    var vio = new IntersectionObserver(function (e) { e[0].isIntersecting ? play() : stop(); }, { threshold: 0.25 });
    vio.observe(stage);

    window.addEventListener('resize', layout);
    layout();
  })();

  /* ---------------------------------------------------------
     11. Pyramide olfactive
     --------------------------------------------------------- */
  (function pyramide() {
    var wrap = $('#layers'), pyr = $('#pyr');
    if (!wrap || !pyr) return;
    var btns = $$('.layer', wrap);
    var faces = $$('.pyr__face', pyr);
    var labels = $$('.pyr__labels text', pyr);

    function light(key) {
      btns.forEach(function (b) {
        var on = b.getAttribute('data-layer') === key;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-expanded', String(on));
      });
      faces.forEach(function (f) { f.classList.toggle('is-lit', f.getAttribute('data-face') === key); });
      labels.forEach(function (l) { l.classList.toggle('is-lit', l.getAttribute('data-face') === key); });
    }

    btns.forEach(function (b) {
      var k = b.getAttribute('data-layer');
      b.addEventListener('click', function () { light(k); });
      b.addEventListener('mouseenter', function () { light(k); });
    });
    faces.forEach(function (f) {
      f.style.cursor = 'pointer';
      f.addEventListener('mouseenter', function () { light(f.getAttribute('data-face')); });
      f.addEventListener('click', function () { light(f.getAttribute('data-face')); });
    });
    light('tete');
  })();

  /* ---------------------------------------------------------
     12. Lightbox
     --------------------------------------------------------- */
  (function lightbox() {
    var lb = $('#lightbox'), img = $('#lbImg'), cap = $('#lbCap'), close = $('#lbClose');
    if (!lb) return;
    $$('[data-lightbox]').forEach(function (fig) {
      fig.addEventListener('click', function () {
        var src = $('img', fig);
        img.src = src.src; img.alt = src.alt;
        cap.textContent = ($('figcaption', fig) || {}).textContent || '';
        lb.classList.add('is-open');
        lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        close.focus();
      });
    });
    function shut() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    close.addEventListener('click', shut);
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') shut(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { shut(); if (drawer.classList.contains('is-open')) toggleDrawer(false); }
    });
  })();

  /* ---------------------------------------------------------
     13. Horaires : jour courant + état ouvert/fermé (Europe/Paris)
     --------------------------------------------------------- */
  (function horaires() {
    var badge = $('#openBadge');
    if (!badge) return;

    // Créneaux en minutes depuis minuit, heure de Paris. Dimanche fermé.
    var SLOTS = [[630, 810], [870, 1170]]; // 10:30–13:30 · 14:30–19:30
    var DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

    function parisNow() {
      var f = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      });
      var parts = {};
      f.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: map[parts.weekday], mins: parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10) };
    }

    function hhmm(m) {
      return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    }

    function update() {
      var now;
      try { now = parisNow(); }
      catch (e) { var d = new Date(); now = { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() }; }

      $$('#hours tr').forEach(function (tr) {
        tr.classList.toggle('is-today', parseInt(tr.getAttribute('data-day'), 10) === now.day);
      });

      var open = false, next = null;
      if (now.day !== 0) {
        SLOTS.forEach(function (s) {
          if (now.mins >= s[0] && now.mins < s[1]) { open = true; next = s[1]; }
        });
        if (!open) {
          for (var i = 0; i < SLOTS.length; i++) {
            if (now.mins < SLOTS[i][0]) { next = SLOTS[i][0]; break; }
          }
        }
      }

      var label;
      badge.classList.remove('is-open', 'is-closed');
      if (open) {
        badge.classList.add('is-open');
        label = 'Ouvert · ferme à ' + hhmm(next);
      } else {
        badge.classList.add('is-closed');
        if (now.day === 0) label = 'Fermé · réouvre lundi 10:30';
        else if (next !== null) label = 'Fermé · ouvre à ' + hhmm(next);
        else {
          var d2 = (now.day + 1) % 7;
          label = 'Fermé · réouvre ' + (d2 === 0 ? 'lundi' : DAYS[d2]) + ' 10:30';
        }
      }
      $('span', badge).textContent = label;
      badge.setAttribute('title', label);
    }

    update();
    setInterval(update, 60000);
  })();

  /* ---------------------------------------------------------
     14. Boutons magnétiques
     --------------------------------------------------------- */
  if (!coarse && !reduced) {
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2;
        var my = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + (mx * 0.22).toFixed(1) + 'px,' + (my * 0.3).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------
     15. Divers
     --------------------------------------------------------- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

})();
