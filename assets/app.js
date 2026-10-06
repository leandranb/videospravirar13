/* Vídeos pra virar: lógica da página.
   Todos os dados vêm de data/acervo.json (ou de window.__ACERVO__ na versão empacotada). */
(function () {
  "use strict";

  const estado = { publico: "todos", canal: "whatsapp", tema: null, aberto: null };
  let A = null;

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const porId = (lista, id) => lista.find((x) => x.id === id);
  const segmento = (id) => porId(A.segmentos, id);
  const canal = (id) => porId(A.canais, id);
  const tema = (id) => porId(A.temas, id);
  const ehPlaceholder = (url) => !url || url.includes("SEU-DOMINIO");

  async function carregar() {
    if (window.__ACERVO__) return window.__ACERVO__;
    const r = await fetch("data/acervo.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("Não foi possível carregar data/acervo.json");
    return r.json();
  }

  /* ---------- URLs ---------- */
  function arquivoDoVideo(v, formato) {
    if (!v.publicado || ehPlaceholder(A.config.videosBaseUrl)) return null;
    return `${A.config.videosBaseUrl}/${v.slug}/${formato}.mp4`;
  }
  function thumbDoVideo(v) {
    if (!v.publicado || ehPlaceholder(A.config.videosBaseUrl)) return null;
    return `${A.config.videosBaseUrl}/${v.slug}/thumb.jpg`;
  }
  function linkDoVideo(v) {
    if (!ehPlaceholder(A.config.siteUrl)) return `${A.config.siteUrl}/v/${v.slug}/`;
    const u = new URL(location.href);
    u.search = "";
    u.hash = "";
    u.searchParams.set("v", v.slug);
    return u.toString();
  }

  /* ---------- Seleção e ordem ---------- */
  function videosVisiveis() {
    let lista = A.videos.slice();
    if (estado.tema) lista = lista.filter((v) => v.tema === estado.tema);
    if (estado.publico === "todos") return lista;
    const seg = segmento(estado.publico);
    return lista
      .map((v) => ({ v, nota: v.segmentos.includes(seg.id) ? 2 : seg.temasPonte.includes(v.tema) ? 1 : 0 }))
      .filter((x) => x.nota > 0)
      .sort((a, b) => b.nota - a.nota)
      .map((x) => x.v);
  }

  /* ---------- Legenda: base por público, forma por canal ---------- */
  function legenda(v, publicoId, canalId) {
    const base = (v.legendas && (v.legendas[publicoId] || v.legendas.padrao)) || v.titulo;
    const c = canal(canalId);
    const link = linkDoVideo(v);
    const tags = (v.hashtags || A.config.hashtags || []).join(" ");
    switch (c.estilo) {
      case "conversa":
        return `${base}\n\n${link}`;
      case "hashtags":
        return `${base}\n\n${tags}`;
      case "descricao":
        return `${v.titulo}\n\n${base}\n\nPublicação original: ${v.fonte?.post || ""}`;
      case "curto": {
        const max = (c.limite || 280) - 24 - 1; // links no X contam como 23 caracteres
        const texto = base.length > max ? base.slice(0, max - 1).trimEnd() + "…" : base;
        return `${texto}\n${link}`;
      }
      default:
        return base;
    }
  }

  /* ---------- Seletores (select nativo: no celular abre o menu do sistema) ---------- */
  const textoPublico = () => (estado.publico === "todos" ? "qualquer pessoa" : segmento(estado.publico).frase);
  const primeiraMaiuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function opcoesPublico() {
    const grupos = [];
    A.segmentos.forEach((s) => {
      let g = grupos.find((x) => x.nome === s.grupo);
      if (!g) grupos.push((g = { nome: s.grupo, itens: [] }));
      g.itens.push(s);
    });
    return `<option value="todos">Qualquer pessoa</option>` +
      grupos.map((g) => `<optgroup label="${esc(g.nome)}">${g.itens.map((s) => `<option value="${esc(s.id)}">${esc(s.rotulo || primeiraMaiuscula(s.frase))}</option>`).join("")}</optgroup>`).join("");
  }
  const opcoesCanal = () => A.canais.map((c) => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join("");

  function prepararSeletores() {
    ["#hero-publico", "#sel-publico"].forEach((sel) => ($(sel).innerHTML = opcoesPublico()));
    ["#hero-canal", "#sel-canal"].forEach((sel) => ($(sel).innerHTML = opcoesCanal()));
  }
  function atualizarSeletores() {
    $("#hero-publico").value = estado.publico;
    $("#hero-canal").value = estado.canal;
    $("#sel-publico").value = estado.publico;
    $("#sel-canal").value = estado.canal;
  }

  /* ---------- Temas ---------- */
  function renderTemas() {
    const usados = new Set(A.videos.map((v) => v.tema));
    const lista = A.temas.filter((t) => usados.has(t.id));
    $("#temas").innerHTML =
      `<button type="button" class="aba" data-tema="" aria-pressed="${!estado.tema}">Todos os temas</button>` +
      lista.map((t) => `<button type="button" class="aba" data-tema="${esc(t.id)}" aria-pressed="${estado.tema === t.id}">${esc(t.nome)}</button>`).join("");
  }

  /* ---------- Grade ---------- */
  function renderGrade() {
    const lista = videosVisiveis();
    const qtd = lista.length === 1 ? "1 vídeo" : `${lista.length} vídeos`;
    const praQuem = estado.publico === "todos" ? "" : ` pra ${textoPublico()}`;
    const doTema = estado.tema ? ` sobre ${tema(estado.tema).nome.toLowerCase()}` : "";
    $("#contagem").textContent = `${qtd}${praQuem}${doTema}`;
    $("#vazio").hidden = lista.length > 0;
    $("#grade").innerHTML = lista
      .map((v) => {
        const t = tema(v.tema);
        const img = thumbDoVideo(v);
        return `<li class="card">
          <button type="button" class="card-btn" data-video="${esc(v.slug)}">
            <div class="thumb${img ? " thumb-com-imagem" : ""}">
              ${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ""}
              ${img ? "" : `<span class="thumb-tema">${esc(t ? t.nome : "")}</span>`}
              <span class="thumb-pe"><span class="play" aria-hidden="true"></span><span class="thumb-dur">${esc(v.duracao)}</span></span>
            </div>
            <h2>${esc(v.titulo)}</h2>
            <p>${esc(v.objecao)}</p>
          </button>
        </li>`;
      })
      .join("");
  }

  /* ---------- Modal do vídeo ---------- */
  function abrirVideo(slug) {
    const v = A.videos.find((x) => x.slug === slug);
    if (!v) return;
    estado.aberto = v;
    $("#modal-tema").textContent = tema(v.tema)?.nome || "";
    $("#modal-titulo").textContent = v.titulo;
    $("#modal-objecao").textContent = v.objecao;
    const args = v.argumentos || [];
    $("#modal-argumentos").innerHTML = args
      .map((a) => `<li>${esc(a.texto)}${a.fonte ? ` <a href="${esc(a.fonte)}" target="_blank" rel="noopener">Fonte</a>` : ""}</li>`)
      .join("");
    $("#modal-argumentos").hidden = args.length === 0;
    const fonte = $("#link-fonte");
    fonte.href = v.fonte?.post || "#";
    fonte.parentElement.hidden = !v.fonte?.post;

    atualizarSeletores();

    renderModal();
    const m = $("#modal");
    if (!m.open) m.showModal();
    sincronizarUrl();
  }

  function renderModal() {
    const v = estado.aberto;
    if (!v) return;
    const c = canal(estado.canal);
    const formato = c.formato;
    const url = arquivoDoVideo(v, formato);
    const nomeFormato = A.formatos[formato] || formato;

    const player = $("#player");
    player.dataset.formato = formato.startsWith("9x16") ? "9x16" : formato;
    player.innerHTML = url
      ? `<video controls playsinline preload="metadata" src="${esc(url)}" ${thumbDoVideo(v) ? `poster="${esc(thumbDoVideo(v))}"` : ""}></video>`
      : `<div><p>Vídeo ainda não enviado</p><p class="player-formato">${esc(nomeFormato)}</p></div>`;

    $("#legenda").value = legenda(v, estado.publico, estado.canal);

    const guia = $("#link-guia");
    guia.href = A.config.guiaConversaUrl;
    guia.parentElement.hidden = estado.publico === "todos";

    // Uma ação principal clara por canal; o resto fica como opção secundária.
    const principal = c.id === "whatsapp"
      ? `<button type="button" class="btn btn-principal" data-acao="whatsapp">Enviar no WhatsApp</button>`
      : `<button type="button" class="btn btn-principal" data-acao="compartilhar" ${url ? "" : "disabled"}>Compartilhar o vídeo</button>`;
    $("#acao-principal").innerHTML = principal;

    const acoes = [];
    if (c.id === "whatsapp") acoes.push(`<button type="button" class="btn" data-acao="compartilhar" ${url ? "" : "disabled"}>Enviar arquivo</button>`);
    acoes.push(`<button type="button" class="btn" data-acao="copiar-legenda">Copiar mensagem</button>`);
    acoes.push(`<button type="button" class="btn" data-acao="copiar-link">Copiar link</button>`);
    acoes.push(`<button type="button" class="btn" data-acao="baixar" ${url ? "" : "disabled"}>Baixar vídeo</button>`);
    $("#acoes").innerHTML = acoes.join("");

    const notas = {
      whatsapp: "Abre o WhatsApp com a mensagem e o link do vídeo. É só escolher o contato.",
      status: "Baixe o vídeo e publique pelo app do Instagram ou do TikTok, colando a mensagem.",
      feed: "Baixe o vídeo e publique pelo app do Instagram, colando a mensagem.",
      youtube: "Baixe o vídeo na versão horizontal e use a mensagem como descrição.",
      x: "A mensagem já cabe no limite do X, com o link no final."
    };
    $("#nota-arquivo").textContent = url || c.id === "whatsapp" || c.id === "x"
      ? notas[c.id] || ""
      : `${notas[c.id] || ""} O arquivo fica disponível quando o vídeo for publicado.`;
  }

  /* ---------- Ações ---------- */
  async function copiar(texto, msg) {
    try {
      await navigator.clipboard.writeText(texto);
      aviso(msg);
    } catch {
      const t = $("#legenda");
      t.focus();
      t.select();
      aviso("Selecionei a mensagem. Copie pelo menu do celular.");
    }
  }

  async function acao(tipo) {
    const v = estado.aberto;
    const c = canal(estado.canal);
    const url = arquivoDoVideo(v, c.formato);
    const texto = $("#legenda").value;
    if (tipo === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    } else if (tipo === "copiar-legenda") {
      copiar(texto, "Mensagem copiada");
    } else if (tipo === "copiar-link") {
      copiar(linkDoVideo(v), "Link copiado");
    } else if (tipo === "baixar" && url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = `${v.slug}-${c.formato}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      aviso("Download iniciado");
    } else if (tipo === "compartilhar" && url) {
      try {
        aviso("Preparando o vídeo…");
        const blob = await (await fetch(url)).blob();
        const arquivo = new File([blob], `${v.slug}.mp4`, { type: "video/mp4" });
        if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
          await navigator.share({ files: [arquivo], text: texto });
        } else {
          aviso("Este navegador não compartilha arquivos. Use Baixar.");
        }
      } catch (e) {
        if (e && e.name === "AbortError") return;
        aviso("Não deu pra compartilhar. Tente Baixar o vídeo.");
      }
    }
  }

  let timerAviso;
  function aviso(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("visivel");
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => t.classList.remove("visivel"), 2400);
  }

  /* ---------- URL compartilhável do estado ---------- */
  function sincronizarUrl() {
    try {
      const u = new URL(location.href);
      const p = u.searchParams;
      estado.publico !== "todos" ? p.set("publico", estado.publico) : p.delete("publico");
      estado.canal !== "whatsapp" ? p.set("canal", estado.canal) : p.delete("canal");
      estado.tema ? p.set("tema", estado.tema) : p.delete("tema");
      estado.aberto ? p.set("v", estado.aberto.slug) : p.delete("v");
      history.replaceState(null, "", u);
    } catch { /* ambientes sem history: segue sem sincronizar */ }
  }
  function lerUrl() {
    const p = new URLSearchParams(location.search);
    if (p.get("publico") && segmento(p.get("publico"))) estado.publico = p.get("publico");
    if (p.get("canal") && canal(p.get("canal"))) estado.canal = p.get("canal");
    if (p.get("tema") && tema(p.get("tema"))) estado.tema = p.get("tema");
    return p.get("v");
  }

  function renderTudo() {
    atualizarSeletores();
    renderTemas();
    renderGrade();
    sincronizarUrl();
  }

  /* ---------- Eventos ---------- */
  function ligarEventos() {
    document.addEventListener("click", (e) => {
      const chipTema = e.target.closest("[data-tema]");
      if (chipTema) {
        estado.tema = chipTema.dataset.tema || null;
        return renderTudo();
      }

      const card = e.target.closest("[data-video]");
      if (card) return abrirVideo(card.dataset.video);

      const btn = e.target.closest("[data-acao]");
      if (btn && !btn.disabled) return acao(btn.dataset.acao);

      if (e.target.id === "limpar") {
        estado.publico = "todos";
        estado.tema = null;
        return renderTudo();
      }
    });

    ["#hero-publico", "#sel-publico"].forEach((sel) => $(sel).addEventListener("change", (e) => {
      estado.publico = e.target.value;
      renderModal();
      renderTudo();
    }));
    ["#hero-canal", "#sel-canal"].forEach((sel) => $(sel).addEventListener("change", (e) => {
      estado.canal = e.target.value;
      renderModal();
      renderTudo();
    }));
    $("#modal").addEventListener("close", () => {
      estado.aberto = null;
      $("#player").innerHTML = "";
      sincronizarUrl();
    });
    // Fechar ao tocar fora do conteúdo
    ["#modal"].forEach((sel) => {
      $(sel).addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
    });
  }

  /* ---------- Início ---------- */
  carregar()
    .then((dados) => {
      A = dados;
      document.querySelectorAll("[data-nome]").forEach((el) => (el.textContent = A.config.nome));
      document.title = A.config.nome;
      const videoInicial = lerUrl();
      prepararSeletores();
      ligarEventos();
      renderTudo();
      if (videoInicial) abrirVideo(videoInicial);
    })
    .catch((err) => {
      $("#grade").innerHTML = "";
      $("#contagem").textContent = "Não foi possível carregar os vídeos. Recarregue a página.";
      console.error(err);
    });
})();
