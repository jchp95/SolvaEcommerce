#!/usr/bin/env bash
set -e

# Parámetros (puedes pasarlos con env vars desde Render):
# DB_HOST: nombre del servicio de la BD en la red interna de Render (por ejemplo solvaecommerce-mssql)
# DB_PORT: puerto TCP de la BD (por defecto 1433)
# MAX_WAIT: segundos a esperar antes de fallar (por defecto 300)

HOST=${DB_HOST:-}
PORT=${DB_PORT:-1433}
MAX_WAIT=${MAX_WAIT:-300}

# Si no hay DB_HOST definido, arrancar la app inmediatamente (útil cuando se usa una DB gestionada y la cadena de conexión ya es válida)
if [ -z "$HOST" ]; then
  echo "DB_HOST no definido — iniciando la aplicación sin esperar por una conexión TCP. Asegúrate de que ConnectionStrings__DefaultConnection esté configurada."
  exec dotnet TiendaOnline.Server.dll
fi

echo "Waiting for $HOST:$PORT (max ${MAX_WAIT}s)..."

i=0
while ! (echo > /dev/tcp/${HOST}/${PORT}) >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -ge "$MAX_WAIT" ]; then
    echo "Timeout waiting for $HOST:$PORT after $MAX_WAIT seconds"
    exit 1
  fi
  sleep 1
done

echo "Service $HOST:$PORT is available, starting app..."
exec dotnet TiendaOnline.Server.dll
