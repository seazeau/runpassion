@echo off
title RunPassion - Publication Rapide de Tests
cd /d "%~dp0"
echo ========================================================
echo   RunPassion.fr - Outil de Publication Rapide de Tests
echo ========================================================
echo Lancement de l'interface graphique...
python publish_test.py
if errorlevel 1 (
    echo.
    echo Une erreur est survenue lors de l'execution du script.
    pause
)
