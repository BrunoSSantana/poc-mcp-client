#!/bin/sh
set -e

# Verifique se temos comando personalizado
if [ "${1#-}" != "$1" ]; then
  set -- node "$@"
fi

# Se o primeiro argumento for 'cli' ou 'server', use-o como comando
if [ "$1" = 'cli' ] || [ "$1" = 'server' ]; then
  set -- node dist/index.js "$@"
fi

# Executa o comando
exec "$@" 