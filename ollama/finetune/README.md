# Entraîner ton IA

Deux niveaux, du plus simple au plus profond. Commence par le 1 : dans 90 % des
cas c'est déjà ce que tu voulais.

---

## Niveau 1 — Modeler son comportement (2 minutes, aucun GPU)

Tu réécris son caractère en éditant du texte. Pas d'entraînement, effet immédiat.

```bash
nano ../modelfiles/mon-ia.Modelfile     # modifie le bloc SYSTEM
ollama create mon-ia -f ../modelfiles/mon-ia.Modelfile
ollama run mon-ia
```

Le bloc `SYSTEM` devient sa nature permanente : ton, langue, format des réponses,
ce qu'il fait ou ne fait pas. `temperature` règle sa créativité (0.1 = factuel et
répétable, 1.5 = imprévisible).

**Limite :** ça change son comportement, pas ses connaissances. Il ne connaîtra
pas ton code, tes documents ou ton métier. Pour ça → niveau 2.

---

## Niveau 2 — Fine-tuning LoRA (vrai entraînement sur tes données)

Là tu modifies réellement les poids du modèle avec tes exemples.

### 1. Construis ton dataset

Un fichier JSONL, un exemple par ligne, au format conversation :

```json
{"messages":[{"role":"user","content":"ta question"},{"role":"assistant","content":"la réponse que tu veux qu'il donne"}]}
```

Vois `dataset.exemple.jsonl`. **Compte ~50 exemples minimum** pour un effet
stable, 500+ pour un vrai changement de style ou de domaine. La qualité compte
beaucoup plus que la quantité : 100 exemples soignés battent 5000 bâclés.

### 2. Installe et lance

```bash
pip install torch --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt

python train_lora.py --dataset mes-donnees.jsonl --nom mon-ia-v2
```

Le script valide ton dataset, entraîne, exporte en GGUF et importe le résultat
dans Ollama. À la fin : `ollama run mon-ia-v2`.

### Réglages utiles

| Option | Effet |
|---|---|
| `--epochs 3` | Passages sur le dataset. Trop haut = il récite par cœur. |
| `--rang 16` | Force du LoRA. 8 = léger, 16 = équilibré, 64 = fort (plus de VRAM). |
| `--lr 2e-4` | Vitesse d'apprentissage. Baisse à `1e-4` si le résultat part en vrille. |
| `--base ...` | Modèle de départ (voir `../README.md` pour les non censurés). |

### Matériel

| Config | Verdict |
|---|---|
| GPU NVIDIA ≥ 8 Go VRAM | Idéal. Un 8B en LoRA passe en 4-bit. |
| Mac Apple Silicon | Utilise **MLX** : `pip install mlx-lm` puis `mlx_lm.lora --train`. Unsloth ne gère pas Metal. |
| CPU seul | Possible, mais compte des heures à des jours. Reste au niveau 1. |

---

## Niveau intermédiaire : lui donner tes documents sans entraîner

Si le but est juste qu'il connaisse **tes fichiers**, le fine-tuning est souvent
le mauvais outil — c'est long et il hallucine quand même. Un RAG (recherche dans
tes documents, injectée dans le prompt) est plus rapide, plus précis, et se met à
jour instantanément. Dis-le moi si tu veux que je te monte ça aussi.
