@echo off
title La Machine Ethique - Demarrage Rapide
color 0B

echo.
echo ========================================
echo    LA MACHINE ETHIQUE - DEMARRAGE RAPIDE
echo ========================================
echo.

echo [INFO] Demarrage de La Machine Ethique...
echo.

REM Vérifier si le fichier existe
if not exist "La-Machine-Ethique.html" (
    echo [ERREUR] Fichier La-Machine-Ethique.html introuvable
    echo [INFO] Verifiez que vous etes dans le bon repertoire
    echo [INFO] Chemin actuel: %CD%
    pause
    exit /b 1
)

echo [SUCCES] La Machine Ethique trouvee
echo [INFO] Lancement du navigateur...

REM Lancer le navigateur
start "" "La-Machine-Ethique.html"

echo [SUCCES] La Machine Ethique lancee avec succes
echo.
echo ========================================
echo    SYSTEMES DISPONIBLES:
echo ========================================
echo.
echo [1] DETECTION DE MALWARE
echo    - Ransomware, Spyware, Adware
echo    - Cheval de Troie, Ver, Rootkit
echo    - Enregistreur de frappe, Bot
echo.
echo [2] SURVEILLANCE AVANCEE
echo    - Reconnaissance faciale
echo    - Analyse comportementale
echo    - Monitoring reseaux sociaux
echo.
echo [3] COMMUNICATION SECURISEE
echo    - Canaux chiffres
echo    - Protocoles d'urgence
echo    - Coordination d'interventions
echo.
echo [4] IA ETHIQUE
echo    - Analyse predictive
echo    - Validation comportementale
echo    - Audits ethiques automatiques
echo.
echo ========================================
echo.
echo [INFO] L'interface est maintenant ouverte dans votre navigateur
echo [INFO] Vous pouvez fermer cette fenetre
echo.
timeout /t 5 >nul 