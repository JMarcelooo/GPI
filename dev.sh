#!/bin/bash
set -m

cleanup() {
  echo ""
  echo "=== Parando servidores ==="
  kill -- -$$ 2>/dev/null
  exit
}
trap cleanup SIGINT SIGTERM SIGHUP EXIT

echo "=== Iniciando Backend (porta 3000) ==="
(cd Backend && exec npm start) &
echo "=== Iniciando Frontend (porta 3001) ==="
(cd Frontend && exec npm start) &

wait
