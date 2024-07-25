#!/bin/sh

set -e

rm -rf production-code
rm -rf ./daemon/dist ./daemon/production
rm -rf ./panel/dist ./panel/production

pnpm run build

mkdir production-code
mkdir production-code/daemon
mkdir production-code/web
mkdir production-code/web/public

mv ./daemon/production/app.js ./production-code/daemon
mv ./daemon/production/app.js.map ./production-code/daemon
cp ./daemon/package.json ./production-code/daemon/package.json
cp ./daemon/package-lock.json ./production-code/daemon/package-lock.json

mv ./panel/production/app.js ./production-code/web
mv ./panel/production/app.js.map ./production-code/web
cp ./panel/package.json ./production-code/web/package.json
cp ./panel/package-lock.json ./production-code/web/package-lock.json

mv ./frontend/dist/* ./production-code/web/public

rm -rf ./daemon/dist ./daemon/production
rm -rf ./panel/dist ./panel/production
rm -rf ./frontend/dist

echo "------------"
echo "Compilation completed!"
echo "Output Directory: ./production-code/"
echo "------------"
