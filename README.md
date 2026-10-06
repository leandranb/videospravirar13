# Vídeos pra virar

Acervo de vídeos curtos para voluntários compartilharem no segundo turno. A pessoa escolhe **pra quem** vai mandar (como essa pessoa votou no 1º turno) e **por onde** (WhatsApp, Status/Reels, feed, YouTube, X). O site entrega o vídeo no formato certo e uma legenda pronta para aquele público e aquele canal.

> Nome: **Vídeos pra virar**. Domínios pretendidos: `videospravirar.com.br` (principal, aparece nos links) e `virar13.com.br` (curto, para falar em voz alta e para material impresso; redireciona para o principal). Confirmar disponibilidade no Registro.br. O nome fica em `data/acervo.json` → `config.nome`.

## Estrutura

```
index.html               casca da página
assets/styles.css        tokens de cor e tipografia + layout
assets/app.js            filtros, ranking, legenda por canal, compartilhamento
data/acervo.json         TODO o conteúdo: config, públicos, canais, temas e vídeos
scripts/gerar-variacoes.sh   gera 9x16, 9x16-leve, 1x1, 16x9, thumb e áudio com ffmpeg
scripts/build-paginas.mjs    gera /v/<slug>/ com a prévia do link para o WhatsApp
_headers                 cache no Cloudflare Pages/Netlify
r2-cors.json             permissão para o site baixar/compartilhar os vídeos do bucket
```

Não tem framework nem dependências. Para mexer no conteúdo, só edite `data/acervo.json`.

## Rodar no computador

```bash
npm run dev      # ou: python3 -m http.server 8000
# abra http://localhost:8000
```

## Onde hospedar e onde guardar os vídeos

**Recomendação: tudo numa conta Cloudflare.**

| O quê | Onde | Por quê |
|---|---|---|
| Site | Cloudflare Pages | Grátis, deploy a cada push no GitHub, roda o `build-paginas.mjs` |
| Vídeos | Cloudflare R2 | Não cobra pela banda de saída, que é o custo que explode com vídeo viral. Tem cota gratuita de armazenamento (confira os valores atuais) |
| Domínio | Qualquer registrador (.com.br no Registro.br) | Aponte o site e um subdomínio `videos.` para o bucket |

Por que não guardar os vídeos junto com o site: os planos gratuitos de hospedagem estática têm limite de banda, e um único vídeo viral no WhatsApp consome esse limite rápido. Separar site e arquivos protege o site de cair.

**Alternativas**
- Netlify (como o site de referência) para o site + R2 para os vídeos. Funciona igual.
- Bunny Storage + CDN para os vídeos, se preferir pagar pouco por GB com painel mais simples.
- Se no futuro quiser player adaptativo (qualidade muda com a conexão), Cloudflare Stream ou Mux. Para o MVP, MP4 direto do R2 basta.

## Passo a passo do deploy

1. **Repositório**: suba esta pasta para um repositório no GitHub.
2. **Bucket**: no painel da Cloudflare, crie um bucket R2 (ex.: `videos-pra-virar`). Em *Settings*, conecte o domínio `videos.videospravirar.com.br` e cole o conteúdo de `r2-cors.json` em *CORS policy* (troque o domínio).
3. **Site**: em *Workers & Pages → Create → Pages*, conecte o repositório.
   - Build command: `node scripts/build-paginas.mjs`
   - Build output directory: `/` (a raiz)
4. **Domínios**: conecte `videospravirar.com.br` ao projeto Pages. Para o curto `virar13.com.br`, adicione o domínio na Cloudflare e crie um *Redirect Rule* (ou *Bulk Redirect*) de `virar13.com.br/*` para `https://videospravirar.com.br/${1}` com código 301. Assim só existe um endereço "oficial" nos links compartilhados, e a prévia do WhatsApp nunca se divide entre dois domínios.
5. **Config**: em `data/acervo.json`, troque `siteUrl` e `videosBaseUrl` pelos domínios reais.

## Como adicionar um vídeo

1. Baixe o original e rode:
   ```bash
   ./scripts/gerar-variacoes.sh originais/meu-video.mp4 video-07
   ```
   Isso cria `saida/video-07/` com `9x16.mp4`, `9x16-leve.mp4`, `1x1.mp4`, `16x9.mp4`, `thumb.jpg` e `audio.m4a`.
2. Suba a pasta para o bucket mantendo o caminho `video-07/...`:
   ```bash
   npx wrangler r2 object put videos-pra-virar/video-07/9x16.mp4 --file saida/video-07/9x16.mp4 --remote
   # repita para cada arquivo, ou use rclone para subir a pasta inteira
   ```
3. Adicione o vídeo em `data/acervo.json` (copie um existente). Campos:
   - `slug`: igual ao nome da pasta no bucket
   - `publicado`: `true` só depois que os arquivos estiverem no bucket
   - `tema`: um dos `temas`; ele liga o vídeo automaticamente aos públicos que têm esse tema como ponte
   - `segmentos`: públicos para quem o vídeo funciona melhor (aparecem primeiro)
   - `objecao`: a dúvida que o vídeo ajuda a responder
   - `legendas.padrao` + uma legenda por público quando fizer diferença
   - `fonte.post`: link da publicação original
   - `argumentos`: 2 a 3 pontos curtos pra pessoa sustentar a conversa, cada um com `fonte` quando citar dado
4. Commit e push. O site atualiza sozinho.

## Como a legenda é montada

Cada vídeo tem **uma legenda-base por público** (ou só a `padrao`). O canal define a forma:
- WhatsApp: legenda + link do vídeo
- Status/Reels e feed: legenda + hashtags
- YouTube: título + legenda + link da publicação original
- X: legenda cortada para caber em 280 caracteres + link

Assim a revisão humana fica só nas legendas-base. **Toda legenda passa por revisão antes de `publicado: true`**: ela só afirma o que o vídeo e a fonte sustentam.

## Antes de publicar

- [ ] Aviso de site voluntário e não oficial visível (já está no topo e no rodapé)
- [ ] Autorização ou base para redistribuir os vídeos (são de terceiros)
- [ ] Conferir as regras do TSE para propaganda e conteúdo de campanha no período eleitoral
- [ ] Nenhum dado pessoal coletado (o site não tem formulário nem analytics por pessoa; se adicionar métricas, use contagem agregada)
- [x] Imagem de prévia `assets/previa.jpg` (1200×630), favicon e ícone
- [ ] Testar o link de um vídeo colado no WhatsApp (a prévia precisa aparecer)

## Próximas fases

1. **MVP**: vídeos da thread, 8 públicos, WhatsApp + vertical.
2. Legendas por canal revisadas, formatos 1x1 e 16x9.
3. Segunda camada de público (perfil: classe média, app, pequeno negócio, interior/agro).
4. Camada geográfica: a pessoa digita a cidade e o site sugere os públicos prioritários.
5. Reta final: foco em comparecimento.
