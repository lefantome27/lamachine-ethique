@echo off
title La Machine Ethique - Lancement Complet
color 0B

echo.
echo ========================================
echo    LA MACHINE ETHIQUE - LANCEMENT COMPLET
echo ========================================
echo.

echo [INFO] Demarrage de La Machine Ethique en mode complet...
echo [INFO] Ceci lancera l'application avec toutes les fonctionnalites
echo.

REM Vérifier si l'exécutable existe
if not exist "La-Machine-Ethique.exe" (
    echo [ERREUR] Executable La-Machine-Ethique.exe introuvable
    echo [INFO] Verifiez que vous etes dans le bon repertoire
    echo [INFO] Chemin actuel: %CD%
    pause
    exit /b 1
)

echo [SUCCES] Executable trouve: La-Machine-Ethique.exe
echo [INFO] Lancement en mode complet (non-simule)...

REM Lancer l'exécutable
start "" "La-Machine-Ethique.exe"

echo [SUCCES] La Machine Ethique lancee en mode complet
echo.
echo ========================================
echo    FONCTIONNALITES DISPONIBLES:
echo ========================================
echo.
echo [✓] DETECTION DE MALWARE REEL
echo    - Scan de fichiers systeme
echo    - Analyse comportementale
echo    - Quarantaine automatique
echo.
echo [✓] SURVEILLANCE RESEAU
echo    - Monitoring trafic en temps reel
echo    - Detection d'intrusions
echo    - Blocage automatique
echo.
echo [✓] ANALYSE FORENSIQUE
echo    - Analyse memoire
echo    - Scan de registre
echo    - Detection de rootkits
echo.
echo [✓] IA ETHIQUE
echo    - Validation comportementale
echo    - Audit automatique
echo    - Protection des donnees
echo.
echo ========================================
echo.
echo [INFO] L'application est maintenant en mode complet
echo [INFO] Plus de simulation - toutes les fonctionnalites sont actives
echo.
timeout /t 3 >nul 