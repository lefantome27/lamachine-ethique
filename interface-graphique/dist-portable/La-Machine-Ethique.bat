@echo off
echo 🚀 Lancement de La Machine Éthique...
echo.
echo Configuration éthique du système de sécurité
echo Inspiré de Person of Interest - Harold Finch
echo.
echo ========================================
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erreur: Node.js n'est pas installé ou n'est pas dans le PATH
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier si electron est installé
npx electron --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installation d'Electron...
    npm install electron --save-dev
)

echo ✅ Lancement de l'interface...
echo.
npx electron electron-app.js

pause
