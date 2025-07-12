// ===== TEST DE LA MACHINE ÉTHIQUE =====
// Script de démonstration simple

console.log('🤖 DÉMARRAGE DE LA MACHINE ÉTHIQUE');
console.log('=' .repeat(50));

// Simulation des composants de la Machine Éthique
class EthicalMachineDemo {
    constructor() {
        this.ethicalRules = [
            'Respect de la Vie Privée',
            'Collecte Minimale',
            'Transparence',
            'Contrôle Humain',
            'Prévention des Biais'
        ];
        this.threatLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        this.interventions = ['MONITOR', 'INVESTIGATE', 'ALERT_HUMAN', 'IMMEDIATE_ACTION'];
    }

    // Simulation d'évaluation de menace
    assessThreat(threatData) {
        console.log(`\n🔍 ÉVALUATION DE MENACE:`);
        console.log(`   Type: ${threatData.type}`);
        console.log(`   Localisation: ${threatData.location}`);
        console.log(`   Niveau de menace: ${threatData.level}`);
        
        // Validation éthique
        const ethicalApproval = this.validateEthically(threatData);
        console.log(`   Approbation éthique: ${ethicalApproval ? '✅' : '❌'}`);
        
        // Recommandation d'action
        const action = this.recommendAction(threatData, ethicalApproval);
        console.log(`   Action recommandée: ${action}`);
        
        return {
            approved: ethicalApproval,
            action: action,
            reasoning: this.getReasoning(threatData, ethicalApproval)
        };
    }

    validateEthically(threatData) {
        // Logique éthique simple
        if (threatData.level === 'CRITICAL' && threatData.location.includes('école')) {
            return false; // Pas d'intervention critique dans une école
        }
        if (threatData.level === 'LOW') {
            return true; // Menace faible toujours approuvée
        }
        return Math.random() > 0.3; // 70% d'approbation pour les autres cas
    }

    recommendAction(threatData, ethicalApproval) {
        if (!ethicalApproval) return 'MONITOR';
        
        switch (threatData.level) {
            case 'LOW': return 'MONITOR';
            case 'MEDIUM': return 'INVESTIGATE';
            case 'HIGH': return 'ALERT_HUMAN';
            case 'CRITICAL': return 'IMMEDIATE_ACTION';
            default: return 'MONITOR';
        }
    }

    getReasoning(threatData, ethicalApproval) {
        if (!ethicalApproval) {
            return 'Intervention rejetée pour raisons éthiques';
        }
        return `Intervention ${threatData.level.toLowerCase()} approuvée`;
    }

    // Simulation de différents scénarios
    runScenarios() {
        console.log('\n🎬 DÉMONSTRATION DES SCÉNARIOS');
        console.log('=' .repeat(50));

        const scenarios = [
            {
                name: 'Menace Faible - Centre Commercial',
                data: { type: 'comportement_suspect', location: 'centre_commercial', level: 'LOW' }
            },
            {
                name: 'Menace Moyenne - Transport Public',
                data: { type: 'communication_suspecte', location: 'transport_public', level: 'MEDIUM' }
            },
            {
                name: 'Menace Élevée - Infrastructure Critique',
                data: { type: 'activité_suspecte', location: 'infrastructure_critique', level: 'HIGH' }
            },
            {
                name: 'Menace Critique - Gouvernement',
                data: { type: 'menace_critique', location: 'gouvernement', level: 'CRITICAL' }
            },
            {
                name: 'Test Éthique - École',
                data: { type: 'activité_normale', location: 'école', level: 'CRITICAL' }
            }
        ];

        scenarios.forEach((scenario, index) => {
            console.log(`\n📊 SCÉNARIO ${index + 1}: ${scenario.name}`);
            console.log('-'.repeat(40));
            
            const result = this.assessThreat(scenario.data);
            
            console.log(`   Raisonnement: ${result.reasoning}`);
            console.log(`   Statut final: ${result.approved ? 'APPROUVÉ' : 'REJETÉ'}`);
        });
    }

    // Affichage des statistiques
    showStatistics() {
        console.log('\n📈 STATISTIQUES DE LA MACHINE ÉTHIQUE');
        console.log('=' .repeat(50));
        console.log(`   Règles éthiques actives: ${this.ethicalRules.length}`);
        console.log(`   Niveaux de menace supportés: ${this.threatLevels.length}`);
        console.log(`   Types d'intervention: ${this.interventions.length}`);
        console.log(`   Statut: OPÉRATIONNEL`);
        console.log(`   Conformité éthique: 100%`);
    }
}

// Exécution de la démonstration
try {
    const machine = new EthicalMachineDemo();
    
    // Afficher les informations de base
    console.log('   Règles éthiques actives:');
    machine.ethicalRules.forEach((rule, index) => {
        console.log(`   ${index + 1}. ${rule}`);
    });
    
    // Exécuter les scénarios
    machine.runScenarios();
    
    // Afficher les statistiques
    machine.showStatistics();
    
    console.log('\n🎉 DÉMONSTRATION TERMINÉE');
    console.log('La Machine Éthique fonctionne selon les principes de Person of Interest');
    console.log('Protection, Éthique, et Contrôle Humain - Toujours.');
    
} catch (error) {
    console.error('❌ Erreur lors de la démonstration:', error.message);
} 