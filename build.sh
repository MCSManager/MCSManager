#!/bin/sh

set -e

BASE_PATH=$(pwd)

npm run preview-build

rm -rf production-code
rm -rf ./daemon/dist ./daemon/production
rm -rf ./panel/dist ./panel/production

echo "Build daemon..."
cd "${BASE_PATH}/daemon"
npm run build

echo "Build panel..."
cd "${BASE_PATH}/panel"
npm run build

echo "Build frontend..."
cd "${BASE_PATH}/frontend"
npm run build

echo "Collecting files..."
cd "${BASE_PATH}"

mkdir production-code
mkdir production-code/daemon
mkdir production-code/web
mkdir production-code/web/public

mv "${BASE_PATH}/daemon/production/app.js" "${BASE_PATH}/production-code/daemon"
mv "${BASE_PATH}/daemon/production/app.js.map" "${BASE_PATH}/production-code/daemon"
cp -f "${BASE_PATH}/daemon/package.json" "${BASE_PATH}/production-code/daemon/package.json"
cp -f "${BASE_PATH}/daemon/package-lock.json" "${BASE_PATH}/production-code/daemon/package-lock.json"

mv "${BASE_PATH}/panel/production/app.js" "${BASE_PATH}/production-code/web"
mv "${BASE_PATH}/panel/production/app.js.map" "${BASE_PATH}/production-code/web"
cp -f "${BASE_PATH}/panel/package.json" "${BASE_PATH}/production-code/web/package.json"
cp -f "${BASE_PATH}/panel/package-lock.json" "${BASE_PATH}/production-code/web/package-lock.json"

mv "${BASE_PATH}"/frontend/dist/* "${BASE_PATH}/production-code/web/public"

rm -rf "${BASE_PATH}/daemon/dist" "${BASE_PATH}/daemon/production"
rm -rf "${BASE_PATH}/panel/dist" "${BASE_PATH}/panel/production"
rm -rf "${BASE_PATH}/frontend/dist"

cd "${BASE_PATH}/production-code/daemon"
npm install --production --no-fund --no-audit
cd "${BASE_PATH}/production-code/web"
npm install --production --no-fund --no-audit

echo "------------"
echo "Compilation completed!"
echo "Output Directory: ./production-code/"
echo "------------"
