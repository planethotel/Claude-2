#!/usr/bin/env bash
# Installe Ollama et récupère un modèle open-weight de base en local.
#
# Usage:
#   ./ollama/setup.sh [nom_du_modele_de_base]
#
# Par défaut on prend un modèle Llama 3.1 8B (bon compromis qualité / VRAM).
# Tu peux passer n'importe quel modèle du catalogue Ollama (ollama.com/library),
# par ex. "mistral", "qwen2.5:14b", "dolphin-mixtral" (variante "non censurée"
# par la communauté, sans garde-fous ajoutés par un fournisseur cloud).

set -euo pipefail

BASE_MODEL="${1:-llama3.1:8b}"

if ! command -v ollama &> /dev/null; then
  echo "== Installation d'Ollama =="
  curl -fsSL https://ollama.com/install.sh | sh
else
  echo "== Ollama déjà installé (skip) =="
fi

echo "== Démarrage du service Ollama =="
if ! pgrep -x "ollama" > /dev/null; then
  ollama serve &
  sleep 2
fi

echo "== Téléchargement du modèle de base: ${BASE_MODEL} =="
ollama pull "${BASE_MODEL}"

echo
echo "Fait. Modèle prêt: ${BASE_MODEL}"
echo "Test rapide:  ollama run ${BASE_MODEL}"
echo
echo "Pour créer ta propre variante personnalisée (system prompt, params):"
echo "  ollama create mon-assistant -f ollama/Modelfile"
echo "  ollama run mon-assistant"
