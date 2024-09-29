cd daemon
start node_app.exe --enable-source-maps --max-old-space-size=8192 app.js 
ping localhost
cd ../web
start node_app.exe --enable-source-maps --max-old-space-size=8192 app.js --open