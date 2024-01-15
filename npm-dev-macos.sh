#!/bin/sh

currentPath="$(pwd)"
for action in "daemon" "panel" "frontend"
do
    terminalCmd="tell app \"Terminal\" to do script \"cd $currentPath && npm run $action\""
    echo "Run: $terminalCmd"
    osascript -e "$terminalCmd"
done
