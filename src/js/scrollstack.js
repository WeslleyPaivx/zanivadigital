/* ScrollStack — vanilla port of the React Bits component (JS + CSS variant).
   Same DOM, class names and stacking maths; props arrive as an options object. */
(function (global) {
  'use strict';

  function resolveOffset(value, size) {
    if (typeof value === 'number') return value;
    var text = String(value).trim();
    if (text.slice(-1) === '%') return (parseFloat(text) / 100) * size;
    return parseFloat(text) || 0;
  }

  function toLength(value) {
    return typeof value === 'number' ? value + 'px' : value;
  }

  function scrollsInside(node, stop, delta) {
    for (var element = node; element && element !== stop; element = element.parentElement) {
      if (element.scrollHeight <= element.clientHeight + 1) continue;
      var overflow = getComputedStyle(element).overflowY;
      if (overflow !== 'auto' && overflow !== 'scroll') continue;
      if (
        delta > 0
          ? element.scrollTop + element.clientHeight < element.scrollHeight - 1
          : element.scrollTop > 0
      ) {
        return true;
      }
    }
    return false;
  }

  function ScrollStack(host, options) {
    var o = options || {};
    var itemDistance = o.itemDistance == null ? 100 : o.itemDistance;
    var itemStackDistance = o.itemStackDistance == null ? 24 : o.itemStackDistance;
    var stackPosition = o.stackPosition == null ? '15%' : o.stackPosition;
    var itemScale = o.itemScale == null ? 0.05 : o.itemScale;
    var baseScale = o.baseScale == null ? 0.8 : o.baseScale;
    var dimAmount = o.dimAmount == null ? 0.2 : o.dimAmount;
    var blurAmount = o.blurAmount == null ? 0 : o.blurAmount;
    var tiltAmount = o.tiltAmount == null ? 0 : o.tiltAmount;
    var rotationAmount = o.rotationAmount == null ? 0 : o.rotationAmount;
    var holdDistance = o.holdDistance == null ? 200 : o.holdDistance;
    var smoothScroll = o.smoothScroll !== false;
    var snap = Boolean(o.snap);
    var windowed = Boolean(o.useWindowScroll);
    var itemClassName = o.itemClassName || '';
    var cardsData = o.items || [];

    var root = document.createElement('div');
    root.className =
      'scroll-stack ' +
      (windowed ? 'scroll-stack--window' : 'scroll-stack--contained') +
      (o.className ? ' ' + o.className : '');
    var inner = document.createElement('div');
    inner.className = 'scroll-stack__inner';
    root.appendChild(inner);

    cardsData.forEach(function (render, index) {
      if (index > 0) {
        var gap = itemDistance - (cardsData.length - index) * itemStackDistance;
        var spacer = document.createElement('div');
        spacer.setAttribute('aria-hidden', 'true');
        spacer.style.height = Math.max(0, gap) + 'px';
        spacer.style.marginTop = Math.min(0, gap) + 'px';
        inner.appendChild(spacer);
      }
      var slot = document.createElement('div');
      slot.setAttribute('data-stack-slot', '');
      slot.className = 'scroll-stack__slot';
      slot.style.top = 'calc(' + toLength(stackPosition) + ' + ' + index * itemStackDistance + 'px)';
      slot.style.marginBottom = (cardsData.length - 1 - index) * itemStackDistance + 'px';
      slot.style.zIndex = String(index + 1);

      var card = document.createElement('div');
      card.className = ('scroll-stack-card ' + itemClassName).trim();
      if (typeof render === 'string') card.innerHTML = render;
      else if (render instanceof Node) card.appendChild(render);
      else if (typeof render === 'function') card.innerHTML = render(index);
      var shade = document.createElement('span');
      shade.className = 'scroll-stack-card__shade';
      shade.setAttribute('aria-hidden', 'true');
      card.appendChild(shade);

      slot.appendChild(card);
      inner.appendChild(slot);
    });

    var end = document.createElement('div');
    end.className = 'scroll-stack__end';
    end.setAttribute('aria-hidden', 'true');
    inner.appendChild(end);
    host.appendChild(root);

    var target = windowed ? window : root;
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var cache = {};
    var frame = 0;
    var glide = 0;
    var rest = 0;
    var complete = false;
    var gliding = false;
    var pressed = false;
    var current = 0;
    var goal = 0;
    var written = 0;
    var last = 0;
    var points = [];
    var reach = 0;

    function readScroll() {
      return windowed ? window.scrollY : root.scrollTop;
    }

    function maxScroll() {
      return windowed
        ? document.documentElement.scrollHeight - window.innerHeight
        : root.scrollHeight - root.clientHeight;
    }

    function writeScroll(value) {
      written = value;
      target.scrollTo({ top: value, behavior: 'instant' });
    }

    function write(key, value, apply) {
      if (cache[key] === value) return false;
      cache[key] = value;
      apply(value);
      return true;
    }

    function update() {
      frame = 0;
      var slots = Array.prototype.filter.call(inner.children, function (child) {
        return child.hasAttribute && child.hasAttribute('data-stack-slot');
      });
      if (!slots.length) return;

      var viewHeight = windowed ? window.innerHeight : root.clientHeight;
      var viewTop = windowed ? 0 : root.getBoundingClientRect().top + root.clientTop;
      var stackTop = resolveOffset(stackPosition, viewHeight);
      var offset = itemStackDistance;
      var heights = slots.map(function (slot) {
        return slot.offsetHeight;
      });
      var tops = slots.map(function (slot) {
        return slot.getBoundingClientRect().top;
      });
      var lastPin = stackTop + (slots.length - 1) * offset;
      var padTop = windowed ? 0 : stackTop;
      var endHeight =
        holdDistance + (windowed ? 0 : Math.max(0, viewHeight - lastPin - heights[heights.length - 1]));

      var moved = write('padTop', padTop, function (value) {
        inner.style.paddingTop = value + 'px';
      });
      moved =
        write('endHeight', endHeight, function (value) {
          end.style.height = value + 'px';
        }) || moved;

      var flow = inner.getBoundingClientRect().top - viewTop + readScroll() + padTop;
      points = heights.map(function (height, i) {
        var point = flow - stackTop - i * offset;
        flow += height + itemDistance;
        return point;
      });
      reach = Math.max(40, (heights[0] + itemDistance - offset) / 2);

      var depths = slots.map(function () {
        return 0;
      });
      var lastCover = 0;
      for (var j = 1; j < slots.length; j++) {
        var pinBefore = viewTop + stackTop + (j - 1) * offset;
        var start = pinBefore + heights[j - 1];
        var span = Math.max(1, start - pinBefore - offset);
        var cover = Math.min(1, Math.max(0, (start - tops[j]) / span));
        for (var i2 = 0; i2 < j; i2++) depths[i2] += cover;
        lastCover = cover;
      }

      var dimStep = Math.min(Math.max(dimAmount, 0), 1);
      slots.forEach(function (slot, i) {
        var card = slot.firstElementChild;
        if (!card) return;
        var depth = depths[i];
        var lean = Math.min(depth, 1);
        var scale = Math.max(Math.min(baseScale, 1), 1 - depth * itemScale);
        var tilt = -lean * tiltAmount;
        var turn = lean * rotationAmount * (i % 2 ? -1 : 1);
        var blur = depth * blurAmount;
        var dim = 1 - Math.pow(1 - dimStep, depth);
        var transform =
          depth < 0.0005
            ? ''
            : 'perspective(1200px) rotateX(' +
              tilt.toFixed(2) +
              'deg) rotate(' +
              turn.toFixed(2) +
              'deg) scale(' +
              scale.toFixed(4) +
              ')';
        write('transform' + i, transform, function (value) {
          card.style.transform = value;
        });
        write('filter' + i, blur > 0.01 ? 'blur(' + blur.toFixed(2) + 'px)' : '', function (value) {
          card.style.filter = value;
        });
        write('dim' + i, dim.toFixed(3), function (value) {
          card.style.setProperty('--scroll-stack-dim', value);
        });
      });

      var done = slots.length > 1 && lastCover >= 0.999;
      if (done !== complete) {
        complete = done;
        if (done && o.onStackComplete) o.onStackComplete();
      }

      if (moved) schedule();
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    function step(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (Math.abs(readScroll() - written) > 2) {
        gliding = false;
        glide = 0;
        settleSoon();
        return;
      }
      current += (goal - current) * (1 - Math.pow(0.9, dt * 60));
      if (Math.abs(goal - current) < 0.5) current = goal;
      writeScroll(current);
      if (current === goal) {
        gliding = false;
        glide = 0;
        settleSoon();
        return;
      }
      glide = requestAnimationFrame(step);
    }

    function glideTo(value) {
      goal = Math.min(Math.max(value, 0), maxScroll());
      if (motion.matches) {
        writeScroll(goal);
        return;
      }
      if (gliding) return;
      gliding = true;
      current = readScroll();
      written = current;
      last = performance.now();
      glide = requestAnimationFrame(step);
    }

    function settle() {
      rest = 0;
      if (!snap || gliding || pressed || !points.length) return;
      var now = readScroll();
      var nearest = points.reduce(function (best, point) {
        return Math.abs(point - now) < Math.abs(best - now) ? point : best;
      });
      var gap = Math.abs(nearest - now);
      if (gap > 1 && gap < reach) glideTo(nearest);
    }

    function settleSoon() {
      window.clearTimeout(rest);
      rest = window.setTimeout(settle, 140);
    }

    function onScroll() {
      schedule();
      if (!gliding) settleSoon();
    }

    function onWheel(event) {
      if (!smoothScroll || motion.matches || event.defaultPrevented || event.ctrlKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      var page = windowed ? window.innerHeight : root.clientHeight;
      var delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? page : 1);
      if (!delta || scrollsInside(event.target, windowed ? document.body : root, delta)) return;
      var base = gliding ? goal : readScroll();
      if ((delta < 0 && base <= 0) || (delta > 0 && base >= maxScroll() - 0.5)) return;
      event.preventDefault();
      window.clearTimeout(rest);
      glideTo(base + delta);
    }

    function onPress() {
      pressed = true;
      window.clearTimeout(rest);
    }

    function onRelease() {
      if (!pressed) return;
      pressed = false;
      settleSoon();
    }

    var observer = new ResizeObserver(schedule);
    observer.observe(root);
    observer.observe(inner);
    target.addEventListener('scroll', onScroll, { passive: true });
    if (smoothScroll) target.addEventListener('wheel', onWheel, { passive: false });
    target.addEventListener('pointerdown', onPress, { passive: true });
    window.addEventListener('pointerup', onRelease, { passive: true });
    window.addEventListener('pointercancel', onRelease, { passive: true });
    window.addEventListener('resize', schedule);
    update();

    return { root: root, refresh: schedule };
  }

  global.ScrollStack = ScrollStack;
})(window);
