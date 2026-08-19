/**
 * AI Cyclone & Coastal Disaster Early Warning System
 * Shared JavaScript — Navigation, AI calls, formatters
 *
 * API_BASE_URL is defined in api-config.js (loaded before this file).
 */

/* ═══════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════ */
(function () {
  window.addEventListener('DOMContentLoaded', () => {
    // scrolled class
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('topnav');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    });

    // mobile menu
    const ham = document.getElementById('nav-hamburger');
    const mob = document.getElementById('nav-mobile');
    if (ham && mob) {
      ham.addEventListener('click', () => mob.classList.toggle('open'));
    }

    // mark active link — works for both /static/page.html and /Disaster-Management/page.html
    const path = location.pathname;
    document.querySelectorAll('.nav-link[data-page]').forEach(el => {
      const p = el.getAttribute('data-page'); // e.g. "index.html"
      if (path.endsWith(p) || path.endsWith(p.replace('.html', '')) ||
          (path === '/' && p === 'index.html')) {
        el.classList.add('active');
      }
    });
  });
})();

/* ═══════════════════════════════════════════════════════
   ANIMATED COUNTERS
═══════════════════════════════════════════════════════ */
function animateCounter(el, target, duration = 1800, suffix = '') {
  const start = 0;
  const step = target / (duration / 16);
  let current = start;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current).toLocaleString() + suffix;
    if (current >= target) clearInterval(timer);
  }, 16);
}

function initCounters() {
  document.querySelectorAll('[data-counter]').forEach(el => {
    const target = parseFloat(el.getAttribute('data-counter'));
    const suffix = el.getAttribute('data-suffix') || '';
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        animateCounter(el, target, 1800, suffix);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(el);
  });
}
window.addEventListener('DOMContentLoaded', initCounters);

/* ═══════════════════════════════════════════════════════
   AI OUTPUT FORMATTER
═══════════════════════════════════════════════════════ */
function formatAIOutput(text) {
  if (!text) return '<span class="text-muted">No response generated.</span>';
  return text
    .replace(/^(#{1,3} .+)$/gm, '<div class="ai-section">$1</div>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(RISK LEVEL|ALERT SEVERITY|READINESS STATUS|LOGISTICS STATUS|RESPONSE PRIORITY|OVERALL STATUS|OVERALL STATUS): (.+)/gi,
      (m, k, v) => `<div style="margin-top:12px;padding:10px 14px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:8px;"><span style="color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;">${k}:</span> <span style="color:#f87171;font-weight:800;font-size:14px;">${v}</span></div>`)
    .replace(/\n/g, '<br>');
}

/* ═══════════════════════════════════════════════════════
   GENERIC AGENT RUNNER
═══════════════════════════════════════════════════════ */
async function runAgent({ url, body, outputId, processingId, timerId }) {
  // Prepend API base URL — supports both localhost and public backend
  const fullUrl = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '') + url;
  const procEl = document.getElementById(processingId);
  const outEl  = document.getElementById(outputId);
  const timeEl = document.getElementById(timerId);

  if (procEl) procEl.classList.add('visible');
  if (outEl)  { outEl.classList.remove('visible'); outEl.innerHTML = '' }

  const t0 = Date.now();
  let tick;
  if (timeEl) {
    tick = setInterval(() => {
      timeEl.textContent = ((Date.now() - t0) / 1000).toFixed(1) + 's';
    }, 100);
  }

  try {
    const res  = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    clearInterval(tick);
    if (timeEl) timeEl.textContent = '✓ ' + ((Date.now() - t0) / 1000).toFixed(1) + 's';
    if (procEl) procEl.classList.remove('visible');

    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);

    // find content field
    const content = data.prediction || data.alert || data.plan || data.assessment || JSON.stringify(data, null, 2);
    if (outEl) {
      outEl.innerHTML = formatAIOutput(content);
      outEl.classList.add('visible');
      // save to session for reports
      saveReport(data);
    }
  } catch (e) {
    clearInterval(tick);
    if (procEl) procEl.classList.remove('visible');
    if (outEl) {
      const isNetwork = e instanceof TypeError && e.message.includes('fetch');
      const msg = isNetwork
        ? 'AI backend is currently unavailable. Please try again shortly.'
        : e.message;
      outEl.innerHTML = `<div style="color:var(--red2);padding:14px 16px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:8px;line-height:1.6;">
        ⚠️ <strong>Error:</strong> ${msg}
        ${isNetwork ? `<div style="margin-top:8px;font-size:11px;color:#64748b;">Attempted: <code>${fullUrl}</code></div>` : ''}
      </div>`;
      outEl.classList.add('visible');
    }
  }
}

/* ═══════════════════════════════════════════════════════
   ORCHESTRATION RUNNER
═══════════════════════════════════════════════════════ */
async function runOrchestration({ url, body, outputId, processingId, timerId }) {
  const fullUrl = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '') + url;
  const procEl = document.getElementById(processingId);
  const outEl  = document.getElementById(outputId);
  const timeEl = document.getElementById(timerId);

  if (procEl) procEl.classList.add('visible');
  if (outEl)  { outEl.classList.remove('visible'); outEl.innerHTML = '' }

  const t0 = Date.now();
  let tick;
  if (timeEl) {
    tick = setInterval(() => {
      timeEl.textContent = ((Date.now() - t0) / 1000).toFixed(1) + 's';
    }, 200);
  }

  try {
    const res  = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    clearInterval(tick);
    if (timeEl) timeEl.textContent = '✓ ' + ((Date.now() - t0) / 1000).toFixed(1) + 's';
    if (procEl) procEl.classList.remove('visible');

    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
    if (!outEl) return;

    const icons = { 'Cyclone Prediction':'🌪️','Fishermen Alert':'🎣','Evacuation Plan':'🚑','Resource Coordination':'📦','Damage Assessment':'🏠' };
    let html = '';

    // Executive summary
    if (data.executive_summary) {
      html += `<div style="background:rgba(6,182,212,.06);border:1px solid rgba(6,182,212,.25);border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:800;color:var(--cyan);margin-bottom:10px;">📋 EXECUTIVE BRIEFING</div>
        <div style="font-size:13px;line-height:1.8;color:var(--text2);">${formatAIOutput(data.executive_summary)}</div>
      </div>`;
    }

    // Individual outputs
    for (const [name, aData] of Object.entries(data.agent_outputs || {})) {
      const content = aData.prediction || aData.alert || aData.plan || aData.assessment || '';
      html += `<details style="margin-bottom:12px;" open>
        <summary style="cursor:pointer;padding:14px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:8px;list-style:none;">
          <span>${icons[name]||'🤖'}</span> ${name}
          <span class="badge badge-green" style="margin-left:auto;">✓ Done</span>
        </summary>
        <div style="padding:16px;border:1px solid var(--border);border-top:none;border-radius:0 0 10px 10px;font-size:12px;line-height:1.8;color:var(--text2);">
          ${formatAIOutput(content)}
        </div>
      </details>`;
    }
    for (const [name, err] of Object.entries(data.errors || {})) {
      html += `<div style="padding:12px 16px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:10px;color:var(--red2);font-size:12px;margin-bottom:8px;">⚠️ <b>${name}:</b> ${err}</div>`;
    }

    outEl.innerHTML = html;
    outEl.classList.add('visible');
    saveReport(data);
  } catch (e) {
    clearInterval(tick);
    if (procEl) procEl.classList.remove('visible');
    if (outEl) {
      const isNetwork = e instanceof TypeError && e.message.includes('fetch');
      const msg = isNetwork
        ? 'AI backend is currently unavailable. Please try again shortly.'
        : e.message;
      outEl.innerHTML = `<div style="color:var(--red2);padding:16px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:10px;line-height:1.6;">
        ⚠️ <strong>Orchestration error:</strong> ${msg}
        ${isNetwork ? `<div style="margin-top:8px;font-size:11px;color:#64748b;">Attempted: <code>${fullUrl}</code></div>` : ''}
      </div>`;
      outEl.classList.add('visible');
    }
  }
}

/* ═══════════════════════════════════════════════════════
   REPORT STORAGE  (sessionStorage — for Reports page)
═══════════════════════════════════════════════════════ */
function saveReport(data) {
  try {
    const key = 'cyclon_reports';
    const existing = JSON.parse(sessionStorage.getItem(key) || '[]');
    existing.unshift({ ...data, _ts: new Date().toISOString() });
    if (existing.length > 20) existing.length = 20;
    sessionStorage.setItem(key, JSON.stringify(existing));
  } catch (_) {}
}

function getReports() {
  try {
    return JSON.parse(sessionStorage.getItem('cyclon_reports') || '[]');
  } catch (_) { return [] }
}

/* ═══════════════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity .6s ease, transform .6s ease';
    obs.observe(el);
  });
});
