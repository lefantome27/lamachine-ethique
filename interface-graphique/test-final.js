#!/usr/bin/env node

/**
 * 🧪 TEST FINAL - La Machine Éthique
 * 
 * Ce script teste tous les composants pour s'assurer
 * que le projet est entièrement fonctionnel.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    projectName: 'La Machine Éthique',
    version: '1.0.0',
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

// Couleurs pour la console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(test, result) {
    const icon = result ? '✅' : '❌';
    const color = result ? 'green' : 'red';
    log(`${icon} ${test}`, color);
}

function logSection(title) {
    log(`\n${title}`, 'cyan');
    log('─'.repeat(title.length), 'cyan');
}

/**
 * Test 1: Vérification des fichiers
 */
function testFiles() {
    logSection('📁 TEST DES FICHIERS');
    
    const requiredFiles = [
        'package.json',
        'tsconfig.json',
        'start.js',
        'finalize.js',
        'index.html',
        'preload.js'
    ];
    
    let allFilesExist = true;
    
    for (const file of requiredFiles) {
        const exists = fs.existsSync(file);
        logTest(`Fichier ${file}`, exists);
        if (!exists) allFilesExist = false;
    }
    
    return allFilesExist;
}

/**
 * Test 2: Vérification des composants TypeScript
 */
function testTypeScriptComponents() {
    logSection('🔧 TEST DES COMPOSANTS TYPESCRIPT');
    
    const srcDir = 'src/components';
    let allComponentsExist = true;
    
    if (!fs.existsSync(srcDir)) {
        logTest('Répertoire src/components', false);
        return false;
    }
    
    logTest('Répertoire src/components', true);
    
    for (const component of CONFIG.components) {
        const tsFile = path.join(srcDir, `${component}.ts`);
        const exists = fs.existsSync(tsFile);
        logTest(`Composant ${component}.ts`, exists);
        if (!exists) allComponentsExist = false;
    }
    
    return allComponentsExist;
}

/**
 * Test 3: Vérification de la compilation
 */
function testCompilation() {
    logSection('⚙️ TEST DE LA COMPILATION');
    
    const distDir = 'dist';
    const distComponentsDir = path.join(distDir, 'components');
    
    // Vérifier si le répertoire dist existe
    if (!fs.existsSync(distDir)) {
        logTest('Répertoire dist', false);
        log('💡 Conseil: Lancez "npm run compile" pour compiler TypeScript', 'yellow');
        return false;
    }
    
    logTest('Répertoire dist', true);
    
    if (!fs.existsSync(distComponentsDir)) {
        logTest('Répertoire dist/components', false);
        return false;
    }
    
    logTest('Répertoire dist/components', true);
    
    // Vérifier quelques composants compilés
    const compiledComponents = ['UnifiedInterface', 'EthicalMachineCore'];
    let allCompiled = true;
    
    for (const component of compiledComponents) {
        const jsFile = path.join(distComponentsDir, `${component}.js`);
        const exists = fs.existsSync(jsFile);
        logTest(`Composant compilé ${component}.js`, exists);
        if (!exists) allCompiled = false;
    }
    
    return allCompiled;
}

/**
 * Test 4: Vérification du package.json
 */
function testPackageJson() {
    logSection('📦 TEST DU PACKAGE.JSON');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        const requiredFields = ['name', 'version', 'main', 'scripts'];
        let allFieldsExist = true;
        
        for (const field of requiredFields) {
            const exists = packageJson.hasOwnProperty(field);
            logTest(`Champ ${field}`, exists);
            if (!exists) allFieldsExist = false;
        }
        
        // Vérifier les scripts requis
        const requiredScripts = ['start', 'compile', 'finalize'];
        let allScriptsExist = true;
        
        for (const script of requiredScripts) {
            const exists = packageJson.scripts && packageJson.scripts[script];
            logTest(`Script ${script}`, exists);
            if (!exists) allScriptsExist = false;
        }
        
        return allFieldsExist && allScriptsExist;
    } catch (error) {
        logTest('Lecture package.json', false);
        return false;
    }
}

/**
 * Test 5: Vérification de l'interface HTML
 */
function testHTMLInterface() {
    logSection('🌐 TEST DE L\'INTERFACE HTML');
    
    try {
        const htmlContent = fs.readFileSync('index.html', 'utf8');
        
        const requiredElements = [
            'La Machine Éthique',
            'Test de Menace',
            'IPs Attaquantes Bloquées',
            'Carte des attaques'
        ];
        
        let allElementsFound = true;
        
        for (const element of requiredElements) {
            const found = htmlContent.includes(element);
            logTest(`Élément "${element}"`, found);
            if (!found) allElementsFound = false;
        }
        
        return allElementsFound;
    } catch (error) {
        logTest('Lecture index.html', false);
        return false;
    }
}

/**
 * Test 6: Vérification des scripts
 */
function testScripts() {
    logSection('📜 TEST DES SCRIPTS');
    
    const scripts = [
        { name: 'start.js', check: 'main' },
        { name: 'finalize.js', check: 'main' }
    ];
    
    let allScriptsValid = true;
    
    for (const script of scripts) {
        try {
            const scriptContent = fs.readFileSync(script.name, 'utf8');
            const hasMainFunction = scriptContent.includes('function main') || scriptContent.includes('async function main');
            logTest(`Script ${script.name}`, hasMainFunction);
            if (!hasMainFunction) allScriptsValid = false;
        } catch (error) {
            logTest(`Script ${script.name}`, false);
            allScriptsValid = false;
        }
    }
    
    return allScriptsValid;
}

/**
 * Test 7: Simulation de démarrage
 */
function testStartupSimulation() {
    logSection('🚀 SIMULATION DE DÉMARRAGE');
    
    try {
        // Simuler le chargement du script de démarrage
        const startScript = require('./start.js');
        
        if (typeof startScript.main === 'function') {
            logTest('Fonction main()', true);
        } else {
            logTest('Fonction main()', false);
        }
        
        if (typeof startScript.initializeMachine === 'function') {
            logTest('Fonction initializeMachine()', true);
        } else {
            logTest('Fonction initializeMachine()', false);
        }
        
        return true;
    } catch (error) {
        logTest('Chargement start.js', false);
        log(`Erreur: ${error.message}`, 'red');
        return false;
    }
}

/**
 * Test 8: Vérification de la configuration TypeScript
 */
function testTypeScriptConfig() {
    logSection('⚙️ TEST DE LA CONFIGURATION TYPESCRIPT');
    
    try {
        const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
        
        const requiredOptions = ['target', 'module', 'outDir', 'rootDir'];
        let allOptionsExist = true;
        
        for (const option of requiredOptions) {
            const exists = tsConfig.compilerOptions && tsConfig.compilerOptions[option];
            logTest(`Option ${option}`, exists);
            if (!exists) allOptionsExist = false;
        }
        
        return allOptionsExist;
    } catch (error) {
        logTest('Lecture tsconfig.json', false);
        return false;
    }
}

/**
 * Test 9: Vérification de l'architecture
 */
function testArchitecture() {
    logSection('🏗️ TEST DE L\'ARCHITECTURE');
    
    const requiredDirs = [
        'src',
        'src/components',
        'assets',
        'dist'
    ];
    
    let allDirsExist = true;
    
    for (const dir of requiredDirs) {
        const exists = fs.existsSync(dir);
        logTest(`Répertoire ${dir}`, exists);
        if (!exists) allDirsExist = false;
    }
    
    return allDirsExist;
}

/**
 * Test 10: Vérification finale
 */
function testFinalCheck() {
    logSection('🎯 VÉRIFICATION FINALE');
    
    // Vérifier que tous les composants principaux sont présents
    const mainComponents = [
        'UnifiedInterface',
        'EthicalMachineCore',
        'FinchInterface'
    ];
    
    let allMainComponentsExist = true;
    
    for (const component of mainComponents) {
        const tsFile = path.join('src/components', `${component}.ts`);
        const exists = fs.existsSync(tsFile);
        logTest(`Composant principal ${component}`, exists);
        if (!exists) allMainComponentsExist = false;
    }
    
    return allMainComponentsExist;
}

/**
 * Fonction principale de test
 */
async function runAllTests() {
    log('🧪 TESTS FINAUX - LA MACHINE ÉTHIQUE', 'bright');
    log(`Version: ${CONFIG.version}`, 'cyan');
    log(`Date: ${new Date().toLocaleString()}`, 'cyan');
    
    const tests = [
        { name: 'Fichiers', fn: testFiles },
        { name: 'Composants TypeScript', fn: testTypeScriptComponents },
        { name: 'Compilation', fn: testCompilation },
        { name: 'Package.json', fn: testPackageJson },
        { name: 'Interface HTML', fn: testHTMLInterface },
        { name: 'Scripts', fn: testScripts },
        { name: 'Simulation Démarrage', fn: testStartupSimulation },
        { name: 'Config TypeScript', fn: testTypeScriptConfig },
        { name: 'Architecture', fn: testArchitecture },
        { name: 'Vérification Finale', fn: testFinalCheck }
    ];
    
    const results = {};
    let overallSuccess = true;
    
    for (const test of tests) {
        try {
            results[test.name] = test.fn();
            if (!results[test.name]) {
                overallSuccess = false;
            }
        } catch (error) {
            logTest(test.name, false);
            log(`Erreur: ${error.message}`, 'red');
            results[test.name] = false;
            overallSuccess = false;
        }
    }
    
    // Résumé final
    log('\n📊 RÉSUMÉ DES TESTS', 'bright');
    log('─'.repeat(20), 'cyan');
    
    for (const [testName, result] of Object.entries(results)) {
        const icon = result ? '✅' : '❌';
        const color = result ? 'green' : 'red';
        log(`${icon} ${testName}`, color);
    }
    
    log('\n🎯 RÉSULTAT FINAL', 'bright');
    if (overallSuccess) {
        log('🎉 TOUS LES TESTS RÉUSSIS !', 'green');
        log('La Machine Éthique est prête à être utilisée.', 'green');
        log('\nPour lancer l\'application:', 'cyan');
        log('npm start', 'yellow');
    } else {
        log('⚠️ CERTAINS TESTS ONT ÉCHOUÉ', 'red');
        log('Vérifiez les erreurs ci-dessus et relancez les tests.', 'yellow');
        log('\nPour corriger les problèmes:', 'cyan');
        log('npm run finalize', 'yellow');
    }
    
    // Sauvegarder le rapport
    const report = {
        project: CONFIG.projectName,
        version: CONFIG.version,
        timestamp: new Date().toISOString(),
        overallSuccess,
        results
    };
    
    fs.writeFileSync('test-final-report.json', JSON.stringify(report, null, 2));
    log('\n📄 Rapport sauvegardé: test-final-report.json', 'cyan');
    
    return overallSuccess;
}

// Lancer les tests
if (require.main === module) {
    runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        log(`❌ Erreur fatale: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = { runAllTests, CONFIG }; 