# La Machine Éthique - Installation sur Parrot OS

## Description
Guide pour installer et utiliser La Machine Éthique (interface et outils) sur Parrot OS.

## Dépendances nécessaires
- Navigateur web (Firefox, Chromium, etc.)
- Node.js et npm (pour Electron)
- Electron (`npm install`)
- Python 3 (pour port-scanner.py)
- nmap (optionnel, pour scan avancé)
- python-nmap (optionnel, pour scan avancé)

## Installation et utilisation

### 1. Mettre à jour le système
```
sudo apt update
sudo apt upgrade
```

### 2. Vérifier/éditer les sources de dépôts Parrot (optionnel)
```
sudo nano /etc/apt/sources.list
```

### 3. Installer Node.js (méthode NodeSource, recommandée)
```
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### Si erreur GPG NodeSource :
```
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo tee /etc/apt/keyrings/nodesource.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt update
sudo apt install -y nodejs
```

### 4. Installer npm (si besoin)
```
sudo apt install npm
```

### 5. Installer nmap et python-nmap (pour le scanner de ports avancé)
```
sudo apt install nmap
pip3 install python-nmap
```

### 6. Lancer l'interface Electron (après installation des dépendances)
```
npm install
npm start
```

### 7. Lancer le scanner de ports Python
```
python3 port-scanner.py <ip_cible>
```

### 8. Nettoyer un dépôt non signé (ex: "lami")
- Ouvre `/etc/apt/sources.list` ou `/etc/apt/sources.list.d/*.list` et commente/supprime la ligne du dépôt non signé.

---

**Pour toute erreur, copie le message exact ici ou consulte la documentation Parrot officielle.** 