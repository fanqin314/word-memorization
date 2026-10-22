# -*- coding: utf-8 -*-
"""
formal 单词卡构建器（v2 修正版）
修正内容（对齐全库约定）：
  1. fam-card  9 -> 6
  2. pitfall   4 -> 3
  3. .hl 只标 1 个词（放本词 formal 自身）
  4. review-day 形状 radius -> blob
  5. 字母动画/意象卡动画/漂浮装饰 全部回归 union 骨架结构
基底 = union.html 的 CSS 骨架
"""
import re, io

BASE = 'D:/apt/英语单词/union.html'
OUT  = 'D:/apt/英语单词/formal.html'

src = io.open(BASE, encoding='utf-8').read()
css = src[src.index('<style>') + 7: src.index('</style>')]

for a, b in (('--mustard', '--gold'), ('--brick', '--crimson'), ('--plum', '--navy')):
    css = css.replace(a, b)

def must(old, new, label):
    global css
    assert old in css, 'NOT FOUND: ' + label
    css = css.replace(old, new, 1)

# ---------- 1. :root 晚宴色板 ----------
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
  /* 晚宴色板 —— formal = 燕尾服 / 领结 / 红毯 / 正式场合 */
  --paper:#F6F2E9;
  --paper-2:#EAE4D4;
  --ink:#191E33;
  --gold:#C9A227;
  --gold-soft:#F4E9C4;
  --crimson:#8E2340;
  --crimson-soft:#F3DBE1;
  --olive:#4F6B52;
  --olive-soft:#DCE6DC;
  --slate:#5A6B8C;
  --slate-soft:#DDE2F0;
  --navy:#232B4D;
  --navy-soft:#DCE0EE;
""", ':root')

# ---------- 2. body 背景 ----------
must('background:#15120E;', 'background:#0E1220;', 'body bg')
must("""    radial-gradient(circle at 15% 12%, rgba(232,179,60,.22) 0, transparent 42%),
    radial-gradient(circle at 85% 88%, rgba(201,82,74,.20) 0, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(74,107,138,.14) 0, transparent 60%);""",
     """    radial-gradient(circle at 15% 12%, rgba(201,162,39,.20) 0, transparent 42%),
    radial-gradient(circle at 85% 88%, rgba(142,35,64,.22) 0, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(35,43,77,.20) 0, transparent 60%);""", 'body bg grad')

# ---------- 3. 全页纹理：链条 → 绸缎斜纹 ----------
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
"""/* 全页：晚宴绸缎斜纹 */
body::before{
  content:"";
  position:fixed;inset:0;
  pointer-events:none;z-index:0;
  background-image:
    repeating-linear-gradient(135deg,
      transparent 0 56px,
      rgba(201,162,39,.05) 56px 58px,
      transparent 58px 112px),
    repeating-linear-gradient(45deg,
      transparent 0 78px,
      rgba(142,35,64,.05) 78px 80px,
      transparent 80px 156px);
  animation:satinShift 50s linear infinite;
}
@keyframes satinShift{
  to{ background-position:112px 0, -156px 0; }
}""", 'body satin')

# ---------- 4. 漂浮装饰：链条环 → 领结 ----------
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
"""/* 漂浮的领结 */
.page-bows{
  position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden;
}
.bow{
  position:absolute;
  width:22px;height:17px;
  opacity:0;
  clip-path:polygon(0 0,44% 26%,44% 74%,0 100%,100% 100%,56% 74%,56% 26%,100% 0);
  animation:bowDrift linear infinite;
}
.bow.b1{ left:8%;  bottom:-40px; animation-duration:28s; background:var(--gold); }
.bow.b2{ left:24%; bottom:-60px; animation-duration:36s; animation-delay:4s;  background:var(--crimson); }
.bow.b3{ left:38%; bottom:-50px; animation-duration:26s; animation-delay:12s; background:var(--navy); }
.bow.b4{ left:52%; bottom:-70px; animation-duration:32s; animation-delay:6s;  background:var(--slate); }
.bow.b5{ left:78%; bottom:-45px; animation-duration:30s; animation-delay:2s;  background:var(--crimson); }
.bow.b6{ left:90%; bottom:-30px; animation-duration:34s; animation-delay:8s;  background:var(--gold); }
.bow.b7{ left:66%; bottom:-55px; animation-duration:29s; animation-delay:10s; background:var(--olive); }

@keyframes bowDrift{
  0%{ transform:translateY(0) rotate(0); opacity:0; }
  10%{ opacity:.8; }
  50%{ transform:translateY(-50vh) rotate(200deg); }
  90%{ opacity:.4; }
  100%{ transform:translateY(-118vh) rotate(360deg); opacity:0; }
}""", 'page-bows')

# ---------- 5. Hero 装饰：链条 SVG → 缎带弧线 SVG ----------
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
"""/* HERO 缎带弧线 SVG */
.hero-ribbon-svg{
  position:absolute;
  inset:0;
  pointer-events:none;
  z-index:0;
  opacity:.65;
}
.hero-ribbon-svg svg{ width:100%; height:100%; }
.ribbon-line{
  fill:none;
  stroke-linecap:round;
  stroke-dasharray:440;
  stroke-dashoffset:440;
  animation:ribbonDraw 3s ease-out forwards;
}
.ribbon-line.rl1{ stroke:var(--gold);    stroke-width:3.5; animation-delay:.2s; }
.ribbon-line.rl2{ stroke:var(--crimson); stroke-width:3;   animation-delay:.6s; }
.ribbon-line.rl3{ stroke:var(--olive);   stroke-width:2.5; animation-delay:1s; }
.ribbon-line.rl4{ stroke:var(--slate);   stroke-width:2.5; animation-delay:1.4s; }
@keyframes ribbonDraw{ to{ stroke-dashoffset:0; } }""", 'hero ribbon')

# ---------- 6. 字母动画：链条串入 → 追光逐位点亮 ----------
must("""/* 字母像链条一样依次串入 */
.word-anim .l1{ animation-delay:.15s; color:var(--gold); }
.word-anim .l2{ animation-delay:.30s; color:var(--crimson); }
.word-anim .l3{ animation-delay:.45s; color:var(--olive); }
.word-anim .l4{ animation-delay:.60s; color:var(--slate); }
.word-anim .l5{ animation-delay:.75s; color:var(--navy); }
@keyframes letterChain{""",
"""/* 字母像礼堂灯泡一样逐个点亮 */
.word-anim .l1{ animation-delay:.15s; color:var(--gold); }
.word-anim .l2{ animation-delay:.30s; color:var(--crimson); }
.word-anim .l3{ animation-delay:.45s; color:var(--olive); }
.word-anim .l4{ animation-delay:.60s; color:var(--slate); }
.word-anim .l5{ animation-delay:.75s; color:var(--navy); }
.word-anim .l6{ animation-delay:.90s; color:var(--gold); }
@keyframes letterSpot{""", 'letter anim')
css = css.replace('animation:letterChain 1.1s', 'animation:letterSpot 1.1s', 1)

# ---------- 7. 意象卡：环形链条 → 企鹅燕尾服徽章 ----------
must('  grid-template-columns:1fr 280px;', '  grid-template-columns:1fr 340px;', 'ic grid')
must("""  background:linear-gradient(120deg,transparent 30%,rgba(232,179,60,.16) 50%,transparent 70%);""",
     """  background:linear-gradient(120deg,transparent 30%,rgba(201,162,39,.18) 50%,transparent 70%);""", 'ic sheen')
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
"""/* 意象卡 SVG 动画 —— 企鹅徽章 + 五个一模一样的领结 */
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
  transform-origin:170px 150px;
  animation:ringSpin 20s linear infinite;
}
@keyframes ringSpin{
  to{ transform:rotate(360deg); }
}
.center-label{
  animation:centerBreath 2.8s ease-in-out infinite;
  transform-origin:170px 150px;
}
@keyframes centerBreath{
  0%,100%{ transform:scale(1); }
  50%{ transform:scale(1.08); }
}
.mini-bow{
  animation:shine 2s ease-in-out infinite;
  transform-origin:center;
}
@keyframes shine{
  0%,100%{ opacity:.55; }
  50%{ opacity:1; }
}""", 'ic anim')

# ---------- 8. 打卡完成符号 ----------
must("""  content:"⛓";
  position:absolute;top:8px;right:12px;
  font-size:18px;font-weight:900;""",
     """  content:"✓";
  position:absolute;top:8px;right:12px;
  font-size:20px;font-weight:900;""", 'done mark')

# ---------- 9. 打印规则类名 ----------
must('.hero-chain-svg,.page-chains,.progress-bar{display:none;}',
     '.hero-ribbon-svg,.page-bows,.progress-bar{display:none;}', 'print rules')

css = css.replace('rgba(31,27,22,.08)', 'rgba(25,30,51,.08)')

# ---------- 10. 响应式意象卡尺寸 ----------
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

  <div class="page-bows" aria-hidden="true">
    <div class="bow b1"></div>
    <div class="bow b2"></div>
    <div class="bow b3"></div>
    <div class="bow b4"></div>
    <div class="bow b5"></div>
    <div class="bow b6"></div>
    <div class="bow b7"></div>
  </div>

  <!-- HERO -->
  <section class="hero">
    <div class="hero-band" aria-hidden="true"></div>
    <div class="hero-ribbon-svg" aria-hidden="true">
      <svg viewBox="0 0 860 320" preserveAspectRatio="none">
        <path class="ribbon-line rl1" d="M 40 80 Q 230 20 430 80 Q 630 140 820 70" />
        <path class="ribbon-line rl2" d="M 60 210 Q 250 270 460 210 Q 660 150 800 220" />
        <path class="ribbon-line rl3" d="M 100 140 L 760 140" />
        <path class="ribbon-line rl4" d="M 150 280 L 710 280" />
      </svg>
    </div>
    <div class="hero-inner">
      <div>
        <span class="word-anim" aria-label="formal">
          <span class="letter l1">f</span><span class="letter l2">o</span><span class="letter l3">r</span><span class="letter l4">m</span><span class="letter l5">a</span><span class="letter l6">l</span>
        </span>
        <button class="speak-btn" id="speakBtn" title="点击听发音" aria-label="朗读 formal">🔊</button>
      </div>
      <div class="ipa-anim" id="ipaBtn" title="点击再听一次">英 /ˈfɔːml/ &nbsp;·&nbsp; 美 /ˈfɔːrml/</div>
      <div class="pos-anim">adj.</div>
      <div class="spell-hint">form + al &nbsp; 正式的 · 正规的</div>
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
          拉丁语 <span class="stem">forma</span>（形状 · 形式）
          + <span class="affix">-al</span>（…的）
          &nbsp;→&nbsp; "合于形式规格的" → <b>正式的 · 正规的</b>
        </div>
        <div class="fam-grid">
          <div class="fam-card"><div class="pos">形容词</div><div class="w"><span class="hl">formal</span></div><div class="p">/ˈfɔːml/</div><div class="m">正式的；正规的</div></div>
          <div class="fam-card"><div class="pos">副词</div><div class="w">formally</div><div class="p">/ˈfɔːməli/</div><div class="m">正式地</div></div>
          <div class="fam-card"><div class="pos">名词</div><div class="w">formality</div><div class="p">/fɔːˈmæləti/</div><div class="m">礼节；手续（用复数）</div></div>
          <div class="fam-card"><div class="pos">名词 · 动词</div><div class="w">form</div><div class="p">/fɔːm/</div><div class="m">形式；表格；形成</div></div>
          <div class="fam-card"><div class="pos">形容词</div><div class="w">informal</div><div class="p">/ɪnˈfɔːml/</div><div class="m">非正式的（反义）</div></div>
          <div class="fam-card"><div class="pos">副词</div><div class="w">formerly</div><div class="p">/ˈfɔːməli/</div><div class="m">以前，曾经（形近陷阱）</div></div>
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
            <span class="hl">formal</span> = 一只穿着<strong>燕尾服</strong>的企鹅——全世界唯一"随时穿正装"的动物。
          </p>
          <p class="ic-sub">
            请柬上写 dress code: formal，就是"请穿正装"；<br>
            正式场合说 formal English，别张口就是 slang。<br>
            一眼记住：<b>燕尾服一穿、领结一打 = formal；<br>
            T 恤拖鞋一上身 = informal。</b>
          </p>
        </div>
        <div class="ic-svg" aria-hidden="true">
          <svg viewBox="0 0 340 300">
            <defs>
              <clipPath id="medallionClip">
                <circle cx="170" cy="150" r="54"/>
              </clipPath>
            </defs>
            <!-- 五个一模一样的领结：全场统一着装 -->
            <g opacity=".95">
              <circle class="ring-chain rc1" cx="170" cy="46"  r="20"/>
              <circle class="ring-chain rc2" cx="269" cy="118" r="20"/>
              <circle class="ring-chain rc3" cx="231" cy="234" r="20"/>
              <circle class="ring-chain rc4" cx="109" cy="234" r="20"/>
              <circle class="ring-chain rc5" cx="71"  cy="118" r="20"/>
            </g>
            <g class="mini-bow">
              <path d="M 170 38 L 162 33 L 162 45 Z" fill="var(--gold)"/>
              <path d="M 170 38 L 178 33 L 178 45 Z" fill="var(--gold)"/>
              <path d="M 269 110 L 261 105 L 261 117 Z" fill="var(--crimson)"/>
              <path d="M 269 110 L 277 105 L 277 117 Z" fill="var(--crimson)"/>
              <path d="M 231 226 L 223 221 L 223 233 Z" fill="var(--olive)"/>
              <path d="M 231 226 L 239 221 L 239 233 Z" fill="var(--olive)"/>
              <path d="M 109 226 L 101 221 L 101 233 Z" fill="var(--slate)"/>
              <path d="M 109 226 L 117 221 L 117 233 Z" fill="var(--slate)"/>
              <path d="M 71 110 L 63 105 L 63 117 Z" fill="var(--navy)"/>
              <path d="M 71 110 L 79 105 L 79 117 Z" fill="var(--navy)"/>
            </g>
            <!-- 虚线连接：五个领结同属一个正式场合 -->
            <g opacity=".5">
              <line x1="170" y1="66"  x2="170" y2="96"  stroke="var(--gold)" stroke-width="2" stroke-dasharray="3 4"/>
              <line x1="250" y1="123" x2="216" y2="135" stroke="var(--crimson)" stroke-width="2" stroke-dasharray="3 4"/>
              <line x1="216" y1="222" x2="204" y2="196" stroke="var(--olive)" stroke-width="2" stroke-dasharray="3 4"/>
              <line x1="124" y1="222" x2="136" y2="196" stroke="var(--slate)" stroke-width="2" stroke-dasharray="3 4"/>
              <line x1="90"  y1="123" x2="124" y2="135" stroke="var(--navy)" stroke-width="2" stroke-dasharray="3 4"/>
            </g>
            <!-- 中心旋转虚线圆 -->
            <circle class="center-ring" cx="170" cy="150" r="86"/>
            <!-- 企鹅徽章 -->
            <g class="center-label">
              <circle cx="170" cy="150" r="54" fill="var(--navy)" stroke="var(--ink)" stroke-width="3"/>
              <g clip-path="url(#medallionClip)">
                <!-- 礼帽 -->
                <rect x="148" y="100" width="44" height="24" rx="4" fill="#0B0F1E" stroke="#F6F2E9" stroke-width="2"/>
                <rect x="140" y="122" width="60" height="7" rx="3.5" fill="#0B0F1E" stroke="#F6F2E9" stroke-width="2"/>
                <!-- 头 -->
                <circle cx="170" cy="144" r="21" fill="#0B0F1E" stroke="#F6F2E9" stroke-width="2.5"/>
                <ellipse cx="170" cy="149" rx="13" ry="11" fill="#F6F2E9"/>
                <circle cx="164" cy="142" r="2.6" fill="#0B0F1E"/>
                <circle cx="176" cy="142" r="2.6" fill="#0B0F1E"/>
                <path d="M 164 150 L 176 150 L 170 158 Z" fill="#C9A227" stroke="#0B0F1E" stroke-width="1.2" stroke-linejoin="round"/>
                <!-- 身体 -->
                <path d="M 150 162 Q 170 154 190 162 L 197 210 L 143 210 Z" fill="#0B0F1E" stroke="#F6F2E9" stroke-width="2.5" stroke-linejoin="round"/>
                <ellipse cx="170" cy="188" rx="18" ry="22" fill="#F6F2E9"/>
                <!-- 领结 -->
                <path d="M 170 166 L 157 159 L 157 174 Z" fill="#8E2340" stroke="#0B0F1E" stroke-width="1.6" stroke-linejoin="round"/>
                <path d="M 170 166 L 183 159 L 183 174 Z" fill="#8E2340" stroke="#0B0F1E" stroke-width="1.6" stroke-linejoin="round"/>
                <rect x="166" y="160" width="8" height="13" rx="2.5" fill="#6E1730" stroke="#0B0F1E" stroke-width="1.4"/>
              </g>
            </g>
            <!-- 底部说明 -->
            <text x="170" y="240" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="13" font-weight="900" fill="var(--gold)" letter-spacing="2">DRESS CODE</text>
            <text x="170" y="262" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="18" font-weight="900" fill="var(--crimson)" letter-spacing="1">FORMAL</text>
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
        <div class="collo"><div class="pattern">formal dress / attire</div><div class="meaning"><b>正装</b>（请柬常见 dress code: formal）</div></div>
        <div class="collo"><div class="pattern">formal invitation</div><div class="meaning"><b>正式邀请</b>（函件 · 请柬）</div></div>
        <div class="collo"><div class="pattern">formal education</div><div class="meaning"><b>正规教育</b>（区别于"自学成才"）</div></div>
        <div class="collo"><div class="pattern">formal language</div><div class="meaning"><b>正式用语</b>（书面 · 官方场合）</div></div>
        <div class="collo"><div class="pattern">in formal terms</div><div class="meaning">用<b>正式措辞</b>说（若用普通话说）</div></div>
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
          <p class="en">The two sides finally reached a <em class="hl">formal</em> agreement after months of negotiation.</p>
          <p class="cn">双方经过数月谈判，最终达成正式协议。</p>
        </div>
        <div class="real-ex">
          <div class="src">2022 雅思 · 写作</div>
          <p class="en"><em class="hl">Formal</em> letters usually begin with "Dear Sir or Madam" and avoid contractions.</p>
          <p class="cn">正式信件通常以"Dear Sir or Madam"开头，并避免使用缩略形式。</p>
        </div>
        <div class="real-ex">
          <div class="src">2021 四级 · 听力</div>
          <p class="en">The invitation states that guests should wear <em class="hl">formal</em> dress.</p>
          <p class="cn">邀请函上注明，客人应着正装出席。</p>
        </div>
        <div class="real-ex">
          <div class="src">2020 考研 · 阅读</div>
          <p class="en">He had no <em class="hl">formal</em> training in engineering, yet he became a skilled technician.</p>
          <p class="cn">他从未接受过工程方面的正规培训，却成了一名熟练的技术员。</p>
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
          formal 是<b>形容词</b>，当副词用要加 -ly<br>
          <span class="wrong">He spoke formal at the press conference.</span> → <span class="right">He spoke formally at the press conference.</span>
        </div>
        <div class="pitfall-item">
          <span class="tip">形近</span>
          <b>formal</b>（正式的）· <b>formerly</b>（以前）—— 发音几乎一样，意思完全相反<br>
          <span class="wrong">Formally, he was a taxi driver.</span> → <span class="right">Formerly, he was a taxi driver.</span><br>
          他<b>以前</b>是出租车司机——表"以前"要用 formerly。
        </div>
        <div class="pitfall-item">
          <span class="tip">单复数</span>
          表示"手续"时，formality 要用<b>复数</b><br>
          <span class="wrong">complete the legal formality</span> → <span class="right">complete the legal formalities</span><br>
          办理法律手续：go through the legal formalities。
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
          <tr class="highlight"><td>formal</td><td>正式的（场合/着装/语言）</td><td class="chant">正装礼服用 formal</td></tr>
          <tr><td>informal</td><td>非正式的</td><td class="chant">轻松随意 informal</td></tr>
          <tr><td>casual</td><td>随意的（口语，多指衣着）</td><td class="chant">衣着随便 casual</td></tr>
          <tr><td>official</td><td>官方的（权力背书）</td><td class="chant">官方授权 official</td></tr>
          <tr><td>ceremonial</td><td>礼仪的、仪式的</td><td class="chant">典礼仪式 ceremonial</td></tr>
          <tr><td>consistent</td><td>始终如一的；前后一致的</td><td class="chant">一贯到底 consistent</td></tr>
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
          <p class="fill-sentence">The invitation asks all guests to come in <span class="first-letter">f</span><span class="blank" onclick="this.classList.toggle('revealed')">ormal</span> dress.</p>
          <p class="fill-hint">提示：<b>in formal dress</b>，穿正装</p>
        </div>
        <div class="fill-item reveal-left">
          <p class="fill-sentence">The agreement was signed <span class="first-letter">f</span><span class="blank" onclick="this.classList.toggle('revealed')">ormally</span> by both sides.</p>
          <p class="fill-hint">提示：修饰动词 signed，要用副词 <b>formally</b></p>
        </div>
        <div class="fill-item reveal-left">
          <p class="fill-sentence">In legal <span class="first-letter">f</span><span class="blank" onclick="this.classList.toggle('revealed')">ormalities</span>, you must follow the fixed procedures.</p>
          <p class="fill-hint">⚠️ 陷阱："手续"要用复数 <b>formalities</b></p>
        </div>
        <div class="fill-item reveal-left">
          <p class="fill-sentence">He was <span class="first-letter">F</span><span class="blank" onclick="this.classList.toggle('revealed')">ormerly</span> a taxi driver before he became a teacher.</p>
          <p class="fill-hint">⚠️ 陷阱：这里要用 <b>formerly</b>（以前），不是 formal！</p>
        </div>
        <div class="fill-item reveal-left">
          <p class="fill-sentence">The professor's <span class="first-letter">f</span><span class="blank" onclick="this.classList.toggle('revealed')">ormal</span> manner impressed the interviewers.</p>
          <p class="fill-hint">提示：<b>a formal manner</b>，正式的举止</p>
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
        <p class="wp-hint">用 <b>formal</b> / <b>formally</b> / <b>informal</b> 造一句自己的句子。想想：你上一次穿正装，是什么场合？</p>
        <textarea id="mySentence" placeholder="例：We received a formal invitation to the graduation ceremony, so I had to buy a suit."></textarea>
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
  const u = new SpeechSynthesisUtterance('formal');
  u.lang = 'en-US'; u.rate = 0.85;
  u.onstart = () => speakBtn.classList.add('speaking');
  u.onend = () => speakBtn.classList.remove('speaking');
  window.speechSynthesis.speak(u);
});
document.getElementById('ipaBtn').addEventListener('click', () => speakBtn.click());
const STORAGE_KEY = 'formal_sentence';
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
const REVIEW_KEY = 'formal_review';
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
        u'<title>formal · 正式的</title>\n<style>' + css + u'</style>\n</head>\n<body>\n'
        + BODY + u'\n</body>\n</html>\n')

# ---------- 收尾：主题类名去 union 残留 ----------
for a, b in (('ring-chain', 'bow-ring'), ('chainPulse', 'bowPulse')):
    HTML = HTML.replace(a, b)
for i in range(1, 6):
    HTML = HTML.replace('rc%d' % i, 'br%d' % i)

io.open(OUT, 'w', encoding='utf-8').write(HTML)
print('written:', OUT, len(HTML), 'chars')
