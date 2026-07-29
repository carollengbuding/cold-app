// ============================================================
// 冷不丁就厉害了 - 主应用逻辑
// ============================================================

// 全局状态
const APP = {
  today: getDateKey(new Date()),
  userData: null,
  data: null, // 当日数据
};

// 工具函数
function getDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function showToast(msg, duration = 2000) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), duration);
}

function showModal(id) { $('#' + id).classList.add('show'); }
function hideModal(id) { $('#' + id).classList.remove('show'); }

// 存储管理
const Storage = {
  KEY: 'cold_but_strong_v1',
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },
  save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      console.error('保存失败', e);
    }
  },
  reset() {
    localStorage.removeItem(this.KEY);
  }
};

// 数据管理
const DataMgr = {
  init() {
    let data = Storage.load();
    if (!data) {
      data = this.createDefault();
    }
    APP.userData = data;
    this.checkDate();
  },
  createDefault() {
    return {
      createdAt: Date.now(),
      lastDate: getDateKey(new Date()),
      streak: 0,
      totalDone: 0,
      totalPenalty: 0,
      days: {},          // 日期 -> 当日数据
      penalties: [],     // 翻倍记录
      unlockedBadges: [],
    };
  },
  checkDate() {
    const today = getDateKey(new Date());
    if (APP.userData.lastDate !== today) {
      // 进入新的一天，处理昨天的翻倍
      this.handleNewDay(today);
      APP.userData.lastDate = today;
      this.save();
    }
    APP.data = this.getDayData(today);
  },
  getDayData(dateKey) {
    if (!APP.userData.days[dateKey]) {
      APP.userData.days[dateKey] = {
        date: dateKey,
        tasks: {},     // taskKey -> {done, penalty}
        exercise: {},
        study: {},
        skill: {},
        meals: [],
        review: {},
        plan: '',
        baduanjinNote: '',
      };
    }
    return APP.userData.days[dateKey];
  },
  handleNewDay(today) {
    const yesterday = this.getYesterdayKey();
    if (APP.userData.days[yesterday]) {
      // 昨天的任务必须在 22:00 前完成，否则翻倍
      // 这里我们通过比较当前时间和昨天的数据来判定
      const yesterdayData = APP.userData.days[yesterday];
      let hasPenalty = false;
      const penaltyList = [];
      TASKS.forEach(t => {
        if (!yesterdayData.tasks[t.key] || !yesterdayData.tasks[t.key].done) {
          hasPenalty = true;
          yesterdayData.tasks[t.key] = yesterdayData.tasks[t.key] || {};
          yesterdayData.tasks[t.key].penalty = true;
          yesterdayData.tasks[t.key].penaltyMarked = true;
          penaltyList.push(t.name);
        }
      });
      if (hasPenalty) {
        APP.userData.totalPenalty++;
        APP.userData.penalties.push({
          date: yesterday,
          tasks: penaltyList,
          createdAt: Date.now()
        });
        // 今天只对昨天未完成的那几项做"翻倍"标记（需双倍完成）
        const todayData = this.getDayData(today);
        TASKS.forEach(t => {
          if (yesterdayData.tasks[t.key] && yesterdayData.tasks[t.key].penalty) {
            todayData.tasks[t.key] = todayData.tasks[t.key] || {};
            todayData.tasks[t.key].double = true;
          }
        });
      }
      // 计算连续打卡
      if (!hasPenalty) {
        APP.userData.streak++;
      } else {
        APP.userData.streak = 0;
      }
    }
  },
  getYesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getDateKey(d);
  },
  getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      const data = APP.userData.days[key];
      const isToday = i === 0;
      const isPenalty = data && Object.values(data.tasks || {}).some(t => t.penalty);
      const done = data && TASKS.every(t => data.tasks[t.key] && data.tasks[t.key].done);
      days.push({
        date: d,
        key,
        isToday,
        isPenalty,
        done
      });
    }
    return days;
  },
  save() {
    Storage.save(APP.userData);
  }
};

// ============================================================
// 页面导航
// ============================================================
const Nav = {
  init() {
    $$('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        this.go(page);
        Sidebar.close();
      });
    });
    $$('[data-page]').forEach(el => {
      if (!el.classList.contains('nav-item')) {
        el.addEventListener('click', (e) => {
          const page = el.dataset.page;
          if (page && page !== 'home') this.go(page);
        });
      }
    });
  },
  go(pageName) {
    $$('.page').forEach(p => p.classList.remove('active'));
    $$('.nav-item').forEach(n => n.classList.remove('active'));
    const target = document.querySelector(`.page[data-page="${pageName}"]`);
    if (target) target.classList.add('active');
    const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (navItem) navItem.classList.add('active');
    if (window.innerWidth < 768) {
      $('.main').scrollTop = 0;
    }
    // 触发页面渲染
    if (pageName === 'stats') Stats.render();
    if (pageName === 'news') News.render();
  }
};

// ============================================================
// 侧边栏
// ============================================================
const Sidebar = {
  init() {
    $('#menuBtn').addEventListener('click', () => this.toggle());
    $('#mask').addEventListener('click', () => this.close());
  },
  toggle() {
    $('#sidebar').classList.toggle('open');
    $('#mask').classList.toggle('show');
  },
  close() {
    $('#sidebar').classList.remove('open');
    $('#mask').classList.remove('show');
  }
};

// ============================================================
// 任务管理
// ============================================================
const Tasks = {
  init() {
    this.renderGrid();
    this.bindCheckboxes();
    this.renderExerciseWeek();
  },
  renderGrid() {
    const grid = $('#taskGrid');
    grid.innerHTML = TASKS.map(t => {
      const data = (APP.data.tasks[t.key]) || {};
      const done = data.done;
      const penalty = data.penalty || data.double;
      const cls = done ? 'done' : (penalty ? 'penalty' : '');
      const state = done ? '已完成' : (penalty ? '⚠️ 翻倍' : '未完成');
      const ico = t.iconImg
        ? `<img src="${t.iconImg}" alt="">`
        : t.icon;
      return `
        <div class="task-mini ${cls}" data-page="${t.page}" data-task="${t.key}">
          <div class="task-mini-ico ${t.iconImg ? 'has-img' : ''}">${ico}</div>
          <div class="task-mini-info">
            <div class="task-mini-name">${t.name}</div>
            <div class="task-mini-state ${done ? 'done' : (penalty ? 'penalty' : '')}">${state}</div>
          </div>
          <div class="task-mini-check">✓</div>
        </div>
      `;
    }).join('');
    // 绑定点击跳转
    grid.querySelectorAll('.task-mini').forEach(el => {
      el.addEventListener('click', () => {
        Nav.go(el.dataset.page);
        setTimeout(() => {
          const task = el.dataset.task;
          const input = document.querySelector(`input[data-task="${task}"]`);
          if (input) input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      });
    });
  },
  bindCheckboxes() {
    $$('input[data-task]').forEach(input => {
      input.addEventListener('change', (e) => {
        const key = e.target.dataset.task;
        const checked = e.target.checked;
        APP.data.tasks[key] = APP.data.tasks[key] || {};
        APP.data.tasks[key].done = checked;
        // 同步更新页面内其它同名 checkbox
        $$(`input[data-task="${key}"]`).forEach(o => {
          if (o !== e.target) o.checked = checked;
        });
        DataMgr.save();
        this.renderGrid();
        if (checked) {
          Reward.show();
          confetti();
        }
        // 检查今日所有任务
        this.checkAllDone();
      });
    });
  },
  checkAllDone() {
    const allDone = TASKS.every(t => APP.data.tasks[t.key] && APP.data.tasks[t.key].done);
    if (allDone) {
      APP.userData.totalDone++;
      DataMgr.save();
      Stats.render();
    }
  },
  renderExerciseWeek() {
    const days = DataMgr.getLast7Days();
    const wdNames = ['日', '一', '二', '三', '四', '五', '六'];
    $('#exerciseWeek').innerHTML = days.map(d => {
      const data = APP.userData.days[d.key];
      let state = '—';
      if (data) {
        const ex = data.exercise || {};
        if (ex.type || (data.tasks.exercise && data.tasks.exercise.done)) state = '✓';
        else state = '✗';
      }
      return `
        <div class="week-day ${d.isToday ? 'today' : ''} ${d.isPenalty ? 'penalty' : ''}">
          <div class="wd-name">${d.isToday ? '今' : wdNames[d.date.getDay()]}</div>
          <div class="wd-date">${d.date.getDate()}</div>
          <div class="wd-state">${state}</div>
        </div>
      `;
    }).join('');
  }
};

// ============================================================
// 奖励弹窗
// ============================================================
const Reward = {
  show(taskName) {
    const text = REWARD_TEXTS[Math.floor(Math.random() * REWARD_TEXTS.length)];
    $('#rewardTitle').textContent = text.title;
    $('#rewardText').textContent = taskName ? `${taskName} - ${text.text}` : text.text;
    showModal('rewardModal');
  }
};

// 翻倍惩罚弹窗
const Penalty = {
  showOnEnter() {
    const today = getDateKey(new Date());
    const todayData = APP.userData.days[today];
    if (!todayData) return;
    const hasDouble = Object.values(todayData.tasks || {}).some(t => t.double);
    if (hasDouble && !sessionStorage.getItem('penalty_shown_' + today)) {
      sessionStorage.setItem('penalty_shown_' + today, '1');
      const items = [];
      TASKS.forEach(t => {
        if (todayData.tasks[t.key] && todayData.tasks[t.key].double) {
          items.push(`<div class="p-item">⚠️ ${t.name} - 今天需要双倍完成</div>`);
        }
      });
      $('#penaltyListModal').innerHTML = items.join('');
      showModal('penaltyModal');
    }
  }
};

// 庆祝粒子
function confetti() {
  const colors = ['#7BA8A1', '#A8C5BF', '#C8D5B9', '#D4A5A5', '#E6B17E'];
  for (let i = 0; i < 30; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.left = Math.random() * 100 + '%';
    el.style.top = '-20px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
    el.style.animationDelay = (Math.random() * 0.3) + 's';
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.width = (6 + Math.random() * 6) + 'px';
    el.style.height = (6 + Math.random() * 6) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

// ============================================================
// 运动模块
// ============================================================
const Exercise = {
  init() {
    this.renderRecommend();
    this.bindForm();
  },
  renderRecommend() {
    $('#exerciseList').innerHTML = EXERCISE_RECOMMEND.map((e, i) => {
      const done = (APP.data.exercise.recommend || []).includes(i);
      return `
        <div class="exercise-item">
          <div class="exercise-num">${i + 1}</div>
          <div class="exercise-info">
            <div class="exercise-name">${e.icon} ${e.name}</div>
            <div class="exercise-meta">${e.meta}</div>
          </div>
          <div class="exercise-done ${done ? 'done' : ''}" data-ex-idx="${i}">✓</div>
        </div>
      `;
    }).join('');
    $$('[data-ex-idx]').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.exIdx);
        APP.data.exercise.recommend = APP.data.exercise.recommend || [];
        const arr = APP.data.exercise.recommend;
        const i = arr.indexOf(idx);
        if (i >= 0) {
          arr.splice(i, 1);
          el.classList.remove('done');
        } else {
          arr.push(idx);
          el.classList.add('done');
          Reward.show(EXERCISE_RECOMMEND[idx].name);
        }
        DataMgr.save();
      });
    });
  },
  bindForm() {
    ['exerciseType', 'exerciseStart', 'exerciseEnd', 'exerciseMin', 'exerciseNote'].forEach(id => {
      const el = $('#' + id);
      if (el) {
        el.value = APP.data.exercise[id.replace('exercise', '').toLowerCase()] || '';
        el.addEventListener('change', () => {
          const key = id.replace('exercise', '').toLowerCase();
          APP.data.exercise[key] = el.value;
          DataMgr.save();
          this.updateMeta();
        });
      }
    });
    this.updateMeta();
  },
  updateMeta() {
    const ex = APP.data.exercise;
    let meta = '未开始';
    if (ex.type || ex.min) {
      meta = `${ex.type || '运动'} · ${ex.min || 0} 分钟`;
    }
    $('#exerciseMeta').textContent = meta;
  }
};

// ============================================================
// 学习模块
// ============================================================
const Study = {
  init() {
    this.renderRecommend();
    this.bindForm();
  },
  renderRecommend() {
    $('#studyRecommend').innerHTML = STUDY_RECOMMEND.map((s, i) => {
      return `
        <div class="recommend-item">
          <div class="rec-num">${i + 1}</div>
          <div class="rec-info">
            <div class="rec-name">${s.name}</div>
            <div class="rec-meta">${s.meta}</div>
          </div>
        </div>
      `;
    }).join('');
  },
  bindForm() {
    ['studyType', 'studyStart', 'studyEnd', 'studyMin', 'studyNote'].forEach(id => {
      const el = $('#' + id);
      if (el) {
        const key = id.replace('study', '').toLowerCase();
        el.value = APP.data.study[key] || '';
        el.addEventListener('change', () => {
          APP.data.study[key] = el.value;
          DataMgr.save();
          this.updateMeta();
        });
      }
    });
    this.updateMeta();
  },
  updateMeta() {
    const st = APP.data.study;
    let meta = '未开始';
    if (st.type || st.min) {
      meta = `${st.type || '学习'} · ${st.min || 0} 分钟`;
    }
    $('#studyMeta').textContent = meta;
  }
};

// ============================================================
// 技能模块
// ============================================================
const Skill = {
  init() {
    this.renderGrid();
    this.bindForm();
  },
  renderGrid() {
    $('#skillGrid').innerHTML = SKILL_CHALLENGE.map((s, i) => {
      const done = (APP.data.skill.done || []).includes(i);
      return `
        <div class="skill-item ${done ? 'done' : ''}" data-skill-idx="${i}">
          <div class="skill-ico">${s.icon}</div>
          <div class="skill-name">${s.name}</div>
          <div class="exercise-done ${done ? 'done' : ''}" data-skill-mark="${i}">✓</div>
        </div>
      `;
    }).join('');
    $$('[data-skill-mark]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(el.dataset.skillMark);
        APP.data.skill.done = APP.data.skill.done || [];
        const arr = APP.data.skill.done;
        const i = arr.indexOf(idx);
        if (i >= 0) {
          arr.splice(i, 1);
          el.classList.remove('done');
        } else {
          arr.push(idx);
          el.classList.add('done');
          Reward.show(SKILL_CHALLENGE[idx].name);
        }
        DataMgr.save();
        this.renderGrid();
      });
    });
  },
  bindForm() {
    ['skillType', 'skillStart', 'skillEnd', 'skillMin', 'skillNote'].forEach(id => {
      const el = $('#' + id);
      if (el) {
        const key = id.replace('skill', '').toLowerCase();
        el.value = APP.data.skill[key] || '';
        el.addEventListener('change', () => {
          APP.data.skill[key] = el.value;
          DataMgr.save();
          this.updateMeta();
        });
      }
    });
    this.updateMeta();
  },
  updateMeta() {
    const sk = APP.data.skill;
    let meta = '未开始';
    if (sk.type || sk.min) {
      meta = `${sk.type || '新技能'} · ${sk.min || 0} 分钟`;
    }
    $('#skillMeta').textContent = meta;
  }
};

// ============================================================
// 语音功能
// ============================================================
const Speech = {
  speak(text, lang, rate = 0.9) {
    if (!('speechSynthesis' in window)) {
      showToast('当前设备不支持语音合成');
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    u.pitch = 1.0;
    u.volume = 1.0;
    // 选择匹配语言的语音（关键：确保韩语/日语用对应语音，否则会读错）
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) {
        const langPrefix = lang.split('-')[0];
        const v = voices.find(x => x.lang === lang)
               || voices.find(x => x.lang && x.lang.startsWith(langPrefix));
        if (v) u.voice = v;
      }
    } catch (e) {}
    window.speechSynthesis.speak(u);
  },
  record(targetText, lang, callback) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showToast('当前设备不支持语音识别，请使用 Chrome 浏览器');
      callback && callback('', 0);
      return;
    }
    const recog = new SR();
    recog.lang = lang;
    recog.interimResults = false;
    recog.maxAlternatives = 3;

    showToast('🎤 请开始发音...');

    recog.onresult = (e) => {
      const results = Array.from(e.results[0]);
      let best = '';
      let bestScore = 0;
      results.forEach(r => {
        const text = r.transcript.trim().toLowerCase();
        const conf = r.confidence || 0.5;
        const similarity = calcSimilarity(text, targetText.toLowerCase());
        const score = (similarity * 0.7) + (conf * 0.3);
        if (score > bestScore) {
          bestScore = score;
          best = r.transcript;
        }
      });
      callback && callback(best, bestScore);
    };
    recog.onerror = (e) => {
      showToast('识别失败：' + e.error);
      callback && callback('', 0);
    };
    recog.onend = () => {
      // 自动结束
    };
    try {
      recog.start();
    } catch (e) {
      showToast('请允许使用麦克风');
      callback && callback('', 0);
    }
  }
};

function calcSimilarity(a, b) {
  // 简易相似度
  a = a.toLowerCase().replace(/[^\w\s]/g, '').trim();
  b = b.toLowerCase().replace(/[^\w\s]/g, '').trim();
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  // Levenshtein
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i-1] === b[j-1]) dp[i][j] = dp[i-1][j-1];
      else dp[i][j] = Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1;
    }
  }
  const dist = dp[m][n];
  return 1 - dist / Math.max(m, n);
}

// ============================================================
// 新闻模块
// ============================================================
const News = {
  current: 'world',
  init() {
    $$('.news-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.news-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.current = btn.dataset.newsCat;
        this.render();
      });
    });
    this.renderHome();
  },
  render() {
    const list = NEWS_DATA[this.current] || [];
    $('#newsContent').innerHTML = list.map(n => `
      <div class="news-item">
        <div class="news-item-title">${n.title}</div>
        <div class="news-item-meta">
          <span class="news-tag">${n.tag}</span>
          <span>${n.meta}</span>
        </div>
      </div>
    `).join('');
    $('#newsDate').textContent = `${this.getDateLabel()} · 每日要闻速览`;
  },
  renderHome() {
    // 首页只显示前 3 条要闻
    const list = [...NEWS_WORLD.slice(0, 2), ...NEWS_CHINA.slice(0, 2)];
    $('#homeNewsList').innerHTML = list.map(n => `
      <div class="news-item">
        <div class="news-item-title">${n.title}</div>
        <div class="news-item-meta">
          <span class="news-tag">${n.tag}</span>
          <span>${n.meta}</span>
        </div>
      </div>
    `).join('');
  },
  getDateLabel() {
    const d = new Date();
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }
};

// ============================================================
// 饮食模块
// ============================================================
const Diet = {
  current: 'breakfast',
  init() {
    $$('.meal-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.meal-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.current = btn.dataset.meal;
      });
    });
    $('#saveMealBtn').addEventListener('click', () => this.save());
    this.render();
  },
  save() {
    const content = $('#mealContent').value.trim();
    const kcal = parseInt($('#mealKcal').value) || 0;
    const water = parseInt($('#mealWater').value) || 0;
    const note = $('#mealNote').value.trim();
    if (!content && !water) {
      showToast('请至少填写食物内容或饮水量');
      return;
    }
    APP.data.meals = APP.data.meals || [];
    APP.data.meals.push({
      type: this.current,
      content, kcal, water, note,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    });
    DataMgr.save();
    $('#mealContent').value = '';
    $('#mealKcal').value = '';
    $('#mealWater').value = '';
    $('#mealNote').value = '';
    this.render();
    showToast('已记录：' + this.getMealName() + ' 🍽️');
    confetti();
  },
  getMealName() {
    return { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }[this.current];
  },
  render() {
    const list = APP.data.meals || [];
    const labels = { breakfast: '🌅早餐', lunch: '☀️午餐', dinner: '🌙晚餐', snack: '🍎加餐' };
    $('#mealList').innerHTML = list.length === 0
      ? '<div class="lang-tip">还没有饮食记录，点击上方添加第一餐</div>'
      : list.map(m => `
        <div class="meal-item">
          <div class="meal-type">${labels[m.type]}</div>
          <div class="meal-content">${m.content || '记录'} <span class="meal-kcal">${m.kcal ? m.kcal + ' kcal' : ''} ${m.water ? '· ' + m.water + ' ml' : ''}</span></div>
          <div class="meal-kcal">${m.time || ''}</div>
        </div>
      `).join('');
    const totalKcal = list.reduce((s, m) => s + (m.kcal || 0), 0);
    const totalWater = list.reduce((s, m) => s + (m.water || 0), 0);
    $('#totalKcal').textContent = totalKcal;
    $('#totalWater').textContent = totalWater;
    $('#totalMeal').textContent = list.length;
  }
};

// ============================================================
// 晨间流程
// ============================================================
const Morning = {
  init() {
    this.bindForm();
    this.bindCheckboxes();
  },
  bindForm() {
    if ($('#planNote')) {
      $('#planNote').value = APP.data.plan || '';
      $('#planNote').addEventListener('change', (e) => {
        APP.data.plan = e.target.value;
        DataMgr.save();
        this.updateMeta();
      });
    }
    if ($('#baduanjinNote')) {
      $('#baduanjinNote').value = APP.data.baduanjinNote || '';
      $('#baduanjinNote').addEventListener('change', (e) => {
        APP.data.baduanjinNote = e.target.value;
        DataMgr.save();
      });
    }
  },
  bindCheckboxes() {
    // 复用 Tasks 的逻辑，但额外的 morning/baduanjin/plan 状态
    $$('input[data-task="morning"], input[data-task="baduanjin"], input[data-task="plan"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const key = e.target.dataset.task;
        const checked = e.target.checked;
        APP.data.tasks[key] = APP.data.tasks[key] || {};
        APP.data.tasks[key].done = checked;
        $$(`input[data-task="${key}"]`).forEach(o => {
          if (o !== e.target) o.checked = checked;
        });
        DataMgr.save();
        Tasks.renderGrid();
        this.updateMeta(key);
        if (checked) {
          Reward.show({ morning: '起床', baduanjin: '八段锦', plan: '行程安排' }[key]);
          confetti();
        }
      });
    });
    this.updateMeta();
  },
  updateMeta(key) {
    const labels = { morning: 'morningMeta', baduanjin: 'baduanjinMeta', plan: 'planMeta' };
    const names = { morning: '起床', baduanjin: '八段锦', plan: '行程安排' };
    Object.keys(labels).forEach(k => {
      const done = APP.data.tasks[k] && APP.data.tasks[k].done;
      $('#' + labels[k]).textContent = done ? '已完成 ✓' : '待完成';
    });
  }
};

// ============================================================
// 晚间复盘
// ============================================================
const Review = {
  init() {
    this.bindForm();
    this.bindCheckboxes();
    this.updateMeta();
  },
  bindForm() {
    ['reviewWin', 'reviewBad', 'reviewTomorrow', 'reviewScore'].forEach(id => {
      const el = $('#' + id);
      if (el) {
        const key = id.replace('review', '').toLowerCase();
        el.value = APP.data.review[key] || '';
        el.addEventListener('change', () => {
          APP.data.review[key] = el.value;
          DataMgr.save();
        });
      }
    });
  },
  bindCheckboxes() {
    $$('input[data-task="sleep"], input[data-task="review"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const key = e.target.dataset.task;
        const checked = e.target.checked;
        APP.data.tasks[key] = APP.data.tasks[key] || {};
        APP.data.tasks[key].done = checked;
        $$(`input[data-task="${key}"]`).forEach(o => {
          if (o !== e.target) o.checked = checked;
        });
        DataMgr.save();
        Tasks.renderGrid();
        this.updateMeta();
        if (checked) {
          Reward.show(key === 'sleep' ? '10:30 入睡' : '睡前复盘');
          confetti();
        }
      });
    });
  },
  updateMeta() {
    const sleepDone = APP.data.tasks.sleep && APP.data.tasks.sleep.done;
    const reviewDone = APP.data.tasks.review && APP.data.tasks.review.done;
    $('#sleepMeta').textContent = sleepDone ? '已完成 ✓' : '待完成';
    $('#reviewMeta').textContent = reviewDone ? '已完成 ✓' : '待完成';
  }
};

// ============================================================
// 成就统计
// ============================================================
const Stats = {
  init() {
    this.render();
  },
  render() {
    const today = getDateKey(new Date());
    const todayData = APP.userData.days[today];
    let doneCount = 0;
    TASKS.forEach(t => {
      if (todayData && todayData.tasks[t.key] && todayData.tasks[t.key].done) doneCount++;
    });
    $('#statStreak').textContent = APP.userData.streak;
    $('#statTotal').textContent = APP.userData.totalDone;
    $('#statToday').textContent = `${doneCount}/${TASKS.length}`;
    $('#statPenalty').textContent = APP.userData.totalPenalty;
    $('#streakNum').textContent = APP.userData.streak;

    // 周历
    const days = DataMgr.getLast7Days();
    const wdNames = ['日', '一', '二', '三', '四', '五', '六'];
    $('#statsWeek').innerHTML = days.map(d => {
      let state = '—';
      if (d.done) state = '✓✓✓';
      else if (d.isPenalty) state = '⚠️';
      else if (d.isToday) state = `${doneCount}/${TASKS.length}`;
      else state = '✗';
      return `
        <div class="week-day ${d.isToday ? 'today' : ''} ${d.isPenalty ? 'penalty' : ''}">
          <div class="wd-name">${d.isToday ? '今' : wdNames[d.date.getDay()]}</div>
          <div class="wd-date">${d.date.getDate()}</div>
          <div class="wd-state" style="font-size:11px">${state}</div>
        </div>
      `;
    }).join('');

    // 惩罚记录
    const penalties = (APP.userData.penalties || []).slice(-10).reverse();
    $('#penaltyList').innerHTML = penalties.length === 0
      ? '<div class="lang-tip">🎉 还没有翻倍记录，继续保持！</div>'
      : penalties.map(p => `
        <div class="penalty-item">
          <span>⚠️</span>
          <span>${p.tasks.join('、')}</span>
          <span class="p-date">${p.date}</span>
        </div>
      `).join('');

    // 徽章
    const badges = [
      { name: '初出茅庐', icon: '🌱', condition: () => APP.userData.streak >= 1 },
      { name: '坚持一周', icon: '🌿', condition: () => APP.userData.streak >= 7 },
      { name: '坚持一月', icon: '🌳', condition: () => APP.userData.streak >= 30 },
      { name: '百日筑基', icon: '🏆', condition: () => APP.userData.streak >= 100 },
      { name: '任务达人', icon: '⭐', condition: () => APP.userData.totalDone >= 10 },
      { name: '任务大师', icon: '💎', condition: () => APP.userData.totalDone >= 50 },
      { name: '完美主义', icon: '👑', condition: () => APP.userData.totalPenalty === 0 && APP.userData.totalDone >= 7 },
      { name: '亡羊补牢', icon: '🔧', condition: () => APP.userData.totalPenalty >= 1 },
      { name: '冷不丁就厉害了', icon: '🐻', condition: () => APP.userData.streak >= 30 && APP.userData.totalDone >= 50 },
    ];
    $('#badgeList').innerHTML = badges.map(b => {
      const unlocked = b.condition();
      return `
        <div class="badge-item ${unlocked ? 'unlocked' : ''}">
          <div class="badge-ico">${b.icon}</div>
          <div class="badge-name">${b.name}</div>
        </div>
      `;
    }).join('');
  }
};

// ============================================================
// 时间更新
// ============================================================
const Clock = {
  init() {
    this.tick();
    setInterval(() => this.tick(), 60000);
  },
  tick() {
    const d = new Date();
    const h = d.getHours();
    let greet = '你好';
    if (h < 6) greet = '夜深了';
    else if (h < 9) greet = '早上好';
    else if (h < 12) greet = '上午好';
    else if (h < 14) greet = '中午好';
    else if (h < 18) greet = '下午好';
    else if (h < 22) greet = '晚上好';
    else greet = '夜深了';

    $('#greetText').textContent = greet;
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    $('#dateText').textContent = `${d.getMonth() + 1}月${d.getDate()}日 周${weekday}`;

    $('#heroDay').textContent = d.getDate();
    $('#heroYM').textContent = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    $('#heroGreet').textContent = `${greet} ☀️`;
    const quote = DAILY_QUOTES[d.getDate() % DAILY_QUOTES.length];
    $('#heroQuote').textContent = quote;
  }
};

// ============================================================
// 安装到桌面（PWA 添加到主屏幕）
// ============================================================
const Install = {
  deferredPrompt: null,
  init() {
    const card = $('#installCard');
    // 已安装才隐藏；否则【始终显示】安装入口（沙箱预览不会触发 beforeinstallprompt）
    if (localStorage.getItem('app_installed')) {
      if (card) card.style.display = 'none';
    } else if (card) {
      card.style.display = 'flex';
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      if (card && !localStorage.getItem('app_installed')) {
        card.style.display = 'flex';
      }
      this.updateStatus();
    });

    window.addEventListener('appinstalled', () => {
      localStorage.setItem('app_installed', '1');
      if (card) card.style.display = 'none';
      showToast('已添加到主屏幕 🎉');
    });

    $('#installBtn').addEventListener('click', async () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const choice = await this.deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          localStorage.setItem('app_installed', '1');
        }
        this.deferredPrompt = null;
        if (card) card.style.display = 'none';
      } else {
        // 沙箱预览 / iOS 等不触发 beforeinstallprompt，直接给手动引导
        showModal('installGuide');
      }
    });

    $('#installClose').addEventListener('click', () => {
      if (card) card.style.display = 'none';
      localStorage.setItem('install_dismissed', '1');
    });

    $('#installGuideClose').addEventListener('click', () => hideModal('installGuide'));
    // 侧边栏「添加到主屏幕」入口，始终可用
    const navInstall = $('#navInstall');
    if (navInstall) {
      navInstall.addEventListener('click', () => showModal('installGuide'));
    }

    // 实时诊断：在卡片上显示 SW 与可安装状态，方便排查
    this.updateStatus();
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', () => this.updateStatus());
    }
    setTimeout(() => this.updateStatus(), 3500); // 等 SW 注册/激活后再看一次
  },
  updateStatus() {
    const el = $('#installStatus');
    if (!el) return;
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      el.textContent = '✅ 已是独立应用（已安装）';
      el.style.color = '#2e7d5b';
      return;
    }
    const swOk = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
    if (this.deferredPrompt) {
      el.textContent = '✅ 可安装：点「添加」或浏览器菜单「安装应用」';
      el.style.color = '#2e7d5b';
    } else if (swOk) {
      el.textContent = '🟡 已就绪：浏览器菜单「⋮ → 安装应用」即可';
      el.style.color = '#9a7b1f';
    } else {
      el.textContent = '⏳ 正在加载服务（若长期如此：清站点数据后刷新）';
      el.style.color = '#888';
    }
  }
};

// ============================================================
// 启动
// ============================================================
function init() {
  DataMgr.init();

  // 启动页
  setTimeout(() => {
    $('#splash').style.opacity = '0';
    $('#splash').style.transition = 'opacity 0.4s';
    setTimeout(() => {
      $('#splash').classList.add('hidden');
      $('#app').classList.remove('hidden');
    }, 400);
  }, 1200);

  // 初始化模块
  Sidebar.init();
  Nav.init();
  Install.init();
  Clock.init();
  Tasks.init();
  Exercise.init();
  Study.init();
  Skill.init();
  News.init();
  Diet.init();
  Morning.init();
  Review.init();
  Stats.init();

  // 弹窗按钮
  $('#rewardClose').addEventListener('click', () => hideModal('rewardModal'));
  $('#penaltyClose').addEventListener('click', () => hideModal('penaltyModal'));
  $('#alertClose').addEventListener('click', () => hideModal('alertModal'));

  // 奖励按钮（右上角）
  $('#rewardBtn').addEventListener('click', () => Reward.show());

  // 重置按钮
  $('#resetBtn').addEventListener('click', () => {
    if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
      Storage.reset();
      location.reload();
    }
  });

  // 下载应用 (ZIP) —— 浏览器本地打包，不经过服务器
  $('#downloadBtn').addEventListener('click', () => Download.run());

  // 检查翻倍惩罚
  setTimeout(() => Penalty.showOnEnter(), 1500);

  // 防止双击缩放
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
}

document.addEventListener('DOMContentLoaded', init);

/* ========== 本地打包下载 (ZIP) ========== */
function crc32(buf) {
  if (!crc32.table) {
    const t = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    crc32.table = t;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crc32.table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// 仅 store 模式（无压缩），浏览器原生打包
function buildZip(files) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const data = f.data;
    const crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0, true);
    lh.setUint16(8, 0, true);
    lh.setUint16(10, 0, true);
    lh.setUint16(12, 0, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true);
    lh.setUint32(22, data.length, true);
    lh.setUint16(26, nameBytes.length, true);
    lh.setUint16(28, 0, true);
    chunks.push(new Uint8Array(lh.buffer), nameBytes, data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, 0, true);
    cd.setUint16(14, 0, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint16(30, 0, true);
    cd.setUint16(32, 0, true);
    cd.setUint16(34, 0, true);
    cd.setUint16(36, 0, true);
    cd.setUint32(38, 0, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const centralSize = central.reduce((s, c) => s + c.length, 0);
  const centralOffset = offset;
  const eo = new DataView(new ArrayBuffer(22));
  eo.setUint32(0, 0x06054b50, true);
  eo.setUint16(4, 0, true);
  eo.setUint16(6, 0, true);
  eo.setUint16(8, files.length, true);
  eo.setUint16(10, files.length, true);
  eo.setUint32(12, centralSize, true);
  eo.setUint32(16, centralOffset, true);
  eo.setUint16(20, 0, true);
  const all = [...chunks, ...central, new Uint8Array(eo.buffer)];
  return new Blob(all, { type: 'application/zip' });
}

const Download = {
  async run() {
    const files = [
      'index.html', 'manifest.json', 'sw.js',
      'css/style.css', 'js/app.js', 'js/data.js',
      'assets/app-icon.jpg', 'assets/app-icon.png', 'assets/app-icon-192.png',
      'assets/app-icon-maskable.png', 'assets/reward.jpg', 'assets/penalty.jpg',
      'assets/task-1.jpg', 'assets/task-2.jpg', 'assets/task-3.jpg', 'assets/task-4.jpg',
      'assets/task-5.jpg', 'assets/task-6.jpg', 'assets/task-7.jpg', 'assets/task-8.jpg'
    ];
    const btn = document.getElementById('downloadBtn');
    const old = btn.textContent;
    btn.textContent = '打包中…';
    btn.disabled = true;
    try {
      const out = [];
      for (const f of files) {
        const resp = await fetch(f, { cache: 'no-store' });
        if (!resp.ok) throw new Error('无法读取 ' + f + ' (HTTP ' + resp.status + ')');
        const buf = new Uint8Array(await resp.arrayBuffer());
        out.push({ name: f, data: buf });
      }
      const blob = buildZip(out);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cold-app.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      btn.textContent = '✓ 已下载';
    } catch (e) {
      console.error(e);
      alert('下载失败：' + e.message);
      btn.textContent = old;
    } finally {
      setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 2000);
    }
  }
};

// Service Worker 注册（PWA）
if ('serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('[SW] 注册成功', reg.scope))
      .catch(err => console.error('[SW] 注册失败:', err));
  };
  // 立即注册（若 load 已触发则直接注册，否则等 load）
  if (document.readyState === 'complete') registerSW();
  else window.addEventListener('load', registerSW, { once: true });
}
