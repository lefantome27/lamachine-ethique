// ===== CŒUR ÉTHIQUE DE LA MACHINE - Orchestration des Systèmes =====
// Interface principale inspirée de The Machine de Person of Interest

export class EthicalMachineCore {
    private finchInterface: FinchInterface;
    private threatAssessment: ThreatAssessment;
    private interventionSystem: InterventionSystem;
    private systemStatus: SystemStatus = 'INITIALIZING';
    private ethicalOversight: EthicalOversight;
    private decisionLog: DecisionEntry[] = [];
    private activeThreats: ActiveThreat[] = [];
    private systemMetrics: SystemMetrics;

    constructor() {
        this.initializeComponents();
        this.setupEthicalOversight();
        this.systemStatus = 'OPERATIONAL';
        this.logSystemEvent('SYSTEM_STARTUP', 'Machine éthique initialisée');
    }

    // ===== INITIALISATION =====
    private initializeComponents() {
        this.finchInterface = new FinchInterface();
        this.threatAssessment = new ThreatAssessment();
        this.interventionSystem = new InterventionSystem();
        this.systemMetrics = this.initializeMetrics();
    }

    private setupEthicalOversight() {
        this.ethicalOversight = {
            ethicalRules: this.finchInterface.getEthicalRules(),
            oversightLevel: 'ACTIVE',
            lastAudit: new Date(),
            ethicalViolations: [],
            humanOversightRequired: true
        };
    }

    private initializeMetrics(): SystemMetrics {
        return {
            uptime: 0,
            threatsProcessed: 0,
            interventionsExecuted: 0,
            ethicalDecisions: 0,
            humanApprovals: 0,
            systemHealth: 100,
            ethicalCompliance: 100
        };
    }

    // ===== ORCHESTRATION PRINCIPALE =====

    /**
     * Traite une menace détectée selon le protocole éthique complet
     */
    async processThreat(threatData: ThreatData, context: ThreatContext): Promise<ThreatProcessingResult> {
        const processingId = this.generateProcessingId();
        const result: ThreatProcessingResult = {
            processingId,
            timestamp: new Date(),
            threatData,
            context,
            assessment: null,
            intervention: null,
            ethicalApproval: false,
            finalDecision: 'MONITOR',
            reasoning: [],
            humanApprovalRequired: false,
            processingTime: 0
        };

        const startTime = Date.now();

        try {
            // Étape 1: Validation éthique initiale
            const initialValidation = this.validateThreatEthically(threatData, context);
            if (!initialValidation.approved) {
                result.reasoning.push('Menace rejetée pour raisons éthiques');
                result.finalDecision = 'REJECTED';
                this.logDecision('THREAT_REJECTED', result);
                return result;
            }

            // Étape 2: Évaluation de la menace
            const assessment = this.threatAssessment.assessThreat(threatData);
            result.assessment = assessment;
            result.ethicalApproval = assessment.ethicalApproval;

            // Étape 3: Décision d'intervention
            if (assessment.ethicalApproval && assessment.recommendedAction !== 'MONITOR') {
                const interventionContext = this.createInterventionContext(context);
                const interventionPlan = this.interventionSystem.planIntervention(assessment, interventionContext);
                
                if (interventionPlan.status === 'APPROVED' || interventionPlan.status === 'PLANNED') {
                    result.intervention = interventionPlan;
                    result.finalDecision = interventionPlan.protocol.escalationLevels[0].action;
                }
            }

            // Étape 4: Validation humaine si nécessaire
            result.humanApprovalRequired = this.requiresHumanApproval(result);
            if (result.humanApprovalRequired) {
                result.finalDecision = 'AWAITING_HUMAN_APPROVAL';
            }

            // Mise à jour des métriques
            this.updateMetrics(result);
            this.updateActiveThreats(assessment);

        } catch (error) {
            result.finalDecision = 'ERROR';
            result.reasoning.push(`Erreur de traitement: ${error.message}`);
            this.logSystemEvent('THREAT_PROCESSING_ERROR', error.message);
        }

        result.processingTime = Date.now() - startTime;
        this.logDecision('THREAT_PROCESSED', result);
        return result;
    }

    /**
     * Exécute une intervention avec approbation humaine
     */
    async executeInterventionWithApproval(processingId: string, humanApproval: HumanApproval): Promise<InterventionExecutionResult> {
        const result: InterventionExecutionResult = {
            processingId,
            timestamp: new Date(),
            humanApproval,
            interventionResult: null,
            ethicalCompliance: true,
            executionTime: 0
        };

        const startTime = Date.now();

        try {
            // Vérifier l'approbation humaine
            if (!humanApproval.approved) {
                result.ethicalCompliance = false;
                this.logSystemEvent('INTERVENTION_REJECTED', 'Intervention rejetée par l\'humain');
                return result;
            }

            // Récupérer le plan d'intervention
            const decisionEntry = this.decisionLog.find(d => d.processingId === processingId);
            if (!decisionEntry || !decisionEntry.intervention) {
                throw new Error('Plan d\'intervention non trouvé');
            }

            // Exécuter l'intervention
            const interventionResult = this.interventionSystem.executeIntervention(decisionEntry.intervention);
            result.interventionResult = interventionResult;
            result.ethicalCompliance = interventionResult.ethicalCompliance;

            // Mise à jour des métriques
            this.systemMetrics.interventionsExecuted++;
            this.systemMetrics.humanApprovals++;

        } catch (error) {
            result.ethicalCompliance = false;
            this.logSystemEvent('INTERVENTION_EXECUTION_ERROR', error.message);
        }

        result.executionTime = Date.now() - startTime;
        this.logSystemEvent('INTERVENTION_EXECUTED', `Intervention ${processingId} exécutée`);
        return result;
    }

    /**
     * Effectue un audit éthique complet du système
     */
    performEthicalAudit(): EthicalAuditResult {
        const audit: EthicalAuditResult = {
            timestamp: new Date(),
            systemStatus: this.systemStatus,
            ethicalCompliance: 100,
            violations: [],
            recommendations: [],
            humanOversightStatus: this.ethicalOversight.humanOversightRequired,
            auditDuration: 0
        };

        const startTime = Date.now();

        try {
            // Audit des règles éthiques
            const ruleAudit = this.auditEthicalRules();
            audit.violations.push(...ruleAudit.violations);
            audit.recommendations.push(...ruleAudit.recommendations);

            // Audit des décisions récentes
            const decisionAudit = this.auditRecentDecisions();
            audit.violations.push(...decisionAudit.violations);
            audit.recommendations.push(...decisionAudit.recommendations);

            // Audit des interventions
            const interventionAudit = this.auditInterventions();
            audit.violations.push(...interventionAudit.violations);
            audit.recommendations.push(...interventionAudit.recommendations);

            // Calcul du score de conformité
            audit.ethicalCompliance = this.calculateEthicalCompliance(audit.violations);

            // Mise à jour de l'oversight
            this.ethicalOversight.lastAudit = audit.timestamp;
            this.ethicalOversight.ethicalViolations = audit.violations;

        } catch (error) {
            audit.violations.push(`Erreur d'audit: ${error.message}`);
            audit.ethicalCompliance = 0;
        }

        audit.auditDuration = Date.now() - startTime;
        this.logSystemEvent('ETHICAL_AUDIT_COMPLETED', `Audit terminé - Conformité: ${audit.ethicalCompliance}%`);
        return audit;
    }

    // ===== MÉTHODES PRIVÉES =====

    private validateThreatEthically(threatData: ThreatData, context: ThreatContext): EthicalValidation {
        const validation: EthicalValidation = {
            approved: true,
            reasons: [],
            warnings: [],
            requiredApprovals: []
        };

        // Vérifications éthiques de base
        if (!threatData.behavioralPatterns && !threatData.communicationPatterns && !threatData.networkActivity) {
            validation.approved = false;
            validation.reasons.push('Données insuffisantes pour évaluation éthique');
        }

        if (context.civilianPresence > 100) {
            validation.warnings.push('Présence civile importante - prudence requise');
        }

        if (context.location && this.isSensitiveLocation(context.location)) {
            validation.requiredApprovals.push('APPROBATION_LOCATION_SENSIBLE');
        }

        return validation;
    }

    private createInterventionContext(context: ThreatContext): InterventionContext {
        return {
            location: context.location,
            civilianPresence: context.civilianPresence,
            environmentalFactors: context.environmentalFactors,
            timeOfDay: this.getTimeOfDay(),
            weatherConditions: context.weatherConditions || 'UNKNOWN'
        };
    }

    private requiresHumanApproval(result: ThreatProcessingResult): boolean {
        return result.assessment?.threatLevel === 'CRITICAL' ||
               result.assessment?.confidence < 0.8 ||
               result.intervention?.requiresHumanApproval ||
               this.ethicalOversight.humanOversightRequired;
    }

    private updateMetrics(result: ThreatProcessingResult) {
        this.systemMetrics.threatsProcessed++;
        this.systemMetrics.ethicalDecisions++;
        this.systemMetrics.uptime = Date.now() - this.ethicalOversight.lastAudit.getTime();
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
            this.activeThreats.push(activeThreat);
        }
    }

    private auditEthicalRules(): AuditResult {
        const result: AuditResult = {
            violations: [],
            recommendations: []
        };

        const rules = this.finchInterface.getEthicalRules();
        rules.forEach(rule => {
            if (!rule.enabled) {
                result.violations.push(`Règle éthique désactivée: ${rule.name}`);
            }
            if (rule.priority === 'CRITICAL' && !rule.enabled) {
                result.recommendations.push(`Réactiver la règle critique: ${rule.name}`);
            }
        });

        return result;
    }

    private auditRecentDecisions(): AuditResult {
        const result: AuditResult = {
            violations: [],
            recommendations: []
        };

        const recentDecisions = this.decisionLog.slice(-100);
        const rejectedDecisions = recentDecisions.filter(d => d.finalDecision === 'REJECTED');
        
        if (rejectedDecisions.length > 50) {
            result.warnings.push('Taux de rejet élevé - révision des critères éthiques recommandée');
        }

        return result;
    }

    private auditInterventions(): AuditResult {
        const result: AuditResult = {
            violations: [],
            recommendations: []
        };

        const interventions = this.interventionSystem.getInterventionHistory();
        const failedInterventions = interventions.filter(i => i.status === 'FAILED');
        
        if (failedInterventions.length > 10) {
            result.violations.push('Taux d\'échec d\'intervention élevé');
            result.recommendations.push('Révision des protocoles d\'intervention');
        }

        return result;
    }

    private calculateEthicalCompliance(violations: string[]): number {
        const baseCompliance = 100;
        const violationPenalty = violations.length * 5;
        return Math.max(0, baseCompliance - violationPenalty);
    }

    private isSensitiveLocation(location: string): boolean {
        const sensitiveLocations = [
            'gouvernement', 'militaire', 'hôpital', 'école', 'église',
            'infrastructure_critique', 'transport_public'
        ];
        return sensitiveLocations.some(sensitive => location.toLowerCase().includes(sensitive));
    }

    private getTimeOfDay(): string {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return 'MORNING';
        if (hour >= 12 && hour < 18) return 'AFTERNOON';
        if (hour >= 18 && hour < 22) return 'EVENING';
        return 'NIGHT';
    }

    private generateProcessingId(): string {
        return `PROC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private logDecision(action: string, result: ThreatProcessingResult) {
        const entry: DecisionEntry = {
            timestamp: result.timestamp,
            processingId: result.processingId,
            action,
            threatData: result.threatData,
            assessment: result.assessment,
            intervention: result.intervention,
            finalDecision: result.finalDecision,
            reasoning: result.reasoning
        };
        
        this.decisionLog.push(entry);
        
        // Limiter la taille du log
        if (this.decisionLog.length > 10000) {
            this.decisionLog = this.decisionLog.slice(-10000);
        }
    }

    private logSystemEvent(action: string, message: string) {
        console.log(`[EthicalMachineCore] ${action}: ${message}`);
    }

    // ===== GETTERS =====

    getSystemStatus(): SystemStatus {
        return this.systemStatus;
    }

    getSystemMetrics(): SystemMetrics {
        return { ...this.systemMetrics };
    }

    getEthicalOversight(): EthicalOversight {
        return { ...this.ethicalOversight };
    }

    getActiveThreats(): ActiveThreat[] {
        return [...this.activeThreats];
    }

    getRecentDecisions(): DecisionEntry[] {
        return this.decisionLog.slice(-50);
    }

    getSystemHealth(): SystemHealth {
        return {
            status: this.systemStatus,
            uptime: this.systemMetrics.uptime,
            ethicalRulesActive: this.ethicalOversight.ethicalRules.filter(r => r.enabled).length,
            lastMaintenance: this.ethicalOversight.lastAudit
        };
    }

    getEthicalComplianceReport(): EthicalComplianceReport {
        const audit = this.performEthicalAudit();
        return {
            timestamp: audit.timestamp,
            complianceScore: audit.ethicalCompliance,
            violations: audit.violations,
            recommendations: audit.recommendations,
            humanOversightRequired: audit.humanOversightStatus,
            systemHealth: this.getSystemHealth()
        };
    }
}

// ===== TYPES ET INTERFACES =====

interface ThreatContext {
    location: string;
    civilianPresence: number;
    environmentalFactors: string[];
    weatherConditions?: string;
    timeConstraints?: number;
}

interface ThreatProcessingResult {
    processingId: string;
    timestamp: Date;
    threatData: ThreatData;
    context: ThreatContext;
    assessment: ThreatAssessmentResult | null;
    intervention: InterventionPlan | null;
    ethicalApproval: boolean;
    finalDecision: string;
    reasoning: string[];
    humanApprovalRequired: boolean;
    processingTime: number;
}

interface InterventionExecutionResult {
    processingId: string;
    timestamp: Date;
    humanApproval: HumanApproval;
    interventionResult: InterventionResult | null;
    ethicalCompliance: boolean;
    executionTime: number;
}

interface HumanApproval {
    approved: boolean;
    approver: string;
    timestamp: Date;
    reasoning: string;
    conditions?: string[];
}

interface EthicalAuditResult {
    timestamp: Date;
    systemStatus: SystemStatus;
    ethicalCompliance: number;
    violations: string[];
    recommendations: string[];
    humanOversightStatus: boolean;
    auditDuration: number;
}

interface EthicalOversight {
    ethicalRules: EthicalRule[];
    oversightLevel: 'PASSIVE' | 'ACTIVE' | 'INTENSIVE';
    lastAudit: Date;
    ethicalViolations: string[];
    humanOversightRequired: boolean;
}

interface SystemMetrics {
    uptime: number;
    threatsProcessed: number;
    interventionsExecuted: number;
    ethicalDecisions: number;
    humanApprovals: number;
    systemHealth: number;
    ethicalCompliance: number;
}

interface DecisionEntry {
    timestamp: Date;
    processingId: string;
    action: string;
    threatData: ThreatData;
    assessment: ThreatAssessmentResult | null;
    intervention: InterventionPlan | null;
    finalDecision: string;
    reasoning: string[];
}

interface AuditResult {
    violations: string[];
    recommendations: string[];
    warnings?: string[];
}

interface EthicalComplianceReport {
    timestamp: Date;
    complianceScore: number;
    violations: string[];
    recommendations: string[];
    humanOversightRequired: boolean;
    systemHealth: SystemHealth;
}

type SystemStatus = 'INITIALIZING' | 'OPERATIONAL' | 'MAINTENANCE' | 'ERROR' | 'SHUTDOWN'; 