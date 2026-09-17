(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Language banner: offer Spanish when the browser prefers it, on English pages only. Never auto-redirect.
  var banner = document.getElementById('lang-banner');
  if (banner) {
    var prefersEs = (navigator.languages || [navigator.language || '']).some(function (l) { return /^es\b/i.test(l); });
    var dismissed = false;
    try { dismissed = localStorage.getItem('mpa-lang-banner') === 'dismissed'; } catch (e) {}
    if (prefersEs && !dismissed) banner.hidden = false;
    var close = banner.querySelector('.lang-banner-close');
    if (close) close.addEventListener('click', function () { banner.hidden = true; try { localStorage.setItem('mpa-lang-banner', 'dismissed'); } catch (e) {} });
  }

  // Header shrink on scroll
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 24); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  // Hero video: honor reduced motion, pause when scrolled away
  var hv = document.querySelector('.hero-video');
  if (hv) {
    if (reduce) { hv.removeAttribute('autoplay'); hv.pause(); }
    else {
      var vio = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? hv.play().catch(function(){}) : hv.pause(); }); }, { threshold: 0.05 });
      vio.observe(hv);
    }
  }

  // Mobile nav
  var toggle = document.querySelector('.nav-toggle');
  var list = document.getElementById('nav-list');
  if (toggle && list) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      list.classList.toggle('is-open', !open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && list.classList.contains('is-open')) {
        toggle.setAttribute('aria-expanded', 'false'); list.classList.remove('is-open'); toggle.focus();
      }
    });
  }

  // Hero headline: wrap words for rise animation
  document.querySelectorAll('.hero h1[data-split]').forEach(function (h) {
    var html = '';
    var parts = h.innerHTML.split(/(<[^>]+>)/g); // keep inline tags
    var i = 0;
    parts.forEach(function (p) {
      if (!p) return;
      if (p[0] === '<') { html += p; return; }
      p.split(/(\s+)/).forEach(function (w) {
        if (!w.trim()) { html += w; return; }
        html += '<span class="w"><span style="animation-delay:' + (0.15 + i * 0.07).toFixed(2) + 's">' + w + '</span></span>';
        i++;
      });
    });
    h.innerHTML = html;
  });

  // Reveal on scroll
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  document.querySelectorAll('.reveal, .stagger, .tl-item').forEach(function (el) { io.observe(el); });

  // Count-up stats
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1400, start = null;
    var isYear = target > 1000;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = isYear ? Math.round(target - (target - 1990) * (1 - eased)) : Math.round(target * eased);
      el.innerHTML = v + (suffix ? '<sup>' + suffix + '</sup>' : '');
      if (p < 1) requestAnimationFrame(step);
    }
    if (reduce) { el.innerHTML = target + (suffix ? '<sup>' + suffix + '</sup>' : ''); return; }
    requestAnimationFrame(step);
  }
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });

  // MPA Way sticky storyboard
  var scene = document.querySelector('.scene-way');
  var steps = document.querySelectorAll('.way-step');
  if (scene && steps.length) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          steps.forEach(function (s) { s.classList.remove('is-active'); });
          e.target.classList.add('is-active');
          scene.setAttribute('data-step', e.target.getAttribute('data-step'));
        }
      });
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    steps.forEach(function (s) { sio.observe(s); });
    if (window.innerWidth <= 1000) { scene.setAttribute('data-step', '4'); steps.forEach(function (s) { s.classList.add('is-active'); }); }
  }

  // Timeline progress line
  var tl = document.querySelector('.timeline');
  var prog = document.querySelector('.timeline-progress');
  if (tl && prog) {
    function tlScroll() {
      var r = tl.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = Math.min(Math.max((vh * 0.7 - r.top) / r.height, 0), 1);
      prog.style.height = (p * 100) + '%';
    }
    tlScroll(); window.addEventListener('scroll', tlScroll, { passive: true });
  }

  // Web forms -> MPA forms endpoint
  document.querySelectorAll('form.web-form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = f.querySelector('.form-status'), btn = f.querySelector('button[type=submit]');
      var data = {};
      new FormData(f).forEach(function (v, k) { data[k] = v; });
      if (!data.name || !data.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email) || (f.querySelector('textarea[required]') && !data.message)) {
        status.textContent = f.getAttribute('data-msg-invalid'); status.className = 'form-status is-error'; return;
      }
      btn.disabled = true; status.textContent = f.getAttribute('data-msg-sending'); status.className = 'form-status';
      fetch(f.getAttribute('action'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok) { f.classList.add('is-sent'); status.textContent = f.getAttribute('data-msg-sent'); status.className = 'form-status is-ok'; }
          else { throw new Error(res.j && res.j.error || 'send failed'); }
        })
        .catch(function (err) {
          btn.disabled = false;
          var mail = f.querySelector('.form-fallback a');
          status.innerHTML = f.getAttribute('data-msg-failed') + ' ' + (mail ? mail.outerHTML : '') + ' (' + String(err.message).replace(/</g, '&lt;') + ')';
          status.className = 'form-status is-error';
        });
    });
  });

  // Project filters
  var chips = document.querySelectorAll('.chip[data-filter]');
  var projects = document.querySelectorAll('.project[data-type]');
  if (chips.length && projects.length) {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        projects.forEach(function (p) { p.hidden = !(f === 'all' || p.getAttribute('data-type') === f); });
      });
    });
  }
})();
