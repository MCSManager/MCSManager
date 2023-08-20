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

# echo "Build frontend..."
# cd ..
# cd frontend
# npm run build

echo "Collecting files..."
cd ..

mkdir production-code
mkdir production-code/daemon
mkdir production-code/web
mkdir production-code/web/public

cp ./daemon/production/app.js ./production-code/daemon/app.js
cp ./daemon/package.json ./production-code/daemon/package.json
cp ./daemon/package-lock.json ./production-code/daemon/package-lock.json

cp ./panel/production/app.js ./production-code/web/app.js
cp ./panel/package.json ./production-code/web/package.json
cp ./panel/package-lock.json ./production-code/web/package-lock.json


rm -rf ./daemon/dist ./daemon/production
rm -rf ./panel/dist ./panel/production

echo "------------"
echo "Done!"
echo "------------"