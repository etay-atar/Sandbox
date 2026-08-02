@echo off
REM Attempting actions that are moderately risky but not definitively malicious on their own
ping 8.8.8.8 -n 1 > nul
reg add HKCU\Software\TestApp /v "Test" /t REG_SZ /d "1" /f > nul
echo "suspicious" > C:\Users\Public\test.txt
REM NOTE: Batch files usually score too low to reach "Suspicious" (>32).
REM To truly get a Suspicious verdict, use an unsigned Windows Executable (.exe) 
REM that does similar actions.