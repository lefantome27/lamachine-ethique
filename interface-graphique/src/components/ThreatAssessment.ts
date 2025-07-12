// ===== ÉVALUATION DES MENACES - Système Éthique de Détection =====
// Inspiré du système de numéros de Person of Interest

export class ThreatAssessment {
    private threatDatabase: ThreatRecord[] = [];
    private ethicalGuidelines: EthicalGuideline[] = [];
    private assessmentHistory: AssessmentEntry[] = [];
    private currentThreats: ActiveThreat[] = [];

    constructor() {
        this.initializeEthicalGuidelines();
        this.loadThreatDatabase();
    }

    // ===== GUIDELINES ÉTHIQUES =====
    private initializeEthicalGuidelines() {
        this.ethicalGuidelines = [
            {
                id: 'innocent_until_proven',
                name: 'Présomption d\'Innocence',
                description: 'Toute personne est innocente jusqu\'à preuve du contraire',
                weight: 0.9,
                exceptions: ['flagrant_délit', 'menace_immédiate']
            },
            {
                id: 'proportional_response',
                name: 'Réponse Proportionnelle',
                description: 'La réponse doit être proportionnelle à la menace',
                weight: 0.8,
                exceptions: ['auto-défense', 'protection_civile']
            },
            {
                id: 'minimal_force',
                name: 'Force Minimale',
                description: 'Utiliser le minimum de force nécessaire',
                weight: 0.85,
                exceptions: ['neutralisation_immédiate']
            },
            {
                id: 'civilian_protection',
                name: 'Protection des Civils',
                description: 'Priorité absolue à la protection des civils',
                weight: 1.0,
                exceptions: []
            },
            {
                id: 'due_process',
                name: 'Procédure Régulière',
                description: 'Respecter les procédures légales',
                weight: 0.7,
                exceptions: ['urgence_vitale']
            }
        ];
    }

    // ===== ÉVALUATION DES MENACES =====

    /**
     * Évalue une menace potentielle selon les critères éthiques
     */
    assessThreat(threatData: ThreatData): ThreatAssessmentResult {
        const assessment: ThreatAssessmentResult = {
            threatId: this.generateThreatId(),
            timestamp: new Date(),
            threatLevel: 'UNKNOWN',
            confidence: 0,
            ethicalApproval: false,
            recommendedAction: 'MONITOR',
            reasoning: [],
            warnings: [],
            requiresHumanReview: true
        };

        try {
            // Analyse de la menace
            const threatAnalysis = this.analyzeThreat(threatData);
            assessment.threatLevel = threatAnalysis.level;
            assessment.confidence = threatAnalysis.confidence;

            // Validation éthique
            const ethicalValidation = this.validateEthically(threatData, threatAnalysis);
            assessment.ethicalApproval = ethicalValidation.approved;
            assessment.reasoning = ethicalValidation.reasons;
            assessment.warnings = ethicalValidation.warnings;

            // Recommandation d'action
            assessment.recommendedAction = this.determineAction(threatAnalysis, ethicalValidation);
            assessment.requiresHumanReview = this.requiresHumanReview(assessment);

            // Enregistrement
            this.recordAssessment(assessment);
            this.updateActiveThreats(assessment);

        } catch (error) {
            assessment.threatLevel = 'ERROR';
            assessment.reasoning.push(`Erreur d'évaluation: ${error.message}`);
            this.logError('THREAT_ASSESSMENT_ERROR', error.message);
        }

        return assessment;
    }

    /**
     * Analyse technique de la menace
     */
    private analyzeThreat(threatData: ThreatData): ThreatAnalysis {
        const analysis: ThreatAnalysis = {
            level: 'LOW',
            confidence: 0,
            indicators: [],
            riskFactors: []
        };

        // Analyse des indicateurs de menace
        if (threatData.behavioralPatterns) {
            const behaviorScore = this.analyzeBehavioralPatterns(threatData.behavioralPatterns);
            analysis.indicators.push(`Score comportemental: ${behaviorScore}`);
            if (behaviorScore > 0.7) {
                analysis.level = 'HIGH';
                analysis.confidence += 0.3;
            }
        }

        if (threatData.communicationPatterns) {
            const communicationScore = this.analyzeCommunicationPatterns(threatData.communicationPatterns);
            analysis.indicators.push(`Score communication: ${communicationScore}`);
            if (communicationScore > 0.8) {
                analysis.level = 'CRITICAL';
                analysis.confidence += 0.4;
            }
        }

        if (threatData.networkActivity) {
            const networkScore = this.analyzeNetworkActivity(threatData.networkActivity);
            analysis.indicators.push(`Score réseau: ${networkScore}`);
            if (networkScore > 0.6) {
                analysis.level = 'MEDIUM';
                analysis.confidence += 0.2;
            }
        }

        // Facteurs de risque contextuels
        if (threatData.location && this.isHighRiskLocation(threatData.location)) {
            analysis.riskFactors.push('Localisation à haut risque');
            analysis.confidence += 0.1;
        }

        if (threatData.timing && this.isHighRiskTiming(threatData.timing)) {
            analysis.riskFactors.push('Timing suspect');
            analysis.confidence += 0.1;
        }

        // Normalisation de la confiance
        analysis.confidence = Math.min(analysis.confidence, 1.0);

        return analysis;
    }

    /**
     * Validation éthique de la menace
     */
    private validateEthically(threatData: ThreatData, analysis: ThreatAnalysis): EthicalValidation {
        const validation: EthicalValidation = {
            approved: false,
            reasons: [],
            warnings: [],
            requiredApprovals: []
        };

        // Vérifier chaque guideline éthique
        this.ethicalGuidelines.forEach(guideline => {
            const guidelineValidation = this.checkEthicalGuideline(guideline, threatData, analysis);
            
            if (!guidelineValidation.approved) {
                validation.reasons.push(guidelineValidation.reason);
            }
            
            if (guidelineValidation.warning) {
                validation.warnings.push(guidelineValidation.warning);
            }
        });

        // Approbation si aucune raison de rejet
        validation.approved = validation.reasons.length === 0;

        // Approbations requises
        if (analysis.level === 'CRITICAL') {
            validation.requiredApprovals.push('APPROBATION_HUMAINE_CRITIQUE');
        }

        if (analysis.confidence < 0.7) {
            validation.requiredApprovals.push('VALIDATION_DONNÉES');
        }

        return validation;
    }

    /**
     * Détermine l'action recommandée
     */
    private determineAction(analysis: ThreatAnalysis, validation: EthicalValidation): RecommendedAction {
        if (!validation.approved) {
            return 'MONITOR';
        }

        switch (analysis.level) {
            case 'LOW':
                return 'MONITOR';
            case 'MEDIUM':
                return validation.requiredApprovals.length > 0 ? 'ALERT_HUMAN' : 'INVESTIGATE';
            case 'HIGH':
                return 'ALERT_HUMAN';
            case 'CRITICAL':
                return 'IMMEDIATE_ACTION';
            default:
                return 'MONITOR';
        }
    }

    // ===== MÉTHODES D'ANALYSE =====

    private analyzeBehavioralPatterns(patterns: BehavioralPattern[]): number {
        let score = 0;
        let totalWeight = 0;

        patterns.forEach(pattern => {
            const weight = this.getBehavioralWeight(pattern.type);
            const patternScore = this.calculatePatternScore(pattern);
            score += patternScore * weight;
            totalWeight += weight;
        });

        return totalWeight > 0 ? score / totalWeight : 0;
    }

    private analyzeCommunicationPatterns(patterns: CommunicationPattern[]): number {
        let score = 0;
        let totalWeight = 0;

        patterns.forEach(pattern => {
            const weight = this.getCommunicationWeight(pattern.type);
            const patternScore = this.calculateCommunicationScore(pattern);
            score += patternScore * weight;
            totalWeight += weight;
        });

        return totalWeight > 0 ? score / totalWeight : 0;
    }

    private analyzeNetworkActivity(activity: NetworkActivity): number {
        let score = 0;

        // Analyse des connexions suspectes
        if (activity.suspiciousConnections > 10) {
            score += 0.3;
        }

        // Analyse du trafic
        if (activity.dataVolume > 1000000000) { // 1GB
            score += 0.2;
        }

        // Analyse des ports
        if (activity.portsUsed.length > 50) {
            score += 0.2;
        }

        // Analyse de la fréquence
        if (activity.connectionFrequency > 1000) { // 1000 connexions/heure
            score += 0.3;
        }

        return Math.min(score, 1.0);
    }

    // ===== MÉTHODES UTILITAIRES =====

    private generateThreatId(): string {
        return `THREAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private requiresHumanReview(assessment: ThreatAssessmentResult): boolean {
        return assessment.threatLevel === 'CRITICAL' || 
               assessment.confidence < 0.7 || 
               assessment.ethicalApproval === false ||
               assessment.recommendedAction === 'IMMEDIATE_ACTION';
    }

    private isHighRiskLocation(location: string): boolean {
        const highRiskLocations = [
            'gouvernement', 'militaire', 'infrastructure_critique',
            'transport_public', 'centre_commercial', 'école'
        ];
        return highRiskLocations.some(risk => location.toLowerCase().includes(risk));
    }

    private isHighRiskTiming(timing: Date): boolean {
        const hour = timing.getHours();
        const day = timing.getDay();
        
        // Heures de pointe ou heures tardives
        return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) || hour >= 22;
    }

    private getBehavioralWeight(type: string): number {
        const weights: Record<string, number> = {
            'movement_pattern': 0.3,
            'social_interaction': 0.2,
            'financial_activity': 0.3,
            'digital_footprint': 0.2
        };
        return weights[type] || 0.1;
    }

    private getCommunicationWeight(type: string): number {
        const weights: Record<string, number> = {
            'encrypted_message': 0.4,
            'suspicious_contact': 0.3,
            'unusual_frequency': 0.2,
            'coded_language': 0.1
        };
        return weights[type] || 0.1;
    }

    private calculatePatternScore(pattern: BehavioralPattern): number {
        // Logique de calcul basée sur le type de pattern
        switch (pattern.type) {
            case 'movement_pattern':
                return pattern.anomalyScore || 0;
            case 'social_interaction':
                return pattern.isolationScore || 0;
            case 'financial_activity':
                return pattern.unusualAmountScore || 0;
            case 'digital_footprint':
                return pattern.privacyScore || 0;
            default:
                return 0;
        }
    }

    private calculateCommunicationScore(pattern: CommunicationPattern): number {
        // Logique de calcul basée sur le type de communication
        switch (pattern.type) {
            case 'encrypted_message':
                return pattern.encryptionLevel || 0;
            case 'suspicious_contact':
                return pattern.contactRiskScore || 0;
            case 'unusual_frequency':
                return pattern.frequencyAnomalyScore || 0;
            case 'coded_language':
                return pattern.codingComplexity || 0;
            default:
                return 0;
        }
    }

    private checkEthicalGuideline(guideline: EthicalGuideline, threatData: ThreatData, analysis: ThreatAnalysis): GuidelineValidation {
        const validation: GuidelineValidation = {
            approved: true,
            reason: '',
            warning: ''
        };

        // Logique de validation spécifique à chaque guideline
        switch (guideline.id) {
            case 'innocent_until_proven':
                if (analysis.confidence < 0.8) {
                    validation.warning = 'Confiance insuffisante pour présomption de culpabilité';
                }
                break;

            case 'proportional_response':
                if (analysis.level === 'CRITICAL' && analysis.confidence < 0.9) {
                    validation.approved = false;
                    validation.reason = 'Réponse critique requiert une confiance très élevée';
                }
                break;

            case 'civilian_protection':
                if (threatData.location && this.isHighRiskLocation(threatData.location)) {
                    validation.warning = 'Localisation à haut risque - protection civile prioritaire';
                }
                break;
        }

        return validation;
    }

    // ===== GESTION DES DONNÉES =====

    private loadThreatDatabase() {
        // Chargement de la base de données des menaces
        this.threatDatabase = [];
    }

    private recordAssessment(assessment: ThreatAssessmentResult) {
        const entry: AssessmentEntry = {
            timestamp: assessment.timestamp,
            threatId: assessment.threatId,
            threatLevel: assessment.threatLevel,
            confidence: assessment.confidence,
            ethicalApproval: assessment.ethicalApproval,
            recommendedAction: assessment.recommendedAction
        };
        
        this.assessmentHistory.push(entry);
        
        // Limiter l'historique
        if (this.assessmentHistory.length > 10000) {
            this.assessmentHistory = this.assessmentHistory.slice(-10000);
        }
    }

    private updateActiveThreats(assessment: ThreatAssessmentResult) {
        if (assessment.threatLevel === 'HIGH' || assessment.threatLevel === 'CRITICAL') {
            const activeThreat: ActiveThreat = {
                threatId: assessment.threatId,
                timestamp: assessment.timestamp,
                threatLevel: assessment.threatLevel,
                status: 'ACTIVE',
                lastUpdate: assessment.timestamp
            };
            
            this.currentThreats.push(activeThreat);
        }
    }

    private logError(action: string, message: string) {
        console.error(`[ThreatAssessment] ${action}: ${message}`);
    }

    // ===== GETTERS =====

    getActiveThreats(): ActiveThreat[] {
        return [...this.currentThreats];
    }

    getAssessmentHistory(): AssessmentEntry[] {
        return [...this.assessmentHistory];
    }

    getEthicalGuidelines(): EthicalGuideline[] {
        return [...this.ethicalGuidelines];
    }

    getThreatStatistics(): ThreatStatistics {
        const totalAssessments = this.assessmentHistory.length;
        const criticalThreats = this.assessmentHistory.filter(a => a.threatLevel === 'CRITICAL').length;
        const ethicalApprovals = this.assessmentHistory.filter(a => a.ethicalApproval).length;

        return {
            totalAssessments,
            criticalThreats,
            ethicalApprovals,
            approvalRate: totalAssessments > 0 ? ethicalApprovals / totalAssessments : 0,
            activeThreats: this.currentThreats.length
        };
    }
}

// ===== TYPES ET INTERFACES =====

interface ThreatData {
    behavioralPatterns?: BehavioralPattern[];
    communicationPatterns?: CommunicationPattern[];
    networkActivity?: NetworkActivity;
    location?: string;
    timing?: Date;
    metadata?: Record<string, any>;
}

interface BehavioralPattern {
    type: string;
    anomalyScore?: number;
    isolationScore?: number;
    unusualAmountScore?: number;
    privacyScore?: number;
}

interface CommunicationPattern {
    type: string;
    encryptionLevel?: number;
    contactRiskScore?: number;
    frequencyAnomalyScore?: number;
    codingComplexity?: number;
}

interface NetworkActivity {
    suspiciousConnections: number;
    dataVolume: number;
    portsUsed: string[];
    connectionFrequency: number;
}

interface ThreatAnalysis {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    indicators: string[];
    riskFactors: string[];
}

interface ThreatAssessmentResult {
    threatId: string;
    timestamp: Date;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    ethicalApproval: boolean;
    recommendedAction: RecommendedAction;
    reasoning: string[];
    warnings: string[];
    requiresHumanReview: boolean;
}

interface EthicalGuideline {
    id: string;
    name: string;
    description: string;
    weight: number;
    exceptions: string[];
}

interface EthicalValidation {
    approved: boolean;
    reasons: string[];
    warnings: string[];
    requiredApprovals: string[];
}

interface GuidelineValidation {
    approved: boolean;
    reason: string;
    warning: string;
}

interface ThreatRecord {
    id: string;
    pattern: string;
    riskLevel: number;
    lastSeen: Date;
}

interface AssessmentEntry {
    timestamp: Date;
    threatId: string;
    threatLevel: string;
    confidence: number;
    ethicalApproval: boolean;
    recommendedAction: string;
}

interface ActiveThreat {
    threatId: string;
    timestamp: Date;
    threatLevel: string;
    status: string;
    lastUpdate: Date;
}

interface ThreatStatistics {
    totalAssessments: number;
    criticalThreats: number;
    ethicalApprovals: number;
    approvalRate: number;
    activeThreats: number;
}

type RecommendedAction = 'MONITOR' | 'INVESTIGATE' | 'ALERT_HUMAN' | 'IMMEDIATE_ACTION'; 