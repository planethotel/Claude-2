# Protocole « Écaille » — dialogue Flipper ⇄ Cerveau

Version `1`. Transport : série (USB CDC canal 1, ou UART broches 13/14 à 115200).

## Format d'une trame

Une trame = **une ligne** terminée par `\n`, encodée en **ASCII** :

```
TYPE<TAB>cle=valeur<TAB>cle=valeur\n
```

* `TYPE` est en majuscules.
* Les clés sont en minuscules, sans accent.
* Échappements dans les valeurs : `\` → `\\`, TAB → `\t`, `\n` → `\n`, `=` en
  première position seulement n'est pas ambigu (le premier `=` sépare, les
  suivants font partie de la valeur).
* Longueur maximale d'une ligne : **1024 octets**. Au-delà, la ligne est
  ignorée des deux côtés (et signalée).
* Tout texte destiné à l'écran est **désaccentué** par le cerveau : les polices
  du Flipper (`u8g2 *_tr`) ne contiennent que l'ASCII 32–126. Le FAP replie en
  plus tout octet ≥ 0x80 par sécurité.

## Flipper → Cerveau

| Trame | Clés | Sens |
|---|---|---|
| `BONJOUR` | `v`, `app`, `fw`, `nom` | ouverture de session |
| `POULS` | `batt`, `charge` | battement, toutes les 10 s |
| `INVENTAIRE` | `n` | annonce `n` lignes `OBJET` à suivre |
| `OBJET` | `cat`, `nom`, `proto`, `freq`, `mod`, `cle`, `uid`, `taille`, `date` | un fichier capturé |
| `DEMANDE` | `texte` | question libre de l'utilisateur |
| `CHOIX` | `id` | l'utilisateur a choisi la proposition `id` |
| `RESULTAT` | `id`, `ok`, `detail` | compte rendu d'exécution |
| `REFUS` | `id`, `motif` | l'utilisateur a refusé la proposition |
| `AUREVOIR` | — | fermeture propre |

`cat` ∈ `subghz`, `nfc`, `lfrfid`, `infrared`, `badusb`, `ibutton`, `wav`.

## Cerveau → Flipper

| Trame | Clés | Effet |
|---|---|---|
| `HUMEUR` | `etat` | change l'animation de la mascotte |
| `DIRE` | `texte`, `humeur` | bulle de dialogue (≤ 200 car.) |
| `PROPOSITIONS` | `n` | annonce `n` lignes `PROPOSITION` |
| `PROPOSITION` | `id`, `titre`, `detail`, `risque`, `act`, `app`, `arg`, `chemin`, `contenu` | une action proposée |
| `FICHE` | `titre`, `corps` | texte long, écran défilant |
| `EXEC` | `id` | demande d'exécution immédiate (passe quand même par la confirmation si `risque` ≠ `sur`) |
| `ERREUR` | `texte` | le cerveau a un souci (réseau, clé API…) |

### Humeurs

`repos`, `ecoute`, `reflechit`, `content`, `surpris`, `inquiet`, `dort`.

### Verbes d'action (`act`)

| `act` | Clés utiles | Ce que fait le FAP |
|---|---|---|
| `rien` | — | proposition purement informative |
| `ouvrir_app` | `app`, `arg` | `loader_start_detached_with_gui_error(app, arg)` |
| `fiche` | — | affiche le `detail` en plein écran |
| `note` | `chemin`, `contenu` | écrit une note dans `/ext/apps_data/dauphin_ia/notes/` |
| `notifier` | `arg` ∈ `succes`,`erreur`,`vibre`,`alerte` | joue une séquence de notification |
| `inventaire` | — | renvoie un inventaire frais |

### Niveaux de risque (`risque`)

| Valeur | Confirmation | Exemples |
|---|---|---|
| `sur` | aucune | afficher une fiche, écrire une note |
| `local` | une touche OK | ouvrir une application |
| `emission` | écran de confirmation dédié, OK long | tout ce qui **émet** (Sub-GHz TX, IR TX, émulation NFC/RFID, BadUSB) |

Le FAP **n'émet jamais** de lui-même : toute action `emission` exige une
confirmation physique sur l'appareil. Le cerveau ne peut pas la contourner.

## Exemple de session

```
→ BONJOUR	v=1	app=0.1.0	fw=Momentum	nom=Requin
← HUMEUR	etat=ecoute
→ INVENTAIRE	n=2
→ OBJET	cat=subghz	nom=portail.sub	proto=Princeton	freq=433920000	cle=0x1A2B3C
→ OBJET	cat=nfc	nom=badge_bureau.nfc	proto=Mifare Classic 1K	uid=04A2B3C4
← HUMEUR	etat=reflechit
← DIRE	texte=Portail Princeton 433,92 MHz + un badge de bureau. Deux idees.	humeur=content
← PROPOSITIONS	n=2
← PROPOSITION	id=p1	titre=Rejouer le portail	detail=Princeton 24 bits, code fixe...	risque=emission	act=ouvrir_app	app=Sub-GHz	arg=/ext/subghz/portail.sub
← PROPOSITION	id=p2	titre=Comprendre ce badge	detail=Mifare Classic 1K, UID 4 octets...	risque=sur	act=fiche
→ CHOIX	id=p2
→ RESULTAT	id=p2	ok=1	detail=fiche affichee
```
