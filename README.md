# Cordonnerie Bonnet — site vitrine

Refonte du site de la **Cordonnerie Bonnet**, artisan cordonnier au 31 boulevard
Heurteloup à Tours. Le contenu reprend le site existant ; la mise en scène est
neuve, avec un soulier en 3D entièrement construit par le code, qui se démonte
au fil du défilement, et un comparateur avant / après où le même soulier est
rendu deux fois — usé à gauche, restauré à droite.

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
js/dessins.js           les dessins au trait du catalogue
js/shoe.js              le soulier 3D : forme, cuirs, semelle, talon, laçage
js/hero.js              l'accueil et le démontage au défilement
js/compare.js           le comparateur avant / après en volume
js/main.js              l'assemblage de la page
vendor/                 three.js (copie locale, licence MIT incluse)
assets/fonts/           Bodoni Moda et Jost (licence SIL OFL incluse)
assets/avant-apres/     visuels provisoires, à remplacer par vos photos
```

---

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

`GALERIE` et `AVANT_APRES` fonctionnent pareil : tant qu'une entrée n'a pas de
`photo`, un cadre légendé « photo à ajouter » prend sa place. Déposez vos images
dans `assets/` et indiquez le chemin :

```js
{ titre: 'Bottines cuir brun', note: 'Semelle neuve',
  photo: 'assets/galerie/bottines.jpg', format: 'haut' }
```

`format: 'haut'` fait occuper deux rangées à la vignette, pour aérer la grille.

Pour l'avant / après, deux images par bloc. **Même cadrage, même lumière, même
fond sur les deux prises de vue** : c'est ce qui rend la comparaison lisible.
Format paysage, environ 1600 × 1200 px.

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
3. **Un vrai comparateur avant / après** au curseur, au lieu d'un accordéon.
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

- **Aucune requête vers l'extérieur.** three.js, les polices et les images sont
  servis par le site lui-même. Rien ne part chez Google ni sur un CDN : c'est
  plus rapide, et cela règle la question du RGPD sur les polices Google.
- **Le soulier 3D n'est pas un fichier téléchargé.** La forme est décrite par des
  courbes (largeur, hauteur et ouverture du col le long du pied), la semelle et
  le talon empilé sont extrudés depuis ce contour, le laçage suit les œillets, et
  les cuirs sont peints à la volée sur des `canvas` — patine plus sombre au talon
  et au bout, glaçage, coutures, perforations. Tout se règle en haut de
  `js/shoe.js`.
- **Sobriété.** Les scènes 3D se mettent en pause dès qu'elles sortent de l'écran,
  la résolution est plafonnée, et le comparateur ne démarre pas si le visiteur a
  demandé à son système de réduire les animations. Le site pèse environ 1 Mo.
- **Accessibilité.** Navigation au clavier, lien d'évitement, curseur avant/après
  pilotable aux flèches, textes alternatifs, contrastes soutenus.

## Licences

- three.js — MIT (`vendor/three-LICENSE.txt`)
- Bodoni Moda, Jost — SIL Open Font License (`assets/fonts/LICENSE-*.txt`)
