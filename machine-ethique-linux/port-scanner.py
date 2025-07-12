#!/usr/bin/env python3
"""
Script de scan de ports pour La Machine Éthique
Utilise nmap si disponible, sinon utilise socket pour un scan basique
"""

import sys
import json
import socket
import threading
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

def scan_port(host, port, timeout=1):
    """Scan un port individuel"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            return port, 'open'
        else:
            return port, 'closed'
    except:
        return port, 'filtered'

def get_service_name(port):
    """Obtenir le nom du service pour un port"""
    common_services = {
        21: 'ftp', 22: 'ssh', 23: 'telnet', 25: 'smtp', 53: 'dns',
        80: 'http', 110: 'pop3', 143: 'imap', 443: 'https', 993: 'imaps',
        995: 'pop3s', 1433: 'mssql', 1521: 'oracle', 3306: 'mysql',
        3389: 'rdp', 5432: 'postgresql', 5900: 'vnc', 6379: 'redis',
        8080: 'http-proxy', 8443: 'https-alt'
    }
    return common_services.get(port, 'unknown')

def basic_port_scan(host, ports=None):
    """Scan de ports basique avec socket"""
    if ports is None:
        # Ports communs à scanner
        ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 
                1433, 1521, 3306, 3389, 5432, 5900, 6379, 8080, 8443]
    
    print(f"Scanning {host} with basic socket method...", file=sys.stderr)
    
    open_ports = []
    
    # Utiliser ThreadPoolExecutor pour scanner en parallèle
    with ThreadPoolExecutor(max_workers=50) as executor:
        future_to_port = {executor.submit(scan_port, host, port): port for port in ports}
        
        for future in as_completed(future_to_port):
            port, state = future.result()
            if state == 'open':
                service = get_service_name(port)
                open_ports.append({
                    'port': port,
                    'state': state,
                    'service': service,
                    'version': ''
                })
    
    return open_ports

def nmap_scan(host, port_range):
    """Scan avec nmap si disponible"""
    try:
        import nmap
        nm = nmap.PortScanner()
        print(f"Scanning {host} with nmap...", file=sys.stderr)
        
        nm.scan(host, port_range)
        
        results = []
        for host_found in nm.all_hosts():
            host_info = {
                'host': host_found,
                'state': nm[host_found].state(),
                'ports': [],
                'scan_time': datetime.now().isoformat()
            }
            
            for proto in nm[host_found].all_protocols():
                lport = nm[host_found][proto].keys()
                for port in lport:
                    port_info = nm[host_found][proto][port]
                    host_info['ports'].append({
                        'port': port,
                        'state': port_info['state'],
                        'service': port_info.get('name', 'unknown'),
                        'version': port_info.get('version', '')
                    })
            
            results.append(host_info)
        
        return results
    except ImportError:
        print("nmap-python not available, using basic socket scan", file=sys.stderr)
        return None
    except Exception as e:
        print(f"nmap error: {str(e)}", file=sys.stderr)
        return None

def scan_ports(target):
    """Fonction principale de scan"""
    try:
        # Essayer nmap d'abord
        nmap_results = nmap_scan(target, '21-23,25,53,80,110,143,443,993,995,1433,1521,3306,3389,5432,5900,6379,8080,8443')
        
        if nmap_results:
            return nmap_results
        
        # Fallback vers scan basique
        open_ports = basic_port_scan(target)
        
        # Formater les résultats comme nmap
        results = [{
            'host': target,
            'state': 'up',
            'ports': open_ports,
            'scan_time': datetime.now().isoformat()
        }]
        
        return results
        
    except Exception as e:
        print(f"Scan error: {str(e)}", file=sys.stderr)
        return []

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python port-scanner.py <target_ip>")
        sys.exit(1)
    
    target = sys.argv[1]
    results = scan_ports(target)
    print(json.dumps(results)) 