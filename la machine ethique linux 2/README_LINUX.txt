# La Machine Éthique - Système de Protection (Linux/Kali)

## Description
Interface principale du Système de Protection Inspiré de Person of Interest, adaptée pour Linux/Kali.

## Contenu du dossier
- `La-Machine-Ethique.html` : Interface graphique principale (ouvrir dans un navigateur)
- `electron-app.js` : Script principal Electron (optionnel)
- `assets/` : Icônes et images nécessaires
- `package.json` : Dépendances Node.js (optionnel, pour usage Electron)

## Installation et utilisation

### 1. Interface Web (recommandé)
- Ouvre simplement `La-Machine-Ethique.html` dans Firefox ou Chromium.

### 2. Version Electron (optionnel)
Permet d'utiliser l'interface comme une application bureau.

#### a) Installer Node.js et npm
```
sudo apt update
sudo apt install nodejs npm
```

#### b) Installer Electron
```
cd /chemin/vers/la machine ethique linux 2
npm install
```

#### c) Lancer l'application
```
npm start
```

## Dépendances nécessaires
- Navigateur web (Firefox, Chromium, etc.)
- Node.js et npm (pour Electron)
- Electron (`npm install`)

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

### Lancer l'interface Electron (après installation des dépendances)
```
npm install
npm start
```

### Nettoyer un dépôt non signé (ex: "lami")
- Ouvre `/etc/apt/sources.list` ou `/etc/apt/sources.list.d/*.list` et commente/supprime la ligne du dépôt non signé.

---

**Pour toute erreur, copie le message exact ici ou consulte la documentation Kali officielle.** 