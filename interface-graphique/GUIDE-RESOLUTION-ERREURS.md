# 🔧 Guide de Résolution des Erreurs - La Machine Éthique

## ❌ Erreur : "SyntaxError: Unexpected identifier"

### Symptômes
```
SyntaxError: Unexpected identifier 'Urgence'
```

### Cause
Les apostrophes françaises (`'`) dans le code JavaScript causent des erreurs de syntaxe.

### Solution Rapide

#### Option 1 : Script Automatique (Recommandé)
```bash
node fix-apostrophes.js
```

#### Option 2 : Correction Manuelle
1. Ouvrez le fichier `main-malware-detection.js`
2. Remplacez toutes les apostrophes françaises (`'`) par des apostrophes droites (`'`)
3. Sauvegardez le fichier

#### Option 3 : Remplacer le Fichier
```bash
# Copier le fichier corrigé depuis le dossier parent
cp ../main-malware-detection.js .
```

---

## ❌ Erreur : "electron n'est pas reconnu"

### Symptômes
```
'electron' n'est pas reconnu en tant que commande interne
```

### Solution
```bash
npm install
npm start
```

---

## ❌ Erreur : "Node.js n'est pas installé"

### Solution
1. Téléchargez Node.js depuis https://nodejs.org/
2. Installez la version LTS
3. Redémarrez l'ordinateur
4. Relancez l'application

---

## ❌ Erreur : "Cannot find module"

### Solution
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## ❌ Erreur : "Permission denied"

### Solution Windows
1. Clic droit sur `LAUNCH.bat`
2. "Exécuter en tant qu'administrateur"

### Solution Linux/Mac
```bash
chmod +x LAUNCH.bat
```

---

## ✅ Vérification du Fonctionnement

### Test Rapide
1. Ouvrez une invite de commande dans le dossier `dist-malware-detection`
2. Exécutez : `node -e "console.log('Node.js fonctionne')"`
3. Exécutez : `npm start`

### Vérification des Fichiers
```bash
# Vérifier que tous les fichiers sont présents
ls -la
# Doit afficher :
# - main-malware-detection.js
# - malware-detection-interface.html
# - assets/icon.ico
# - package.json
# - LAUNCH.bat
# - INSTALL.bat
```

---

## 🚀 Relancement de l'Application

### Méthode 1 : Script de Lancement
```bash
./LAUNCH.bat
```

### Méthode 2 : Commande Directe
```bash
npm start
```

### Méthode 3 : Installation + Lancement
```bash
./INSTALL.bat
./LAUNCH.bat
```

---

## 📞 Support Avancé

### Logs de Débogage
```bash
# Activer les logs détaillés
set DEBUG=electron-builder
npm start
```

### Réinstallation Complète
```bash
# Supprimer et recréer
rm -rf dist-malware-detection
node build-simple-exe.js
cd dist-malware-detection
npm install
npm start
```

---

## 🎯 Prévention des Erreurs

### Bonnes Pratiques
1. **Toujours utiliser des apostrophes droites** (`'`) dans le code JavaScript
2. **Vérifier Node.js** avant de lancer l'application
3. **Installer les dépendances** avec `npm install`
4. **Utiliser les scripts fournis** (`LAUNCH.bat`, `INSTALL.bat`)

### Script de Vérification Automatique
```bash
# Créer un script de vérification
echo "Vérification de l'environnement..."
node --version
npm --version
echo "Vérification des fichiers..."
ls -la
echo "Installation des dépendances..."
npm install
echo "Lancement de l'application..."
npm start
```

---

## 🏆 Statut de Résolution

| Erreur | Statut | Solution |
|--------|--------|----------|
| SyntaxError apostrophes | ✅ Résolu | Script `fix-apostrophes.js` |
| Electron non reconnu | ✅ Résolu | `npm install` |
| Node.js manquant | ✅ Résolu | Installation Node.js |
| Permissions | ✅ Résolu | Exécution admin |
| Modules manquants | ✅ Résolu | Réinstallation |

---

*"Every problem has a solution. You just have to find it." - Harold Finch* 