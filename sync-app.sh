#!/bin/sh
# Recopie la page de l'application (dépôt de l'APK) et la prépare pour le site :
#  - script déplacé dans app.js (la règle de sécurité interdit tout script écrit dans la page)
#  - polices hébergées sur le site (web.css) au lieu de Google Fonts
#  - règle de sécurité du contenu (CSP), pas de « referrer », pas d'indexation
#  - mise en page grand écran (desktop.css, desktop.js)
# Usage : ./sync-app.sh chemin/vers/app/src/main/assets/index.html
set -e
python3 - "$1" <<'PY'
import sys, re
s = open(sys.argv[1], encoding='utf-8').read()
# 1. polices Google retirées
s = re.sub(r'<link rel="preconnect" href="https://fonts\.googleapis\.com">\n?', '', s)
s = re.sub(r'<link href="https://fonts\.googleapis\.com/[^"]*" rel="stylesheet">\n?', '', s)
# 2. script principal -> app.js
a = s.index('<script>'); b = s.index('</script>', a)
open('app.js', 'w', encoding='utf-8').write(s[a + len('<script>'):b].strip() + '\n')
s = s[:a] + '<script src="app.js"></script>' + s[b + len('</script>'):]
# 3. sécurité + styles du site
csp = ("default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' data: blob: https://image.tmdb.org; font-src 'self'; "
       "connect-src 'self' https://api.themoviedb.org; frame-src https://www.youtube-nocookie.com; manifest-src 'self'; worker-src 'self'; "
       "base-uri 'none'; form-action 'none'; object-src 'none'")
head = ('<meta http-equiv="Content-Security-Policy" content="' + csp + '">\n'
        '<meta name="referrer" content="no-referrer">\n')
i = s.index('<meta charset="utf-8">') + len('<meta charset="utf-8">\n')
s = s[:i] + head + s[i:]
i = s.index('</head>')
s = s[:i] + ('<meta name="robots" content="noindex, nofollow, noarchive">\n'
             '<link rel="stylesheet" href="web.css">\n<link rel="stylesheet" href="desktop.css">\n') + s[i:]
i = s.rindex('</body>')
s = s[:i] + '<script src="desktop.js"></script>\n' + s[i:]
open('index.html', 'w', encoding='utf-8').write(s)
PY
