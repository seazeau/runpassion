@echo off
title RunPassion - Publication Tout-en-Un
cd /d "%~dp0"
echo ========================================================
echo   RunPassion.fr - Compilation, Optimisation ^& Push
echo ========================================================
echo.
set /p COMMIT_MSG="Message de publication (Entree = Mise a jour site) : "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Mise a jour RunPassion
echo.
python publish_site.py --push -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo.
    echo [ERREUR] La publication a echoue.
    pause
    exit /b 1
)
echo.
echo Termine ! Le site sera en ligne sur runpassion.fr d'ici 1-2 minutes.
pause
