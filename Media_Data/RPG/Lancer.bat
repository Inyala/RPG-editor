@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 goto usepy
where python >nul 2>nul
if %errorlevel%==0 goto usepython
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serveur.ps1"
goto :eof
:usepy
start "" "http://localhost:8080/"
py -m http.server 8080
goto :eof
:usepython
start "" "http://localhost:8080/"
python -m http.server 8080
