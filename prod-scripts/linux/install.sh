#!/bin/bash

BASE_PATH=$(pwd)

cd "${BASE_PATH}/daemon"
npm install --production --no-fund --no-audit

cd "${BASE_PATH}/web"
npm install --production --no-fund --no-audit
