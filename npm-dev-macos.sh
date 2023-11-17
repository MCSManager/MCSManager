#!/bin/sh

open -a Terminal.app "npm run start-daemon"
open -a Terminal.app "npm run start-panel"
npm run start-frontend
