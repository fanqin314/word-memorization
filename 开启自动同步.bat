@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "SCRIPT=%~dp0自动同步单词.ps1"

echo 正在注册开机自启（当前用户 Run 项）...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$v = 'powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File ' + [char]34 + $env:SCRIPT + [char]34; New-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'WordCardsAutoSync' -Value $v -PropertyType String -Force | Out-Null"
if errorlevel 1 (
  echo.
  echo 注册开机自启失败，不影响本次监听，但下次开机不会自动启动。
) else (
  echo.
  echo 已注册开机自启：WordCardsAutoSync
)

echo 正在后台启动监听进程...
start "" powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%SCRIPT%"

echo.
echo 已开启：把 deepseek 单词卡下载到「下载」文件夹或本目录，保存后约 2 秒内自动同步并推送到 GitHub。
echo 关闭方式：双击本目录下的「停止自动同步.bat」。
echo.
pause
