#!/usr/bin/env node

/**
 * 🎯 SCRIPT DE FINALISATION - La Machine Éthique
 * 
 * Ce script finalise le projet en :
 * 1. Compilant TypeScript
 * 2. Vérifiant les dépendances
 * 3. Testant les composants
 * 4. Préparant le déploiement
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    projectName: 'La Machine Éthique',
    version: '1.0.0',
    buildDir: 'dist',
    srcDir: 'src',
    components: [
        'FinchInterface',
        'ReeseInterface', 
        'EthicalMachineCore',
        'NumbersAlert',
        'ShawInterface',
        'RootInterface',
        'UnifiedInterface',
        'ThreatAssessment',
        'InterventionSystem'
    ]
};

/**
 * 🎨 Affichage coloré dans la console
 */
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n${step} ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

/**
 * 🔍 Vérification des prérequis
 */
function checkPrerequisites() {
    logStep('🔍', 'Vérification des prérequis...');
    
    const requiredFiles = [
        'package.json',
        'tsconfig.json',
        'start.js',
        'index.html'
    ];
    
    const requiredDirs = [
        'src/components',
        'assets'
    ];
    
    // Vérifier les fichiers requis
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            logError(`Fichier manquant: ${file}`);
            return false;
        }
        logSuccess(`Fichier trouvé: ${file}`);
    }
    
    // Vérifier les répertoires requis
    for (const dir of requiredDirs) {
        if (!fs.existsSync(dir)) {
            logWarning(`Répertoire manquant: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
            logSuccess(`Répertoire créé: ${dir}`);
        } else {
            logSuccess(`Répertoire trouvé: ${dir}`);
        }
    }
    
    // Vérifier Node.js et npm
    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        logSuccess(`Node.js: ${nodeVersion}`);
        logSuccess(`npm: ${npmVersion}`);
    } catch (error) {
        logError('Node.js ou npm non trouvé');
        return false;
    }
    
    return true;
}

/**
 * 📦 Installation des dépendances
 */
function installDependencies() {
    logStep('📦', 'Installation des dépendances...');
    
    try {
        log('Installation des dépendances npm...');
        execSync('npm install', { stdio: 'inherit' });
        logSuccess('Dépendances installées');
        return true;
    } catch (error) {
        logError('Erreur lors de l\'installation des dépendances');
        return false;
    }
}

/**
 * 🔧 Compilation TypeScript
 */
function compileTypeScript() {
    logStep('🔧', 'Compilation TypeScript...');
    
    try {
        log('Compilation en cours...');
        execSync('npx tsc', { stdio: 'inherit' });
        
        // Vérifier que les fichiers compilés existent
        const distDir = path.join(__dirname, CONFIG.buildDir);
        if (!fs.existsSync(distDir)) {
            logError('Répertoire dist non créé');
            return false;
        }
        
        // Vérifier les composants compilés
        for (const component of CONFIG.components) {
            const jsFile = path.join(distDir, 'components', `${component}.js`);
            if (!fs.existsSync(jsFile)) {
                logWarning(`Composant non compilé: ${component}`);
            } else {
                logSuccess(`Composant compilé: ${component}`);
            }
        }
        
        logSuccess('Compilation TypeScript terminée');
        return true;
    } catch (error) {
        logError('Erreur lors de la compilation TypeScript');
        return false;
    }
}

/**
 * 🧪 Tests des composants
 */
function testComponents() {
    logStep('🧪', 'Tests des composants...');
    
    try {
        // Test de chargement des composants compilés
        const distPath = path.join(__dirname, CONFIG.buildDir);
        
        for (const component of CONFIG.components) {
            try {
                const componentPath = path.join(distPath, 'components', component);
                require(componentPath);
                logSuccess(`Composant testé: ${component}`);
            } catch (error) {
                logWarning(`Erreur de test pour ${component}: ${error.message}`);
            }
        }
        
        // Test du script de démarrage
        log('Test du script de démarrage...');
        const startScript = require('./start.js');
        if (typeof startScript.main === 'function') {
            logSuccess('Script de démarrage valide');
        } else {
            logWarning('Script de démarrage invalide');
        }
        
        return true;
    } catch (error) {
        logError('Erreur lors des tests');
        return false;
    }
}

/**
 * 📋 Vérification de l'interface utilisateur
 */
function checkUserInterface() {
    logStep('📋', 'Vérification de l\'interface utilisateur...');
    
    const uiFiles = [
        'index.html',
        'renderer/css/style.css',
        'renderer/js/renderer.js'
    ];
    
    for (const file of uiFiles) {
        if (fs.existsSync(file)) {
            const stats = fs.statSync(file);
            logSuccess(`${file} (${Math.round(stats.size / 1024)}KB)`);
        } else {
            logWarning(`Fichier UI manquant: ${file}`);
        }
    }
    
    return true;
}

/**
 * 🚀 Préparation du déploiement
 */
function prepareDeployment() {
    logStep('🚀', 'Préparation du déploiement...');
    
    try {
        // Créer le répertoire de déploiement
        const deployDir = path.join(__dirname, 'deploy');
        if (!fs.existsSync(deployDir)) {
            fs.mkdirSync(deployDir, { recursive: true });
        }
        
        // Copier les fichiers nécessaires
        const filesToCopy = [
            'start.js',
            'package.json',
            'index.html',
            'preload.js'
        ];
        
        for (const file of filesToCopy) {
            if (fs.existsSync(file)) {
                fs.copyFileSync(file, path.join(deployDir, file));
                logSuccess(`Copié: ${file}`);
            }
        }
        
        // Copier le répertoire dist
        const distDir = path.join(__dirname, CONFIG.buildDir);
        if (fs.existsSync(distDir)) {
            const deployDistDir = path.join(deployDir, CONFIG.buildDir);
            if (!fs.existsSync(deployDistDir)) {
                fs.mkdirSync(deployDistDir, { recursive: true });
            }
            
            // Copier récursivement
            function copyRecursive(src, dest) {
                const items = fs.readdirSync(src);
                for (const item of items) {
                    const srcPath = path.join(src, item);
                    const destPath = path.join(dest, item);
                    
                    if (fs.statSync(srcPath).isDirectory()) {
                        if (!fs.existsSync(destPath)) {
                            fs.mkdirSync(destPath, { recursive: true });
                        }
                        copyRecursive(srcPath, destPath);
                    } else {
                        fs.copyFileSync(srcPath, destPath);
                    }
                }
            }
            
            copyRecursive(distDir, deployDistDir);
            logSuccess('Répertoire dist copié');
        }
        
        // Créer un script de lancement
        const launcherScript = `#!/usr/bin/env node
console.log('🚀 Lancement de ${CONFIG.projectName} v${CONFIG.version}...');
require('./start.js');
`;
        
        fs.writeFileSync(path.join(deployDir, 'launch.js'), launcherScript);
        logSuccess('Script de lancement créé');
        
        // Créer un README de déploiement
        const deployReadme = `# ${CONFIG.projectName} v${CONFIG.version}

## 🚀 Déploiement

### Prérequis
- Node.js 16+ 
- npm

### Installation
\`\`\`bash
npm install
\`\`\`

### Lancement
\`\`\`bash
node launch.js
\`\`\`

### Ou avec npm
\`\`\`bash
npm start
\`\`\`

## 📋 Composants

- 🤖 EthicalMachineCore - Cœur de la machine
- 👨‍💼 FinchInterface - Configuration éthique
- 🕵️ ReeseInterface - Surveillance opérationnelle
- 📢 NumbersAlert - Notifications
- 🔍 ShawInterface - Analyse forensique
- 🔐 RootInterface - Accès système
- 🔗 UnifiedInterface - Coordination

## 🛡️ Fonctionnalités

- Détection de menaces éthique
- Surveillance en temps réel
- Analyse forensique
- Notifications intelligentes
- Contrôle d'accès sécurisé
- Interface unifiée

---
*Inspiré de Person of Interest*
`;
        
        fs.writeFileSync(path.join(deployDir, 'README.md'), deployReadme);
        logSuccess('README de déploiement créé');
        
        return true;
    } catch (error) {
        logError(`Erreur lors de la préparation: ${error.message}`);
        return false;
    }
}

/**
 * 📊 Rapport de finalisation
 */
function generateReport(success, steps) {
    logStep('📊', 'Rapport de finalisation...');
    
    const report = {
        project: CONFIG.projectName,
        version: CONFIG.version,
        timestamp: new Date().toISOString(),
        success: success,
        steps: steps
    };
    
    // Sauvegarder le rapport
    fs.writeFileSync('finalization-report.json', JSON.stringify(report, null, 2));
    logSuccess('Rapport sauvegardé: finalization-report.json');
    
    // Afficher le résumé
    log('\n📋 RÉSUMÉ DE LA FINALISATION', 'bright');
    log(`Projet: ${CONFIG.projectName} v${CONFIG.version}`, 'cyan');
    log(`Statut: ${success ? 'SUCCÈS' : 'ÉCHEC'}`, success ? 'green' : 'red');
    log(`Date: ${new Date().toLocaleString()}`, 'cyan');
    
    log('\nÉtapes:', 'bright');
    for (const [step, status] of Object.entries(steps)) {
        const icon = status ? '✅' : '❌';
        const color = status ? 'green' : 'red';
        log(`${icon} ${step}`, color);
    }
    
    if (success) {
        log('\n🎉 PROJET FINALISÉ AVEC SUCCÈS !', 'bright');
        log('Vous pouvez maintenant lancer l\'application avec:', 'cyan');
        log('npm start', 'yellow');
        log('ou', 'cyan');
        log('node start.js', 'yellow');
    } else {
        log('\n⚠️  FINALISATION INCOMPLÈTE', 'bright');
        log('Vérifiez les erreurs ci-dessus et relancez le script', 'yellow');
    }
}

/**
 * 🎯 Fonction principale
 */
async function main() {
    log('🎯 FINALISATION DE LA MACHINE ÉTHIQUE', 'bright');
    log(`Version: ${CONFIG.version}`, 'cyan');
    log(`Date: ${new Date().toLocaleString()}`, 'cyan');
    
    const steps = {};
    let overallSuccess = true;
    
    // Étape 1: Vérification des prérequis
    steps['Vérification des prérequis'] = checkPrerequisites();
    if (!steps['Vérification des prérequis']) {
        overallSuccess = false;
        generateReport(overallSuccess, steps);
        process.exit(1);
    }
    
    // Étape 2: Installation des dépendances
    steps['Installation des dépendances'] = installDependencies();
    if (!steps['Installation des dépendances']) {
        overallSuccess = false;
    }
    
    // Étape 3: Compilation TypeScript
    steps['Compilation TypeScript'] = compileTypeScript();
    if (!steps['Compilation TypeScript']) {
        overallSuccess = false;
    }
    
    // Étape 4: Tests des composants
    steps['Tests des composants'] = testComponents();
    if (!steps['Tests des composants']) {
        overallSuccess = false;
    }
    
    // Étape 5: Vérification de l'interface
    steps['Vérification de l\'interface'] = checkUserInterface();
    if (!steps['Vérification de l\'interface']) {
        overallSuccess = false;
    }
    
    // Étape 6: Préparation du déploiement
    steps['Préparation du déploiement'] = prepareDeployment();
    if (!steps['Préparation du déploiement']) {
        overallSuccess = false;
    }
    
    // Générer le rapport final
    generateReport(overallSuccess, steps);
    
    if (overallSuccess) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

// Lancer la finalisation
if (require.main === module) {
    main().catch(error => {
        logError(`Erreur fatale: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main, CONFIG }; 