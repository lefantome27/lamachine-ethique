# Contre Attaque Pro - Anti-DDoS

## Présentation
Ce projet est une solution avancée de surveillance et de défense contre les attaques DDoS. Il propose une interface graphique, des analyses statistiques et machine learning, une gestion automatisée du pare-feu, et un système d'alertes/notifications.

## Structure des fichiers principaux
- `main.py` : Application principale (interface graphique, logique centrale)
- `config.py` : Configuration globale (seuils, alertes, sécurité, etc.)
- `firewall.py` : Gestion du pare-feu logiciel (blocage/déblocage IP)
- `ddos_monitor.py` : Surveillance du trafic et détection d'attaques
- `analisys.py` : Analyse avancée du trafic (statistiques, ML)

## Prérequis et installation des dépendances

### Version recommandée de Python
- **Python 3.9 ou supérieur** (idéalement 3.10+)

### Modules à installer via pip
```bash
pip install scapy==2.5.0 numpy==1.24.3 scikit-learn==1.3.0 matplotlib==3.7.2 pandas==2.0.3 seaborn==0.12.2
```

### Modules standards Python (inclus dans Python)
- tkinter
- threading
- json
- datetime
- socket
- struct
- time
- random
- collections
- statistics
- warnings
- logging
- configparser
- argparse
- subprocess
- os
- sys
- pathlib
- typing
- dataclasses
- enum

### Conseils
- Si `tkinter` n'est pas disponible, installez-le via votre gestionnaire de paquets (ex : `sudo apt install python3-tk` sous Linux).
- Pour Windows, toutes les librairies standards sont incluses avec l'installateur officiel Python.

## Lancement
Pour lancer l'application principale :
```bash
python main.py
```

---

Pour toute question ou problème d'installation, ouvrez une issue ou contactez le développeur. 