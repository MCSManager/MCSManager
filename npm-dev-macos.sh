#!/bin/sh

# open -a Terminal.app -n "npm run start-daemon"
# open -a Terminal.app -n "npm run start-panel"
# npm run start-frontend

npm run start-daemon &
npm run start-panel &
npm run start-frontend