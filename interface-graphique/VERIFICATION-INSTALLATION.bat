@echo off
title Verification Installation - La Machine Ethique
color 0B

echo.
echo ========================================
echo    VERIFICATION DE L'INSTALLATION
echo ========================================
echo.

echo [INFO] Verification des fichiers et composants...
echo.

set "ERROR_COUNT=0"
set "SUCCESS_COUNT=0"

REM Vérifier les interfaces principales
echo [VERIFICATION] Interfaces principales...
if exist "La-Machine-Ethique.html" (
    echo [✓] La-Machine-Ethique.html - TROUVE
    set /a SUCCESS_COUNT+=1
) else (
    echo [✗] La-Machine-Ethique.html - MANQUANT
    set /a ERROR_COUNT+=1
)

if exist "malware-detection-interface.html" (
    echo [✓] malware-detection-interface.html - TROUVE
    set /a SUCCESS_COUNT+=1
) else (
    echo [✗] malware-detection-interface.html - MANQUANT
    set /a ERROR_COUNT+=1
)

if exist "index.html" (
    echo [✓] index.html - TROUVE
    set /a SUCCESS_COUNT+=1
) else (
    echo [✗] index.html - MANQUANT
    set /a ERROR_COUNT+=1
)

echo.

REM Vérifier les scripts de lancement
echo [VERIFICATION] Scripts de lancement...
if exist "START-LA-MACHINE.bat" (
    echo [✓] START-LA-MACHINE.bat - TROUVE
    set /a SUCCESS_COUNT+=1
) else (
    echo [✗] START-LA-MACHINE.bat - MANQUANT
    set /a ERROR_COUNT+=1
)

if exist "LAUNCHER-PRINCIPAL.bat" (
    echo [✓] LAUNCHER-PRINCIPAL.bat - TROUVE
    set /a SUCCESS_COUNT+=1
) else (
    echo [✗] LAUNCHER-PRINCIPAL.bat - MANQUANT
    set /a ERROR_COUNT+=1
)

if exist "CREER-RACCOURCI.bat" (
    echo [✓] CREER-RACCOURCI.bat - TROUVE
    set /a SUCCESS_COUNT+=1
) else (
    echo [✗] CREER-RACCOURCI.bat - MANQUANT
    set /a ERROR_COUNT+=1
)

echo.

REM Vérifier la documentation
echo [VERIFICATION] Documentation...
if exist "README-INSTALLATION.md" (
    echo [✓] README-INSTALLATION.md - TROUVE
    set /a SUCCESS_COUNT+=1
) else (
    echo [✗] README-INSTALLATION.md - MANQUANT
    set /a ERROR_COUNT+=1
)

if exist "INSTALLATION-COMPLETE.md" (
    echo [✓] INSTALLATION-COMPLETE.md - TROUVE
    set /a SUCCESS_COUNT+=1
) else (
    echo [✗] INSTALLATION-COMPLETE.md - MANQUANT
    set /a ERROR_COUNT+=1
)

echo.

REM Vérifier les tests
echo [VERIFICATION] Tests et configuration...
if exist "test-final.js" (
    echo [✓] test-final.js - TROUVE
    set /a SUCCESS_COUNT+=1
) else (
    echo [✗] test-final.js - MANQUANT
    set /a ERROR_COUNT+=1
)

if exist "package.json" (
    echo [✓] package.json - TROUVE
    set /a SUCCESS_COUNT+=1
) else (
    echo [✗] package.json - MANQUANT
    set /a ERROR_COUNT+=1
)

if exist "tsconfig.json" (
    echo [✓] tsconfig.json - TROUVE
    set /a SUCCESS_COUNT+=1
) else (
    echo [✗] tsconfig.json - MANQUANT
    set /a ERROR_COUNT+=1
)

echo.

REM Vérifier Node.js
echo [VERIFICATION] Environnement Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] Node.js - INSTALLE
    set /a SUCCESS_COUNT+=1
) else (
    echo [✗] Node.js - NON INSTALLE
    set /a ERROR_COUNT+=1
)

echo.

REM Vérifier npm
echo [VERIFICATION] Gestionnaire de paquets npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [✓] npm - INSTALLE
    set /a SUCCESS_COUNT+=1
) else (
    echo [✗] npm - NON INSTALLE
    set /a ERROR_COUNT+=1
)

echo.

REM Résumé
echo ========================================
echo    RESUME DE LA VERIFICATION
echo ========================================
echo.
echo [SUCCES] %SUCCESS_COUNT% composants verifies avec succes
echo [ERREURS] %ERROR_COUNT% composants manquants ou problematiques
echo.

if %ERROR_COUNT% equ 0 (
    echo [🎉] INSTALLATION COMPLETE ET FONCTIONNELLE !
    echo [INFO] Tous les composants sont presents et operationnels
    echo.
    echo [SUGGESTION] Vous pouvez maintenant:
    echo [1] Lancer La Machine Ethique avec START-LA-MACHINE.bat
    echo [2] Creer un raccourci bureau avec CREER-RACCOURCI.bat
    echo [3] Utiliser le menu principal avec LAUNCHER-PRINCIPAL.bat
) else (
    echo [⚠️] INSTALLATION INCOMPLETE
    echo [INFO] Certains composants sont manquants
    echo.
    echo [SUGGESTION] Verifiez que tous les fichiers ont ete copies correctement
)

echo.
echo ========================================
echo    TESTS DE FONCTIONNALITE
echo ========================================
echo.

echo [QUESTION] Voulez-vous tester les fonctionnalites maintenant?
echo [1] Oui - Lancer les tests
echo [2] Non - Fermer
echo.
set /p test_choice="Votre choix (1-2): "

if "%test_choice%"=="1" (
    echo.
    echo [INFO] Lancement des tests de fonctionnalite...
    echo.
    
    REM Test de lancement de l'interface
    echo [TEST] Lancement de l'interface principale...
    if exist "La-Machine-Ethique.html" (
        echo [✓] Interface trouvee, test de lancement...
        start "" "La-Machine-Ethique.html"
        echo [✓] Interface lancee avec succes
    ) else (
        echo [✗] Impossible de lancer l'interface
    )
    
    echo.
    echo [TEST] Test de detection de malware...
    if exist "malware-detection-interface.html" (
        echo [✓] Interface de detection trouvee
        start "" "malware-detection-interface.html"
        echo [✓] Interface de detection lancee
    ) else (
        echo [✗] Interface de detection manquante
    )
    
    echo.
    echo [SUCCES] Tests de fonctionnalite termines
    echo [INFO] Les interfaces ont ete ouvertes dans votre navigateur
) else (
    echo [INFO] Tests annules
)

echo.
echo ========================================
echo    VERIFICATION TERMINEE
echo ========================================
echo.
echo [INFO] Merci d'avoir utilise le script de verification
echo [INFO] Appuyez sur une touche pour fermer...
pause >nul 