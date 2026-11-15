#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "==> Démarrage du portail Intila9a Foussana (Version Réelle)..."
cd "${REPO_ROOT}"

# Charger les variables si disponibles
if [ -f "${SCRIPT_DIR}/.env.production" ]; then
  echo "==> Chargement de ${SCRIPT_DIR}/.env.production"
  set -a
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/.env.production"
  set +a
fi

echo "==> Compilation Next.js..."
npm run build

echo "==> Lancement du serveur sur 0.0.0.0:3000..."
exec npm run start -- -p 3000 -H 0.0.0.0
