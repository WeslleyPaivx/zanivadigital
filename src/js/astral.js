/* Astral Shell — a slowly turning globe of connected stars.
   Built to the documented prop surface of the React Bits Pro component
   (colors, backgroundColor, nodes, connections, reach, clustering, chords,
   nodeSize, radius, originX, originY, tilt, spin, depthFade, lineOpacity,
   interactive, draggable, hoverRadius, hoverBoost, clickPulse, pulseSpeed,
   seed, paused, dpr), as a dependency-free canvas renderer.

   One addition for this site: setProgress(0..1) pulls the camera into the
   globe, so page scroll drives the zoom. */
(function (global) {
  'use strict';

  function mulberry32(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6d2b79f5;
      var r = t;
      r = Math.imul(r ^ (r >>> 15), r | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexToRgb(value) {
    var hex = String(value || '').trim().replace('#', '');
    if (hex.length === 3) {
      hex = hex.replace(/./g, function (c) {
        return c + c;
      });
    }
    if (!/^[0-9a-f]{6}$/i.test(hex)) return [255, 255, 255];
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16)
    ];
  }

  function mix(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function createAstralShell(canvas, options) {
    if (!canvas) return null;
    var context = canvas.getContext('2d');
    if (!context) return null;

    var o = options || {};
    var colors = o.colors || ['#7C6BFF', '#FFE6FA'];
    var backgroundColor = o.backgroundColor || '#0a0a0a';
    var nodeTotal = Math.max(50, Math.round(o.nodes == null ? 2400 : o.nodes));
    var connections = Math.max(0, Math.round(o.connections == null ? 4 : o.connections));
    var reach = o.reach == null ? 0.2 : o.reach;
    var clustering = clamp(o.clustering == null ? 0.85 : o.clustering, 0, 1);
    var chords = clamp(o.chords == null ? 0.35 : o.chords, 0, 1);
    var nodeSize = o.nodeSize == null ? 0.8 : o.nodeSize;
    var radiusRatio = o.radius == null ? 0.4 : o.radius;
    var originX = o.originX == null ? 0.5 : o.originX;
    var originY = o.originY == null ? 0.5 : o.originY;
    var tilt = ((o.tilt == null ? 18 : o.tilt) * Math.PI) / 180;
    var spin = o.spin == null ? 1 : o.spin;
    var depthFade = clamp(o.depthFade == null ? 0.7 : o.depthFade, 0, 1);
    var lineOpacity = clamp(o.lineOpacity == null ? 0.7 : o.lineOpacity, 0, 1);
    var interactive = o.interactive !== false;
    var draggable = o.draggable !== false;
    var hoverRadius = o.hoverRadius == null ? 0.22 : o.hoverRadius;
    var hoverBoost = o.hoverBoost == null ? 1 : o.hoverBoost;
    var clickPulse = o.clickPulse !== false;
    var pulseSpeed = o.pulseSpeed == null ? 1.2 : o.pulseSpeed;
    var seed = o.seed == null ? 0 : o.seed;
    var paused = Boolean(o.paused);
    var dprCap = o.dpr == null ? 2 : o.dpr;
    var transparent = o.backgroundColor === 'transparent';

    var colorA = hexToRgb(colors[0]);
    var colorB = hexToRgb(colors[1] || colors[0]);

    var random = mulberry32(seed * 2654435761 + 99);

    /* ---------- node field on the unit sphere ---------- */

    var ATTRACTORS = 14;
    var attractors = [];
    for (var k = 0; k < ATTRACTORS; k++) {
      var au = random() * Math.PI * 2;
      var av = Math.acos(2 * random() - 1);
      attractors.push([
        Math.sin(av) * Math.cos(au),
        Math.sin(av) * Math.sin(au),
        Math.cos(av)
      ]);
    }

    var px = new Float32Array(nodeTotal);
    var py = new Float32Array(nodeTotal);
    var pz = new Float32Array(nodeTotal);
    var tint = new Float32Array(nodeTotal);
    var twinkle = new Float32Array(nodeTotal);

    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < nodeTotal; i++) {
      // even Fibonacci sphere, then pulled toward a cluster centre
      var y = 1 - (i / (nodeTotal - 1)) * 2;
      var ring = Math.sqrt(Math.max(0, 1 - y * y));
      var theta = golden * i;
      var x = Math.cos(theta) * ring;
      var z = Math.sin(theta) * ring;

      var best = 0;
      var bestDot = -2;
      for (var c = 0; c < ATTRACTORS; c++) {
        var dot = x * attractors[c][0] + y * attractors[c][1] + z * attractors[c][2];
        if (dot > bestDot) {
          bestDot = dot;
          best = c;
        }
      }
      var pull = clustering * Math.pow(random(), 2.2) * 0.42;
      x += (attractors[best][0] - x) * pull;
      y += (attractors[best][1] - y) * pull;
      z += (attractors[best][2] - z) * pull;

      var jitter = 0.035;
      x += (random() - 0.5) * jitter;
      y += (random() - 0.5) * jitter;
      z += (random() - 0.5) * jitter;

      var length = Math.hypot(x, y, z) || 1;
      px[i] = x / length;
      py[i] = y / length;
      pz[i] = z / length;
      tint[i] = clamp(0.5 + py[i] * 0.42 + (random() - 0.5) * 0.3, 0, 1);
      twinkle[i] = random() * Math.PI * 2;
    }

    /* ---------- edges ---------- */

    var edgeA = [];
    var edgeB = [];
    if (connections > 0) {
      var maxChord = reach * 2;
      var neighbours = new Array(connections);
      var dists = new Array(connections);
      for (var n = 0; n < nodeTotal; n++) {
        for (var s = 0; s < connections; s++) {
          neighbours[s] = -1;
          dists[s] = Infinity;
        }
        for (var m = 0; m < nodeTotal; m++) {
          if (m === n) continue;
          var dx = px[n] - px[m];
          var dy = py[n] - py[m];
          var dz = pz[n] - pz[m];
          var d = dx * dx + dy * dy + dz * dz;
          if (d > maxChord * maxChord) continue;
          for (var slot = 0; slot < connections; slot++) {
            if (d < dists[slot]) {
              for (var back = connections - 1; back > slot; back--) {
                dists[back] = dists[back - 1];
                neighbours[back] = neighbours[back - 1];
              }
              dists[slot] = d;
              neighbours[slot] = m;
              break;
            }
          }
        }
        for (var e = 0; e < connections; e++) {
          if (neighbours[e] > n) {
            edgeA.push(n);
            edgeB.push(neighbours[e]);
          }
        }
        // a share of the links cut straight through the globe
        if (random() < chords * 0.35) {
          var far = Math.floor(random() * nodeTotal);
          if (far !== n) {
            edgeA.push(n);
            edgeB.push(far);
          }
        }
      }
    }
    var edgeCount = edgeA.length;

    /* ---------- state ---------- */

    var width = 0;
    var height = 0;
    var dpr = 1;
    var yaw = 0;
    var dragYaw = 0;
    var dragPitch = 0;
    var dragging = false;
    var dragFromX = 0;
    var dragFromY = 0;
    var dragBaseYaw = 0;
    var dragBasePitch = 0;
    var pointerX = -1e5;
    var pointerY = -1e5;
    var pointerIn = false;
    var pulseAt = -1;
    var pulseX = 0;
    var pulseY = 0;
    var pulseZ = 1;
    var progress = 0;
    var easedProgress = 0;
    var clock = 0;
    var lastTime = 0;
    var raf = 0;
    var running = false;

    var sx = new Float32Array(nodeTotal);
    var sy = new Float32Array(nodeTotal);
    var sd = new Float32Array(nodeTotal);
    var sb = new Float32Array(nodeTotal);

    var BUCKETS = 7;
    var lineBuckets = [];
    var dotBuckets = [];
    for (var b = 0; b < BUCKETS; b++) {
      lineBuckets.push([]);
      dotBuckets.push([]);
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width));
      var h = Math.max(1, Math.round(rect.height));
      var ratio = Math.min(window.devicePixelRatio || 1, dprCap);
      if (w === width && h === height && ratio === dpr) return;
      width = w;
      height = h;
      dpr = ratio;
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function draw(dt) {
      resize();
      if (!width || !height) return;

      clock += dt;
      easedProgress += (progress - easedProgress) * (1 - Math.pow(0.0001, dt));

      if (!dragging) dragYaw *= Math.pow(0.4, dt);
      yaw += dt * 0.085 * spin;

      var zoom = 1 + easedProgress * 1.15;
      var R = Math.min(width, height) * radiusRatio * zoom;
      var cx = width * originX;
      var cy = height * originY;

      var totalYaw = yaw + dragYaw;
      var pitch = tilt + dragPitch;
      var cosY = Math.cos(totalYaw);
      var sinY = Math.sin(totalYaw);
      var cosP = Math.cos(pitch);
      var sinP = Math.sin(pitch);

      var hoverPx = hoverRadius * Math.min(width, height);
      var hoverSq = hoverPx * hoverPx;

      var pulseFront = pulseAt >= 0 ? (clock - pulseAt) * pulseSpeed : -1;
      if (pulseFront > 2.6) {
        pulseAt = -1;
        pulseFront = -1;
      }

      for (var i = 0; i < nodeTotal; i++) {
        var x0 = px[i];
        var y0 = py[i];
        var z0 = pz[i];

        var x1 = x0 * cosY + z0 * sinY;
        var z1 = -x0 * sinY + z0 * cosY;
        var y2 = y0 * cosP - z1 * sinP;
        var z2 = y0 * sinP + z1 * cosP;

        sx[i] = cx + x1 * R;
        sy[i] = cy + y2 * R;
        sd[i] = z2; // -1 back .. 1 front

        var depth = (z2 + 1) * 0.5;
        var bright = 1 - depthFade + depthFade * depth;
        bright *= 0.72 + 0.28 * Math.sin(clock * 1.6 + twinkle[i]);

        if (interactive && pointerIn) {
          var ddx = sx[i] - pointerX;
          var ddy = sy[i] - pointerY;
          var dd = ddx * ddx + ddy * ddy;
          if (dd < hoverSq) {
            var near = 1 - dd / hoverSq;
            bright += near * near * hoverBoost * 0.85;
          }
        }

        if (pulseFront >= 0) {
          var angle = Math.acos(clamp(x0 * pulseX + y0 * pulseY + z0 * pulseZ, -1, 1));
          var band = 1 - Math.abs(angle - pulseFront) / 0.45;
          if (band > 0) bright += band * band * (1 - pulseFront / 2.6) * 1.4;
        }

        sb[i] = clamp(bright, 0, 1.6);
      }

      if (transparent) context.clearRect(0, 0, width, height);
      else {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, width, height);
      }

      var bucket;
      for (bucket = 0; bucket < BUCKETS; bucket++) {
        lineBuckets[bucket].length = 0;
        dotBuckets[bucket].length = 0;
      }

      for (var e = 0; e < edgeCount; e++) {
        var a = edgeA[e];
        var bIndex = edgeB[e];
        var level = (sb[a] + sb[bIndex]) * 0.5;
        if (level < 0.06) continue;
        bucket = Math.min(BUCKETS - 1, Math.floor(level * BUCKETS));
        var list = lineBuckets[bucket];
        list.push(sx[a], sy[a], sx[bIndex], sy[bIndex], (tint[a] + tint[bIndex]) * 0.5);
      }

      context.lineWidth = 1;
      for (bucket = 0; bucket < BUCKETS; bucket++) {
        var lines = lineBuckets[bucket];
        if (!lines.length) continue;
        var alpha = (((bucket + 0.5) / BUCKETS) * lineOpacity * 0.5).toFixed(3);
        var shade = mix(colorA, colorB, (bucket + 0.5) / BUCKETS);
        context.strokeStyle = 'rgba(' + shade[0] + ',' + shade[1] + ',' + shade[2] + ',' + alpha + ')';
        context.beginPath();
        for (var p = 0; p < lines.length; p += 5) {
          context.moveTo(lines[p], lines[p + 1]);
          context.lineTo(lines[p + 2], lines[p + 3]);
        }
        context.stroke();
      }

      var size = Math.max(0.7, nodeSize * (R / 420) * 1.6);
      for (var d = 0; d < nodeTotal; d++) {
        if (sb[d] < 0.05) continue;
        bucket = Math.min(BUCKETS - 1, Math.floor(sb[d] * BUCKETS));
        dotBuckets[bucket].push(sx[d], sy[d], tint[d]);
      }
      for (bucket = 0; bucket < BUCKETS; bucket++) {
        var dots = dotBuckets[bucket];
        if (!dots.length) continue;
        var level2 = (bucket + 0.5) / BUCKETS;
        var dotShade = mix(colorA, colorB, clamp(level2 * 1.15, 0, 1));
        context.fillStyle =
          'rgba(' + dotShade[0] + ',' + dotShade[1] + ',' + dotShade[2] + ',' + Math.min(1, level2 * 1.1).toFixed(3) + ')';
        var s = size * (0.75 + level2 * 0.6);
        for (var q = 0; q < dots.length; q += 3) {
          context.fillRect(dots[q] - s * 0.5, dots[q + 1] - s * 0.5, s, s);
        }
      }
    }

    function frame(now) {
      raf = 0;
      var dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0.016;
      lastTime = now;
      draw(paused ? 0 : dt);
      if (running) raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      lastTime = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    /* ---------- interaction ---------- */

    function localPoint(event) {
      var rect = canvas.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
    }

    if (interactive) {
      window.addEventListener(
        'pointermove',
        function (event) {
          localPoint(event);
          pointerIn = true;
          if (dragging) {
            dragYaw = dragBaseYaw + (event.clientX - dragFromX) * 0.006;
            dragPitch = clamp(dragBasePitch + (event.clientY - dragFromY) * 0.004, -1.1, 1.1);
          }
        },
        { passive: true }
      );
      window.addEventListener('pointerleave', function () {
        pointerIn = false;
      });
    }

    if (draggable) {
      canvas.addEventListener('pointerdown', function (event) {
        dragging = true;
        dragFromX = event.clientX;
        dragFromY = event.clientY;
        dragBaseYaw = dragYaw;
        dragBasePitch = dragPitch;
      });
      window.addEventListener('pointerup', function () {
        dragging = false;
      });
      window.addEventListener('pointercancel', function () {
        dragging = false;
      });
    }

    if (clickPulse) {
      canvas.addEventListener('click', function (event) {
        localPoint(event);
        var best = -1;
        var bestD = Infinity;
        for (var i = 0; i < nodeTotal; i++) {
          var dx = sx[i] - pointerX;
          var dy = sy[i] - pointerY;
          var d = dx * dx + dy * dy;
          if (d < bestD && sd[i] > 0) {
            bestD = d;
            best = i;
          }
        }
        if (best < 0) return;
        pulseX = px[best];
        pulseY = py[best];
        pulseZ = pz[best];
        pulseAt = clock;
      });
    }

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });

    if (typeof IntersectionObserver !== 'undefined') {
      new IntersectionObserver(
        function (entries) {
          var seen = entries.some(function (entry) {
            return entry.isIntersecting;
          });
          if (seen) start();
          else stop();
        },
        { threshold: 0 }
      ).observe(canvas);
    }

    resize();
    draw(0);
    start();

    return {
      setProgress: function (value) {
        progress = clamp(value, 0, 1);
      },
      setPaused: function (value) {
        paused = Boolean(value);
      },
      setOrigin: function (x, y) {
        if (typeof x === 'number') originX = x;
        if (typeof y === 'number') originY = y;
      },
      setRadius: function (value) {
        radiusRatio = value;
      },
      resize: resize,
      start: start,
      stop: stop
    };
  }

  global.createAstralShell = createAstralShell;
})(window);
