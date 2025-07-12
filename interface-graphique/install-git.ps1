# Script PowerShell pour installer Git
Write-Host "========================================" -ForegroundColor Green
Write-Host "    INSTALLATION DE GIT POUR WINDOWS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "[1/4] Telechargement de Git..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe" -OutFile "git-installer.exe"

Write-Host "[2/4] Installation de Git..." -ForegroundColor Yellow
Start-Process -FilePath "git-installer.exe" -ArgumentList "/VERYSILENT", "/NORESTART" -Wait

Write-Host "[3/4] Attente de l'installation..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "[4/4] Verification de l'installation..." -ForegroundColor Yellow
try {
    git --version
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "    GIT INSTALLE AVEC SUCCES !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tu peux maintenant utiliser les commandes git." -ForegroundColor Cyan
    Write-Host "Redemarre PowerShell pour que les changements prennent effet." -ForegroundColor Cyan
} catch {
    Write-Host "Git n'est pas encore disponible. Redemarre PowerShell et reessaie." -ForegroundColor Red
}

Write-Host ""
Read-Host "Appuie sur Entree pour continuer" 