# LAIN — interface pour ton IA locale

Une icône sur le Bureau. Un clic. Une vraie interface de chat pour le modèle
Ollama qui tourne sur ta machine.

![LAIN](lain-256.png)

## Installation

Ollama doit déjà être installé (voir [`../ollama/`](../ollama/)). Ensuite, dans
PowerShell :

```powershell
cd Claude-2\lain
.\Installer-LAIN.ps1
```

Si Windows bloque le script : `Set-ExecutionPolicy -Scope Process Bypass` puis relance.

Ça crée une icône **LAIN** sur ton Bureau et une entrée au menu Démarrer. Double-clic,
et l'interface s'ouvre dans ton navigateur.

Pour tout retirer : `.\Installer-LAIN.ps1 -Desinstaller` (tes conversations et le
dossier ne sont pas touchés).

## Mettre ton image

L'appli cherche un fichier `avatar.*` à côté de `index.html`. Dépose le tien :

```powershell
# depuis le dossier lain\
copy C:\chemin\vers\ton-image.png avatar.png
```

Noms acceptés, dans cet ordre : `avatar.gif`, `avatar.png`, `avatar.webp`,
`avatar.jpg`, `avatar.jpeg`. **Un GIF s'anime tout seul.** Sans fichier, l'appli
garde son œil géométrique de repli.

L'image apparaît dans le panneau, sur l'écran d'accueil, et à côté de chaque
réponse — avec un traitement écran cathodique : teinte cyan, lignes de balayage,
et quand elle parle, décalage RVB et léger tremblement.

Pour en faire aussi l'icône du Bureau :

```powershell
.\Convertir-Icone.ps1      # avatar.* -> lain.ico
.\Installer-LAIN.ps1       # applique la nouvelle icône
```

Ton image reste sur ta machine : elle est exclue du dépôt par `.gitignore`.

## Lui envoyer des images

Trois façons, toutes équivalentes :

- **Glisse-dépose** un fichier n'importe où sur la fenêtre
- **Colle** avec `Ctrl+V` (capture d'écran comprise)
- **Clique sur le trombone** dans la zone de saisie

L'image part **directement dans ton Ollama local**, en base64 dans le champ
`images` de l'API. Elle ne transite par aucun service, et surtout pas par moi.

Elle est réduite à 1024 px et convertie en JPEG avant l'envoi : les modèles de
vision n'exploitent pas plus, et une image brute saturerait le stockage du
navigateur. Six images maximum par message.

**Il faut un modèle qui voit.** `dolphin3` et la plupart des modèles sont
aveugles. Quand le modèle sélectionné sait lire les images, un badge **vision**
apparaît dans l'en-tête ; sinon LAIN te prévient avant d'envoyer. Pour en
installer un :

```powershell
ollama pull llava:7b            # 4,7 Go - le classique
ollama pull qwen2.5vl:7b        # 6 Go   - meilleur sur le texte dans l'image
ollama pull moondream           # 1,7 Go - léger
```

Puis choisis-le dans le sélecteur **Modèle**.

## La voix

**Active par défaut.** La lecture utilise la synthèse vocale de Windows :
hors-ligne, rien n'est envoyé nulle part. Le sélecteur liste les voix françaises
installées, les féminines en premier (Denise, Vivienne, Éloise, Julie,
Hortense…). `Échap` coupe la lecture, le bouton **Voix** la désactive.

Réglages retenus : débit `0.98` (légèrement posé) et hauteur `1.28` (voix jeune
plutôt que neutre). Modifiables dans `index.html`, fonction `dire()`.

La lecture démarre dès la première phrase terminée plutôt qu'à la fin de la
réponse — sinon il faudrait attendre que tout soit généré.

**Si la liste est vide :** Windows → Paramètres → Heure et langue → Voix →
Ajouter des voix → Français. Les voix « Natural » sont nettement meilleures.

Je ne peux pas reproduire la voix exacte de la comédienne du doublage : ça
demanderait un modèle de clonage vocal entraîné sur sa voix. Les voix système
sont ce qui s'en approche le plus sans ça.

## Ce que ça fait

| | |
|---|---|
| Conversations | Sauvegardées dans ton navigateur, avec historique dans le panneau latéral |
| Streaming | La réponse s'écrit mot à mot, avec un bouton pour l'interrompre |
| Markdown | Gras, titres, listes, liens, code en ligne et blocs de code |
| Blocs de code | Bouton « Copier » au survol |
| Modèles | Sélecteur en bas du panneau : bascule entre tous tes modèles Ollama |
| Voix | Synthèse vocale française, hors-ligne, avec sélecteur de voix |
| Portrait animé | Décalage RVB et tremblement quand elle parle, barres de signal |
| Ambiance | Lignes de balayage CRT, vignette, balayage lent, titre à effet glitch |
| Images | Glisse-dépose, `Ctrl+V` ou trombone → direct dans ton modèle local |
| Mode wired | Grille réseau animée, contrastes durcis, tout en monospace |
| Sons | Séquence d'allumage et retours discrets, synthétisés (aucun fichier) |
| Souris | Le portrait dérive vers le curseur, un halo le suit |
| Raccourcis | `Entrée` envoie, `Maj+Entrée` retour à la ligne, `Ctrl+K` nouvelle conversation, `Échap` coupe la voix |

Tout est local. Aucune requête ne sort de ta machine.

## Comment ça marche

Le raccourci lance `LAIN.ps1`, qui :

1. démarre Ollama s'il ne tourne pas déjà ;
2. sert `index.html` sur `http://127.0.0.1:8765` (ou le port libre suivant) ;
3. ouvre ton navigateur dessus.

**Pourquoi un petit serveur local plutôt qu'ouvrir le fichier directement ?**
Ollama n'accepte par défaut que les requêtes venant d'une origine `localhost`. Une
page ouverte en `file://` n'a pas d'origine valide et serait refusée. La solution
qu'on voit souvent — passer `OLLAMA_ORIGINS=*` — ouvrirait ton modèle à
**n'importe quel site web que tu visites**. Servir la page depuis localhost évite
ce compromis : rien à desserrer.

Le serveur ne sert que les fichiers du dossier `lain/` et refuse toute requête
qui tenterait de remonter l'arborescence.

## Personnaliser

- **Le comportement du modèle** → `..\ollama\modelfiles\mon-ia.Modelfile`
- **Les couleurs** → les variables CSS en haut de `index.html` (bloc `:root`)
- **Les suggestions de l'écran d'accueil** → les `<button class="chip">` dans `index.html`
- **Le port** → `.\LAIN.ps1 -Port 9000`

## Si ça ne marche pas

| Problème | Solution |
|---|---|
| « Ollama hors ligne » dans l'interface | Ouvre un terminal, lance `ollama serve` |
| Aucun modèle dans la liste | `ollama list` — si c'est vide, relance `..\ollama\install.ps1` |
| Le script ne se lance pas | `Set-ExecutionPolicy -Scope Process Bypass` |
| Le port est occupé | `.\LAIN.ps1 -Port 9000` |
| Réponses très lentes | Normal sans GPU. Prends un modèle plus petit (`qwen2.5:3b`) |

## Tests

L'interface est couverte par une suite Playwright qui la pilote dans un vrai
Chromium, avec un faux Ollama reproduisant le CORS strict du vrai (page sur
`:8765`, API sur `:11434`, preflight inclus) :

```bash
pip install playwright && playwright install chromium
python3 tests/mock_ollama.py api &      # faux Ollama
python3 tests/mock_ollama.py static &   # sert lain/ sur 8765
python3 tests/test_lain.py
```

75 vérifications : connexion, liste des modèles, streaming, rendu Markdown,
échappement du HTML renvoyé par le modèle, persistance, panneau latéral,
responsive, détection de l'avatar et repli, bascule de l'état « elle parle »,
réglages de voix, découpage en phrases pour la lecture, suivi de la souris,
mode wired, sons, et le trajet complet d'une image — y compris la vérification,
côté serveur, qu'elle part bien dans le champ `images` d'Ollama et que les
aperçus d'affichage, eux, ne partent pas.

Les animations sont toutes désactivées sous `prefers-reduced-motion`, et le
scintillement est lent et de faible amplitude — pas de flash rapide.
