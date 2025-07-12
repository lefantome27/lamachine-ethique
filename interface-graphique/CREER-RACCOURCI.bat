@echo off
title Creation de Raccourci - La Machine Ethique
color 0B

echo.
echo ========================================
echo    CREATION DE RACCOURCI WINDOWS
echo ========================================
echo.

echo [INFO] Creation d'un raccourci sur le bureau...
echo.

REM Chemin du bureau
set "DESKTOP=%USERPROFILE%\Desktop"

REM Chemin de La Machine Ethique
set "MACHINE_PATH=%CD%"
set "MACHINE_HTML=%MACHINE_PATH%\La-Machine-Ethique.html"

REM Vérifier si le fichier existe
if not exist "%MACHINE_HTML%" (
    echo [ERREUR] Fichier La-Machine-Ethique.html introuvable
    echo [INFO] Chemin recherche: %MACHINE_HTML%
    pause
    exit /b 1
)

echo [SUCCES] Fichier trouve: %MACHINE_HTML%

REM Créer le raccourci VBS
echo [INFO] Creation du script de raccourci...

set "VBS_SCRIPT=%TEMP%\create_shortcut.vbs"

(
echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
echo sLinkFile = "%DESKTOP%\La Machine Ethique.lnk"
echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
echo oLink.TargetPath = "%MACHINE_HTML%"
echo oLink.WorkingDirectory = "%MACHINE_PATH%"
echo oLink.Description = "La Machine Ethique - Systeme de Securite Avance"
echo oLink.IconLocation = "%SystemRoot%\System32\shell32.dll,23"
echo oLink.Save
echo WScript.Echo "Raccourci cree avec succes!"
) > "%VBS_SCRIPT%"

REM Exécuter le script VBS
echo [INFO] Execution du script de creation...
cscript //nologo "%VBS_SCRIPT%"

REM Nettoyer le fichier temporaire
del "%VBS_SCRIPT%" >nul 2>&1

echo.
echo ========================================
echo    RACCOURCI CREE AVEC SUCCES
echo ========================================
echo.
echo [SUCCES] Raccourci "La Machine Ethique" cree sur le bureau
echo [INFO] Emplacement: %DESKTOP%\La Machine Ethique.lnk
echo.
echo [INFO] Vous pouvez maintenant:
echo [1] Double-cliquer sur le raccourci du bureau
echo [2] Utiliser le raccourci pour lancer rapidement La Machine
echo [3] Epingler le raccourci a la barre des taches
echo.
echo ========================================
echo    OPTIONS DE LANCEMENT DISPONIBLES:
echo ========================================
echo.
echo [1] Raccourci Bureau: "La Machine Ethique.lnk"
echo [2] Demarrage Rapide: START-LA-MACHINE.bat
echo [3] Menu Principal: LAUNCHER-PRINCIPAL.bat
echo [4] Lancement Direct: La-Machine-Ethique.html
echo.
echo [INFO] Appuyez sur une touche pour continuer...
pause >nul

REM Proposer de lancer La Machine maintenant
echo.
echo [QUESTION] Voulez-vous lancer La Machine Ethique maintenant?
echo [1] Oui - Lancer maintenant
echo [2] Non - Fermer
echo.
set /p launch_choice="Votre choix (1-2): "

if "%launch_choice%"=="1" (
    echo [INFO] Lancement de La Machine Ethique...
    start "" "%MACHINE_HTML%"
    echo [SUCCES] La Machine Ethique lancee!
) else (
    echo [INFO] Fermeture...
)

echo.
echo [INFO] Merci d'avoir utilise le script de creation de raccourci
timeout /t 3 >nul 