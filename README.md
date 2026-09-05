# Cordonnerie Bonnet — site vitrine

Refonte du site de la **Cordonnerie Bonnet**, artisan cordonnier au 31 boulevard
Heurteloup à Tours. Le site est construit autour des photographies de l'atelier :
elles mènent la page, le texte les accompagne.

La pièce maîtresse est le **fondu avant / après** : deux vraies photos d'une
même paire, la restaurée apparaissant sur l'usée par un balayage au front
irrégulier — le geste du chiffon. C'est du WebGL écrit à la main, une centaine
de lignes, sans aucune bibliothèque.

## Ouvrir le site

Aucune compilation, aucun compte, aucune dépendance à installer. Il faut
seulement un petit serveur local (les modules JavaScript ne fonctionnent pas
en `file://`) :

```bash
npx serve .          # puis http://localhost:3000
# ou
python3 -m http.server 8000
```

Mise en ligne : déposez le dossier tel quel chez n'importe quel hébergeur
statique (OVH, Infomaniak, Netlify, GitHub Pages…). Rien d'autre à configurer.

## Ce qu'il y a dans le dossier

```
index.html              la page entière + la fiche établissement pour Google
css/style.css           l'habillage : noir · blanc · cuir
css/fonts.css           les polices, hébergées sur le site
js/data.js              ← TOUT LE CONTENU MODIFIABLE EST ICI
js/transition.js        le fondu avant / après (WebGL, sans bibliothèque)
js/anim.js              parallaxe, apparitions, plein écran
js/dessins.js           les dessins au trait du catalogue
js/main.js              l'assemblage de la page
assets/fonts/           Bodoni Moda et Jost (licence SIL OFL incluse)
assets/photos/          ← VOS PHOTOS VONT ICI
```

Le site ne pèse que quelques centaines de kilo-octets, polices comprises :
aucune bibliothèque JavaScript, aucun CDN, aucune image de synthèse.

---

## Déposer vos photos

Tout part de là. Le dossier `assets/photos/` attend :

```
assets/photos/
  devanture.jpg              la vitrine, vue de la rue         (paysage, ≥ 2000 px)
  atelier-1.jpg              l'intérieur, le mur vert canard   (portrait)
  atelier-2.jpg              le comptoir et les rayonnages     (paysage)
  artisan.jpg                vous, à l'établi                  (portrait)
  galerie/01.jpg … 10.jpg    vos photos de paires
  avant-apres/01-avant.jpg   et 01-apres.jpg, 02-avant.jpg, 02-apres.jpg…
  boutique/                  les produits, si vous en avez
```

**L'extension n'a pas d'importance** : `.jpg`, `.jpeg`, `.png` ou `.webp`
fonctionnent, le site essaie les quatre. Et une photo manquante ne casse rien :
un cadre légendé prend sa place, en indiquant précisément quelle image doit
venir là.

Pour l'avant / après : **même cadrage, même lumière, même fond** sur les deux
prises de vue. C'est ce qui rend la comparaison lisible — et le fondu propre.

Les titres et légendes des photos se règlent dans `js/data.js`, blocs `PHOTOS`,
`GALERIE` et `AVANT_APRES`.

## Modifier le contenu — `js/data.js`

Tout le texte du site tient dans ce seul fichier. Ouvrez-le dans un éditeur de
texte, changez ce qu'il faut, enregistrez : le site est à jour.

### Le bandeau rouge d'annonce

```js
export const ANNONCE = {
  actif: true,
  texte: 'Votre cordonnerie sera fermée du 01 au 31 août 2026.',
  jusquau: '2026-08-31'
};
```

**Il disparaît tout seul** le lendemain de `jusquau`. Plus besoin d'y penser :
sur l'ancien site, l'annonce de la fermeture d'août était encore affichée en
septembre. Pour la prochaine fermeture, changez le texte et la date.

### Coordonnées et horaires — bloc `MAISON`

Adresse, téléphone, e-mail, Facebook, Instagram, horaires. Le jour en cours est
mis en évidence automatiquement dans le tableau.

> Si vous changez les horaires, pensez aussi à la fiche `application/ld+json`
> en haut de `index.html` : c'est elle que Google lit pour afficher vos horaires
> dans les résultats de recherche.

### Prestations

Tableau `PRESTATIONS` : une catégorie (`cat`), un nom, une description. Les
filtres au-dessus de la liste se construisent tout seuls à partir des
catégories — ajoutez-en une, un nouveau bouton apparaît.

### Boutique — trois rayons

Objet `BOUTIQUE`, avec `entretien`, `accessoires` et `seconde-vie`, comme sur
votre site. Pour chaque article :

| champ       | à quoi ça sert                                              |
|-------------|-------------------------------------------------------------|
| `nom`       | le titre de la fiche                                        |
| `marque`    | Saphir, Collonil… affiché en petites capitales au-dessus     |
| `desc`      | la description — **toujours visible**, plus cachée derrière un chevron |
| `taille`    | pointure (rayon Seconde vie)                                |
| `statut`    | `'Disponible'` ou `'Vendu'` — le badge doré s'adapte         |
| `precision` | mention discrète après le nom (« pour Diehl & Diehl »)       |
| `dessin`    | le dessin au trait, parmi la liste ci-dessous               |
| `photo`     | chemin d'une photo — elle **remplace** le dessin            |

Dessins disponibles : `richelieu`, `derby`, `brogue`, `chelsea`, `bottine`,
`mocassin`, `escarpin`, `sac`, `creme`, `pate`, `flacon`, `vaporisateur`,
`savon`, `gomme`, `brosse`, `brosseNubuck`, `palot`, `tendeur`, `decrottoir`,
`embauchoir`, `premiere`, `chaussette`.

**Le stock tourne** : pour retirer une paire vendue, passez son `statut` à
`'Vendu'` ou supprimez sa ligne. Pour en ajouter une, copiez une ligne existante.

Aucun prix n'est affiché, comme sur votre site actuel : la vente se fait en
boutique. Si vous voulez en afficher un jour, dites-le moi, c'est une ligne à
ajouter.

### Galerie et Avant / Après

`format: 'haut'` fait occuper deux rangées à une vignette de la galerie, pour
aérer la grille. Dans `AVANT_APRES`, chaque cas porte un `titre` et un `geste`
(ce que vous avez fait) : ils s'affichent sous le fondu. Un cas dont les deux
photos manquent est simplement ignoré.

### L'artisan

Le site actuel n'a pas de page « à propos » : le texte de la section
**L'artisan** est donc une proposition écrite dans votre ton, à relire et à
remplacer par vos mots. Ajoutez `photo:` dans le bloc `ARTISAN` pour votre
portrait à l'établi.

---

## Le formulaire de devis

Le site est entièrement statique : le formulaire prépare un e-mail dans la
messagerie du visiteur (`mailto:` vers `cordonneriebonnet@gmail.com`) plutôt que
d'envoyer quoi que ce soit à un serveur. Rien n'est enregistré nulle part.

Pour recevoir les demandes directement, sans passer par la messagerie du
visiteur, il faut un service d'envoi (Formspree, Netlify Forms, Web3Forms…) :
c'est une ligne à changer dans la fonction `formulaire` de `js/main.js`.

## Ce qui a été repris de l'ancien site

Le nom, le monogramme **R/B** et le wordmark espacé ; le ton à la première
personne et le vocabulaire d'atelier (tige, trépointe, embauchoir, glaçage,
patin) ; les quatre métiers et la phrase « donne une seconde vie aux chaussures
habillées et décontractées » ; le contraste noir / blanc / cuir ; la logique
Boutique → Entretien / Accessoires / Seconde vie ; les 23 produits d'entretien,
les 9 accessoires et les 6 paires de seconde vie, avec leurs descriptions.

## Ce qui a été corrigé

1. **Une vraie page de prestations** — 15 interventions détaillées et filtrables,
   au lieu de quatre lignes sur l'accueil.
2. **Un formulaire de demande de devis**, qui n'existait pas.
3. **Un vrai avant / après** : la photo restaurée apparaît sur l'usée par un
   balayage, au défilement ou au curseur — au lieu d'un accordéon.
4. **Les descriptions produits sont visibles**, plus cachées derrière un chevron :
   elles se lisent d'un coup d'œil, et Google les indexe.
5. **Référencement** — titre et description propres, URL canonique, balises Open
   Graph, et une fiche `LocalBusiness` structurée (adresse, téléphone, horaires)
   pour l'affichage dans les résultats de recherche.
6. **Le bandeau d'annonce expire tout seul** à la date indiquée.
7. **Une section « L'artisan »**, qui manquait complètement.
8. **Des mentions légales** en pied de page (quelques champs restent à compléter :
   SIRET, hébergeur).

## Choix techniques

- **Aucune requête vers l'extérieur.** Les polices et les images sont servies par
  le site lui-même, et il n'y a aucune bibliothèque à charger. Rien ne part chez
  Google ni sur un CDN : c'est plus rapide, et cela règle la question du RGPD sur
  les polices Google.
- **Aucune image de synthèse.** Ce que le visiteur voit, ce sont vos photos.
  Le seul calcul graphique est le fondu avant / après : un nuanceur qui mélange
  deux photographies, écrit à la main dans `js/transition.js`. Si la carte
  graphique fait défaut, le site retombe sur un fondu enchaîné classique.
- **Sobriété.** Les animations se mettent en pause dès qu'elles quittent l'écran,
  la résolution est plafonnée, les photos se chargent à la demande, et tout
  mouvement s'arrête si le visiteur a demandé à son système de réduire les
  animations.
- **Accessibilité.** Navigation au clavier, lien d'évitement, curseur avant/après
  pilotable aux flèches, textes alternatifs, contrastes soutenus.

## Licences

- Bodoni Moda, Jost — SIL Open Font License (`assets/fonts/LICENSE-*.txt`)
- Aucune autre dépendance.
