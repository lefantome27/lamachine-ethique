// ===== SYSTÈME D'INTERVENTION - Actions Éthiques de Protection =====
// Inspiré du rôle de John Reese dans Person of Interest

export class InterventionSystem {
    private interventionHistory: InterventionRecord[] = [];
    private activeInterventions: ActiveIntervention[] = [];
    private ethicalProtocols: EthicalProtocol[] = [];
    private resourceAllocation: ResourceAllocation = {
        availableAgents: 5,
        maxSimultaneousInterventions: 3,
        emergencyReserves: 2
    };

    constructor() {
        this.initializeEthicalProtocols();
        this.loadInterventionHistory();
    }

    // ===== PROTOCOLES ÉTHIQUES =====
    private initializeEthicalProtocols() {
        this.ethicalProtocols = [
            {
                id: 'minimal_force_protocol',
                name: 'Protocole Force Minimale',
                description: 'Utiliser le minimum de force nécessaire pour protéger',
                escalationLevels: [
                    { level: 1, action: 'SURVEILLANCE_PASSIVE', description: 'Observation discrète' },
                    { level: 2, action: 'CONTACT_DIPLOMATIQUE', description: 'Approche diplomatique' },
                    { level: 3, action: 'DISSENSION_VERBALE', description: 'Dissuasion verbale' },
                    { level: 4, action: 'RESTRAINT_PHYSIQUE', description: 'Contrainte physique minimale' },
                    { level: 5, action: 'FORCE_DEFENSIVE', description: 'Force défensive uniquement' }
                ],
                ethicalConstraints: ['pas_de_force_excessive', 'protection_civile_prioritaire']
            },
            {
                id: 'civilian_protection_protocol',
                name: 'Protocole Protection Civile',
                description: 'Priorité absolue à la protection des civils',
                escalationLevels: [
                    { level: 1, action: 'EVACUATION_PREVENTIVE', description: 'Évacuation préventive' },
                    { level: 2, action: 'BARRIERE_PROTECTIVE', description: 'Barrière de protection' },
                    { level: 3, action: 'DIVERSION_STRATEGIQUE', description: 'Diversion stratégique' },
                    { level: 4, action: 'INTERPOSITION', description: 'Interposition physique' },
                    { level: 5, action: 'EXTRACTION_URGENTE', description: 'Extraction d\'urgence' }
                ],
                ethicalConstraints: ['sacrifice_personnel_autorisé', 'protection_civile_absolue']
            },
            {
                id: 'de_escalation_protocol',
                name: 'Protocole Désescalade',
                description: 'Toujours privilégier la désescalade',
                escalationLevels: [
                    { level: 1, action: 'DIALOGUE_OUVERT', description: 'Dialogue ouvert' },
                    { level: 2, action: 'MEDIATION_NEUTRE', description: 'Médiation neutre' },
                    { level: 3, action: 'NEGOCIATION_ACTIVE', description: 'Négociation active' },
                    { level: 4, action: 'ULTIMATUM_ETHIQUE', description: 'Ultimatum éthique' },
                    { level: 5, action: 'INTERVENTION_FINALE', description: 'Intervention finale' }
                ],
                ethicalConstraints: ['toujours_essayer_désescalade', 'force_dernier_recours']
            }
        ];
    }

    // ===== GESTION DES INTERVENTIONS =====

    /**
     * Planifie et exécute une intervention éthique
     */
    planIntervention(threatAssessment: ThreatAssessmentResult, context: InterventionContext): InterventionPlan {
        const plan: InterventionPlan = {
            interventionId: this.generateInterventionId(),
            timestamp: new Date(),
            threatId: threatAssessment.threatId,
            threatLevel: threatAssessment.threatLevel,
            ethicalApproval: threatAssessment.ethicalApproval,
            protocol: this.selectProtocol(threatAssessment, context),
            escalationLevel: 1,
            resources: this.allocateResources(threatAssessment, context),
            timeline: this.createTimeline(threatAssessment, context),
            fallbackPlans: this.createFallbackPlans(threatAssessment),
            status: 'PLANNED',
            requiresHumanApproval: this.requiresHumanApproval(threatAssessment)
        };

        // Validation éthique du plan
        const ethicalValidation = this.validateInterventionPlan(plan, threatAssessment);
        if (!ethicalValidation.approved) {
            plan.status = 'REJECTED';
            plan.ethicalIssues = ethicalValidation.reasons;
        }

        this.recordInterventionPlan(plan);
        return plan;
    }

    /**
     * Exécute une intervention planifiée
     */
    executeIntervention(plan: InterventionPlan): InterventionResult {
        const result: InterventionResult = {
            interventionId: plan.interventionId,
            timestamp: new Date(),
            success: false,
            outcome: 'UNKNOWN',
            casualties: { civilian: 0, agent: 0, threat: 0 },
            ethicalCompliance: true,
            violations: [],
            duration: 0,
            escalationLevel: plan.escalationLevel,
            notes: []
        };

        const startTime = Date.now();

        try {
            // Vérification finale avant exécution
            if (!this.finalEthicalCheck(plan)) {
                result.outcome = 'CANCELLED_ETHICAL_CONCERNS';
                result.notes.push('Intervention annulée pour raisons éthiques');
                return result;
            }

            // Exécution selon le protocole
            const executionResult = this.executeProtocol(plan);
            result.success = executionResult.success;
            result.outcome = executionResult.outcome;
            result.casualties = executionResult.casualties;
            result.ethicalCompliance = executionResult.ethicalCompliance;
            result.violations = executionResult.violations;
            result.notes = executionResult.notes;

            // Mise à jour du statut
            plan.status = result.success ? 'COMPLETED' : 'FAILED';
            this.updateActiveInterventions(plan, result);

        } catch (error) {
            result.outcome = 'ERROR';
            result.notes.push(`Erreur d'exécution: ${error.message}`);
            this.logError('INTERVENTION_EXECUTION_ERROR', error.message);
        }

        result.duration = Date.now() - startTime;
        this.recordInterventionResult(result);
        return result;
    }

    /**
     * Gère l'escalade d'une intervention
     */
    escalateIntervention(interventionId: string, escalationReason: string): EscalationResult {
        const activeIntervention = this.activeInterventions.find(i => i.interventionId === interventionId);
        if (!activeIntervention) {
            throw new Error('Intervention non trouvée');
        }

        const escalationResult: EscalationResult = {
            interventionId,
            timestamp: new Date(),
            previousLevel: activeIntervention.currentLevel,
            newLevel: activeIntervention.currentLevel + 1,
            reason: escalationReason,
            ethicalApproval: false,
            approved: false
        };

        // Validation éthique de l'escalade
        const ethicalValidation = this.validateEscalation(activeIntervention, escalationResult.newLevel);
        escalationResult.ethicalApproval = ethicalValidation.approved;
        escalationResult.approved = ethicalValidation.approved;

        if (escalationResult.approved) {
            activeIntervention.currentLevel = escalationResult.newLevel;
            activeIntervention.lastUpdate = new Date();
            this.logIntervention('ESCALATION_APPROVED', `Niveau ${escalationResult.newLevel} approuvé`);
        } else {
            this.logIntervention('ESCALATION_REJECTED', `Escalade rejetée: ${ethicalValidation.reason}`);
        }

        return escalationResult;
    }

    // ===== MÉTHODES PRIVÉES =====

    private selectProtocol(threatAssessment: ThreatAssessmentResult, context: InterventionContext): EthicalProtocol {
        // Logique de sélection du protocole basée sur la menace et le contexte
        if (context.civilianPresence > 10) {
            return this.ethicalProtocols.find(p => p.id === 'civilian_protection_protocol')!;
        } else if (threatAssessment.threatLevel === 'CRITICAL') {
            return this.ethicalProtocols.find(p => p.id === 'minimal_force_protocol')!;
        } else {
            return this.ethicalProtocols.find(p => p.id === 'de_escalation_protocol')!;
        }
    }

    private allocateResources(threatAssessment: ThreatAssessmentResult, context: InterventionContext): ResourceAllocation {
        const allocation: ResourceAllocation = {
            availableAgents: 0,
            maxSimultaneousInterventions: 0,
            emergencyReserves: 0
        };

        // Allocation basée sur le niveau de menace
        switch (threatAssessment.threatLevel) {
            case 'LOW':
                allocation.availableAgents = 1;
                break;
            case 'MEDIUM':
                allocation.availableAgents = 2;
                break;
            case 'HIGH':
                allocation.availableAgents = 3;
                break;
            case 'CRITICAL':
                allocation.availableAgents = 4;
                allocation.emergencyReserves = 1;
                break;
        }

        // Ajustement selon le contexte
        if (context.civilianPresence > 20) {
            allocation.availableAgents += 1;
        }

        return allocation;
    }

    private createTimeline(threatAssessment: ThreatAssessmentResult, context: InterventionContext): InterventionTimeline {
        const timeline: InterventionTimeline = {
            phases: [],
            estimatedDuration: 0,
            criticalMilestones: []
        };

        // Phase 1: Préparation
        timeline.phases.push({
            name: 'Préparation',
            duration: 300, // 5 minutes
            activities: ['Évaluation du terrain', 'Coordination des équipes', 'Vérification éthique']
        });

        // Phase 2: Approche
        timeline.phases.push({
            name: 'Approche',
            duration: 600, // 10 minutes
            activities: ['Positionnement discret', 'Évaluation de la situation', 'Contact initial']
        });

        // Phase 3: Intervention
        const interventionDuration = this.calculateInterventionDuration(threatAssessment);
        timeline.phases.push({
            name: 'Intervention',
            duration: interventionDuration,
            activities: ['Exécution du protocole', 'Gestion de l\'escalade', 'Protection des civils']
        });

        // Phase 4: Résolution
        timeline.phases.push({
            name: 'Résolution',
            duration: 900, // 15 minutes
            activities: ['Sécurisation', 'Évacuation', 'Rapport éthique']
        });

        timeline.estimatedDuration = timeline.phases.reduce((total, phase) => total + phase.duration, 0);
        timeline.criticalMilestones = this.identifyCriticalMilestones(timeline);

        return timeline;
    }

    private createFallbackPlans(threatAssessment: ThreatAssessmentResult): FallbackPlan[] {
        const fallbacks: FallbackPlan[] = [];

        // Plan de repli 1: Retrait tactique
        fallbacks.push({
            id: 'tactical_retreat',
            name: 'Retrait Tactique',
            trigger: 'ÉCHEC_INTERVENTION',
            actions: ['Signal de retrait', 'Protection des civils', 'Regroupement sécurisé'],
            ethicalConsiderations: ['Préservation de la vie', 'Minimisation des dommages']
        });

        // Plan de repli 2: Intervention d'urgence
        fallbacks.push({
            id: 'emergency_intervention',
            name: 'Intervention d\'Urgence',
            trigger: 'MENACE_IMMINENTE',
            actions: ['Action immédiate', 'Protection prioritaire', 'Coordination d\'urgence'],
            ethicalConsiderations: ['Justification de l\'urgence', 'Force minimale nécessaire']
        });

        return fallbacks;
    }

    private requiresHumanApproval(threatAssessment: ThreatAssessmentResult): boolean {
        return threatAssessment.threatLevel === 'CRITICAL' || 
               threatAssessment.confidence < 0.8 ||
               !threatAssessment.ethicalApproval;
    }

    private validateInterventionPlan(plan: InterventionPlan, threatAssessment: ThreatAssessmentResult): EthicalValidation {
        const validation: EthicalValidation = {
            approved: true,
            reasons: [],
            warnings: [],
            requiredApprovals: []
        };

        // Vérifications éthiques spécifiques
        if (plan.resources.availableAgents > this.resourceAllocation.availableAgents) {
            validation.approved = false;
            validation.reasons.push('Ressources insuffisantes pour cette intervention');
        }

        if (plan.protocol.id === 'minimal_force_protocol' && threatAssessment.confidence < 0.9) {
            validation.warnings.push('Confiance insuffisante pour protocole de force');
        }

        if (plan.timeline.estimatedDuration > 3600) { // 1 heure
            validation.warnings.push('Durée d\'intervention excessive');
        }

        return validation;
    }

    private finalEthicalCheck(plan: InterventionPlan): boolean {
        // Vérification finale avant exécution
        const currentTime = new Date();
        const timeSincePlanning = currentTime.getTime() - plan.timestamp.getTime();
        
        // Vérifier si les conditions ont changé
        if (timeSincePlanning > 300000) { // 5 minutes
            this.logIntervention('ETHICAL_CHECK_FAILED', 'Conditions changées depuis la planification');
            return false;
        }

        // Vérifier la disponibilité des ressources
        if (this.activeInterventions.length >= this.resourceAllocation.maxSimultaneousInterventions) {
            this.logIntervention('ETHICAL_CHECK_FAILED', 'Ressources insuffisantes');
            return false;
        }

        return true;
    }

    private executeProtocol(plan: InterventionPlan): ProtocolExecutionResult {
        const result: ProtocolExecutionResult = {
            success: false,
            outcome: 'UNKNOWN',
            casualties: { civilian: 0, agent: 0, threat: 0 },
            ethicalCompliance: true,
            violations: [],
            notes: []
        };

        try {
            // Simulation de l'exécution du protocole
            const protocol = plan.protocol;
            const currentLevel = plan.escalationLevel;
            const levelAction = protocol.escalationLevels.find(l => l.level === currentLevel);

            if (levelAction) {
                result.notes.push(`Exécution: ${levelAction.description}`);
                
                // Simulation des résultats selon le type d'action
                switch (levelAction.action) {
                    case 'SURVEILLANCE_PASSIVE':
                        result.success = true;
                        result.outcome = 'SURVEILLANCE_ACTIVE';
                        break;
                    case 'CONTACT_DIPLOMATIQUE':
                        result.success = true;
                        result.outcome = 'DIALOGUE_ENGAGED';
                        break;
                    case 'DISSENSION_VERBALE':
                        result.success = true;
                        result.outcome = 'THREAT_DISSIPATED';
                        break;
                    case 'RESTRAINT_PHYSIQUE':
                        result.success = true;
                        result.outcome = 'THREAT_NEUTRALIZED';
                        result.casualties.threat = 1;
                        break;
                    case 'FORCE_DEFENSIVE':
                        result.success = true;
                        result.outcome = 'THREAT_ELIMINATED';
                        result.casualties.threat = 1;
                        result.casualties.agent = 1;
                        break;
                }
            }

        } catch (error) {
            result.success = false;
            result.outcome = 'EXECUTION_ERROR';
            result.notes.push(`Erreur: ${error.message}`);
        }

        return result;
    }

    private validateEscalation(intervention: ActiveIntervention, newLevel: number): EscalationValidation {
        const validation: EscalationValidation = {
            approved: false,
            reason: '',
            ethicalConcerns: []
        };

        // Vérifications éthiques pour l'escalade
        if (newLevel > 5) {
            validation.reason = 'Niveau d\'escalade maximum atteint';
            return validation;
        }

        if (newLevel === 5 && intervention.casualties.civilian > 0) {
            validation.ethicalConcerns.push('Escalade critique avec civils en danger');
        }

        // Approbation si aucune objection éthique
        validation.approved = validation.ethicalConcerns.length === 0;
        return validation;
    }

    private calculateInterventionDuration(threatAssessment: ThreatAssessmentResult): number {
        // Calcul de la durée basée sur le niveau de menace
        switch (threatAssessment.threatLevel) {
            case 'LOW': return 300; // 5 minutes
            case 'MEDIUM': return 600; // 10 minutes
            case 'HIGH': return 1200; // 20 minutes
            case 'CRITICAL': return 1800; // 30 minutes
            default: return 600;
        }
    }

    private identifyCriticalMilestones(timeline: InterventionTimeline): CriticalMilestone[] {
        const milestones: CriticalMilestone[] = [];
        let currentTime = 0;

        timeline.phases.forEach((phase, index) => {
            if (index === 1) { // Phase d'approche
                milestones.push({
                    time: currentTime + phase.duration / 2,
                    description: 'Évaluation de la situation',
                    critical: true
                });
            }
            if (index === 2) { // Phase d'intervention
                milestones.push({
                    time: currentTime + phase.duration / 3,
                    description: 'Point de non-retour',
                    critical: true
                });
            }
            currentTime += phase.duration;
        });

        return milestones;
    }

    // ===== GESTION DES DONNÉES =====

    private loadInterventionHistory() {
        this.interventionHistory = [];
    }

    private recordInterventionPlan(plan: InterventionPlan) {
        const record: InterventionRecord = {
            timestamp: plan.timestamp,
            interventionId: plan.interventionId,
            threatId: plan.threatId,
            threatLevel: plan.threatLevel,
            protocol: plan.protocol.id,
            status: plan.status
        };
        
        this.interventionHistory.push(record);
    }

    private recordInterventionResult(result: InterventionResult) {
        // Mise à jour du record existant
        const record = this.interventionHistory.find(r => r.interventionId === result.interventionId);
        if (record) {
            record.status = result.success ? 'SUCCESS' : 'FAILED';
            record.outcome = result.outcome;
        }
    }

    private updateActiveInterventions(plan: InterventionPlan, result: InterventionResult) {
        if (result.success && result.outcome !== 'COMPLETED') {
            const activeIntervention: ActiveIntervention = {
                interventionId: plan.interventionId,
                threatId: plan.threatId,
                startTime: plan.timestamp,
                currentLevel: plan.escalationLevel,
                protocol: plan.protocol,
                casualties: result.casualties,
                lastUpdate: new Date()
            };
            
            this.activeInterventions.push(activeIntervention);
        } else {
            // Retirer de la liste active
            this.activeInterventions = this.activeInterventions.filter(
                i => i.interventionId !== plan.interventionId
            );
        }
    }

    private logIntervention(action: string, message: string) {
        console.log(`[InterventionSystem] ${action}: ${message}`);
    }

    private logError(action: string, message: string) {
        console.error(`[InterventionSystem] ${action}: ${message}`);
    }

    // ===== GETTERS =====

    getActiveInterventions(): ActiveIntervention[] {
        return [...this.activeInterventions];
    }

    getInterventionHistory(): InterventionRecord[] {
        return [...this.interventionHistory];
    }

    getEthicalProtocols(): EthicalProtocol[] {
        return [...this.ethicalProtocols];
    }

    getResourceStatus(): ResourceStatus {
        return {
            totalAgents: this.resourceAllocation.availableAgents,
            activeInterventions: this.activeInterventions.length,
            availableCapacity: this.resourceAllocation.maxSimultaneousInterventions - this.activeInterventions.length,
            emergencyReserves: this.resourceAllocation.emergencyReserves
        };
    }

    getInterventionStatistics(): InterventionStatistics {
        const totalInterventions = this.interventionHistory.length;
        const successfulInterventions = this.interventionHistory.filter(r => r.status === 'SUCCESS').length;
        const ethicalViolations = this.interventionHistory.filter(r => r.status === 'FAILED').length;

        return {
            totalInterventions,
            successfulInterventions,
            ethicalViolations,
            successRate: totalInterventions > 0 ? successfulInterventions / totalInterventions : 0,
            activeInterventions: this.activeInterventions.length
        };
    }
}

// ===== TYPES ET INTERFACES =====

interface InterventionContext {
    location: string;
    civilianPresence: number;
    environmentalFactors: string[];
    timeOfDay: string;
    weatherConditions: string;
}

interface InterventionPlan {
    interventionId: string;
    timestamp: Date;
    threatId: string;
    threatLevel: string;
    ethicalApproval: boolean;
    protocol: EthicalProtocol;
    escalationLevel: number;
    resources: ResourceAllocation;
    timeline: InterventionTimeline;
    fallbackPlans: FallbackPlan[];
    status: 'PLANNED' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
    requiresHumanApproval: boolean;
    ethicalIssues?: string[];
}

interface InterventionResult {
    interventionId: string;
    timestamp: Date;
    success: boolean;
    outcome: string;
    casualties: CasualtyReport;
    ethicalCompliance: boolean;
    violations: string[];
    duration: number;
    escalationLevel: number;
    notes: string[];
}

interface EscalationResult {
    interventionId: string;
    timestamp: Date;
    previousLevel: number;
    newLevel: number;
    reason: string;
    ethicalApproval: boolean;
    approved: boolean;
}

interface EthicalProtocol {
    id: string;
    name: string;
    description: string;
    escalationLevels: EscalationLevel[];
    ethicalConstraints: string[];
}

interface EscalationLevel {
    level: number;
    action: string;
    description: string;
}

interface ResourceAllocation {
    availableAgents: number;
    maxSimultaneousInterventions: number;
    emergencyReserves: number;
}

interface InterventionTimeline {
    phases: TimelinePhase[];
    estimatedDuration: number;
    criticalMilestones: CriticalMilestone[];
}

interface TimelinePhase {
    name: string;
    duration: number;
    activities: string[];
}

interface CriticalMilestone {
    time: number;
    description: string;
    critical: boolean;
}

interface FallbackPlan {
    id: string;
    name: string;
    trigger: string;
    actions: string[];
    ethicalConsiderations: string[];
}

interface CasualtyReport {
    civilian: number;
    agent: number;
    threat: number;
}

interface ProtocolExecutionResult {
    success: boolean;
    outcome: string;
    casualties: CasualtyReport;
    ethicalCompliance: boolean;
    violations: string[];
    notes: string[];
}

interface EscalationValidation {
    approved: boolean;
    reason: string;
    ethicalConcerns: string[];
}

interface InterventionRecord {
    timestamp: Date;
    interventionId: string;
    threatId: string;
    threatLevel: string;
    protocol: string;
    status: string;
    outcome?: string;
}

interface ActiveIntervention {
    interventionId: string;
    threatId: string;
    startTime: Date;
    currentLevel: number;
    protocol: EthicalProtocol;
    casualties: CasualtyReport;
    lastUpdate: Date;
}

interface ResourceStatus {
    totalAgents: number;
    activeInterventions: number;
    availableCapacity: number;
    emergencyReserves: number;
}

interface InterventionStatistics {
    totalInterventions: number;
    successfulInterventions: number;
    ethicalViolations: number;
    successRate: number;
    activeInterventions: number;
} 