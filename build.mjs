/* Gera os dois formatos a partir das mesmas fontes:
     web/    site completo, com <!doctype>, <head> e metatags — é o que a Vercel serve
     dist/   fragmento usado no artifact do Claude (lá o <head> é montado na publicação)
   Rodar: node build.mjs */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'src');

const SITE = {
  title: 'Zaniva — Agência Digital',
  description:
    'Sites, aplicativos, automação no WhatsApp e presença no Google Meu Negócio. Agência digital fundada por Dener Zanetoni e Weslley Paiva.',
  url: 'https://zanivadigital.vercel.app',
  locale: 'pt_BR'
};

const CSS = ['base.css', 'cardnav.css', 'scrollstack.css', 'scrollexpand.css', 'magicbento.css', 'site.css'];
const JS = ['astral.js', 'cardnav.js', 'scrollstack.js', 'scrollexpand.js', 'magicbento.js', 'site.js'];

const read = (kind, name) => readFileSync(join(src, kind, name), 'utf8');
const css = CSS.map(name => `/* ===== ${name} ===== */\n${read('styles', name)}`).join('\n');
const js = JS.map(name => `/* ===== ${name} ===== */\n${read('js', name)}`).join('\n');

const template = readFileSync(join(src, 'index.template.html'), 'utf8');
const filled = template.replace('/*INJECT:css*/', () => css).replace('/*INJECT:js*/', () => js);

const marker = '<!--SPLIT-->';
const at = filled.indexOf(marker);
if (at < 0) throw new Error('index.template.html precisa do marcador <!--SPLIT--> entre o <style> e o conteúdo');
const headPart = filled.slice(0, at).trim();
const bodyPart = filled.slice(at + marker.length).trim();

/* ---------- 1. site completo (Vercel) ---------- */

// o <title> do template é o nome do artifact; o site publicado usa o nome completo
const head = headPart
  .split('\n')
  .filter(line => !line.includes('claude:viewport-fit-sides') && !line.includes('<title>'))
  .join('\n');

const standalone = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${SITE.title}</title>
<meta name="description" content="${SITE.description}">
<meta name="theme-color" content="#07050d">
<link rel="canonical" href="${SITE.url}/">
<link rel="icon" type="image/png" href="img/favicon.png">
<link rel="apple-touch-icon" href="img/favicon.png">
<meta property="og:type" content="website">
<meta property="og:locale" content="${SITE.locale}">
<meta property="og:site_name" content="Zaniva">
<meta property="og:title" content="${SITE.title}">
<meta property="og:description" content="${SITE.description}">
<meta property="og:url" content="${SITE.url}/">
<meta property="og:image" content="${SITE.url}/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${SITE.title}">
<meta name="twitter:description" content="${SITE.description}">
<meta name="twitter:image" content="${SITE.url}/img/og.png">
${head}
</head>
<body>
${bodyPart}
</body>
</html>
`;

/* ---------- 2. fragmento (artifact do Claude) ---------- */

const fragment = `${headPart}\n\n${bodyPart}\n`;

function emit(dir, html, images) {
  rmSync(join(here, dir), { recursive: true, force: true });
  mkdirSync(join(here, dir, 'img'), { recursive: true });
  writeFileSync(join(here, dir, 'index.html'), html);
  for (const file of readdirSync(join(here, 'public', 'img'))) {
    if (images && !images.includes(file)) continue;
    copyFileSync(join(here, 'public', 'img', file), join(here, dir, 'img', file));
  }
  console.log(`${dir}/index.html — ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
}

emit('web', standalone);
copyFileSync(join(here, 'public', 'robots.txt'), join(here, 'web', 'robots.txt'));
writeFileSync(
  join(here, 'web', 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE.url}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>
</urlset>
`
);
emit('dist', fragment, ['dener.jpg', 'weslley.jpg', 'zaniva-nav.png', 'zaniva-lockup.png']);
