#!/usr/bin/env bash
# Copia el sitio compilado a la raíz del repositorio.
#
# GitHub Pages está configurado como "Deploy from a branch" (main, /), es decir
# sirve la raíz tal cual. Por eso el código fuente vive en app/ y aquí dejamos
# únicamente el resultado del build.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -d dist ] || { echo "No existe dist/. Ejecuta primero: npm run build"; exit 1; }

# Limpiar la publicación anterior (los assets llevan hash y se acumularían).
rm -rf assets images
rm -f index.html 404.html favicon.svg robots.txt sitemap.xml

cp -R dist/. .

# Rutas del SPA: cualquier URL desconocida cae en la app.
cp index.html 404.html

# GitHub Pages no debe procesar esto con Jekyll.
touch .nojekyll

echo "Sitio publicado en la raíz."
