#!/usr/bin/env bash
set -e

# Parámetros (puedes pasarlos con env vars desde Render):
HOST=${DB_HOST:-tiendaonline-mssql}
PORT=${DB_PORT:-1433}
MAX_WAIT=${MAX_WAIT:-60}

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

