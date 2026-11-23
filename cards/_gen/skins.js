'use strict';
/* ==========================================================================
   skins.js —— 每词一套皮肤：把 JSON 里的 skin 配方编译成 CSS
   --------------------------------------------------------------------------
   skin = {
     name:      "警戒线",            // 皮肤名（写进生成注释）
     watermark: "止",                // hero 右侧巨型水印字（可空）
     palette:   { paper,paper2,accent,accentSoft,c2,c2Soft,c3,c3Soft,ink,deep },
     hero:      "dark" | "paper" | "split" | "band",
     font:      "sans" | "serif" | "mono" | "condensed" | "rounded",
     motif:     "hazard" | "ripple" | "grid" | "dots" | "vlines" | "waves"
              | "confetti" | "contour" | "blueprint" | "none",
     align:     "left" | "center",
     wordSize:  108                  // 可选，hero 大字字号
   }
   输出：主题级 CSS（变量 + hero 装饰 + 底纹 + 字体），直接拼在 _hero.css 后。
   ========================================================================== */

/* ---------------- 颜色工具 ---------------- */
const hex = c => {
  let h = String(c || '').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const rgba = (c, a) => { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; };
const darken = (c, f) => {
  const [r, g, b] = hex(c), k = 1 - f;
  return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
};
const lum = c => { const [r, g, b] = hex(c); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
const bare = c => String(c || '').replace('#', '');

/* ---------------- 字体 ---------------- */
const FONTS = {
  sans: '"Helvetica Neue",Arial,"PingFang SC",sans-serif',
  serif: '"Songti SC","Noto Serif SC",Georgia,"Times New Roman",serif',
  mono: '"Courier New",Consolas,monospace',
  condensed: '"Arial Narrow","Impact","Helvetica Neue",sans-serif',
  rounded: '"Trebuchet MS",Verdana,"Segoe UI",sans-serif'
};
const TYPE_CSS = {
  sans: '',
  serif: '.word-anim{font-weight:900;letter-spacing:0;}',
  mono: '.word-anim{font-weight:800;letter-spacing:-.01em;}',
  condensed: '.word-anim{font-weight:900;letter-spacing:-.035em;}',
  rounded: '.word-anim{font-weight:800;letter-spacing:-.02em;}'
};

/* ---------------- 页面底纹 ---------------- */
function bodyMotif(name, p) {
  const A = p.accent, I = p.ink, C2 = p.c2 || A, C3 = p.c3 || I;
  const a = x => rgba(A, x), i = x => rgba(I, x), c2 = x => rgba(C2, x), c3 = x => rgba(C3, x);
  const base = `body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;`;
  switch (name) {
    case 'hazard':
      return base + `background-image:repeating-linear-gradient(45deg,transparent 0 16px,${a(.12)} 16px 30px);animation:skDrift 34s linear infinite;}`;
    case 'ripple':
      return base + `background-image:repeating-radial-gradient(circle at 84% -12%,transparent 0 36px,${a(.11)} 36px 37.5px);}`;
    case 'grid':
      return base + `background-image:linear-gradient(${i(.055)} 1px,transparent 1px),linear-gradient(90deg,${i(.055)} 1px,transparent 1px);background-size:54px 54px;}`;
    case 'dots':
      return base + `background-image:radial-gradient(circle,${i(.13)} 1.1px,transparent 1.6px);background-size:22px 22px;animation:skDrift 42s linear infinite;}`;
    case 'vlines':
      return base + `background-image:repeating-linear-gradient(90deg,transparent 0 54px,${a(.10)} 54px 56px);animation:skDriftX 28s linear infinite;}`;
    case 'waves':
      return base + `background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='40'%3E%3Cpath d='M0 20q30-15 60 0t60 0' fill='none' stroke='%23${bare(A)}' stroke-opacity='0.16' stroke-width='2'/%3E%3C/svg%3E");background-size:120px 40px;animation:skDriftX 32s linear infinite;}`;
    case 'confetti':
      return base + `background-image:radial-gradient(circle,${a(.30)} 2px,transparent 2.6px),radial-gradient(circle,${c2(.26)} 1.8px,transparent 2.4px),radial-gradient(circle,${c3(.24)} 1.6px,transparent 2.2px);background-size:92px 92px,70px 70px,116px 116px;background-position:0 0,34px 40px,64px 12px;}`;
    case 'contour':
      return base + `background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cg fill='none' stroke='%23${bare(A)}' stroke-opacity='0.13' stroke-width='1.4'%3E%3Cellipse cx='110' cy='110' rx='34' ry='26'/%3E%3Cellipse cx='110' cy='110' rx='62' ry='48' transform='rotate(12 110 110)'/%3E%3Cellipse cx='110' cy='110' rx='92' ry='72' transform='rotate(-8 110 110)'/%3E%3C/g%3E%3C/svg%3E");background-size:220px 220px;}`;
    case 'blueprint':
      return base + `background-image:linear-gradient(${i(.05)} 1px,transparent 1px),linear-gradient(90deg,${i(.05)} 1px,transparent 1px),linear-gradient(${a(.10)} 1px,transparent 1px),linear-gradient(90deg,${a(.10)} 1px,transparent 1px);background-size:24px 24px,24px 24px,120px 120px,120px 120px;}`;
    default:
      return '';
  }
}

/* ---------------- hero 造型 ---------------- */
function heroBlock(kind, p, skin) {
  const accent = p.accent, deep = p.deep || '#241F1A', ink = p.ink, paper = p.paper;
  const dark = kind === 'dark';
  const vars = [];
  let css = '';

  if (dark) {
    vars.push(`--hero-bg:radial-gradient(125% 125% at 82% 4%,${rgba(accent, .58)} 0%,${deep} 48%,${darken(deep, .3)} 100%)`);
    vars.push('--hero-ink:#F7F0E4', '--hero-word:#FFF8EC', `--word-shadow:${rgba(accent, .85)}`);
    vars.push('--hero-pad:96px 56px 72px');
  } else if (kind === 'split') {
    vars.push(`--hero-bg:linear-gradient(104deg,${paper} 0 58%,${rgba(accent, .20)} 58% 100%)`);
    vars.push(`--hero-ink:${ink}`, `--hero-word:${ink}`, `--word-shadow:${accent}`);
    vars.push('--hero-pad:88px 56px 68px');
    css += `.hero::before{content:"";position:absolute;top:-6%;bottom:-6%;left:55%;width:12px;background:${accent};transform:skewX(-12deg);z-index:1;pointer-events:none;}`;
  } else if (kind === 'band') {
    vars.push(`--hero-bg:${paper}`, `--hero-ink:${ink}`, `--hero-word:${ink}`, `--word-shadow:${accent}`);
    vars.push('--hero-pad:94px 56px 70px');
    css += `.hero::before{content:"";position:absolute;left:-5%;right:-5%;top:52%;height:116px;background:${rgba(accent, .17)};border-top:3px solid ${ink};border-bottom:3px solid ${ink};transform:rotate(-1.4deg);z-index:1;pointer-events:none;}`;
  } else {
    vars.push(`--hero-bg:${paper}`, `--hero-ink:${ink}`, `--hero-word:${ink}`, `--word-shadow:${accent}`);
    vars.push('--hero-pad:84px 56px 62px');
    css += `.hero::before{content:"";position:absolute;top:0;left:0;right:0;height:9px;background:${accent};z-index:3;pointer-events:none;}`;
  }

  if (skin.watermark) {
    const wmColor = dark ? 'rgba(255,250,242,.07)' : rgba(ink, .07);
    css += `.hero::after{content:"${skin.watermark}";position:absolute;right:26px;top:50%;`
      + `transform:translateY(-50%) rotate(-8deg);font-family:var(--font-display);`
      + `font-size:180px;font-weight:900;line-height:1;letter-spacing:0;`
      + `color:${wmColor};pointer-events:none;z-index:1;}`;
  }
  return { vars, css };
}

/* ---------------- 主入口 ---------------- */
function renderSkin(skin) {
  skin = skin || {};
  const p = skin.palette || {};
  const accent = p.accent || '#8C2F39';
  const ink = p.ink || '#211C18';
  const paper = p.paper || '#F6F1E7';
  const hero = heroBlock(skin.hero || 'paper', p, skin);
  const fontKey = FONTS[skin.font] ? skin.font : 'sans';
  const align = skin.align === 'left' ? 'left' : 'center';
  const wordSize = skin.wordSize || (skin.hero === 'split' ? 98 : 108);

  const rootVars = [
    `--paper:${paper}`, `--paper-2:${p.paper2 || p.paper || paper}`,
    `--cb-accent:${accent}`, `--cb-accent-soft:${p.accentSoft || rgba(accent, .16)}`,
    `--cb-2:${p.c2 || '#3D5661'}`, `--cb-2-soft:${p.c2Soft || rgba(p.c2 || '#3D5661', .16)}`,
    `--cb-3:${p.c3 || '#8A7446'}`, `--cb-3-soft:${p.c3Soft || rgba(p.c3 || '#8A7446', .16)}`,
    `--ink:${ink}`, `--deep:${p.deep || ink}`, `--cb-deep:${p.deep || ink}`,
    `--font-display:${FONTS[fontKey]}`,
    `--hero-align:${align}`, `--hero-justify:${align === 'left' ? 'flex-start' : 'center'}`,
    `--word-size:${wordSize}px`, `--word-size-sm:${Math.round(wordSize * 0.48)}px`,
    ...hero.vars
  ];

  const onAccent = lum(accent) > 0.62 ? ink : '#FBF5E9';
  const extra = [
    `.hero .ipa-anim,.hero .spell-hint{color:${ink};}`,
    `.section-title,.image-card .ic-label{font-family:var(--font-display);}`,
    `.image-card .ic-label,.image-card .ic-main .hl{color:${onAccent};}`,
    TYPE_CSS[fontKey],
    bodyMotif(skin.motif || 'none', p),
    '@keyframes skDrift{to{background-position:64px 64px;}}',
    '@keyframes skDriftX{to{background-position:56px 0;}}'
  ].filter(Boolean).join('\n');

  return `/* 皮肤：${skin.name || '自定义'} —— hero:${skin.hero || 'paper'} / font:${fontKey} / motif:${skin.motif || 'none'} */\n`
    + `:root{\n  ${rootVars.join(';\n  ')};\n}\n`
    + hero.css + '\n'
    + extra + '\n';
}

module.exports = { renderSkin };
