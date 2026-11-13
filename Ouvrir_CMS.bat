@echo off
title RunPassion CMS
cd /d "%~dp0"
python cms.py
if errorlevel 1 pause
