/* ScrollExpand — vanilla implementation of the React Bits component's
   documented API: src / alt / title / scrollHint / useWindowScroll /
   mediaZoom / children. A sticky stage holds a clip-path frame that opens
   as you scroll while the media eases out of its zoom; the title and hint
   fade out and the overlay content fades in. */
(function (global) {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function range(value, from, to) {
    return clamp((value - from) / (to - from), 0, 1);
  }

  function ScrollExpand(host, options) {
    var o = options || {};
    var windowed = Boolean(o.useWindowScroll);
    var mediaZoom = o.mediaZoom == null ? 1.35 : o.mediaZoom;
    var insetX = o.insetX == null ? 26 : o.insetX;
    var insetY = o.insetY == null ? 24 : o.insetY;
    var radius = o.radius == null ? 28 : o.radius;

    var root = document.createElement('div');
    root.className =
      'scroll-expand ' +
      (windowed ? 'scroll-expand--window' : 'scroll-expand--contained') +
      (o.className ? ' ' + o.className : '');

    var track = document.createElement('div');
    track.className = 'scroll-expand__track';
    if (o.track) track.style.setProperty('--se-track', o.track);

    var stage = document.createElement('div');
    stage.className = 'scroll-expand__stage';

    var frame = document.createElement('div');
    frame.className = 'scroll-expand__frame';

    var mediaNode;
    if (o.media instanceof Node) {
      mediaNode = document.createElement('div');
      mediaNode.className = 'scroll-expand__media-slot';
      mediaNode.appendChild(o.media);
    } else if (o.poster || o.src) {
      mediaNode = document.createElement('img');
      mediaNode.className = 'scroll-expand__media';
      mediaNode.src = o.poster || o.src;
      mediaNode.alt = o.alt || '';
      mediaNode.loading = 'lazy';
      mediaNode.decoding = 'async';
    } else {
      mediaNode = document.createElement('div');
      mediaNode.className = 'scroll-expand__media-slot';
    }
    frame.appendChild(mediaNode);

    var scrim = document.createElement('div');
    scrim.className = 'scroll-expand__scrim';
    frame.appendChild(scrim);
    stage.appendChild(frame);

    var titleNode = null;
    if (o.title) {
      titleNode = document.createElement('h2');
      titleNode.className = 'scroll-expand__title';
      titleNode.innerHTML = o.title;
      stage.appendChild(titleNode);
    }

    var hintNode = null;
    if (o.scrollHint) {
      hintNode = document.createElement('span');
      hintNode.className = 'scroll-expand__hint';
      hintNode.innerHTML =
        '<span class="scroll-expand__hint-rail" aria-hidden="true"></span><span>' + o.scrollHint + '</span>';
      stage.appendChild(hintNode);
    }

    var overlay = null;
    if (o.children) {
      overlay = document.createElement('div');
      overlay.className = 'scroll-expand__overlay';
      var overlayInner = document.createElement('div');
      overlayInner.className = 'scroll-expand__overlay-inner';
      if (typeof o.children === 'string') overlayInner.innerHTML = o.children;
      else overlayInner.appendChild(o.children);
      overlay.appendChild(overlayInner);
      stage.appendChild(overlay);
    }

    track.appendChild(stage);
    root.appendChild(track);
    host.appendChild(root);

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var scroller = windowed ? window : root;
    var raf = 0;
    var written = {};

    function set(name, value) {
      if (written[name] === value) return;
      written[name] = value;
      stage.style.setProperty(name, value);
    }

    function progress() {
      if (windowed) {
        var rect = track.getBoundingClientRect();
        var span = Math.max(1, rect.height - window.innerHeight);
        return clamp(-rect.top / span, 0, 1);
      }
      var span2 = Math.max(1, root.scrollHeight - root.clientHeight);
      return clamp(root.scrollTop / span2, 0, 1);
    }

    function apply() {
      raf = 0;
      var raw = reduce.matches ? 1 : progress();
      var p = smoothstep(clamp(raw / 0.78, 0, 1));

      set('--se-inset-x', (insetX * (1 - p)).toFixed(3) + '%');
      set('--se-inset-y', (insetY * (1 - p)).toFixed(3) + '%');
      set('--se-radius', (radius * (1 - p) + 2).toFixed(2) + 'px');
      set('--se-zoom', (1 + (mediaZoom - 1) * (1 - p)).toFixed(4));
      set('--se-scrim', (0.22 + 0.56 * p).toFixed(3));

      var titleOut = range(raw, 0.3, 0.72);
      set('--se-title-opacity', (1 - titleOut).toFixed(3));
      set('--se-title-shift', (-56 * titleOut).toFixed(1) + 'px');

      var hintOut = range(raw, 0.02, 0.22);
      set('--se-hint-opacity', (1 - hintOut).toFixed(3));

      var overlayIn = smoothstep(range(raw, 0.6, 0.94));
      set('--se-overlay-opacity', overlayIn.toFixed(3));
      set('--se-overlay-shift', (24 * (1 - overlayIn)).toFixed(1) + 'px');

      if (o.onProgress) o.onProgress(raw);
    }

    function schedule() {
      if (!raf) raf = requestAnimationFrame(apply);
    }

    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    var observer = new ResizeObserver(schedule);
    observer.observe(track);
    apply();

    return { root: root, stage: stage, frame: frame, media: mediaNode, refresh: schedule };
  }

  global.ScrollExpand = ScrollExpand;
})(window);
