#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 La Machine Éthique - Système de Protection');
console.log('Inspiré de Person of Interest - Harold Finch');
console.log('===============================================\n');

// Vérifier si nous sommes dans le bon dossier
const electronAppPath = path.join(__dirname, 'electron-app.js');
if (!fs.existsSync(electronAppPath)) {
    console.log('❌ Erreur: electron-app.js non trouvé');
    console.log('Assurez-vous que tous les fichiers sont présents dans le dossier');
    process.exit(1);
}

// Vérifier si Node.js est disponible
const nodeVersion = process.version;
console.log(`✅ Node.js détecté: ${nodeVersion}`);

// Essayer de lancer Electron
console.log('📦 Lancement d\'Electron...\n');

try {
    // Essayer d'abord avec npx electron
    const electronProcess = spawn('npx', ['electron', 'electron-app.js'], {
        stdio: 'inherit',
        shell: true
    });

    electronProcess.on('error', (error) => {
        console.log('❌ Erreur lors du lancement d\'Electron:', error.message);
        console.log('\n🔧 Solutions possibles:');
        console.log('1. Installez Electron: npm install electron --save-dev');
        console.log('2. Ou utilisez le script .bat fourni');
        process.exit(1);
    });

    electronProcess.on('close', (code) => {
        if (code !== 0) {
            console.log(`\n⚠️  Electron s'est fermé avec le code: ${code}`);
        }
    });

} catch (error) {
    console.log('❌ Erreur:', error.message);
    console.log('\n🔧 Essayez d\'installer Electron: npm install electron --save-dev');
} 