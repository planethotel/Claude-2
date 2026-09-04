# Cordonnerie Bonnet — site vitrine

Site vitrine de la **Cordonnerie Bonnet**, artisan cordonnier au 31 boulevard
Heurteloup à Tours. Pièce maîtresse : un soulier en 3D entièrement construit
par le code, qui se démonte pièce par pièce au fil du défilement, et un
comparateur « avant / après » où le même soulier est rendu deux fois — usé à
gauche, restauré à droite.

## Ouvrir le site

Aucune compilation, aucun compte, aucune dépendance à installer. Il suffit d'un
petit serveur local (les modules JavaScript ne fonctionnent pas en `file://`) :

```bash
npx serve .          # puis http://localhost:3000
# ou
python3 -m http.server 8000
```

Pour la mise en ligne : déposez le dossier tel quel chez n'importe quel
hébergeur statique (OVH, Netlify, GitHub Pages, Infomaniak…). Rien d'autre à
configurer.

## Ce qu'il y a dans le dossier

```
index.html              la page entière
css/style.css           l'habillage : cuir tanné, laiton, parchemin
css/fonts.css           les polices, hébergées sur le site
js/data.js              ← TOUT LE CONTENU MODIFIABLE EST ICI
js/dessins.js           les dessins au trait de la boutique
js/shoe.js              le soulier 3D : forme, cuirs, semelle, laçage
js/hero.js              la scène d'accueil et le démontage au défilement
js/compare.js           le comparateur avant / après en volume
js/main.js              l'assemblage de la page
vendor/                 three.js (copie locale, licence MIT incluse)
assets/fonts/           Bodoni Moda et Jost (licence SIL OFL incluse)
assets/avant-apres/     visuels provisoires, à remplacer par vos photos
```

## Modifier le contenu

Tout le texte, les horaires, les prestations et les articles de la boutique
sont réunis dans **`js/data.js`**. Ouvrez ce fichier dans un éditeur de texte,
changez ce qu'il faut, enregistrez : le site est à jour.

### Les horaires, l'adresse, le téléphone
Bloc `MAISON`, en haut du fichier. Le jour en cours est mis en évidence
automatiquement dans le tableau des horaires.

### Les prestations
Tableau `PRESTATIONS`. Chaque ligne comporte une catégorie (`cat`), un nom et
une description. Les filtres au-dessus de la liste se construisent tout seuls à
partir des catégories : ajoutez une nouvelle catégorie, un nouveau bouton
apparaît.

### La boutique
Objet `BOUTIQUE`, deux rayons : `seconde-vie` et `accessoires`. Pour chaque
article :

| champ    | à quoi ça sert                                                    |
|----------|-------------------------------------------------------------------|
| `nom`    | le titre de la fiche                                              |
| `detail` | la ligne de description (matière, montage…)                       |
| `taille` | pointure ou contenance                                            |
| `etat`   | l'étiquette en haut à droite de la vignette                       |
| `prix`   | affiché tel quel — voir la note ci-dessous                        |
| `teinte` | la couleur du fond de la vignette (code hexadécimal)              |
| `dessin` | le dessin au trait, parmi la liste ci-dessous                     |

Dessins disponibles : `richelieu`, `derby`, `brogue`, `chelsea`, `bottine`,
`mocassin`, `creme`, `cirage`, `brosse`, `embauchoir`, `flacon`, `lacets`,
`vaporisateur`, `semelleConfort`.

> **À compléter :** les articles fournis sont des exemples de mise en page, et
> tous les prix affichent « Prix en boutique ». Remplacez-les par votre stock
> réel et vos tarifs. Je n'ai pas inventé de prix : mieux vaut un site sans
> tarif qu'un site avec un tarif faux.

### Avant / après
Tableau `AVANT_APRES`. Chaque entrée pointe vers deux images. Les fichiers
livrés dans `assets/avant-apres/` sont des **visuels provisoires** qui portent
la mention « à remplacer ». Déposez vos photos dans ce dossier et changez les
chemins :

```js
{
  titre: 'Richelieu noir — ressemelage cuir',
  texte: 'Semelle percée, bonbouts effondrés. Démontage complet…',
  avant: 'assets/avant-apres/ma-photo-avant.jpg',
  apres: 'assets/avant-apres/ma-photo-apres.jpg'
}
```

Pour un bon résultat : mêmes cadrage, même lumière et même fond sur les deux
photos, format paysage, environ 1600 × 1200 px. Le curseur se fait glisser à la
souris ou au doigt.

## Le formulaire de contact

Le site est entièrement statique : le formulaire prépare un e-mail dans la
messagerie du visiteur (`mailto:`) plutôt que d'envoyer quoi que ce soit à un
serveur. L'adresse utilisée est `contact@cordonnerie-bonnet.fr`, à corriger
dans `js/main.js` (fonction `formulaire`) si ce n'est pas la bonne.

Pour recevoir les demandes directement par e-mail sans passer par la messagerie
du visiteur, il faut un service d'envoi (Formspree, Netlify Forms, Web3Forms…) :
c'est une ligne à changer dans la même fonction.

## Choix techniques

- **Aucune requête vers l'extérieur.** three.js, les polices et les images sont
  servis par le site lui-même. Rien ne part chez Google ni sur un CDN : c'est
  plus rapide, et cela évite la question du RGPD sur les polices Google.
- **Le soulier 3D n'est pas un fichier téléchargé.** La forme est décrite par
  des courbes (largeur, hauteur et ouverture le long du pied), la semelle et le
  talon empilé sont extrudés depuis ce contour, le laçage suit les œillets, et
  les cuirs sont peints à la volée sur des `canvas` — patine plus sombre au
  talon et au bout, glaçage, coutures, perforations. Tout se règle en haut de
  `js/shoe.js`.
- **Sobriété.** Les scènes 3D se mettent en pause dès qu'elles sortent de
  l'écran, la résolution est plafonnée, et le comparateur ne démarre pas si le
  visiteur a demandé à son système de réduire les animations.
- **Accessibilité.** Navigation au clavier, lien d'évitement, curseur avant /
  après pilotable aux flèches, textes alternatifs, contrastes soutenus.

## Licences

- three.js — MIT (`vendor/three-LICENSE.txt`)
- Bodoni Moda, Jost — SIL Open Font License (`assets/fonts/LICENSE-*.txt`)
