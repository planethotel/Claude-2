/* =========================================================================
   Cordonnerie Bonnet — données éditables
   Tout le contenu textuel du site est centralisé ici.
   Modifiez ce fichier pour mettre le site à jour, sans toucher au reste.
   ========================================================================= */

export const MAISON = {
  nom: 'Cordonnerie Bonnet',
  artisan: 'Rémi Bonnet',
  baseline: 'Cordonnerie traditionnelle',
  ville: 'Tours',
  depuis: '2024',
  adresse: {
    rue: '31 boulevard Heurteloup',
    cp: '37000',
    ville: 'Tours',
    quartier: 'La Fuye · Velpeau'
  },
  tel: '02 47 47 07 82',
  telLien: '+33247470782',
  site: 'https://www.cordonnerie-bonnet.fr',
  maps: 'https://www.google.com/maps/search/?api=1&query=Cordonnerie+Bonnet+31+boulevard+Heurteloup+37000+Tours',
  horaires: [
    { j: 'Lundi',    h: 'Fermé', ferme: true },
    { j: 'Mardi',    h: '9h – 12h30 · 13h30 – 19h' },
    { j: 'Mercredi', h: '9h – 12h30 · 13h30 – 19h' },
    { j: 'Jeudi',    h: '9h – 12h30 · 13h30 – 19h' },
    { j: 'Vendredi', h: '9h – 12h30 · 13h30 – 19h' },
    { j: 'Samedi',   h: '10h – 12h30 · 13h30 – 18h' },
    { j: 'Dimanche', h: 'Fermé', ferme: true }
  ]
};

/* ------------------------------------------------------------------ */
/* Les quatre piliers du métier, tels qu'annoncés par l'atelier        */
/* ------------------------------------------------------------------ */
export const PILIERS = [
  {
    num: 'I',
    titre: 'Réparation & amélioration',
    texte: "Ressemelage cuir ou gomme, patins de protection, bonbouts, remise en forme, " +
           "remplacement des œillets et des crochets. On répare, puis on améliore : une " +
           "chaussure ressort de l'atelier plus solide qu'elle n'y est entrée."
  },
  {
    num: 'II',
    titre: 'Entretien du cuir & maroquinerie',
    texte: "Nettoyage en profondeur, nourrissage, teinture, glaçage, patine. Sacs, ceintures, " +
           "blousons, selles, bagages : tout ce qui est cuir se soigne, se recolore et se répare."
  },
  {
    num: 'III',
    titre: 'Produits & accessoires',
    texte: "Crèmes et cirages de qualité professionnelle, brosses en crin, embauchoirs en cèdre, " +
           "lacets, semelles de confort. Les mêmes produits que ceux utilisés à l'établi."
  },
  {
    num: 'IV',
    titre: 'Seconde vie',
    texte: "Sélection de chaussures haut de gamme, réparées, reconditionnées et entretenues à " +
           "l'atelier. Des souliers de grande facture, remis en état de marche, à un prix juste."
  }
];

/* ------------------------------------------------------------------ */
/* Prestations détaillées                                              */
/* ------------------------------------------------------------------ */
export const PRESTATIONS = [
  { cat: 'Chaussure', nom: 'Ressemelage cuir',        desc: 'Semelle cuir pleine fleur, cousue ou collée selon le montage d’origine.' },
  { cat: 'Chaussure', nom: 'Ressemelage gomme',       desc: 'Gomme naturelle ou crantée, pour l’adhérence et l’usage quotidien.' },
  { cat: 'Chaussure', nom: 'Talons & bonbouts',       desc: 'Remplacement des bonbouts, reconstruction du talon empilé.' },
  { cat: 'Chaussure', nom: 'Patins de protection',    desc: 'Posés à neuf, ils doublent la durée de vie d’une semelle cuir.' },
  { cat: 'Chaussure', nom: 'Élargissement & mise en forme', desc: 'Détente sur forme pour gagner en confort sans abîmer le cuir.' },
  { cat: 'Chaussure', nom: 'Œillets, crochets, coutures', desc: 'Reprise des points ouverts, remplacement de la petite quincaillerie.' },
  { cat: 'Cuir',      nom: 'Teinture & recoloration', desc: 'Reprise de teinte à l’identique ou changement de couleur complet.' },
  { cat: 'Cuir',      nom: 'Patine & glaçage',        desc: 'Nuances travaillées à la main, puis glaçage miroir sur bout et talon.' },
  { cat: 'Cuir',      nom: 'Nettoyage & nourrissage', desc: 'Décrassage, réhydratation, protection. Le cuir respire à nouveau.' },
  { cat: 'Maroquinerie', nom: 'Réparation de sacs',   desc: 'Anses, doublures, fermetures éclair, coins usés, fermoirs.' },
  { cat: 'Maroquinerie', nom: 'Ceintures & bracelets',desc: 'Mise à longueur, nouveaux perçages, remplacement de boucle.' },
  { cat: 'Maroquinerie', nom: 'Blousons & bagagerie', desc: 'Zips, doublures, angles renforcés, remise en teinte.' }
];

/* ------------------------------------------------------------------ */
/* Boutique — deux rayons, comme en vitrine                            */
/*  ⚠︎ Prix et photos : à compléter par l’atelier (voir README).        */
/* ------------------------------------------------------------------ */
export const BOUTIQUE = {
  'seconde-vie': {
    titre: 'Seconde vie',
    chapo: "Des souliers de grande facture, chinés puis entièrement repris à l’atelier : " +
           "démontage, nettoyage, ressemelage si nécessaire, patine et glaçage. " +
           "Chaque paire est unique — pointures indiquées, disponibilité en boutique.",
    articles: [
      { nom: 'Richelieu bout droit',   detail: 'Cuir de veau box · cousu Goodyear', taille: 'P. 42', etat: 'Ressemelé · patiné', prix: 'Prix en boutique', teinte: '#7a4520' , dessin: 'richelieu' },
      { nom: 'Derby cuir grainé',      detail: 'Veau grainé · semelle cuir',        taille: 'P. 43', etat: 'Reconditionné',       prix: 'Prix en boutique', teinte: '#4a3226' , dessin: 'derby' },
      { nom: 'Boots à élastiques',     detail: 'Chelsea · cuir lisse noir',         taille: 'P. 41', etat: 'Bonbouts neufs',      prix: 'Prix en boutique', teinte: '#2a2220' , dessin: 'chelsea' },
      { nom: 'Mocassin à pampilles',   detail: 'Veau velours · semelle gomme',      taille: 'P. 44', etat: 'Nettoyé · nourri',    prix: 'Prix en boutique', teinte: '#8a5a2c' , dessin: 'mocassin' },
      { nom: 'Bottine à lacets',       detail: 'Cuir cognac · couture trépointe',   taille: 'P. 39', etat: 'Patine cognac',       prix: 'Prix en boutique', teinte: '#94592a' , dessin: 'bottine' },
      { nom: 'Richelieu brogue',       detail: 'Perforations anglaises · cuir noir',taille: 'P. 40', etat: 'Glaçage miroir',      prix: 'Prix en boutique', teinte: '#34281f' , dessin: 'brogue' }
    ]
  },
  'accessoires': {
    titre: 'Accessoires & entretien',
    chapo: "La sélection de l’établi. Rien de décoratif : ce sont les produits et les outils " +
           "utilisés tous les jours à l’atelier, disponibles au comptoir.",
    articles: [
      { nom: 'Crème de cirage',        detail: 'Nourrit et recolore · large nuancier', taille: '50 ml',  etat: 'Toutes teintes',   prix: 'Prix en boutique', teinte: '#6d3d1c' , dessin: 'creme' },
      { nom: 'Cirage de glaçage',      detail: 'Pâte dure pour le brillant miroir',    taille: '50 ml',  etat: 'Noir · brun · neutre', prix: 'Prix en boutique', teinte: '#241d1a' , dessin: 'cirage' },
      { nom: 'Brosse en crin',         detail: 'Crin de cheval · dos en bois',         taille: '18 cm',  etat: 'Lustrage',         prix: 'Prix en boutique', teinte: '#a97b46' , dessin: 'brosse' },
      { nom: 'Embauchoirs cèdre',      detail: 'Cèdre rouge non verni · ressort',      taille: 'P. 39-46', etat: 'Absorbe l’humidité', prix: 'Prix en boutique', teinte: '#c09455' , dessin: 'embauchoir' },
      { nom: 'Lait nettoyant cuir',    detail: 'Décrasse sans agresser la fleur',      taille: '250 ml', etat: 'Cuirs lisses',     prix: 'Prix en boutique', teinte: '#8d6f4a' , dessin: 'flacon' },
      { nom: 'Lacets cirés',           detail: 'Coton ciré rond ou plat',              taille: '60 · 75 · 90 cm', etat: '8 coloris', prix: 'Prix en boutique', teinte: '#5b4632' , dessin: 'lacets' },
      { nom: 'Imperméabilisant',       detail: 'Cuirs lisses, grainés et velours',     taille: '200 ml', etat: 'Incolore',         prix: 'Prix en boutique', teinte: '#6b6f6a' , dessin: 'vaporisateur' },
      { nom: 'Semelles de confort',    detail: 'Cuir ou mousse à mémoire',             taille: 'À la pointure', etat: 'Découpées sur place', prix: 'Prix en boutique', teinte: '#9a7a52' , dessin: 'semelleConfort' }
    ]
  }
};

/* ------------------------------------------------------------------ */
/* Avant / Après — remplacez les chemins par vos propres photos        */
/* ------------------------------------------------------------------ */
export const AVANT_APRES = [
  {
    titre: 'Richelieu noir — ressemelage cuir',
    texte: 'Semelle percée, bonbouts effondrés. Démontage complet, semelle cuir neuve cousue, talon reconstruit, glaçage du bout.',
    avant: 'assets/avant-apres/paire-01-avant.svg',
    apres: 'assets/avant-apres/paire-01-apres.svg'
  },
  {
    titre: 'Derby cognac — patine & nourrissage',
    texte: 'Cuir desséché et griffé. Décrassage, réhydratation, reprise de teinte à la main, patine cognac et lustrage.',
    avant: 'assets/avant-apres/paire-02-avant.svg',
    apres: 'assets/avant-apres/paire-02-apres.svg'
  },
  {
    titre: 'Sac à main — anses et coins',
    texte: 'Anses fendues, coins usés jusqu’à la trame. Anses refaites en cuir pleine fleur, coins renforcés, teinte raccordée.',
    avant: 'assets/avant-apres/paire-03-avant.svg',
    apres: 'assets/avant-apres/paire-03-apres.svg'
  }
];

/* ------------------------------------------------------------------ */
/* Étapes annotées sur la vue 3D éclatée                               */
/* ------------------------------------------------------------------ */
export const ANNOTATIONS = [
  { id: 'semelle', titre: 'Semelle cuir',   texte: 'Pleine fleur, taillée à la forme puis cousue.' },
  { id: 'talon',   titre: 'Talon empilé',   texte: 'Couches de cuir montées une à une, bonbout neuf.' },
  { id: 'patine',  titre: 'Patine & glaçage', texte: 'Nuances à la main, puis miroir au bout et au talon.' },
  { id: 'couture', titre: 'Coutures',       texte: 'Point sellier repris là où le fil a cédé.' }
];
