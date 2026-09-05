/* =========================================================================
   Cordonnerie Bonnet — contenu du site
   Tout ce qui se lit sur le site est ici. Modifiez ce fichier, enregistrez :
   le site est à jour. Aucune autre manipulation.
   ========================================================================= */

export const MAISON = {
  nom: 'Cordonnerie Bonnet',
  baseline: 'Cordonnerie traditionnelle à Tours',
  monogramme: ['R', 'B'],
  adresse: {
    rue: '31, boulevard Heurteloup',
    cp: '37000',
    ville: 'Tours',
    repere: 'À deux pas de la gare'
  },
  tel: '02 47 47 07 82',
  telLien: '+33247470782',
  email: 'cordonneriebonnet@gmail.com',
  facebook: 'https://www.facebook.com/profile.php?id=61565892811851',
  instagram: 'https://www.instagram.com/cordonnerie.bonnet',
  maps: 'https://www.google.com/maps/search/?api=1&query=Cordonnerie+Bonnet+31+boulevard+Heurteloup+37000+Tours',
  avisGoogle: 'https://www.google.com/search?q=Cordonnerie+Bonnet+Tours#lrd=0x0:0x0,1',
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

/* -------------------------------------------------------------------------
   BANDEAU D'ANNONCE (haut de page, fond rouge)
   Il disparaît TOUT SEUL le lendemain de « jusquau ». Plus besoin d'y penser.
   Pour annoncer une fermeture : mettez actif à true, écrivez le texte et la
   date de fin au format AAAA-MM-JJ.
   ------------------------------------------------------------------------- */
export const ANNONCE = {
  actif: true,
  texte: 'Votre cordonnerie sera fermée du 01 au 31 août 2026.',
  jusquau: '2026-08-31'
};

/* -------------------------------------------------------------------------
   LES QUATRE MÉTIERS (bandeau de l'accueil)
   ------------------------------------------------------------------------- */
export const SERVICES = [
  'Réparation & amélioration de chaussures',
  'Produits d’entretien et accessoires',
  'Entretien d’articles en cuir & maroquinerie',
  'Vente de chaussures reconditionnées haut de gamme'
];

export const PILIERS = [
  {
    num: 'I',
    titre: 'Réparation & amélioration',
    texte: 'Ressemelage cuir ou gomme, patins de protection, bonbouts et talons, ' +
           'remise en forme, œillets et crochets, coutures reprises. On répare, ' +
           'puis on améliore : la paire ressort plus solide qu’elle n’est entrée.',
    dessin: 'richelieu'
  },
  {
    num: 'II',
    titre: 'Produits d’entretien & accessoires',
    texte: 'Saphir, Saphir Médaille d’Or 1925, Collonil, Nanex. Crèmes, pâtes de ' +
           'glaçage, imperméabilisants, brosses, palots, embauchoirs, premières de ' +
           'propreté. Les produits que j’utilise moi-même à l’établi.',
    dessin: 'creme'
  },
  {
    num: 'III',
    titre: 'Cuir & maroquinerie',
    texte: 'Nettoyage en profondeur, nourrissage, teinture, glaçage. Sacs, ceintures, ' +
           'blousons, bagages : tout ce qui est cuir se soigne, se recolore et se répare.',
    dessin: 'sac'
  },
  {
    num: 'IV',
    titre: 'Seconde vie',
    texte: 'Des souliers d’occasion haut de gamme, réparés, reconditionnés et ' +
           'entretenus à l’atelier. Crockett & Jones, J.M. Weston, Edward Green — ' +
           'le stock tourne, les pointures changent chaque semaine.',
    dessin: 'derby'
  }
];

/* Les trois questions de l'accueil, telles qu'elles sont posées aujourd'hui */
export const QUESTIONS = [
  'Un talon cassé, un cuir abîmé, une semelle à réparer ?',
  'Besoin d’un conseil pour l’entretien de vos paires préférées ?',
  'Ou simplement curieux de découvrir la cordonnerie traditionnelle ?'
];

/* -------------------------------------------------------------------------
   PRESTATIONS
   Aucun tarif n'est affiché : chaque réparation se chiffre sur pièce.
   Si vous voulez afficher des prix, ajoutez un champ « prix » et il
   apparaîtra à droite de la ligne.
   ------------------------------------------------------------------------- */
export const PRESTATIONS = [
  { cat: 'Chaussure', nom: 'Ressemelage cuir',            desc: 'Semelle cuir pleine fleur, cousue ou collée selon le montage d’origine.' },
  { cat: 'Chaussure', nom: 'Ressemelage gomme',           desc: 'Gomme naturelle ou crantée, pour l’adhérence et l’usage quotidien.' },
  { cat: 'Chaussure', nom: 'Patins de protection',        desc: 'Posés à neuf sur semelle cuir : ils en doublent la durée de vie.' },
  { cat: 'Chaussure', nom: 'Talons & bonbouts',           desc: 'Bonbouts remplacés, talon empilé reconstruit couche après couche.' },
  { cat: 'Chaussure', nom: 'Trépointe & couture',         desc: 'Reprise du point sellier, trépointe recousue là où le fil a cédé.' },
  { cat: 'Chaussure', nom: 'Ferrage',                     desc: 'Fers posés au bout et au talon, pour les semelles très sollicitées.' },
  { cat: 'Chaussure', nom: 'Élargissement & mise en forme', desc: 'Détente sur forme pour gagner en confort sans abîmer la tige.' },
  { cat: 'Chaussure', nom: 'Œillets & crochets',          desc: 'Remplacement de la petite quincaillerie, laiton ou nickelé.' },
  { cat: 'Cuir',      nom: 'Nettoyage & nourrissage',     desc: 'Décrassage, réhydratation, protection : le cuir respire à nouveau.' },
  { cat: 'Cuir',      nom: 'Teinture & recoloration',     desc: 'Reprise de teinte à l’identique ou changement de couleur complet.' },
  { cat: 'Cuir',      nom: 'Patine & glaçage',            desc: 'Nuances travaillées à la main, puis glaçage miroir sur bout et talon.' },
  { cat: 'Cuir',      nom: 'Daim & nubuck',               desc: 'Décrassage, gommage, recoloration et retour de l’aspect peau de pêche.' },
  { cat: 'Maroquinerie', nom: 'Réparation de sacs',       desc: 'Anses, doublures, fermetures à glissière, coins usés, fermoirs.' },
  { cat: 'Maroquinerie', nom: 'Ceintures & bracelets',    desc: 'Mise à longueur, nouveaux perçages, remplacement de boucle.' },
  { cat: 'Maroquinerie', nom: 'Blousons & bagagerie',     desc: 'Zips, doublures, angles renforcés, remise en teinte.' }
];

/* -------------------------------------------------------------------------
   GALERIE
   Ajoutez « photo: 'assets/galerie/mon-image.jpg' » à une entrée et la photo
   remplace l'emplacement réservé. Sans photo, un cadre légendé s'affiche.
   ------------------------------------------------------------------------- */
export const GALERIE = [
  { titre: 'Bottines cuir brun',      note: 'Semelle neuve',              format: 'haut' },
  { titre: 'Sneakers',                note: 'Décrassage et recoloration' },
  { titre: 'Sac à main',              note: 'Cuir grainé, anses reprises', format: 'haut' },
  { titre: 'Richelieus',              note: 'Livrés en pochons' },
  { titre: 'Derbys',                  note: 'Semelle gomme' },
  { titre: 'Chaussettes en bambou',   note: 'Coloris de saison' },
  { titre: 'Escarpins vernis rouges', note: 'Bonbouts et vernis repris',   format: 'haut' },
  { titre: 'Doubles boucles brun',    note: 'Patine et glaçage' },
  { titre: 'Ferrage de semelle',      note: 'Fers au bout et au talon' },
  { titre: 'Mocassins penny',         note: 'Embauchoirs cèdre',           format: 'haut' }
];

/* -------------------------------------------------------------------------
   AVANT / APRÈS
   Deux images par bloc. Remplacez les chemins par vos photos : même cadrage,
   même lumière, même fond sur les deux prises de vue.
   ------------------------------------------------------------------------- */
export const AVANT_APRES = {
  chapo: 'Non, les paires ci-dessous ne sont pas neuves… Elles ont été restaurées ' +
         'par mes soins. Tirez le curseur pour voir toute la différence.',
  exemple: {
    avant: 'Cuir fatigué & manque de forme',
    apres: 'Entretien du cuir et usage d’embauchoirs adaptés'
  },
  paires: [
    { titre: 'Richelieu noir',
      texte: 'Semelle percée, bonbouts effondrés. Démontage complet, semelle cuir neuve, talon reconstruit, glaçage du bout.',
      avant: 'assets/avant-apres/paire-01-avant.svg', apres: 'assets/avant-apres/paire-01-apres.svg' },
    { titre: 'Derby cognac',
      texte: 'Cuir desséché et griffé. Décrassage, réhydratation, reprise de teinte à la main, patine et lustrage.',
      avant: 'assets/avant-apres/paire-02-avant.svg', apres: 'assets/avant-apres/paire-02-apres.svg' },
    { titre: 'Sac à main',
      texte: 'Anses fendues, coins usés jusqu’à la trame. Anses refaites en cuir pleine fleur, coins renforcés, teinte raccordée.',
      avant: 'assets/avant-apres/paire-03-avant.svg', apres: 'assets/avant-apres/paire-03-apres.svg' }
  ]
};

/* -------------------------------------------------------------------------
   BOUTIQUE — trois rayons
   Aucun prix : la vente se fait en boutique. Pour illustrer un article avec
   une photo, ajoutez « photo: 'assets/boutique/xxx.jpg' » — elle remplace
   le dessin au trait.
   ------------------------------------------------------------------------- */
export const BOUTIQUE = {
  'entretien': {
    titre: 'Produits d’entretien',
    chapo: 'L’entretien idéal d’une chaussure : nettoyer, nourrir, lustrer et protéger.',
    pied: 'Besoin d’un conseil pour l’entretien de vos chaussures et cuirs divers ? ' +
          'Venez découvrir la Cordonnerie Bonnet pour tout savoir sur le meilleur soin à leur donner.',
    articles: [
      { nom: 'Crème universelle',        marque: 'Saphir',                 desc: 'Pour nettoyer les traces et résidus du précédent entretien. Indispensable !', dessin: 'creme' },
      { nom: 'Pommadier 1925',           marque: 'Saphir Médaille d’Or',   desc: 'Pour nourrir le cuir de la chaussure (gamme luxe).', dessin: 'creme' },
      { nom: 'Pâte de luxe',             marque: 'Saphir Médaille d’Or',   desc: 'Pour un glaçage parfait avec effet miroir.', dessin: 'pate' },
      { nom: 'Pâte amiral gloss',        marque: 'Saphir',                 desc: 'À utiliser en complément de la pâte de luxe pour un effet miroir plus rapide — à appliquer avant la pâte de luxe.', dessin: 'pate' },
      { nom: 'Imperméabilisant Nanex',   marque: 'Nanex',                  desc: 'Pour cuirs & textiles de souliers, manteaux, vestes de sport, maroquineries.', dessin: 'vaporisateur' },
      { nom: 'Carbon Pro',               marque: 'Collonil',               desc: 'Imperméabilisant.', dessin: 'vaporisateur' },
      { nom: 'Graisse',                  marque: 'Saphir',                 desc: 'Pour cuir gras et imperméabilisation des coutures.', dessin: 'pate' },
      { nom: 'Reptan',                   marque: 'Saphir',                 desc: 'Développé pour l’entretien des cuirs de reptiles.', dessin: 'creme' },
      { nom: 'Savon étalon noir',        marque: 'Saphir',                 desc: 'Chaussures, vêtements, maroquineries, ameublement et sellerie automobile.', dessin: 'savon' },
      { nom: '« Shoe eze »',             marque: 'Saphir',                 desc: 'Assouplissant.', dessin: 'vaporisateur' },
      { nom: 'Rénovateur nubuck',        marque: 'Saphir Médaille d’Or',   desc: 'Nourrit et recolore le nubuck.', dessin: 'vaporisateur' },
      { nom: 'Rénovateur',               marque: 'Saphir',                 desc: 'Nourrit le cuir en profondeur, pour les cuirs laissés à l’abandon. En complément de la crème 1925.', dessin: 'flacon' },
      { nom: 'Gommadin',                 marque: 'Saphir',                 desc: 'Gomme nubuck, pour effacer les taches incrustées dans le cuir — traits de stylo bille, par exemple.', dessin: 'gomme' },
      { nom: 'Canadian',                 marque: 'Saphir',                 desc: 'Crème polyvalente pour nourrir le cuir des vêtements, maroquineries et chaussures.', dessin: 'creme' },
      { nom: 'Vernis Rife',              marque: 'Saphir',                 desc: 'Nettoyant incolore de cuirs vernis. Existe aussi en version noire, pour masquer certains défauts.', dessin: 'flacon' },
      { nom: 'Réno’mat',                 marque: 'Saphir',                 desc: 'Détachant puissant pour cuirs lisses. Très utile pour les sneakers blanches !', dessin: 'flacon' },
      { nom: 'Omni’nettoyant',           marque: 'Saphir Médaille d’Or',   desc: 'Savon daim-nubuck.', dessin: 'savon' },
      { nom: 'Winter détachant',         marque: 'Saphir',                 desc: 'Pour les auréoles d’humidité — de quoi sauver les chaussures non imperméabilisées.', dessin: 'flacon' },
      { nom: 'Juvacuir',                 marque: 'Saphir',                 desc: 'Recolorant cuirs. Toute une gamme de couleurs, jusqu’au blanc des sneakers.', dessin: 'flacon' },
      { nom: 'Stop Color',               marque: 'Saphir',                 desc: 'Limite le transfert de couleur de la chaussure aux vêtements.', dessin: 'vaporisateur' },
      { nom: 'Lotion',                   marque: 'Saphir Médaille d’Or',   desc: 'Nettoyant pour cuirs délicats.', dessin: 'flacon' },
      { nom: 'Crème délicate',           marque: 'Saphir',                 desc: 'Pour nourrir les cuirs délicats.', dessin: 'creme' },
      { nom: 'Teinture Française',       marque: 'Saphir',                 desc: 'Teinture pour cuirs.', dessin: 'flacon' }
    ]
  },

  'accessoires': {
    titre: 'Accessoires',
    chapo: 'Certains accessoires sont indispensables pour garantir la longévité de vos chaussures.',
    pied: 'Venez découvrir ma gamme complète d’accessoires à la Cordonnerie Bonnet.',
    articles: [
      { nom: 'Brosse à lustrer',   desc: 'À utiliser après la crème 1925.', dessin: 'brosse' },
      { nom: 'Brosse nubuck',      desc: 'Pour retrouver l’aspect « peau de pêche » du daim.', dessin: 'brosseNubuck' },
      { nom: 'Palot',              desc: 'Pour appliquer la crème sur la tige et la trépointe — plus efficace qu’un chiffon, qui absorberait une partie du produit.', dessin: 'palot' },
      { nom: 'Tendeur de bottes',  desc: 'Pour maintenir la tige et faciliter l’entretien.', dessin: 'tendeur' },
      { nom: 'Brosse décrottoir',  desc: 'Pour retirer terre et cailloux de la semelle et de la trépointe.', dessin: 'decrottoir' },
      { nom: 'Embauchoirs',        desc: 'Maintiennent la tige, facilitent l’entretien et réduisent l’usure en absorbant la transpiration nocive.', dessin: 'embauchoir' },
      { nom: 'Hi-Flex',            desc: 'Première de propreté fine à mémoire de forme. Idéale pour les sneakers et les pieds sensibles.', dessin: 'premiere' },
      { nom: 'Lufpolster',         desc: 'Première de propreté épaisse à mémoire de forme. Idéale pour les chaussures de randonnée.', dessin: 'premiere' },
      { nom: 'Chaussettes',        desc: 'Chaussettes en bambou.', dessin: 'chaussette' }
    ]
  },

  'seconde-vie': {
    titre: 'Seconde vie',
    chapo: 'Des chaussures d’occasion haut de gamme réparées, reconditionnées et entretenues.',
    pied: 'Les paires disponibles à la vente sont renouvelées régulièrement. ' +
          'N’hésitez pas à passer commande à la Cordonnerie Bonnet.',
    /* statut : 'Disponible' ou 'Vendu' */
    articles: [
      { nom: 'Crockett & Jones', taille: '8,5 E', statut: 'Disponible', dessin: 'richelieu' },
      { nom: 'J.M. Weston',      taille: '8,5 D', statut: 'Disponible', dessin: 'mocassin' },
      { nom: 'Paul Smith',       taille: '44',    statut: 'Disponible', dessin: 'derby' },
      { nom: 'Jimmy Choo',       taille: '36',    statut: 'Disponible', dessin: 'escarpin' },
      { nom: 'Edward Green',     taille: '9,5 E', statut: 'Disponible', dessin: 'brogue',
        precision: 'pour Diehl & Diehl' },
      { nom: 'Crockett & Jones', taille: '12 E',  statut: 'Disponible', dessin: 'bottine' }
    ]
  }
};

export const RAYONS = ['entretien', 'accessoires', 'seconde-vie'];

/* -------------------------------------------------------------------------
   L'ARTISAN — à la première personne, comme sur le site actuel.

   ⚠ Ce texte est une PROPOSITION écrite dans votre ton : le site actuel n'a
   pas de page « à propos », il n'y avait donc rien à reprendre. Relisez-le et
   remplacez-le par vos propres mots — c'est votre voix qui doit s'entendre.
   Ajoutez « photo: 'assets/artisan.jpg' » ci-dessous pour votre portrait.
   ------------------------------------------------------------------------- */
export const ARTISAN = {
  titre: 'L’artisan',
  paragraphes: [
    'Je suis cordonnier au 31 boulevard Heurteloup, à deux pas de la gare de Tours. ' +
    'Ici, on ne remplace pas : on répare, on entretient, on rattrape. Une paire bien ' +
    'faite tient vingt ans si une main s’en occupe.',
    'Ressemelage, patins, bonbouts, trépointe recousue, teinture, glaçage — et le ' +
    'conseil qui va avec, parce que la moitié du travail se fait chez vous, avec la ' +
    'bonne crème et un embauchoir.',
    'N’hésitez pas à me rendre visite en boutique. On regarde la paire ensemble, je ' +
    'vous dis ce qui se répare, ce qui ne se répare pas, et ce que ça coûte.'
  ],
  signature: 'Votre artisan cordonnier met tout en œuvre pour vous chausser durablement et avec goût.'
};

/* -------------------------------------------------------------------------
   Annotations de la vue 3D éclatée (vocabulaire de l'atelier)
   ------------------------------------------------------------------------- */
export const ANNOTATIONS = [
  { id: 'tige',     titre: 'La tige',     texte: 'Le cuir du dessus. Nettoyée, nourrie, teinte, puis glacée.' },
  { id: 'semelle',  titre: 'La semelle',  texte: 'Cuir pleine fleur, taillée à la forme puis cousue à la trépointe.' },
  { id: 'talon',    titre: 'Le talon',    texte: 'Empilé couche par couche, bonbout neuf en surface.' },
  { id: 'trepointe',titre: 'La trépointe',texte: 'Le liseré cousu qui tient la tige à la semelle.' }
];
