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

## Ce que ça fait

| | |
|---|---|
| Conversations | Sauvegardées dans ton navigateur, avec historique dans le panneau latéral |
| Streaming | La réponse s'écrit mot à mot, avec un bouton pour l'interrompre |
| Markdown | Gras, titres, listes, liens, code en ligne et blocs de code |
| Blocs de code | Bouton « Copier » au survol |
| Modèles | Sélecteur en bas du panneau : bascule entre tous tes modèles Ollama |
| Raccourcis | `Entrée` envoie, `Maj+Entrée` retour à la ligne, `Ctrl+K` nouvelle conversation |

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

25 vérifications : connexion, liste des modèles, streaming, rendu Markdown,
échappement du HTML renvoyé par le modèle, persistance, panneau latéral,
responsive, et absence d'erreur JavaScript.
