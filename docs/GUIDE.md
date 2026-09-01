# Guide : IA locale entraînable, sans restriction

Ce dépôt te permet de faire tourner un modèle de langage **entièrement en
local** (avec [Ollama](https://ollama.com)) et de l'entraîner toi-même sur
tes propres données, sans dépendre d'un service cloud ni d'un fournisseur qui
impose des règles sur ce que le modèle peut dire.

Important à comprendre : **Claude n'est pas disponible via Ollama**. Claude
est un modèle propriétaire d'Anthropic, servi uniquement via l'API
d'Anthropic — il n'existe pas de poids Claude téléchargeables, donc
impossible de l'entraîner "sans restriction" en local. Ce dépôt utilise donc
des modèles **open-weight** (poids ouverts, téléchargeables), comme Llama,
Mistral ou Qwen, qui eux peuvent tourner et être fine-tunés entièrement sur
ta machine.

## Vue d'ensemble

```
ollama/
  setup.sh      → installe Ollama + télécharge un modèle de base
  Modelfile     → personnalise le modèle (system prompt, params, ou ton
                   propre modèle fine-tuné)
training/
  train_lora.py         → fine-tuning LoRA/QLoRA sur ton dataset
  merge_and_export.py   → fusionne le LoRA dans le modèle, prêt pour GGUF
  dataset_example.jsonl → format d'exemple pour tes données
```

## 1. Installer Ollama et faire tourner un modèle de base

```bash
./ollama/setup.sh llama3.1:8b
ollama run llama3.1:8b
```

D'autres modèles possibles : `mistral`, `qwen2.5:14b`, `dolphin-mixtral`
(variante communautaire réputée moins "filtrée" par défaut). La liste
complète est sur https://ollama.com/library.

À ce stade, tu as déjà un modèle qui tourne 100% en local, sans connexion
internet requise après le téléchargement, et sans aucune donnée envoyée
ailleurs.

## 2. Personnaliser le comportement (rapide, sans entraînement)

Le plus simple pour avoir un assistant "sans restriction" est souvent de
changer le system prompt, pas d'entraîner un modèle. Édite
`ollama/Modelfile` puis :

```bash
ollama create mon-assistant -f ollama/Modelfile
ollama run mon-assistant
```

## 3. Entraîner le modèle sur tes propres données (fine-tuning LoRA)

Si tu veux que le modèle apprenne réellement de nouvelles connaissances ou un
style particulier (pas juste suivre une instruction dans le system prompt),
il faut un fine-tuning. Ollama ne fait pas l'entraînement lui-même : on
entraîne avec un stack Python (transformers + PEFT), puis on réimporte le
résultat dans Ollama.

Prérequis : un GPU NVIDIA avec au moins 8 Go de VRAM pour un modèle 7-8B en
4-bit (QLoRA). Sans GPU, l'entraînement sera très lent voire impraticable.

```bash
cd training
pip install -r requirements.txt

# Prépare ton dataset au format dataset_example.jsonl
# (une paire instruction/réponse par ligne)

python train_lora.py \
  --base-model mistralai/Mistral-7B-Instruct-v0.3 \
  --dataset dataset_example.jsonl \
  --output-dir output/lora-adapter \
  --epochs 3
```

Choix du modèle de base : `mistralai/Mistral-7B-Instruct-v0.3` ou
`Qwen/Qwen2.5-7B-Instruct` n'imposent pas de demande d'accès particulière sur
Hugging Face. Les modèles Llama demandent d'accepter une licence et de se
connecter via `huggingface-cli login`.

## 4. Fusionner et convertir pour Ollama

```bash
python merge_and_export.py \
  --base-model mistralai/Mistral-7B-Instruct-v0.3 \
  --adapter output/lora-adapter \
  --output-dir output/merged-model
```

Puis convertis en GGUF avec `llama.cpp` (nécessaire car Ollama consomme des
fichiers GGUF) :

```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && pip install -r requirements.txt
python convert_hf_to_gguf.py ../training/output/merged-model \
  --outfile ../training/output/mon-modele.gguf --outtype q4_k_m
```

## 5. Charger ton modèle fine-tuné dans Ollama

Modifie `ollama/Modelfile` :

```
FROM ./training/output/mon-modele.gguf
```

Puis :

```bash
ollama create mon-assistant -f ollama/Modelfile
ollama run mon-assistant
```

Ton modèle personnalisé tourne maintenant entièrement en local, entraîné par
toi, sur tes données, sans dépendance à un service tiers.

## Notes

- "Sans restriction" ici veut dire : pas de garde-fous imposés par un
  fournisseur cloud, et un system prompt qui n'ajoute pas de refus par
  défaut. Le modèle garde le comportement appris pendant son propre
  pré-entraînement (il peut refuser ou hésiter sur certains sujets selon la
  base choisie) — le fine-tuning permet de l'orienter, mais ne "supprime"
  pas magiquement tout comportement du modèle de base.
- Utilise ce setup pour un usage personnel et légal (assistant sur tes
  propres notes, style d'écriture, domaine métier, etc.). Tu restes
  responsable de l'usage que tu fais du modèle et du contenu qu'il génère.
