@echo off
chcp 65001 >nul
title La Machine Éthique - Lancement

echo.
echo ========================================
echo    🤖 LA MACHINE ÉTHIQUE v1.0.0
echo ========================================
echo.
echo Protection, Éthique, et Contrôle Humain - Toujours.
echo.

:: Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERREUR: Node.js n'est pas installé ou n'est pas dans le PATH
    echo.
    echo Veuillez installer Node.js depuis: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Vérifier si npm est installé
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERREUR: npm n'est pas installé
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js et npm détectés
echo.

:: Vérifier si les dépendances sont installées
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
    echo ✅ Dépendances installées
    echo.
)

:: Vérifier si TypeScript est compilé
if not exist "dist" (
    echo 🔧 Compilation TypeScript...
    npm run compile
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de la compilation
        pause
        exit /b 1
    )
    echo ✅ TypeScript compilé
    echo.
)

echo 🚀 Lancement de La Machine Éthique...
echo.
echo ========================================
echo.

:: Lancer l'application
npm start

if %errorlevel% neq 0 (
    echo.
    echo ❌ Erreur lors du lancement
    echo.
    echo Tentative de finalisation automatique...
    npm run finalize
    echo.
    echo Relancement...
    npm start
)

echo.
echo ========================================
echo    La Machine Éthique fermée
echo ========================================
echo.
pause 