#!/usr/bin/env node

/**
 * 🚀 LA MACHINE ÉTHIQUE - Script de Démarrage Principal
 * 
 * Ce script initialise tous les composants de La Machine Éthique
 * et lance l'application Electron avec l'interface unifiée.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Import des composants TypeScript (compilés)
let UnifiedInterface;
let EthicalMachineCore;

try {
    // Charger les composants compilés
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
        UnifiedInterface = require('./dist/components/UnifiedInterface').UnifiedInterface;
        EthicalMachineCore = require('./dist/components/EthicalMachineCore').EthicalMachineCore;
    } else {
        console.log('⚠️  Composants TypeScript non compilés, utilisation du mode développement...');
        // Mode développement - charger directement
        UnifiedInterface = require('./src/components/UnifiedInterface').UnifiedInterface;
        EthicalMachineCore = require('./src/components/EthicalMachineCore').EthicalMachineCore;
    }
} catch (error) {
    console.error('❌ Erreur lors du chargement des composants:', error.message);
    console.log('🔧 Tentative de compilation TypeScript...');
    
    // Tenter de compiler TypeScript
    const { execSync } = require('child_process');
    try {
        execSync('npx tsc', { stdio: 'inherit' });
        console.log('✅ Compilation TypeScript réussie');
        UnifiedInterface = require('./dist/components/UnifiedInterface').UnifiedInterface;
        EthicalMachineCore = require('./dist/components/EthicalMachineCore').EthicalMachineCore;
    } catch (compileError) {
        console.error('❌ Échec de la compilation TypeScript:', compileError.message);
        process.exit(1);
    }
}

// Variables globales
let mainWindow;
let unifiedInterface;
let machineCore;

// Configuration de l'application
const APP_CONFIG = {
    name: 'La Machine Éthique',
    version: '1.0.0',
    window: {
        width: 1600,
        height: 1000,
        minWidth: 1200,
        minHeight: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    }
};

/**
 * 🎯 Initialisation de La Machine Éthique
 */
async function initializeMachine() {
    console.log('🤖 Initialisation de La Machine Éthique...');
    
    try {
        // Initialiser le cœur de la machine
        machineCore = new EthicalMachineCore();
        console.log('✅ Cœur de la machine initialisé');
        
        // Initialiser l'interface unifiée
        unifiedInterface = new UnifiedInterface();
        console.log('✅ Interface unifiée initialisée');
        
        // Vérifier le statut du système
        const status = unifiedInterface.getSystemStatus();
        console.log(`📊 Statut du système: ${status}`);
        
        // Afficher le dashboard
        const dashboard = unifiedInterface.getDashboard();
        console.log('📋 Dashboard généré:', {
            systemStatus: dashboard.systemStatus,
            activeConnections: dashboard.activeConnections,
            components: Object.keys(dashboard.components)
        });
        
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        return false;
    }
}

/**
 * 🖥️ Création de la fenêtre principale
 */
function createMainWindow() {
    console.log('🖥️  Création de la fenêtre principale...');
    
    mainWindow = new BrowserWindow({
        ...APP_CONFIG.window,
        title: APP_CONFIG.name,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        show: false, // Ne pas afficher avant d'être prêt
        webPreferences: {
            ...APP_CONFIG.window.webPreferences,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Charger l'interface HTML
    const htmlPath = path.join(__dirname, 'index.html');
    mainWindow.loadFile(htmlPath);

    // Afficher la fenêtre quand elle est prête
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log('✅ Fenêtre principale affichée');
        
        // Envoyer les données initiales à l'interface
        if (unifiedInterface) {
            const dashboard = unifiedInterface.getDashboard();
            mainWindow.webContents.send('machine-initialized', dashboard);
        }
    });

    // Gestion de la fermeture
    mainWindow.on('closed', () => {
        console.log('🔒 Fermeture de la fenêtre principale');
        mainWindow = null;
    });

    // Ouvrir les outils de développement en mode développement
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
        console.log('🔧 Outils de développement ouverts');
    }
}

/**
 * 📡 Configuration des événements IPC
 */
function setupIPCHandlers() {
    console.log('📡 Configuration des gestionnaires IPC...');
    
    // Obtenir le statut du système
    ipcMain.handle('get-system-status', () => {
        return unifiedInterface ? unifiedInterface.getSystemStatus() : 'ERROR';
    });
    
    // Obtenir le dashboard
    ipcMain.handle('get-dashboard', () => {
        return unifiedInterface ? unifiedInterface.getDashboard() : null;
    });
    
    // Exécuter une action utilisateur
    ipcMain.handle('execute-action', (event, action) => {
        if (unifiedInterface) {
            return unifiedInterface.executeUserAction(action);
        }
        return { success: false, message: 'Interface non initialisée' };
    });
    
    // Obtenir les événements récents
    ipcMain.handle('get-event-log', () => {
        return unifiedInterface ? unifiedInterface.getEventLog() : [];
    });
    
    // Obtenir le statut des composants
    ipcMain.handle('get-component-status', () => {
        return unifiedInterface ? unifiedInterface.getComponentStatus() : {};
    });
    
    // Évaluer une menace
    ipcMain.handle('assess-threat', (event, threatData) => {
        if (machineCore) {
            return machineCore.processInputData({
                id: `threat_${Date.now()}`,
                type: 'threat_assessment',
                content: threatData,
                timestamp: new Date(),
                source: 'user_interface'
            });
        }
        return { success: false, message: 'Machine Core non initialisé' };
    });
    
    // Démarrer le monitoring
    ipcMain.handle('start-monitoring', () => {
        console.log('🟢 Démarrage du monitoring...');
        return { success: true, message: 'Monitoring démarré' };
    });
    
    // Arrêter le monitoring
    ipcMain.handle('stop-monitoring', () => {
        console.log('🔴 Arrêt du monitoring...');
        return { success: true, message: 'Monitoring arrêté' };
    });
    
    // Scanner des ports
    ipcMain.handle('scan-ports', async (event, target) => {
        console.log(`🔍 Scan de ports sur ${target}...`);
        // Simulation d'un scan de ports
        return {
            success: true,
            results: [
                {
                    host: target,
                    state: 'up',
                    ports: [
                        { port: 80, state: 'open', service: 'http' },
                        { port: 443, state: 'open', service: 'https' },
                        { port: 22, state: 'closed', service: 'ssh' }
                    ]
                }
            ]
        };
    });
    
    // Tester une requête SQL
    ipcMain.handle('test-sql-query', (event, query) => {
        const detected = /('|--|or|select|union|drop|sleep|benchmark)/i.test(query);
        return {
            detected,
            message: detected ? '⚠️ Injection SQL détectée !' : '✅ Requête sécurisée',
            query
        };
    });
    
    console.log('✅ Gestionnaires IPC configurés');
}

/**
 * 🚀 Point d'entrée principal
 */
async function main() {
    console.log('🚀 Démarrage de La Machine Éthique...');
    console.log(`📋 Version: ${APP_CONFIG.version}`);
    console.log(`🔧 Mode: ${process.env.NODE_ENV || 'production'}`);
    
    // Attendre que l'application soit prête
    app.whenReady().then(async () => {
        console.log('✅ Application Electron prête');
        
        // Initialiser La Machine
        const machineReady = await initializeMachine();
        if (!machineReady) {
            console.error('❌ Échec de l\'initialisation de La Machine');
            app.quit();
            return;
        }
        
        // Configurer les gestionnaires IPC
        setupIPCHandlers();
        
        // Créer la fenêtre principale
        createMainWindow();
        
        console.log('🎉 La Machine Éthique est opérationnelle !');
    });
    
    // Gestion de la fermeture de l'application
    app.on('window-all-closed', () => {
        console.log('🔒 Toutes les fenêtres fermées');
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
    
    // Gestion des erreurs non capturées
    process.on('uncaughtException', (error) => {
        console.error('❌ Erreur non capturée:', error);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Promesse rejetée non gérée:', reason);
    });
}

// Lancer l'application
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Erreur fatale lors du démarrage:', error);
        process.exit(1);
    });
}

module.exports = { main, initializeMachine, createMainWindow }; 