// ===== NUMBERS ALERT - Système de Notifications de Menaces =====
// Inspiré de Person of Interest - Les "Numbers" qui indiquent les menaces

export class NumbersAlert {
    private alertQueue: Alert[] = [];
    private activeAlerts: Map<string, Alert> = new Map();
    private alertHistory: AlertRecord[] = [];
    private notificationChannels: NotificationChannel[] = [];
    private priorityMatrix: PriorityMatrix;

    constructor() {
        this.initializeNotificationChannels();
        this.setupPriorityMatrix();
        this.startAlertProcessor();
    }

    // ===== INITIALISATION =====
    private initializeNotificationChannels() {
        this.notificationChannels = [
            {
                id: 'email',
                name: 'Email',
                type: 'EMAIL',
                enabled: true,
                priority: 'MEDIUM',
                config: {
                    recipients: ['admin@lamachine.com', 'security@lamachine.com'],
                    template: 'threat_alert'
                }
            },
            {
                id: 'sms',
                name: 'SMS',
                type: 'SMS',
                enabled: true,
                priority: 'HIGH',
                config: {
                    recipients: ['+33123456789'],
                    template: 'urgent_alert'
                }
            },
            {
                id: 'push',
                name: 'Push Notification',
                type: 'PUSH',
                enabled: true,
                priority: 'MEDIUM',
                config: {
                    recipients: ['mobile_app'],
                    template: 'mobile_alert'
                }
            },
            {
                id: 'dashboard',
                name: 'Dashboard',
                type: 'DASHBOARD',
                enabled: true,
                priority: 'LOW',
                config: {
                    recipients: ['web_interface'],
                    template: 'dashboard_alert'
                }
            },
            {
                id: 'voice',
                name: 'Voice Call',
                type: 'VOICE',
                enabled: true,
                priority: 'CRITICAL',
                config: {
                    recipients: ['+33123456789'],
                    template: 'voice_alert'
                }
            }
        ];
    }

    private setupPriorityMatrix() {
        this.priorityMatrix = {
            'CRITICAL': {
                channels: ['voice', 'sms', 'email', 'push', 'dashboard'],
                escalationTime: 30, // secondes
                repeatInterval: 300, // 5 minutes
                maxRepeats: 10
            },
            'HIGH': {
                channels: ['sms', 'email', 'push', 'dashboard'],
                escalationTime: 60,
                repeatInterval: 600, // 10 minutes
                maxRepeats: 5
            },
            'MEDIUM': {
                channels: ['email', 'push', 'dashboard'],
                escalationTime: 300, // 5 minutes
                repeatInterval: 1800, // 30 minutes
                maxRepeats: 3
            },
            'LOW': {
                channels: ['dashboard'],
                escalationTime: 1800, // 30 minutes
                repeatInterval: 3600, // 1 heure
                maxRepeats: 1
            }
        };
    }

    private startAlertProcessor() {
        // Traitement des alertes toutes les secondes
        setInterval(() => {
            this.processAlertQueue();
        }, 1000);
    }

    // ===== GESTION DES ALERTES =====

    /**
     * Création d'une nouvelle alerte
     */
    createAlert(threat: Threat, source: string): Alert {
        const alert: Alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            threatId: threat.id,
            type: this.determineAlertType(threat),
            priority: this.calculatePriority(threat),
            severity: threat.severity,
            source,
            title: this.generateAlertTitle(threat),
            message: this.generateAlertMessage(threat),
            timestamp: new Date(),
            status: 'PENDING',
            channels: this.selectNotificationChannels(threat.severity),
            escalationTimer: null,
            repeatCount: 0,
            acknowledged: false,
            acknowledgedBy: null,
            acknowledgedAt: null,
            metadata: {
                threatType: threat.type,
                confidence: threat.confidence,
                sourceIP: threat.source,
                targetSystem: threat.target,
                evidence: threat.evidence
            }
        };

        this.alertQueue.push(alert);
        this.logAlert('ALERT_CREATED', `Nouvelle alerte créée: ${alert.title}`);

        return alert;
    }

    /**
     * Traitement de la queue d'alertes
     */
    private processAlertQueue() {
        const currentTime = Date.now();

        this.alertQueue.forEach((alert, index) => {
            // Vérifier si l'alerte doit être envoyée
            if (this.shouldSendAlert(alert, currentTime)) {
                this.sendAlert(alert);
                
                // Retirer de la queue si c'est la première notification
                if (alert.status === 'PENDING') {
                    this.alertQueue.splice(index, 1);
                    this.activeAlerts.set(alert.id, alert);
                }
            }

            // Vérifier l'escalade
            if (this.shouldEscalate(alert, currentTime)) {
                this.escalateAlert(alert);
            }

            // Vérifier la répétition
            if (this.shouldRepeat(alert, currentTime)) {
                this.repeatAlert(alert);
            }
        });
    }

    /**
     * Envoi d'une alerte
     */
    private sendAlert(alert: Alert) {
        try {
            alert.channels.forEach(channelId => {
                const channel = this.notificationChannels.find(c => c.id === channelId);
                if (channel && channel.enabled) {
                    this.sendNotification(channel, alert);
                }
            });

            alert.status = 'SENT';
            alert.lastSent = new Date();
            this.logAlert('ALERT_SENT', `Alerte envoyée via ${alert.channels.join(', ')}`);

        } catch (error) {
            alert.status = 'FAILED';
            this.logAlert('ALERT_FAILED', `Échec d'envoi: ${error.message}`);
        }
    }

    /**
     * Escalade d'une alerte
     */
    private escalateAlert(alert: Alert) {
        const priorityConfig = this.priorityMatrix[alert.priority];
        const escalationChannels = this.getEscalationChannels(alert.priority);

        escalationChannels.forEach(channelId => {
            const channel = this.notificationChannels.find(c => c.id === channelId);
            if (channel && channel.enabled) {
                this.sendNotification(channel, alert, 'ESCALATION');
            }
        });

        alert.status = 'ESCALATED';
        this.logAlert('ALERT_ESCALATED', `Alerte escaladée: ${alert.title}`);
    }

    /**
     * Répétition d'une alerte
     */
    private repeatAlert(alert: Alert) {
        const priorityConfig = this.priorityMatrix[alert.priority];
        
        if (alert.repeatCount < priorityConfig.maxRepeats) {
            alert.repeatCount++;
            this.sendAlert(alert);
            this.logAlert('ALERT_REPEATED', `Alerte répétée (${alert.repeatCount}/${priorityConfig.maxRepeats}): ${alert.title}`);
        } else {
            // Marquer comme abandonnée après le nombre max de répétitions
            alert.status = 'ABANDONED';
            this.activeAlerts.delete(alert.id);
            this.logAlert('ALERT_ABANDONED', `Alerte abandonnée après ${alert.repeatCount} répétitions: ${alert.title}`);
        }
    }

    /**
     * Accusé de réception d'une alerte
     */
    acknowledgeAlert(alertId: string, user: string): boolean {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) {
            this.logAlert('ACKNOWLEDGE_ERROR', `Alerte non trouvée: ${alertId}`);
            return false;
        }

        alert.acknowledged = true;
        alert.acknowledgedBy = user;
        alert.acknowledgedAt = new Date();
        alert.status = 'ACKNOWLEDGED';

        // Retirer des alertes actives
        this.activeAlerts.delete(alertId);

        this.logAlert('ALERT_ACKNOWLEDGED', `Alerte accusée par ${user}: ${alert.title}`);
        return true;
    }

    /**
     * Résolution d'une alerte
     */
    resolveAlert(alertId: string, resolution: string, user: string): boolean {
        const alert = this.activeAlerts.get(alertId) || 
                     this.alertHistory.find(a => a.alert.id === alertId)?.alert;

        if (!alert) {
            this.logAlert('RESOLVE_ERROR', `Alerte non trouvée: ${alertId}`);
            return false;
        }

        alert.status = 'RESOLVED';
        alert.resolution = resolution;
        alert.resolvedBy = user;
        alert.resolvedAt = new Date();

        // Retirer des alertes actives
        this.activeAlerts.delete(alertId);

        this.logAlert('ALERT_RESOLVED', `Alerte résolue par ${user}: ${resolution}`);
        return true;
    }

    // ===== MÉTHODES UTILITAIRES =====

    private determineAlertType(threat: Threat): AlertType {
        switch (threat.type) {
            case 'DDOS_ATTACK':
                return 'NETWORK_ATTACK';
            case 'INTRUSION_ATTEMPT':
                return 'SECURITY_BREACH';
            case 'MALWARE_DETECTED':
                return 'MALWARE_ALERT';
            case 'DATA_BREACH':
                return 'DATA_BREACH';
            case 'ANOMALOUS_ACTIVITY':
                return 'BEHAVIORAL_ANOMALY';
            default:
                return 'GENERAL_THREAT';
        }
    }

    private calculatePriority(threat: Threat): AlertPriority {
        const basePriority = {
            'LOW': 1,
            'MEDIUM': 2,
            'HIGH': 3,
            'CRITICAL': 4
        };

        let priority = basePriority[threat.severity];

        // Ajuster selon la confiance
        if (threat.confidence > 0.9) priority += 1;
        if (threat.confidence < 0.7) priority -= 1;

        // Ajuster selon le type de menace
        if (threat.type === 'DATA_BREACH') priority += 1;
        if (threat.type === 'MALWARE_DETECTED') priority += 1;

        // Normaliser
        if (priority <= 1) return 'LOW';
        if (priority <= 2) return 'MEDIUM';
        if (priority <= 3) return 'HIGH';
        return 'CRITICAL';
    }

    private generateAlertTitle(threat: Threat): string {
        const titles = {
            'DDOS_ATTACK': '🚨 Attaque DDoS Détectée',
            'INTRUSION_ATTEMPT': '⚠️ Tentative d\'Intrusion',
            'MALWARE_DETECTED': '🦠 Malware Détecté',
            'DATA_BREACH': '💥 Violation de Données',
            'ANOMALOUS_ACTIVITY': '🔍 Activité Anormale'
        };

        return titles[threat.type] || '🚨 Menace Détectée';
    }

    private generateAlertMessage(threat: Threat): string {
        return `
🚨 ALERTE SÉCURITÉ 🚨

Type: ${threat.type}
Sévérité: ${threat.severity}
Confiance: ${(threat.confidence * 100).toFixed(1)}%
Source: ${threat.source}
Cible: ${threat.target}

Description: ${threat.description}

Évidence:
${threat.evidence.map(e => `• ${e}`).join('\n')}

Action requise: Intervention immédiate recommandée.
        `.trim();
    }

    private selectNotificationChannels(severity: string): string[] {
        const priority = this.calculatePriority({ severity } as Threat);
        return this.priorityMatrix[priority].channels;
    }

    private getEscalationChannels(priority: AlertPriority): string[] {
        const escalationMap = {
            'CRITICAL': ['voice', 'sms'],
            'HIGH': ['sms'],
            'MEDIUM': ['email'],
            'LOW': []
        };

        return escalationMap[priority] || [];
    }

    private shouldSendAlert(alert: Alert, currentTime: number): boolean {
        if (alert.status !== 'PENDING') return false;
        
        const timeSinceCreation = currentTime - alert.timestamp.getTime();
        return timeSinceCreation >= 0; // Envoyer immédiatement
    }

    private shouldEscalate(alert: Alert, currentTime: number): boolean {
        if (alert.status !== 'SENT') return false;
        if (alert.acknowledged) return false;

        const priorityConfig = this.priorityMatrix[alert.priority];
        const timeSinceSent = currentTime - (alert.lastSent?.getTime() || alert.timestamp.getTime());
        
        return timeSinceSent >= priorityConfig.escalationTime * 1000;
    }

    private shouldRepeat(alert: Alert, currentTime: number): boolean {
        if (alert.status !== 'SENT' && alert.status !== 'ESCALATED') return false;
        if (alert.acknowledged) return false;

        const priorityConfig = this.priorityMatrix[alert.priority];
        const timeSinceLastSent = currentTime - (alert.lastSent?.getTime() || alert.timestamp.getTime());
        
        return timeSinceLastSent >= priorityConfig.repeatInterval * 1000;
    }

    private sendNotification(channel: NotificationChannel, alert: Alert, type: string = 'ALERT') {
        // Simulation d'envoi de notification
        console.log(`📤 Envoi ${type} via ${channel.name}: ${alert.title}`);
        
        // Ici, on intégrerait les vrais services de notification
        // Email, SMS, Push, etc.
    }

    private logAlert(action: string, message: string) {
        const record: AlertRecord = {
            timestamp: new Date(),
            action,
            message,
            agent: 'Numbers',
            severity: 'INFO'
        };

        this.alertHistory.push(record);

        // Limiter la taille de l'historique
        if (this.alertHistory.length > 10000) {
            this.alertHistory = this.alertHistory.slice(-10000);
        }
    }

    // ===== GETTERS =====

    getActiveAlerts(): Alert[] {
        return Array.from(this.activeAlerts.values());
    }

    getAlertQueue(): Alert[] {
        return [...this.alertQueue];
    }

    getAlertHistory(): AlertRecord[] {
        return [...this.alertHistory];
    }

    getNotificationChannels(): NotificationChannel[] {
        return [...this.notificationChannels];
    }

    getAlertStatistics(): AlertStatistics {
        const totalAlerts = this.alertHistory.length;
        const activeAlerts = this.activeAlerts.size;
        const pendingAlerts = this.alertQueue.length;

        const severityCounts = {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0
        };

        this.activeAlerts.forEach(alert => {
            severityCounts[alert.severity]++;
        });

        return {
            totalAlerts,
            activeAlerts,
            pendingAlerts,
            severityCounts,
            lastUpdate: new Date()
        };
    }
}

// ===== TYPES ET INTERFACES =====

interface Threat {
    id: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    source: string;
    target: string;
    confidence: number;
    timestamp: Date;
    description: string;
    evidence: string[];
}

interface Alert {
    id: string;
    threatId: string;
    type: AlertType;
    priority: AlertPriority;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    source: string;
    title: string;
    message: string;
    timestamp: Date;
    status: AlertStatus;
    channels: string[];
    escalationTimer?: NodeJS.Timeout;
    repeatCount: number;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    resolvedBy?: string;
    resolvedAt?: Date;
    resolution?: string;
    lastSent?: Date;
    metadata: AlertMetadata;
}

interface AlertMetadata {
    threatType: string;
    confidence: number;
    sourceIP: string;
    targetSystem: string;
    evidence: string[];
}

interface NotificationChannel {
    id: string;
    name: string;
    type: ChannelType;
    enabled: boolean;
    priority: AlertPriority;
    config: ChannelConfig;
}

interface ChannelConfig {
    recipients: string[];
    template: string;
    [key: string]: any;
}

interface PriorityMatrix {
    [priority: string]: {
        channels: string[];
        escalationTime: number;
        repeatInterval: number;
        maxRepeats: number;
    };
}

interface AlertRecord {
    timestamp: Date;
    action: string;
    message: string;
    agent: string;
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

interface AlertStatistics {
    totalAlerts: number;
    activeAlerts: number;
    pendingAlerts: number;
    severityCounts: {
        CRITICAL: number;
        HIGH: number;
        MEDIUM: number;
        LOW: number;
    };
    lastUpdate: Date;
}

type AlertType = 'NETWORK_ATTACK' | 'SECURITY_BREACH' | 'MALWARE_ALERT' | 'DATA_BREACH' | 'BEHAVIORAL_ANOMALY' | 'GENERAL_THREAT';
type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type AlertStatus = 'PENDING' | 'SENT' | 'ESCALATED' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FAILED' | 'ABANDONED';
type ChannelType = 'EMAIL' | 'SMS' | 'PUSH' | 'DASHBOARD' | 'VOICE'; 