@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\auto-push-update.ps1" %*
