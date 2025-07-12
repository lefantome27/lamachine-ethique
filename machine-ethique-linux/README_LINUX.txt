# Machine Ethique - Détection de Malware (Linux/Kali)

## Description
Interface de détection de malware et outils principaux, utilisables sur Kali Linux (ou toute distribution Linux).

## Contenu du dossier
- `malware-detection-interface.html` : Interface graphique (ouvrir dans un navigateur)
- `main-malware-detection.js` : Script principal Electron (optionnel)
- `port-scanner.py` : Scanner de ports en Python
- `package.json` : Dépendances Node.js (optionnel, pour usage Electron)
- `assets/` : Icônes et images nécessaires

## Installation et utilisation

### 1. Interface Web (recommandé)
- Ouvre simplement `malware-detection-interface.html` dans Firefox ou Chromium.

### 2. Version Electron (optionnel)
Permet d'utiliser l'interface comme une application bureau.

#### a) Installer Node.js et npm
```
sudo apt update
sudo apt install nodejs npm
```

#### b) Installer Electron
```
cd /chemin/vers/machine-ethique-linux
npm install
```

#### c) Lancer l'application
```
npm start
```

### 3. Scanner de ports Python
- Dépendance optionnelle : `nmap` (pour un scan avancé)
- Pour installer nmap et le module Python :
```
sudo apt install nmap
pip3 install python-nmap
```
- Pour lancer le scan :
```
python3 port-scanner.py <ip_cible>
```

## Dépendances nécessaires
- Navigateur web (Firefox, Chromium, etc.)
- Node.js et npm (pour Electron)
- Electron (`npm install`)
- Python 3 (pour port-scanner.py)
- nmap (optionnel, pour scan avancé)
- python-nmap (optionnel, pour scan avancé)

## Remarques
- Aucun fichier `.exe` ou `.bat` n'est nécessaire sous Linux.
- Pour toute question, consulte le README.md d'origine ou la documentation fournie. 

---

## Récapitulatif des commandes utiles (installation et dépannage)

### Mettre à jour les dépôts et paquets
```
sudo apt update
sudo apt upgrade
```

### Vérifier/éditer les sources de dépôts Kali
```
sudo nano /etc/apt/sources.list
```
Ajouter ou vérifier la ligne suivante (décommente si besoin) :
```
deb http://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware
```

### Installer Node.js (méthode NodeSource, recommandée)
```
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Ajouter la clé GPG NodeSource manuellement (si erreur GPG)
```
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo tee /etc/apt/keyrings/nodesource.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt update
sudo apt install -y nodejs
```

### Installer npm (si besoin)
```
sudo apt install npm
```

### Installer nmap et python-nmap (pour le scanner de ports avancé)
```
sudo apt install nmap
pip3 install python-nmap
```

### Lancer le scanner de ports Python
```
python3 port-scanner.py <ip_cible>
```

### Lancer l'interface Electron (après installation des dépendances)
```
npm install
npm start
```

### Nettoyer un dépôt non signé (ex: "lami")
- Ouvre `/etc/apt/sources.list` ou `/etc/apt/sources.list.d/*.list` et commente/supprime la ligne du dépôt non signé.

---

**Pour toute erreur, copie le message exact ici ou consulte la documentation Kali officielle.** 