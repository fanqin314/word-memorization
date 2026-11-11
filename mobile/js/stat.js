/* 数据页 + 顶部状态条 + 轻提示 + 贡献墙 */

/* ============================================================
   数据页
   ============================================================ */
function renderStat(){
  const view = document.getElementById('view-stat');
  const today = todayCount();
  const streak = streakDays();
  const due = WORDS.filter(w => rec(w.word).dueAt <= startOfDay(Date.now())).length;
  const m = [0,0,0];
  WORDS.forEach(w => m[masteryOf(w.word)]++);
  const stat = quizStat();
  const rate = stat.total ? Math.round(stat.right / stat.total * 100) : 0;
  const pct = n => Math.round(n / Math.max(1, WORDS.length) * 100);
  const checked = WORDS.filter(w => reviewDone(w.word) > 0).length;

  view.innerHTML = '<div class="stat-grid">' +
      '<div class="tile wide">' +
        '<span class="tk">今日已刷</span>' +
        '<span class="tv">' + today + '<small>/ ' + GOAL + ' 个</small></span>' +
        '<div class="mst-bar" style="margin-top:.4rem;"><span class="track">' +
          '<i class="fill" style="width:' + Math.min(100, today / GOAL * 100) + '%;--bc:var(--ac);"></i></span></div>' +
        '<p class="ts">' + (today >= GOAL ? '今天已经达标，明天记得回来。' : '轻量目标：每天 10 个，刷完就收工。') + '</p>' +
      '</div>' +
      '<div class="tile wide cw-tile">' +
        '<span class="tk">刷词贡献墙<em class="cw-win">近 ' + CW_WEEKS + ' 周</em></span>' +
        '<div class="cw-scroll" id="cwScroll"><div class="cw-inner">' +
          '<div class="cw-months" id="cwMonths"></div>' +
          '<div class="cw-body">' +
            '<div class="cw-days"><span></span><span>一</span><span></span><span>三</span><span></span><span>五</span><span></span></div>' +
            '<div class="cw-grid" id="cwGrid"></div>' +
          '</div>' +
        '</div></div>' +
        '<div class="cw-foot">' +
          '<span class="cw-sum" id="cwSum"></span>' +
          '<span class="cw-legend">少<i class="cw-cell lv0"></i><i class="cw-cell lv1"></i><i class="cw-cell lv2"></i><i class="cw-cell lv3"></i><i class="cw-cell lv4"></i>多</span>' +
        '</div>' +
      '</div>' +
      '<div class="tile"><span class="tk">连续学习</span><span class="tv">' + streak + '<small>天</small></span>' +
        '<p class="ts">' + (streak > 1 ? '保持住，别断。' : '今天开个头。') + '</p></div>' +
      '<div class="tile"><span class="tk">待复习</span><span class="tv">' + due + '<small>个</small></span>' +
        '<p class="ts">' + (due ? '刷词时会优先出现。' : '暂时没有到期的。') + '</p></div>' +
      '<div class="tile wide"><span class="tk">掌握度分布</span>' +
        '<div class="mst-bars">' +
          '<div class="mst-bar"><span class="lab">未学</span><span class="track"><i class="fill" style="width:' + pct(m[0]) + '%;--bc:#8A8378;"></i></span><span class="num">' + m[0] + '</span></div>' +
          '<div class="mst-bar"><span class="lab">学习中</span><span class="track"><i class="fill" style="width:' + pct(m[1]) + '%;--bc:var(--amber);"></i></span><span class="num">' + m[1] + '</span></div>' +
          '<div class="mst-bar"><span class="lab">已掌握</span><span class="track"><i class="fill" style="width:' + pct(m[2]) + '%;--bc:var(--moss);"></i></span><span class="num">' + m[2] + '</span></div>' +
        '</div>' +
        '<p class="ts">共 ' + WORDS.length + ' 个词 · 已打卡 ' + checked + ' 个</p>' +
      '</div>' +
      '<div class="tile"><span class="tk">累计刷词</span><span class="tv">' + (mb.total || 0) + '<small>次</small></span>' +
        '<p class="ts">每点一次掌握度记一次</p></div>' +
      '<div class="tile"><span class="tk">自测</span><span class="tv">' + rate + '<small>%</small></span>' +
        '<p class="ts">' + stat.right + ' / ' + stat.total + ' 题 · ' + stat.rounds + ' 轮</p></div>' +
    '</div>' +
    '<p class="stat-note">数据与电脑版工作站共用同一份本机记录</p>' +
    '<div class="link-row"><a class="big-link" href="../index.html">打开电脑版工作站' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>' +
    '</a></div>';
  renderWall();
}

/* ============================================================
   顶栏 / 贡献墙 / 轻提示
   ============================================================ */
let toastTimer = null;
function toast(msg){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

/* 贡献墙：近 26 周，每列一周、每格一天；颜色深浅按当天刷词量 */
const CW_WEEKS = 26;
const CW_STEP = 13; /* 10px 方块 + 3px 间隔 */
function cwLevel(n){
  if(!n) return 0;
  if(n < 5) return 1;
  if(n < 10) return 2;
  if(n < 20) return 3;
  return 4;
}
function renderWall(){
  const host = document.getElementById('cwGrid');
  if(!host) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - (CW_WEEKS - 1) * 7);
  const todayK = keyOf(today);
  let cells = '', active = 0, total = 0;
  const marks = [];
  let lastMonth = -1, lastCol = -99;
  for(let c = 0; c < CW_WEEKS; c++){
    const col = new Date(start);
    col.setDate(start.getDate() + c * 7);
    const mth = col.getMonth();
    /* 月份标：同月只在首次出现处标一次，且与上一个标至少隔 3 列 */
    if(mth !== lastMonth && c - lastCol >= 3){
      marks.push({col: c, label: String(mth + 1) + '月'});
      lastMonth = mth; lastCol = c;
    }
    for(let r = 0; r < 7; r++){
      const d = new Date(start);
      d.setDate(start.getDate() + c * 7 + r);
      if(d > today){ cells += '<i class="cw-cell future"></i>'; continue; }
      const k = keyOf(d);
      const n = mb.days[k] || 0;
      if(n){ active++; total += n; }
      cells += '<i class="cw-cell lv' + cwLevel(n) + (k === todayK ? ' today' : '') +
          '" data-day="' + k + '" data-n="' + n + '" title="' + k + ' · ' + n + ' 个"></i>';
    }
  }
  host.innerHTML = cells;
  const monthHost = document.getElementById('cwMonths');
  if(monthHost){
    monthHost.style.width = (CW_WEEKS * CW_STEP - 3) + 'px';
    monthHost.innerHTML = marks.map(m =>
      '<span style="left:' + (m.col * CW_STEP) + 'px">' + m.label + '</span>').join('');
  }
  const sum = document.getElementById('cwSum');
  if(sum) sum.innerHTML = '共 <b>' + active + '</b> 天 · <b>' + total + '</b> 次';
  const scroller = document.getElementById('cwScroll');
  if(scroller) scroller.scrollLeft = scroller.scrollWidth; /* 默认停在最近这一周 */
}

function refreshHeader(){
  const today = todayCount();
  const num = document.getElementById('todayNum');
  const fill = document.getElementById('goalFill');
  const tip = document.getElementById('goalTip');
  if(num) num.textContent = today;
  if(fill) fill.style.width = Math.min(100, today / GOAL * 100) + '%';
  if(tip){
    tip.textContent = today === 0 ? '刷一张就热身'
      : today >= GOAL ? '今日达成 · 继续也不亏'
      : '再刷 ' + (GOAL - today) + ' 个就收工';
  }
  renderWall();
}
