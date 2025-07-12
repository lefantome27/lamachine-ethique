# 🔧 GUIDE DE RÉSOLUTION - Mode Web Simulé

## 🚨 **Problème Identifié**

**Symptôme** : L'application affiche "monitoring simulé (web)" et toutes les fonctionnalités sont simulées.

**Cause** : L'application fonctionne en mode navigateur web au lieu du mode Electron natif.

## ✅ **Solutions**

### **Solution 1 : Utiliser l'Exécutable Complet (Recommandé)**

```bash
# Lancer directement l'exécutable
.\La-Machine-Ethique.exe
```

**Avantages** :
- ✅ Toutes les fonctionnalités réelles
- ✅ Accès système complet
- ✅ Pas de simulation
- ✅ Interface native

### **Solution 2 : Utiliser le Lanceur Complet**

```bash
# Utiliser le nouveau lanceur
.\LANCER-VRAIE-MACHINE.bat
```

### **Solution 3 : Raccourci Bureau**

```bash
# Créer un raccourci sur le bureau
.\CREER-RACCOURCI-MACHINE.bat
```

Puis double-cliquer sur "La Machine Ethique" sur le bureau.

## ❌ **À ÉVITER**

### **Ne PAS utiliser ces lanceurs (mode web simulé) :**
- ❌ `START-LA-MACHINE.bat` → Ouvre `La-Machine-Ethique.html` dans le navigateur
- ❌ `launch-malware-detection.bat` → Ouvre `malware-detection-interface.html` dans le navigateur
- ❌ Ouvrir directement les fichiers `.html` dans le navigateur

### **Pourquoi ces lanceurs ne fonctionnent pas :**
- Ils ouvrent des fichiers HTML dans le navigateur web
- Le navigateur n'a pas accès aux privilèges système
- Toutes les fonctionnalités sont simulées
- Message "monitoring simulé (web)" affiché

## 🔍 **Différence Mode Web vs Mode Complet**

| Fonctionnalité | Mode Web (Simulé) | Mode Complet (Réel) |
|----------------|-------------------|---------------------|
| Scan de fichiers | ❌ Simulation | ✅ Vrai scan |
| Surveillance réseau | ❌ Simulation | ✅ Vrai monitoring |
| Blocage IP | ❌ Simulation | ✅ Vrai blocage |
| Analyse mémoire | ❌ Simulation | ✅ Vraie analyse |
| Quarantaine | ❌ Simulation | ✅ Vraie quarantaine |
| Accès système | ❌ Impossible | ✅ Accès complet |

## 🎯 **Instructions Rapides**

### **Pour lancer La Machine en mode complet :**

1. **Méthode 1 (Directe)** :
   ```
   Double-cliquer sur La-Machine-Ethique.exe
   ```

2. **Méthode 2 (Lanceur)** :
   ```
   .\LANCER-VRAIE-MACHINE.bat
   ```

3. **Méthode 3 (Raccourci)** :
   ```
   Double-cliquer sur le raccourci du bureau
   ```

## 🔧 **Vérification du Mode**

### **Mode Web (À éviter) :**
- Bandeau bleu en haut : "Mode démo web : toutes les fonctionnalités sont simulées"
- Message : "monitoring simulé (web)"
- Fonctionnalités limitées

### **Mode Complet (Correct) :**
- Pas de bandeau de simulation
- Interface native Electron
- Toutes les fonctionnalités disponibles
- Accès système réel

## 📁 **Fichiers Importants**

### **Exécutable Principal :**
- `La-Machine-Ethique.exe` (33MB) - Application complète

### **Lanceurs Corrects :**
- `LANCER-VRAIE-MACHINE.bat` - Lanceur complet
- `CREER-RACCOURCI-MACHINE.bat` - Création raccourci

### **Lanceurs à Éviter :**
- `START-LA-MACHINE.bat` - Mode web
- `launch-malware-detection.bat` - Mode web
- Tous les fichiers `.html` - Mode web

## 🚀 **Résolution Rapide**

Si vous voyez "monitoring simulé (web)" :

1. **Fermez** l'application web
2. **Utilisez** `.\LANCER-VRAIE-MACHINE.bat`
3. **Ou** double-cliquez sur `La-Machine-Ethique.exe`
4. **Ou** utilisez le raccourci du bureau

---

**💡 Conseil** : Utilisez toujours l'exécutable `.exe` ou les lanceurs `.bat` qui pointent vers l'exécutable, jamais les fichiers HTML directement. 