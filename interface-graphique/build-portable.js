const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Construction de La Machine Éthique - Version Portable');

// Créer le dossier de distribution
const distDir = path.join(__dirname, 'dist-portable');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Fichiers à copier
const filesToCopy = [
    'electron-app.js',
    'security-detector.js',
    'preload.js',
    'port-scanner.py',
    'index.html',
    'package.json',
    'node_modules'
];

// Copier les fichiers
console.log('📁 Copie des fichiers...');
filesToCopy.forEach(file => {
    const source = path.join(__dirname, file);
    const dest = path.join(distDir, file);
    
    if (fs.existsSync(source)) {
        if (fs.lstatSync(source).isDirectory()) {
            // Copier récursivement les dossiers
            copyDirectory(source, dest);
        } else {
            // Copier les fichiers
            fs.copyFileSync(source, dest);
        }
        console.log(`✅ ${file}`);
    } else {
        console.log(`⚠️  ${file} non trouvé`);
    }
});

// Créer le script de lancement
const launcherScript = `@echo off
echo 🚀 Démarrage de La Machine Éthique...
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé ou n'est pas dans le PATH
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier si les dépendances sont installées
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    npm install --production
)

REM Démarrer l'application
echo 🟢 Lancement de La Machine Éthique...
node electron-app.js

pause
`;

fs.writeFileSync(path.join(distDir, 'launch.bat'), launcherScript);

// Créer le script de lancement PowerShell
const psLauncherScript = `# La Machine Éthique - Lanceur PowerShell
Write-Host "🚀 Démarrage de La Machine Éthique..." -ForegroundColor Green
Write-Host ""

# Vérifier Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js depuis https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Vérifier les dépendances
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install --production
}

# Démarrer l'application
Write-Host "🟢 Lancement de La Machine Éthique..." -ForegroundColor Green
node electron-app.js

Read-Host "Appuyez sur Entrée pour quitter"
`;

fs.writeFileSync(path.join(distDir, 'launch.ps1'), psLauncherScript);

// Créer le README
const readme = `# La Machine Éthique - Version Portable

## 🚀 Démarrage Rapide

### Option 1: Windows (CMD)
Double-cliquez sur \`launch.bat\`

### Option 2: Windows (PowerShell)
1. Clic droit sur \`launch.ps1\`
2. "Exécuter avec PowerShell"

### Option 3: Manuel
1. Ouvrir un terminal dans ce dossier
2. Exécuter: \`node electron-app.js\`

## 📋 Prérequis

- **Node.js** (version 16 ou supérieure)
  - Télécharger depuis: https://nodejs.org/
  - Ajouter au PATH système

## 🔧 Fonctionnalités

- ✅ Détection d'injection SQL
- ✅ Scan de ports réseau
- ✅ Monitoring en temps réel
- ✅ Blocage d'IPs malveillantes
- ✅ Interface graphique moderne
- ✅ Cadre éthique intégré

## 🛡️ Sécurité

Cette version inclut:
- Détection automatique des attaques
- Blocage intelligent des menaces
- Audit éthique en continu
- Logs détaillés des événements

## 📞 Support

Pour toute question ou problème:
- Vérifiez que Node.js est correctement installé
- Consultez les logs dans la console
- Redémarrez l'application si nécessaire

---
*La Machine Éthique - Système de Protection Inspiré de Person of Interest*
`;

fs.writeFileSync(path.join(distDir, 'README.md'), readme);

console.log('✅ Construction terminée !');
console.log(`📁 Dossier de sortie: ${distDir}`);
console.log('');
console.log('🚀 Pour démarrer:');
console.log('   - Double-cliquez sur launch.bat (Windows CMD)');
console.log('   - Ou exécutez launch.ps1 avec PowerShell');
console.log('   - Ou manuellement: node electron-app.js');

function copyDirectory(source, destination) {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }
    
    const files = fs.readdirSync(source);
    files.forEach(file => {
        const sourcePath = path.join(source, file);
        const destPath = path.join(destination, file);
        
        if (fs.lstatSync(sourcePath).isDirectory()) {
            copyDirectory(sourcePath, destPath);
        } else {
            fs.copyFileSync(sourcePath, destPath);
        }
    });
} 