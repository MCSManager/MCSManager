#!/bin/bash

# MCSManager's app.js (panel/daemon) is now a self-contained bundle: all Node
# dependencies and language packs are inlined, so no `npm install` is required
# at runtime. This script is retained for backward compatibility and performs
# no network install. Per-platform external binaries (PTY / Zip-Tools) under
# `daemon/lib/` are provided separately per release.

echo "------------"
echo "No npm install needed: app.js is self-contained."
echo "All done!"
echo "------------"