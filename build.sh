#!/bin/sh
# Prépare le dossier « site » à publier (utilisé par GitHub Pages ou Cloudflare Pages).
set -e
rm -rf site && mkdir -p site/fonts
cp index.html app.js web.css desktop.css desktop.js manifest.webmanifest sw.js icon-192.png icon-512.png robots.txt site/
cp fonts/*.woff fonts/*.txt site/fonts/
