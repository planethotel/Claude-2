#!/usr/bin/env bash
# Construit le FAP « IA Dauphin » avec ufbt (le SDK Momentum).
#
# Prerequis :
#   pip install --upgrade ufbt
#   ufbt update --channel=release          # recupere le SDK (acces reseau requis)
#
# Puis, depuis la racine du depot :
#   ./flipper-ia/outils/construire_fap.sh            # compile
#   ./flipper-ia/outils/construire_fap.sh launch     # compile, installe et lance
set -euo pipefail

ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAP="$ICI/fap"

# On (re)genere les animations si Pillow est la ; sinon on garde les .png suivis.
if python3 -c "import PIL" 2>/dev/null; then
    python3 "$ICI/outils/generer_animations.py" >/dev/null
fi

cd "$FAP"
case "${1:-build}" in
    launch) ufbt launch ;;
    clean)  ufbt -c ;;
    *)      ufbt ;;
esac

echo
echo "FAP produit : $FAP/dist/dauphin_ia.fap"
echo "Copie-le dans /ext/apps/Tools/ sur le Flipper (qFlipper ou carte SD)."
