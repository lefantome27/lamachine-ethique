@echo off
echo ========================================
echo  INSTALLATION DE GITHUB DESKTOP
echo ========================================
echo.

echo [1/3] Telechargement de GitHub Desktop...
powershell -Command "& {Invoke-WebRequest -Uri 'https://desktop.github.com/releases/3.2.7.0/GitHubDesktopSetup.exe' -OutFile 'github-desktop-installer.exe'}"

echo [2/3] Installation de GitHub Desktop...
github-desktop-installer.exe /VERYSILENT /NORESTART

echo [3/3] Attente de l'installation...
timeout /t 15 /nobreak >nul

echo.
echo ========================================
echo  GITHUB DESKTOP INSTALLE !
echo ========================================
echo.
echo GitHub Desktop va se lancer automatiquement.
echo Connecte-toi avec ton compte GitHub (lefantome27)
echo Puis on pourra publier ton projet facilement !
echo.
pause 