rd /s /q "production-code"
rd /s /q ".\daemon\dist"
rd /s /q ".\daemon\production"
rd /s /q ".\panel\dist"
rd /s /q ".\panel\production"

call pnpm run build

mkdir "production-code"
mkdir "production-code\daemon"
mkdir "production-code\web"
mkdir "production-code\web\public"

copy ".\daemon\production\app.js" ".\production-code\daemon\app.js"
copy ".\daemon\production\app.js.map" ".\production-code\daemon\app.js.map"
copy ".\daemon\package.json" ".\production-code\daemon\package.json"

copy ".\panel\production\app.js" ".\production-code\web\app.js"
copy ".\panel\production\app.js.map" ".\production-code\web\app.js.map"
copy ".\panel\package.json" ".\production-code\web\package.json"

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