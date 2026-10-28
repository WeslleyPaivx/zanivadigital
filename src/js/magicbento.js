/* MagicBento — vanilla port of the React Bits component (JS + CSS variant).
   Same DOM, class names, lighting/border-glow/wave engine and props.
   The Hugeicons dependency is replaced with inline SVG glyphs, and the
   built-in visuals take their copy from a config object so the grid can
   speak the site's language. */
(function (global) {
  'use strict';

  var THEMES = {
    dark: {
      '--mb-surface': 'linear-gradient(180deg, #1a1820 0%, #121116 100%)',
      '--mb-edge': 'rgba(255, 255, 255, 0.07)',
      '--mb-highlight': 'rgba(255, 255, 255, 0.06)',
      '--mb-shadow': '0 24px 48px -28px rgba(0, 0, 0, 0.85), 0 8px 18px -12px rgba(0, 0, 0, 0.6)',
      '--mb-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
      '--mb-tile-edge': 'rgba(255, 255, 255, 0.07)',
      '--mb-tile-highlight': 'rgba(255, 255, 255, 0.12)',
      '--mb-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
      '--mb-well': 'rgba(255, 255, 255, 0.03)',
      '--mb-well-edge': 'rgba(255, 255, 255, 0.06)',
      '--mb-ink': '#f4f4f5',
      '--mb-muted': 'rgba(244, 244, 245, 0.6)',
      '--mb-faint': 'rgba(244, 244, 245, 0.3)',
      '--mb-line': 'rgba(244, 244, 245, 0.1)',
      '--mb-secondary': '#a1a1aa',
      '--mb-secondary-ink': '#121016',
      '--mb-cursor-stroke': 'rgba(18, 16, 22, 0.9)',
      '--mb-ring': 'rgba(18, 16, 22, 0.85)',
      '--mb-focus': 'rgba(244, 244, 245, 0.5)',
      '--mb-glow-alpha': 0.85,
      '--mb-spot-alpha': 0.07
    },
    light: {
      '--mb-surface': 'linear-gradient(180deg, #ffffff 0%, #f7f7f9 100%)',
      '--mb-edge': 'rgba(24, 24, 27, 0.08)',
      '--mb-highlight': 'rgba(255, 255, 255, 1)',
      '--mb-shadow': '0 24px 48px -30px rgba(24, 24, 27, 0.28), 0 8px 18px -14px rgba(24, 24, 27, 0.16)',
      '--mb-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
      '--mb-tile-edge': 'rgba(24, 24, 27, 0.08)',
      '--mb-tile-highlight': 'rgba(255, 255, 255, 1)',
      '--mb-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.22)',
      '--mb-well': 'rgba(24, 24, 27, 0.025)',
      '--mb-well-edge': 'rgba(24, 24, 27, 0.06)',
      '--mb-ink': '#18181b',
      '--mb-muted': 'rgba(24, 24, 27, 0.6)',
      '--mb-faint': 'rgba(24, 24, 27, 0.3)',
      '--mb-line': 'rgba(24, 24, 27, 0.08)',
      '--mb-secondary': '#71717a',
      '--mb-secondary-ink': '#ffffff',
      '--mb-cursor-stroke': '#ffffff',
      '--mb-ring': '#ffffff',
      '--mb-focus': 'rgba(24, 24, 27, 0.4)',
      '--mb-glow-alpha': 0.5,
      '--mb-spot-alpha': 0.035
    }
  };

  var INK = { dark: [244, 244, 245], light: [24, 24, 27] };
  var MIN_CELL = 150;
  var MIN_PAIR = 200;
  var STAGGER = 80;
  var TILT = 6;
  var MAGNET = 6;

  /* ---------- inline glyphs (replacing the Hugeicons dependency) ---------- */

  function glyph(path, size, stroke) {
    return (
      '<svg width="' +
      size +
      '" height="' +
      size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' +
      (stroke || 1.8) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      path +
      '</svg>'
    );
  }

  var GLYPHS = {
    branch: '<circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="8" r="2.2"/><path d="M6 7.2v9.6M8.2 5H14a4 4 0 0 1 4 4v-.8"/>',
    check: '<path d="M4.5 12.5 9.5 17.5 19.5 7"/>',
    spark: '<path d="M12 3.5 13.9 9 19.5 10.9 13.9 12.8 12 18.4 10.1 12.8 4.5 10.9 10.1 9Z"/><path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z"/>',
    key: '<circle cx="8" cy="12" r="3.4"/><path d="M11.4 12H20M17.4 12v3M14.6 12v2.2"/>',
    finger: '<path d="M7 11a5 5 0 0 1 10 0v2.2"/><path d="M9.6 11a2.4 2.4 0 0 1 4.8 0v3.4a6 6 0 0 1-.9 3.2"/><path d="M7 14.2v1.4c0 1.4.4 2.7 1.2 3.8"/><path d="M4.4 9.2A8.6 8.6 0 0 1 12 4.6a8.6 8.6 0 0 1 7.6 4.6"/>',
    pin: '<path d="M12 21s6.5-5.6 6.5-10.5A6.5 6.5 0 0 0 5.5 10.5C5.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10.4" r="2.4"/>',
    chat: '<path d="M20.5 12.2c0 3.8-3.8 6.9-8.5 6.9-1 0-2-.15-2.9-.42L4 20.5l1.5-3.6A6.6 6.6 0 0 1 3.5 12.2c0-3.8 3.8-6.9 8.5-6.9s8.5 3.1 8.5 6.9Z"/>',
    window: '<rect x="3.2" y="4.6" width="17.6" height="14.8" rx="2.4"/><path d="M3.2 9.2h17.6M6.6 6.9h.01M9.4 6.9h.01"/>',
    phone: '<rect x="7" y="2.8" width="10" height="18.4" rx="2.6"/><path d="M10.6 18.4h2.8"/>',
    globe: '<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8M12 3.6c2.2 2.4 3.3 5.3 3.3 8.4s-1.1 6-3.3 8.4c-2.2-2.4-3.3-5.3-3.3-8.4s1.1-6 3.3-8.4Z"/>'
  };

  /* ---------- helpers ---------- */

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function parseRgb(value) {
    if (!value) return null;
    var text = String(value).trim();
    var hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
    if (hex) {
      var full =
        hex[1].length === 3
          ? hex[1].replace(/./g, function (digit) {
              return digit + digit;
            })
          : hex[1];
      return [0, 2, 4].map(function (index) {
        return parseInt(full.slice(index, index + 2), 16);
      });
    }
    var numbers = text.match(/[\d.]+/g);
    if (numbers && numbers.length >= 3 && /^(rgba?\(|[\d.\s,]+$)/i.test(text)) {
      return numbers.slice(0, 3).map(function (channel) {
        return clamp(Math.round(parseFloat(channel)), 0, 255);
      });
    }
    return null;
  }

  function inkFor(rgb) {
    var r = rgb[0] / 255;
    var g = rgb[1] / 255;
    var b = rgb[2] / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? '#121016' : '#ffffff';
  }

  function node(tag, className, html) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ---------- chart maths (monotone cubic) ---------- */

  function curve(values, width, height) {
    var top = 6;
    var bottom = 2;
    var low = Math.min.apply(null, values) * 0.7;
    var high = Math.max.apply(null, values);
    var points = values.map(function (value, index) {
      return [
        (index / (values.length - 1)) * width,
        top + (1 - (value - low) / (high - low)) * (height - top - bottom)
      ];
    });
    var count = points.length;
    var slopes = [];
    for (var i = 0; i < count - 1; i++) {
      slopes.push((points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]));
    }
    var tangents = points.map(function (_, i) {
      if (i === 0) return slopes[0];
      if (i === count - 1) return slopes[count - 2];
      return slopes[i - 1] * slopes[i] > 0 ? (slopes[i - 1] + slopes[i]) / 2 : 0;
    });
    for (var j = 0; j < count - 1; j++) {
      if (slopes[j] === 0) {
        tangents[j] = 0;
        tangents[j + 1] = 0;
        continue;
      }
      var a = tangents[j] / slopes[j];
      var b = tangents[j + 1] / slopes[j];
      var length = a * a + b * b;
      if (length > 9) {
        var scale = 3 / Math.sqrt(length);
        tangents[j] = scale * a * slopes[j];
        tangents[j + 1] = scale * b * slopes[j];
      }
    }
    var line = 'M' + points[0][0].toFixed(2) + ',' + points[0][1].toFixed(2);
    var samples = [];
    for (var k = 0; k < count - 1; k++) {
      var x0 = points[k][0];
      var y0 = points[k][1];
      var x1 = points[k + 1][0];
      var y1 = points[k + 1][1];
      var third = (x1 - x0) / 3;
      var c1 = [x0 + third, y0 + tangents[k] * third];
      var c2 = [x1 - third, y1 - tangents[k + 1] * third];
      line +=
        ' C' +
        c1[0].toFixed(2) +
        ',' +
        c1[1].toFixed(2) +
        ' ' +
        c2[0].toFixed(2) +
        ',' +
        c2[1].toFixed(2) +
        ' ' +
        x1.toFixed(2) +
        ',' +
        y1.toFixed(2);
      for (var step = 0; step < 12; step++) {
        var t = step / 12;
        var u = 1 - t;
        samples.push([
          u * u * u * x0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * x1,
          u * u * u * y0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * y1
        ]);
      }
    }
    samples.push(points[count - 1]);
    var area = line + ' L' + width.toFixed(2) + ',' + height.toFixed(2) + ' L0,' + height.toFixed(2) + ' Z';
    return { line: line, area: area, samples: samples };
  }

  function sampleAt(samples, x) {
    var index = 1;
    while (index < samples.length - 1 && samples[index][0] < x) index++;
    var x0 = samples[index - 1][0];
    var y0 = samples[index - 1][1];
    var x1 = samples[index][0];
    var y1 = samples[index][1];
    var t = x1 === x0 ? 0 : clamp((x - x0) / (x1 - x0), 0, 1);
    return y0 + (y1 - y0) * t;
  }

  /* ---------- visuals ---------- */

  function analyticsVisual(cfg) {
    var data = cfg.data || [3.1, 3.8, 3.5, 4.9, 4.4, 5.8, 5.3, 6.9, 6.5, 8.2, 9.4, 12.4];
    var unit = cfg.unit || '';
    var restNote = cfg.note || '+18%';
    var chart = node('div', 'magic-bento__chart');
    chart.innerHTML =
      '<div class="magic-bento__figure">' +
      '<span class="magic-bento__figure-value"></span>' +
      '<span class="magic-bento__figure-note"></span>' +
      '</div>' +
      '<div class="magic-bento__plot">' +
      '<span class="magic-bento__scrub"><span class="magic-bento__scrub-dot"></span></span>' +
      '</div>';
    var plot = chart.querySelector('.magic-bento__plot');
    var value = chart.querySelector('.magic-bento__figure-value');
    var note = chart.querySelector('.magic-bento__figure-note');
    var scrub = chart.querySelector('.magic-bento__scrub');
    var dot = chart.querySelector('.magic-bento__scrub-dot');
    var shape = null;

    value.textContent = data[data.length - 1].toFixed(1) + unit;
    note.textContent = restNote;

    function draw() {
      var width = plot.clientWidth;
      var height = plot.clientHeight;
      if (width < 5 || height < 5) return;
      shape = curve(data, width, height);
      var svg = plot.querySelector('svg');
      if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML =
          '<path class="magic-bento__chart-area"></path><path class="magic-bento__chart-line" pathLength="1"></path>';
        plot.insertBefore(svg, plot.firstChild);
      }
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      svg.querySelector('.magic-bento__chart-area').setAttribute('d', shape.area);
      svg.querySelector('.magic-bento__chart-line').setAttribute('d', shape.line);
    }

    function onMove(event) {
      if (!shape) return;
      var rect = plot.getBoundingClientRect();
      var x = clamp(event.clientX - rect.left, 0, rect.width);
      var y = sampleAt(shape.samples, x);
      var position = (x / Math.max(1, rect.width)) * (data.length - 1);
      var index = Math.floor(position);
      var next = Math.min(data.length - 1, index + 1);
      var v = data[index] + (data[next] - data[index]) * (position - index);
      chart.setAttribute('data-scrub', '');
      scrub.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
      dot.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
      value.textContent = v.toFixed(1) + unit;
      note.textContent = (cfg.labels && cfg.labels[Math.round(position)]) || restNote;
    }

    chart.addEventListener('pointermove', onMove);
    chart.addEventListener('pointerdown', onMove);
    chart.addEventListener('pointerleave', function () {
      chart.removeAttribute('data-scrub');
      value.textContent = data[data.length - 1].toFixed(1) + unit;
      note.textContent = restNote;
    });
    new ResizeObserver(draw).observe(plot);
    return chart;
  }

  function dashboardVisual(cfg) {
    var bars = cfg.data || [42, 58, 49, 71, 63, 88, 76];
    var peak = Math.max.apply(null, bars);
    var wrap = node('div', 'magic-bento__bars');
    var html =
      '<div class="magic-bento__figure">' +
      '<span class="magic-bento__figure-value">' +
      (cfg.value || '48') +
      '</span>' +
      '<span class="magic-bento__figure-note">' +
      (cfg.note || '') +
      '</span>' +
      '</div><div class="magic-bento__bars-plot">';
    bars.forEach(function (height, index) {
      html +=
        '<span class="magic-bento__bar"' +
        (height === peak ? ' data-peak=""' : '') +
        ' style="--h:' +
        height / 100 +
        ';--i:' +
        index +
        '"></span>';
    });
    wrap.innerHTML = html + '</div>';
    return wrap;
  }

  var ARROW_CURSOR =
    '<svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true"><path d="M2.2 1.6 13.4 9.9c.5.4.3 1.2-.4 1.3l-4.6.6-2.2 4.2c-.3.6-1.2.5-1.4-.1L1.2 2.4c-.2-.6.5-1.1 1-.8Z" stroke-width="1.2" stroke-linejoin="round"/></svg>';

  function collaborationVisual(cfg) {
    var names = cfg.names || ['Dener', 'Weslley'];
    var wrap = node('div', 'magic-bento__collab magic-bento__well');
    wrap.innerHTML =
      '<span class="magic-bento__doc-title">' +
      (cfg.docTitle || 'Briefing') +
      '</span>' +
      '<div class="magic-bento__lines">' +
      '<span class="magic-bento__line" style="--w:92%"></span>' +
      '<span class="magic-bento__line" style="--w:78%"></span>' +
      '<span class="magic-bento__line" style="--w:86%"></span>' +
      '<span class="magic-bento__line" style="--w:44%"></span>' +
      '<span class="magic-bento__line magic-bento__line--gap" style="--w:88%"></span>' +
      '<span class="magic-bento__line" style="--w:70%">' +
      '<span class="magic-bento__selection" style="--from:18%;--span:58%"><span class="magic-bento__caret"></span></span>' +
      '</span>' +
      '<span class="magic-bento__line" style="--w:82%"></span>' +
      '</div>' +
      '<span class="magic-bento__cursor magic-bento__cursor--primary" style="--x:58%;--y:52%;--i:0;--path:magic-bento-path-a">' +
      ARROW_CURSOR +
      '<span class="magic-bento__cursor-name">' +
      names[0] +
      '</span></span>' +
      '<span class="magic-bento__cursor magic-bento__cursor--secondary" style="--x:30%;--y:24%;--i:1;--path:magic-bento-path-b">' +
      ARROW_CURSOR +
      '<span class="magic-bento__cursor-name">' +
      names[1] +
      '</span></span>';
    return wrap;
  }

  function automationVisual(cfg) {
    var steps = cfg.steps || [
      { label: 'Briefing', time: '1d' },
      { label: 'Protótipo', time: '3d' },
      { label: 'Build', time: '9d' },
      { label: 'No ar', time: '1d' }
    ];
    var wrap = node('div', 'magic-bento__flow');
    wrap.style.setProperty('--n', String(steps.length));
    var html =
      '<div class="magic-bento__flow-trigger magic-bento__tile">' +
      '<span class="magic-bento__flow-glyph">' +
      glyph(GLYPHS.branch, 15) +
      '</span>' +
      '<span class="magic-bento__flow-copy">' +
      '<span class="magic-bento__flow-name">' +
      (cfg.trigger || 'Projeto aprovado') +
      '</span>' +
      '<span class="magic-bento__flow-meta magic-bento__flow-hash">' +
      (cfg.meta || 'zaniva/entrega') +
      '</span>' +
      '</span></div>' +
      '<ol class="magic-bento__steps magic-bento__well">' +
      '<span class="magic-bento__rail" aria-hidden="true"><span class="magic-bento__rail-fill"></span></span>';
    steps.forEach(function (step, index) {
      html +=
        '<li class="magic-bento__step" style="--i:' +
        index +
        '">' +
        '<span class="magic-bento__status">' +
        '<span class="magic-bento__pending"></span>' +
        '<span class="magic-bento__spinner"></span>' +
        '<span class="magic-bento__done">' +
        glyph(GLYPHS.check, 11, 2.6) +
        '</span>' +
        '</span>' +
        step.label +
        '<span class="magic-bento__step-time">' +
        step.time +
        '</span></li>';
    });
    wrap.innerHTML = html + '</ol>';
    return wrap;
  }

  function integrationVisual(cfg) {
    var apps = cfg.apps || [
      { icon: 'globe', x: '17%', y: '24%' },
      { icon: 'pin', x: '83%', y: '24%' },
      { icon: 'chat', x: '17%', y: '78%' },
      { icon: 'phone', x: '83%', y: '78%' }
    ];
    var wrap = node('div', 'magic-bento__hub');
    var lines = '';
    var packets = '';
    var nodes = '';
    apps.forEach(function (app, index) {
      lines +=
        '<line x1="' +
        parseFloat(app.x) +
        '" y1="' +
        parseFloat(app.y) +
        '" x2="50" y2="51" pathLength="1"></line>';
      packets +=
        '<span class="magic-bento__packet" style="--x:' + app.x + ';--y:' + app.y + ';--i:' + index + '"></span>';
      nodes +=
        '<span class="magic-bento__hub-node magic-bento__tile" style="--x:' +
        app.x +
        ';--y:' +
        app.y +
        ';--s:26px;--i:' +
        (index + 1) +
        '">' +
        glyph(GLYPHS[app.icon] || GLYPHS.globe, 14) +
        '</span>';
    });
    wrap.innerHTML =
      '<svg class="magic-bento__hub-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
      lines +
      '</svg>' +
      packets +
      nodes +
      '<span class="magic-bento__hub-node magic-bento__tile" style="--x:50%;--y:51%;--s:34px;--i:0">' +
      glyph(GLYPHS.spark, 17) +
      '</span>';
    return wrap;
  }

  function securityVisual(cfg) {
    var settings = cfg.settings || [
      { icon: 'key', label: 'SSL + backup' },
      { icon: 'finger', label: 'LGPD' }
    ];
    var wrap = node('div', 'magic-bento__shield');
    var html = '';
    settings.forEach(function (setting, index) {
      html +=
        '<div class="magic-bento__setting magic-bento__tile">' +
        glyph(GLYPHS[setting.icon] || GLYPHS.key, 14) +
        '<span class="magic-bento__setting-label">' +
        setting.label +
        '</span>' +
        '<span class="magic-bento__switch" style="--i:' +
        index +
        '"></span></div>';
    });
    wrap.innerHTML = html;
    return wrap;
  }

  var VISUALS = {
    analytics: analyticsVisual,
    dashboard: dashboardVisual,
    collaboration: collaborationVisual,
    automation: automationVisual,
    integration: integrationVisual,
    security: securityVisual
  };

  var REPLAY = {
    'magic-bento-draw': 1,
    'magic-bento-fade': 1,
    'magic-bento-grow': 1,
    'magic-bento-pop': 1,
    'magic-bento-select': 1,
    'magic-bento-wait': 1,
    'magic-bento-run': 1,
    'magic-bento-check': 1,
    'magic-bento-rail': 1,
    'magic-bento-switch-track': 1,
    'magic-bento-switch-knob': 1
  };

  var FLOW = {
    'magic-bento-wait': 1,
    'magic-bento-run': 1,
    'magic-bento-check': 1,
    'magic-bento-rail': 1,
    'magic-bento-fade': 1
  };

  function finite(animation) {
    var timing = animation.effect && animation.effect.getTiming ? animation.effect.getTiming() : null;
    return timing ? timing.iterations !== Infinity : false;
  }

  /* ---------- component ---------- */

  function MagicBento(host, options) {
    var o = options || {};
    var items = o.items || [];
    var columns = Math.max(1, Math.round(o.columns == null ? 4 : o.columns));
    var rowHeight = o.rowHeight == null ? 200 : o.rowHeight;
    var gap = Math.max(0, o.gap == null ? 12 : o.gap);
    var radius = Math.max(0, o.radius == null ? 20 : o.radius);
    var palette = o.theme === 'light' ? 'light' : 'dark';
    var glow = parseRgb(o.glowColor) || INK[palette];
    var accent = parseRgb(o.glowColor) || INK[palette];
    var enableBorderGlow = o.enableBorderGlow !== false;
    var enableSpotlight = o.enableSpotlight !== false;
    var spotlightRadius = Math.max(40, o.spotlightRadius == null ? 300 : o.spotlightRadius);
    var enableStars = Boolean(o.enableStars);
    var particleCount = clamp(Math.round(o.particleCount == null ? 24 : o.particleCount), 0, 120);
    var enableTilt = Boolean(o.enableTilt);
    var enableMagnetism = Boolean(o.enableMagnetism);
    var clickEffect = o.clickEffect !== false;
    var textAutoHide = o.textAutoHide !== false;
    var intro = o.intro !== false;
    var disableAnimations = Boolean(o.disableAnimations);

    var root = node('div', ('magic-bento ' + (o.className || '')).trim());
    if (textAutoHide) root.setAttribute('data-autohide', '');
    var themeVars = THEMES[palette];
    for (var key in themeVars) root.style.setProperty(key, String(themeVars[key]));
    root.style.setProperty('--mb-glow-rgb', glow.join(', '));
    root.style.setProperty('--mb-accent-rgb', accent.join(', '));
    root.style.setProperty('--mb-accent-ink', inkFor(accent));
    root.style.setProperty('--mb-radius', radius + 'px');
    root.style.setProperty('--mb-inner-radius', Math.round(clamp(radius * 0.5, 6, 12)) + 'px');
    root.style.setProperty('--mb-pad', Math.round(clamp(radius * 0.85, 14, 20)) + 'px');
    root.style.setProperty('--mb-spot-size', spotlightRadius + 'px');
    root.style.setProperty('--mb-border-size', Math.round(spotlightRadius * 0.75) + 'px');
    root.style.gap = gap + 'px';

    var cells = [];
    var cards = [];
    var canvases = [];
    var cols = columns;

    items.forEach(function (entry, index) {
      var cell = node('div', 'magic-bento__cell');
      var clickable = Boolean(entry.href || entry.onClick || o.onItemClick);
      var card = entry.href ? document.createElement('a') : document.createElement('div');
      card.className = 'magic-bento__card';
      if (entry.href) {
        card.href = entry.href;
        if (entry.target) card.target = entry.target;
        if (entry.rel) card.rel = entry.rel;
      } else if (clickable) {
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        if (entry.title) card.setAttribute('aria-label', entry.title);
      }
      if (clickable) card.setAttribute('data-clickable', '');
      if (entry.image) card.setAttribute('data-image', '');

      if (entry.image) {
        var img = document.createElement('img');
        img.className = 'magic-bento__image';
        img.src = entry.image;
        img.alt = entry.imageAlt || '';
        img.draggable = false;
        img.loading = 'lazy';
        img.decoding = 'async';
        card.appendChild(img);
        card.appendChild(node('span', 'magic-bento__scrim'));
      }
      if (enableSpotlight) card.appendChild(node('span', 'magic-bento__light'));
      if (enableStars) {
        var canvas = document.createElement('canvas');
        canvas.className = 'magic-bento__stars';
        canvas.setAttribute('aria-hidden', 'true');
        card.appendChild(canvas);
        canvases[index] = canvas;
      }

      var content = node('div', 'magic-bento__content');
      if (entry.content) {
        if (typeof entry.content === 'string') content.innerHTML = entry.content;
        else content.appendChild(entry.content);
      } else {
        if (entry.icon || entry.label) {
          var header = node('div', 'magic-bento__header');
          if (entry.icon) header.appendChild(node('span', 'magic-bento__icon', entry.icon));
          if (entry.label) header.appendChild(node('span', 'magic-bento__label', entry.label));
          content.appendChild(header);
        }
        var visualNode = null;
        if (typeof entry.visual === 'string' && VISUALS[entry.visual]) {
          visualNode = VISUALS[entry.visual](entry.visualProps || {});
        } else if (entry.visual instanceof Node) {
          visualNode = entry.visual;
        }
        if (visualNode) {
          var visualWrap = node('div', 'magic-bento__visual');
          visualWrap.setAttribute('aria-hidden', 'true');
          visualWrap.appendChild(visualNode);
          content.appendChild(visualWrap);
        }
        if (entry.title || entry.description) {
          var text = node('div', 'magic-bento__text');
          if (entry.title) text.appendChild(node('h3', 'magic-bento__title', entry.title));
          if (entry.description) text.appendChild(node('p', 'magic-bento__description', entry.description));
          content.appendChild(text);
        }
      }
      card.appendChild(content);
      card.appendChild(node('span', 'magic-bento__rim'));
      card.appendChild(node('span', 'magic-bento__border'));

      if (clickable) {
        card.addEventListener('click', function (event) {
          if (entry.onClick) entry.onClick(event);
          if (o.onItemClick) o.onItemClick(entry, index);
        });
      }

      cell.appendChild(card);
      cells.push(cell);
      cards.push(card);
      root.appendChild(cell);
    });

    function layout() {
      root.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
      root.style.gridAutoRows = cols === 1 ? 'minmax(' + rowHeight + 'px, auto)' : rowHeight + 'px';
      items.forEach(function (entry, index) {
        var cell = cells[index];
        cell.style.gridColumn = 'span ' + Math.min(cols, Math.max(1, Math.round(entry.colSpan || 1)));
        cell.style.gridRow = 'span ' + Math.max(1, Math.round(entry.rowSpan || 1));
      });
    }
    layout();
    host.appendChild(root);

    /* ---------- engine ---------- */

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var motion = !disableAnimations && !reduced;
    var playIntro = motion && intro;
    if (motion) root.setAttribute('data-motion', '');
    if (playIntro) root.setAttribute('data-intro', '');

    var pointer = { x: -1e5, y: -1e5, inside: false, down: -1 };
    var light = { x: -1e5, y: -1e5, near: 0, ready: false };
    var states = [];
    var wave = { x: 0, y: 0, t: -1, duration: 1.1, reach: 800 };
    var rects = [];
    var bounds = null;
    var dirty = true;
    var raf = 0;
    var last = 0;
    var visible = true;
    var entered = !playIntro;
    var lastFlow = [];

    function stateFor(index) {
      if (!states[index]) {
        states[index] = {
          hot: 0, rx: 0, ry: 0, tx: 0, ty: 0,
          vrx: 0, vry: 0, vtx: 0, vty: 0,
          press: 1, vpress: 0, stars: 0, particles: null,
          active: false, drawn: false, written: {}
        };
      }
      return states[index];
    }

    function writeVar(element, state, name, value) {
      if (state.written[name] === value) return;
      state.written[name] = value;
      element.style.setProperty(name, value);
    }

    function measure() {
      dirty = false;
      bounds = root.getBoundingClientRect();
      rects = cells.map(function (cell) {
        return cell ? cell.getBoundingClientRect() : null;
      });
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvases.forEach(function (canvas, index) {
        var rect = rects[index];
        if (!canvas || !rect) return;
        var width = Math.max(1, Math.round(rect.width * ratio));
        var height = Math.max(1, Math.round(rect.height * ratio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
      });
    }

    function seed(index, rect) {
      var state = stateFor(index);
      if (state.particles && state.particles.length === particleCount) return state.particles;
      state.particles = [];
      for (var i = 0; i < particleCount; i++) {
        state.particles.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 6,
          vy: -4 - Math.random() * 10,
          size: 0.6 + Math.random() * 1.1,
          phase: Math.random() * Math.PI * 2,
          rate: 1.2 + Math.random() * 2.4
        });
      }
      return state.particles;
    }

    function drawStars(index, rect, state, lx, ly, dt, now) {
      var canvas = canvases[index];
      if (!canvas) return;
      var context = canvas.getContext('2d');
      if (!context) return;
      var ratio = canvas.width / Math.max(1, rect.width);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (state.stars < 0.004) return;
      var particles = seed(index, rect);
      var reach = spotlightRadius * 0.75;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      for (var i = 0; i < particles.length; i++) {
        var particle = particles[i];
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        if (particle.y < -4) {
          particle.y = rect.height + 4;
          particle.x = Math.random() * rect.width;
        }
        if (particle.x < -4) particle.x = rect.width + 4;
        if (particle.x > rect.width + 4) particle.x = -4;
        var distance = Math.hypot(particle.x - lx, particle.y - ly) / reach;
        if (distance >= 1) continue;
        var falloff = 1 - distance * distance * (3 - 2 * distance);
        var twinkle = 0.55 + 0.45 * Math.sin(now * 0.001 * particle.rate + particle.phase);
        var alpha = state.stars * falloff * twinkle;
        if (alpha < 0.01) continue;
        context.fillStyle = 'rgba(' + glow[0] + ', ' + glow[1] + ', ' + glow[2] + ', ' + alpha.toFixed(3) + ')';
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }
    }

    function replay(card, filter) {
      if (!motion || !card.getAnimations) return;
      var animations = card.getAnimations({ subtree: true });
      for (var i = 0; i < animations.length; i++) {
        var animation = animations[i];
        var name = animation.animationName || '';
        if (!filter[name] || !finite(animation)) continue;
        var target = animation.effect && animation.effect.target ? animation.effect.target : null;
        if (target && target.classList && target.classList.contains('magic-bento__cursor')) continue;
        animation.currentTime = 0;
        animation.play();
      }
    }

    function startWave(x, y, duration) {
      if (!motion || !bounds) return;
      wave.x = x;
      wave.y = y;
      wave.t = 0;
      wave.duration = duration;
      wave.reach =
        Math.max(
          Math.hypot(x - bounds.left, y - bounds.top),
          Math.hypot(x - bounds.right, y - bounds.top),
          Math.hypot(x - bounds.left, y - bounds.bottom),
          Math.hypot(x - bounds.right, y - bounds.bottom)
        ) + 140;
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (dirty) measure();
      var busy = false;

      var margin = spotlightRadius * 0.5;
      var near =
        pointer.inside &&
        bounds &&
        pointer.x > bounds.left - margin &&
        pointer.x < bounds.right + margin &&
        pointer.y > bounds.top - margin &&
        pointer.y < bounds.bottom + margin
          ? 1
          : 0;
      if (!light.ready && near) {
        light.x = pointer.x;
        light.y = pointer.y;
        light.ready = true;
      }
      var follow = 1 - Math.exp(-dt / 0.05);
      light.x += (pointer.x - light.x) * follow;
      light.y += (pointer.y - light.y) * follow;
      var fade = 1 - Math.exp(-dt / (near > light.near ? 0.12 : 0.4));
      light.near += (near - light.near) * fade;
      if (Math.abs(near - light.near) < 0.002) light.near = near;
      else busy = true;
      if (Math.abs(pointer.x - light.x) + Math.abs(pointer.y - light.y) > 0.3) busy = true;

      var waveRadius = 0;
      var waveAlpha = 0;
      if (wave.t >= 0) {
        wave.t += dt;
        var progress = Math.min(1, wave.t / wave.duration);
        waveRadius = wave.reach * (1 - Math.pow(1 - progress, 2.2));
        waveAlpha = Math.pow(1 - progress, 1.3);
        if (progress >= 1) {
          wave.t = -1;
          waveAlpha = 0;
        } else busy = true;
      }

      for (var index = 0; index < cards.length; index++) {
        var card = cards[index];
        var rect = rects[index];
        if (!card || !rect) continue;
        var state = stateFor(index);
        var lx = light.x - rect.left;
        var ly = light.y - rect.top;
        var px = pointer.x - rect.left;
        var py = pointer.y - rect.top;
        var inside = pointer.inside && entered && px >= 0 && py >= 0 && px <= rect.width && py <= rect.height;

        if (inside !== state.active) {
          state.active = inside;
          if (inside) {
            card.setAttribute('data-active', '');
            if (now - (lastFlow[index] || -1e9) > 3200 && card.querySelector('.magic-bento__steps')) {
              lastFlow[index] = now;
              replay(card, FLOW);
            }
          } else card.removeAttribute('data-active');
        }

        var hotTarget = inside && enableSpotlight ? 1 : 0;
        state.hot += (hotTarget - state.hot) * (1 - Math.exp(-dt / (hotTarget > state.hot ? 0.14 : 0.32)));
        if (Math.abs(hotTarget - state.hot) < 0.002) state.hot = hotTarget;
        else busy = true;

        var u = clamp(px / Math.max(1, rect.width), 0, 1) - 0.5;
        var v = clamp(py / Math.max(1, rect.height), 0, 1) - 0.5;
        var tilt = inside && enableTilt && motion;
        var magnet = inside && enableMagnetism && motion;
        var targets = [
          tilt ? -v * 2 * TILT : 0,
          tilt ? u * 2 * TILT : 0,
          magnet ? u * 2 * MAGNET : 0,
          magnet ? v * 2 * MAGNET : 0
        ];
        var keys = [['rx', 'vrx'], ['ry', 'vry'], ['tx', 'vtx'], ['ty', 'vty']];
        var steps = Math.max(1, Math.ceil(dt / (1 / 240)));
        var h = dt / steps;
        for (var k = 0; k < keys.length; k++) {
          var pos = keys[k][0];
          var vel = keys[k][1];
          for (var s = 0; s < steps; s++) {
            state[vel] += (170 * (targets[k] - state[pos]) - 20 * state[vel]) * h;
            state[pos] += state[vel] * h;
          }
          if (Math.abs(targets[k] - state[pos]) < 0.002 && Math.abs(state[vel]) < 0.01) {
            state[pos] = targets[k];
            state[vel] = 0;
          } else busy = true;
        }
        var pressTarget = pointer.down === index && clickEffect && motion ? 0.985 : 1;
        for (var sp = 0; sp < steps; sp++) {
          state.vpress += (420 * (pressTarget - state.press) - 28 * state.vpress) * h;
          state.press += state.vpress * h;
        }
        if (Math.abs(pressTarget - state.press) < 0.0002 && Math.abs(state.vpress) < 0.001) {
          state.press = pressTarget;
          state.vpress = 0;
        } else busy = true;

        writeVar(card, state, '--mb-x', lx.toFixed(1) + 'px');
        writeVar(card, state, '--mb-y', ly.toFixed(1) + 'px');
        writeVar(card, state, '--mb-near', (enableBorderGlow ? light.near : 0).toFixed(3));
        writeVar(card, state, '--mb-hot', state.hot.toFixed(3));
        writeVar(card, state, '--mb-rx', state.rx.toFixed(3) + 'deg');
        writeVar(card, state, '--mb-ry', state.ry.toFixed(3) + 'deg');
        writeVar(card, state, '--mb-tx', state.tx.toFixed(2) + 'px');
        writeVar(card, state, '--mb-ty', state.ty.toFixed(2) + 'px');
        writeVar(card, state, '--mb-press', state.press.toFixed(4));
        writeVar(card, state, '--mb-wx', (wave.x - rect.left).toFixed(1) + 'px');
        writeVar(card, state, '--mb-wy', (wave.y - rect.top).toFixed(1) + 'px');
        writeVar(card, state, '--mb-wr', waveRadius.toFixed(1) + 'px');
        writeVar(card, state, '--mb-wa', waveAlpha.toFixed(3));

        if (enableStars && canvases[index]) {
          var starTarget = inside && motion ? 1 : 0;
          state.stars += (starTarget - state.stars) * (1 - Math.exp(-dt / (starTarget ? 0.3 : 0.5)));
          if (state.stars < 0.004 && !starTarget) state.stars = 0;
          if (state.stars > 0 || starTarget) {
            drawStars(index, rect, state, lx, ly, dt, now);
            state.drawn = true;
            busy = true;
          } else if (state.drawn) {
            drawStars(index, rect, state, lx, ly, dt, now);
            state.drawn = false;
          }
        }
      }

      if (busy && visible) raf = requestAnimationFrame(frame);
    }

    function wake() {
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function cardIndex(target) {
      if (!(target instanceof Element)) return -1;
      var card = target.closest('.magic-bento__card');
      return card ? cards.indexOf(card) : -1;
    }

    window.addEventListener('pointermove', function (event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      wake();
    }, { passive: true });

    window.addEventListener('pointerdown', function (event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      pointer.down = cardIndex(event.target);
      wake();
    }, { passive: true });

    function release() {
      if (pointer.down < 0) return;
      pointer.down = -1;
      wake();
    }
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });

    document.addEventListener('pointerout', function (event) {
      if (event.relatedTarget) return;
      pointer.inside = false;
      pointer.down = -1;
      wake();
    });

    function activate(index, x, y) {
      var card = cards[index];
      if (!card) return;
      if (clickEffect) {
        if (dirty) measure();
        startWave(x, y, 1.1);
        replay(card, REPLAY);
        lastFlow[index] = performance.now();
      }
      wake();
    }

    root.addEventListener('click', function (event) {
      var index = cardIndex(event.target);
      var card = cards[index];
      if (!card) return;
      if (event.detail === 0) {
        var rect = card.getBoundingClientRect();
        activate(index, rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else activate(index, event.clientX, event.clientY);
    });

    root.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      var card = cards[cardIndex(event.target)];
      if (!card || event.target !== card || card.tagName === 'A') return;
      event.preventDefault();
      card.click();
    });

    function onScroll() {
      dirty = true;
      wake();
    }
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll, { passive: true });

    new ResizeObserver(function () {
      var width = root.clientWidth;
      var cell = function (count) {
        return (width - gap * (count - 1)) / count;
      };
      var next = cell(columns) >= MIN_CELL ? columns : columns >= 2 && cell(2) >= MIN_PAIR ? 2 : 1;
      if (next !== cols) {
        cols = next;
        layout();
      }
      dirty = true;
      wake();
    }).observe(root);

    function enter() {
      entered = true;
      var order = 0;
      cells.forEach(function (cell) {
        cell.style.setProperty('--mb-delay', order++ * STAGGER + 'ms');
        cell.setAttribute('data-state', 'in');
      });
      if (dirty) measure();
      window.setTimeout(function () {
        if (bounds) startWave(bounds.left, bounds.top, 1.7);
        wake();
      }, 260);
      window.setTimeout(function () {
        cells.forEach(function (cell) {
          cell.style.setProperty('--mb-delay', '0ms');
        });
      }, order * STAGGER + 2600);
      wake();
    }

    if (playIntro && typeof IntersectionObserver !== 'undefined') {
      var gate = new IntersectionObserver(
        function (entries, observer) {
          var hit = false;
          entries.forEach(function (entry) {
            if (entry.isIntersecting) hit = true;
          });
          if (!hit) return;
          observer.disconnect();
          enter();
        },
        { threshold: 0.15 }
      );
      gate.observe(root);
    } else {
      cells.forEach(function (cell) {
        cell.style.setProperty('--mb-delay', '0ms');
        cell.setAttribute('data-state', 'in');
      });
      if (motion && root.getAnimations) {
        root.getAnimations({ subtree: true }).forEach(function (animation) {
          if (REPLAY[animation.animationName || ''] && finite(animation)) animation.finish();
        });
      }
    }

    new IntersectionObserver(function (entries) {
      visible = entries.some(function (entry) {
        return entry.isIntersecting;
      });
      if (visible) {
        dirty = true;
        wake();
      }
    }).observe(root);

    return { root: root, glyph: glyph, glyphs: GLYPHS };
  }

  MagicBento.glyph = glyph;
  MagicBento.GLYPHS = GLYPHS;
  global.MagicBento = MagicBento;
})(window);
