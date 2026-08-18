#!/usr/bin/env bash
# Prepara el sitio compilado para GitHub Pages y lo copia a la raíz.
#
# Pages puede servir este repositorio de dos maneras según cómo esté
# configurado: leyendo la raíz de la rama, o desplegando el artefacto que
# genera el workflow. Todo lo que necesita el sitio se prepara dentro de dist/
# antes de copiarlo, así ambas vías quedan completas.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -d dist ] || { echo "No existe dist/. Ejecuta primero: npm run build"; exit 1; }

# Rutas del SPA: cualquier URL desconocida debe caer en la aplicación.
cp dist/index.html dist/404.html

# Pages no debe procesar el resultado con Jekyll.
touch dist/.nojekyll

# Limpiar la publicación anterior (los assets llevan hash y se acumularían).
rm -rf assets images
rm -f index.html 404.html favicon.svg robots.txt sitemap.xml

cp -R dist/. .

echo "Sitio publicado en la raíz."
