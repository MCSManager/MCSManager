#!/bin/sh
npm install
npm run preview-build

cd daemon
npm install
cd ../panel
npm install
cd ../frontend
npm install

echo "------------"
echo "Done!"
echo "------------"