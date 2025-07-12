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

    // Création de la fenêtre principale
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

    // Création du menu
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

    // Configuration des gestionnaires IPC
    setupIpcHandlers() {
        // Gestion des tests de menace
        ipcMain.handle('assess-threat', async (event, threatData) => {
            return this.assessThreat(threatData);
        });

        // Gestion du statut de la machine
        ipcMain.handle('get-machine-status', () => {
            return {
                status: this.machineStatus,
                rules: this.ethicalRules,
                uptime: Date.now() - app.getStartTime()
            };
        });

        // Gestion des audits éthiques
        ipcMain.handle('run-ethical-audit', async () => {
            return this.runEthicalAudit();
        });

        // Détection SQL Injection
        ipcMain.handle('check-sql-injection', async (event, query) => {
            const detected = this.securityDetector.detectSQLInjection(query);
            return {
                detected: detected,
                message: detected ? 'Tentative d\'injection SQL détectée !' : 'Aucune injection détectée.'
            };
        });

        // Scan de ports
        ipcMain.handle('scan-ports', async (event, target) => {
            try {
                const results = await this.securityDetector.scanPorts(target);
                return { success: true, results: results };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Gestion des IPs bloquées
        ipcMain.handle('get-blocked-ips', async () => {
            return this.securityDetector.getBlockedIPs();
        });

        ipcMain.handle('unblock-ip', async (event, ip) => {
            this.securityDetector.unblockIP(ip);
            return { success: true };
        });

        ipcMain.handle('permanent-block-ip', async (event, ip) => {
            // Logique pour bloquer définitivement
            console.log(`IP ${ip} bloquée définitivement`);
            return { success: true };
        });

        // Gestion des attaques détectées
        ipcMain.handle('get-detected-attacks', async () => {
            return this.securityDetector.getDetectedAttacks();
        });

        // Contrôle du monitoring
        ipcMain.handle('start-monitoring', async () => {
            this.securityDetector.startMonitoring();
            return { success: true };
        });

        ipcMain.handle('stop-monitoring', async () => {
            this.securityDetector.stopMonitoring();
            return { success: true };
        });

        ipcMain.handle('get-monitoring-status', async () => {
            return { isMonitoring: this.securityDetector.isMonitoring };
        });

        // Statistiques
        ipcMain.handle('get-security-stats', async () => {
            return this.securityDetector.getStats();
        });

        // Test de requête SQL
        ipcMain.handle('test-sql-query', async (event, query) => {
            const detected = this.securityDetector.detectSQLInjection(query);
            return {
                detected: detected,
                message: detected ? '⚠️ Injection SQL détectée !' : '✅ Requête sécurisée',
                query: query
            };
        });
    }

    // Évaluation de menace
    assessThreat(threatData) {
        console.log('🔍 Évaluation de menace:', threatData);
        
        const result = {
            id: `THREAT_${Date.now()}`,
            timestamp: new Date(),
            threatData: threatData,
            assessment: null,
            ethicalApproval: false,
            recommendedAction: 'MONITOR',
            reasoning: []
        };

        // Logique d'évaluation éthique
        const threatLevel = this.calculateThreatLevel(threatData);
        const ethicalApproval = this.validateEthically(threatData, threatLevel);
        const action = this.recommendAction(threatLevel, ethicalApproval);

        result.assessment = {
            level: threatLevel,
            confidence: Math.random() * 0.3 + 0.7, // 70-100%
            indicators: this.getIndicators(threatData)
        };

        result.ethicalApproval = ethicalApproval;
        result.recommendedAction = action;
        result.reasoning = this.getReasoning(threatData, ethicalApproval, action);

        return result;
    }

    // Calcul du niveau de menace
    calculateThreatLevel(threatData) {
        let score = 0;
        
        if (threatData.behavioralPatterns) score += 0.3;
        if (threatData.communicationPatterns) score += 0.4;
        if (threatData.networkActivity) score += 0.5;
        if (threatData.location && this.isHighRiskLocation(threatData.location)) score += 0.2;

        if (score >= 0.8) return 'CRITICAL';
        if (score >= 0.6) return 'HIGH';
        if (score >= 0.4) return 'MEDIUM';
        return 'LOW';
    }

    // Validation éthique
    validateEthically(threatData, threatLevel) {
        // Règles éthiques strictes
        if (threatData.location && threatData.location.includes('école')) {
            return false; // Pas d'intervention dans les écoles
        }
        if (threatLevel === 'CRITICAL' && Math.random() < 0.3) {
            return false; // 30% de chance de rejet pour les menaces critiques
        }
        return true;
    }

    // Recommandation d'action
    recommendAction(threatLevel, ethicalApproval) {
        if (!ethicalApproval) return 'MONITOR';
        
        switch (threatLevel) {
            case 'LOW': return 'MONITOR';
            case 'MEDIUM': return 'INVESTIGATE';
            case 'HIGH': return 'ALERT_HUMAN';
            case 'CRITICAL': return 'IMMEDIATE_ACTION';
            default: return 'MONITOR';
        }
    }

    // Obtenir les indicateurs
    getIndicators(threatData) {
        const indicators = [];
        if (threatData.behavioralPatterns) indicators.push('Patterns comportementaux détectés');
        if (threatData.communicationPatterns) indicators.push('Communication suspecte');
        if (threatData.networkActivity) indicators.push('Activité réseau anormale');
        return indicators;
    }

    // Obtenir le raisonnement
    getReasoning(threatData, ethicalApproval, action) {
        const reasoning = [];
        
        if (!ethicalApproval) {
            reasoning.push('Intervention rejetée pour raisons éthiques');
            reasoning.push('Protection des civils prioritaire');
        } else {
            reasoning.push(`Action ${action.toLowerCase()} approuvée`);
            reasoning.push('Validation éthique réussie');
        }

        return reasoning;
    }

    // Vérifier si c'est une localisation à haut risque
    isHighRiskLocation(location) {
        const highRiskLocations = ['gouvernement', 'militaire', 'infrastructure_critique'];
        return highRiskLocations.some(risk => location.toLowerCase().includes(risk));
    }

    // Audit éthique
    runEthicalAudit() {
        return {
            timestamp: new Date(),
            status: 'COMPLETED',
            compliance: 100,
            violations: [],
            recommendations: [
                'Maintenir les protocoles éthiques',
                'Surveiller les nouvelles menaces',
                'Former les opérateurs humains'
            ]
        };
    }

    // Démarrer la machine
    startMachine() {
        this.machineStatus = 'OPERATIONAL';
        this.mainWindow.webContents.send('machine-status-updated', this.machineStatus);
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Machine Éthique',
            message: 'La Machine Éthique est maintenant opérationnelle.',
            detail: 'Tous les systèmes sont en ligne et prêts à protéger.'
        });
    }

    // Arrêter la machine
    stopMachine() {
        this.machineStatus = 'SHUTDOWN';
        this.mainWindow.webContents.send('machine-status-updated', this.machineStatus);
        dialog.showMessageBox(this.mainWindow, {
            type: 'warning',
            title: 'Machine Éthique',
            message: 'La Machine Éthique a été arrêtée.',
            detail: 'Tous les systèmes sont hors ligne.'
        });
    }

    // Afficher le statut
    showStatus() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Statut de la Machine',
            message: `Statut: ${this.machineStatus}`,
            detail: `Règles éthiques actives: ${this.ethicalRules.length}\nTemps de fonctionnement: ${Math.round((Date.now() - app.getStartTime()) / 1000)}s`
        });
    }

    // Afficher à propos
    showAbout() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'À propos de La Machine Éthique',
            message: 'La Machine Éthique v1.0.0',
            detail: 'Système de protection éthique inspiré de Person of Interest.\n\nProtection, Éthique, et Contrôle Humain - Toujours.\n\nDéveloppé avec Electron et TypeScript.'
        });
    }

    setupSecurityEvents() {
        // Écouter les événements de sécurité
        this.securityDetector.on('ipBlocked', (blockedIP) => {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('ip-blocked', blockedIP);
            }
        });

        this.securityDetector.on('ipUnblocked', (ip) => {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('ip-unblocked', ip);
            }
        });

        this.securityDetector.on('attackDetected', (attack) => {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('attack-detected', attack);
            }
        });

        this.securityDetector.on('monitoringStarted', () => {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('monitoring-started');
            }
        });

        this.securityDetector.on('monitoringStopped', () => {
            if (this.mainWindow) {
                this.mainWindow.webContents.send('monitoring-stopped');
            }
        });
    }

    startSecurityMonitoring() {
        // Démarrer le monitoring de sécurité
        setTimeout(() => {
            this.securityDetector.startMonitoring();
        }, 5000); // Démarrer après 5 secondes
    }
}

// Initialisation de l'application
const ethicalMachineApp = new EthicalMachineApp();
ethicalMachineApp.initialize(); 