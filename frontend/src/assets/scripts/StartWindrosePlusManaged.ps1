$ErrorActionPreference = "Stop"
$gameDir = $PSScriptRoot
$dashboardScript = Join-Path $gameDir "windrose_plus\server\windrose_plus_server.ps1"
$dashboard = Start-Process powershell.exe -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", "`"$dashboardScript`"",
    "-GameDir", "`"$gameDir`"",
    "-Port", "8780"
) -PassThru -NoNewWindow
try {
    & (Join-Path $gameDir "StartWindrosePlusServer.bat") @args
    exit $LASTEXITCODE
}
finally {
    if (!$dashboard.HasExited) {
        Stop-Process -Id $dashboard.Id -Force -ErrorAction SilentlyContinue
    }
}
