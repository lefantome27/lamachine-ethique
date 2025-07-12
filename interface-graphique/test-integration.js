const SecurityDetector = require('./security-detector');
const { spawn } = require('child_process');

console.log('🧪 Test d\'intégration - La Machine Éthique');
console.log('===========================================\n');

async function runTests() {
    const detector = new SecurityDetector();
    let testsPassed = 0;
    let totalTests = 0;

    // Test 1: Détection SQL Injection
    console.log('1. Test de détection SQL Injection...');
    totalTests++;
    
    const sqlTests = [
        { query: "SELECT * FROM users WHERE id = '1' OR '1'='1'", expected: true },
        { query: "SELECT * FROM users WHERE id = 1", expected: false },
        { query: "'; DROP TABLE users; --", expected: true },
        { query: "INSERT INTO users VALUES ('test', 'password')", expected: false }
    ];

    for (const test of sqlTests) {
        const detected = detector.detectSQLInjection(test.query);
        if (detected === test.expected) {
            console.log(`   ✅ "${test.query.substring(0, 30)}..." - ${detected ? 'Détecté' : 'Non détecté'}`);
            testsPassed++;
        } else {
            console.log(`   ❌ "${test.query.substring(0, 30)}..." - Attendu: ${test.expected}, Obtenu: ${detected}`);
        }
    }

    // Test 2: Gestion des IPs bloquées
    console.log('\n2. Test de gestion des IPs bloquées...');
    totalTests++;
    
    const testIPs = ['192.168.1.100', '10.0.0.50', '172.16.0.25'];
    
    for (const ip of testIPs) {
        detector.blockIP(ip);
    }
    
    const blockedIPs = detector.getBlockedIPs();
    if (blockedIPs.length === testIPs.length) {
        console.log(`   ✅ ${blockedIPs.length} IPs bloquées correctement`);
        testsPassed++;
    } else {
        console.log(`   ❌ Attendu: ${testIPs.length}, Obtenu: ${blockedIPs.length}`);
    }

    // Test 3: Détection d'attaques
    console.log('\n3. Test de détection d\'attaques...');
    totalTests++;
    
    const attackTypes = ['SQL Injection', 'Port Scan', 'DDoS', 'Brute Force'];
    for (const type of attackTypes) {
        const attack = {
            id: `TEST_${Date.now()}`,
            type: type,
            severity: 'HIGH',
            description: `Test ${type}`,
            timestamp: new Date(),
            location: 'Test'
        };
        detector.addDetectedAttack(attack);
    }
    
    const attacks = detector.getDetectedAttacks();
    if (attacks.length >= attackTypes.length) {
        console.log(`   ✅ ${attacks.length} attaques détectées`);
        testsPassed++;
    } else {
        console.log(`   ❌ Attendu: ${attackTypes.length}, Obtenu: ${attacks.length}`);
    }

    // Test 4: Statistiques
    console.log('\n4. Test des statistiques...');
    totalTests++;
    
    const stats = detector.getStats();
    if (stats.blockedIPs > 0 && stats.detectedAttacks > 0) {
        console.log(`   ✅ Statistiques: ${stats.blockedIPs} IPs bloquées, ${stats.detectedAttacks} attaques`);
        testsPassed++;
    } else {
        console.log(`   ❌ Statistiques vides`);
    }

    // Test 5: Monitoring
    console.log('\n5. Test du monitoring...');
    totalTests++;
    
    detector.startMonitoring();
    if (detector.isMonitoring) {
        console.log('   ✅ Monitoring démarré');
        testsPassed++;
        
        // Arrêter après 2 secondes
        setTimeout(() => {
            detector.stopMonitoring();
            if (!detector.isMonitoring) {
                console.log('   ✅ Monitoring arrêté');
            }
        }, 2000);
    } else {
        console.log('   ❌ Monitoring non démarré');
    }

    // Test 6: Script Python (si disponible)
    console.log('\n6. Test du script Python...');
    totalTests++;
    
    try {
        const pythonScript = require('path').join(__dirname, 'port-scanner.py');
        if (require('fs').existsSync(pythonScript)) {
            console.log('   ✅ Script Python trouvé');
            
            // Test simple avec localhost
            try {
                const result = await detector.scanPorts('127.0.0.1');
                if (result && Array.isArray(result)) {
                    console.log('   ✅ Scan Python fonctionnel');
                    testsPassed++;
                } else {
                    console.log('   ⚠️  Scan Python retourne des données inattendues');
                }
            } catch (error) {
                console.log(`   ⚠️  Erreur scan Python: ${error.message}`);
            }
        } else {
            console.log('   ⚠️  Script Python non trouvé');
        }
    } catch (error) {
        console.log(`   ⚠️  Erreur test Python: ${error.message}`);
    }

    // Résultats finaux
    console.log('\n===========================================');
    console.log(`📊 Résultats: ${testsPassed}/${totalTests} tests réussis`);
    
    if (testsPassed === totalTests) {
        console.log('🎉 Tous les tests sont passés ! La Machine Éthique est prête.');
    } else {
        console.log('⚠️  Certains tests ont échoué. Vérifiez la configuration.');
    }

    // Nettoyage
    setTimeout(() => {
        process.exit(0);
    }, 1000);
}

// Démarrer les tests
runTests().catch(error => {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
}); 