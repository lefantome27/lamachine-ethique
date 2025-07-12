@echo off
echo ========================================
echo    LANCEMENT DE L'INSTALLATION
echo ========================================
echo.

echo Ouverture de l'Invite de commandes...
echo.

cmd /k "cd /d \"C:\Users\lefantome27\Desktop\tout est dedans\mes projets depuis 2023\La Machine\interface-graphique\" && echo Installation de Git... && powershell -Command \"& {Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe' -OutFile 'git-installer.exe'}\" && echo Installation en cours... && git-installer.exe /VERYSILENT /NORESTART && echo Git installe ! Redemarre l'invite de commandes pour continuer." 