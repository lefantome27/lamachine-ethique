# La Machine Éthique – Interface Graphique Electron

## Présentation
Cette interface graphique moderne est basée sur Electron (Node.js) et permet d'utiliser toutes les fonctionnalités de "La Machine" dans un environnement desktop multiplateforme (Windows, Linux, Mac). Elle offre une expérience utilisateur avancée, des visualisations interactives, et peut piloter le backend Python pour l'analyse, la détection de malware, ou la surveillance réseau.

## Structure des fichiers principaux
- `main-malware-detection.js` : Point d'entrée principal Electron (logique de l'application)
- `malware-detection-interface.html` : Interface utilisateur (HTML/CSS/JS)
- `electron-app.js`, `preload.js` : Scripts Electron complémentaires
- `package.json` : Dépendances Node.js et scripts de lancement
- `assets/` : Icônes, images, ressources graphiques
- `dist-malware-detection/` : Dossier de sortie pour les exécutables/portables

## Prérequis
- **Node.js** (version 16 ou supérieure recommandée)
- **npm** (installé avec Node.js)

## Installation des dépendances
Dans ce dossier (`interface-graphique`), exécutez :
```bash
npm install
```
Cela installera Electron et toutes les dépendances nécessaires.

## Lancement de l'interface Electron
Toujours dans ce dossier :
```bash
npm start
```
L'interface graphique Electron va s'ouvrir. Selon la configuration, elle peut lancer ou piloter le backend Python (voir plus bas).

## Construction d'un exécutable portable
Pour générer un exécutable Windows portable :
```bash
npm run build
```
Le fichier `.exe` sera généré dans `dist-malware-detection/`.

## Communication avec le backend Python
- L'interface Electron peut lancer des scripts Python via Node.js (`child_process.spawn` ou `exec`).
- Elle peut aussi communiquer via des fichiers temporaires, des sockets, ou des API HTTP si le backend Python expose un serveur.
- Exemple :
  - L'utilisateur clique sur "Analyser" → Electron lance `python main.py` ou un autre script Python.
  - Les résultats sont récupérés et affichés dans l'interface.

## Conseils
- Pour Windows, privilégiez l'exécutable portable pour une installation simplifiée.
- Pour Linux/Mac, lancez via `npm start` ou adaptez le build.
- Vérifiez que Python est bien installé et accessible dans le PATH si l'interface doit lancer des scripts Python.

---

Pour toute question ou problème d'installation, ouvrez une issue ou contactez le développeur. 