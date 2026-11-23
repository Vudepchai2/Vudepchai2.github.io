/* Small effects, written in plain JS after React Bits components (reactbits.dev):
   BlurText, TiltedCard, Magnet, SpotlightCard and ClickSpark. No framework, no build step. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.documentElement.classList.add('js');

  /* BlurText: words drop in from a blur, one after another */
  document.querySelectorAll('[data-blur-text]').forEach(function (el) {
    var i = 0;
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var span = document.createElement('span');
            span.className = 'bw';
            span.style.setProperty('--w', i++);
            span.textContent = part;
            frag.appendChild(span);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          wrap(child);
        }
      });
    })(el);
    requestAnimationFrame(function () { el.classList.add('is-in'); });
  });

  if (reduce) return;

  /* TiltedCard: the card leans toward the pointer and lifts */
  if (finePointer) document.querySelectorAll('[data-tilt]').forEach(function (card) {
    var inner = card.querySelector('.tilt__inner');
    var amp = 14;
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add('is-active');
      inner.style.transform = 'rotateX(' + (-y * amp) + 'deg) rotateY(' + (x * amp) + 'deg) scale(1.06)';
    });
    card.addEventListener('pointerleave', function () {
      card.classList.remove('is-active');
      inner.style.transform = '';
    });
  });

  /* Magnet: the button drifts toward a nearby pointer */
  if (finePointer) document.querySelectorAll('[data-magnet]').forEach(function (el) {
    var pad = 80, strength = 4;
    window.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var near = Math.abs(e.clientX - cx) < r.width / 2 + pad && Math.abs(e.clientY - cy) < r.height / 2 + pad;
      if (near) {
        el.classList.add('is-pulled');
        el.style.transform = 'translate3d(' + (e.clientX - cx) / strength + 'px,' + (e.clientY - cy) / strength + 'px,0)';
      } else if (el.classList.contains('is-pulled')) {
        el.classList.remove('is-pulled');
        el.style.transform = '';
      }
    }, { passive: true });
  });

  /* SpotlightCard: a soft light follows the pointer across each row */
  document.querySelectorAll('[data-spotlight] .rows li').forEach(function (li) {
    li.addEventListener('pointermove', function (e) {
      var r = li.getBoundingClientRect();
      li.style.setProperty('--mx', (e.clientX - r.left + 12) + 'px');
      li.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ClickSpark: short lines burst from every click */
  var canvas = document.createElement('canvas');
  canvas.className = 'spark-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var sparks = [], running = false, dpr = Math.min(window.devicePixelRatio || 1, 2);
  function size() { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); window.addEventListener('resize', size);
  var color = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#062b8a';
  function tick(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    sparks = sparks.filter(function (s) {
      var t = (now - s.start) / 420;
      if (t >= 1) return false;
      var ease = t * (2 - t), d = ease * 26, len = 9 * (1 - ease);
      var x1 = s.x + d * Math.cos(s.a), y1 = s.y + d * Math.sin(s.a);
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + len * Math.cos(s.a), y1 + len * Math.sin(s.a)); ctx.stroke();
      return true;
    });
    if (sparks.length) requestAnimationFrame(tick); else running = false;
  }
  document.addEventListener('pointerdown', function (e) {
    var now = performance.now();
    for (var k = 0; k < 8; k++) sparks.push({ x: e.clientX, y: e.clientY, a: (Math.PI * 2 * k) / 8, start: now });
    if (!running) { running = true; requestAnimationFrame(tick); }
  });
})();
