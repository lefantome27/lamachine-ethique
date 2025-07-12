// ===== APPLICATION ELECTRON - MACHINE ÉTHIQUE =====
// Interface graphique pour la Machine Éthique inspirée de Person of Interest

const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const SecurityDetector = require('./security-detector');

// Classe principale de l'application
class EthicalMachineApp {
    constructor() {
        this.mainWindow = null;
        this.machineStatus = 'INITIALIZING';
        this.ethicalRules = [
            'Respect de la Vie Privée',
            'Collecte Minimale',
            'Transparence',
            'Contrôle Humain',
            'Prévention des Biais'
        ];
        this.securityDetector = new SecurityDetector();
        this.setupSecurityEvents();
    }

    // Initialisation de l'application
    initialize() {
        app.whenReady().then(() => {
            this.createMainWindow();
            this.createMenu();
            this.setupIpcHandlers();
            this.startSecurityMonitoring();
            
            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createMainWindow();
                }
            });
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
    }

    // Créer la fenêtre principale
    createMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1600,
            height: 1000,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            icon: path.join(__dirname, 'assets', 'icon.png'),
            title: 'La Machine Éthique - Système de Protection',
            show: false
        });

        // Charger l'interface HTML
        this.mainWindow.loadFile('index.html');

        // Afficher la fenêtre quand elle est prête
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            this.machineStatus = 'OPERATIONAL';
            this.mainWindow.webContents.send('machine-status-updated', this.machineStatus);
        });

        // Gestion des erreurs
        this.mainWindow.webContents.on('crashed', () => {
            console.error('Application crashed');
            this.machineStatus = 'ERROR';
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }

    // Créer le menu
    createMenu() {
        const template = [
            {
                label: 'Fichier',
                submenu: [
                    {
                        label: 'Nouveau Test',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => {
                            this.mainWindow.webContents.send('new-test');
                        }
                    },
                    {
                        label: 'Audit Éthique',
                        accelerator: 'CmdOrCtrl+A',
                        click: () => {
                            this.mainWindow.webContents.send('run-audit');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Quitter',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: () => {
                            app.quit();
                        }
                    }
                ]
            },
            {
                label: 'Vue',
                submenu: [
                    { role: 'reload' },
                    { role: 'forceReload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    { role: 'resetZoom' },
                    { role: 'zoomIn' },
                    { role: 'zoomOut' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' }
                ]
            },
            {
                label: 'Machine',
                submenu: [
                    {
                        label: 'Démarrer',
                        click: () => {
                            this.startMachine();
                        }
                    },
                    {
                        label: 'Arrêter',
                        click: () => {
                            this.stopMachine();
                        }
                    },
                    {
                        label: 'Statut',
                        click: () => {
                            this.showStatus();
                        }
                    }
                ]
            },
            {
                label: 'Aide',
                submenu: [
                    {
                        label: 'À propos',
                        click: () => {
                            this.showAbout();
                        }
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    // ... (le reste du fichier suit, 462 lignes au total)
} 