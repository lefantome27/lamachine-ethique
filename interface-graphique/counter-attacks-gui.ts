import { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Application state interface
interface AppState {
  isRunning: boolean;
  attackCount: number;
  blockedCount: number;
  lastUpdateTime: Date;
}

// Attack interface
interface Attack {
  id: string;
  timestamp: Date;
  sourceIp: string;
  attackType: string;
  severity: string;
  status: string;
}

// Main application class
export class CounterAttacksGui {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private appState: AppState;
  private attacks: Attack[] = [];
  private isQuitting: boolean = false;

  // Constants
  private static readonly WINDOW_WIDTH = 800;
  private static readonly WINDOW_HEIGHT = 600;
  private static readonly WINDOW_TITLE = 'Système de Contre-Attaques - Analyseur de Trafic';

  constructor() {
    this.appState = {
      isRunning: false,
      attackCount: 0,
      blockedCount: 0,
      lastUpdateTime: new Date()
    };

    this.initialize();
  }

  private initialize(): void {
    // Handle app events
    app.on('ready', () => this.createWindow());
    app.on('window-all-closed', () => this.handleWindowAllClosed());
    app.on('before-quit', () => this.handleBeforeQuit());
    app.on('activate', () => this.handleActivate());

    // Setup IPC handlers
    this.setupIpcHandlers();

    // Create tray
    this.createTray();
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: CounterAttacksGui.WINDOW_WIDTH,
      height: CounterAttacksGui.WINDOW_HEIGHT,
      title: CounterAttacksGui.WINDOW_TITLE,
      icon: path.join(__dirname, 'assets', 'icon.png'),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      },
      show: false,
      resizable: true,
      minimizable: true,
      maximizable: true
    });

    // Load the HTML file
    this.mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle window close
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Create menu
    this.createMenu();
  }

  private createTray(): void {
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    
    this.tray = new Tray(icon);
    this.tray.setToolTip('Traffic Security System');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Ouvrir',
        click: () => {
          this.mainWindow?.show();
        }
      },
      {
        label: 'Démarrer',
        click: () => {
          this.startCounterAttack();
        }
      },
      {
        label: 'Arrêter',
        click: () => {
          this.stopCounterAttack();
        }
      },
      { type: 'separator' },
      {
        label: 'Configuration',
        click: () => {
          this.showConfigDialog();
        }
      },
      {
        label: 'Rapport',
        click: () => {
          this.generateReport();
        }
      },
      { type: 'separator' },
      {
        label: 'Quitter',
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);

    // Handle tray click
    this.tray.on('click', () => {
      this.mainWindow?.show();
    });
  }

  private createMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Fichier',
        submenu: [
          {
            label: 'Nouveau',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.handleNewProject();
            }
          },
          {
            label: 'Ouvrir',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.handleOpenProject();
            }
          },
          {
            label: 'Sauvegarder',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.handleSaveProject();
            }
          },
          { type: 'separator' },
          {
            label: 'Exporter Rapport',
            click: () => {
              this.handleExportReport();
            }
          },
          { type: 'separator' },
          {
            label: 'Quitter',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              this.isQuitting = true;
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Édition',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' }
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
        label: 'Système',
        submenu: [
          {
            label: 'Démarrer',
            click: () => {
              this.startCounterAttack();
            }
          },
          {
            label: 'Arrêter',
            click: () => {
              this.stopCounterAttack();
            }
          },
          { type: 'separator' },
          {
            label: 'Configuration',
            click: () => {
              this.showConfigDialog();
            }
          },
          {
            label: 'Statistiques',
            click: () => {
              this.showStatistics();
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
              this.showAboutDialog();
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    // Handle start counter attack
    ipcMain.handle('start-counter-attack', () => {
      return this.startCounterAttack();
    });

    // Handle stop counter attack
    ipcMain.handle('stop-counter-attack', () => {
      return this.stopCounterAttack();
    });

    // Handle show config
    ipcMain.handle('show-config', () => {
      return this.showConfigDialog();
    });

    // Handle generate report
    ipcMain.handle('generate-report', () => {
      return this.generateReport();
    });

    // Handle get app state
    ipcMain.handle('get-app-state', () => {
      return this.appState;
    });

    // Handle get attacks
    ipcMain.handle('get-attacks', () => {
      return this.attacks;
    });

    // Handle add log message
    ipcMain.handle('add-log-message', (event, message: string) => {
      return this.addLogMessage(message);
    });

    // Handle clear logs
    ipcMain.handle('clear-logs', () => {
      return this.clearLogs();
    });

    // Handle export data
    ipcMain.handle('export-data', (event, format: string) => {
      return this.exportData(format);
    });
  }

  private startCounterAttack(): boolean {
    if (this.appState.isRunning) {
      return false;
    }

    this.appState.isRunning = true;
    this.appState.lastUpdateTime = new Date();

    // Update tray tooltip
    if (this.tray) {
      this.tray.setToolTip('Traffic Security System - En cours d\'exécution');
    }

    // Send update to renderer
    this.mainWindow?.webContents.send('app-state-updated', this.appState);

    // Simulate attack detection
    this.simulateAttackDetection();

    return true;
  }

  private stopCounterAttack(): boolean {
    if (!this.appState.isRunning) {
      return false;
    }

    this.appState.isRunning = false;

    // Update tray tooltip
    if (this.tray) {
      this.tray.setToolTip('Traffic Security System');
    }

    // Send update to renderer
    this.mainWindow?.webContents.send('app-state-updated', this.appState);

    return true;
  }

  private showConfigDialog(): void {
    const configText = `Configuration du système de contre-attaques

• Sensibilité: 0.1
• Seuil d'alerte: 100
• Seuil critique: 200
• Fenêtre d'analyse: 300s
• ML activé: Oui`;

    dialog.showMessageBox(this.mainWindow!, {
      type: 'info',
      title: 'Configuration',
      message: 'Configuration du système de contre-attaques',
      detail: configText,
      buttons: ['OK']
    });
  }

  private generateReport(): void {
    const report = this.createReport();
    
    dialog.showSaveDialog(this.mainWindow!, {
      title: 'Sauvegarder le rapport',
      defaultPath: `rapport_securite_${new Date().toISOString().split('T')[0]}.txt`,
      filters: [
        { name: 'Fichiers texte', extensions: ['txt'] },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ]
    }).then(result => {
      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, report);
        dialog.showMessageBox(this.mainWindow!, {
          type: 'info',
          title: 'Rapport généré',
          message: 'Le rapport a été généré avec succès',
          detail: `Fichier sauvegardé: ${result.filePath}`
        });
      }
    });
  }

  private createReport(): string {
    const now = new Date();
    let report = '=== RAPPORT DE SÉCURITÉ ===\n\n';
    report += `Généré le: ${now.toLocaleString()}\n\n`;
    report += `Statut du système: ${this.appState.isRunning ? 'En cours d\'exécution' : 'Arrêté'}\n`;
    report += `Attaques détectées: ${this.appState.attackCount}\n`;
    report += `Attaques bloquées: ${this.appState.blockedCount}\n`;
    
    const blockRate = this.appState.attackCount > 0 ? 
      (this.appState.blockedCount * 100 / this.appState.attackCount) : 0;
    report += `Taux de blocage: ${blockRate.toFixed(1)}%\n\n`;

    report += '=== LISTE DES ATTAQUES ===\n';
    this.attacks.forEach(attack => {
      report += `${attack.timestamp.toLocaleString()} - ${attack.sourceIp} - ${attack.attackType} - ${attack.severity}\n`;
    });

    return report;
  }

  private simulateAttackDetection(): void {
    if (!this.appState.isRunning) return;

    // Simulate random attack detection
    if (Math.random() < 0.3) { // 30% chance
      this.appState.attackCount++;
      this.appState.blockedCount++;

      const attack: Attack = {
        id: `attack_${Date.now()}`,
        timestamp: new Date(),
        sourceIp: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        attackType: ['DDoS', 'Port Scan', 'Brute Force', 'SQL Injection'][Math.floor(Math.random() * 4)],
        severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
        status: 'BLOCKED'
      };

      this.attacks.push(attack);

      // Keep only last 100 attacks
      if (this.attacks.length > 100) {
        this.attacks = this.attacks.slice(-100);
      }

      // Send updates to renderer
      this.mainWindow?.webContents.send('attack-detected', attack);
      this.mainWindow?.webContents.send('app-state-updated', this.appState);

      // Update tray
      if (this.tray) {
        this.tray.setToolTip(`Traffic Security System - ${this.appState.attackCount} attaques détectées`);
      }
    }

    // Schedule next check
    setTimeout(() => this.simulateAttackDetection(), 5000);
  }

  private addLogMessage(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    // Send to renderer
    this.mainWindow?.webContents.send('log-message', logMessage);
    
    // Also log to file
    const logPath = path.join(process.cwd(), 'logs', 'gui.log');
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(logPath, logMessage + '\n');
  }

  private clearLogs(): void {
    this.attacks = [];
    this.appState.attackCount = 0;
    this.appState.blockedCount = 0;
    
    // Send updates to renderer
    this.mainWindow?.webContents.send('logs-cleared');
    this.mainWindow?.webContents.send('app-state-updated', this.appState);
  }

  private exportData(format: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const data = {
        appState: this.appState,
        attacks: this.attacks,
        exportTime: new Date().toISOString()
      };

      let content: string;
      let extension: string;

      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        extension = 'json';
      } else if (format === 'csv') {
        content = this.convertToCsv(data);
        extension = 'csv';
      } else {
        reject(new Error('Format non supporté'));
        return;
      }

      dialog.showSaveDialog(this.mainWindow!, {
        title: 'Exporter les données',
        defaultPath: `traffic_security_data_${new Date().toISOString().split('T')[0]}.${extension}`,
        filters: [
          { name: `${format.toUpperCase()} files`, extensions: [extension] },
          { name: 'All files', extensions: ['*'] }
        ]
      }).then(result => {
        if (!result.canceled && result.filePath) {
          fs.writeFileSync(result.filePath, content);
          resolve(result.filePath);
        } else {
          reject(new Error('Export annulé'));
        }
      });
    });
  }

  private convertToCsv(data: any): string {
    let csv = 'Timestamp,Source IP,Attack Type,Severity,Status\n';
    
    data.attacks.forEach((attack: Attack) => {
      csv += `${attack.timestamp.toISOString()},${attack.sourceIp},${attack.attackType},${attack.severity},${attack.status}\n`;
    });
    
    return csv;
  }

  private handleNewProject(): void {
    dialog.showMessageBox(this.mainWindow!, {
      type: 'info',
      title: 'Nouveau projet',
      message: 'Fonctionnalité à implémenter'
    });
  }

  private handleOpenProject(): void {
    dialog.showOpenDialog(this.mainWindow!, {
      title: 'Ouvrir un projet',
      properties: ['openFile'],
      filters: [
        { name: 'Fichiers de projet', extensions: ['json', 'txt'] },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ]
    }).then(result => {
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(content);
          // Handle loaded data
          this.addLogMessage(`Projet chargé: ${filePath}`);
        } catch (error) {
          dialog.showErrorBox('Erreur', `Impossible de charger le fichier: ${error}`);
        }
      }
    });
  }

  private handleSaveProject(): void {
    const data = {
      appState: this.appState,
      attacks: this.attacks,
      saveTime: new Date().toISOString()
    };

    dialog.showSaveDialog(this.mainWindow!, {
      title: 'Sauvegarder le projet',
      defaultPath: `projet_securite_${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'Fichiers JSON', extensions: ['json'] },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ]
    }).then(result => {
      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
        this.addLogMessage(`Projet sauvegardé: ${result.filePath}`);
      }
    });
  }

  private handleExportReport(): void {
    this.generateReport();
  }

  private showStatistics(): void {
    const stats = `
Statistiques du système:
- Attaques détectées: ${this.appState.attackCount}
- Attaques bloquées: ${this.appState.blockedCount}
- Taux de blocage: ${this.appState.attackCount > 0 ? (this.appState.blockedCount * 100 / this.appState.attackCount).toFixed(1) : 0}%
- Temps de fonctionnement: ${this.appState.isRunning ? 'En cours' : 'Arrêté'}
    `;

    dialog.showMessageBox(this.mainWindow!, {
      type: 'info',
      title: 'Statistiques',
      message: 'Statistiques du système de sécurité',
      detail: stats
    });
  }

  private showAboutDialog(): void {
    dialog.showMessageBox(this.mainWindow!, {
      type: 'info',
      title: 'À propos',
      message: 'Système de Contre-Attaques',
      detail: 'Version 1.0.0\n\nSystème de sécurité pour l\'analyse et la détection d\'attaques réseau.\n\nDéveloppé avec Electron et TypeScript.'
    });
  }

  private handleWindowAllClosed(): void {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private handleBeforeQuit(): void {
    this.isQuitting = true;
  }

  private handleActivate(): void {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow();
    } else {
      this.mainWindow?.show();
    }
  }

  public run(): void {
    // App is ready, window will be created in the 'ready' event
  }
}

// Main function
function main(): void {
  const gui = new CounterAttacksGui();
  gui.run();
}

// Run the application
if (require.main === module) {
  main();
} 