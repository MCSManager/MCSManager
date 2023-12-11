#!/bin/sh

currentPath="$(pwd)"
for action in "daemon" "panel" "frontend"
do
    terminalCmd="tell app \"Terminal\" to do script \"cd $currentPath && npm run start-$action\""
    echo "Run: $terminalCmd"
    osascript -e "$terminalCmd"
done
