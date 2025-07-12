const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Création de l\'exécutable La Machine Éthique...');

// Créer le dossier dist s'il n'existe pas
const distDir = path.join(__dirname, 'dist-portable');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Créer un script de lancement simple
const launcherScript = `@echo off
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
`;

fs.writeFileSync(path.join(distDir, 'La-Machine-Ethique.bat'), launcherScript);
console.log('  ✓ Script de lancement créé');

// Copier les fichiers nécessaires
const filesToCopy = [
    'electron-app.js',
    'index.html',
    'package.json'
];

console.log('📁 Copie des fichiers...');
filesToCopy.forEach(file => {
    const source = path.join(__dirname, file);
    const dest = path.join(distDir, file);
    if (fs.existsSync(source)) {
        fs.copyFileSync(source, dest);
        console.log(`  ✓ ${file}`);
    } else {
        console.log(`  ⚠ ${file} non trouvé`);
    }
});

// Créer un README
const readme = `# La Machine Éthique - Exécutable Portable

## 🚀 Lancement Rapide

Double-cliquez sur \`La-Machine-Ethique.bat\` pour lancer l'application.

## 📋 Prérequis

- Node.js (version 16 ou supérieure) - https://nodejs.org/
- Connexion Internet (pour télécharger Electron la première fois)

## 🔧 Installation Manuelle (si nécessaire)

1. Ouvrez un terminal dans ce dossier
2. Exécutez: \`npm install\`
3. Lancez: \`npx electron electron-app.js\`

## 🛡️ Fonctionnalités

- **Interface Finch**: Configuration éthique du système
- **Évaluation des Menaces**: Analyse en temps réel
- **Système d'Intervention**: Actions éthiques automatisées
- **Maintenance**: Surveillance continue du système

## 🎯 Inspiration

Inspiré de la série "Person of Interest" - Harold Finch, le créateur éthique de The Machine.

## 📞 Support

En cas de problème, vérifiez que Node.js est bien installé et dans votre PATH.
`;

fs.writeFileSync(path.join(distDir, 'README.md'), readme);
console.log('  ✓ README créé');

// Créer un fichier .exe avec un wrapper simple
const exeWrapper = `@echo off
title La Machine Éthique
color 0A
cls
echo.
echo    ██╗      █████╗     ███╗   ███╗ █████╗  ██████╗██╗███╗   ██╗███████╗
echo    ██║     ██╔══██╗    ████╗ ████║██╔══██╗██╔════╝██║████╗  ██║██╔════╝
echo    ██║     ███████║    ██╔████╔██║███████║██║     ██║██╔██╗ ██║█████╗  
echo    ██║     ██╔══██║    ██║╚██╔╝██║██╔══██║██║     ██║██║╚██╗██║██╔══╝  
echo    ███████╗██║  ██║    ██║ ╚═╝ ██║██║  ██║╚██████╗██║██║ ╚████║███████╗
echo    ╚══════╝╚═╝  ╚═╝    ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝╚═╝  ╚═══╝╚══════╝
echo.
echo                           Système de Protection Éthique
echo                           Inspiré de Person of Interest
echo.
echo ================================================================================
echo.

call "%~dp0La-Machine-Ethique.bat"

pause
`;

fs.writeFileSync(path.join(distDir, 'La-Machine-Ethique.exe'), exeWrapper);
console.log('  ✓ Wrapper .exe créé');

console.log('\n✅ Build terminé !');
console.log(`📁 L'application se trouve dans: ${distDir}`);
console.log('🚀 Pour lancer: double-cliquez sur La-Machine-Ethique.bat ou .exe');
console.log('📦 Première utilisation: Electron sera téléchargé automatiquement'); 