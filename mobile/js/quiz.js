/* 自测：抽题、判题、结果 */

/* ============================================================
   自测：从 q 字段抽 10 题，判题规则与 index.html 完全一致
   ============================================================ */
let quizBuilt = false;
let quizOpen = false;
let quizPopIgnore = 0;   /* 自己发起的 back() 触发的 popstate，不重复处理 */
const quiz = {list:[], idx:0, right:0, wrong:0, answered:false};

function quizStat(){
  return Object.assign({rounds:0, total:0, right:0}, loadJSON(QUIZ_KEY, {}));
}
function quizNorm(s){
  return String(s == null ? '' : s).toLowerCase()
    .replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function quizPool(){
  const out = [];
  WORDS.forEach(w => {
    (w.q || []).forEach(item => {
      if(item && item.q && item.a) out.push({word:w.word, q:item.q, a:item.a, h:item.h || ''});
    });
  });
  return out;
}
function startQuiz(){
  quiz.list = shuffle(quizPool()).slice(0, 10);
  quiz.idx = 0; quiz.right = 0; quiz.wrong = 0; quiz.answered = false;
  renderQuizQuestion();
}

function renderQuiz(){
  const wrap = document.getElementById('quizWrap');
  if(!wrap) return;
  if(!quizBuilt){
    quizBuilt = true;
    wrap.innerHTML = '<div class="quiz-head"><span id="quizProg">首字母填空</span><span>✓ <b id="quizRight">0</b>　✗ <b id="quizWrong">0</b></span></div>' +
        '<div id="quizBody"></div>';
  }
  if(!quiz.list.length) startQuiz();
}

/* 顶栏按钮把自测抽屉从上方拉下来 */
function openQuiz(){
  renderQuiz();
  const sheet = document.getElementById('quizSheet');
  if(!sheet || quizOpen) return;
  quizOpen = true;
  /* 抽屉顶端对齐当前顶栏底边（顶栏会随安全区高度变化） */
  const hero = document.querySelector('.hero');
  if(hero) sheet.style.top = hero.offsetHeight + 'px';
  sheet.classList.add('open');
  sheet.setAttribute('aria-hidden', 'false');
  const btn = document.getElementById('quizToggle');
  if(btn) btn.setAttribute('aria-expanded', 'true');
  /* 压一条历史记录：手机返回键先收抽屉，而不是直接退出页面 */
  if(!history.state || !history.state.quizOpen){
    try{ history.pushState({quizOpen:1}, ''); }catch(e){}
  }
  sfxPlay('panelOpen');
}

function closeQuiz(){
  if(!quizOpen) return;
  quizOpen = false;
  const sheet = document.getElementById('quizSheet');
  if(sheet){
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
  }
  const btn = document.getElementById('quizToggle');
  if(btn) btn.setAttribute('aria-expanded', 'false');
  if(history.state && history.state.quizOpen){
    quizPopIgnore++;
    try{ history.back(); }catch(e){}
  }
  sfxPlay('panelClose');
}

function renderQuizQuestion(){
  const body = document.getElementById('quizBody');
  if(!body) return;
  if(quiz.idx >= quiz.list.length){ renderQuizResult(); return; }
  const item = quiz.list[quiz.idx];
  quiz.answered = false;
  const prog = document.getElementById('quizProg');
  const rightEl = document.getElementById('quizRight');
  const wrongEl = document.getElementById('quizWrong');
  if(prog) prog.textContent = '第 ' + (quiz.idx + 1) + ' / ' + quiz.list.length + ' 题';
  if(rightEl) rightEl.textContent = quiz.right;
  if(wrongEl) wrongEl.textContent = quiz.wrong;
  body.innerHTML = '<div class="quiz-card">' +
      '<span class="q-kicker">首字母填空 · ' + item.word + '</span>' +
      '<p class="q-sentence">' + item.q + '</p>' +
      '<input class="q-input" id="qInput" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="补全空格处的字母…" aria-label="补全空格">' +
      (item.h ? '<button class="q-btn ghost" type="button" data-hint style="margin-top:.5rem;font-size:.68rem;padding:.3rem .7rem;">看提示</button>' +
                '<p class="q-hint" id="qHint" hidden>' + item.h + '</p>' : '') +
      '<div class="q-foot"><span class="q-feed" id="qFeed"></span>' +
        '<button class="q-btn" type="button" id="qSubmit">检查</button></div>' +
    '</div>';
  const input = document.getElementById('qInput');
  if(input){
    /* 触屏设备不自动聚焦，避免切到自测就弹键盘；桌面键盘/鼠标环境才自动聚焦 */
    if(window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) input.focus();
    input.addEventListener('keydown', (e) => {
      if(e.key === 'Enter'){ e.preventDefault(); quiz.answered ? quizNext() : quizCheck(); }
    });
  }
}

function quizCheck(){
  if(quiz.answered) return;
  const input = document.getElementById('qInput');
  const item = quiz.list[quiz.idx];
  if(!input || !item) return;
  const val = quizNorm(input.value);
  if(!val){ input.focus(); return; }
  quiz.answered = true;

  const first = (item.q.match(/class="first-letter">([^<]*)</) || ['', ''])[1];
  const ok = val === quizNorm(item.a)
          || val === quizNorm(item.word)
          || val === quizNorm(first + item.a);
  if(ok) quiz.right++; else quiz.wrong++;
  sfxPlay(ok ? 'ok' : 'bad');

  const blank = document.querySelector('#quizBody .qz-blank');
  if(blank){ blank.textContent = item.a; blank.classList.add('on'); }
  input.disabled = true;

  const hint = document.getElementById('qHint');
  if(hint) hint.hidden = false;

  const fb = document.getElementById('qFeed');
  if(fb){
    fb.className = 'q-feed ' + (ok ? 'right' : 'wrong');
    fb.textContent = ok ? '✓ 正确' : '✗ 正确答案：' + item.a;
  }
  const rightEl = document.getElementById('quizRight');
  const wrongEl = document.getElementById('quizWrong');
  if(rightEl) rightEl.textContent = quiz.right;
  if(wrongEl) wrongEl.textContent = quiz.wrong;

  const btn = document.getElementById('qSubmit');
  btn.textContent = quiz.idx + 1 >= quiz.list.length ? '看结果' : '下一题';
  btn.classList.add('ghost');
  btn.focus();
}

function quizNext(){
  quiz.idx++;
  if(quiz.idx >= quiz.list.length) renderQuizResult();
  else { sfxPlay('tap'); renderQuizQuestion(); }
}

function renderQuizResult(){
  const body = document.getElementById('quizBody');
  if(!body) return;
  sfxPlay('done');
  const total = quiz.right + quiz.wrong;
  const rate = total ? Math.round(quiz.right / total * 100) : 0;
  const stat = quizStat();
  stat.rounds += 1; stat.total += total; stat.right += quiz.right;
  persist(QUIZ_KEY, stat);
  const hist = stat.total ? Math.round(stat.right / stat.total * 100) : 0;
  const prog = document.getElementById('quizProg');
  if(prog) prog.textContent = '本轮完成';
  body.innerHTML = '<div class="quiz-card">' +
      '<span class="q-kicker">本轮完成</span>' +
      '<p class="q-result-num">' + quiz.right + ' / ' + total + '</p>' +
      '<p class="q-result-sub">正确率 ' + rate + '% · 累计 ' + stat.right + ' / ' + stat.total +
        '（' + hist + '%，共 ' + stat.rounds + ' 轮）</p>' +
      '<div class="q-actions"><button class="q-btn ghost" type="button" data-quiz-back>回刷词</button>' +
        '<button class="q-btn" type="button" data-quiz-again>再来一轮</button></div>' +
    '</div>';
}
