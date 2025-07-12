Outil Carnet d'IPs - Guide d'utilisation
========================================

1. Prérequis
------------
- Python 3.8 ou plus récent installé (https://www.python.org/downloads/)
- Fichier carnet_ips.csv dans le même dossier que l'outil

2. Lancer l'outil graphique
---------------------------
- Ouvre une console (PowerShell ou CMD)
- Place-toi dans le dossier :
  cd "chemin/vers/carnet d IPs"
- Lance :
  python outil_carnet_ips_gui.py

3. Fonctionnalités de l'outil
-----------------------------
- Liste toutes les IPs du carnet
- Vérifie la disponibilité (ping) de chaque IP
- Permet de bloquer une IP sélectionnée dans le firewall Windows
- Génère un rapport d'état du réseau (fichier texte)

4. Générer un exécutable Windows (.exe)
---------------------------------------
- Installe PyInstaller si besoin :
  pip install pyinstaller
- Place-toi dans le dossier de l'outil
- Lance :
  pyinstaller --onefile --windowed outil_carnet_ips_gui.py
- Le .exe sera dans le dossier dist/
- Copie carnet_ips.csv à côté du .exe pour l'utiliser

5. Format du fichier carnet_ips.csv
----------------------------------
Exemple :
ip,nom_pc,lieu,operateur
192.168.1.10,PC-Bureau,Paris,Orange
192.168.1.11,PC-Salon,Lyon,SFR
192.168.1.12,Serveur,Marseille,Bouygues

6. Conseils
-----------
- Lance l'outil ou le .exe en administrateur pour que le blocage d'IP fonctionne.
- Tu peux éditer carnet_ips.csv avec Excel ou un éditeur de texte.
- Le rapport généré s'enregistre dans le même dossier.

7. Besoin d'aide ?
------------------
- Si tu rencontres une erreur, copie le message ici ou demande de l'aide.
- Pour ajouter des fonctionnalités, contacte ton assistant IA ! 