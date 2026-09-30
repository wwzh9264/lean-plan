(function () {
  'use strict';

  // ---------- 个人数据 ----------
  const HEIGHT = 173;          // cm
  const START = 75.0;          // 起始体重 kg（150 斤）
  const TARGET = 66.0;         // 目标体重 kg
  const BMI_DIV = (HEIGHT / 100) * (HEIGHT / 100); // 2.9929

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

  // ---------- 今日训练 ----------
  function renderTrain() {
    const t = TRAIN[new Date().getDay()] || REST;
    $('tt-day').textContent = t.day === '休息' ? '休' : t.day.slice(1);
    $('tt-name').textContent = t.name;
    $('tt-sub').textContent = `${t.day} · ${t.sub}`;
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
      renderHero(); renderStats(); renderChart();
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
    initChecklist();
    initWater();
    initTabs();
    initProgress();
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(renderChart, 180); });
  }
  init();
})();
