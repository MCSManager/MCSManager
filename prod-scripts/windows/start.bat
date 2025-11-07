set BASE_DIR=%cd%
set DAEMON_DIR=%BASE_DIR%\daemon
set WEB_DIR=%BASE_DIR%\web
if exist "%DAEMON_DIR%" (
    cd /d "%DAEMON_DIR%"
    start node_app.exe --enable-source-maps --max-old-space-size=8192 app.js
)
ping localhost
if exist "%WEB_DIR%" (
    cd /d "%WEB_DIR%"
    start node_app.exe --enable-source-maps --max-old-space-size=8192 app.js --open
)