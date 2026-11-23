'use strict';
/* ==========================================================================
   scenes.js —— 意象卡场景库（贴纸风：浅色描边 + 三色填充 + 标注芯片）
   每个场景接收 labels 数组，按语义落位；JSON 里只写 template + labels，
   不写 SVG，单卡成本仍然很低。
   ========================================================================== */

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const chip = (x, y, text, w) => {
  const t = String(text == null ? '' : text);
  const width = w || Math.max(40, 18 + t.length * 11);
  return `<g class="sc-label"><rect x="${x - width / 2}" y="${y - 11}" width="${width}" height="22" rx="11" fill="#FBF6EC" stroke="rgba(20,15,12,.18)"/>`
    + `<text x="${x}" y="${y + 4}" text-anchor="middle">${esc(t)}</text></g>`;
};
const link = (x1, y1, x2, y2) => `<path class="sc-link" d="M${x1} ${y1}L${x2} ${y2}"/>`;
const L1 = (L, i, d) => (L[i] == null ? d : L[i]);

const SCENES = {
  /* 支撑：拱桥托住重物 */
  arch: L => `
    <path class="sc-pop" d="M98 218V152a82 82 0 0 1 164 0v66" fill="none" stroke="var(--sc-line)" stroke-width="4" stroke-linecap="round"/>
    <rect class="sc-pop" style="animation-delay:-.4s" x="152" y="58" width="56" height="26" rx="6" fill="var(--cb-accent-soft)" stroke="var(--sc-line)" stroke-width="3"/>
    <rect class="sc-float" x="126" y="96" width="108" height="18" rx="5" fill="var(--cb-2-soft)" stroke="var(--sc-line)" stroke-width="2.5"/>
    <g stroke="var(--cb-accent)" stroke-width="3" stroke-linecap="round" fill="none">
      <path d="M150 24v16M210 24v16"/><path d="M150 40l-5-6M150 40l5-6M210 40l-5-6M210 40l5-6"/>
    </g>
    <line x1="72" y1="222" x2="288" y2="222" stroke="var(--sc-dim)" stroke-width="2.5" stroke-linecap="round"/>
    ${link(284,66,212,70)}${chip(312,60,L1(L, 0, '承重'))}
    ${chip(76,132,L1(L, 1, '托住'))}`,

  /* 逆风：帆船被风顶住 */
  headwind: L => `
    <g transform="rotate(-8 150 180)">
      <path d="M92 196h118l-18 30H112z" fill="var(--cb-2-soft)" stroke="var(--sc-line)" stroke-width="3" stroke-linejoin="round"/>
      <line x1="152" y1="196" x2="152" y2="92" stroke="var(--sc-line)" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M157 98l62 86h-62z" fill="var(--cb-accent-soft)" stroke="var(--sc-line)" stroke-width="3" stroke-linejoin="round"/>
    </g>
    <g class="sc-pop" stroke="var(--cb-accent)" stroke-width="3" fill="none" stroke-linecap="round">
      <path d="M300 96q-26-18-50-6"/><path d="M310 124q-30-20-58-6"/><path d="M298 152q-24-16-44-6"/>
    </g>
    <path class="sc-float" d="M64 236q20-13 40 0t40 0 40 0 40 0" fill="none" stroke="var(--sc-line)" stroke-width="2.5" opacity=".65" stroke-linecap="round"/>
    ${chip(292,72,L1(L, 0, '逆风'))}${link(276,84,252,96)}
    ${chip(78,96,L1(L, 1, '受阻'))}${link(94,106,112,120)}`,

  /* 统一：同轴齿轮 */
  gears: L => {
    const gear = (cx, cy, r, fill, delay) => `<g class="sc-pop" style="animation-delay:${delay}s">`
      + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="var(--sc-line)" stroke-width="3"/>`
      + [0, 45, 90, 135].map(a => `<rect x="${cx - 4}" y="${cy - r - 8}" width="8" height="16" rx="2.5" fill="${fill}" stroke="var(--sc-line)" stroke-width="2.5" transform="rotate(${a} ${cx} ${cy})"/>`
        + `<rect x="${cx - 4}" y="${cy + r - 8}" width="8" height="16" rx="2.5" fill="${fill}" stroke="var(--sc-line)" stroke-width="2.5" transform="rotate(${a} ${cx} ${cy})"/>`).join('')
      + `<circle cx="${cx}" cy="${cy}" r="${r * 0.36}" fill="var(--ink)" stroke="var(--sc-line)" stroke-width="2.5"/></g>`;
    return `
    <path class="sc-link" d="M180 104V58M142 140H120M218 140h22M180 196v34"/>
    ${gear(180, 148, 52, 'var(--cb-accent-soft)', 0)}
    ${gear(110, 92, 26, 'var(--cb-2-soft)', -.4)}
    ${gear(250, 92, 26, 'var(--cb-3-soft)', -.8)}
    ${gear(180, 230, 22, 'var(--cb-2-soft)', -1.2)}
    ${chip(180, 34, L1(L, 0, '统一'))}
    ${chip(74, 200, L1(L, 1, '同转'))}`;
  },

  /* 对立：两张对喊的嘴 */
  duel: L => `
    <g class="sc-pop">
      <rect x="30" y="70" width="118" height="64" rx="18" fill="var(--cb-accent-soft)" stroke="var(--sc-line)" stroke-width="3"/>
      <path d="M148 118l24 18-9-26z" fill="var(--cb-accent-soft)" stroke="var(--sc-line)" stroke-width="3" stroke-linejoin="round"/>
      <text x="89" y="115" text-anchor="middle" font-size="30" font-weight="900" fill="var(--ink)">东</text>
    </g>
    <g class="sc-pop" style="animation-delay:-.5s">
      <rect x="212" y="70" width="118" height="64" rx="18" fill="var(--cb-2-soft)" stroke="var(--sc-line)" stroke-width="3"/>
      <path d="M212 118l-24 18 9-26z" fill="var(--cb-2-soft)" stroke="var(--sc-line)" stroke-width="3" stroke-linejoin="round"/>
      <text x="271" y="115" text-anchor="middle" font-size="30" font-weight="900" fill="var(--ink)">西</text>
    </g>
    <g class="sc-float" stroke="var(--cb-accent)" stroke-width="3" stroke-linecap="round" fill="none">
      <path d="M126 178h62M126 178l11-6M126 178l11 6"/>
      <path d="M234 178h-62M234 178l-11-6M234 178l-11 6"/>
    </g>
    ${chip(89, 228, L1(L, 0, '相反'))}${link(89, 217, 89, 138)}
    ${chip(271, 228, L1(L, 1, '矛盾'))}${link(271, 217, 271, 138)}`,

  /* 相关：两根同步的温度计 */
  gauges: L => `
    <rect x="100" y="66" width="46" height="150" rx="23" fill="rgba(251,246,236,.08)" stroke="var(--sc-line)" stroke-width="3"/>
    <rect class="sc-float" x="106" y="152" width="34" height="58" rx="17" fill="var(--cb-accent)"/>
    <rect x="214" y="66" width="46" height="150" rx="23" fill="rgba(251,246,236,.08)" stroke="var(--sc-line)" stroke-width="3"/>
    <rect class="sc-float" style="animation-delay:-1.4s" x="220" y="118" width="34" height="92" rx="17" fill="var(--cb-2)"/>
    <path class="sc-link" d="M132 146L232 112"/>
    <circle cx="132" cy="146" r="4" fill="var(--cb-accent)"/><circle cx="232" cy="112" r="4" fill="var(--cb-2)"/>
    ${chip(128, 44, L1(L, 0, '同升'))}${link(128, 54, 128, 66)}
    ${chip(228, 246, L1(L, 1, '同降'))}${link(228, 236, 228, 216)}`,

  /* 多用途：三件工具平铺 */
  toolkit: L => `
    <g transform="rotate(-10 96 120)"><g class="sc-pop">
      <path d="M96 150L74 76M96 150l26-74" stroke="var(--sc-line)" stroke-width="4" stroke-linecap="round" fill="none"/>
      <circle cx="78" cy="166" r="11" fill="none" stroke="var(--cb-accent)" stroke-width="3.5"/>
      <circle cx="112" cy="166" r="11" fill="none" stroke="var(--cb-accent)" stroke-width="3.5"/>
      <circle cx="96" cy="150" r="3" fill="var(--sc-line)"/>
    </g></g>
    <g class="sc-pop" style="animation-delay:-.45s">
      <rect x="168" y="146" width="20" height="52" rx="9" fill="var(--cb-2-soft)" stroke="var(--sc-line)" stroke-width="3"/>
      <line x1="178" y1="146" x2="178" y2="94" stroke="var(--sc-line)" stroke-width="4" stroke-linecap="round"/>
      <rect x="171" y="84" width="14" height="12" rx="2" fill="var(--cb-accent)" stroke="var(--sc-line)" stroke-width="2.5"/>
    </g>
    <g class="sc-pop" style="animation-delay:-.9s">
      <path d="M256 92a18 18 0 1 1 8 34h-8l-9 24" fill="none" stroke="var(--sc-line)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M250 118h10" stroke="var(--cb-accent)" stroke-width="4" stroke-linecap="round"/>
    </g>
    ${chip(90, 240, L1(L, 0, '一物'))}
    ${chip(178, 240, L1(L, 1, '多用'))}
    ${chip(262, 240, L1(L, 2, '多能'))}`,

  /* 阻挡：盾牌抵住飞来的箭头 */
  shield: L => `
    <path class="sc-pop" d="M180 54l62 20v56c0 44-26 76-62 94-36-18-62-50-62-94V74z" fill="var(--cb-accent-soft)" stroke="var(--sc-line)" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M180 86v70M152 118h56" stroke="var(--cb-accent)" stroke-width="5" stroke-linecap="round"/>
    <g class="sc-float" stroke="var(--cb-accent)" stroke-width="3" stroke-linecap="round" fill="none">
      <path d="M300 96h-32M268 96l10-6M268 96l10 6"/>
      <path d="M310 146h-38M272 146l10-6M272 146l10 6"/>
      <path d="M296 196h-26M270 196l10-6M270 196l10 6"/>
    </g>
    ${chip(302, 66, L1(L, 0, '挡住'))}
    ${chip(70, 210, L1(L, 1, '预防'))}
    ${link(84, 198, 116, 172)}`,

  /* 扩散：从中心一圈圈扩大 */
  ripple: L => `
    <circle class="sc-pop" cx="150" cy="150" r="24" fill="var(--cb-accent-soft)" stroke="var(--sc-line)" stroke-width="3"/>
    <circle class="sc-float" cx="150" cy="150" r="48" fill="none" stroke="var(--sc-line)" stroke-width="2.5" opacity=".8"/>
    <circle cx="150" cy="150" r="74" fill="none" stroke="var(--sc-line)" stroke-width="2" opacity=".55"/>
    <circle cx="150" cy="150" r="100" fill="none" stroke="var(--sc-line)" stroke-width="1.5" opacity=".3"/>
    <g class="sc-pop" style="animation-delay:-.6s" stroke="var(--cb-accent)" stroke-width="3.5" stroke-linecap="round" fill="none">
      <path d="M282 88l14-10M296 78l-3 16"/>
      <path d="M298 206l-16-10M282 196l2 16"/>
      <path d="M56 72l-12 12M44 84l16 2"/>
    </g>
    ${chip(288, 58, L1(L, 0, '扩散'))}
    ${chip(66, 108, L1(L, 1, '扩大'))}
    ${link(78, 118, 106, 134)}`,

  /* 持续：不停绕圈的箭头 */
  loop: L => `
    <path class="sc-pop" d="M180 74a66 66 0 1 1-46-17" fill="none" stroke="var(--sc-line)" stroke-width="4" stroke-linecap="round"/>
    <path d="M134 57l-4 22 22-6" fill="none" stroke="var(--cb-accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle class="sc-float" cx="180" cy="74" r="8" fill="var(--cb-accent)"/>
    <g stroke="var(--sc-line)" stroke-width="2.5" stroke-linecap="round" opacity=".55">
      <path d="M180 120v14M180 176v14M124 150h-14M250 150h-14"/>
    </g>
    ${chip(180, 238, L1(L, 0, '不停'))}
    ${chip(292, 92, L1(L, 1, '累积'))}`,

  /* 转移：桥把货箱送到对岸 */
  bridge: L => `
    <path d="M36 212h68M256 212h68" stroke="var(--sc-line)" stroke-width="4" stroke-linecap="round" opacity=".75"/>
    <path class="sc-pop" d="M104 212a76 76 0 0 1 152 0" fill="none" stroke="var(--sc-line)" stroke-width="4" stroke-linecap="round"/>
    <path d="M104 212v-24M180 136v76M256 212v-24" stroke="var(--sc-line)" stroke-width="2.5" opacity=".5"/>
    <g class="sc-float" stroke="var(--cb-accent)" stroke-width="3" stroke-linecap="round" fill="none">
      <path d="M96 180h150"/><path d="M246 180l-14-7M246 180l-14 7"/>
    </g>
    <rect class="sc-pop" style="animation-delay:-.5s" x="148" y="150" width="28" height="22" rx="4" fill="var(--cb-2-soft)" stroke="var(--sc-line)" stroke-width="2.5"/>
    ${chip(288, 76, L1(L, 0, '转移'))}
    ${chip(66, 88, L1(L, 1, '过渡'))}
    ${link(74, 100, 104, 122)}`
};

/* 旧主题名兼容：motif → template */
const ALIAS = {
  arch: 'arch',
  wave: 'headwind',
  scale: 'gauges',
  key: 'toolkit',
  seed: 'toolkit',
  orbit: 'gears'
};

function renderScene(scene) {
  scene = scene || {};
  const name = scene.template || ALIAS[scene.motif] || scene.motif || 'gears';
  const fn = SCENES[name] || SCENES.gears;
  const labels = Array.isArray(scene.labels) ? scene.labels : [];
  return `<svg viewBox="0 0 360 280" role="img" aria-hidden="true">`
    + `<circle cx="180" cy="142" r="112" fill="var(--cb-accent)" opacity=".13"/>`
    + `<circle cx="180" cy="142" r="104" fill="none" stroke="var(--sc-dim)" stroke-width="1.5" stroke-dasharray="3 8"/>`
    + fn(labels)
    + `</svg>`;
}

module.exports = { renderScene };
