(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
