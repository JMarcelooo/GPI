#!/bin/bash

cleanup() {
  echo ""
  echo "=== Parando servidores ==="
  kill $(lsof -ti:3000) 2>/dev/null
  kill $(lsof -ti:3001) 2>/dev/null
  wait 2>/dev/null
  exit
}
trap cleanup SIGINT SIGTERM SIGHUP EXIT

echo "=== Iniciando Backend (porta 3000) ==="
(cd Backend && npm start) &
BACK_PID=$!

echo "=== Iniciando Frontend (porta 3001) ==="
(cd Frontend && npm start) &
FRONT_PID=$!

wait $BACK_PID $FRONT_PID
