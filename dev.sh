#!/bin/bash
set -m

PIDS=()

cleanup() {
  echo ""
  echo "=== Parando servidores ==="
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null
  done
  wait 2>/dev/null
  exit
}
trap cleanup SIGINT SIGTERM SIGHUP EXIT

echo "=== Iniciando Backend (porta 3000) ==="
(cd Backend && exec npm start) &
PIDS+=($!)

echo "=== Iniciando Frontend (porta 3001) ==="
(cd Frontend && exec npm start) &
PIDS+=($!)

wait
