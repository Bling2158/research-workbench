@echo off
cd /d "%~dp0"
node --env-file-if-exists=.env --env-file-if-exists=.env.deploy server.mjs --open
pause
