# -*- coding: utf-8 -*-
<#
  自动同步单词.ps1
  ------------------------------------------------------------------
  常驻监听进程（由「开启自动同步.bat」后台启动，并在启动文件夹留快捷方式）：
    1. 同时监听本目录和「下载」文件夹里的 *.html，文件一落盘就触发同步
    2. 去抖（静默 2 秒）+ 文件大小二次校验，确保文件写完再处理
    3. 搬入下载目录里的 deepseek_html_*.html 卡片
    4. 卡片指纹无变化则跳过，有变化才生成 words-data.js 并提交推送
    5. 推送失败按 30/60/120/300 秒退避重试，之后每 60 秒持续重试
  单实例由命名互斥体 WordCardsWatcher 保证；与「更新单词数据.ps1」的并发
  由命名互斥体 WordCardsGen 保证。
  关闭方式：双击「停止自动同步.bat」。
#>
param(
  [switch]$EnsureRunning
)

# 常驻进程不能因为单次异常退出
$ErrorActionPreference = 'Continue'

# ---------- 路径与常量 ----------
$script:dir       = $PSScriptRoot
if(-not $script:dir){ $script:dir = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$script:logFile   = Join-Path $script:dir '.sync.log'
$script:stateFile = Join-Path $script:dir '.sync-state'
$script:pidFile   = Join-Path $script:dir '.sync.pid'
$script:downloads = Join-Path $env:USERPROFILE 'Downloads'
$script:utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# 推送重试的退避秒数（首次失败后依次等待；用尽后每 60 秒重试一次）
$script:pushDelays = @(30, 60, 120, 300)

# ---------- 日志 ----------
# 每行格式：[yyyy-MM-dd HH:mm:ss] 内容；超过 500 行时只保留最后 500 行
function Write-SyncLog([string]$message){
  try{
    $line = '[' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '] ' + $message
    [System.IO.File]::AppendAllText($script:logFile, $line + "`r`n", $script:utf8NoBom)
    try{
      $lines = [System.IO.File]::ReadAllLines($script:logFile, [System.Text.Encoding]::UTF8)
      if($lines.Length -gt 500){
        $keep = New-Object System.Collections.Generic.List[string]
        for($i = $lines.Length - 500; $i -lt $lines.Length; $i++){ $keep.Add($lines[$i]) }
        [System.IO.File]::WriteAllLines($script:logFile, $keep, $script:utf8NoBom)
      }
    } catch { }
  } catch { }
}

# 把命令输出逐行写进日志（空行忽略）
function Write-OutputLines([string]$prefix, $lines){
  foreach($l in @($lines)){
    $t = ([string]$l).Trim()
    if($t){ Write-SyncLog ($prefix + $t) }
  }
}

# ---------- 卡片指纹 ----------
# 本目录所有 *.html（排除 index.html）的文件名 + 大小 + 最后写入时间
function Get-CardSignature {
  $cards = @(Get-ChildItem -LiteralPath $script:dir -Filter '*.html' -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -ne 'index.html' } | Sort-Object Name)
  return (@($cards | ForEach-Object { $_.Name + '|' + $_.Length + '|' + $_.LastWriteTimeUtc.Ticks }) -join ';')
}

# 读取 .sync-state
function Read-StateValue {
  try{
    if(Test-Path -LiteralPath $script:stateFile){
      return ([System.IO.File]::ReadAllText($script:stateFile, [System.Text.Encoding]::UTF8)).Trim()
    }
  } catch { }
  return ''
}

# ---------- 文件稳定性校验 ----------
# 两个目录里所有 *.html 的「文件名|大小」快照
function Get-QuickSnapshot {
  $sb = New-Object System.Text.StringBuilder
  foreach($p in @($script:dir, $script:downloads)){
    if(-not (Test-Path -LiteralPath $p)){ continue }
    $fs = Get-ChildItem -LiteralPath $p -Filter '*.html' -File -ErrorAction SilentlyContinue | Sort-Object Name
    foreach($f in $fs){ [void]$sb.Append($f.Name + '|' + $f.Length + ';') }
  }
  return $sb.ToString()
}

# 连续两次（间隔 400ms）快照一致，才认为文件已经写完
function Test-FilesStable {
  $a = Get-QuickSnapshot
  Start-Sleep -Milliseconds 400
  $b = Get-QuickSnapshot
  return ($a -eq $b)
}

# ---------- 搬入下载目录里的卡片 ----------
function Move-DownloadedCards {
  if(-not (Test-Path -LiteralPath $script:downloads)){ return }
  $cards = @()
  try{
    $cards = @(Get-ChildItem -LiteralPath $script:downloads -Filter 'deepseek_html_*.html' -File -ErrorAction SilentlyContinue)
  } catch {
    Write-SyncLog ('扫描下载目录失败: ' + $_.Exception.Message)
    return
  }
  foreach($f in $cards){
    $dst = Join-Path $script:dir $f.Name
    if(Test-Path -LiteralPath $dst){
      # 同名文件已存在：加 _1 后缀；_1 也存在则跳过并记日志
      $alt = Join-Path $script:dir ([System.IO.Path]::GetFileNameWithoutExtension($f.Name) + '_1.html')
      if(Test-Path -LiteralPath $alt){
        Write-SyncLog ('搬入跳过（同名已存在）: ' + $f.Name)
        continue
      }
      $dst = $alt
    }
    try{
      Move-Item -LiteralPath $f.FullName -Destination $dst -Force -ErrorAction Stop
      Write-SyncLog ('搬入: ' + $f.Name)
    } catch {
      Write-SyncLog ('搬入失败: ' + $f.Name + ' -> ' + $_.Exception.Message)
    }
  }
}

# ---------- git ----------
# 隐藏窗口里没有交互终端：禁止 git 等待输入凭据而卡死（缺凭据时直接失败走重试）
$env:GIT_TERMINAL_PROMPT = '0'

# 执行 git 命令（工作目录固定为本目录），返回退出码与合并后的输出
function Invoke-Git {
  param([string[]]$GitArgs)
  $code = -1
  $out = @()
  try{
    $out = @(& git -C $script:dir @GitArgs 2>&1)
    $code = $LASTEXITCODE
  } catch {
    $out = @($_.Exception.Message)
    $code = -1
  }
  return @{ code = $code; out = $out }
}

# 是否存在尚未推送到 origin/main 的本地提交
function Test-UnpushedCommits {
  $r = Invoke-Git -GitArgs @('rev-list', '--count', 'origin/main..HEAD')
  if($r.code -eq 0){
    $v = ([string]($r.out | Select-Object -First 1)).Trim()
    if($v -match '^\d+$'){ return ([int]$v -gt 0) }
  }
  return $false
}

# 推送（失败时安排退避重试）
function Invoke-Push {
  $r = Invoke-Git -GitArgs @('-c', 'http.version=HTTP/1.1', 'push', 'origin', 'main')
  Write-OutputLines '推送输出: ' $r.out
  if($r.code -eq 0){
    if($script:pendingPush){
      Write-SyncLog '推送成功，已清除 pending 标记'
    } else {
      Write-SyncLog '推送成功'
    }
    $script:pendingPush = $false
    $script:pushRetryIndex = 0
    return $true
  }

  Write-SyncLog ('推送失败（退出码 ' + $r.code + '）')
  if(-not $script:pendingPush){
    # 本次处理里的第一次失败：30 秒后重试
    $script:pendingPush = $true
    $script:pushRetryIndex = 0
    $script:nextPushAt = (Get-Date).AddSeconds($script:pushDelays[0])
    Write-SyncLog ('已标记 pending，' + $script:pushDelays[0] + ' 秒后重试推送')
  } elseif($script:pushRetryIndex -lt ($script:pushDelays.Count - 1)){
    # 退避重试：60/120/300 秒
    $script:pushRetryIndex = $script:pushRetryIndex + 1
    $delay = $script:pushDelays[$script:pushRetryIndex]
    $script:nextPushAt = (Get-Date).AddSeconds($delay)
    Write-SyncLog ('已标记 pending，' + $delay + ' 秒后重试推送')
  } else {
    # 退避次数用尽：每 60 秒继续尝试
    $script:nextPushAt = (Get-Date).AddSeconds(60)
    Write-SyncLog '退避重试已用尽，已标记 pending，之后每 60 秒重试一次'
  }
  return $false
}

# ---------- 核心处理流程（同一时刻只会有一个实例在执行） ----------
function Invoke-Sync {
  # a. 把下载目录里的 deepseek 卡片搬进来
  Move-DownloadedCards

  # b. 指纹比对：没有变化就跳过
  $sigBefore = Get-CardSignature
  if($sigBefore -eq (Read-StateValue)){
    Write-SyncLog '卡片无变化，跳过'
    return
  }

  Write-SyncLog '检测到卡片变化，开始生成 words-data.js'

  # c. 生成（与手动脚本通过 WordCardsGen 互斥）
  $genMutex = $null
  $genGot = $false
  try{
    try{
      $genMutex = New-Object System.Threading.Mutex($false, 'WordCardsGen')
      try{ $genGot = $genMutex.WaitOne(60000) }
      catch [System.Threading.AbandonedMutexException] { $genGot = $true }
    } catch {
      Write-SyncLog ('创建生成器互斥体失败: ' + $_.Exception.Message)
      $genGot = $false
    }
    if(-not $genGot){
      Write-SyncLog '生成器正被占用（等待 60 秒未获得），稍后重试'
      $script:needProcess = $true
      $script:nextProcessAt = (Get-Date).AddSeconds(60)
      return
    }

    $genOut = @(& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $script:dir '更新单词数据.ps1') -NoSync 2>&1)
    $genCode = $LASTEXITCODE
    Write-OutputLines '生成器: ' $genOut
    if($genCode -ne 0){
      Write-SyncLog ('生成失败（退出码 ' + $genCode + '），60 秒后重试')
      $script:needProcess = $true
      $script:nextProcessAt = (Get-Date).AddSeconds(60)
      return
    }
    Write-SyncLog '生成完成'
  } finally {
    if($genGot){
      try{ $genMutex.ReleaseMutex() }
      catch { Write-SyncLog ('释放生成器互斥体失败: ' + $_.Exception.Message) }
    }
    if($genMutex){ try{ $genMutex.Dispose() } catch { } }
  }

  # d. 暂存并提交（没有暂存变化就不提交）
  $r = Invoke-Git -GitArgs @('add', '-A')
  if($r.code -ne 0){
    Write-SyncLog ('git add 失败（退出码 ' + $r.code + '），60 秒后重试')
    Write-OutputLines 'git add 输出: ' $r.out
    $script:needProcess = $true
    $script:nextProcessAt = (Get-Date).AddSeconds(60)
    return
  }

  $r = Invoke-Git -GitArgs @('diff', '--cached', '--quiet')
  if($r.code -eq 0){
    Write-SyncLog '没有需要提交的变化'
  } elseif($r.code -eq 1){
    $r = Invoke-Git -GitArgs @('commit', '-m', 'update: sync word cards', '--no-verify')
    Write-OutputLines '提交输出: ' $r.out
    if($r.code -ne 0){
      Write-SyncLog ('提交失败（退出码 ' + $r.code + '），60 秒后重试')
      $script:needProcess = $true
      $script:nextProcessAt = (Get-Date).AddSeconds(60)
      return
    }
    Write-SyncLog '已提交: update: sync word cards'
  } else {
    Write-SyncLog ('git diff --cached 异常（退出码 ' + $r.code + '），60 秒后重试')
    $script:needProcess = $true
    $script:nextProcessAt = (Get-Date).AddSeconds(60)
    return
  }

  # f. 用「处理完之后」的文件指纹写基准（避免重复触发）
  try{
    [System.IO.File]::WriteAllText($script:stateFile, (Get-CardSignature), $script:utf8NoBom)
    Write-SyncLog '已更新卡片指纹 .sync-state'
  } catch {
    Write-SyncLog ('写入 .sync-state 失败: ' + $_.Exception.Message)
  }

  # e. 推送（失败由主循环按退避策略重试）
  [void](Invoke-Push)
}

# ---------- 监听器 ----------
$script:watchers = New-Object System.Collections.ArrayList
$script:eventIds = New-Object System.Collections.ArrayList

function Start-DirWatcher([string]$path, [string]$tag){
  if(-not (Test-Path -LiteralPath $path)){
    Write-SyncLog ('监听目录不存在，跳过: ' + $path)
    return
  }
  try{
    $w = New-Object System.IO.FileSystemWatcher
    $w.Path = $path
    $w.Filter = '*.html'
    $w.IncludeSubdirectories = $false
    # 监听文件名变化、内容写入、大小变化
    $w.NotifyFilter = [System.IO.NotifyFilters]::FileName -bor [System.IO.NotifyFilters]::LastWrite -bor [System.IO.NotifyFilters]::Size
    # 加大缓冲区，避免短时间大量事件时丢失
    $w.InternalBufferSize = 65536
    # 必须先注册事件再开启监听，否则可能漏掉最开始的事件
    foreach($evName in @('Created', 'Changed', 'Deleted', 'Renamed')){
      $sid = $tag + '_' + $evName
      Register-ObjectEvent -InputObject $w -EventName $evName -SourceIdentifier $sid | Out-Null
      [void]$script:eventIds.Add($sid)
    }
    $w.EnableRaisingEvents = $true
    [void]$script:watchers.Add($w)
    Write-SyncLog ('开始监听: ' + $path)
  } catch {
    Write-SyncLog ('启动监听失败: ' + $path + ' -> ' + $_.Exception.Message)
  }
}

# ---------- 单实例：命名互斥体 ----------
$script:mutex = New-Object System.Threading.Mutex($false, 'WordCardsWatcher')
$script:haveMutex = $false
try{
  $script:haveMutex = $script:mutex.WaitOne(0)
} catch [System.Threading.AbandonedMutexException] {
  # 上一个进程被强杀，互斥体已归我们所有
  $script:haveMutex = $true
}
if(-not $script:haveMutex){
  Write-SyncLog '已有监听实例在运行，本次启动直接退出'
  try{ $script:mutex.Dispose() } catch { }
  exit 0
}

# 写入 PID，供「停止自动同步.bat」使用
try{
  [System.IO.File]::WriteAllText($script:pidFile, [string]$PID, $script:utf8NoBom)
} catch {
  Write-SyncLog ('写入 .sync.pid 失败: ' + $_.Exception.Message)
}

# 运行时状态
$script:dirty = $false             # 是否有待处理的变化
$script:lastEventTime = Get-Date   # 最后一次收到事件的时间（去抖用）
$script:pendingPush = $false       # 是否有推送待重试
$script:pushRetryIndex = 0         # 已用掉的退避档位
$script:nextPushAt = Get-Date      # 下次推送重试时间
$script:needProcess = $false       # 生成失败/被占用后的定时重试标记
$script:nextProcessAt = Get-Date   # 下次处理重试时间

try{
  Write-SyncLog ('监听进程启动 (PID=' + $PID + '，EnsureRunning=' + [bool]$EnsureRunning + ')')

  Start-DirWatcher $script:dir 'CardWatchDir'
  Start-DirWatcher $script:downloads 'CardWatchDl'

  # 启动时先比对一次，补上停机期间发生的变化
  if(Test-UnpushedCommits){
    $script:pendingPush = $true
    $script:nextPushAt = (Get-Date)
    Write-SyncLog '检测到本地有未推送的提交，将自动补推'
  }
  $script:dirty = $true
  $script:lastEventTime = (Get-Date).AddSeconds(-10)

  # ---------- 主循环 ----------
  while($true){
    try{
      # 每 500ms 检查一次；事件由 Register-ObjectEvent 入队，这里统一取出
      Start-Sleep -Milliseconds 500

      $events = @()
      try{ $events = @(Get-Event -ErrorAction SilentlyContinue) } catch { $events = @() }
      if($events.Count -gt 0){
        $sawFileEvent = $false
        foreach($e in $events){
          if($e.SourceIdentifier -like 'CardWatchDir_*' -or $e.SourceIdentifier -like 'CardWatchDl_*'){ $sawFileEvent = $true }
          try{ Remove-Event -EventIdentifier $e.EventIdentifier -ErrorAction SilentlyContinue } catch { }
        }
        if($sawFileEvent){
          if(-not $script:dirty){ Write-SyncLog '检测到文件变化，等待写入稳定' }
          $script:dirty = $true
          $script:lastEventTime = Get-Date
        }
      }

      # 去抖：距最后一个事件满 2 秒，且文件大小两次快照一致，才处理
      if($script:dirty -and ((Get-Date) - $script:lastEventTime).TotalSeconds -ge 2){
        if(Test-FilesStable){
          $script:dirty = $false
          Invoke-Sync
        } else {
          Write-SyncLog '文件仍在写入，继续等待'
          $script:lastEventTime = Get-Date
        }
      }

      # 生成失败/生成器被占用：60 秒后重试
      if(-not $script:dirty -and $script:needProcess -and (Get-Date) -ge $script:nextProcessAt){
        $script:needProcess = $false
        Invoke-Sync
      }

      # 推送 pending：按退避时间重试
      if($script:pendingPush -and (Get-Date) -ge $script:nextPushAt){
        [void](Invoke-Push)
      }
    } catch {
      Write-SyncLog ('主循环异常: ' + $_.Exception.Message)
      Start-Sleep -Seconds 2
    }
  }
} finally {
  # ---------- 退出清理 ----------
  foreach($sid in $script:eventIds){
    try{ Unregister-Event -SourceIdentifier $sid -ErrorAction SilentlyContinue } catch { }
  }
  foreach($w in $script:watchers){
    try{ $w.EnableRaisingEvents = $false } catch { }
    try{ $w.Dispose() } catch { }
  }
  try{ Remove-Item -LiteralPath $script:pidFile -Force -ErrorAction SilentlyContinue } catch { }
  Write-SyncLog '监听进程退出'
  try{ $script:mutex.ReleaseMutex() } catch { }
  try{ $script:mutex.Dispose() } catch { }
}
