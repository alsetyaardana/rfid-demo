@echo off
cd /d "%~dp0.."
node.exe .\node_modules\next\dist\bin\next start -H 0.0.0.0 -p 3000 >> C:\tmp\rfid-local-server.log 2>&1
