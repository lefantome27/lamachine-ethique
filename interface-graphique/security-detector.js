const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class SecurityDetector extends EventEmitter {
    constructor() {
        super();
        this.isMonitoring = false;
        this.blockedIPs = new Set();
        this.detectedAttacks = [];
        this.sqlInjectionPatterns = [
            /'; --/i,
            /'\s*OR\s*'1'='1'/i,
            /UNION\s+SELECT/i,
            /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\s+OR\s+.*=/i,
            /INSERT\s+INTO\s+.*\s+VALUES\s*\(.*\)/i,
            /UPDATE\s+.*\s+SET\s+.*\s+WHERE\s+.*\s+OR\s+.*=/i,
            /DELETE\s+FROM\s+.*\s+WHERE\s+.*\s+OR\s+.*=/i,
            /DROP\s+TABLE/i,
            /EXEC\s*\(/i,
            /xp_cmdshell/i,
            /--\s*$/i,
            /\/\*.*\*\//i,
            /WAITFOR\s+DELAY/i,
            /BENCHMARK\s*\(/i,
            /SLEEP\s*\(/i,
            /'\s*OR\s*1\s*=\s*1/i,
            /'\s*OR\s*'1'\s*=\s*'1'/i
        ];
        
        this.nmapPatterns = [
            /nmap/i,
            /port\s+scan/i,
            /masscan/i,
            /zenmap/i
        ];
        
        this.ddosPatterns = [
            /flood/i,
            /syn\s+flood/i,
            /udp\s+flood/i,
            /icmp\s+flood/i
        ];
    }

    // Détection d'injection SQL
    detectSQLInjection(query) {
        const detected = this.sqlInjectionPatterns.some(pattern => pattern.test(query));
        if (detected) {
            const attack = {
                id: `SQL_${Date.now()}`,
                type: 'SQL Injection',
                severity: 'HIGH',
                query: query,
                timestamp: new Date(),
                description: 'Tentative d\'injection SQL détectée',
                location: 'Local'
            };
            this.addDetectedAttack(attack);
        }
        return detected;
    }

    // Détection de scan de ports
    detectPortScan(logEntry) {
        const detected = this.nmapPatterns.some(pattern => pattern.test(logEntry));
        if (detected) {
            const attack = {
                id: `SCAN_${Date.now()}`,
                type: 'Port Scan',
                severity: 'MEDIUM',
                description: 'Scan de ports détecté',
                timestamp: new Date(),
                location: 'Network',
                details: logEntry
            };
            this.addDetectedAttack(attack);
        }
        return detected;
    }

    // Détection d'attaque DDoS
    detectDDoS(logEntry) {
        const detected = this.ddosPatterns.some(pattern => pattern.test(logEntry));
        if (detected) {
            const attack = {
                id: `DDOS_${Date.now()}`,
                type: 'DDoS',
                severity: 'CRITICAL',
                description: 'Attaque DDoS détectée',
                timestamp: new Date(),
                location: 'Network',
                details: logEntry
            };
            this.addDetectedAttack(attack);
        }
        return detected;
    }

    // Scan de ports avec Python
    async scanPorts(target) {
        return new Promise((resolve, reject) => {
            const pythonScript = path.join(__dirname, 'port-scanner.py');
            
            // Créer le script Python s'il n'existe pas
            if (!fs.existsSync(pythonScript)) {
                this.createPythonScanner();
            }

            const py = spawn('python', [pythonScript, target]);
            let output = '';
            let error = '';

            py.stdout.on('data', (data) => {
                output += data.toString();
            });

            py.stderr.on('data', (data) => {
                error += data.toString();
            });

            py.on('close', (code) => {
                if (code === 0) {
                    try {
                        const results = JSON.parse(output);
                        this.processScanResults(target, results);
                        resolve(results);
                    } catch (e) {
                        reject(new Error('Erreur parsing résultats: ' + e.message));
                    }
                } else {
                    reject(new Error('Erreur scan: ' + error));
                }
            });
        });
    }

    // Traitement des résultats de scan
    processScanResults(target, results) {
        results.forEach(host => {
            if (host.ports && host.ports.length > 0) {
                const openPorts = host.ports.filter(port => port.state === 'open');
                if (openPorts.length > 0) {
                    this.blockIP(target, openPorts.map(p => p.port));
                    const attack = {
                        id: `SCAN_${Date.now()}`,
                        type: 'Mass Port Scan',
                        severity: 'HIGH',
                        description: `Scan massif détecté sur ${target} - ${openPorts.length} ports ouverts`,
                        timestamp: new Date(),
                        location: 'Network',
                        details: `Ports ouverts: ${openPorts.map(p => p.port).join(', ')}`,
                        address: target,
                        ports: openPorts.map(p => p.port)
                    };
                    this.addDetectedAttack(attack);
                }
            }
        });
    }

    // Créer le script Python de scan
    createPythonScanner() {
        const pythonCode = `#!/usr/bin/env python3
import nmap
import sys
import json
import socket
from datetime import datetime

def scan_ports(target):
    try:
        nm = nmap.PortScanner()
        print(f"Scanning {target}...", file=sys.stderr)
        
        # Scan des ports communs
        nm.scan(target, '21-23,25,53,80,110,143,443,993,995,1433,1521,3306,3389,5432,5900,6379,8080,8443')
        
        results = []
        for host in nm.all_hosts():
            host_info = {
                'host': host,
                'state': nm[host].state(),
                'ports': [],
                'scan_time': datetime.now().isoformat()
            }
            
            for proto in nm[host].all_protocols():
                lport = nm[host][proto].keys()
                for port in lport:
                    port_info = nm[host][proto][port]
                    host_info['ports'].append({
                        'port': port,
                        'state': port_info['state'],
                        'service': port_info.get('name', 'unknown'),
                        'version': port_info.get('version', '')
                    })
            
            results.append(host_info)
        
        return results
    except Exception as e:
        print(f"Erreur scan: {str(e)}", file=sys.stderr)
        return []

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python port-scanner.py <target_ip>")
        sys.exit(1)
    
    target = sys.argv[1]
    results = scan_ports(target)
    print(json.dumps(results))
`;
        
        fs.writeFileSync(path.join(__dirname, 'port-scanner.py'), pythonCode);
    }

    // Bloquer une IP
    blockIP(ip, ports) {
        if (!this.blockedIPs.has(ip)) {
            this.blockedIPs.add(ip);
            const blockedIP = {
                id: `IP_${Date.now()}`,
                address: ip,
                reason: 'Attaque détectée',
                timestamp: new Date(),
                location: 'Network',
                threatLevel: 'HIGH',
                ports: ports || []
            };
            this.emit('ipBlocked', blockedIP);
        }
    }

    // Débloquer une IP
    unblockIP(ip) {
        this.blockedIPs.delete(ip);
        this.emit('ipUnblocked', ip);
    }

    // Ajouter une attaque détectée
    addDetectedAttack(attack) {
        // Si l'attaque a un champ 'ip' ou 'target', le copier dans 'address' pour la géolocalisation
        if (!attack.address && (attack.ip || attack.target)) {
            attack.address = attack.ip || attack.target;
        }
        this.detectedAttacks.unshift(attack);
        if (this.detectedAttacks.length > 100) {
            this.detectedAttacks = this.detectedAttacks.slice(0, 100);
        }
        this.emit('attackDetected', attack);
    }

    // Démarrer le monitoring
    startMonitoring() {
        this.isMonitoring = true;
        this.emit('monitoringStarted');
        
        this.monitoringInterval = setInterval(() => {
            if (Math.random() > 0.8) {
                this.simulateSecurityEvent();
            }
        }, 10000);
    }

    // Arrêter le monitoring
    stopMonitoring() {
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.emit('monitoringStopped');
    }

    // Simuler un événement de sécurité
    simulateSecurityEvent() {
        const events = [
            () => {
                const ip = this.generateRandomIP();
                this.blockIP(ip);
            },
            () => {
                const attackTypes = ['SQL Injection', 'Port Scan', 'DDoS', 'Brute Force'];
                const type = attackTypes[Math.floor(Math.random() * attackTypes.length)];
                const attack = {
                    id: `SIM_${Date.now()}`,
                    type,
                    severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
                    description: 'Événement de sécurité simulé',
                    timestamp: new Date(),
                    location: ['Local', 'Network', 'Internet'][Math.floor(Math.random() * 3)]
                };
                // Ajout pour DDoS : IP et port
                if (type === 'DDoS') {
                    attack.address = this.generateRandomIP();
                    attack.port = 80;
                }
                this.addDetectedAttack(attack);
            }
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        randomEvent();
    }

    // Générer une IP aléatoire
    generateRandomIP() {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    // Obtenir les statistiques
    getStats() {
        return {
            blockedIPs: this.blockedIPs.size,
            detectedAttacks: this.detectedAttacks.length,
            isMonitoring: this.isMonitoring
        };
    }

    // Obtenir les IPs bloquées
    getBlockedIPs() {
        return Array.from(this.blockedIPs).map(ip => ({
            id: `IP_${ip.replace(/\./g, '_')}`,
            address: ip,
            reason: 'Attaque détectée',
            timestamp: new Date(),
            location: 'Network',
            threatLevel: 'HIGH'
        }));
    }

    // Obtenir les attaques détectées
    getDetectedAttacks() {
        return this.detectedAttacks;
    }
}

module.exports = SecurityDetector; 