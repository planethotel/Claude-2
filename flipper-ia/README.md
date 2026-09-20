# IA Dauphin — un compagnon vivant pour Flipper Zero (Momentum)

Une IA qui vit dans ton Flipper : elle regarde d'elle-même tout ce que
l'appareil a capturé (Sub-GHz, NFC, RFID 125 kHz, infrarouge, iButton, BadUSB),
elle **dit à quoi correspond chaque chose**, et elle **propose des actions** —
que tu acceptes ou refuses sur l'appareil. Une mascotte animée, avec sa propre
peau et ses humeurs, réagit en direct.

> **Pourquoi deux morceaux ?** Un Flipper Zero, c'est un STM32WB55 avec 256 Ko
> de RAM. Il ne fait pas tourner un modèle de langage. Le raisonnement vit donc
> sur une machine reliée en série (le **cerveau**), et le Flipper est le
> **corps** : il voit, il montre, il exécute. Les deux se parlent par un petit
> protocole texte, « Écaille ».

```
   Flipper (le corps)                     Cerveau (la pensée)
   ┌───────────────────┐                  ┌──────────────────────┐
   │  FAP « IA Dauphin »│   série USB/UART │  python -m dauphin    │
   │  - mascotte animée │◄────────────────►│  - Claude (Opus 5)    │
   │  - inventaire      │   protocole      │  - fiches de savoir   │
   │  - confirmations   │   « Écaille »    │  - agent a outils     │
   └───────────────────┘                  └──────────────────────┘
```

## Ce qu'elle sait faire

- **Se présenter et vivre** : sept humeurs animées (repos, écoute, réflexion,
  contente, surprise, inquiète, dort), une bulle de dialogue, une barre d'état.
- **Faire l'inventaire toute seule** : au démarrage, elle relit tes dossiers
  (`/ext/subghz`, `/ext/nfc`, …) et envoie au cerveau un résumé — **uniquement
  des métadonnées** (protocole, fréquence, UID…), jamais le contenu binaire.
- **Expliquer** : « ce badge est une Mifare Classic 1K, le genre qu'on trouve
  dans les bureaux » ; « ce .sub est du Princeton 433,92 MHz, une vieille
  télécommande de portail à code fixe ».
- **Proposer et exécuter** : ouvrir la bonne application sur le bon fichier,
  écrire une note, jouer une notification, refaire un inventaire.
- **Répondre à une demande libre** : tu tapes une question, elle répond.

## Le garde-fou (important)

Le cerveau ne commande **jamais** le matériel directement. Il ne fait que
*proposer*. Toute action qui **émet un signal** (rejeu radio, émission
infrarouge, émulation d'un badge, BadUSB) est marquée `emission` et passe par un
**écran de confirmation sur l'appareil**. Le cerveau ne peut pas le contourner —
c'est le FAP, en C, qui décide. Reste dans le cadre légal : ces outils servent à
comprendre et à agir sur **ce qui t'appartient**.

## Démarrage rapide

**Le cerveau** (sur ton ordinateur) :

```bash
cd flipper-ia/cerveau
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...        # ou : ant auth login
python -m dauphin --demo                    # essai sans Flipper
python -m dauphin --port /dev/ttyACM1       # avec un Flipper branché
```

Sans clé API ni réseau, le cerveau tourne en **mode repli** : plus de dialogue
génératif, mais il identifie quand même tes captures grâce aux fiches locales.

**Le corps** (le FAP) :

```bash
pip install --upgrade ufbt
ufbt update --channel=release               # récupère le SDK Momentum
./flipper-ia/outils/construire_fap.sh       # produit fap/dist/dauphin_ia.fap
```

Copie `dauphin_ia.fap` dans `/ext/apps/Tools/` (via qFlipper ou la carte SD),
puis lance « IA Dauphin » sur le Flipper.

## Le port série côté Flipper

Par défaut, le FAP prend le **canal 1 de l'USB CDC** : le canal 0 reste libre
pour la console/CLI, donc tu peux garder qFlipper ouvert. Dans les réglages du
FAP tu peux basculer sur l'**UART** (broches 13 = TX, 14 = RX, 115200 bauds) si
tu préfères un module externe. Côté cerveau, `--port` désigne le port CDC data ;
sur Linux c'est souvent `/dev/ttyACM1`.

## Organisation du dépôt

```
flipper-ia/
├── docs/PROTOCOLE.md      Le protocole « Écaille », trame par trame
├── fap/                   Le FAP (C) — le corps
│   ├── lien/              Port série + encodage du protocole
│   ├── contexte/          Scanner d'inventaire (lit les en-têtes Flipper Format)
│   ├── views/             La mascotte animée
│   ├── scenes/            Accueil, menu, question, propositions, confirmation…
│   ├── actions/           L'exécuteur (ouvre une app, écrit une note…)
│   └── images/            Animations générées de la mascotte
├── cerveau/               Le cerveau (Python) — la pensée
│   ├── dauphin/agent.py   L'agent Claude (streaming + boucle d'outils)
│   ├── dauphin/connaisseur.py   Interprète l'inventaire via les fiches
│   ├── dauphin/pont.py    Relie le série à l'agent
│   └── dauphin/savoir/    Fiches d'identification (NFC, RFID, Sub-GHz, IR)
└── outils/                Générateur d'animations, script de build
```

## État et limites

- Développé et vérifié contre le firmware **Momentum** (commit `d3f89df`,
  août 2026). Chaque appel d'API du FAP a été contrôlé sur les sources du
  firmware. **Le binaire final doit être compilé par toi avec `ufbt`** : le
  téléchargement du SDK ARM n'était pas possible dans l'environnement de
  développement, donc la compilation sur appareil reste à lancer de ton côté.
- Le cerveau est testé : `cd cerveau && python -m pytest` (18 tests).
- La mascotte est un dessin original, généré par code (aucune image tierce).

## Licence

Le code de ce dossier est fourni tel quel, pour un usage personnel et légal.
