const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Création de l\'exécutable La Machine Éthique...');

// Créer le dossier dist s'il n'existe pas
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

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

// Copier le dossier node_modules
const nodeModulesSource = path.join(__dirname, 'node_modules');
const nodeModulesDest = path.join(distDir, 'node_modules');
if (fs.existsSync(nodeModulesSource)) {
    console.log('📦 Copie de node_modules...');
    execSync(`xcopy "${nodeModulesSource}" "${nodeModulesDest}" /E /I /Y`, { stdio: 'inherit' });
}

// Créer un script de lancement
const launcherScript = `@echo off
echo 🚀 Lancement de La Machine Éthique...
cd /d "%~dp0"
node electron-app.js
pause
`;

fs.writeFileSync(path.join(distDir, 'launch.bat'), launcherScript);
console.log('  ✓ Script de lancement créé');

// Créer un README
const readme = `# La Machine Éthique

## Installation

1. Assurez-vous d'avoir Node.js installé (version 16 ou supérieure)
2. Ouvrez un terminal dans ce dossier
3. Exécutez: \`npm install\`
4. Lancez l'application: \`node electron-app.js\`

## Alternative

Vous pouvez aussi double-cliquer sur \`launch.bat\` pour lancer l'application.

## Fonctionnalités

- Interface éthique de configuration
- Évaluation des menaces
- Système d'intervention éthique
- Maintenance automatisée

Inspiré de Person of Interest - Harold Finch
`;

fs.writeFileSync(path.join(distDir, 'README.md'), readme);
console.log('  ✓ README créé');

console.log('\n✅ Build terminé !');
console.log(`📁 L'application se trouve dans: ${distDir}`);
console.log('🚀 Pour lancer: cd dist && node electron-app.js'); 