@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "SCRIPT=%~dp0自动同步单词.ps1"

echo 正在创建开机启动快捷方式（启动文件夹 → 单词自动同步.lnk）...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $p = Join-Path ([Environment]::GetFolderPath('Startup')) '单词自动同步.lnk'; $s = $ws.CreateShortcut($p); $s.TargetPath = 'powershell.exe'; $s.Arguments = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File ' + [char]34 + $env:SCRIPT + [char]34; $s.WorkingDirectory = Split-Path -Parent $env:SCRIPT; $s.Description = '单词卡自动同步（常驻监听）'; $s.Save()"
if errorlevel 1 (
  echo.
  echo 创建启动快捷方式失败，请确认当前用户对「启动」文件夹有写入权限。
  echo 不影响本次监听，但下次开机不会自动启动。
) else (
  echo.
  echo 已创建开机启动项：单词自动同步.lnk
)

echo 正在后台启动监听进程...
start "" powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%SCRIPT%"

echo.
echo 已开启：把 deepseek 单词卡下载到「下载」文件夹或本目录，保存后约 2 秒内自动同步并推送到 GitHub。
echo 关闭方式：双击本目录下的「停止自动同步.bat」。
echo.
pause
