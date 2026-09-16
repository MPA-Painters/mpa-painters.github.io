/* MPA animated scenes. Everything runs on the Web Animations API so a scene can
   be paused and seeked (window.__mpaSeek) for frame-accurate video export. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anims = [];
  var EASE = 'cubic-bezier(.22,1,.36,1)';

  function add(el, keyframes, total) {
    var a = el.animate(keyframes, { duration: total, iterations: Infinity, easing: 'linear', fill: 'both' });
    anims.push(a);
    return a;
  }
  // Build keyframes for one property that holds `a`, moves to `b` between t0..t1, holds, then resets at loop end.
  function seg(total, prop, a, b, t0, t1, resetAt) {
    var pct = function (ms) { return Math.max(0, Math.min(1, ms / total)); };
    var k = function (off, v, e) { var o = { offset: off }; o[prop] = v; if (e) o.easing = e; return o; };
    var r = resetAt == null ? total - 300 : resetAt;
    var frames = [k(0, a), k(pct(t0), a, EASE), k(pct(t1), b), k(pct(r), b), k(1, a)];
    // offsets must be non-decreasing
    for (var i = 1; i < frames.length; i++) if (frames[i].offset < frames[i - 1].offset) frames[i].offset = frames[i - 1].offset;
    return frames;
  }
  // Visible only inside a window [t0, t1)
  function win(total, prop, off, on, t0, t1) {
    var pct = function (ms) { return Math.max(0, Math.min(1, ms / total)); };
    var k = function (o, v) { var f = { offset: o }; f[prop] = v; return f; };
    var frames = [k(0, off)];
    if (t0 > 0) { frames.push(k(pct(t0) - 0.0001, off)); }
    frames.push(k(pct(t0), on), k(pct(t1) - 0.0001, on), k(pct(t1), off), k(1, off));
    for (var i = 1; i < frames.length; i++) if (frames[i].offset < frames[i - 1].offset) frames[i].offset = frames[i - 1].offset;
    return frames;
  }

  // ---- Building: floors primed (sky) then finished (white), bottom to top;
  //      a red crew marker climbs with the work; loop. ----
  document.querySelectorAll('.scene-building').forEach(function (svg) {
    var floors = Array.prototype.slice.call(svg.querySelectorAll('.floor-group'));
    var n = floors.length, per = 1100, total = per * n + 2600;
    svg.setAttribute('data-duration', total);
    floors.forEach(function (g, i) {
      var t0 = i * per;
      var primer = g.querySelector('.primer'), finish = g.querySelector('.finish'), tick = g.querySelector('.tick');
      if (primer) add(primer, seg(total, 'transform', 'scaleX(0)', 'scaleX(1)', t0, t0 + 600), total);
      if (finish) add(finish, seg(total, 'transform', 'scaleX(0)', 'scaleX(1)', t0 + 500, t0 + per), total);
      if (tick) add(tick, seg(total, 'opacity', 0, 1, t0 + per - 80, t0 + per + 80), total);
    });
    var rig = svg.querySelector('.rig');
    if (rig && n) {
      var dy = parseFloat(rig.getAttribute('data-dy'));
      var frames = [];
      for (var i = 0; i < n; i++) frames.push({ offset: (i * per) / total, transform: 'translateY(' + (-i * dy) + 'px)', easing: EASE });
      frames.push({ offset: (n * per) / total, transform: 'translateY(' + (-(n - 1) * dy) + 'px)' });
      frames.push({ offset: (total - 400) / total, transform: 'translateY(' + (-(n - 1) * dy) + 'px)' });
      frames.push({ offset: 1, transform: 'translateY(0px)' });
      add(rig, frames, total);
      var beam = svg.querySelector('.rig-beam');
      if (beam) anims.push(beam.animate([{ opacity: .35 }, { opacity: 1 }, { opacity: .35 }], { duration: 900, iterations: Infinity }));
    }
    var counter = svg.querySelector('.floor-count');
    if (counter) { counter.setAttribute('data-per', per); counter.setAttribute('data-total', total); counter.setAttribute('data-n', n); }
  });

  // ---- MPA Way, autoplay mode (clips): the whole storyboard on one WAAPI timeline ----
  document.querySelectorAll('.scene-way[data-autoplay]').forEach(function (svg) {
    var step = parseInt(svg.getAttribute('data-autoplay'), 10) || 2600;
    var total = step * 5;
    svg.setAttribute('data-duration', total);
    svg.removeAttribute('data-step');           // CSS state rules stay inert; WAAPI owns every layer
    svg.classList.add('is-autoplay');
    var q = function (s) { return svg.querySelector(s); };
    var qa = function (s) { return Array.prototype.slice.call(svg.querySelectorAll(s)); };
    var S = function (i) { return i * step; };
    // layers
    add(q('.primer'), seg(total, 'opacity', 0, 1, S(1), S(1) + 50, total - 200), total);
    add(q('.primer rect'), seg(total, 'transform', 'scaleX(0)', 'scaleX(1)', S(1), S(1) + 1400, total - 200), total);
    add(q('.finish'), seg(total, 'opacity', 0, 1, S(2), S(2) + 50, total - 200), total);
    add(q('.finish rect'), seg(total, 'transform', 'scaleX(0)', 'scaleX(1)', S(2), S(2) + 1400, total - 200), total);
    add(q('.qc'), seg(total, 'opacity', 0, 1, S(3), S(3) + 50, total - 200), total);
    qa('.qc path').forEach(function (p, i) { add(p, seg(total, 'strokeDashoffset', 60, 0, S(3) + i * 160, S(3) + i * 160 + 500, total - 200), total); });
    add(q('.plan'), seg(total, 'opacity', 0, 1, S(4), S(4) + 300, total - 200), total);
    qa('.plan rect.bar').forEach(function (b, i) { add(b, seg(total, 'transform', 'scaleX(0)', 'scaleX(1)', S(4) + 300 + i * 120, S(4) + 300 + i * 120 + 700, total - 200), total); });
    // tools: each visible during its step; spray and roller sweep across with the coat
    add(q('.tool-prep'), win(total, 'opacity', 0, 1, 0, S(1)), total);
    add(q('.tool-spray'), win(total, 'opacity', 0, 1, S(1), S(2)), total);
    add(q('.tool-spray'), seg(total, 'transform', 'translate(120px, 250px)', 'translate(500px, 250px)', S(1), S(1) + 1400, S(2)), total);
    add(q('.tool-roller'), win(total, 'opacity', 0, 1, S(2), S(3)), total);
    add(q('.tool-roller'), seg(total, 'transform', 'translate(140px, 250px)', 'translate(500px, 250px)', S(2), S(2) + 1400, S(3)), total);
    // labels
    for (var i = 0; i < 5; i++) add(q('.l' + i), win(total, 'opacity', 0, 1, S(i), S(i + 1)), total);
  });

  // ---- Ticker for text that WAAPI cannot drive ----
  var t0 = null, paused = false, seekTo = null;
  function tick(now) {
    if (t0 === null) t0 = now;
    var t = seekTo !== null ? seekTo : (now - t0);
    document.querySelectorAll('.scene-building .floor-count').forEach(function (c) {
      var per = +c.getAttribute('data-per'), total = +c.getAttribute('data-total'), n = +c.getAttribute('data-n');
      var lt = t % total;
      c.textContent = lt >= per * n ? n : Math.floor(lt / per);
    });
    document.querySelectorAll('[data-countto]').forEach(function (el) {
      var target = +el.getAttribute('data-countto'), start = +el.getAttribute('data-start') || 0, dur = +el.getAttribute('data-dur') || 1400;
      var p = Math.max(0, Math.min(1, (t - start) / dur));
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (el.getAttribute('data-suffix') || '');
    });
    if (!paused) requestAnimationFrame(tick);
  }
  if (!reduce) requestAnimationFrame(tick);
  else anims.forEach(function (a) { a.pause(); a.currentTime = 0; });

  // ---- Export hooks ----
  window.__mpaSeek = function (ms) {
    paused = true; seekTo = ms;
    document.documentElement.classList.add('is-seeking');
    tick(performance.now());
    document.getAnimations().forEach(function (a) { try { a.pause(); a.currentTime = ms; } catch (e) {} });
  };
  window.__mpaDuration = function () {
    var d = 0;
    document.querySelectorAll('[data-duration]').forEach(function (el) { d = Math.max(d, +el.getAttribute('data-duration')); });
    return d || 12000;
  };
})();
