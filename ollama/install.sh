#!/usr/bin/env bash
# Installe Ollama + un modele local, et verifie que tout repond.
# Usage:  ./install.sh            -> choisit le modele selon ta RAM
#         ./install.sh dolphin3   -> force un modele precis
set -euo pipefail

BLEU='\033[1;34m'; VERT='\033[1;32m'; JAUNE='\033[1;33m'; ROUGE='\033[1;31m'; RAZ='\033[0m'
info()   { printf "${BLEU}==>${RAZ} %s\n" "$*"; }
ok()     { printf "${VERT}OK ${RAZ} %s\n" "$*"; }
avert()  { printf "${JAUNE}!! ${RAZ} %s\n" "$*"; }
erreur() { printf "${ROUGE}ERREUR${RAZ} %s\n" "$*" >&2; exit 1; }

# --- 1. Systeme -------------------------------------------------------------
OS="$(uname -s)"
case "$OS" in
  Linux|Darwin) ;;
  *) erreur "OS non gere ($OS). Sur Windows, installe Ollama depuis ollama.com/download puis relance ce script dans WSL2." ;;
esac

# RAM totale en Go
if [ "$OS" = "Darwin" ]; then
  RAM_GO=$(( $(sysctl -n hw.memsize) / 1024 / 1024 / 1024 ))
else
  RAM_GO=$(( $(awk '/MemTotal/ {print $2}' /proc/meminfo) / 1024 / 1024 ))
fi

GPU="aucun"
if command -v nvidia-smi >/dev/null 2>&1 && nvidia-smi -L >/dev/null 2>&1; then
  GPU="NVIDIA: $(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)"
elif [ "$OS" = "Darwin" ] && [ "$(uname -m)" = "arm64" ]; then
  GPU="Apple Silicon (Metal)"
fi

info "Systeme : $OS $(uname -m) | RAM : ${RAM_GO} Go | GPU : $GPU"

# --- 2. Installation d'Ollama ----------------------------------------------
if command -v ollama >/dev/null 2>&1; then
  ok "Ollama deja installe ($(ollama --version 2>/dev/null | head -1))"
else
  info "Installation d'Ollama..."
  if [ "$OS" = "Darwin" ]; then
    if command -v brew >/dev/null 2>&1; then
      brew install ollama
    else
      erreur "Installe Homebrew (brew.sh) ou telecharge l'app sur https://ollama.com/download"
    fi
  else
    curl -fsSL https://ollama.com/install.sh | sh
  fi
  command -v ollama >/dev/null 2>&1 || erreur "Ollama introuvable apres installation."
  ok "Ollama installe"
fi

# --- 3. Demarrage du serveur ------------------------------------------------
if ! curl -sf http://127.0.0.1:11434/api/version >/dev/null 2>&1; then
  info "Demarrage du serveur Ollama..."
  if [ "$OS" = "Linux" ] && command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files 2>/dev/null | grep -q '^ollama.service'; then
    sudo systemctl enable --now ollama
  else
    nohup ollama serve >/tmp/ollama.log 2>&1 &
  fi
  for _ in $(seq 1 30); do
    curl -sf http://127.0.0.1:11434/api/version >/dev/null 2>&1 && break
    sleep 1
  done
fi
curl -sf http://127.0.0.1:11434/api/version >/dev/null 2>&1 \
  || erreur "Le serveur ne repond pas sur 127.0.0.1:11434. Voir /tmp/ollama.log"
ok "Serveur actif sur http://127.0.0.1:11434 (100% local, aucune donnee ne sort)"

# --- 4. Choix du modele -----------------------------------------------------
# Modeles open-weight sans filtrage ajoute (le filtrage vit dans les poids,
# donc c'est le choix du modele qui determine le comportement).
if [ $# -ge 1 ]; then
  MODELE="$1"
elif [ "$RAM_GO" -ge 32 ]; then
  MODELE="dolphin-mixtral:8x7b"     # ~26 Go  - le plus capable
elif [ "$RAM_GO" -ge 16 ]; then
  MODELE="dolphin3:8b"              # ~4.9 Go - meilleur compromis
elif [ "$RAM_GO" -ge 8 ]; then
  MODELE="dolphin-mistral:7b"       # ~4.1 Go
else
  MODELE="qwen2.5:3b"               # ~1.9 Go - machines legeres
fi

info "Modele retenu : $MODELE"
[ "$GPU" = "aucun" ] && avert "Pas de GPU : la generation tournera sur CPU (lent mais fonctionnel)."

info "Telechargement (plusieurs Go, sois patient)..."
ollama pull "$MODELE"
ok "Modele telecharge"

# --- 5. Creation de ton modele personnalise ---------------------------------
RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MF="$RACINE/modelfiles/mon-ia.Modelfile"
NOM="$MODELE"   # bascule sur "mon-ia" uniquement si sa creation reussit
if [ -f "$MF" ]; then
  info "Construction de 'mon-ia' a partir de $MODELE..."
  TMP="$(mktemp)"
  sed "s|^FROM .*|FROM $MODELE|" "$MF" > "$TMP"
  if ollama create mon-ia -f "$TMP"; then
    NOM="mon-ia"
    ok "Modele 'mon-ia' cree — edite $MF puis relance pour changer sa personnalite"
  else
    # On NE bascule PAS sur 'mon-ia' : il n'existe pas, et 'ollama run' irait
    # le chercher sur le registre au lieu d'echouer proprement.
    avert "'ollama create' a echoue. Le modele de base '$MODELE' reste utilisable."
  fi
  rm -f "$TMP"
fi

# --- 6. Verification reelle -------------------------------------------------
info "Test de generation sur '$NOM' (peut prendre une minute sur CPU)..."
REPONSE="$(ollama run "$NOM" "Reponds exactement: PRET" 2>/dev/null | tr -d '\r' | head -3)"
if [ -n "$REPONSE" ]; then
  ok "Le modele repond : $REPONSE"
else
  avert "Pas de reponse au test. Essaie a la main : ollama run $NOM"
fi

cat <<FIN

$(printf "${VERT}=== C'est pret ===${RAZ}")

  Discuter            ollama run $NOM
  Lister les modeles  ollama list
  API locale          curl http://127.0.0.1:11434/api/generate \\
                        -d '{"model":"mon-ia","prompt":"Salut","stream":false}'

  Changer sa personnalite  ->  modelfiles/mon-ia.Modelfile  puis  ./install.sh
  L'entrainer vraiment     ->  finetune/README.md

FIN
