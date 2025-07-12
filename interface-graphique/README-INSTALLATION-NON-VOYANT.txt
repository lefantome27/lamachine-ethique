Guide d'installation vocal pour non-voyant – La Machine Éthique (Windows)

1. Prérequis à installer

A. Python 3.10 ou plus récent
- Télécharger Python sur : https://www.python.org/downloads/
- Pendant l’installation, cocher la case “Add Python to PATH”.

B. Node.js (version 18 ou plus)
- Télécharger Node.js sur : https://nodejs.org/
- Prendre la version “LTS”.

C. Git (optionnel mais recommandé)
- Télécharger Git sur : https://git-scm.com/

2. Installation des dépendances (pour chaque application)

A. Ouvrir l’invite de commandes Windows
- Appuyer sur la touche Windows.
- Taper “cmd”.
- Appuyer sur Entrée.

B. Aller dans le dossier du projet
- Taper la commande suivante (remplace “VotreNom” par ton nom d’utilisateur Windows) :

cd "C:\Users\VotreNom\Desktop\tout est dedans\mes projets depuis 2023\La Machine\interface-graphique"

Appuie sur Entrée.

C. Installer les dépendances Node.js

Tape :

npm install

Appuie sur Entrée.
Attends la fin de l’installation.

D. Installer les dépendances Python (pour la version malware ou scripts Python)

Tape :

cd ..\backend\python\python

Appuie sur Entrée.

Puis tape :

pip install -r requirements.txt

Appuie sur Entrée.
Attends la fin de l’installation.

3. Lancer l’application

A. Pour l’interface graphique (Electron)

Dans le dossier interface-graphique, tape :

npm start

Appuie sur Entrée.

B. Pour la version malware (Python)

Dans le dossier backend\python\python, tape :

python main.py

Appuie sur Entrée.

4. Conseils pour non-voyant

- Chaque commande doit être tapée exactement comme indiqué.
- Attendre la fin de chaque installation avant de passer à l’étape suivante.
- Si un message d’erreur apparaît, lire le message à voix haute ou demander de l’aide.
- Pour relancer l’application plus tard, refaire uniquement l’étape “Lancer l’application”.

5. Dépannage

- Si la commande pip ne fonctionne pas, essayer :
  python -m pip install -r requirements.txt
- Si la commande npm ne fonctionne pas, vérifier que Node.js est bien installé.

6. Résumé des commandes à taper

Pour l’interface graphique :
cd "C:\Users\VotreNom\Desktop\tout est dedans\mes projets depuis 2023\La Machine\interface-graphique"
npm install
npm start

Pour la version malware (Python) :
cd "C:\Users\VotreNom\Desktop\tout est dedans\mes projets depuis 2023\La Machine\backend\python\python"
pip install -r requirements.txt
python main.py

Ce guide est prêt à être lu par une synthèse vocale ou un lecteur d’écran.
Si tu veux un script qui lit chaque étape à la voix automatiquement, demande-le ! 