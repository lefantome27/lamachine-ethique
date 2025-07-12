// ===== DÉMONSTRATION DE LA MACHINE ÉTHIQUE =====
// Scénarios de test inspirés de Person of Interest

import { EthicalMachineCore } from '../components/EthicalMachineCore';
import { ThreatData, ThreatContext, HumanApproval } from '../components/EthicalMachineCore';

export class EthicalMachineDemo {
    private machine: EthicalMachineCore;

    constructor() {
        this.machine = new EthicalMachineCore();
        console.log('🚀 Machine Éthique initialisée');
    }

    // ===== SCÉNARIOS DE DÉMONSTRATION =====

    /**
     * Scénario 1: Menace faible - Surveillance passive
     */
    async demonstrateLowThreatScenario() {
        console.log('\n📊 SCÉNARIO 1: Menace Faible - Surveillance Passive');
        console.log('=' .repeat(60));

        const threatData: ThreatData = {
            behavioralPatterns: [
                {
                    type: 'movement_pattern',
                    anomalyScore: 0.3
                }
            ],
            location: 'centre_commercial',
            timing: new Date(),
            metadata: {
                description: 'Comportement suspect dans un centre commercial'
            }
        };

        const context: ThreatContext = {
            location: 'centre_commercial',
            civilianPresence: 50,
            environmentalFactors: ['espace_public', 'caméras_surveillance'],
            weatherConditions: 'CLEAR'
        };

        const result = await this.machine.processThreat(threatData, context);
        this.displayResult('Menace Faible', result);
    }

    /**
     * Scénario 2: Menace moyenne - Intervention diplomatique
     */
    async demonstrateMediumThreatScenario() {
        console.log('\n⚠️ SCÉNARIO 2: Menace Moyenne - Intervention Diplomatique');
        console.log('=' .repeat(60));

        const threatData: ThreatData = {
            behavioralPatterns: [
                {
                    type: 'social_interaction',
                    isolationScore: 0.6
                }
            ],
            communicationPatterns: [
                {
                    type: 'encrypted_message',
                    encryptionLevel: 0.7
                }
            ],
            location: 'transport_public',
            timing: new Date(),
            metadata: {
                description: 'Communication suspecte dans les transports'
            }
        };

        const context: ThreatContext = {
            location: 'transport_public',
            civilianPresence: 25,
            environmentalFactors: ['espace_confiné', 'sorties_limitées'],
            weatherConditions: 'RAIN'
        };

        const result = await this.machine.processThreat(threatData, context);
        this.displayResult('Menace Moyenne', result);
    }

    /**
     * Scénario 3: Menace élevée - Intervention avec approbation humaine
     */
    async demonstrateHighThreatScenario() {
        console.log('\n🚨 SCÉNARIO 3: Menace Élevée - Intervention avec Approbation Humaine');
        console.log('=' .repeat(60));

        const threatData: ThreatData = {
            behavioralPatterns: [
                {
                    type: 'financial_activity',
                    unusualAmountScore: 0.8
                }
            ],
            communicationPatterns: [
                {
                    type: 'suspicious_contact',
                    contactRiskScore: 0.9
                }
            ],
            networkActivity: {
                suspiciousConnections: 15,
                dataVolume: 2000000000, // 2GB
                portsUsed: ['22', '80', '443', '8080'],
                connectionFrequency: 1500
            },
            location: 'infrastructure_critique',
            timing: new Date(),
            metadata: {
                description: 'Activité suspecte sur infrastructure critique'
            }
        };

        const context: ThreatContext = {
            location: 'infrastructure_critique',
            civilianPresence: 5,
            environmentalFactors: ['zone_sensible', 'accès_restreint'],
            weatherConditions: 'CLEAR'
        };

        const result = await this.machine.processThreat(threatData, context);
        this.displayResult('Menace Élevée', result);

        // Simulation d'approbation humaine
        if (result.humanApprovalRequired && result.intervention) {
            console.log('\n👤 SIMULATION: Approbation Humaine');
            const humanApproval: HumanApproval = {
                approved: true,
                approver: 'Agent Reese',
                timestamp: new Date(),
                reasoning: 'Menace confirmée, intervention autorisée',
                conditions: ['force_minimale', 'protection_civile']
            };

            const executionResult = await this.machine.executeInterventionWithApproval(
                result.processingId,
                humanApproval
            );
            this.displayExecutionResult(executionResult);
        }
    }

    /**
     * Scénario 4: Menace critique - Intervention immédiate
     */
    async demonstrateCriticalThreatScenario() {
        console.log('\n🔥 SCÉNARIO 4: Menace Critique - Intervention Immédiate');
        console.log('=' .repeat(60));

        const threatData: ThreatData = {
            behavioralPatterns: [
                {
                    type: 'movement_pattern',
                    anomalyScore: 0.9
                },
                {
                    type: 'social_interaction',
                    isolationScore: 0.8
                }
            ],
            communicationPatterns: [
                {
                    type: 'coded_language',
                    codingComplexity: 0.9
                }
            ],
            networkActivity: {
                suspiciousConnections: 50,
                dataVolume: 5000000000, // 5GB
                portsUsed: ['22', '23', '80', '443', '8080', '9090'],
                connectionFrequency: 3000
            },
            location: 'gouvernement',
            timing: new Date(),
            metadata: {
                description: 'Menace critique sur infrastructure gouvernementale'
            }
        };

        const context: ThreatContext = {
            location: 'gouvernement',
            civilianPresence: 100,
            environmentalFactors: ['zone_ultra_sensible', 'personnel_essentiel'],
            weatherConditions: 'CLEAR'
        };

        const result = await this.machine.processThreat(threatData, context);
        this.displayResult('Menace Critique', result);

        // Simulation d'approbation d'urgence
        if (result.humanApprovalRequired && result.intervention) {
            console.log('\n🚨 SIMULATION: Approbation d\'Urgence');
            const emergencyApproval: HumanApproval = {
                approved: true,
                approver: 'Finch',
                timestamp: new Date(),
                reasoning: 'Urgence critique - intervention immédiate autorisée',
                conditions: ['force_défensive', 'évacuation_civile']
            };

            const executionResult = await this.machine.executeInterventionWithApproval(
                result.processingId,
                emergencyApproval
            );
            this.displayExecutionResult(executionResult);
        }
    }

    /**
     * Scénario 5: Test de rejet éthique
     */
    async demonstrateEthicalRejectionScenario() {
        console.log('\n🛡️ SCÉNARIO 5: Test de Rejet Éthique');
        console.log('=' .repeat(60));

        const threatData: ThreatData = {
            behavioralPatterns: [
                {
                    type: 'digital_footprint',
                    privacyScore: 0.2 // Score très faible - pas de menace réelle
                }
            ],
            location: 'école',
            timing: new Date(),
            metadata: {
                description: 'Activité normale dans une école'
            }
        };

        const context: ThreatContext = {
            location: 'école',
            civilianPresence: 200,
            environmentalFactors: ['zone_éducative', 'mineurs_présents'],
            weatherConditions: 'CLEAR'
        };

        const result = await this.machine.processThreat(threatData, context);
        this.displayResult('Test Éthique', result);
    }

    // ===== AFFICHAGE DES RÉSULTATS =====

    private displayResult(scenarioName: string, result: any) {
        console.log(`\n📋 RÉSULTAT: ${scenarioName}`);
        console.log(`   ID de traitement: ${result.processingId}`);
        console.log(`   Décision finale: ${result.finalDecision}`);
        console.log(`   Approbation éthique: ${result.ethicalApproval ? '✅' : '❌'}`);
        console.log(`   Approbation humaine requise: ${result.humanApprovalRequired ? '✅' : '❌'}`);
        console.log(`   Temps de traitement: ${result.processingTime}ms`);
        
        if (result.assessment) {
            console.log(`\n   📊 ÉVALUATION DE LA MENACE:`);
            console.log(`      Niveau: ${result.assessment.threatLevel}`);
            console.log(`      Confiance: ${(result.assessment.confidence * 100).toFixed(1)}%`);
            console.log(`      Raisons: ${result.assessment.reasoning.join(', ')}`);
        }

        if (result.intervention) {
            console.log(`\n   🎯 PLAN D'INTERVENTION:`);
            console.log(`      Protocole: ${result.intervention.protocol.name}`);
            console.log(`      Niveau d'escalade: ${result.intervention.escalationLevel}`);
            console.log(`      Statut: ${result.intervention.status}`);
        }

        if (result.reasoning.length > 0) {
            console.log(`\n   💭 RAISONNEMENT:`);
            result.reasoning.forEach((reason: string, index: number) => {
                console.log(`      ${index + 1}. ${reason}`);
            });
        }
    }

    private displayExecutionResult(result: any) {
        console.log(`\n⚡ RÉSULTAT D'EXÉCUTION:`);
        console.log(`   Succès: ${result.interventionResult?.success ? '✅' : '❌'}`);
        console.log(`   Résultat: ${result.interventionResult?.outcome}`);
        console.log(`   Conformité éthique: ${result.ethicalCompliance ? '✅' : '❌'}`);
        console.log(`   Temps d'exécution: ${result.executionTime}ms`);
        
        if (result.interventionResult?.casualties) {
            const casualties = result.interventionResult.casualties;
            console.log(`   Pertes: Civils=${casualties.civilian}, Agents=${casualties.agent}, Menaces=${casualties.threat}`);
        }
    }

    // ===== DÉMONSTRATION COMPLÈTE =====

    async runCompleteDemo() {
        console.log('🎬 DÉMONSTRATION COMPLÈTE DE LA MACHINE ÉTHIQUE');
        console.log('=' .repeat(80));
        console.log('Inspirée de Person of Interest - Système de protection éthique');
        console.log('=' .repeat(80));

        try {
            // Attendre que la machine soit prête
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Exécuter tous les scénarios
            await this.demonstrateLowThreatScenario();
            await new Promise(resolve => setTimeout(resolve, 2000));

            await this.demonstrateMediumThreatScenario();
            await new Promise(resolve => setTimeout(resolve, 2000));

            await this.demonstrateHighThreatScenario();
            await new Promise(resolve => setTimeout(resolve, 2000));

            await this.demonstrateCriticalThreatScenario();
            await new Promise(resolve => setTimeout(resolve, 2000));

            await this.demonstrateEthicalRejectionScenario();
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Afficher les statistiques finales
            this.displayFinalStatistics();

        } catch (error) {
            console.error('❌ Erreur lors de la démonstration:', error);
        }
    }

    private displayFinalStatistics() {
        console.log('\n📈 STATISTIQUES FINALES');
        console.log('=' .repeat(60));

        const metrics = this.machine.getSystemMetrics();
        const health = this.machine.getSystemHealth();
        const compliance = this.machine.getEthicalComplianceReport();

        console.log(`   🏥 Santé du système: ${health.status}`);
        console.log(`   ⏱️ Temps de fonctionnement: ${Math.round(metrics.uptime / 1000)}s`);
        console.log(`   🎯 Menaces traitées: ${metrics.threatsProcessed}`);
        console.log(`   ⚡ Interventions exécutées: ${metrics.interventionsExecuted}`);
        console.log(`   🤔 Décisions éthiques: ${metrics.ethicalDecisions}`);
        console.log(`   👤 Approbations humaines: ${metrics.humanApprovals}`);
        console.log(`   📊 Conformité éthique: ${compliance.complianceScore}%`);
        console.log(`   🛡️ Règles éthiques actives: ${health.ethicalRulesActive}`);

        console.log('\n🎉 DÉMONSTRATION TERMINÉE');
        console.log('La Machine Éthique fonctionne selon les principes de Person of Interest');
        console.log('Protection, Éthique, et Contrôle Humain - Toujours.');
    }

    // ===== UTILITAIRES =====

    getMachineStatus() {
        return {
            status: this.machine.getSystemStatus(),
            metrics: this.machine.getSystemMetrics(),
            health: this.machine.getSystemHealth(),
            compliance: this.machine.getEthicalComplianceReport()
        };
    }

    performAudit() {
        console.log('\n🔍 AUDIT ÉTHIQUE DU SYSTÈME');
        console.log('=' .repeat(60));
        
        const audit = this.machine.performEthicalAudit();
        
        console.log(`   📅 Date: ${audit.timestamp.toLocaleString()}`);
        console.log(`   🏥 Statut: ${audit.systemStatus}`);
        console.log(`   📊 Conformité: ${audit.ethicalCompliance}%`);
        console.log(`   👤 Oversight humain: ${audit.humanOversightStatus ? 'Actif' : 'Inactif'}`);
        console.log(`   ⏱️ Durée: ${audit.auditDuration}ms`);

        if (audit.violations.length > 0) {
            console.log(`\n   ⚠️ VIOLATIONS DÉTECTÉES:`);
            audit.violations.forEach((violation, index) => {
                console.log(`      ${index + 1}. ${violation}`);
            });
        }

        if (audit.recommendations.length > 0) {
            console.log(`\n   💡 RECOMMANDATIONS:`);
            audit.recommendations.forEach((recommendation, index) => {
                console.log(`      ${index + 1}. ${recommendation}`);
            });
        }

        return audit;
    }
}

// ===== FONCTION D'EXPORT POUR UTILISATION =====

export async function runEthicalMachineDemo() {
    const demo = new EthicalMachineDemo();
    await demo.runCompleteDemo();
    return demo;
}

// ===== EXEMPLE D'UTILISATION =====

if (typeof window === 'undefined') {
    // Exécution en mode Node.js
    runEthicalMachineDemo().catch(console.error);
} 