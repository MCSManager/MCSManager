@echo off

call npm install
call npm run preview-build

cd daemon
call npm install
echo Installing lib dependencies...
if exist lib ( goto lib-install ) else ( mkdir lib && goto lib-install )

:lib-install
echo Downloading file_zip_win32_x64.exe...
curl -L -o .\lib\file_zip_win32_x64.exe https://github.com/MCSManager/Zip-Tools/releases/download/latest/file_zip_win32_x64.exe
echo Downloading 7z_win32_x64.exe...
curl -L -o .\lib\7z_win32_x64.exe https://github.com/MCSManager/Zip-Tools/releases/download/latest/7z_win32_x64.exe
echo Downloading pty_win32_x64.exe...
curl -L -o .\lib\pty_win32_x64.exe https://github.com/MCSManager/PTY/releases/download/latest/pty_win32_x64.exe
goto cont

:cont
cd ../panel
call npm install
cd ../frontend
call npm install
echo All dependencies installed! Use .\npm-dev-windows.bat to start the development environment.

pause