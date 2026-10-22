/* ==========================================================================
   card-base.js —— 单词卡公共脚本（44 张卡共享）
   --------------------------------------------------------------------------
   卡片只需在 <body data-word="单词"> 上声明单词，其余交互全部自动接管：
     · 阅读进度条        .progress-bar#progressBar
     · 分段入场          .reveal / .reveal-left / .reveal-right / .reveal-scale
     · 辨析表逐行出现     .compare-table
     · 打卡逐个出现       .review-grid > .review-day
     · 填空点击显示答案   .blank
     · 朗读              #speakBtn / #ipaBtn
     · 造句本地保存       #mySentence / #saveBtn / #clearBtn / #savedMsg
     · 复习打卡持久化     .review-day[data-day]
   存储键沿用 <单词>_sentence 与 <单词>_review，与旧卡片数据兼容。
   ========================================================================== */
(function () {
  'use strict';

  var body = document.body;
  var WORD = (body.getAttribute('data-word') || (document.title.split('·')[0] || '')).trim();
  if (!WORD) return;

  /* ---------- 阅读进度条 ---------- */
  var progressBar = document.getElementById('progressBar');
  if (progressBar) {
    window.addEventListener('scroll', function () {
      var h = document.documentElement;
      var scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      progressBar.style.width = (scrolled * 100) + '%';
    }, { passive: true });
  }

  /* ---------- 分段入场 ---------- */
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
      .forEach(function (el) { revealObserver.observe(el); });

    /* ---------- 辨析表逐行 ---------- */
    var tableObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('tbody tr').forEach(function (row, i) {
            setTimeout(function () { row.classList.add('row-visible'); }, i * 120);
          });
          tableObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    var table = document.querySelector('.compare-table');
    if (table) tableObserver.observe(table);

    /* ---------- 打卡逐个 ---------- */
    var reviewDays = document.querySelectorAll('.review-day');
    var reviewGridEl = document.querySelector('.review-grid');
    if (reviewGridEl && reviewDays.length) {
      var reviewObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            reviewDays.forEach(function (day, i) {
              setTimeout(function () { day.classList.add('day-visible'); }, i * 130);
            });
            reviewObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      reviewObserver.observe(reviewGridEl);
    }
  } else {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
      .forEach(function (el) { el.classList.add('visible'); });
    document.querySelectorAll('.compare-table tbody tr').forEach(function (r) { r.classList.add('row-visible'); });
    document.querySelectorAll('.review-day').forEach(function (d) { d.classList.add('day-visible'); });
  }

  /* ---------- 填空：点击显示 / 回弹 ---------- */
  document.querySelectorAll('.blank').forEach(function (b) {
    b.addEventListener('click', function () {
      this.style.transform = 'scale(1.15)';
      var self = this;
      setTimeout(function () { self.style.transform = ''; }, 180);
    });
  });

  /* ---------- 朗读 ---------- */
  var speakBtn = document.getElementById('speakBtn');
  if (speakBtn) {
    speakBtn.addEventListener('click', function () {
      if (!('speechSynthesis' in window)) { alert('当前浏览器不支持朗读'); return; }
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(WORD);
      u.lang = 'en-US';
      u.rate = 0.85;
      u.onstart = function () { speakBtn.classList.add('speaking'); };
      u.onend = function () { speakBtn.classList.remove('speaking'); };
      u.onerror = function () { speakBtn.classList.remove('speaking'); };
      window.speechSynthesis.speak(u);
    });
    var ipaBtn = document.getElementById('ipaBtn');
    if (ipaBtn) ipaBtn.addEventListener('click', function () { speakBtn.click(); });
  }

  /* ---------- 造句：本地保存 ---------- */
  var SENTENCE_KEY = WORD + '_sentence';
  var mySentence = document.getElementById('mySentence');
  if (mySentence) {
    var savedMsg = document.getElementById('savedMsg');
    var saved = localStorage.getItem(SENTENCE_KEY);
    if (saved) mySentence.value = saved;

    var saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        localStorage.setItem(SENTENCE_KEY, mySentence.value);
        if (savedMsg) {
          savedMsg.classList.add('show');
          setTimeout(function () { savedMsg.classList.remove('show'); }, 1800);
        }
      });
    }
    var clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        mySentence.value = '';
        localStorage.removeItem(SENTENCE_KEY);
      });
    }
  }

  /* ---------- 复习打卡：持久化 ---------- */
  var REVIEW_KEY = WORD + '_review';
  var reviewState = {};
  try { reviewState = JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}'); } catch (e) { reviewState = {}; }
  document.querySelectorAll('.review-day').forEach(function (day) {
    var key = day.dataset.day;
    if (!key) return;
    if (reviewState[key]) day.classList.add('done');
    day.addEventListener('click', function () {
      day.classList.toggle('done');
      reviewState[key] = day.classList.contains('done');
      localStorage.setItem(REVIEW_KEY, JSON.stringify(reviewState));
    });
  });
})();
