@echo off
echo Starting Creative Studio Servers...
echo.

echo Starting Main Server on port 8000...
start "Main Server" cmd /c "cd /d %~dp0 && python server.py"

timeout /t 2 /nobreak > nul

echo.
echo Servers started!
echo - Main Creative Studio: http://localhost:8000
echo - Certificate Generator runs client-side under the main server.
echo.
echo Click the "Certificate Generator" button on the main page to open the tool.
pause