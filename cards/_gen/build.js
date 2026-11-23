#!/usr/bin/env node
/* ==========================================================================
   单词卡生成器 build.js —— 一份 JSON 生成一张完整卡片
   --------------------------------------------------------------------------
   用法：
     node cards/_gen/build.js sustain        # 生成 cards/_gen/words/sustain.json
     node cards/_gen/build.js --all          # 生成 words/ 下全部词
     可选参数：--force（覆盖已存在卡片） --dry（只校验不写盘） --sync（顺带刷新 words-data.js）

   生成结果：cards/<首字母>/<单词>.html，遵守卡片硬契约（见 README/项目记忆）。
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { renderScene } = require('./scenes');
const { renderSkin } = require('./skins');

const GEN = __dirname;
const ROOT = path.resolve(GEN, '..', '..');
const WORDS = path.join(GEN, 'words');
const THEMES = path.join(GEN, 'themes');
const startedAt = Date.now();

/* ---------------- 小工具 ---------------- */
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const die = m => { throw new Error(m); };
const must = (o, k) => { if (o[k] == null || o[k] === '') die(`缺少字段 ${k}`); return o[k]; };
const arr = (o, k, min, max) => {
  const a = o[k];
  if (!Array.isArray(a)) die(`字段 ${k} 必须是数组`);
  if (a.length < min || (max && a.length > max)) die(`字段 ${k} 需要 ${min}${max ? '~' + max : '+'} 条，当前 ${a.length}`);
  return a;
};

/* ---------------- 片段渲染 ---------------- */
function letters(word) {
  return [...word]
    .map((ch, i) => `<span class="letter l${i + 1}">${esc(ch)}</span>`)
    .join('');
}

function fillSentence(sentence, answer) {
  const first = esc(String(answer)[0] || '');
  const rest = esc(String(answer).slice(1));
  const blank = `<span class="first-letter">${first}</span><span class="blank" onclick="this.classList.toggle('revealed')">${rest}</span>`;
  const parts = esc(sentence).split('___');
  if (parts.length < 2) die(`填空题缺少 ___ 占位：${sentence}`);
  return parts.join(blank);
}

function renderSVG(scene) {
  return '      ' + renderScene(scene).replace(/\n/g, '\n      ');
}

/* ---------------- 主渲染 ---------------- */
function render(data) {
  const w = must(data, 'word');
  const gloss = must(data, 'gloss');
  let theme, skinCss;
  if (data.skin) {
    theme = 'skin:' + (data.skin.name || 'custom');
    skinCss = renderSkin(data.skin);
  } else {
    theme = data.theme || 'wine';
    const themeFile = path.join(THEMES, theme + '.css');
    if (!fs.existsSync(themeFile)) die(`主题不存在：${theme}（可选 ${fs.readdirSync(THEMES).filter(f => !f.startsWith('_')).map(f => f.replace('.css', '')).join(' / ')}）`);
    skinCss = fs.readFileSync(themeFile, 'utf8').trim();
  }

  const ipaUK = must(data, 'ipaUK');
  const ipaUS = data.ipaUS || ipaUK;
  const pos = must(data, 'pos');
  const root = must(data, 'root');
  const scene = must(data, 'scene');
  const family = arr(data, 'family', 6, 8);
  const collos = arr(data, 'collocations', 5, 5);
  const examples = arr(data, 'examples', 4, 4);
  const pitfalls = arr(data, 'pitfalls', 3, 3);
  const compare = must(data, 'compare');
  const rows = arr(compare, 'rows', 5, 6);
  const fills = arr(data, 'fills', 5, 5);
  const review = arr(data, 'review', 4, 4);

  const css = fs.readFileSync(path.join(THEMES, '_hero.css'), 'utf8').trim()
    + '\n\n'
    + skinCss;

  const famCards = family.map(f => `          <div class="fam-card"><div class="pos">${esc(f.pos)}</div><div class="w">${esc(f.w)}</div><div class="p">${esc(f.p || '')}</div><div class="m">${esc(f.m)}</div></div>`).join('\n');

  const colloRows = collos.map(c => `        <div class="collo"><div class="pattern">${esc(c.pattern)}</div><div class="meaning">${esc(c.meaning)}</div></div>`).join('\n');

  const exRows = examples.map(e => {
    const en = esc(e.en).replace(/\{\{w\}\}/g, `<em class="hl">${esc(w)}</em>`);
    return `        <div class="real-ex">
          <div class="src">${esc(e.src)}</div>
          <p class="en">${en}</p>
          <p class="cn">${esc(e.cn)}</p>
        </div>`;
  }).join('\n');

  const pitRows = pitfalls.map(p => `        <div class="pitfall-item">
          <span class="tip">${esc(p.tip)}</span>
          ${esc(p.text)}<br>
          <span class="wrong">${esc(p.wrong)}</span> → <span class="right">${esc(p.right)}</span>
        </div>`).join('\n');

  const cmpRows = rows.map((r, i) => {
    const cls = i === 0 ? ' class="highlight"' : '';
    return `          <tr${cls}><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td class="chant">${esc(r[2])}</td></tr>`;
  }).join('\n');
  const chantTip = compare.chant ? `\n      <p class="review-tip">口诀：${esc(compare.chant)}</p>` : '';

  const fillRows = fills.map(f => `        <div class="fill-item reveal-left">
          <p class="fill-sentence">${fillSentence(f.sentence, f.answer)}</p>
          <p class="fill-hint">提示：<b>${esc(f.hint || '')}</b></p>
        </div>`).join('\n');

  const dayLabel = ['今天', '三天后', '一周后', '半月后'];
  const reviewRows = ['d1', 'd3', 'd7', 'd15'].map((d, i) => `        <div class="review-day" data-day="${d}"><div class="day">${d.toUpperCase()}</div><div class="task">${dayLabel[i]}<br>${esc(review[i])}</div></div>`).join('\n');

  const writeSample = data.writeSample || `I want to ${w} my habit of reading English every morning.`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(w)} · ${esc(gloss)}</title>

<link rel="stylesheet" href="../../card-base.css">

<style>
/* ==========================================================================
   ${esc(w)} —— 由 _gen/build.js 生成（theme: ${theme}）
   改动请改 JSON / 主题，不要手改本文件。
   ========================================================================== */
${css}
</style>
</head>

<body data-word="${esc(w)}">

<div class="progress-bar" id="progressBar"></div>

<article class="page">

  <section class="hero">
    <div class="hero-inner">
      <div class="word-row">
        <span class="word-anim" aria-label="${esc(w)}">${letters(w)}</span>
        <button class="speak-btn" id="speakBtn" title="点击听发音" aria-label="朗读">🔊</button>
      </div>
      <div class="hero-meta">
        <div class="ipa-anim" id="ipaBtn">英 /${esc(ipaUK)}/ &nbsp;·&nbsp; 美 /${esc(ipaUS)}/</div>
        <div class="pos-anim">${esc(pos)}</div>
      </div>
      <div class="spell-hint">${esc(w)} &nbsp; ${esc(gloss)}</div>
    </div>
  </section>

  <div class="body-wrap">

    <!-- 1 词根 · 词族 -->
    <section class="section reveal">
      <h2 class="section-title"><span class="num">1</span><span>词根 · 词族</span></h2>
      <div class="root-family">
        <div class="root-line">
          <span class="stem">${esc(root.stem)}</span>（${esc(root.origin)}）&nbsp;→&nbsp; "${esc(root.sense)}" → <b>${esc(gloss.split(' · ')[0])}</b>
        </div>
        <div class="fam-grid">
${famCards}
        </div>
      </div>
    </section>

    <!-- 2 意象卡 -->
    <section class="section reveal-scale">
      <h2 class="section-title"><span class="num">2</span><span>意象卡 · 一句话记住</span></h2>
      <div class="image-card">
        <div class="ic-text">
          <div class="ic-label">核心画面</div>
          <p class="ic-main"><span class="hl">${esc(w)}</span> = ${esc(scene.main)}。</p>
          <p class="ic-sub">${esc(scene.sub)}</p>
        </div>
        <div class="ic-svg" aria-hidden="true">
${renderSVG(scene)}
        </div>
      </div>
    </section>

    <!-- 3 核心搭配 -->
    <section class="section reveal">
      <h2 class="section-title"><span class="num">3</span><span>核心搭配 · 语块记忆</span></h2>
      <div class="collocations">
${colloRows}
      </div>
    </section>

    <!-- 4 真题例句 -->
    <section class="section reveal">
      <h2 class="section-title"><span class="num">4</span><span>真题例句 · 语境记忆</span></h2>
      <div class="real-exs">
${exRows}
      </div>
    </section>

    <!-- 5 易错提醒 -->
    <section class="section reveal-scale">
      <h2 class="section-title"><span class="num">5</span><span>易错提醒 · 先防错</span></h2>
      <div class="pitfall">
${pitRows}
      </div>
    </section>

    <!-- 6 易混辨析 -->
    <section class="section reveal">
      <h2 class="section-title"><span class="num">6</span><span>易混辨析 · 一句话区分</span></h2>
      <table class="compare-table">
        <tbody>
${cmpRows}
        </tbody>
      </table>${chantTip}
    </section>

    <!-- 7 首字母填空 -->
    <section class="section self-test">
      <h2 class="section-title"><span class="num">7</span><span>首字母填空 · 提取练习</span></h2>
      <p class="hint">先自己想完整单词，再点空格看答案。<b>想不出来的，在纸上写一遍。</b></p>
      <div class="fill-list">
${fillRows}
      </div>
    </section>

    <!-- 8 造句练习 -->
    <section class="section reveal-scale">
      <h2 class="section-title"><span class="num">8</span><span>造句练习 · 产出</span></h2>
      <div class="write-practice">
        <p class="wp-hint">用 <b>${esc(w)}</b> 造一句自己的句子，刻意用上今天学的一个搭配。</p>
        <textarea id="mySentence" placeholder="${esc(writeSample)}"></textarea>
        <div class="wp-actions">
          <button class="wp-btn" id="saveBtn">💾 保存到本地</button>
          <button class="wp-btn ghost" id="clearBtn">清空</button>
          <span class="wp-saved" id="savedMsg">✓ 已保存</span>
        </div>
      </div>
    </section>

    <!-- 9 复习打卡 -->
    <section class="section reveal">
      <h2 class="section-title"><span class="num">9</span><span>复习打卡 · 点击标记</span></h2>
      <div class="review-grid" id="reviewGrid">
${reviewRows}
      </div>
      <p class="review-tip">💡 打卡状态保存在本地浏览器，刷新不丢</p>
    </section>

  </div>

</article>

<script src="../../card-base.js"></script>

</body>
</html>
`;
}

/* ---------------- 契约校验 ---------------- */
function validate(html, data) {
  const errs = [];
  const open = (html.match(/<div\b/g) || []).length;
  const close = (html.match(/<\/div>/g) || []).length;
  if (open !== close) errs.push(`div 不配平：<div> ${open} 个，</div> ${close} 个`);
  const need = [
    ['../../card-base.css', '公共样式'],
    ['../../card-base.js', '公共脚本'],
    ['class="progress-bar" id="progressBar"', '进度条'],
    ['id="speakBtn"', '朗读按钮'],
    ['class="word-anim"', '单词大字'],
    ['id="ipaBtn"', '音标'],
    ['class="pos-anim"', '词性'],
    ['class="spell-hint"', '释义行'],
    ['class="root-family"', '区块1'],
    ['class="image-card"', '区块2'],
    ['class="collocations"', '区块3'],
    ['class="real-exs"', '区块4'],
    ['class="pitfall"', '区块5'],
    ['class="compare-table"', '区块6'],
    ['class="fill-list"', '区块7'],
    ['class="write-practice"', '区块8'],
    ['id="reviewGrid"', '区块9']
  ];
  need.forEach(([s, label]) => { if (!html.includes(s)) errs.push(`缺少${label}：${s}`); });
  const sectionCount = (html.match(/<section class="section/g) || []).length;
  if (sectionCount !== 9) errs.push(`区块应为 9 个，实际 ${sectionCount} 个`);
  const letterCount = (html.match(/class="letter l\d+"/g) || []).length;
  if (letterCount !== [...data.word].length) errs.push(`字母 span ${letterCount} 个 ≠ 单词长度 ${[...data.word].length}`);
  const fills = (html.match(/class="fill-item/g) || []).length;
  if (fills !== 5) errs.push(`填空题应为 5 道，实际 ${fills}`);
  const days = (html.match(/data-day="d(1|3|7|15)"/g) || []).length;
  if (days !== 4) errs.push(`打卡格应为 4 个，实际 ${days}`);
  if (!html.includes('&nbsp;')) errs.push('释义行缺少 &nbsp; 分隔（解析器依赖它）');
  return errs;
}

/* ---------------- 单卡生成 ---------------- */
function buildOne(file, opt) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const w = String(data.word || '').trim().toLowerCase();
  if (!/^[a-z][a-z-]{1,20}$/.test(w)) die(`单词不合法：${JSON.stringify(data.word)}`);
  const html = render(data);
  const errs = validate(html, { ...data, word: w });
  if (errs.length) die(`${w} 校验失败：\n  - ${errs.join('\n  - ')}`);

  const letter = /^[a-z]$/.test(w[0]) ? w[0] : 'other';
  const outDir = path.join(ROOT, 'cards', letter);
  const outFile = path.join(outDir, w + '.html');
  if (fs.existsSync(outFile) && !opt.force) {
    die(`${path.relative(ROOT, outFile)} 已存在；确认要覆盖请加 --force`);
  }
  if (!opt.dry) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, html, 'utf8');
  }
  const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log(`✓ ${w.padEnd(12)} → cards/${letter}/${w}.html  ${kb} KB  ${opt.dry ? '(dry)' : ''}`);
  return { data, html, outFile };
}

/* ---------------- 入口 ---------------- */
(function main() {
  const argv = process.argv.slice(2);
  const opt = {
    force: argv.includes('--force'),
    dry: argv.includes('--dry'),
    sync: argv.includes('--sync'),
    all: argv.includes('--all')
  };
  let files = argv.filter(a => !a.startsWith('--'));
  try {
    if (!fs.existsSync(WORDS)) fs.mkdirSync(WORDS, { recursive: true });
    if (opt.all) {
      files = fs.readdirSync(WORDS).filter(f => f.endsWith('.json')).map(f => path.join(WORDS, f));
    } else {
      files = files.map(f => f.endsWith('.json')
        ? path.resolve(process.cwd(), f)
        : path.join(WORDS, f + '.json'));
    }
    if (!files.length) {
      console.log('用法：node cards/_gen/build.js <单词> [--force] [--dry] [--sync]');
      console.log('      已有内容 JSON：' + (fs.existsSync(WORDS) ? fs.readdirSync(WORDS).join(' ') : '(空)'));
      return;
    }
    const built = files.map(f => buildOne(f, opt));
    console.log(`\n完成 ${built.length} 张，用时 ${Date.now() - startedAt} ms`);
    if (opt.sync && !opt.dry) {
      console.log('\n刷新 words-data.js …');
      execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(ROOT, '更新单词数据.ps1'), '-NoSync'], { stdio: 'inherit', cwd: ROOT });
    }
  } catch (e) {
    console.error('✗ ' + e.message);
    process.exit(1);
  }
})();
