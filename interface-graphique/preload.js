const { contextBridge, ipcRenderer } = require('electron');

// Exposer les APIs de manière sécurisée
contextBridge.exposeInMainWorld('electronAPI', {
    // Évaluation des menaces
    assessThreat: (threatData) => ipcRenderer.invoke('assess-threat', threatData),
    
    // Détection SQL Injection
    checkSQLInjection: (query) => ipcRenderer.invoke('check-sql-injection', query),
    testSQLQuery: (query) => ipcRenderer.invoke('test-sql-query', query),
    
    // Scan de ports
    scanPorts: (target) => ipcRenderer.invoke('scan-ports', target),
    
    // Gestion des IPs bloquées
    getBlockedIPs: () => ipcRenderer.invoke('get-blocked-ips'),
    unblockIP: (ip) => ipcRenderer.invoke('unblock-ip', ip),
    permanentBlockIP: (ip) => ipcRenderer.invoke('permanent-block-ip', ip),
    
    // Gestion des attaques détectées
    getDetectedAttacks: () => ipcRenderer.invoke('get-detected-attacks'),
    
    // Contrôle du monitoring
    startMonitoring: () => ipcRenderer.invoke('start-monitoring'),
    stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),
    getMonitoringStatus: () => ipcRenderer.invoke('get-monitoring-status'),
    
    // Statistiques
    getSecurityStats: () => ipcRenderer.invoke('get-security-stats'),
    
    // Audit éthique
    runEthicalAudit: () => ipcRenderer.invoke('run-ethical-audit'),
    
    // Statut de la machine
    getMachineStatus: () => ipcRenderer.invoke('get-machine-status'),
    
    // Écouteurs d'événements
    onIPBlocked: (callback) => ipcRenderer.on('ip-blocked', callback),
    onIPUnblocked: (callback) => ipcRenderer.on('ip-unblocked', callback),
    onAttackDetected: (callback) => ipcRenderer.on('attack-detected', callback),
    onMonitoringStarted: (callback) => ipcRenderer.on('monitoring-started', callback),
    onMonitoringStopped: (callback) => ipcRenderer.on('monitoring-stopped', callback)
}); 