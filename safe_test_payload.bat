@echo off
echo [*] Sandbox Test Payload Executing...

:: 1. Safe Network Activity (DNS and HTTP)
ping google.com -n 2 > nul
ping 8.8.8.8 -n 2 > nul

:: 2. Safe File System Modification
echo "Simulated payload drop" > %TEMP%\dropped_payload.txt

:: 3. Process Tree Generation
powershell.exe -ExecutionPolicy Bypass -Command "Write-Host 'Powershell child process running...'; Start-Sleep -Seconds 2"

echo [*] Test Complete.
exit
