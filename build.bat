call npm run preview-build

rd /s /q "production-code"
rd /s /q ".\daemon\dist"
rd /s /q ".\daemon\production"
rd /s /q ".\panel\dist"
rd /s /q ".\panel\production"

echo "Build daemon..."
cd daemon
call npm run build

echo "Build panel..."
cd ..
cd panel
call npm run build

echo "Build frontend..."
cd ..
cd frontend
call npm run build

echo "Collecting files..."
cd ..

mkdir "production-code"
mkdir "production-code\daemon"
mkdir "production-code\web"
mkdir "production-code\web\public"

copy ".\daemon\production\app.js" ".\production-code\daemon\app.js"
copy ".\daemon\package.json" ".\production-code\daemon\package.json"
copy ".\daemon\package-lock.json" ".\production-code\daemon\package-lock.json"

copy ".\panel\production\app.js" ".\production-code\web\app.js"
copy ".\panel\package.json" ".\production-code\web\package.json"
copy ".\panel\package-lock.json" ".\production-code\web\package-lock.json"

xcopy ".\frontend\dist" ".\production-code\web\public" /E /I /H /Y

rd /s /q ".\panel\production"
rd /s /q ".\daemon\production"
rd /s /q ".\daemon\dist"  
rd /s /q ".\panel\dist" 
rd /s /q ".\frontend\dist" 

cd "production-code\daemon"
call npm install --production
cd "../web"
call npm install --production
cd "../../"

echo "------------"
echo "Compilation completed!"
echo "Output Directory: ./production-code/"
echo "------------"

pause