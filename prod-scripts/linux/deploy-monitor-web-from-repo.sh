#!/bin/bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(cd "${SCRIPT_DIR}/../.." && pwd)
TARGET_DIR=${MCSM_WEB_DIR:-/opt/mcsmanager/web}
SERVICE_NAME=${MCSM_WEB_SERVICE:-mcsm-web.service}
BACKUP_DIR="${TARGET_DIR}.bak.$(date +%Y%m%d%H%M%S)"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root."
  exit 1
fi

if [ ! -d "${TARGET_DIR}" ]; then
  echo "Missing ${TARGET_DIR}."
  echo "Install the official MCSManager base first, then rerun this script."
  exit 1
fi

command -v node >/dev/null 2>&1 || {
  echo "node is required."
  exit 1
}

command -v npm >/dev/null 2>&1 || {
  echo "npm is required."
  exit 1
}

echo "Building web and frontend from ${REPO_ROOT}..."
cd "${REPO_ROOT}/common"
npm install --no-fund --no-audit
npm run build

cd "${REPO_ROOT}/panel"
npm install --no-fund --no-audit
npm run build

cd "${REPO_ROOT}/frontend"
npm install --no-fund --no-audit
npm run build

echo "Stopping ${SERVICE_NAME}..."
systemctl stop "${SERVICE_NAME}" || true

echo "Backing up ${TARGET_DIR} to ${BACKUP_DIR}..."
cp -a "${TARGET_DIR}" "${BACKUP_DIR}"

echo "Installing monitor web files..."
cp -f "${REPO_ROOT}/panel/production/app.js" "${TARGET_DIR}/app.js"
cp -f "${REPO_ROOT}/panel/production/app.js.map" "${TARGET_DIR}/app.js.map"
cp -f "${REPO_ROOT}/panel/package.json" "${TARGET_DIR}/package.json"
cp -f "${REPO_ROOT}/panel/package-lock.json" "${TARGET_DIR}/package-lock.json"

rm -rf "${TARGET_DIR}/public"
mkdir -p "${TARGET_DIR}/public"
cp -a "${REPO_ROOT}/frontend/dist/." "${TARGET_DIR}/public/"

cd "${TARGET_DIR}"
npm install --production --no-fund --no-audit

echo "Starting ${SERVICE_NAME}..."
systemctl start "${SERVICE_NAME}"
systemctl status "${SERVICE_NAME}" --no-pager

echo "Done."
echo "Backup: ${BACKUP_DIR}"
