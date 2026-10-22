# -*- coding: utf-8 -*-
"""
uniform 单词卡构建器
基底 = union.html 的 CSS 骨架（与全库 42 张卡共用的 140 个选择器一致）
只替换「主题层」：色板 / 背景纹理 / 漂浮装饰 / Hero 装饰 / 字母动画 / 意象卡 SVG
内容层（9 节区）严格遵循全库数量约定：fam=6 col=5 ex=4 pit=3 tr=6 fill=5
"""
import re, io, os

BASE = 'D:/apt/英语单词/union.html'
OUT  = 'D:/apt/英语单词/uniform.html'

src = io.open(BASE, encoding='utf-8').read()
css = src[src.index('<style>') + 7: src.index('</style>')]

# ---------- 0. 变量重命名（主题色名对齐 uniform 配色） ----------
for a, b in (('--mustard', '--gold'), ('--brick', '--crimson'), ('--plum', '--navy')):
    css = css.replace(a, b)

def must(old, new, label):
    global css
    assert old in css, 'NOT FOUND: ' + label
    css = css.replace(old, new, 1)

# ---------- 1. :root 色板 ----------
must(""":root{
  /* 工运色板 —— union = 联盟 / 工会 / 联合 / 婚姻 */
  --paper:#FAF3E4;
  --paper-2:#EFE3CC;
  --ink:#1F1B16;
  --gold:#E8B33C;
  --gold-soft:#FBEDCB;
  --crimson:#C9524A;
  --crimson-soft:#F5DBD8;
  --olive:#6B8E5A;
  --olive-soft:#DDE8D4;
  --slate:#4A6B8A;
  --slate-soft:#DCE5EE;
  --navy:#8B4A6B;
  --navy-soft:#EDD9E4;
""", """:root{
  /* 校服色板 —— uniform = 制服 / 统一 / 一致 / 齐平 */
  --paper:#F5F1E6;
  --paper-2:#E9E2CF;
  --ink:#1B2233;
  --gold:#C08A2E;
  --gold-soft:#F7E9CB;
  --crimson:#B23A48;
  --crimson-soft:#F6DDE1;
  --olive:#6B7F4E;
  --olive-soft:#DEE7D3;
  --slate:#5A6B7C;
  --slate-soft:#DCE3EA;
  --navy:#2B4C7E;
  --navy-soft:#D9E3F0;
""", ':root')

# ---------- 2. body 背景 ----------
must('background:#15120E;', 'background:#12161F;', 'body bg')
must("""    radial-gradient(circle at 15% 12%, rgba(232,179,60,.22) 0, transparent 42%),
    radial-gradient(circle at 85% 88%, rgba(201,82,74,.20) 0, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(74,107,138,.14) 0, transparent 60%);""",
     """    radial-gradient(circle at 15% 12%, rgba(43,76,126,.26) 0, transparent 42%),
    radial-gradient(circle at 85% 88%, rgba(178,58,72,.20) 0, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(192,138,46,.15) 0, transparent 60%);""", 'body bg grad')

# ---------- 3. 全页纹理：链条 → 制服格纹布 ----------
must("""/* 全页：环环相扣的链条纹理 */
body::before{
  content:"";
  position:fixed;inset:0;
  pointer-events:none;z-index:0;
  background-image:
    radial-gradient(circle at 20% 20%, transparent 34px, rgba(232,179,60,.10) 34px, rgba(232,179,60,.10) 36px, transparent 36px),
    radial-gradient(circle at 40% 20%, transparent 34px, rgba(201,82,74,.09) 34px, rgba(201,82,74,.09) 36px, transparent 36px),
    radial-gradient(circle at 60% 20%, transparent 34px, rgba(107,142,90,.09) 34px, rgba(107,142,90,.09) 36px, transparent 36px),
    radial-gradient(circle at 30% 60%, transparent 34px, rgba(74,107,138,.09) 34px, rgba(74,107,138,.09) 36px, transparent 36px),
    radial-gradient(circle at 50% 60%, transparent 34px, rgba(232,179,60,.09) 34px, rgba(232,179,60,.09) 36px, transparent 36px),
    radial-gradient(circle at 70% 60%, transparent 34px, rgba(139,74,107,.08) 34px, rgba(139,74,107,.08) 36px, transparent 36px);
  background-size:200px 200px;
  animation:chainShift 40s linear infinite;
}
@keyframes chainShift{
  to{ background-position:200px 200px; }
}""",
"""/* 全页：制服格纹布纹理 —— 每一格都一样大 */
body::before{
  content:"";
  position:fixed;inset:0;
  pointer-events:none;z-index:0;
  background-image:
    repeating-linear-gradient(90deg, transparent 0 46px, rgba(43,76,126,.085) 46px 48px),
    repeating-linear-gradient(0deg, transparent 0 46px, rgba(178,58,72,.07) 46px 48px);
  animation:plaidShift 40s linear infinite;
}
@keyframes plaidShift{
  to{ background-position:48px 48px, 48px 48px; }
}""", 'body plaid')

# ---------- 4. 漂浮装饰：链条 → 制服条纹 ----------
must("""/* 漂浮的小链条环 */
.page-chains{
  position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden;
}
.chain{
  position:absolute;
  opacity:0;
  animation:chainDrift linear infinite;
}
.chain .link{
  position:absolute;
  width:22px;height:22px;
  border-radius:50%;
  border:3px solid var(--ink);
  background:transparent;
}
.chain .link.l1{ left:0; top:0; }
.chain .link.l2{ left:12px; top:0; }
.chain .link.l3{ left:24px; top:0; }
.chain.c1{ left:8%; bottom:-40px; animation-duration:28s; }
.chain.c1 .link.l1{ background:var(--gold); }
.chain.c1 .link.l2{ background:var(--crimson); }
.chain.c1 .link.l3{ background:var(--gold); }
.chain.c2{ left:24%; bottom:-60px; animation-duration:36s; animation-delay:4s; }
.chain.c2 .link.l1{ background:var(--olive); }
.chain.c2 .link.l2{ background:var(--slate); }
.chain.c2 .link.l3{ background:var(--olive); }
.chain.c3{ left:78%; bottom:-45px; animation-duration:30s; animation-delay:2s; }
.chain.c3 .link.l1{ background:var(--crimson); }
.chain.c3 .link.l2{ background:var(--navy); }
.chain.c3 .link.l3{ background:var(--crimson); }
.chain.c4{ left:90%; bottom:-30px; animation-duration:34s; animation-delay:8s; }
.chain.c4 .link.l1{ background:var(--slate); }
.chain.c4 .link.l2{ background:var(--gold); }
.chain.c4 .link.l3{ background:var(--slate); }
.chain.c5{ left:52%; bottom:-70px; animation-duration:32s; animation-delay:6s; }
.chain.c5 .link.l1{ background:var(--navy); }
.chain.c5 .link.l2{ background:var(--olive); }
.chain.c5 .link.l3{ background:var(--navy); }
.chain.c6{ left:38%; bottom:-50px; animation-duration:26s; animation-delay:12s; }
.chain.c6 .link.l1{ background:var(--slate); }
.chain.c6 .link.l2{ background:var(--crimson); }
.chain.c6 .link.l3{ background:var(--slate); }

@keyframes chainDrift{
  0%{ transform:translateY(0) rotate(0); opacity:0; }
  10%{ opacity:.75; }
  50%{ transform:translateY(-50vh) rotate(180deg); }
  90%{ opacity:.4; }
  100%{ transform:translateY(-118vh) rotate(360deg); opacity:0; }
}""",
"""/* 漂浮的制服条纹 —— 每一组都一样长 */
.page-stripes{
  position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden;
}
.stripe{
  position:absolute;
  opacity:0;
  animation:stripeDrift linear infinite;
}
.stripe .bar{
  position:absolute;
  width:46px;height:9px;
  border-radius:3px;
  border:2.5px solid var(--ink);
}
.stripe .bar.b1{ left:0; top:0; }
.stripe .bar.b2{ left:0; top:13px; }
.stripe .bar.b3{ left:0; top:26px; }
.stripe.s1{ left:8%;  bottom:-45px; animation-duration:28s; }
.stripe.s1 .bar.b1{ background:var(--navy); }
.stripe.s1 .bar.b2{ background:var(--navy); }
.stripe.s1 .bar.b3{ background:var(--navy); }
.stripe.s2{ left:24%; bottom:-60px; animation-duration:36s; animation-delay:4s; }
.stripe.s2 .bar.b1{ background:var(--crimson); }
.stripe.s2 .bar.b2{ background:var(--crimson); }
.stripe.s2 .bar.b3{ background:var(--crimson); }
.stripe.s3{ left:78%; bottom:-45px; animation-duration:30s; animation-delay:2s; }
.stripe.s3 .bar.b1{ background:var(--olive); }
.stripe.s3 .bar.b2{ background:var(--olive); }
.stripe.s3 .bar.b3{ background:var(--olive); }
.stripe.s4{ left:90%; bottom:-30px; animation-duration:34s; animation-delay:8s; }
.stripe.s4 .bar.b1{ background:var(--gold); }
.stripe.s4 .bar.b2{ background:var(--gold); }
.stripe.s4 .bar.b3{ background:var(--gold); }
.stripe.s5{ left:52%; bottom:-70px; animation-duration:32s; animation-delay:6s; }
.stripe.s5 .bar.b1{ background:var(--slate); }
.stripe.s5 .bar.b2{ background:var(--slate); }
.stripe.s5 .bar.b3{ background:var(--slate); }
.stripe.s6{ left:38%; bottom:-50px; animation-duration:26s; animation-delay:12s; }
.stripe.s6 .bar.b1{ background:var(--navy); }
.stripe.s6 .bar.b2{ background:var(--crimson); }
.stripe.s6 .bar.b3{ background:var(--gold); }

@keyframes stripeDrift{
  0%{ transform:translateY(0) rotate(0); opacity:0; }
  10%{ opacity:.75; }
  50%{ transform:translateY(-50vh) rotate(8deg); }
  90%{ opacity:.4; }
  100%{ transform:translateY(-118vh) rotate(0); opacity:0; }
}""", 'page-stripes')

# ---------- 5. Hero 装饰：链条 SVG → 平行条纹 SVG ----------
must("""/* HERO 环形链条 SVG */
.hero-chain-svg{
  position:absolute;
  inset:0;
  pointer-events:none;
  z-index:0;
  opacity:.7;
}
.hero-chain-svg svg{ width:100%; height:100%; }
.chain-link{
  fill:none;
  stroke-linecap:round;
  stroke-dasharray:400;
  stroke-dashoffset:400;
  animation:chainDraw 3s ease-out forwards;
}
.chain-link.cl1{ stroke:var(--gold); stroke-width:3; animation-delay:.2s; opacity:.7; }
.chain-link.cl2{ stroke:var(--crimson); stroke-width:3; animation-delay:.6s; opacity:.65; }
.chain-link.cl3{ stroke:var(--olive); stroke-width:2.5; animation-delay:1s; opacity:.6; }
.chain-link.cl4{ stroke:var(--slate); stroke-width:2.5; animation-delay:1.4s; opacity:.6; }
@keyframes chainDraw{ to{ stroke-dashoffset:0; } }""",
"""/* HERO 平行条纹 SVG —— 每一行都一模一样长 */
.hero-stripe-svg{
  position:absolute;
  inset:0;
  pointer-events:none;
  z-index:0;
  opacity:.5;
}
.hero-stripe-svg svg{ width:100%; height:100%; }
.stripe-line{
  fill:none;
  stroke-linecap:round;
  stroke-dasharray:520;
  stroke-dashoffset:520;
  animation:stripeDraw 3s ease-out forwards;
}
.stripe-line.sl1{ stroke:var(--gold);    stroke-width:4; animation-delay:.2s; }
.stripe-line.sl2{ stroke:var(--crimson); stroke-width:3; animation-delay:.5s; }
.stripe-line.sl3{ stroke:var(--olive);   stroke-width:3; animation-delay:.9s; }
.stripe-line.sl4{ stroke:var(--slate);   stroke-width:3; animation-delay:1.3s; }
@keyframes stripeDraw{ to{ stroke-dashoffset:0; } }""", 'hero stripe svg')

# ---------- 6. 字母动画：链条串入 → 逐位列队 ----------
must("""/* 字母像链条一样依次串入 */
.word-anim .l1{ animation-delay:.15s; color:var(--gold); }
.word-anim .l2{ animation-delay:.30s; color:var(--crimson); }
.word-anim .l3{ animation-delay:.45s; color:var(--olive); }
.word-anim .l4{ animation-delay:.60s; color:var(--slate); }
.word-anim .l5{ animation-delay:.75s; color:var(--navy); }
@keyframes letterChain{""",
"""/* 字母像队列一样逐位就位 */
.word-anim .l1{ animation-delay:.15s; color:var(--gold); }
.word-anim .l2{ animation-delay:.30s; color:var(--crimson); }
.word-anim .l3{ animation-delay:.45s; color:var(--olive); }
.word-anim .l4{ animation-delay:.60s; color:var(--slate); }
.word-anim .l5{ animation-delay:.75s; color:var(--navy); }
.word-anim .l6{ animation-delay:.90s; color:var(--gold); }
.word-anim .l7{ animation-delay:1.05s; color:var(--crimson); }
@keyframes letterStripe{""", 'letter anim')
css = css.replace('animation:letterChain 1.1s', 'animation:letterStripe 1.1s', 1)

# ---------- 7. 意象卡：环形链条 → 列队剪影 ----------
must('  grid-template-columns:1fr 280px;', '  grid-template-columns:1fr 340px;', 'ic grid')
must("""  background:linear-gradient(120deg,transparent 30%,rgba(232,179,60,.16) 50%,transparent 70%);""",
     """  background:linear-gradient(120deg,transparent 30%,rgba(192,138,46,.18) 50%,transparent 70%);""", 'ic sheen')
must("""  width:280px;height:240px;
}""", """  width:340px;height:300px;
}""", 'ic svg size')

must("""/* 环形链条 SVG 动画 */
.ring-chain{
  fill:none;
  stroke-linecap:round;
}
.ring-chain.rc1{
  stroke:var(--gold);
  stroke-width:5;
  animation:chainPulse 3s ease-in-out infinite;
}
.ring-chain.rc2{
  stroke:var(--crimson);
  stroke-width:5;
  animation:chainPulse 3s ease-in-out infinite .4s;
}
.ring-chain.rc3{
  stroke:var(--olive);
  stroke-width:5;
  animation:chainPulse 3s ease-in-out infinite .8s;
}
.ring-chain.rc4{
  stroke:var(--slate);
  stroke-width:5;
  animation:chainPulse 3s ease-in-out infinite 1.2s;
}
.ring-chain.rc5{
  stroke:var(--navy);
  stroke-width:5;
  animation:chainPulse 3s ease-in-out infinite 1.6s;
}
@keyframes chainPulse{
  0%,100%{ opacity:.35; }
  50%{ opacity:1; }
}

.center-ring{
  fill:none;
  stroke:var(--gold);
  stroke-width:3;
  stroke-dasharray:6 8;
  transform-origin:140px 120px;
  animation:ringSpin 20s linear infinite;
}
@keyframes ringSpin{
  to{ transform:rotate(360deg); }
}
.center-label{
  animation:centerBreath 2.8s ease-in-out infinite;
  transform-origin:140px 120px;
}
@keyframes centerBreath{
  0%,100%{ transform:scale(1); }
  50%{ transform:scale(1.08); }
}
.link-shine{
  animation:shine 2s ease-in-out infinite;
  transform-origin:center;
}
@keyframes shine{
  0%,100%{ opacity:.6; }
  50%{ opacity:1; }
}""",
"""/* 意象卡 SVG 动画 —— 一排剪影整齐落位 */
.ufig{
  transform-box:fill-box;
  transform-origin:center bottom;
  animation:figDrop .9s cubic-bezier(.34,1.56,.64,1) backwards;
}
.ufig.u2{ animation-delay:.14s; }
.ufig.u3{ animation-delay:.28s; }
.ufig.u4{ animation-delay:.42s; }
.ufig.u5{ animation-delay:.56s; }
@keyframes figDrop{
  0%{ opacity:0; transform:translateY(-46px) scale(.86); }
  100%{ opacity:1; transform:translateY(0) scale(1); }
}
.align-line{
  stroke-dasharray:10 8;
  animation:alignSlide 2.6s ease-in-out .5s infinite;
}
@keyframes alignSlide{
  0%,100%{ stroke-dashoffset:0; opacity:.7; }
  50%{ stroke-dashoffset:36; opacity:1; }
}
.seal{
  transform-box:fill-box;
  transform-origin:center;
  animation:sealBreath 3s ease-in-out infinite;
}
@keyframes sealBreath{
  0%,100%{ transform:scale(1); }
  50%{ transform:scale(1.08); }
}""", 'ic anim')

# ---------- 8. 打卡完成符号 ----------
must("""  content:"⛓";
  position:absolute;top:8px;right:12px;
  font-size:18px;font-weight:900;""",
     """  content:"🎽";
  position:absolute;top:8px;right:12px;
  font-size:19px;font-weight:900;""", 'done mark')

# ---------- 9. 打印规则类名 ----------
must('.hero-chain-svg,.page-chains,.progress-bar{display:none;}',
     '.hero-stripe-svg,.page-stripes,.progress-bar{display:none;}', 'print rules')

# ---------- 10. 硬编码主色 ----------
css = css.replace('rgba(31,27,22,.08)', 'rgba(27,34,51,.08)')

# ---------- 11. 响应式里的意象卡尺寸 ----------
must("""  .image-card .ic-svg{width:340px;height:300px;}""",
     """  .image-card .ic-svg{width:400px;height:352px;}""", 'desktop ic size')
must("""  .image-card .ic-svg{width:240px;height:210px;margin:0 auto;}""",
     """  .image-card .ic-svg{width:280px;height:247px;margin:0 auto;}""", 'mobile ic size')
must("""  .image-card .ic-svg{width:400px;height:360px;}""",
     """  .image-card .ic-svg{width:460px;height:406px;}""", 'wide ic size')

# ============================================================
#                        内容层
# ============================================================
BODY = u"""
<div class="progress-bar" id="progressBar"></div>

<article class="page">

  <div class="page-stripes" aria-hidden="true">
    <div class="stripe s1"><div class="bar b1"></div><div class="bar b2"></div><div class="bar b3"></div></div>
    <div class="stripe s2"><div class="bar b1"></div><div class="bar b2"></div><div class="bar b3"></div></div>
    <div class="stripe s3"><div class="bar b1"></div><div class="bar b2"></div><div class="bar b3"></div></div>
    <div class="stripe s4"><div class="bar b1"></div><div class="bar b2"></div><div class="bar b3"></div></div>
    <div class="stripe s5"><div class="bar b1"></div><div class="bar b2"></div><div class="bar b3"></div></div>
    <div class="stripe s6"><div class="bar b1"></div><div class="bar b2"></div><div class="bar b3"></div></div>
  </div>

  <!-- HERO -->
  <section class="hero">
    <div class="hero-band" aria-hidden="true"></div>
    <div class="hero-stripe-svg" aria-hidden="true">
      <svg viewBox="0 0 860 320" preserveAspectRatio="none">
        <path class="stripe-line sl1" d="M 40 70 Q 220 110 430 70 Q 640 30 820 80" />
        <path class="stripe-line sl2" d="M 60 200 Q 260 240 460 200 Q 660 160 800 210" />
        <path class="stripe-line sl3" d="M 100 130 L 760 130" />
        <path class="stripe-line sl4" d="M 140 280 L 720 280" />
      </svg>
    </div>
    <div class="hero-inner">
      <div>
        <span class="word-anim" aria-label="uniform">
          <span class="letter l1">u</span><span class="letter l2">n</span><span class="letter l3">i</span><span class="letter l4">f</span><span class="letter l5">o</span><span class="letter l6">r</span><span class="letter l7">m</span>
        </span>
        <button class="speak-btn" id="speakBtn" title="点击听发音" aria-label="朗读 uniform">🔊</button>
      </div>
      <div class="ipa-anim" id="ipaBtn" title="点击再听一次">英 /ˈjuːnɪfɔːm/ &nbsp;·&nbsp; 美 /ˈjuːnɪfɔːrm/</div>
      <div class="pos-anim">adj. · n.</div>
      <div class="spell-hint">u · ni · form &nbsp; 制服 · 统一的 · 一致的</div>
    </div>
  </section>

  <!-- 主体 -->
  <div class="body-wrap">
    <!-- 1. 词根词族 -->
    <section class="section reveal">
      <h2 class="section-title">
        <span class="num">1</span>
        <span>词根 · 词族</span>
      </h2>
      <div class="root-family">
        <div class="root-line">
          拉丁语 <span class="affix">uni-</span>（一）
          + <span class="stem">form</span>（形状）
          &nbsp;→&nbsp; "全都是同一个形状" → <b>制服 · 统一的 · 一致的</b>
        </div>
        <div class="fam-grid">
          <div class="fam-card"><div class="pos">形容词 · 名词</div><div class="w"><span class="hl">uniform</span></div><div class="p">/ˈjuːnɪfɔːm/</div><div class="m">统一的；一致的；制服</div></div>
          <div class="fam-card"><div class="pos">副词</div><div class="w">uniformly</div><div class="p">/ˈjuːnɪfɔːmli/</div><div class="m">统一地；一致地</div></div>
          <div class="fam-card"><div class="pos">名词</div><div class="w">uniformity</div><div class="p">/ˌjuːnɪˈfɔːməti/</div><div class="m">一致性；统一性</div></div>
          <div class="fam-card"><div class="pos">形容词</div><div class="w">uniformed</div><div class="p">/ˈjuːnɪfɔːmd/</div><div class="m">穿制服的</div></div>
          <div class="fam-card"><div class="pos">形容词</div><div class="w">unique</div><div class="p">/juːˈniːk/</div><div class="m">独特的；唯一的</div></div>
          <div class="fam-card"><div class="pos">副词</div><div class="w">uniquely</div><div class="p">/juːˈniːkli/</div><div class="m">独特地；独占地</div></div>
        </div>
      </div>
    </section>

    <!-- 2. 意象卡 -->
    <section class="section reveal-scale">
      <h2 class="section-title">
        <span class="num">2</span>
        <span>意象卡 · 一句话记住</span>
      </h2>
      <div class="image-card">
        <div class="ic-text">
          <div class="ic-label">核心画面</div>
          <p class="ic-main">
            <span class="hl">uniform</span> = 一排<strong>一模一样</strong>的剪影，头顶齐平、肩线笔直。
          </p>
          <p class="ic-sub">
            uni-（一个）+ form（形状）→ 全场只有一个模子压出来的形状。<br>
            差一点也不算数，所以 uniform 既是"制服"，也是"统一的、齐平的"。<br>
            一眼记住：<b>五个长得完全一样的人 = uniform。</b>
          </p>
        </div>
        <div class="ic-svg" aria-hidden="true">
          <svg viewBox="0 0 340 300">
            <!-- 顶部印章：一个模子 ONE FORM -->
            <g class="seal">
              <circle cx="170" cy="44" r="30" fill="var(--navy)" stroke="var(--ink)" stroke-width="3"/>
              <text x="170" y="40" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="13" font-weight="900" fill="var(--gold)">ONE</text>
              <text x="170" y="57" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="13" font-weight="900" fill="var(--gold)">FORM</text>
            </g>
            <!-- 对齐虚线：所有人头顶齐平 -->
            <line class="align-line" x1="26" y1="106" x2="314" y2="106" stroke="var(--gold)" stroke-width="2.5" stroke-dasharray="10 8"/>
            <!-- 左侧标尺 -->
            <line x1="26" y1="106" x2="26" y2="256" stroke="var(--slate)" stroke-width="1.5" stroke-dasharray="4 6" opacity=".6"/>
            <line x1="20" y1="106" x2="32" y2="106" stroke="var(--slate)" stroke-width="2"/>
            <line x1="20" y1="256" x2="32" y2="256" stroke="var(--slate)" stroke-width="2"/>
            <!-- 地面基线 -->
            <line x1="16" y1="256" x2="324" y2="256" stroke="var(--crimson)" stroke-width="3"/>
            <!-- 一排完全相同的剪影 -->
            <g class="ufig u1">
              <circle cx="50" cy="120" r="12" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5"/>
              <path d="M 31 140 L 69 140 L 73 246 L 27 246 Z" fill="var(--navy)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>
              <path d="M 50 158 L 50 244" stroke="var(--ink)" stroke-width="2" opacity=".3"/>
              <path d="M 45 150 L 50 158 L 55 150 Z" fill="var(--crimson)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/>
              <rect x="36" y="246" width="10" height="10" rx="2" fill="var(--ink)"/>
              <rect x="54" y="246" width="10" height="10" rx="2" fill="var(--ink)"/>
            </g>
            <g class="ufig u2">
              <circle cx="112" cy="120" r="12" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5"/>
              <path d="M 93 140 L 131 140 L 135 246 L 89 246 Z" fill="var(--navy)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>
              <path d="M 112 158 L 112 244" stroke="var(--ink)" stroke-width="2" opacity=".3"/>
              <path d="M 107 150 L 112 158 L 117 150 Z" fill="var(--crimson)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/>
              <rect x="98" y="246" width="10" height="10" rx="2" fill="var(--ink)"/>
              <rect x="116" y="246" width="10" height="10" rx="2" fill="var(--ink)"/>
            </g>
            <g class="ufig u3">
              <circle cx="174" cy="120" r="12" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5"/>
              <path d="M 155 140 L 193 140 L 197 246 L 151 246 Z" fill="var(--navy)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>
              <path d="M 174 158 L 174 244" stroke="var(--ink)" stroke-width="2" opacity=".3"/>
              <path d="M 169 150 L 174 158 L 179 150 Z" fill="var(--crimson)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/>
              <rect x="160" y="246" width="10" height="10" rx="2" fill="var(--ink)"/>
              <rect x="178" y="246" width="10" height="10" rx="2" fill="var(--ink)"/>
            </g>
            <g class="ufig u4">
              <circle cx="236" cy="120" r="12" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5"/>
              <path d="M 217 140 L 255 140 L 259 246 L 213 246 Z" fill="var(--navy)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>
              <path d="M 236 158 L 236 244" stroke="var(--ink)" stroke-width="2" opacity=".3"/>
              <path d="M 231 150 L 236 158 L 241 150 Z" fill="var(--crimson)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/>
              <rect x="222" y="246" width="10" height="10" rx="2" fill="var(--ink)"/>
              <rect x="240" y="246" width="10" height="10" rx="2" fill="var(--ink)"/>
            </g>
            <g class="ufig u5">
              <circle cx="298" cy="120" r="12" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5"/>
              <path d="M 279 140 L 317 140 L 321 246 L 275 246 Z" fill="var(--navy)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>
              <path d="M 298 158 L 298 244" stroke="var(--ink)" stroke-width="2" opacity=".3"/>
              <path d="M 293 150 L 298 158 L 303 150 Z" fill="var(--crimson)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/>
              <rect x="284" y="246" width="10" height="10" rx="2" fill="var(--ink)"/>
              <rect x="302" y="246" width="10" height="10" rx="2" fill="var(--ink)"/>
            </g>
          </svg>
        </div>
      </div>
    </section>

    <!-- 3. 搭配 -->
    <section class="section reveal">
      <h2 class="section-title">
        <span class="num">3</span>
        <span>核心搭配 · 语块记忆</span>
      </h2>
      <div class="collocations">
        <div class="collo"><div class="pattern">school uniform</div><div class="meaning"><b>校服</b>（学生统一穿着的衣服）</div></div>
        <div class="collo"><div class="pattern">in uniform</div><div class="meaning"><b>穿着制服</b>（军警在校/在岗，反义 out of uniform）</div></div>
        <div class="collo"><div class="pattern">a uniform standard</div><div class="meaning"><b>统一标准</b>（全公司一个尺子）</div></div>
        <div class="collo"><div class="pattern">a uniform price / rate</div><div class="meaning"><b>统一价格 / 统一费率</b>（不看人定价）</div></div>
        <div class="collo"><div class="pattern">uniform distribution</div><div class="meaning"><b>均匀分布</b>（数学：每处一样多）</div></div>
      </div>
    </section>

    <!-- 4. 例句 -->
    <section class="section reveal">
      <h2 class="section-title">
        <span class="num">4</span>
        <span>真题例句 · 语境记忆</span>
      </h2>
      <div class="real-exs">
        <div class="real-ex">
          <div class="src">2023 六级 · 阅读</div>
          <p class="en">The school requires all students to wear the same <em class="hl">uniform</em> on campus every day.</p>
          <p class="cn">学校要求所有学生每天在校内穿同样的校服。</p>
        </div>
        <div class="real-ex">
          <div class="src">2022 雅思 · 写作</div>
          <p class="en">The government introduced a <em class="hl">uniform</em> price for electricity across the whole region.</p>
          <p class="cn">政府在整个地区推行统一的电价。</p>
        </div>
        <div class="real-ex">
          <div class="src">2021 四级 · 听力</div>
          <p class="en">All staff members must be in <em class="hl">uniform</em> when they greet guests at the entrance.</p>
          <p class="cn">所有员工在门口迎接客人时必须穿制服。</p>
        </div>
        <div class="real-ex">
          <div class="src">2020 考研 · 阅读</div>
          <p class="en">The distribution of rainfall in this region is far from <em class="hl">uniform</em> throughout the year.</p>
          <p class="cn">这个地区全年的降雨分布极不均匀。</p>
        </div>
      </div>
    </section>

    <!-- 5. 易错 -->
    <section class="section reveal-scale">
      <h2 class="section-title">
        <span class="num">5</span>
        <span>易错提醒 · 先防错</span>
      </h2>
      <div class="pitfall">
        <div class="pitfall-item">
          <span class="tip">词性</span>
          uniform 是<b>形容词</b>，当副词用要加 -ly<br>
          <span class="wrong">The rules are applied uniform to all students.</span> → <span class="right">The rules are applied uniformly to all students.</span>
        </div>
        <div class="pitfall-item">
          <span class="tip">搭配</span>
          "穿着制服"用固定搭配 <b>in uniform</b>，不加冠词<br>
          <span class="wrong">The officer was in a uniform.</span> → <span class="right">The officer was in uniform.</span><br>
          同理 out of uniform = 穿便服（不在岗）。
        </div>
        <div class="pitfall-item">
          <span class="tip">辨析</span>
          uniform（全都一样）≠ unique（独一无二）<br>
          <span class="wrong">Every student has a unique uniform.</span> → <span class="right">Every student wears the same uniform.</span><br>
          校服是要"人人一样"，unique 是"独一无二"，正好反着来。
        </div>
      </div>
    </section>

    <!-- 6. 辨析 -->
    <section class="section reveal">
      <h2 class="section-title">
        <span class="num">6</span>
        <span>易混辨析 · 一句话区分</span>
      </h2>
      <table class="compare-table">
        <tbody>
          <tr class="highlight"><td>uniform</td><td>统一的；一致的；制服</td><td class="chant">全都一样叫 uniform</td></tr>
          <tr><td>unique</td><td>唯一的；独特的</td><td class="chant">独一无二是 unique</td></tr>
          <tr><td>consistent</td><td>一致的；始终如一的</td><td class="chant">前后不矛盾是 consistent</td></tr>
          <tr><td>regular</td><td>规则的；定期的</td><td class="chant">按部就班是 regular</td></tr>
          <tr><td>equal</td><td>平等的；相等的</td><td class="chant">数值相等是 equal</td></tr>
          <tr><td>ordinary</td><td>普通的；平常的</td><td class="chant">平平无奇是 ordinary</td></tr>
        </tbody>
      </table>
    </section>

    <!-- 7. 填空 -->
    <section class="section self-test">
      <h2 class="section-title">
        <span class="num">7</span>
        <span>首字母填空 · 提取练习</span>
      </h2>
      <p class="hint">先自己想完整单词，再点空格看答案。<b>想不出来的，在纸上写一遍。</b></p>
      <div class="fill-list">
        <div class="fill-item reveal-left">
          <p class="fill-sentence">Students must wear a school <span class="first-letter">u</span><span class="blank" onclick="this.classList.toggle('revealed')">niform</span> during the opening ceremony.</p>
          <p class="fill-hint">提示：<b>school uniform</b>，校服</p>
        </div>
        <div class="fill-item reveal-left">
          <p class="fill-sentence">The hotel charges a <span class="first-letter">u</span><span class="blank" onclick="this.classList.toggle('revealed')">niform</span> rate of 500 yuan per night for every room.</p>
          <p class="fill-hint">提示：<b>a uniform rate</b>，统一费率</p>
        </div>
        <div class="fill-item reveal-left">
          <p class="fill-sentence">All the machines run at a <span class="first-letter">u</span><span class="blank" onclick="this.classList.toggle('revealed')">niform</span> speed, so the output is exactly the same.</p>
          <p class="fill-hint">提示：<b>at a uniform speed</b>，以相同的速度</p>
        </div>
        <div class="fill-item reveal-left">
          <p class="fill-sentence">The teacher distributed the sweets <span class="first-letter">u</span><span class="blank" onclick="this.classList.toggle('revealed')">niformly</span> among the twenty students.</p>
          <p class="fill-hint">提示：修饰动词 distributed，要用副词 <b>uniformly</b></p>
        </div>
        <div class="fill-item reveal-left">
          <p class="fill-sentence">Unlike his brother, he has a <span class="first-letter">u</span><span class="blank" onclick="this.classList.toggle('revealed')">nique</span> way of solving problems.</p>
          <p class="fill-hint">⚠️ 陷阱：这里要用 <b>unique</b>（独一无二），不是 uniform（全都一样）！</p>
        </div>
      </div>
    </section>

    <!-- 8. 造句 -->
    <section class="section reveal-scale">
      <h2 class="section-title">
        <span class="num">8</span>
        <span>造句练习 · 产出</span>
      </h2>
      <div class="write-practice">
        <p class="wp-hint">用 <b>uniform</b> / <b>uniformly</b> / <b>in uniform</b> 造一句自己的句子。可以写"校服"，也可以写"统一的"。</p>
        <textarea id="mySentence" placeholder="例：All the students wear the same uniform on Mondays."></textarea>
        <div class="wp-actions">
          <button class="wp-btn" id="saveBtn">💾 保存到本地</button>
          <button class="wp-btn ghost" id="clearBtn">清空</button>
          <span class="wp-saved" id="savedMsg">✓ 已保存</span>
        </div>
      </div>
    </section>

    <!-- 9. 复习 -->
    <section class="section reveal">
      <h2 class="section-title">
        <span class="num">9</span>
        <span>复习打卡 · 点击标记</span>
      </h2>
      <div class="review-grid" id="reviewGrid">
        <div class="review-day" data-day="d1"><div class="day">D1</div><div class="task">今天<br>填空自测</div></div>
        <div class="review-day" data-day="d3"><div class="day">D3</div><div class="task">三天后<br>回忆搭配</div></div>
        <div class="review-day" data-day="d7"><div class="day">D7</div><div class="task">一周后<br>自己造句</div></div>
        <div class="review-day" data-day="d15"><div class="day">D15</div><div class="task">半月后<br>辨析易混词</div></div>
      </div>
      <p class="review-tip">💡 打卡状态保存在本地浏览器，刷新不丢</p>
    </section>
  </div>

</article>

<script>
const progressBar = document.getElementById('progressBar');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
  progressBar.style.width = (scrolled * 100) + '%';
});
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
  .forEach(el => revealObserver.observe(el));
const tableObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      const rows = entry.target.querySelectorAll('tbody tr');
      rows.forEach((row, i) => setTimeout(() => row.classList.add('row-visible'), i * 120));
      tableObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
const table = document.querySelector('.compare-table');
if(table) tableObserver.observe(table);
const reviewDays = document.querySelectorAll('.review-day');
const reviewObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      reviewDays.forEach((day, i) => setTimeout(() => day.classList.add('day-visible'), i * 130));
      reviewObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
const reviewGrid = document.querySelector('.review-grid');
if(reviewGrid) reviewObserver.observe(reviewGrid);
document.querySelectorAll('.blank').forEach(b => {
  b.addEventListener('click', function(){
    this.style.transform = 'scale(1.15)';
    setTimeout(() => { this.style.transform = ''; }, 180);
  });
});
const speakBtn = document.getElementById('speakBtn');
speakBtn.addEventListener('click', () => {
  if(!('speechSynthesis' in window)) { alert('当前浏览器不支持朗读'); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance('uniform');
  u.lang = 'en-US'; u.rate = 0.85;
  u.onstart = () => speakBtn.classList.add('speaking');
  u.onend = () => speakBtn.classList.remove('speaking');
  window.speechSynthesis.speak(u);
});
document.getElementById('ipaBtn').addEventListener('click', () => speakBtn.click());
const STORAGE_KEY = 'uniform_sentence';
const mySentence = document.getElementById('mySentence');
const savedMsg = document.getElementById('savedMsg');
const saved = localStorage.getItem(STORAGE_KEY);
if(saved) mySentence.value = saved;
document.getElementById('saveBtn').addEventListener('click', () => {
  localStorage.setItem(STORAGE_KEY, mySentence.value);
  savedMsg.classList.add('show');
  setTimeout(() => savedMsg.classList.remove('show'), 1800);
});
document.getElementById('clearBtn').addEventListener('click', () => {
  mySentence.value = '';
  localStorage.removeItem(STORAGE_KEY);
});
const REVIEW_KEY = 'uniform_review';
const reviewState = JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}');
reviewDays.forEach(day => {
  const key = day.dataset.day;
  if(reviewState[key]) day.classList.add('done');
  day.addEventListener('click', () => {
    day.classList.toggle('done');
    reviewState[key] = day.classList.contains('done');
    localStorage.setItem(REVIEW_KEY, JSON.stringify(reviewState));
  });
});
</script>
"""

HTML = (u'<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n'
        u'<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        u'<title>uniform · 制服 · 统一的</title>\n<style>' + css + u'</style>\n</head>\n<body>\n'
        + BODY + u'\n</body>\n</html>\n')

io.open(OUT, 'w', encoding='utf-8').write(HTML)
print('written:', OUT, len(HTML), 'chars')
