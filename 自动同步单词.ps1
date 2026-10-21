# -*- coding: utf-8 -*-
<#
  自动同步单词.ps1
  ------------------------------------------------------------------
  由「开启自动同步.bat」注册成 Windows 计划任务，每 5 分钟静默跑一次：
    1. 把「下载」文件夹里新出现的 deepseek_html_*.html 搬进本目录
    2. 比对卡片指纹，没有变化就直接退出（不生成、不提交）
    3. 有变化才重新生成 words-data.js 并推送到 GitHub
  关闭方式：在「任务计划程序」里禁用/删除 WordCardsAutoSync
#>
$ErrorActionPreference = 'SilentlyContinue'
$dir = $PSScriptRoot
if(-not $dir){ $dir = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$log = Join-Path $dir '.sync.log'
$stateFile = Join-Path $dir '.sync-state'

function Log($m){
  Add-Content -LiteralPath $log -Value ('[' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '] ' + $m) -Encoding UTF8
}

# 1) 从「下载」文件夹自动搬入新卡片
$dl = Join-Path $env:USERPROFILE 'Downloads'
if(Test-Path -LiteralPath $dl){
  Get-ChildItem -LiteralPath $dl -Filter 'deepseek_html_*.html' -File | ForEach-Object {
    $dst = Join-Path $dir $_.Name
    if(-not (Test-Path -LiteralPath $dst)){
      try{ Move-Item -LiteralPath $_.FullName -Destination $dst -Force; Log ('搬入: ' + $_.Name) }
      catch { Log ('搬入失败: ' + $_.Name) }
    }
  }
}

# 2) 卡片指纹：文件名 + 大小 + 修改时间
function Get-Sig(){
  $cards = Get-ChildItem -LiteralPath $dir -Filter '*.html' -File |
    Where-Object { $_.Name -ne 'index.html' } | Sort-Object Name
  return ($cards | ForEach-Object { $_.Name + '|' + $_.Length + '|' + $_.LastWriteTimeUtc.Ticks }) -join ';'
}

$sig = Get-Sig
if(-not $sig){ exit 0 }
$old = ''
if(Test-Path -LiteralPath $stateFile){ $old = (Get-Content -LiteralPath $stateFile -Raw) }
if($old -ne $null){ $old = $old.Trim() }
if($old -eq $sig){ exit 0 }

Log '检测到卡片变化，开始生成并推送'
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $dir '更新单词数据.ps1') -NoSync *>> $log
if($LASTEXITCODE -ne 0){ Log '生成失败，下次重试'; exit 1 }

# 3) 有差异才提交推送（生成器每次都会刷新时间戳，所以先看有没有真实文件变化）
git -C $dir add -A 2>$null | Out-Null
git -C $dir diff --cached --quiet 2>$null
if($LASTEXITCODE -ne 0){
  git -C $dir commit -m 'update: sync word cards' --no-verify *>> $log
  git -C $dir -c http.version=HTTP/1.1 push origin main *>> $log
  if($LASTEXITCODE -ne 0){ Log '推送失败（网络/凭据），下次自动重试'; exit 1 }
  Log '已推送'
}

# 成功后用「改名之后」的文件指纹作为基准，避免反复触发
Set-Content -LiteralPath $stateFile -Value (Get-Sig) -Encoding UTF8
exit 0
