#!/data/data/com.termux/files/usr/bin/bash
# Installe le cerveau sur ton telephone Android, dans Termux.
#
# Une fois installe, le Flipper branche en USB-OTG a ton telephone parle au
# meme cerveau Python que sur un PC -- mais c'est le telephone qui fournit le
# reseau (WiFi ou donnees mobiles) pour parler a Claude. Plus besoin
# d'ordinateur : le telephone EST le cerveau.
#
# Usage :
#   1. Installe Termux ET Termux:API depuis F-Droid (PAS le Play Store, ces
#      versions sont perimees et cassees) :
#         https://f-droid.org/packages/com.termux/
#         https://f-droid.org/packages/com.termux.api/
#   2. Copie ce dossier cerveau/ sur le telephone (cable, partage de fichiers,
#      ou "git clone" dans Termux si tu as deja du reseau).
#   3. Dans Termux :  bash termux/installer.sh
set -euo pipefail

echo "=== Installation du cerveau IA Dauphin dans Termux ==="

pkg update -y
pkg install -y python termux-api

pip install --upgrade pip
pip install -r "$(dirname "$0")/../requirements.txt"

cat <<'AIDE'

=== Lancement, une fois le Flipper branche en USB-OTG ===

Termux ne peut pas ouvrir le port serie sans la permission USB d'Android.
Le module Termux:API s'en charge : termux-usb liste les peripheriques,
demande la permission a l'utilisateur, puis lance une commande avec l'acces
accorde.

1. Liste les peripheriques branches :
       termux-usb -l

2. Lance le cerveau via termux-usb (remplace le chemin par celui affiche) :
       termux-usb -e 'python -m dauphin --port "$1"' /dev/bus/usb/001/002

   Une fenetre Android demande la permission USB la premiere fois : accepte-la
   (et coche "toujours autoriser" pour ne plus la revoir a chaque branchement).

CE POINT N'A PAS ETE TESTE SUR UN VRAI TELEPHONE (aucun materiel Android
disponible dans l'environnement de developpement) -- c'est le chemin
officiellement documente par Termux (https://wiki.termux.com/wiki/Termux:API),
le meme qu'utilisent les tutoriels pour flasher un ESP32/Arduino en USB-OTG.
Si ca ne marche pas du premier coup :
  - verifie que Termux:API (l'app, pas juste le paquet) est bien installee ;
  - "termux-usb -l" doit lister le Flipper -- sinon, rebranche le cable et
    accepte la demande de permission Android qui apparait au branchement ;
  - en dernier recours, le cerveau tourne aussi tel quel sur un PC classique
    (voir le README principal) : rien n'empeche de revenir a cette option.

AIDE
