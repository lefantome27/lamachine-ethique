@echo off
title Creation Raccourci - La Machine Ethique
color 0B

echo.
echo ========================================
echo    CREATION RACCOURCI - LA MACHINE ETHIQUE
echo ========================================
echo.

echo [INFO] Creation d'un raccourci sur le bureau...
echo.

REM Chemin de l'exécutable
set "EXECUTABLE_PATH=%~dp0La-Machine-Ethique.exe"
set "DESKTOP_PATH=%USERPROFILE%\Desktop"
set "SHORTCUT_NAME=La Machine Ethique.lnk"

REM Vérifier si l'exécutable existe
if not exist "%EXECUTABLE_PATH%" (
    echo [ERREUR] Executable introuvable: %EXECUTABLE_PATH%
    pause
    exit /b 1
)

echo [INFO] Chemin de l'executable: %EXECUTABLE_PATH%
echo [INFO] Chemin du bureau: %DESKTOP_PATH%
echo [INFO] Nom du raccourci: %SHORTCUT_NAME%
echo.

REM Créer le raccourci avec PowerShell
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP_PATH%\%SHORTCUT_NAME%'); $Shortcut.TargetPath = '%EXECUTABLE_PATH%'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'La Machine Ethique - Systeme de Securite Avance'; $Shortcut.IconLocation = '%EXECUTABLE_PATH%,0'; $Shortcut.Save()}"

if %errorlevel% equ 0 (
    echo [SUCCES] Raccourci cree avec succes sur le bureau
    echo [INFO] Vous pouvez maintenant lancer La Machine depuis le bureau
) else (
    echo [ERREUR] Echec de la creation du raccourci
)

echo.
echo ========================================
echo    INSTRUCTIONS D'UTILISATION:
echo ========================================
echo.
echo [1] Double-cliquez sur le raccourci "La Machine Ethique" sur le bureau
echo [2] L'application se lancera en mode complet (non-simule)
echo [3] Toutes les fonctionnalites seront disponibles
echo [4] Plus de message "monitoring simulé (web)"
echo.
echo [INFO] Le raccourci pointe vers: %EXECUTABLE_PATH%
echo.
pause 