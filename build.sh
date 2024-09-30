#!/bin/sh

set -e

npm run preview-build

rm -rf production-code
rm -rf ./daemon/dist ./daemon/production
rm -rf ./panel/dist ./panel/production

echo "Build daemon..."
cd daemon
npm run build

echo "Build panel..."
cd ..
cd panel
npm run build

echo "Build frontend..."
cd ..
cd frontend
npm run build

echo "Collecting files..."
cd ..

mkdir production-code
mkdir production-code/daemon
mkdir production-code/web
mkdir production-code/web/public

mv ./daemon/production/app.js ./production-code/daemon
mv ./daemon/production/app.js.map ./production-code/daemon
cp -f ./daemon/package.json ./production-code/daemon/package.json
cp -f ./daemon/package-lock.json ./production-code/daemon/package-lock.json

mv ./panel/production/app.js ./production-code/web
mv ./panel/production/app.js.map ./production-code/web
cp -f ./panel/package.json ./production-code/web/package.json
cp -f ./panel/package-lock.json ./production-code/web/package-lock.json

mv ./frontend/dist/* ./production-code/web/public

rm -rf ./daemon/dist ./daemon/production
rm -rf ./panel/dist ./panel/production
rm -rf ./frontend/dist

echo "npm install..."
cd production-code/daemon
npm install --production --no-fund --no-audit
cd ../web
npm install --production --no-fund --no-audit
cd ..

echo "------------"
echo "Compilation completed!"
echo "Output Directory: ./production-code/"
echo "------------"
