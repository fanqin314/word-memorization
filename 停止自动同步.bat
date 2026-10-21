@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo 正在停止单词卡自动同步...
set "SYNC_PID="
if exist "%~dp0.sync.pid" set /p SYNC_PID=<"%~dp0.sync.pid"

rem 1) 按 .sync.pid 结束监听进程
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = $env:SYNC_PID; if($p -and $p.Trim() -match '^\d+$'){ Stop-Process -Id ([int]$p.Trim()) -Force -ErrorAction SilentlyContinue }"

rem 2) 兜底：按命令行匹配「自动同步单词.ps1」结束残留进程（排除自己）
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'powershell.exe' -and $_.ProcessId -ne $PID -and $_.CommandLine -like '*自动同步单词.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

rem 3) 删除启动文件夹里的快捷方式
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Join-Path ([Environment]::GetFolderPath('Startup')) '单词自动同步.lnk'; if(Test-Path -LiteralPath $p){ Remove-Item -LiteralPath $p -Force -ErrorAction SilentlyContinue }"

del /f /q "%~dp0.sync.pid" >nul 2>nul

echo.
echo 已停止自动同步（已结束监听进程并删除开机启动项）。
echo.
pause
