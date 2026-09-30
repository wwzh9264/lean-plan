(function () {
  'use strict';

  // ---------- 个人数据 ----------
  const HEIGHT = 173;          // cm
  const START = 75.0;          // 起始体重 kg（150 斤）
  const TARGET = 66.0;         // 目标体重 kg
  const BMI_DIV = (HEIGHT / 100) * (HEIGHT / 100); // 2.9929
  const AGE = 25.5;            // 年龄（用户实际 25 岁半）
  const ACTIVITY = 1.4;        // 活动系数：一周四练 + 白天久坐

  const WD = ['日', '一', '二', '三', '四', '五', '六'];
  const TRAIN = {
    1: { day: '周一', name: '胸', sub: '上胸 · 厚度' },
    2: { day: '周二', name: '肩', sub: '宽肩 · 中后束' },
    4: { day: '周四', name: '背', sub: '宽度 · 倒三角' },
    5: { day: '周五', name: '腿', sub: '力量 · 代谢' },
  };
  const REST = { day: '休息', name: '恢复 · 有氧', sub: '快走 30–45 分钟 · 步数 8000+' };

  // ---------- 存储 ----------
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const getWeights = () => store.get('lean.weights', []).slice().sort((a, b) => (a.d < b.d ? -1 : 1));
  const latestWeight = () => { const w = getWeights(); return w.length ? w[w.length - 1].w : null; };
  const bmiOf = (w) => (w / BMI_DIV).toFixed(1);

  const $ = (id) => document.getElementById(id);

  // ---------- 顶部日期 ----------
  function renderDate() {
    const d = new Date();
    $('today-date').textContent = `${d.getMonth() + 1}月${d.getDate()}日 周${WD[d.getDay()]}`;
  }

  // ---------- 首屏 Hero ----------
  function renderHero() {
    const w = latestWeight() ?? START;
    const diff = Math.max(0, +(w - TARGET).toFixed(1));
    const lost = Math.max(0, START - w);
    const pct = Math.min(100, Math.round((lost / (START - TARGET)) * 100));
    $('hero-weight').textContent = w.toFixed(1);
    $('hero-bmi').textContent = bmiOf(w);
    $('hero-diff').textContent = diff.toFixed(1);
    $('hero-fill').style.width = pct + '%';
    $('hero-cap-l').textContent = `起点 ${START.toFixed(1)}`;
  }

  // ---------- 动态目标（随体重调整） ----------
  function computeTargets(w) {
    const bmr = 10 * w + 6.25 * HEIGHT - 5 * AGE + 5; // Mifflin-St Jeor（男）
    const tdee = bmr * ACTIVITY;
    let deficit, phase;
    if (w >= 72) { deficit = 500; phase = '减脂期 · 缺口 500 kcal'; }
    else if (w >= 70) { deficit = 400; phase = '减脂期 · 缺口 400 kcal'; }
    else if (w >= 68) { deficit = 300; phase = '放缓期 · 缺口 300 kcal'; }
    else { deficit = 200; phase = '接近目标 · 缺口 200 kcal，重点保肌肉'; }
    const kcal = Math.round((tdee - deficit) / 10) * 10;
    const protein = Math.round(1.8 * w);
    const fat = Math.round(0.8 * w);
    const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
    const water = Math.round(w * 33); // ml
    return { bmr: Math.round(bmr), tdee: Math.round(tdee), deficit, phase, kcal, protein, fat, carbs, water };
  }

  function currentTargets() {
    return computeTargets(latestWeight() ?? START);
  }

  function renderTargets() {
    const t = currentTargets();
    if ($('tgt-kcal')) $('tgt-kcal').textContent = t.kcal;
    if ($('tgt-protein')) $('tgt-protein').textContent = t.protein;
    if ($('tgt-water')) $('tgt-water').textContent = (t.water / 1000).toFixed(1);
    if ($('water-target')) $('water-target').textContent = t.water;
    if ($('diet-kcal')) $('diet-kcal').textContent = t.kcal;
    if ($('diet-protein')) $('diet-protein').textContent = t.protein;
    if ($('diet-fat')) $('diet-fat').textContent = t.fat;
    if ($('diet-carb')) $('diet-carb').textContent = t.carbs;
    if ($('diet-note')) $('diet-note').textContent = `当前体重 ${(latestWeight() ?? START).toFixed(1)}kg · TDEE 约 ${t.tdee} kcal · ${t.phase} · 蛋白质 ${t.protein}g / 脂肪 ${t.fat}g / 碳水 ${t.carbs}g（均为估算）`;
  }

  // ---------- 今日训练 ----------
  function renderTrain() {
    const dow = new Date().getDay();
    const t = TRAIN[dow] || REST;
    const isRest = !TRAIN[dow];
    $('tt-day').textContent = isRest ? '休' : t.day.slice(1);
    $('tt-name').textContent = t.name;
    $('tt-sub').textContent = `${t.day} · ${t.sub}`;

    const workoutItem = document.querySelector('#checklist [data-key="workout"]');
    if (workoutItem) workoutItem.style.display = isRest ? 'none' : '';
    if (!isRest && $('cl-workout-label')) {
      $('cl-workout-label').textContent = '完成今日训练 · ' + t.name;
      $('cl-workout-sub').textContent = t.day + ' · ' + t.sub;
    }
    if ($('cl-cardio-label')) {
      if (isRest) {
        $('cl-cardio-label').textContent = '快走 / 低强度有氧 30–45 分钟';
        $('cl-cardio-sub').textContent = '休息日别完全不动，保持活跃';
      } else {
        $('cl-cardio-label').textContent = '训练后 20–30 分钟有氧';
        $('cl-cardio-sub').textContent = '快走 / 坡度走，心率 120–140';
      }
    }
  }

  // ---------- 每日清单 ----------
  function initChecklist() {
    const key = todayStr();
    const data = store.get('lean.checklist', {})[key] || {};
    document.querySelectorAll('#checklist .check-item').forEach((item) => {
      const k = item.dataset.key;
      const box = item.querySelector('.box');
      if (data[k]) item.classList.add('done'), box.setAttribute('aria-pressed', 'true');
      box.addEventListener('click', () => {
        const done = item.classList.toggle('done');
        box.setAttribute('aria-pressed', String(done));
        const all = store.get('lean.checklist', {});
        all[key] = all[key] || {};
        all[key][k] = done;
        store.set('lean.checklist', all);
      });
    });
  }

  // ---------- 喝水打卡 ----------
  function initWater() {
    const key = todayStr();
    const all = store.get('lean.water', {});
    const val = all[key] || 0;
    const el = $('water-val');
    const render = () => { el.textContent = all[key] || 0; };
    render();
    document.querySelectorAll('.water .btns button[data-add]').forEach((b) => {
      b.addEventListener('click', () => {
        all[key] = (all[key] || 0) + Number(b.dataset.add);
        store.set('lean.water', all);
        render();
      });
    });
    $('water-reset').addEventListener('click', () => { all[key] = 0; store.set('lean.water', all); render(); });
  }

  // ---------- Tab 切换 ----------
  function initTabs() {
    document.querySelectorAll('.tabbar .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tabbar .tab').forEach((t) => { t.classList.remove('active'); t.removeAttribute('aria-current'); });
        document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
        tab.classList.add('active');
        tab.setAttribute('aria-current', 'page');
        $('view-' + tab.dataset.view).classList.add('active');
        window.scrollTo({ top: 0 });
        if (tab.dataset.view === 'progress') renderChart(); // 切到时按最新宽度重画
      });
    });
  }

  // ---------- 进度：体重记录 ----------
  function initProgress() {
    $('weight-add').addEventListener('click', addWeight);
    $('weight-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') addWeight(); });

    function addWeight() {
      const input = $('weight-input');
      const v = parseFloat(input.value);
      if (!isFinite(v) || v < 30 || v > 250) { input.focus(); return; }
      const w = Math.round(v * 10) / 10;
      const d = todayStr();
      let list = getWeights();
      const i = list.findIndex((x) => x.d === d);
      if (i >= 0) list[i].w = w; else list.push({ d, w });
      store.set('lean.weights', list);
      input.value = '';
      renderHero(); renderTargets(); renderIntake(); renderStats(); renderChart();
    }

    renderStats(); renderChart();
  }

  function renderStats() {
    const list = getWeights();
    const w = latestWeight() ?? START;
    $('stat-weight').textContent = w.toFixed(1);
    $('stat-bmi').textContent = bmiOf(w);
    const trend = $('stat-trend');
    if (list.length >= 2) {
      const delta = +(list[list.length - 1].w - list[0].w).toFixed(1);
      if (delta < 0) { trend.textContent = `已减 ${Math.abs(delta).toFixed(1)} kg`; trend.className = 'v down'; }
      else if (delta > 0) { trend.textContent = `增加 ${delta.toFixed(1)} kg`; trend.className = 'v up'; }
      else { trend.textContent = '持平'; trend.className = 'v'; }
    } else { trend.textContent = '—'; trend.className = 'v'; }
  }

  // ---------- 体重折线图（SVG，无依赖） ----------
  const SVGNS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const fmtDate = (d) => { const [y, m, dd] = d.split('-'); return `${Number(m)}月${Number(dd)}日`; };
  const fmtShort = (d) => { const [, m, dd] = d.split('-'); return `${Number(m)}/${Number(dd)}`; };

  function renderChart() {
    const svg = $('weight-chart');
    const empty = $('chart-empty');
    const data = getWeights();
    if (data.length < 2) { svg.style.display = 'none'; empty.style.display = 'block'; return; }
    empty.style.display = 'none'; svg.style.display = 'block';

    const wrap = svg.parentElement;
    const W = Math.max(280, wrap.clientWidth);
    const H = 210;
    const padL = 40, padR = 16, padT = 20, padB = 28;
    const iw = W - padL - padR, ih = H - padT - padB;
    const ws = data.map((d) => d.w);
    const min = Math.min(...ws), max = Math.max(...ws);
    let lo = Math.floor(min - 0.8), hi = Math.ceil(max + 0.8);
    if (hi - lo < 4) { lo = Math.floor((lo + hi) / 2) - 2; hi = lo + 4; }
    const X = (i) => padL + iw * (i / (data.length - 1));
    const Y = (w) => padT + ih * (1 - (w - lo) / (hi - lo));

    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);

    const inkFaint = '#5c6878', lineC = '#24374e', accent = '#f0a83f', cyan = '#5fb8d9';

    // 横向网格 + 左侧刻度
    const ticks = [lo, Math.round((lo + hi) / 2), hi];
    ticks.forEach((t, idx) => {
      if (idx > 0) el('line', { x1: padL, x2: W - padR, y1: Y(t), y2: Y(t), stroke: lineC, 'stroke-width': 1, 'stroke-dasharray': '3 5' }, svg);
      el('text', { x: padL - 8, y: Y(t) + 4, 'text-anchor': 'end', 'font-size': 11, fill: inkFaint, 'font-family': 'ui-monospace, Menlo, monospace' }, svg).textContent = t.toFixed(1);
    });

    // 目标线（66.0）
    if (TARGET > lo && TARGET < hi) {
      el('line', { x1: padL, x2: W - padR, y1: Y(TARGET), y2: Y(TARGET), stroke: cyan, 'stroke-width': 1.5, 'stroke-dasharray': '6 4' }, svg);
      el('text', { x: W - padR, y: Y(TARGET) - 5, 'text-anchor': 'end', 'font-size': 11, fill: cyan, 'font-family': 'ui-monospace, Menlo, monospace' }, svg).textContent = '目标 66.0';
    }

    // 数据线
    const dPath = data.map((d, i) => `${i ? 'L' : 'M'} ${X(i).toFixed(1)} ${Y(d.w).toFixed(1)}`).join(' ');
    el('path', { d: dPath, fill: 'none', stroke: accent, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);

    // 数据点
    data.forEach((d, i) => el('circle', { cx: X(i), cy: Y(d.w), r: 3.4, fill: '#0b1420', stroke: accent, 'stroke-width': 1.8 }, svg));

    // X 轴首尾日期
    el('text', { x: padL, y: H - 8, 'text-anchor': 'start', 'font-size': 11, fill: inkFaint, 'font-family': 'ui-monospace, Menlo, monospace' }, svg).textContent = fmtShort(data[0].d);
    el('text', { x: W - padR, y: H - 8, 'text-anchor': 'end', 'font-size': 11, fill: inkFaint, 'font-family': 'ui-monospace, Menlo, monospace' }, svg).textContent = fmtShort(data[data.length - 1].d);

    // 悬停交互：竖线 + 高亮点 + 提示框
    const guide = el('line', { x1: 0, x2: 0, y1: padT, y2: padT + ih, stroke: inkFaint, 'stroke-width': 1, opacity: 0 }, svg);
    const hl = el('circle', { r: 5, fill: accent, stroke: '#0b1420', 'stroke-width': 2, opacity: 0 }, svg);
    const tipG = el('g', { opacity: 0 }, svg);
    const tipW = 128, tipH = 40;
    const tipRect = el('rect', { width: tipW, height: tipH, rx: 8, fill: '#162436', stroke: lineC, 'stroke-width': 1 }, tipG);
    const tipTxt = el('text', { x: 12, y: 24, 'font-size': 12, fill: '#e9e4d6', 'font-family': 'ui-monospace, Menlo, monospace' }, tipG);

    const onMove = (ev) => {
      const rect = svg.getBoundingClientRect();
      const px = Math.min(Math.max(ev.clientX - rect.left, padL), padL + iw);
      let best = 0, bd = Infinity;
      data.forEach((d, i) => { const dd = Math.abs(X(i) - px); if (dd < bd) { bd = dd; best = i; } });
      const cx = X(best), cy = Y(data[best].w);
      guide.setAttribute('x1', cx); guide.setAttribute('x2', cx); guide.setAttribute('opacity', 1);
      hl.setAttribute('cx', cx); hl.setAttribute('cy', cy); hl.setAttribute('opacity', 1);
      tipTxt.textContent = `${fmtDate(data[best].d)} · ${data[best].w.toFixed(1)}kg`;
      const tx = cx + 12 + tipW > W ? cx - 12 - tipW : cx + 12;
      const ty = Math.max(4, Math.min(H - tipH - 4, cy - tipH / 2));
      tipRect.setAttribute('x', tx); tipRect.setAttribute('y', ty);
      tipTxt.setAttribute('x', tx + 12); tipTxt.setAttribute('y', ty + 24);
      tipG.setAttribute('opacity', 1);
    };
    const onLeave = () => { guide.setAttribute('opacity', 0); hl.setAttribute('opacity', 0); tipG.setAttribute('opacity', 0); };
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerleave', onLeave);
  }

  // ---------- 饮食记录 ----------
  const MEALS = [['早', '早餐'], ['午', '午餐'], ['晚', '晚餐'], ['加', '加餐']];
  const getFoodLog = () => store.get('lean.foodlog', {})[todayStr()] || [];
  const setFoodLog = (list) => {
    const all = store.get('lean.foodlog', {});
    all[todayStr()] = list;
    store.set('lean.foodlog', all);
  };
  let pickerMeal = '早', pickerCat = '全部';

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove('show'), 1200);
  }

  function renderIntake() {
    const t = currentTargets();
    const list = getFoodLog();
    const kcal = Math.round(list.reduce((s, x) => s + x.kcal * x.qty, 0));
    const protein = Math.round(list.reduce((s, x) => s + x.protein * x.qty, 0));
    const left = t.kcal - kcal;
    const deficit = t.tdee - kcal;
    $('intake-kcal').textContent = kcal;
    $('intake-target').textContent = t.kcal;
    $('intake-fill').style.width = Math.min(100, (kcal / t.kcal) * 100) + '%';
    $('intake-protein').textContent = protein + 'g';
    $('intake-protein').classList.toggle('over', protein > t.protein + 30);
    $('intake-left').textContent = left;
    $('intake-left').classList.toggle('over', left < 0);
    $('intake-deficit').textContent = deficit;
    $('intake-deficit').classList.toggle('over', deficit <= 0);
  }

  function renderFoodLog() {
    const list = getFoodLog();
    const wrap = $('food-log');
    if (!list.length) {
      wrap.innerHTML = '<div class="food-empty">还没记录，点下方「添加食物」</div>';
      return;
    }
    let html = '';
    MEALS.forEach(([key, label]) => {
      const items = list.filter((x) => x.meal === key);
      if (!items.length) return;
      const sub = Math.round(items.reduce((s, x) => s + x.kcal * x.qty, 0));
      html += '<div class="meal-group"><div class="mg-head"><span class="tag">' + label + '</span><span class="sub">' + sub + ' kcal</span></div>';
      items.forEach((x) => {
        const idx = list.indexOf(x);
        html += '<div class="fl-item">'
          + '<div class="fl-name">' + x.name + '<small>' + x.unit + '</small></div>'
          + '<div class="fl-qty"><button data-dec="' + idx + '" aria-label="减">−</button><span class="q">' + x.qty + '</span><button data-inc="' + idx + '" aria-label="加">＋</button></div>'
          + '<div class="fl-kcal">' + Math.round(x.kcal * x.qty) + '</div>'
          + '<button class="fl-del" data-del="' + idx + '" aria-label="删除">×</button>'
          + '</div>';
      });
      html += '</div>';
    });
    wrap.innerHTML = html;
    wrap.querySelectorAll('[data-inc]').forEach((b) => b.addEventListener('click', () => changeQty(Number(b.dataset.inc), 1)));
    wrap.querySelectorAll('[data-dec]').forEach((b) => b.addEventListener('click', () => changeQty(Number(b.dataset.dec), -1)));
    wrap.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => removeFood(Number(b.dataset.del))));
  }

  function changeQty(idx, d) {
    const list = getFoodLog();
    if (!list[idx]) return;
    list[idx].qty += d;
    if (list[idx].qty <= 0) list.splice(idx, 1);
    setFoodLog(list);
    renderFoodLog(); renderIntake();
  }
  function removeFood(idx) {
    const list = getFoodLog();
    list.splice(idx, 1);
    setFoodLog(list);
    renderFoodLog(); renderIntake();
  }
  function addFood(food) {
    const list = getFoodLog();
    const exist = list.find((x) => x.name === food.name && x.meal === pickerMeal);
    if (exist) exist.qty += 1;
    else list.push({ name: food.name, unit: food.unit, kcal: food.kcal, protein: food.protein, qty: 1, meal: pickerMeal });
    setFoodLog(list);
    renderFoodLog(); renderIntake();
    toast('已加 ' + food.name);
  }

  function renderPicker() {
    const q = ($('fp-search').value || '').trim().toLowerCase();
    const list = (window.FOODS || []).filter((f) => {
      if (pickerCat !== '全部' && f.cat !== pickerCat) return false;
      if (q && f.name.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    const el = $('food-list');
    if (!list.length) { el.innerHTML = '<div class="fp-empty">没有匹配的食物</div>'; return; }
    el.innerHTML = list.map((f) =>
      '<button class="food-item' + (f.warn ? ' warn' : '') + '" data-name="' + f.name + '">'
      + '<span class="f-name">' + f.name + (f.warn ? ' <span class="f-warn">少碰</span>' : '') + '<small>' + f.unit + '</small></span>'
      + '<span class="f-p">蛋白' + f.protein + 'g</span>'
      + '<span class="f-kcal">' + f.kcal + '</span>'
      + '</button>'
    ).join('');
    el.querySelectorAll('.food-item').forEach((b) => b.addEventListener('click', () => {
      const f = (window.FOODS || []).find((x) => x.name === b.dataset.name);
      if (f) addFood(f);
    }));
  }

  function openPicker() { $('food-picker').hidden = false; renderPicker(); }
  function closePicker() { $('food-picker').hidden = true; }

  function initFoodLog() {
    renderIntake();
    renderFoodLog();
    $('open-picker').addEventListener('click', openPicker);
    document.querySelectorAll('#food-picker [data-close]').forEach((b) => b.addEventListener('click', closePicker));
    document.querySelectorAll('#meal-tabs button').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('#meal-tabs button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      pickerMeal = b.dataset.meal;
    }));
    document.querySelectorAll('#cat-chips button').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('#cat-chips button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      pickerCat = b.dataset.cat;
      renderPicker();
    }));
    $('fp-search').addEventListener('input', renderPicker);
    const h = new Date().getHours();
    pickerMeal = h < 10.5 ? '早' : h < 15 ? '午' : h < 20.5 ? '晚' : '加';
    const def = document.querySelector('#meal-tabs button[data-meal="' + pickerMeal + '"]');
    if (def) { document.querySelectorAll('#meal-tabs button').forEach((x) => x.classList.remove('active')); def.classList.add('active'); }
  }

  // ---------- 离线缓存（Service Worker） ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  // ---------- 启动 ----------
  function init() {
    renderDate();
    renderHero();
    renderTrain();
    renderTargets();
    initChecklist();
    initWater();
    initTabs();
    initProgress();
    initFoodLog();
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(renderChart, 180); });
  }
  init();
})();
