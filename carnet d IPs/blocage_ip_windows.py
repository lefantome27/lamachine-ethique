import csv
import subprocess

CARNET_PATH = 'carnet_ips.csv'

def lister_ips():
    with open(CARNET_PATH, newline='', encoding='utf-8') as csvfile:
        reader = list(csv.DictReader(csvfile))
        print("Liste des IPs du carnet :")
        for idx, row in enumerate(reader):
            print(f"{idx+1}. {row['ip']} ({row['nom_pc']}, {row['lieu']}, {row['operateur']})")
        return reader

def bloquer_ip(ip, nom_pc):
    rule_name = f"Blocage IP {nom_pc}"
    cmd = [
        'powershell',
        '-Command',
        f'New-NetFirewallRule -DisplayName "{rule_name}" -Direction Inbound -RemoteAddress {ip} -Action Block -Profile Any -Enabled True'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Règle de blocage ajoutée pour {ip}.")
    else:
        print(f"Erreur lors de l'ajout de la règle : {result.stderr}")

if __name__ == "__main__":
    ips = lister_ips()
    choix = input("Numéro de l'IP à bloquer (ou rien pour quitter) : ")
    if choix.isdigit() and 1 <= int(choix) <= len(ips):
        idx = int(choix) - 1
        ip = ips[idx]['ip']
        nom_pc = ips[idx]['nom_pc']
        bloquer_ip(ip, nom_pc)
    else:
        print("Aucune action effectuée.") 