import csv
import os
from datetime import datetime

CARNET_PATH = 'carnet_ips.csv'

print(f"Rapport d'état du réseau - {datetime.now()}\n")

with open(CARNET_PATH, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        ip = row['ip']
        nom = row['nom_pc']
        lieu = row['lieu']
        operateur = row['operateur']
        response = os.system(f"ping -n 1 -w 1000 {ip} >nul")
        status = "EN LIGNE" if response == 0 else "HORS LIGNE"
        print(f"{ip} ({nom}, {lieu}, {operateur}) : {status}") 