# -*- coding: utf-8 -*-
<#
  更新单词数据.ps1
  ------------------------------------------------------------------
  作用：扫描本目录下所有 *.html 单词卡（下载得到的 deepseek_html_*
        会自动改名成 <单词>.html），自动解析出
        · 单词元数据：单词 / 释义 / 音标 / 词性 / 词根 / 词根拆解 / 意象描述
        · 意象卡 SVG
        · 意象卡动画 CSS（取自卡片 <style>，作用域限定到 .di-art[data-art="单词"]）
        汇总生成同目录下的 words-data.js，供 index.html 自动加载。
  用法：双击「更新单词数据.bat」即可；每次放进新卡片后跑一次。
#>
param([switch]$NoSync)
$ErrorActionPreference = 'Stop'
$dir = $PSScriptRoot
if(-not $dir){ $dir = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$outFile = Join-Path $dir 'words-data.js'

# 与常驻监听进程串行：手动双击时若监听正在生成，则等待；监听调用本脚本时
# 会设置 WORDCARDS_LOCK_HELD=1（它已持有同一把锁），此处跳过避免自锁。
# 互斥体随进程退出自动释放，无需显式 ReleaseMutex。
if($env:WORDCARDS_LOCK_HELD -ne '1'){
  try{
    $genLock = New-Object System.Threading.Mutex($false, 'WordCardsGen')
    $gotLock = $false
    try{ $gotLock = $genLock.WaitOne(60000) }
    catch [System.Threading.AbandonedMutexException] { $gotLock = $true }
    if(-not $gotLock){
      Write-Host '另一个同步任务正在运行，请稍后再试。' -ForegroundColor Yellow
      exit 0
    }
  } catch { }
}

# ---------- 小工具 ----------
function Strip-Tags([string]$s){
  if([string]::IsNullOrEmpty($s)){ return '' }
  $t = [regex]::Replace($s, '<[^>]+>', '')
  $t = $t -replace '&nbsp;',' ' -replace '&amp;','&' -replace '&lt;','<' -replace '&gt;','>'
  $t = $t -replace '&quot;','"' -replace '&#39;',"'" -replace '&hellip;','…' -replace '&mdash;','—'
  $t = [regex]::Replace($t, '\s+', ' ')
  return $t.Trim()
}
# 取 class="xxx" 元素的内层原文（按元素自身的闭合标签配对，避免被内部 span 截断）
function Get-Block([string]$html, [string]$cls){
  $m = [regex]::Match($html, '<([a-zA-Z]+)([^>]*\bclass="' + [regex]::Escape($cls) + '"[^>]*)>')
  if(-not $m.Success){ return $null }
  $tag = $m.Groups[1].Value
  $start = $m.Index + $m.Length
  $em = [regex]::Match($html.Substring($start), '</' + $tag + '>')
  if(-not $em.Success){ return $null }
  return $html.Substring($start, $em.Index)
}
# 把卡片 <style> 解析成规则表 + keyframes 表（支持展平 @media）
function Parse-Css([string]$css){
  $rules = New-Object System.Collections.ArrayList
  $kf = @{}
  $n = $css.Length
  $i = 0
  while($i -lt $n){
    $open = $css.IndexOf('{', $i)
    if($open -lt 0){ break }
    $sel = $css.Substring($i, $open - $i).Trim()
    $depth = 1; $j = $open + 1
    while($j -lt $n -and $depth -gt 0){
      $c = $css[$j]
      if($c -eq '{'){ $depth++ } elseif($c -eq '}'){ $depth-- }
      $j++
    }
    $body = $css.Substring($open + 1, ($j - 1) - ($open + 1))
    if($sel.StartsWith('@keyframes')){
      $name = ($sel -replace '@keyframes\s+','').Trim()
      $kf[$name] = $body
    } elseif($sel.StartsWith('@media') -or $sel.StartsWith('@supports')){
      $inner = Parse-Css $body
      foreach($r in $inner.rules){ [void]$rules.Add($r) }
      foreach($k in $inner.kf.Keys){ $kf[$k] = $inner.kf[$k] }
    } elseif($sel.StartsWith('@')){
      # 其它 at-rule（@font-face 等）忽略
    } else {
      [void]$rules.Add(@{ sel = $sel; body = $body })
    }
    $i = $j
  }
  return @{ rules = $rules; kf = $kf }
}
# 从 root-line 文本推断词根键（与 index.html 的 ROOTS 对应）
function Get-Roots([string]$text){
  $keys = New-Object System.Collections.ArrayList
  if($text -match 'contr[ao]'){ [void]$keys.Add('contra') }
  if($text -match 'vers|vert'){ [void]$keys.Add('vers') }
  if($text -match '(^|[^a-z])ann'){ [void]$keys.Add('ann') }
  if($text -match '(^|[^a-z])cor'){ [void]$keys.Add('cor') }
  if($text -match 'unus|uni\b|un-'){ [void]$keys.Add('un') }
  # 按 index.html 的 ROOT_ORDER 归位
  $order = @('vers','un','ann','contra','cor')
  $ordered = New-Object System.Collections.ArrayList
  foreach($k in $order){ if($keys -contains $k){ [void]$ordered.Add($k) } }
  if($ordered.Count -eq 0){ [void]$ordered.Add('other') }
  return $ordered
}

# ---------- 解析单张卡片 ----------
function Parse-Card([string]$path){
  $html = Get-Content -Raw -Encoding UTF8 $path
  $fileName = Split-Path -Leaf $path

  # 单词：优先 <title>xxx · 释义</title>
  $word = ''
  $mt = [regex]::Match($html, '<title>\s*([^<·]+?)\s*·')
  if($mt.Success){ $word = $mt.Groups[1].Value.Trim() }
  if(-not $word){
    $ma = [regex]::Match($html, 'class="word-anim"[^>]*aria-label="([^"]+)"')
    if($ma.Success){ $word = $ma.Groups[1].Value.Trim() }
  }
  if(-not $word){ return $null }

  # 释义：spell-hint 里 &nbsp; 之后的部分
  $gloss = ''
  $sh = Get-Block $html 'spell-hint'
  if($sh){ $parts = $sh -split '&nbsp;'; $gloss = Strip-Tags $parts[-1] }
  if(-not $gloss){
    $mg = [regex]::Match($html, '<title>\s*[^<·]+?·\s*([^<]+)</title>')
    if($mg.Success){ $gloss = $mg.Groups[1].Value.Trim() }
  }

  # 音标：ipa-anim 里第一个 /.../
  $ipa = ''
  $ia = Get-Block $html 'ipa-anim'
  if($ia){
    $it = Strip-Tags $ia
    $mi = [regex]::Match($it, '/[^/]+/')
    if($mi.Success){ $ipa = $mi.Value }
  }

  # 词性：pos-anim
  $pos = ''
  $pa = Get-Block $html 'pos-anim'
  if($pa){ $pos = Strip-Tags $pa }

  # 词根拆解：root-line 文本
  $morph = ''
  $rl = Get-Block $html 'root-line'
  if($rl){ $morph = Strip-Tags $rl }
  $roots = Get-Roots $morph

  # 意象描述：ic-main
  $scene = ''
  $im = Get-Block $html 'ic-main'
  if($im){ $scene = Strip-Tags $im }

  # 意象卡 SVG：ic-svg 容器里的第一个 <svg>...</svg>
  $svg = ''
  $ms = [regex]::Match($html, 'class="ic-svg"[^>]*>\s*(<svg[\s\S]*?</svg>)')
  if($ms.Success){ $svg = $ms.Groups[1].Value }

  # 卡片 <style>（去注释）：供「意象卡动画 CSS」与「学习中方框视觉」共用
  $styleText = ''
  foreach($sm in [regex]::Matches($html, '<style[^>]*>([\s\S]*?)</style>')){ $styleText += $sm.Groups[1].Value + "`n" }
  $styleText = [regex]::Replace($styleText, '/\*[\s\S]*?\*/', '')
  $parsed = Parse-Css $styleText
  # 卡片 :root 变量表
  $vars = @{}
  $mr = [regex]::Match($styleText, ':root\s*\{([^}]*)\}')
  if($mr.Success){
    foreach($vm in [regex]::Matches($mr.Groups[1].Value, '(--[\w-]+)\s*:\s*([^;]+);')){ $vars[$vm.Groups[1].Value] = $vm.Groups[2].Value.Trim() }
  }
  function Resolve_Vars([string]$val, $map){
    $out = [regex]::Replace($val, 'var\(\s*(--[\w-]+)\s*,\s*([^)]+)\)', { param($mm) if($map.ContainsKey($mm.Groups[1].Value)){ $map[$mm.Groups[1].Value] } else { $mm.Groups[2].Value } })
    $out = [regex]::Replace($out, 'var\(\s*(--[\w-]+)\s*\)', { param($mm) if($map.ContainsKey($mm.Groups[1].Value)){ $map[$mm.Groups[1].Value] } else { '' } })
    return $out
  }
  function Get_Decl([string]$body, [string]$prop){
    $m = [regex]::Match($body, '(?:^|;)\s*' + [regex]::Escape($prop) + '\s*:\s*([^;]+)')
    if($m.Success){ return $m.Groups[1].Value.Trim() }
    return ''
  }
  # 学习中方框视觉：还原该卡 .hero 渐变底 + .hero-band 条纹带
  # （同名单词在响应式 @media 里可能有多个 .hero 规则，这里只取第一个带 background 的）
  $heroBody = ''; $bandBody = ''
  foreach($rule in $parsed.rules){
    $s = $rule.sel.Trim()
    if($s -eq '.hero' -and -not $heroBody -and $rule.body -match '(?:^|;)\s*background\s*:'){ $heroBody = $rule.body }
    elseif($s -eq '.hero-band' -and -not $bandBody -and $rule.body -match '(?:^|;)\s*background\s*:'){ $bandBody = $rule.body }
  }
  $heroBg = (Resolve_Vars (Get_Decl $heroBody 'background') $vars) -replace '\s+', ' '
  $bandBg = (Resolve_Vars (Get_Decl $bandBody 'background') $vars) -replace '\s+', ' '
  $mstInk = $vars['--ink'];   if($null -eq $mstInk){ $mstInk = '' }
  $mstPaper = $vars['--paper']; if($null -eq $mstPaper){ $mstPaper = '' }
  $mstAccent = ''
  foreach($vm in [regex]::Matches($mr.Groups[1].Value, '(--[\w-]+)\s*:\s*([^;]+);')){
    $nm = $vm.Groups[1].Value
    if($nm -match 'paper|soft|ink|shadow|radius|void|hl'){ continue }
    $vl = $vm.Groups[2].Value.Trim()
    if($vl -match '#|rgb'){ $mstAccent = $vl; break }
  }
  if(-not $mstAccent){ $mstAccent = $mstInk }
  # 暗色 hero 兜底：整体过暗则改用纸色，保证卡面深色文字可读
  $hexes = [regex]::Matches($heroBg, '#[0-9A-Fa-f]{3,8}')
  if($hexes.Count -gt 0){
    $sum = 0.0; $cnt = 0
    foreach($hx in $hexes){
      $h = $hx.Value.TrimStart('#')
      if($h.Length -eq 3){ $h = '' + $h[0] + $h[0] + $h[1] + $h[1] + $h[2] + $h[2] }
      if($h.Length -ge 6){
        $r = [Convert]::ToInt32($h.Substring(0,2),16) / 255.0
        $g = [Convert]::ToInt32($h.Substring(2,2),16) / 255.0
        $b = [Convert]::ToInt32($h.Substring(4,2),16) / 255.0
        $sum += 0.2126 * $r + 0.7152 * $g + 0.0722 * $b; $cnt++
      }
    }
    if($cnt -gt 0 -and ($sum / $cnt) -lt 0.42 -and $mstPaper){ $heroBg = $mstPaper }
  }
  $mstCss = ''
  if($mstInk -or $heroBg -or $bandBg){
    $mstCss = '.card.m1[data-word="' + $word + '"]{'
    if($mstInk){    $mstCss += '--mst-ink:' + $mstInk + ';' }
    if($mstAccent){ $mstCss += '--mst-accent:' + $mstAccent + ';' }
    if($mstPaper){  $mstCss += '--mst-paper:' + $mstPaper + ';' }
    if($heroBg){    $mstCss += '--mst-hero:' + $heroBg + ';' }
    if($bandBg){    $mstCss += '--mst-band:' + $bandBg + ';' }
    $mstCss += '}'
  }

  # 意象卡动画 CSS：从 <style> 中筛出引用 svg 内 class 的规则 + 相关 keyframes
  $artCss = ''
  if($svg -and $svg.Contains('class="')){
    # svg 里用到的 class 名
    $svgClasses = New-Object System.Collections.ArrayList
    foreach($cm in [regex]::Matches($svg, 'class="([^"]+)"')){
      foreach($tok in ($cm.Groups[1].Value -split '\s+')){ if($tok){ [void]$svgClasses.Add($tok) } }
    }
    $svgClasses = $svgClasses | Select-Object -Unique
    if($svgClasses.Count -gt 0){
      # :root 变量块 -> 收敛到作用域
      $rootBody = ''
      $mr = [regex]::Match($styleText, ':root\s*\{([^}]*)\}')
      if($mr.Success){ $rootBody = $mr.Groups[1].Value.Trim() }

      $scope = '.di-art[data-art="' + $word + '"]'
      $kept = New-Object System.Collections.ArrayList
      foreach($rule in $parsed.rules){
        $hit = $false
        foreach($cls in $svgClasses){
          if($rule.sel -match ('\.' + [regex]::Escape($cls) + '(?![\w-])')){ $hit = $true; break }
        }
        if($hit){ [void]$kept.Add($rule) }
      }

      # 需要保留的 keyframes：被保留规则引用到的
      $keptBodies = ($kept | ForEach-Object { $_.body }) -join "`n"
      $usedKf = New-Object System.Collections.ArrayList
      foreach($name in $parsed.kf.Keys){
        if($keptBodies -match ('(?<![\w-])' + [regex]::Escape($name) + '(?![\w-])')){ [void]$usedKf.Add($name) }
      }

      # keyframes 改名，避免多张卡之间同名冲突
      $renameMap = @{}
      foreach($name in $usedKf){ $renameMap[$name] = ($word + '__' + $name) }
      $sb = New-Object System.Text.StringBuilder
      if($rootBody){ [void]$sb.AppendLine($scope + '{' + $rootBody + '}') }
      foreach($rule in $kept){
        $body = $rule.body
        foreach($name in $renameMap.Keys){
          $body = $body -replace ('(?<![\w-])' + [regex]::Escape($name) + '(?![\w-])'), $renameMap[$name]
        }
        $selParts = ($rule.sel -split ',') | ForEach-Object { ($scope + ' ' + $_.Trim()) }
        [void]$sb.AppendLine(($selParts -join ', ') + '{' + $body + '}')
      }
      foreach($name in $usedKf){
        $body = $parsed.kf[$name]
        [void]$sb.AppendLine('@keyframes ' + $renameMap[$name] + '{' + $body + '}')
      }
      $artCss = $sb.ToString().Trim()
    }
  }

  return [ordered]@{
    word  = $word
    gloss = $gloss
    ipa   = $ipa
    pos   = $pos
    file  = $fileName
    roots = @($roots)
    morph = $morph
    scene = $scene
    svg   = $svg
    css   = $artCss
    mst   = $mstCss
  }
}

# ---------- 主流程 ----------
$cardsDir = Join-Path $dir 'cards'
$files = @()
$files += @(Get-ChildItem -LiteralPath $cardsDir -Filter '*.html' -File -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Name -notmatch '^_' })
# 根目录里尚未归位的卡片（下载得到的新卡）也一并纳入
$files += @(Get-ChildItem -LiteralPath $dir -Filter '*.html' -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'index.html' -and $_.Name -notmatch '^_' })
$words = New-Object System.Collections.ArrayList
$art = [ordered]@{}
$artCss = [ordered]@{}
$mst = [ordered]@{}
$seen = @{}

foreach($f in $files){
  try { $c = Parse-Card $f.FullName } catch { Write-Host ("解析失败: " + $f.Name + " -> " + $_.Exception.Message) -ForegroundColor Yellow; $c = $null }
  if($null -eq $c){ Write-Host ("跳过（未取到单词）: " + $f.Name) -ForegroundColor Yellow; continue }
  if($seen.ContainsKey($c.word)){ Write-Host ("重复单词，跳过: " + $f.Name) -ForegroundColor Yellow; continue }
  $seen[$c.word] = $true
  # 归位：按单词首字母放进 cards\<字母>\，让仓库结构可读
  $first = if($c.word.Length -gt 0){ $c.word.Substring(0,1).ToLower() } else { 'other' }
  if($first -notmatch '[a-z]'){ $first = 'other' }
  $targetDir = Join-Path $cardsDir $first
  if(-not (Test-Path -LiteralPath $targetDir)){ New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
  $dst = Join-Path $targetDir ($c.word + '.html')
  if($f.FullName -ne $dst){
    if(Test-Path -LiteralPath $dst){
      Write-Host ("目标已存在，保留原文件: " + $f.Name) -ForegroundColor Yellow
    } else {
      try {
        $raw = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
        $raw = $raw.Replace('href="card-base.css"', 'href="../card-base.css"').Replace('src="card-base.js"', 'src="../card-base.js"')
        [System.IO.File]::WriteAllText($f.FullName, $raw, (New-Object System.Text.UTF8Encoding($false)))
        Move-Item -LiteralPath $f.FullName -Destination $dst -Force
        Write-Host ("已归位: " + $f.Name + " -> cards/" + $first + "/" + $c.word + ".html") -ForegroundColor Cyan
      } catch {
        Write-Host ("归位失败: " + $f.Name + " -> " + $_.Exception.Message) -ForegroundColor Yellow
      }
    }
  }
  $c['file'] = "cards/" + $first + "/" + $c.word + ".html"
  $svg = $c.svg; $css = $c.css; $m = $c.mst
  $c.Remove('svg') | Out-Null
  $c.Remove('css') | Out-Null
  $c.Remove('mst') | Out-Null
  [void]$words.Add($c)
  if($svg){ $art[$c.word] = $svg }
  if($css){ $artCss[$c.word] = $css }
  if($m){ $mst[$c.word] = $m }
  Write-Host ("已解析: " + $c.word + "  (" + $c.file + ")  词根=" + ($c.roots -join ',') + "  意象卡=" + $(if($svg){'有'}else{'无'}) + "  CSS=" + $(if($css){'有'}else{'无'}) + "  泛光=" + $(if($m){'有'}else{'无'}))
}

$payload = [ordered]@{
  generated = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  words = @($words)
  art = $art
  artCss = $artCss
  mst = $mst
}
$json = $payload | ConvertTo-Json -Depth 20
$js = "/* 本文件由「更新单词数据.ps1 / .bat」自动生成，请勿手工编辑。 */`nwindow.WORDS_DATA = " + $json + ";`n"

# 归一化：把 generated 时间戳替换成空值，用于比较「除时间戳外」的内容
function Get-Normalized-Js([string]$text){
  $m = [regex]::Match($text, '"generated"\s*:\s*"[^"]*"')
  if($m.Success){ return $text.Remove($m.Index, $m.Length).Insert($m.Index, '"generated":""') }
  return $text
}
# 新内容与旧文件除 generated 时间戳外完全相同，则跳过写入（不刷新时间戳，
# 避免监听进程重复触发时产生无意义的提交）；否则照旧写 UTF-8（无 BOM）
$shouldWrite = $true
if(Test-Path -LiteralPath $outFile){
  try{
    $oldJs = [System.IO.File]::ReadAllText($outFile, [System.Text.Encoding]::UTF8)
    $oldCmp = Get-Normalized-Js $oldJs
    $newCmp = Get-Normalized-Js $js
    if([string]::Equals($oldCmp, $newCmp, [System.StringComparison]::Ordinal)){ $shouldWrite = $false }
  } catch {
    $shouldWrite = $true
  }
}
if($shouldWrite){
  [System.IO.File]::WriteAllText($outFile, $js, (New-Object System.Text.UTF8Encoding($false)))
} else {
  Write-Host "数据无变化，跳过写入 words-data.js（保留旧时间戳）" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host ("完成：共 " + $words.Count + " 张卡片 -> " + $outFile) -ForegroundColor Green

# ---------- 同步到 GitHub（让线上站点自动更新） ----------
if(-not $NoSync){
$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
git -C $dir rev-parse --is-inside-work-tree 2>$null | Out-Null
if($LASTEXITCODE -eq 0){
  git -C $dir add -A 2>$null | Out-Null
  git -C $dir diff --cached --quiet 2>$null
  if($LASTEXITCODE -ne 0){
    Write-Host "正在提交并推送到 GitHub ..." -ForegroundColor Cyan
    git -C $dir commit -m "update: sync word cards" --no-verify 2>$null | Out-Null
    git -C $dir push origin main
    if($LASTEXITCODE -eq 0){ Write-Host "已推送，GitHub Pages 稍后会自动更新" -ForegroundColor Green }
    else { Write-Host "推送失败：请检查网络或 Git 凭据" -ForegroundColor Yellow }
  } else {
    Write-Host "数据没有变化，无需推送" -ForegroundColor DarkGray
  }
}
$ErrorActionPreference = $prevEap
}
