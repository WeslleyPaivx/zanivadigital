# Zaniva Agência Digital — site

Página única, sem build obrigatório. Tudo o que roda no navegador está em `dist/`.

## Estrutura

```
src/
  index.template.html     markup da página (fonte, nav, seções, rodapé)
  styles/
    base.css              tokens de cor/tipografia e o grid da página
    site.css              seções: hero, serviços, estúdio, fundadores, contato
    cardnav.css           React Bits — CardNav (CSS original)
    scrollstack.css       React Bits — ScrollStack (CSS original)
    magicbento.css        React Bits — MagicBento (CSS original)
    scrollexpand.css      ScrollExpand (implementado aqui)
  js/
    astral.js             fundo Astral Shell: globo de estrelas conectadas, zoom no scroll
    cardnav.js            CardNav em JS puro
    scrollstack.js        ScrollStack em JS puro
    scrollexpand.js       ScrollExpand em JS puro
    magicbento.js         MagicBento em JS puro
    site.js               CONTEÚDO DO SITE — textos, serviços, fundadores, contato
public/img/               fotos dos co-fundadores + logo recortada em PNG transparente
web/                      SITE PUBLICADO — documento HTML completo, é o que a Vercel serve
dist/                     fragmento usado no artifact do Claude
build.mjs                 gera os dois a partir das mesmas fontes
vercel.json               build e pasta de saída na Vercel
```

## Editar

Quase tudo que você vai querer trocar está no topo de `src/js/site.js`:

```js
var ZANIVA = {
  whatsapp: 'https://wa.me/5500000000000',  // <- troque: 55 + DDD + número
  instagram: 'https://instagram.com/zaniva.digital',
  email: 'contato@zaniva.com.br',
  cidade: 'Brasil — atendimento remoto',
  horario: 'Seg a sex, 9h às 18h'
};
```

Logo abaixo ficam a lista `SERVICOS`, os cartões do estúdio e os dois co-fundadores.

Depois de editar:

```
node build.mjs
```

Na Vercel o deploy é automático: todo push na branch `main` roda `node build.mjs` e publica a
pasta `web/`. Pra qualquer outra hospedagem estática, é só subir o conteúdo de `web/`.

## Dependências

Nenhuma. O fundo é canvas 2D puro e o resto é CSS e JS do próprio projeto.
As fontes vêm do Google Fonts; sem internet, cai no fallback do sistema.

## Logo

`public/img/zaniva-lockup.png`    logo completa, fundo transparente — usada na entrada (scroll)
`public/img/zaniva-wordmark.png`  só "zaniva.", fundo transparente
`public/img/zaniva-nav.png`       versão pequena usada no menu

Foram recortadas da imagem que você mandou. Quando tiver a versão em alta (ou em SVG),
é só substituir os arquivos mantendo os nomes e rodar `node build.mjs`.

## Versão React

Os quatro componentes vieram do React Bits em variante JS + CSS e foram portados para
JS puro (mesmo DOM, mesmas classes, mesma matemática de animação), porque o site é uma
página única sem bundler. Se você montar um projeto React depois, dá pra instalar os
originais com `npx shadcn@latest add @react-bits/<Componente>-JS-CSS` e reaproveitar os
textos de `src/js/site.js`.
