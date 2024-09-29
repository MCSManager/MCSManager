#!/bin/bash

cd web || exit
node --max-old-space-size=8192 --enable-source-maps app.js
