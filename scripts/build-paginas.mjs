// Gera /v/<slug>/index.html para cada vídeo, com as tags de prévia (og:image etc.).
// Por quê: o WhatsApp não roda JavaScript, então a prévia do link precisa estar no HTML.
// Cada página mostra a prévia e manda a pessoa para o site com o vídeo aberto.
// Uso: node scripts/build-paginas.mjs   (roda automaticamente no deploy)
import { readFile, mkdir, writeFile, rm } from "node:fs/promises";

const A = JSON.parse(await readFile("data/acervo.json", "utf8"));
const { siteUrl, videosBaseUrl, nome } = A.config;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

await rm("v", { recursive: true, force: true });

for (const v of A.videos) {
  const destino = `${siteUrl}/?v=${encodeURIComponent(v.slug)}`;
  const imagem = v.publicado ? `${videosBaseUrl}/${v.slug}/thumb.jpg` : `${siteUrl}/assets/previa.jpg`;
  const descricao = (v.legendas?.padrao || "").slice(0, 160);
  const html = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(v.titulo)} | ${esc(nome)}</title>
<link rel="canonical" href="${esc(siteUrl)}/v/${esc(v.slug)}/">
<meta property="og:type" content="video.other">
<meta property="og:site_name" content="${esc(nome)}">
<meta property="og:title" content="${esc(v.titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:image" content="${esc(imagem)}">
<meta property="og:url" content="${esc(siteUrl)}/v/${esc(v.slug)}/">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${esc(destino)}">
</head><body>
<p><a href="${esc(destino)}">Abrir o vídeo: ${esc(v.titulo)}</a></p>
</body></html>`;
  await mkdir(`v/${v.slug}`, { recursive: true });
  await writeFile(`v/${v.slug}/index.html`, html);
}
console.log(`Geradas ${A.videos.length} páginas em /v/`);
