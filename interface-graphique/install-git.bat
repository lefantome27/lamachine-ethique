@echo off
echo ========================================
echo    INSTALLATION DE GIT POUR WINDOWS
echo ========================================
echo.

echo [1/4] Telechargement de Git...
powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe' -OutFile 'git-installer.exe'}"

echo [2/4] Installation de Git...
git-installer.exe /VERYSILENT /NORESTART

echo [3/4] Attente de l'installation...
timeout /t 10 /nobreak >nul

echo [4/4] Verification de l'installation...
git --version

echo.
echo ========================================
echo    GIT INSTALLE AVEC SUCCES !
echo ========================================
echo.
echo Tu peux maintenant utiliser les commandes git.
echo Redemarre PowerShell pour que les changements prennent effet.
echo.
pause 