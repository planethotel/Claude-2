# Ton IA locale

Kit d'installation d'une IA **hébergée sur ta machine** : aucun compte, aucune
clé API, aucune donnée qui sort. Tu la choisis, tu la modèles, tu l'entraînes.

## Installation

```bash
cd ollama
./install.sh
```

Le script détecte ton OS, ta RAM et ton GPU, installe Ollama, choisit un modèle
adapté à ta machine, le télécharge, crée ton modèle personnalisé `mon-ia`, et
vérifie qu'il répond vraiment avant de te rendre la main.

Ensuite :

```bash
ollama run mon-ia
```

Pour forcer un modèle précis : `./install.sh dolphin3:8b`

## Choix du modèle

Le script choisit selon ta RAM, mais tu peux imposer le tien. Le filtrage d'un
modèle vit **dans ses poids** : c'est donc le modèle que tu choisis, et lui seul,
qui détermine ce qu'il accepte de répondre. Les modèles ci-dessous sont des
poids ouverts sans filtrage ajouté.

| Modèle | Taille | RAM conseillée | Note |
|---|---|---|---|
| `qwen2.5:3b` | 1.9 Go | 8 Go | Rapide, machines légères |
| `dolphin-mistral:7b` | 4.1 Go | 8 Go | Sans filtrage, solide |
| `dolphin3:8b` | 4.9 Go | 16 Go | **Meilleur compromis** |
| `dolphin-mixtral:8x7b` | 26 Go | 32 Go+ | Le plus capable |
| `qwen2.5-coder:7b` | 4.7 Go | 16 Go | Spécialisé code |

`ollama pull <nom>` pour en ajouter un, `ollama list` pour voir les tiens,
`ollama rm <nom>` pour libérer de la place.

Sans GPU, tout fonctionne quand même sur CPU — comptez quelques mots par seconde
au lieu de quelques dizaines.

## La modeler

`modelfiles/mon-ia.Modelfile` définit sa personnalité : le bloc `SYSTEM` devient
sa nature permanente, les `PARAMETER` règlent son comportement. Édite, puis :

```bash
ollama create mon-ia -f modelfiles/mon-ia.Modelfile
```

Effet immédiat, aucun entraînement nécessaire.

## L'entraîner

Voir **[finetune/README.md](finetune/README.md)** — fine-tuning LoRA sur tes
propres exemples, avec export automatique vers Ollama.

```bash
cd finetune
pip install -r requirements.txt
python train_lora.py --dataset mes-donnees.jsonl --nom mon-ia-v2
```

## L'utiliser depuis ton code

Le serveur expose une API locale sur `http://127.0.0.1:11434`, compatible avec le
format OpenAI — donc la plupart des bibliothèques existantes marchent en changeant
juste l'URL de base.

```bash
curl http://127.0.0.1:11434/api/generate \
  -d '{"model":"mon-ia","prompt":"Salut","stream":false}'
```

```python
# pip install openai
from openai import OpenAI
client = OpenAI(base_url="http://127.0.0.1:11434/v1", api_key="peu-importe")
print(client.chat.completions.create(
    model="mon-ia",
    messages=[{"role": "user", "content": "Salut"}],
).choices[0].message.content)
```

## Dépannage

| Problème | Solution |
|---|---|
| `connection refused` sur 11434 | `ollama serve` (ou `sudo systemctl start ollama`) |
| Réponses très lentes | Modèle trop gros pour ta RAM → prends la taille en dessous |
| `out of memory` | Baisse `num_ctx` dans le Modelfile, ou modèle plus petit |
| Plus d'espace disque | `ollama list` puis `ollama rm <modèle>` |
| Windows | Installe depuis ollama.com/download, puis lance ce script dans WSL2 |

---

**Note :** ce kit ne peut pas être exécuté depuis une session Claude Code distante —
la passerelle réseau y bloque `ollama.com`, `registry.ollama.ai` et `huggingface.co`,
et le conteneur est éphémère. Il est fait pour tourner sur ta machine.
