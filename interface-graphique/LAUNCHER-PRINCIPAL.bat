@echo off
title La Machine Ethique - Lanceur Principal
color 0B

echo.
echo ========================================
echo    LA MACHINE ETHIQUE - LANCEUR PRINCIPAL
echo ========================================
echo.
echo [INFO] Demarrage du lanceur avec icone personnalisee...
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installé
    echo [INFO] Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier si les fichiers nécessaires existent
if not exist "launcher-main.js" (
    echo [ERREUR] Fichier launcher-main.js manquant
    pause
    exit /b 1
)

if not exist "launcher-interface.html" (
    echo [ERREUR] Fichier launcher-interface.html manquant
    pause
    exit /b 1
)

if not exist "assets\icon.ico" (
    echo [ERREUR] Icône personnalisée manquante: assets\icon.ico
    pause
    exit /b 1
)

echo [SUCCES] Tous les fichiers requis sont présents
echo [INFO] Icône personnalisée détectée: assets\icon.ico

REM Vérifier si Electron est installé
if not exist "node_modules\electron" (
    echo [INFO] Installation d'Electron...
    npm install electron --save-dev
)

REM Lancer l'application avec l'icône personnalisée
echo [INFO] Lancement de La Machine Ethique avec icone personnalisee...
echo [INFO] Utilisation de l'icône: assets\icon.ico
echo.

node launcher-main.js

echo.
echo [INFO] Application fermée
pause 