/* CardNav — vanilla port of the React Bits component (JS + CSS variant).
   Same DOM, same class names, same spring/stagger engine and the same
   props, passed as an options object instead of React props. */
(function (global) {
  'use strict';

  var THEMES = {
    dark: {
      '--cn-panel': 'rgba(38, 35, 46, 0.72)',
      '--cn-solid': '#26232e',
      '--cn-edge': 'rgba(255, 255, 255, 0.08)',
      '--cn-highlight': 'rgba(255, 255, 255, 0.07)',
      '--cn-shadow': '0 24px 48px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
      '--cn-text': '#f4f4f5',
      '--cn-muted': 'rgba(244, 244, 245, 0.56)',
      '--cn-hover': 'rgba(255, 255, 255, 0.06)',
      '--cn-ring': 'rgba(244, 244, 245, 0.55)',
      '--cn-tile': 'linear-gradient(180deg, #34303d 0%, #27242f 100%)',
      '--cn-tile-rim':
        'inset 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 10px -4px rgba(0, 0, 0, 0.6)',
      '--cn-cta': 'linear-gradient(180deg, #ffffff 0%, #ebebf0 100%)',
      '--cn-cta-ink': '#121016',
      '--cn-cta-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 6px 16px -6px rgba(0, 0, 0, 0.6)',
      '--cn-cta-hover': 'brightness(0.94)'
    },
    light: {
      '--cn-panel': 'rgba(244, 244, 246, 0.84)',
      '--cn-solid': '#f4f4f6',
      '--cn-edge': 'rgba(24, 24, 27, 0.07)',
      '--cn-highlight': 'rgba(255, 255, 255, 0.95)',
      '--cn-shadow': '0 24px 48px -24px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
      '--cn-text': '#18181b',
      '--cn-muted': 'rgba(24, 24, 27, 0.56)',
      '--cn-hover': 'rgba(24, 24, 27, 0.05)',
      '--cn-ring': 'rgba(24, 24, 27, 0.45)',
      '--cn-tile': 'linear-gradient(180deg, #ffffff 0%, #f8f8fa 100%)',
      '--cn-tile-rim':
        'inset 0 0 0 1px rgba(24, 24, 27, 0.07), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.22)',
      '--cn-cta': 'linear-gradient(180deg, #2c2c31 0%, #18181b 100%)',
      '--cn-cta-ink': '#ffffff',
      '--cn-cta-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 6px 14px -6px rgba(24, 24, 27, 0.45)',
      '--cn-cta-hover': 'brightness(1.25)'
    }
  };

  var NARROW = 560;
  var EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var ARROW_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function contrastInk(color) {
    var hex = String(color || '')
      .trim()
      .replace('#', '');
    if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
    var full =
      hex.length === 3
        ? hex
            .split('')
            .map(function (c) {
              return c + c;
            })
            .join('')
        : hex;
    var channel = function (index) {
      var value = parseInt(full.slice(index, index + 2), 16) / 255;
      return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    };
    var luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
    return luminance > 0.36 ? '#121016' : '#ffffff';
  }

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function CardNav(host, options) {
    var o = options || {};
    var items = o.items || [];
    var cta = o.cta;
    var theme = o.theme === 'light' ? 'light' : 'dark';
    var surface = o.surface || 'glass';
    var openOn = o.openOn || 'click';
    var cardEffect = o.cardEffect || 'rise';
    var stagger = clamp(o.stagger == null ? 0.12 : o.stagger, 0, 0.3);
    var bounce = clamp(o.bounce == null ? 0.2 : o.bounce, 0, 1);
    var speed = clamp(o.speed == null ? 1 : o.speed, 0.2, 3);
    var cardHeight = o.cardHeight == null ? 176 : o.cardHeight;
    var maxWidth = o.maxWidth == null ? 800 : o.maxWidth;
    var menuLabel = o.menuLabel !== false;
    var intro = o.intro !== false;
    var ariaLabel = o.ariaLabel || 'Main';

    var open = Boolean(o.defaultOpen);
    var shown = open;
    var narrow = false;
    var cards = [];
    var leaveTimer = 0;

    /* ---- root + vars ---- */
    var root = el('div', 'card-nav' + (o.className ? ' ' + o.className : ''));
    var palette = THEMES[theme];
    var vars = {};
    for (var key in palette) vars[key] = palette[key];
    vars['--cn-max'] = maxWidth + 'px';
    vars['--cn-bar'] = '60px';
    vars['--cn-inset'] = '8px';
    vars['--cn-gap'] = '8px';
    vars['--cn-radius'] = '18px';
    vars['--cn-logo'] = '24px';
    vars['--cn-card'] = cardHeight + 'px';
    if (surface === 'glass') vars['--cn-blur'] = 'blur(20px) saturate(1.6)';
    if (surface === 'solid') {
      vars['--cn-panel'] = palette['--cn-solid'];
      vars['--cn-blur'] = 'none';
    }
    if (o.accentColor) {
      vars['--cn-cta'] = o.accentColor;
      vars['--cn-cta-ink'] = contrastInk(o.accentColor) || '#ffffff';
      vars['--cn-cta-shadow'] = 'inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 6px 16px -6px rgba(0, 0, 0, 0.45)';
      vars['--cn-cta-hover'] = 'brightness(1.08)';
    }
    for (var v in vars) root.style.setProperty(v, vars[v]);

    /* ---- panel + bar ---- */
    var panel = el('nav', 'card-nav__panel');
    panel.setAttribute('aria-label', ariaLabel);
    var bar = el('div', 'card-nav__bar');

    var menuButton = el('button', 'card-nav__menu');
    menuButton.type = 'button';
    if (!menuLabel) menuButton.setAttribute('data-icon-only', '');
    menuButton.innerHTML =
      '<span class="card-nav__burger" aria-hidden="true">' +
      '<span class="card-nav__line card-nav__line--top"></span>' +
      '<span class="card-nav__line card-nav__line--bottom"></span>' +
      '</span>' +
      (menuLabel
        ? '<span class="card-nav__menu-label">' +
          '<span class="card-nav__word card-nav__word--open">' +
          (o.openWord || 'Menu') +
          '</span>' +
          '<span class="card-nav__word card-nav__word--close">' +
          (o.closeWord || 'Fechar') +
          '</span>' +
          '</span>'
        : '');
    bar.appendChild(menuButton);

    var logoLink = null;
    if (o.logo) {
      logoLink = el('a', 'card-nav__logo');
      logoLink.href = o.logoHref || '#';
      logoLink.setAttribute('aria-label', o.logoAlt || 'Logo');
      var looksLikeImage =
        typeof o.logo === 'string' &&
        (/^(https?:|data:|\.|\/)/.test(o.logo) || /\.(png|jpe?g|svg|webp|avif|gif)$/i.test(o.logo));
      logoLink.innerHTML = looksLikeImage
        ? '<img src="' + o.logo + '" alt="" draggable="false">'
        : o.logo;
      bar.appendChild(logoLink);
    }

    function buildCta(wide) {
      var node;
      if (cta.href) {
        node = el('a', wide ? 'card-nav__cta card-nav__cta--wide' : 'card-nav__cta');
        node.href = cta.href;
        if (cta.target) node.target = cta.target;
        if (cta.rel) node.rel = cta.rel;
      } else {
        node = el('button', wide ? 'card-nav__cta card-nav__cta--wide' : 'card-nav__cta');
        node.type = 'button';
      }
      node.textContent = cta.label;
      node.addEventListener('click', function (event) {
        if (cta.onClick) cta.onClick(event);
        if (wide) setOpen(false);
      });
      return node;
    }

    var ctaNode = cta ? buildCta(false) : null;
    if (ctaNode) bar.appendChild(ctaNode);
    panel.appendChild(bar);

    /* ---- content ---- */
    var content = el('div', 'card-nav__content');
    content.id = 'card-nav-' + Math.random().toString(36).slice(2, 8);
    content.setAttribute('aria-hidden', 'true');
    menuButton.setAttribute('aria-controls', content.id);
    menuButton.setAttribute('aria-expanded', 'false');

    var cardsWrap = el('div', 'card-nav__cards');
    items.forEach(function (item) {
      var card = el('div', 'card-nav__card');
      if (item.bgColor) {
        card.setAttribute('data-tinted', '');
        card.style.background = item.bgColor;
        if (item.textColor) card.style.color = item.textColor;
      }
      var head = el('div', 'card-nav__card-head');
      head.appendChild(el('span', 'card-nav__label', item.label));
      if (item.description) head.appendChild(el('p', 'card-nav__description', item.description));
      card.appendChild(head);

      var list = el('ul', 'card-nav__links');
      (item.links || []).forEach(function (link) {
        var li = document.createElement('li');
        var node;
        if (link.href) {
          node = el('a', 'card-nav__link');
          node.href = link.href;
          if (link.target) node.target = link.target;
          if (link.rel) node.rel = link.rel;
        } else {
          node = el('button', 'card-nav__link');
          node.type = 'button';
        }
        if (link.ariaLabel) node.setAttribute('aria-label', link.ariaLabel);
        node.innerHTML =
          '<span class="card-nav__arrow" aria-hidden="true">' +
          '<span class="card-nav__arrow-icon card-nav__arrow-icon--out">' +
          ARROW_SVG +
          '</span>' +
          '<span class="card-nav__arrow-icon card-nav__arrow-icon--in">' +
          ARROW_SVG +
          '</span>' +
          '</span>';
        node.appendChild(document.createTextNode(link.label));
        node.addEventListener('click', function (event) {
          if (o.onLinkClick) o.onLinkClick(link, item, event);
          setOpen(false);
        });
        li.appendChild(node);
        list.appendChild(li);
      });
      card.appendChild(list);
      cardsWrap.appendChild(card);
      cards.push(card);
    });
    content.appendChild(cardsWrap);

    var wideCtaWrap = null;
    if (cta) {
      wideCtaWrap = el('div', '');
      // the wide CTA only exists on narrow layouts, where the bar CTA is hidden
      wideCtaWrap.style.display = 'none';
      wideCtaWrap.appendChild(buildCta(true));
      content.appendChild(wideCtaWrap);
    }

    panel.appendChild(content);
    panel.appendChild(el('span', 'card-nav__rim'));
    root.appendChild(panel);
    host.appendChild(root);

    /* ---- focusability ---- */
    function syncTabIndex() {
      var nodes = content.querySelectorAll('.card-nav__link, .card-nav__cta--wide');
      for (var i = 0; i < nodes.length; i++) {
        if (open) nodes[i].removeAttribute('tabindex');
        else nodes[i].setAttribute('tabindex', '-1');
      }
    }
    syncTabIndex();

    /* ---- spring engine ---- */
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var state = { p: open ? 1 : 0, v: 0, height: content.offsetHeight, bar: 60 };
    var raf = 0;
    var last = 0;

    function animatedCards() {
      var list = cards.slice();
      if (wideCtaWrap && narrow) list.push(wideCtaWrap);
      return list;
    }

    function render() {
      state.bar = parseFloat(getComputedStyle(panel).getPropertyValue('--cn-bar')) || 60;
      panel.style.height = state.bar + Math.max(0, state.p) * state.height + 'px';
      var list = animatedCards();
      var count = list.length;
      var lag = count > 1 ? Math.min(stagger, 0.7 / (count - 1)) : 0;
      var span = 1 - lag * (count - 1);
      list.forEach(function (card, index) {
        var local = clamp((state.p - index * lag) / Math.max(span, 0.05), 0, 1);
        var e = easeOut(local);
        if (cardEffect === 'unfold') {
          card.style.transform = 'translateY(' + (1 - e) * -10 + 'px) rotateX(' + (1 - e) * -72 + 'deg)';
          card.style.opacity = String(clamp(local * 1.8, 0, 1));
          card.style.filter = '';
        } else if (cardEffect === 'fade') {
          card.style.transform = 'translateY(' + (1 - e) * 6 + 'px)';
          card.style.opacity = String(e);
          card.style.filter = e < 0.999 ? 'blur(' + (1 - e) * 6 + 'px)' : '';
        } else {
          card.style.transform = 'translateY(' + (1 - e) * 26 + 'px) scale(' + (0.97 + 0.03 * e) + ')';
          card.style.opacity = String(e);
          card.style.filter = '';
        }
      });
    }

    function tick(now) {
      raf = 0;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      var target = open ? 1 : 0;
      if (reduce) {
        state.p = target;
        state.v = 0;
      } else {
        var k = 160 * speed * speed;
        var zeta = open ? 1 - 0.68 * bounce : 1;
        var steps = Math.ceil(dt / (1 / 240));
        var h = dt / steps;
        for (var i = 0; i < steps; i++) {
          state.v += (-k * (state.p - target) - 2 * zeta * Math.sqrt(k) * state.v) * h;
          state.p += state.v * h;
        }
      }
      var done = Math.abs(state.p - target) < 0.0005 && Math.abs(state.v) < 0.002;
      if (done) {
        state.p = target;
        state.v = 0;
      }
      render();
      if (done && target === 0) {
        shown = false;
        root.removeAttribute('data-shown');
      }
      if (!done) raf = requestAnimationFrame(tick);
    }

    function wake() {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    }

    function refresh() {
      state.height = content.offsetHeight;
      render();
    }

    function setOpen(next) {
      if (next === open) return;
      open = next;
      if (open) {
        shown = true;
        root.setAttribute('data-shown', '');
        root.setAttribute('data-open', '');
      } else {
        root.removeAttribute('data-open');
      }
      menuButton.setAttribute('aria-expanded', String(open));
      content.setAttribute('aria-hidden', String(!open));
      syncTabIndex();
      if (o.onOpenChange) o.onOpenChange(open);
      refresh();
      wake();
    }

    render();
    var contentObserver = new ResizeObserver(refresh);
    contentObserver.observe(content);

    var rootObserver = new ResizeObserver(function () {
      var next = root.offsetWidth < NARROW;
      if (next === narrow) return;
      narrow = next;
      if (narrow) root.setAttribute('data-narrow', '');
      else root.removeAttribute('data-narrow');
      if (ctaNode) ctaNode.style.display = narrow ? 'none' : '';
      if (wideCtaWrap) wideCtaWrap.style.display = narrow ? '' : 'none';
      refresh();
      wake();
    });
    rootObserver.observe(root);

    menuButton.addEventListener('click', function () {
      setOpen(!open);
    });

    document.addEventListener('pointerdown', function (event) {
      if (!open) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (!open || event.key !== 'Escape') return;
      setOpen(false);
      menuButton.focus();
    });

    if (openOn === 'hover') {
      root.addEventListener('pointerenter', function (event) {
        if (event.pointerType === 'touch') return;
        window.clearTimeout(leaveTimer);
        setOpen(true);
      });
      root.addEventListener('pointerleave', function (event) {
        if (event.pointerType === 'touch') return;
        window.clearTimeout(leaveTimer);
        leaveTimer = window.setTimeout(function () {
          setOpen(false);
        }, 160);
      });
    }

    /* ---- intro unroll ---- */
    if (intro && !reduce && panel.animate) {
      var width = panel.offsetWidth;
      var height = panel.offsetHeight;
      var radius = parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 18;
      panel.animate(
        [
          {
            clipPath: 'inset(0px ' + Math.max(0, (width - height) / 2) + 'px round ' + height / 2 + 'px)',
            opacity: 0
          },
          { clipPath: 'inset(0px 0px round ' + radius + 'px)', opacity: 1 }
        ],
        { duration: 820, easing: EASE_OUT, fill: 'backwards' }
      );
      Array.prototype.forEach.call(bar.children, function (child, index) {
        child.animate(
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          { duration: 560, delay: 220 + index * 70, easing: EASE_OUT, fill: 'backwards' }
        );
      });
    }

    return { root: root, setOpen: setOpen, refresh: refresh };
  }

  global.CardNav = CardNav;
})(window);
