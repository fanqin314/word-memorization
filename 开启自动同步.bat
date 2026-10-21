@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在注册「单词卡自动同步」计划任务（每 5 分钟运行一次）...
schtasks /Create /TN "WordCardsAutoSync" /SC MINUTE /MO 5 /TR "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File \"%~dp0自动同步单词.ps1\"" /F
if errorlevel 1 (
  echo.
  echo 注册失败。请右键本文件选择「以管理员身份运行」后重试。
) else (
  echo.
  echo 已开启。以后把 deepseek 单词卡丢进「下载」文件夹或本目录，几分钟内会自动上线。
  echo 关闭方式：任务计划程序 → 找到 WordCardsAutoSync → 禁用或删除。
)
echo.
pause
