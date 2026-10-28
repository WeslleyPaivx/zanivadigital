/* Zaniva — content and wiring. */
(function () {
  'use strict';

  /* ======================================================================
     EDITÁVEL — troque estes dados e o site inteiro acompanha.
     ====================================================================== */
  var ZANIVA = {
    whatsapp: 'https://wa.me/5500000000000', // <- troque pelo número real (55 + DDD + número)
    instagram: 'https://instagram.com/zaniva.digital',
    email: 'contato@zaniva.com.br',
    cidade: 'Brasil — atendimento remoto',
    horario: 'Seg a sex, 9h às 18h'
  };

  var ICON = window.MagicBento.glyph;
  var G = window.MagicBento.GLYPHS;

  var ARROW =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';

  function esc(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ======================================================================
     Palco 3D
     ====================================================================== */
  /* Celular paga caro por cada pintura do globo: ele vai com menos estrelas,
     sem densidade de retina e em meia taxa de quadros. Atrás do véu a
     diferença não aparece, e a rolagem deixa de travar. */
  var touch =
    (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) ||
    window.innerWidth < 860;

  var stageCanvas = document.getElementById('stage-canvas');
  var scene = window.createAstralShell
    ? window.createAstralShell(stageCanvas, {
        colors: ['#7c6bff', '#ffe6fa'],
        backgroundColor: 'transparent',
        nodes: touch ? 420 : 1500,
        connections: touch ? 2 : 3,
        reach: touch ? 0.3 : 0.22,
        clustering: 0.85,
        chords: touch ? 0.2 : 0.35,
        nodeSize: touch ? 1.3 : 0.9,
        radius: 0.42,
        originY: 0.46,
        tilt: 18,
        spin: 1,
        depthFade: 0.72,
        lineOpacity: 0.7,
        interactive: !touch,
        hoverRadius: 0.2,
        hoverBoost: 1,
        clickPulse: true,
        pulseSpeed: 1.2,
        dpr: touch ? 1 : 2,
        maxFps: touch ? 30 : 0,
        seed: 7
      })
    : null;
  if (!scene && stageCanvas) stageCanvas.style.display = 'none';

  /* Em tela larga o globo fica à direita, fora do caminho do texto, e o véu
     escurece o lado da leitura. Conforme a entrada abre, o globo desliza para
     o centro e o véu abre junto. */
  var veil = document.querySelector('.stage__veil');
  var stageProgress = 0;

  function placeStage() {
    if (!scene) return;
    var wide = window.innerWidth > 860;
    var p = stageProgress;
    var restX = wide ? 0.68 : 0.5;
    var restY = wide ? 0.44 : 0.34;
    scene.setOrigin(restX + (0.5 - restX) * p, restY + (0.46 - restY) * p);
    scene.setRadius((wide ? 0.42 : 0.4) + 0.03 * p);
    scene.setProgress(p);
    if (veil) veil.style.opacity = String(1 - 0.6 * p);
  }

  placeStage();
  window.addEventListener('resize', placeStage);

  /* ======================================================================
     Navegação — CardNav
     ====================================================================== */
  window.CardNav(document.getElementById('nav'), {
    logo: 'img/zaniva-nav.png',
    logoAlt: 'Zaniva',
    logoHref: '#topo',
    theme: 'dark',
    surface: 'glass',
    openOn: 'click',
    cardEffect: 'rise',
    menuLabel: true,
    openWord: 'Menu',
    closeWord: 'Fechar',
    stagger: 0.1,
    bounce: 0.22,
    cardHeight: 184,
    maxWidth: 940,
    accentColor: '#ee8dd8',
    cta: { label: 'Falar no WhatsApp', href: ZANIVA.whatsapp, target: '_blank', rel: 'noopener' },
    items: [
      {
        label: 'Serviços',
        description: 'O que a gente constrói, publica e mantém no ar.',
        links: [
          { label: 'Google Meu Negócio', href: '#servicos' },
          { label: 'Sites e landing pages', href: '#servicos' },
          { label: 'Automação e chatbot', href: '#servicos' },
          { label: 'Aplicativos', href: '#servicos' }
        ]
      },
      {
        label: 'Estúdio',
        description: 'Como a Zaniva trabalha, do briefing ao deploy.',
        links: [
          { label: 'Como trabalhamos', href: '#estudio' },
          { label: 'Co-fundadores', href: '#fundadores' }
        ]
      },
      {
        label: 'Contato',
        description: 'Resposta no mesmo dia útil.',
        links: [
          { label: 'WhatsApp', href: ZANIVA.whatsapp, target: '_blank', rel: 'noopener' },
          { label: 'Instagram', href: ZANIVA.instagram, target: '_blank', rel: 'noopener' },
          { label: 'Orçamento', href: '#contato' }
        ]
      }
    ],
    onLinkClick: function (link) {
      if (link.href && link.href.charAt(0) === '#') {
        var target = document.querySelector(link.href);
        if (target) {
          setTimeout(function () {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        }
      }
    }
  });

  /* ======================================================================
     Entrada — ScrollExpand sobre o palco 3D
     ====================================================================== */
  var entrance = window.ScrollExpand(document.getElementById('entrada'), {
    useWindowScroll: true,
    mediaZoom: 1.45,
    title: '<img src="img/zaniva-lockup.png" alt="Zaniva — Agência Digital">',
    scrollHint: 'Role',
    track: '320vh',
    insetX: 28,
    insetY: 26,
    radius: 30,
    children:
      '<span class="entrance__eyebrow">A entrada</span>' +
      '<p class="entrance__line">Da primeira busca no Google até o app na mão do cliente.</p>' +
      '<p class="entrance__sub">A Zaniva cuida da presença inteira: o que o cliente encontra, o que ele abre e o que responde quando ele chama.</p>',
    onProgress: function (p) {
      stageProgress = p;
      placeStage();
    }
  });
  entrance.frame.classList.add('scroll-expand__frame--reveal');

  /* ======================================================================
     Serviços — ScrollStack
     ====================================================================== */
  var SERVICOS = [
    {
      glyph: G.pin,
      title: 'Google Meu Negócio',
      copy: 'Seu negócio aparecendo no mapa e na busca na hora em que alguém procura por perto. Perfil completo, fotos, horários, posts e as avaliações organizadas.',
      tags: ['Perfil otimizado', 'SEO local', 'Posts e fotos', 'Avaliações'],
      nota: 'Setup + acompanhamento mensal'
    },
    {
      glyph: G.window,
      title: 'Sites e landing pages',
      copy: 'Site institucional, one-page ou landing de campanha. Desenho próprio, carregamento rápido, texto pensado pra converter e domínio configurado por nós.',
      tags: ['Design próprio', 'Performance', 'SEO técnico', 'Hospedagem'],
      nota: 'Projeto fechado'
    },
    {
      glyph: G.chat,
      title: 'Automação e chatbot',
      copy: 'Atendimento no WhatsApp que responde na hora, qualifica o lead, agenda e manda lembrete — 24 horas, sem ninguém acordar de madrugada.',
      tags: ['WhatsApp', 'Agendamento', 'Integração com CRM', 'Follow-up'],
      nota: 'Projeto + mensalidade'
    },
    {
      glyph: G.phone,
      title: 'Aplicativos',
      copy: 'App Android e iOS do protótipo à publicação nas lojas, com painel para você mesmo mexer no conteúdo depois que estiver no ar.',
      tags: ['Android', 'iOS', 'Painel admin', 'Notificações'],
      nota: 'Sob escopo'
    },
    {
      glyph: G.spark,
      title: 'Identidade e conteúdo',
      copy: 'Marca, paleta, social e peças de campanha para a empresa falar a mesma língua no site, no perfil e no anúncio.',
      tags: ['Marca', 'Social', 'Tráfego pago', 'Vídeo'],
      nota: 'Pacote mensal'
    }
  ];

  var servicoCards = SERVICOS.map(function (item, index) {
    return (
      '<article class="svc">' +
      '<div class="svc__top">' +
      '<span class="svc__index">' +
      String(index + 1).padStart(2, '0') +
      ' / ' +
      String(SERVICOS.length).padStart(2, '0') +
      '</span>' +
      '<span class="svc__glyph">' +
      ICON(item.glyph, 20) +
      '</span>' +
      '</div>' +
      '<h3 class="svc__title">' +
      esc(item.title) +
      '</h3>' +
      '<p class="svc__copy">' +
      esc(item.copy) +
      '</p>' +
      '<ul class="svc__tags">' +
      item.tags
        .map(function (tag) {
          return '<li>' + esc(tag) + '</li>';
        })
        .join('') +
      '</ul>' +
      '<div class="svc__foot">' +
      '<span class="svc__price">' +
      esc(item.nota) +
      '</span>' +
      '<a class="svc__link" href="' +
      ZANIVA.whatsapp +
      '" target="_blank" rel="noopener">Pedir proposta ' +
      ARROW +
      '</a>' +
      '</div>' +
      '</article>'
    );
  });

  window.ScrollStack(document.getElementById('servicos-stack'), {
    items: servicoCards,
    itemClassName: 'svc-card',
    useWindowScroll: true,
    itemDistance: 120,
    itemStackDistance: 22,
    stackPosition: '18%',
    itemScale: 0.035,
    baseScale: 0.86,
    dimAmount: 0.26,
    blurAmount: touch ? 0 : 1.2,
    tiltAmount: touch ? 0 : 3,
    rotationAmount: touch ? 0 : 0.6,
    holdDistance: 260,
    smoothScroll: false,
    snap: false
  });

  /* ======================================================================
     Estúdio — MagicBento
     ====================================================================== */
  window.MagicBento(document.getElementById('estudio-bento'), {
    columns: 4,
    rowHeight: 212,
    gap: 12,
    radius: 22,
    theme: 'dark',
    glowColor: '#ee8dd8',
    enableBorderGlow: true,
    enableSpotlight: true,
    spotlightRadius: 320,
    enableStars: !touch,
    particleCount: 18,
    enableTilt: !touch,
    enableMagnetism: !touch,
    clickEffect: true,
    items: [
      {
        label: 'Entrega',
        icon: ICON(G.branch, 16),
        title: 'Do briefing ao no ar',
        description: 'Quatro etapas, prazo combinado na proposta e você acompanhando cada uma.',
        visual: 'automation',
        visualProps: {
          trigger: 'Projeto aprovado',
          meta: 'zaniva/entrega',
          steps: [
            { label: 'Briefing', time: '1d' },
            { label: 'Protótipo', time: '3d' },
            { label: 'Build', time: '9d' },
            { label: 'No ar', time: '1d' }
          ]
        },
        colSpan: 2,
        rowSpan: 2
      },
      {
        label: 'Busca',
        title: 'Quem procura, acha',
        description: 'Presença no Google medida mês a mês.',
        visual: 'analytics',
        visualProps: {
          data: [1.2, 1.6, 1.5, 2.3, 2.1, 3.0, 2.8, 3.9, 3.6, 5.1, 6.0, 7.4],
          unit: 'k',
          note: 'buscas/mês'
        }
      },
      {
        label: 'Ritmo',
        title: 'Fila curta',
        description: 'Poucos projetos ao mesmo tempo, de propósito.',
        visual: 'dashboard',
        visualProps: { data: [40, 62, 51, 74, 60, 88, 70], value: '3', note: 'projetos ativos' }
      },
      {
        label: 'Canais',
        icon: ICON(G.spark, 16),
        title: 'Tudo puxando pro mesmo lugar',
        description: 'Site, perfil no Google, WhatsApp e app conversando entre si em vez de cada um por conta.',
        visual: 'integration',
        visualProps: {
          apps: [
            { icon: 'globe', x: '17%', y: '24%' },
            { icon: 'pin', x: '83%', y: '24%' },
            { icon: 'chat', x: '17%', y: '78%' },
            { icon: 'phone', x: '83%', y: '78%' }
          ]
        },
        colSpan: 2,
        rowSpan: 2
      },
      {
        label: 'Confiança',
        title: 'Nada improvisado',
        description: 'Certificado, backup e LGPD.',
        visual: 'security',
        visualProps: {
          settings: [
            { icon: 'key', label: 'SSL + backup' },
            { icon: 'finger', label: 'LGPD' }
          ]
        }
      },
      {
        content:
          '<div class="magic-bento__header">' +
          '<span class="magic-bento__icon">' +
          ICON(G.chat, 16) +
          '</span><span class="magic-bento__label">Suporte</span></div>' +
          '<div class="magic-bento__visual" aria-hidden="true">' +
          '<span class="bento-stat"><span class="bento-stat__value">2</span>' +
          '<span class="bento-stat__unit">fundadores<br>no seu grupo</span></span></div>' +
          '<div class="magic-bento__text">' +
          '<h3 class="magic-bento__title">Você fala com quem fez</h3>' +
          '<p class="magic-bento__description">Sem ticket, sem atendente de passagem.</p></div>'
      }
    ]
  });

  /* ======================================================================
     Co-fundadores — MagicBento com as fotos
     ====================================================================== */
  window.MagicBento(document.getElementById('fundadores-bento'), {
    columns: 4,
    rowHeight: 215,
    gap: 12,
    radius: 22,
    theme: 'dark',
    glowColor: '#ee8dd8',
    spotlightRadius: 300,
    enableTilt: !touch,
    enableMagnetism: !touch,
    textAutoHide: false,
    items: [
      {
        label: 'Co-fundador',
        title: 'Dener Zanetoni',
        description: 'Projeto e produto — desenho da solução, protótipo e acompanhamento da entrega.',
        image: 'img/dener.jpg',
        imageAlt: 'Dener Zanetoni',
        colSpan: 1,
        rowSpan: 2
      },
      {
        label: 'Co-fundador',
        title: 'Weslley Paiva',
        description: 'Desenvolvimento e operação — build, publicação e o que precisa continuar de pé depois.',
        image: 'img/weslley.jpg',
        imageAlt: 'Weslley Paiva',
        colSpan: 1,
        rowSpan: 2
      },
      {
        label: 'Como funciona',
        icon: ICON(G.chat, 16),
        title: 'Dois fundadores, um grupo só',
        description:
          'Você entra num grupo com os dois. Pedido, dúvida e ajuste passam direto por quem está construindo — sem camada no meio.',
        visual: 'collaboration',
        visualProps: { docTitle: 'Projeto — Zaniva', names: ['Dener', 'Weslley'] },
        colSpan: 2,
        rowSpan: 2
      }
    ]
  });

  /* ======================================================================
     Contato — dados e botão de copiar
     ====================================================================== */
  var contactList = document.getElementById('contato-lista');
  if (contactList) {
    var rows = [
      { key: 'WhatsApp', value: 'Chamar agora', href: ZANIVA.whatsapp },
      { key: 'E-mail', value: ZANIVA.email, copy: true },
      { key: 'Instagram', value: '@zaniva.digital', href: ZANIVA.instagram },
      { key: 'Onde', value: ZANIVA.cidade },
      { key: 'Horário', value: ZANIVA.horario }
    ];
    contactList.innerHTML = rows
      .map(function (row) {
        var value = row.href
          ? '<a href="' + row.href + '" target="_blank" rel="noopener">' + esc(row.value) + '</a>'
          : esc(row.value);
        return (
          '<li class="contact__row"><span class="contact__key">' +
          esc(row.key) +
          '</span><span class="contact__value"' +
          (row.copy ? ' data-copy="' + esc(row.value) + '"' : '') +
          '>' +
          value +
          '</span></li>'
        );
      })
      .join('');
  }

  var whatsButton = document.getElementById('contato-whatsapp');
  if (whatsButton) whatsButton.href = ZANIVA.whatsapp;

  var copyButton = document.getElementById('copiar-email');
  if (copyButton) {
    copyButton.addEventListener('click', function () {
      var original = copyButton.getAttribute('data-label') || copyButton.textContent;
      copyButton.setAttribute('data-label', original);
      var done = function () {
        copyButton.textContent = 'E-mail copiado';
        setTimeout(function () {
          copyButton.textContent = original;
        }, 2200);
      };
      try {
        navigator.clipboard.writeText(ZANIVA.email).then(done, function () {
          copyButton.textContent = ZANIVA.email;
        });
      } catch (error) {
        copyButton.textContent = ZANIVA.email;
      }
    });
  }

  /* ======================================================================
     Ano no rodapé
     ====================================================================== */
  var yearNode = document.getElementById('ano');
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());
})();
