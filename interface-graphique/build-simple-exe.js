const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Construction simplifiée de l\'exécutable...\n');

// Vérifier si les fichiers nécessaires existent
const requiredFiles = [
    'malware-detection-interface.html',
    'main-malware-detection.js',
    'assets/icon.ico'
];

console.log('📋 Vérification des fichiers requis...');
for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} - TROUVÉ`);
    } else {
        console.log(`❌ ${file} - MANQUANT`);
        console.log('❌ Impossible de créer l\'exécutable sans les fichiers requis');
        process.exit(1);
    }
}

// Créer le dossier de sortie
const outputDir = 'dist-malware-detection';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
    console.log('✅ Dossier de sortie créé');
}

// Créer un package.json simplifié pour l'exécutable
const simplePackageJson = {
    "name": "la-machine-ethique-malware-detection",
    "version": "1.0.0",
    "description": "La Machine Éthique - Détection de Malware",
    "main": "main-malware-detection.js",
    "author": "La Machine Éthique",
    "license": "MIT",
    "scripts": {
        "start": "electron ."
    },
    "devDependencies": {
        "electron": "^25.0.0"
    }
};

fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(simplePackageJson, null, 2));
console.log('✅ package.json créé dans le dossier de sortie');

// Copier les fichiers nécessaires
const filesToCopy = [
    'main-malware-detection.js',
    'malware-detection-interface.html',
    'assets'
];

for (const file of filesToCopy) {
    if (fs.existsSync(file)) {
        if (fs.lstatSync(file).isDirectory()) {
            // Copier le dossier assets
            const destPath = path.join(outputDir, file);
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }
            copyDirectory(file, destPath);
        } else {
            // Copier le fichier
            fs.copyFileSync(file, path.join(outputDir, file));
        }
        console.log(`✅ ${file} copié`);
    }
}

// Fonction pour copier un dossier récursivement
function copyDirectory(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Créer un script de lancement pour l'exécutable
const launchScript = `@echo off
title La Machine Ethique - Malware Detection (Portable)
color 0B

echo.
echo ========================================
echo    LA MACHINE ETHIQUE - DETECTION DE MALWARE
echo ========================================
echo.
echo [INFO] Demarrage de l'application portable...
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installé
    echo [INFO] Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier si Electron est installé
if not exist "node_modules\\electron" (
    echo [INFO] Installation d'Electron...
    npm install electron --save-dev
)

REM Lancer l'application
echo [INFO] Lancement de La Machine Ethique...
npm start

echo.
echo [INFO] Application fermée
pause
`;

fs.writeFileSync(path.join(outputDir, 'LAUNCH.bat'), launchScript);
console.log('✅ Script de lancement créé');

// Créer un README pour l'exécutable
const readme = `# La Machine Éthique - Détection de Malware

## 🚀 Lancement Rapide

Double-cliquez sur \`LAUNCH.bat\` pour lancer l'application.

## 📋 Prérequis

- Node.js (version 14 ou supérieure)
- npm (inclus avec Node.js)

## 🛡️ Fonctionnalités

- Détection de 8 types de malware
- Interface graphique moderne
- Tests et simulations
- Contrôles d'urgence
- Monitoring en temps réel

## 🎯 Types de Malware Détectés

- Ransomware
- Spyware
- Adware
- Cheval de Troie
- Ver
- Rootkit
- Enregistreur de frappe
- Bot

## 🚨 Contrôles d'Urgence

- Quarantaine d'Urgence
- Protocole d'Urgence
- Arrêt d'Urgence

## 📞 Support

Pour toute question ou problème, consultez la documentation complète.

---

**La Machine Éthique** - Système de sécurité avancé inspiré de Person of Interest
`;

fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
console.log('✅ README créé');

// Créer un script d'installation automatique
const installScript = `@echo off
title Installation - La Machine Ethique
color 0B

echo.
echo ========================================
echo    INSTALLATION AUTOMATIQUE
echo ========================================
echo.

echo [INFO] Vérification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installé
    echo [INFO] Téléchargement et installation de Node.js...
    echo [INFO] Veuillez installer Node.js depuis https://nodejs.org/
    echo [INFO] Puis relancez ce script
    pause
    exit /b 1
)

echo [SUCCES] Node.js détecté

echo.
echo [INFO] Installation des dépendances...
npm install

echo.
echo [SUCCES] Installation terminée !
echo [INFO] Vous pouvez maintenant lancer LAUNCH.bat
echo.
pause
`;

fs.writeFileSync(path.join(outputDir, 'INSTALL.bat'), installScript);
console.log('✅ Script d\'installation créé');

console.log('\n🎉 Construction terminée avec succès!');
console.log('\n📁 Fichiers créés dans dist-malware-detection/:');
console.log('✅ package.json - Configuration de l\'application');
console.log('✅ main-malware-detection.js - Fichier principal');
console.log('✅ malware-detection-interface.html - Interface');
console.log('✅ assets/ - Dossier des ressources (avec icône)');
console.log('✅ LAUNCH.bat - Script de lancement');
console.log('✅ INSTALL.bat - Script d\'installation');
console.log('✅ README.md - Documentation');

console.log('\n🚀 Pour utiliser l\'exécutable portable:');
console.log('1. Naviguez vers le dossier dist-malware-detection/');
console.log('2. Double-cliquez sur INSTALL.bat (première fois)');
console.log('3. Double-cliquez sur LAUNCH.bat pour lancer l\'application');
console.log('4. Ou utilisez: npm start');

console.log('\n💡 Note: Cette version portable nécessite Node.js sur la machine cible');
console.log('   Pour un vrai exécutable autonome, utilisez electron-builder avec une connexion internet stable'); 