#!/bin/sh
# Recopie la page de l'application et y ajoute la mise en page grand écran du site.
# Usage : ./sync-app.sh chemin/vers/app/src/main/assets/index.html
set -e
python3 - "$1" <<'PY'
import sys
s = open(sys.argv[1], encoding='utf-8').read()
# chargé après les styles de la page, pour pouvoir les adapter au grand écran
i = s.index('</head>')
s = s[:i] + '<meta name="robots" content="noindex, nofollow, noarchive">\n<link rel="stylesheet" href="desktop.css">\n' + s[i:]
i = s.rindex('</body>')
s = s[:i] + '<script src="desktop.js"></script>\n' + s[i:]
open('index.html', 'w', encoding='utf-8').write(s)
PY
