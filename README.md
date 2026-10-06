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
netlify.toml             build e cache no Netlify
_redirects               virar13.com.br → videospravirar.com.br
cloudflare-arquivos/_headers CORS e cache para a pasta de vídeos no Cloudflare (em uso)
hostinger-videos/.htaccess   CORS e cache para a pasta de vídeos na Hostinger (opção guardada)
r2-cors.json             (plano B) CORS se os vídeos forem para o Cloudflare R2
```

Não tem framework nem dependências. Para mexer no conteúdo, só edite `data/acervo.json`.

## Rodar no computador

```bash
npm run dev      # ou: python3 -m http.server 8000
# abra http://localhost:8000
```

## Onde hospedar e onde guardar os vídeos

**Configuração atual: Netlify (site, em `videospravirar13.netlify.app`) + Cloudflare (vídeos, em `videospravirar13-arquivos.leandranb.workers.dev`).** Sem domínio próprio por enquanto. A tabela abaixo descreve o plano original com domínio e Hostinger, guardado para quando houver domínio.

| O quê | Onde | Observação |
|---|---|---|
| Site | Netlify | Só HTML, CSS, JS e imagens leves: consome pouca banda. `netlify.toml` já configurado |
| Domínios | Hostinger (ou Registro.br) | DNS apontando para o Netlify; `virar13.com.br` como alias que redireciona |
| Vídeos | Hostinger, subdomínio `videos.videospravirar.com.br` | Usa o `.htaccess` de `hostinger-videos/` |
| Plano B dos vídeos | Cloudflare R2 | Não cobra banda de saída; trocar só `videosBaseUrl` no `acervo.json` |

**Por que os vídeos NÃO vão no Netlify.** O plano gratuito do Netlify funciona por créditos (300/mês): cada GB de banda gasta 20 créditos e cada deploy gasta 15. Isso dá no máximo uns 15 GB de banda por mês, e quando os créditos acabam o site é pausado até o mês seguinte. Um vídeo de 15 MB baixado mil vezes já consome isso. Com os vídeos fora, o site em si gasta muito pouco. Confira os valores atuais no painel do Netlify.

**Cuidado com deploys no Netlify gratuito.** Cada publicação gasta créditos. Junte várias atualizações de conteúdo num commit só, em vez de publicar vídeo por vídeo.

**Sobre a Hostinger para vídeos.** Funciona se você tem um plano de hospedagem (não só o domínio). Hospedagem compartilhada não foi feita para muito tráfego de vídeo: se um vídeo viralizar, pode ficar lenta ou bater em limite de uso. Acompanhe o painel de uso nos primeiros dias. Se apertar, migre os vídeos para o R2 (o site não muda, só a `videosBaseUrl`).

## Passo a passo do deploy

1. **Repositório**: crie um repositório no GitHub e envie esta pasta (o git já está iniciado: `git remote add origin <url>` e `git push -u origin main`).
2. **Site no Netlify**: *Add new site → Import from Git*, escolha o repositório. Build command e pasta já vêm do `netlify.toml`.
3. **Domínios**: em *Domain management*, adicione `videospravirar.com.br` como domínio principal e `virar13.com.br` como alias. Na Hostinger, aponte o DNS dos dois domínios para o Netlify (o Netlify mostra os registros). O redirecionamento do curto para o principal já está no `_redirects`.
4. **Subdomínio de vídeos na Hostinger**: no hPanel, crie o subdomínio `videos.videospravirar.com.br` (ele precisa de um registro DNS próprio apontando para a Hostinger, mesmo com o domínio principal no Netlify). Envie o `.htaccess` de `hostinger-videos/` para a pasta pública do subdomínio.
5. **Config**: `siteUrl` e `videosBaseUrl` em `data/acervo.json` já estão com os domínios pretendidos. Ajuste se mudar.

## Como adicionar um vídeo

1. Baixe o original e rode:
   ```bash
   ./scripts/gerar-variacoes.sh originais/meu-video.mp4 video-07
   ```
   Isso cria `saida/video-07/` com `9x16.mp4`, `9x16-leve.mp4`, `1x1.mp4`, `16x9.mp4`, `thumb.jpg` e `audio.m4a`.
2. Copie `saida/video-07/` para a sua pasta local `videos/` (que tem o `_headers` de `cloudflare-arquivos/` na raiz). No Cloudflare, em *Compute → Workers & Pages → videospravirar13-arquivos*, crie uma nova versão enviando a pasta `videos/` inteira (o envio substitui tudo, então a pasta precisa ter todos os vídeos). Cada arquivo pode ter no máximo 25 MB. O resultado deve abrir em `https://videospravirar13-arquivos.leandranb.workers.dev/video-07/9x16.mp4`.
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
