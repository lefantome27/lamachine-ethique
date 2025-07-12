// ===== MAIN - Point d'entrée principal de La Machine =====
// Initialisation de l'interface unifiée et de l'application Electron

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { UnifiedInterface } from './components/UnifiedInterface';
import * as path from 'path';

class LaMachineApp {
    private mainWindow: BrowserWindow | null = null;
    private unifiedInterface: UnifiedInterface | null = null;
    private isDevelopment = process.env.NODE_ENV === 'development';

    constructor() {
        this.initializeApp();
    }

    private initializeApp() {
        // Initialiser l'interface unifiée
        this.unifiedInterface = new UnifiedInterface();

        // Configuration de l'application Electron
        app.whenReady().then(() => {
            this.createMainWindow();
            this.setupIpcHandlers();
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createMainWindow();
            }
        });
    }

    private createMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1200,
            minHeight: 800,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            icon: path.join(__dirname, '../assets/icon.png'),
            title: 'La Machine - Système de Sécurité Éthique',
            show: false
        });

        // Charger l'interface
        const htmlPath = path.join(__dirname, '../renderer/index.html');
        this.mainWindow.loadFile(htmlPath);

        // Afficher la fenêtre quand elle est prête
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow?.show();
            
            if (this.isDevelopment) {
                this.mainWindow?.webContents.openDevTools();
            }
        });

        // Gestion des erreurs de chargement
        this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('Erreur de chargement:', errorDescription);
            dialog.showErrorBox('Erreur de chargement', 
                `Impossible de charger l'interface: ${errorDescription}`);
        });
    }

    private setupIpcHandlers() {
        // Gestionnaire pour obtenir le tableau de bord
        ipcMain.handle('get-dashboard', async () => {
            try {
                return this.unifiedInterface?.getDashboard();
            } catch (error) {
                console.error('Erreur lors de la récupération du tableau de bord:', error);
                throw error;
            }
        });

        // Gestionnaire pour les actions utilisateur
        ipcMain.handle('execute-action', async (event, action) => {
            try {
                return this.unifiedInterface?.executeUserAction(action);
            } catch (error) {
                console.error('Erreur lors de l\'exécution de l\'action:', error);
                throw error;
            }
        });

        // Gestionnaire pour obtenir les alertes actives
        ipcMain.handle('get-active-alerts', async () => {
            try {
                return this.unifiedInterface?.getComponentStatus().numbers;
            } catch (error) {
                console.error('Erreur lors de la récupération des alertes:', error);
                throw error;
            }
        });

        // Gestionnaire pour obtenir les menaces actives
        ipcMain.handle('get-active-threats', async () => {
            try {
                return this.unifiedInterface?.getComponentStatus().reese;
            } catch (error) {
                console.error('Erreur lors de la récupération des menaces:', error);
                throw error;
            }
        });

        // Gestionnaire pour obtenir les règles éthiques
        ipcMain.handle('get-ethical-rules', async () => {
            try {
                return this.unifiedInterface?.getComponentStatus().finch;
            } catch (error) {
                console.error('Erreur lors de la récupération des règles éthiques:', error);
                throw error;
            }
        });

        // Gestionnaire pour obtenir les performances de la Machine
        ipcMain.handle('get-machine-performance', async () => {
            try {
                return this.unifiedInterface?.getComponentStatus().machine;
            } catch (error) {
                console.error('Erreur lors de la récupération des performances:', error);
                throw error;
            }
        });

        // Gestionnaire pour obtenir l'historique des événements
        ipcMain.handle('get-event-log', async () => {
            try {
                return this.unifiedInterface?.getEventLog();
            } catch (error) {
                console.error('Erreur lors de la récupération de l\'historique:', error);
                throw error;
            }
        });

        // Gestionnaire pour les connexions actives
        ipcMain.handle('get-active-connections', async () => {
            try {
                return Array.from(this.unifiedInterface?.getActiveConnections() || []);
            } catch (error) {
                console.error('Erreur lors de la récupération des connexions:', error);
                throw error;
            }
        });

        // Gestionnaire pour le statut du système
        ipcMain.handle('get-system-status', async () => {
            try {
                return this.unifiedInterface?.getSystemStatus();
            } catch (error) {
                console.error('Erreur lors de la récupération du statut:', error);
                throw error;
            }
        });

        // Gestionnaire pour les mises à jour en temps réel
        ipcMain.handle('subscribe-updates', async (event, callback) => {
            try {
                // Simulation de mises à jour en temps réel
                setInterval(() => {
                    const dashboard = this.unifiedInterface?.getDashboard();
                    if (dashboard) {
                        event.sender.send('dashboard-update', dashboard);
                    }
                }, 5000); // Mise à jour toutes les 5 secondes
            } catch (error) {
                console.error('Erreur lors de l\'abonnement aux mises à jour:', error);
                throw error;
            }
        });

        // Gestionnaire pour les logs de débogage
        ipcMain.handle('get-debug-logs', async () => {
            try {
                return {
                    systemEvents: this.unifiedInterface?.getEventLog(),
                    activeConnections: this.unifiedInterface?.getActiveConnections(),
                    componentStatus: this.unifiedInterface?.getComponentStatus()
                };
            } catch (error) {
                console.error('Erreur lors de la récupération des logs:', error);
                throw error;
            }
        });

        // Gestionnaire pour les actions de maintenance
        ipcMain.handle('perform-maintenance', async (event, maintenanceType) => {
            try {
                const action = {
                    type: 'SYSTEM_MAINTENANCE',
                    parameters: { maintenanceType },
                    user: 'system_admin',
                    timestamp: new Date()
                };
                return this.unifiedInterface?.executeUserAction(action);
            } catch (error) {
                console.error('Erreur lors de la maintenance:', error);
                throw error;
            }
        });

        // Gestionnaire pour les configurations éthiques
        ipcMain.handle('update-ethical-rules', async (event, rules) => {
            try {
                const action = {
                    type: 'CONFIGURE_ETHICAL_RULE',
                    parameters: { rules },
                    user: 'system_admin',
                    timestamp: new Date()
                };
                return this.unifiedInterface?.executeUserAction(action);
            } catch (error) {
                console.error('Erreur lors de la mise à jour des règles éthiques:', error);
                throw error;
            }
        });

        // Gestionnaire pour les interventions manuelles
        ipcMain.handle('manual-intervention', async (event, interventionId) => {
            try {
                const action = {
                    type: 'MANUAL_INTERVENTION',
                    parameters: { interventionId },
                    user: 'system_admin',
                    timestamp: new Date()
                };
                return this.unifiedInterface?.executeUserAction(action);
            } catch (error) {
                console.error('Erreur lors de l\'intervention manuelle:', error);
                throw error;
            }
        });

        // Gestionnaire pour les accusés de réception d'alertes
        ipcMain.handle('acknowledge-alert', async (event, alertId, user) => {
            try {
                const action = {
                    type: 'ACKNOWLEDGE_ALERT',
                    parameters: { alertId, user },
                    user,
                    timestamp: new Date()
                };
                return this.unifiedInterface?.executeUserAction(action);
            } catch (error) {
                console.error('Erreur lors de l\'accusé de réception:', error);
                throw error;
            }
        });

        // Gestionnaire pour la résolution d'alertes
        ipcMain.handle('resolve-alert', async (event, alertId, resolution, user) => {
            try {
                const action = {
                    type: 'RESOLVE_ALERT',
                    parameters: { alertId, resolution, user },
                    user,
                    timestamp: new Date()
                };
                return this.unifiedInterface?.executeUserAction(action);
            } catch (error) {
                console.error('Erreur lors de la résolution:', error);
                throw error;
            }
        });
    }

    // Méthode pour obtenir la fenêtre principale
    getMainWindow(): BrowserWindow | null {
        return this.mainWindow;
    }

    // Méthode pour obtenir l'interface unifiée
    getUnifiedInterface(): UnifiedInterface | null {
        return this.unifiedInterface;
    }
}

// Initialiser l'application
const laMachineApp = new LaMachineApp();

// Exporter pour utilisation externe
export { laMachineApp };

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    console.error('Erreur non capturée:', error);
    dialog.showErrorBox('Erreur Critique', 
        `Une erreur critique s'est produite: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesse rejetée non gérée:', reason);
    dialog.showErrorBox('Erreur de Promesse', 
        `Une promesse a été rejetée: ${reason}`);
});

// Gestion de la fermeture propre
process.on('SIGINT', () => {
    console.log('Arrêt de La Machine...');
    app.quit();
});

process.on('SIGTERM', () => {
    console.log('Arrêt de La Machine...');
    app.quit();
}); 