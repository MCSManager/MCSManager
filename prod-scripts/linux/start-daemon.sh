#!/bin/bash

cd daemon || exit
node --max-old-space-size=8192 --enable-source-maps app.js
