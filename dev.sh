#!/bin/bash
trap 'kill 0' EXIT

echo "=== Iniciando Backend (porta 3000) ==="
(cd Backend && npm start) &
echo "=== Iniciando Frontend (porta 3001) ==="
(cd Frontend && npm start) &

wait
