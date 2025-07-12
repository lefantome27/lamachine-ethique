const fs = require('fs');
const path = require('path');

console.log('🔧 Correction automatique des apostrophes françaises...\n');

// Fonction pour corriger les apostrophes dans un fichier
function fixApostrophes(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        // Remplacer les apostrophes françaises par des apostrophes droites
        content = content.replace(/[''']/g, "'");
        
        // Remplacer les guillemets français par des guillemets droits
        content = content.replace(/[""]/g, '"');
        
        // Si le contenu a changé, sauvegarder
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Corrigé: ${filePath}`);
            return true;
        } else {
            console.log(`ℹ️  Aucune correction nécessaire: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Erreur lors du traitement de ${filePath}:`, error.message);
        return false;
    }
}

// Fonction pour traiter récursivement un dossier
function processDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let filesFixed = 0;
    
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
            // Ignorer node_modules et .git
            if (entry.name !== 'node_modules' && entry.name !== '.git') {
                filesFixed += processDirectory(fullPath);
            }
        } else if (entry.isFile()) {
            // Traiter seulement les fichiers JavaScript, TypeScript et HTML
            const ext = path.extname(entry.name).toLowerCase();
            if (['.js', '.ts', '.jsx', '.tsx', '.html'].includes(ext)) {
                if (fixApostrophes(fullPath)) {
                    filesFixed++;
                }
            }
        }
    }
    
    return filesFixed;
}

// Traiter le dossier courant et ses sous-dossiers
console.log('📁 Recherche de fichiers à corriger...\n');

const currentDir = process.cwd();
const filesFixed = processDirectory(currentDir);

console.log(`\n🎉 Correction terminée !`);
console.log(`📊 Fichiers corrigés: ${filesFixed}`);

if (filesFixed > 0) {
    console.log('\n✅ Les apostrophes françaises ont été remplacées par des apostrophes droites');
    console.log('✅ L\'application devrait maintenant fonctionner correctement');
} else {
    console.log('\nℹ️  Aucun fichier n\'a nécessité de correction');
}

console.log('\n🚀 Tu peux maintenant relancer l\'application avec: npm start'); 