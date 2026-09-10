# Mystère Fragrances — site web

Site vitrine de la parfumerie **Mystère Fragrances — D'ici et d'ailleurs**,
42 avenue de Grammont, 37000 Tours.

HTML / CSS / JavaScript natifs. **Aucune dépendance, aucun build, aucun framework.**
Il suffit d'ouvrir `index.html` ou de déposer le dossier sur un hébergeur.

---

## Contenu

```
index.html            La page complète
assets/css/style.css  Styles, animations, responsive
assets/js/main.js     Interactions (carrousel 3D, horaires, révélations…)
assets/img/           Photos de la boutique, recadrées et optimisées
```

## Les sections

| # | Section | Ce qu'elle fait |
|---|---------|-----------------|
| — | **Voile d'ouverture** | Le nom se compose lettre à lettre, puis le voile se lève |
| — | **Héro** | Devanture de nuit en parallaxe + Ken Burns, poussière d'or animée sur canvas, titre lettre à lettre |
| 01 | **L'Essence** | Texte de présentation, photos avec rideau de révélation, compteurs animés |
| 02 | **Le Cercle** | Carrousel **3D** des flacons — les vraies photos de la boutique tournent en cercle. Glisser à la souris ou au doigt, flèches, pastilles, flèches du clavier, dérive automatique |
| 03 | **Pyramide olfactive** | Tête / cœur / fond, interactive au survol et au clic, avec volutes animées |
| 04 | **La Boutique** | Mosaïque de photos + visionneuse plein écran |
| 05 | **Avis** | Note 5,0 et synthèse des avis Google |
| 06 | **Nous trouver** | Horaires avec **badge Ouvert/Fermé calculé en direct** (heure de Paris), adresse, téléphone, TikTok, carte stylisée |

## Coordonnées inscrites dans le site

- **Adresse** — 42 avenue de Grammont, 37000 Tours
- **Téléphone** — 09 63 26 33 93 (cliquable sur mobile via `tel:`)
- **TikTok** — [@mysterefragrances.37](https://www.tiktok.com/@mysterefragrances.37)
- **Horaires** — lundi au samedi, 10:30–13:30 et 14:30–19:30 · dimanche fermé

Ces informations apparaissent aussi en **données structurées Schema.org**
(`PerfumeStore`) dans le `<head>` : Google peut les afficher directement
dans les résultats de recherche.

---

## Modifier le contenu

**Horaires** — le tableau se trouve dans `index.html` (section « Nous trouver »).
Si les créneaux changent, pensez à mettre à jour **aussi** la constante `SLOTS`
dans `assets/js/main.js` (minutes depuis minuit : `[[630, 810], [870, 1170]]`)
et le bloc `openingHoursSpecification` du `<head>` — c'est ce qui alimente le
badge « Ouvert / Fermé » et le référencement.

**Les parfums du Cercle** — tableau `CERCLE` en haut de la partie carrousel
dans `assets/js/main.js`. Chaque entrée prend une image, un nom, une maison,
une famille, une description et trois mots-clés. Les descriptions actuelles
sont des impressions rédigées d'après les photos, pas des fiches techniques :
**à relire et à ajuster selon votre stock réel.**

**Photos** — déposez les nouvelles images dans `assets/img/` et changez les
chemins. Format conseillé : JPEG, 1400 px de large environ.

---

## Mettre en ligne

Le site est entièrement statique. Au choix :

- **Netlify / Vercel** — glisser-déposer le dossier, c'est en ligne.
- **GitHub Pages** — activer Pages sur la branche voulue, racine `/`.
- **Hébergement classique (OVH, Ionos…)** — envoyer le dossier en FTP.

Aucune configuration serveur n'est nécessaire.

---

## Détails techniques

- Responsive de 320 px à 4K, aucun défilement horizontal.
- `prefers-reduced-motion` respecté : toutes les animations se coupent pour
  les personnes qui en font la demande dans leur système.
- Navigation au clavier sur le carrousel (flèches ← →) et la visionneuse (Échap).
- Textes alternatifs sur toutes les images, libellés ARIA sur les commandes.
- Deux polices Google Fonts (Cormorant Garamond, Jost) avec repli système.
