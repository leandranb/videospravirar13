# Contexto para o Claude Code

Projeto: **Vídeos pra virar** (videospravirar.com.br). H1: "Vídeos pra virar o jogo." Logo abaixo, a frase-ação "Quero mandar um vídeo / pra [menu] / pelo [menu]", em que os menus completam a frase e continuam com cara de menu.

Site estático de acervo de vídeos curtos para voluntários compartilharem no 2º turno de 2026 (25/10). Iniciativa voluntária, não oficial. Responda e comente em português brasileiro.

## Prioridade
Fácil de entender, de ler e de usar. Mobile first: tudo é desenhado primeiro para celular com uma mão, e o desktop é adaptação.

## Ideia central
Dois eixos escolhidos pela pessoa, nenhum mais importante que o outro:
- **Pra quem** (`segmentos`): como o destinatário votou no 1º turno. Não foi votar, branco, nulo, Cury, Renan, Caiado, Zema, votou no Lula em 2022 e mudou.
- **Por onde** (`canais`): define o arquivo entregue (formato) e a forma da legenda.

Vídeos aparecem para um público se estiverem em `video.segmentos` (prioridade) ou se o `video.tema` estiver em `segmento.temasPonte` (pontos em comum entre o programa de Lula e o do candidato em que a pessoa votou).

## Infra
Site no Netlify (créditos limitados no plano gratuito: evitar deploys desnecessários, agrupar mudanças). Endereço provisório videospravirar13.netlify.app (sem domínio próprio por enquanto). Vídeos no Cloudflare (Worker de arquivos estáticos videospravirar13-arquivos.leandranb.workers.dev, limite de 25 MB por arquivo, `_headers` em `cloudflare-arquivos/`). Vídeos nunca no Netlify. Opções antigas guardadas: Hostinger (`hostinger-videos/`) e R2 (`r2-cors.json`).

## Regras do projeto
- Sem framework e sem dependências no front. HTML + CSS + JS puro.
- Todo conteúdo em `data/acervo.json`. Não escrever conteúdo dentro do JS ou HTML.
- Arquivos de vídeo seguem a convenção `${videosBaseUrl}/${slug}/${formato}.mp4` e `thumb.jpg`. Não guardar vídeo no repositório.
- Mobile primeiro. O público usa celular e compartilha pelo WhatsApp.
- Cada vídeo precisa de página própria em `/v/<slug>/` com og:image (gerada por `scripts/build-paginas.mjs`), porque o WhatsApp não executa JS.
- Não coletar dados pessoais de quem usa nem de quem recebe. Métricas, se houver, só agregadas.
- Legendas e argumentos só afirmam o que o vídeo e a fonte sustentam. Argumento com número sempre tem `fonte`.
- Manter visível o aviso de site voluntário e não oficial.

## Design
Tokens no topo de `assets/styles.css`. Referência de conteúdo: ondedapraconversar.com.br, mas a estética NÃO deve copiar aquele site (nada de faixa vermelha estreita de navegação, pílulas contornadas ou caixas rosadas).
Direção: o vermelho PT (#E2001A, vivo) é o palco. O topo inteiro é vermelho, com título curto e dois campos de escolha numerados ("1. Pra quem você vai mandar?", "2. Por onde?"). Os campos são `<select>` nativos estilizados como caixa branca grande com seta num círculo vermelho: precisam ser reconhecidos de imediato como menu. Não voltar para frase com palavras clicáveis (testado e não ficou claro). Abaixo, fundo claro, abas sublinhadas para temas, cards escuros de vídeo com play vermelho, opções em lista com marcação, uma única ação principal vermelha por tela. Fonte: Bricolage Grotesque.

Sistema de tokens no topo do CSS, traduzido da escala do Tailwind sem usar o framework: espaço em passos de 4px (--e1 a --e16), tipo travado em 7 tamanhos (--t-sm a --t-6xl), raios em 3 níveis (controle, superfície, diálogo), neutros zinc, sombras tingidas. Não usar valores fora desses tokens. Campo de escolha é um componente único com variante de palco (branca, sobre o vermelho) e variante neutra (dentro do vídeo aberto). No celular, a ação principal do vídeo aberto gruda no rodapé da tela.

Segmentos podem ter `rotulo` (texto curto para os menus) além de `frase` (usada em frases como "2 vídeos pra quem..."). Use `rotulo` sempre que a frase passar de ~28 caracteres, para não cortar no menu.

## Acessibilidade (obrigatório)
- Contraste AA ou melhor. Texto vermelho sobre claro usa #B80D24 (6,7:1); branco sobre #E2001A dá 4,9:1 (não escurecer o texto branco nem clarear o vermelho além disso).
- Alvos de toque com no mínimo 44px; botões principais com 56px.
- Estado nunca indicado só por cor (aba tem sublinhado e peso; opção tem marcação).
- Foco sempre visível; link "Pular para os vídeos"; diálogos nativos (`<dialog>`) para Esc e foco.
- Seletores são `<select>` nativos com `<label>` visível (no celular abrem o menu do próprio sistema).
- Linguagem simples; cada tela tem uma ação principal e uma nota curta explicando o que acontece.
- Respeitar `prefers-reduced-motion`, `forced-colors` e dark mode.
- Vídeos publicados devem ter legenda queimada (acessível sem som).

## Pendências conhecidas
- Conteúdo real dos vídeos (aguardando prints da thread do @ptbrasil)
- Domínio, `assets/previa.jpg`, nome definitivo do site
- Revisão das legendas por público
