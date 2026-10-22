/* ====== CONFIGURAÇÃO DO SITE (troque aqui os dados do cliente) ====== */
const CONFIG = {
  // WhatsApp com DDI + DDD + número (só números)
  whatsapp: "5531996218382",
  // Link CSV da planilha Google (Arquivo > Compartilhar > Publicar na web > CSV).
  // As colunas são lidas pelo NOME no cabeçalho (a ordem não importa):
  // nome, descricao, preco, imagem, categoria, preco_promocional, disponivel, destaque
  // Deixe vazio para usar os produtos abaixo.
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPgR8gTWLzPPlNFaJOj3YnvWEGcP01-KPBhRySgC1MC4WZvURMbTVQQjQpv7wseMEp7sFz1HPcO-3d/pub?output=csv",
  // De quanto em quanto tempo o site relê a planilha (em segundos). 0 = só ao abrir a página.
  atualizarACada: 120,
  // Lista padrão de produtos (usada se não houver planilha). As fotos ficam na pasta img/
  produtos: [
    // alt = texto que descreve a foto (leitores de tela e Google leem isso; aparece se a imagem não carregar)
    { imagem: "img/produto-1.webp", alt: "Capinha transparente reforçada em um celular", nome: "Capinha Transparente Reforçada", desc: "Não amarela e protege os cantos contra quedas.", preco: 29.9, categoria: "Capinhas", promo: 24.9, destaque: true },
    { imagem: "img/pelicula.webp", alt: "Película de privacidade aplicada na tela do celular", nome: "Película Privacidade", desc: "Só quem está de frente enxerga a tela.", preco: 34.9, categoria: "Películas" },
    { imagem: "img/produto-3.webp", alt: "Carregador de parede com saída USB-C e USB-A", nome: "Carregador Duplo USB-C + USB-A", desc: "Carrega dois aparelhos ao mesmo tempo, 30W.", preco: 69.9, categoria: "Carregadores", destaque: true },
    { imagem: "img/produto-4.webp", alt: "Cabo magnético 3 em 1 com pontas Lightning, USB-C e micro USB", nome: "Cabo Magnético 3 em 1", desc: "Pontas Lightning, USB-C e micro USB em um cabo só.", preco: 39.9, categoria: "Cabos" },
    { imagem: "img/fone.webp", alt: "Fone de ouvido sem fio com a case de recarga", nome: "Fone Sem Fio com Case", desc: "Bluetooth 5.3, toque inteligente e case que recarrega.", preco: 119.9, categoria: "Fones", promo: 99.9 },
    { imagem: "img/inducao.webp", alt: "Base de carregamento por indução com um celular em cima", nome: "Carregador por Indução", desc: "Base sem fio de 15W com luz de status.", preco: 79.9, categoria: "Carregadores" },
    { imagem: "img/produto-7.webp", alt: "Suporte de mesa dobrável segurando um celular", nome: "Suporte de Mesa Dobrável", desc: "Ajusta o ângulo e cabe na mochila.", preco: 27.9, categoria: "Suportes" },
    { imagem: "img/produto-8.webp", alt: "Pulseira de silicone para smartwatch", nome: "Pulseira para Smartwatch", desc: "Silicone macio, várias cores, instalação sem ferramenta.", preco: 24.9, categoria: "Outros" }
  ]
};

/* ====== FUNÇÕES AUXILIARES ====== */
// Atalhos para buscar elementos na página
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
// Formata número como moeda brasileira (R$ 49,90)
const brl = n => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
// Monta o link do WhatsApp com mensagem pronta
const zapLink = msg => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
// Protege o texto vindo da planilha (aspas e < > não quebram a página)
const esc = t => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Tira acento e deixa minúsculo (para comparar nomes de coluna e fazer a busca)
const limpar = t => String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
// Lê o preço digitado na planilha: aceita "59,90", "R$ 59,90", "1.299,90" e "59.90"
function lerPreco(t) {
  let s = String(t ?? "").replace(/[^\d,.-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); // formato brasileiro
  return parseFloat(s);
}
// Lê um "sim/não" da planilha (vazio usa o valor padrão)
function lerSimNao(t, padrao) {
  const v = limpar(t);
  if (!v) return padrao;
  return !["nao", "n", "0", "false", "esgotado", "nao tem"].includes(v);
}

/* ====== BOTÕES DE ZAP: todo elemento com data-zap recebe o link ====== */
function ligarZaps() {
  $$("[data-zap]").forEach(a => {
    a.href = zapLink(a.dataset.zap || "Olá! Vim pelo site e quero saber mais.");
    a.target = "_blank";
    a.rel = "noopener";
  });
}

/* ====== PREÇOS: lê a planilha Google (CSV publicado) ou usa a lista padrão ====== */
// Converte o texto do CSV em uma lista de linhas (cada linha é uma lista de colunas).
// Aceita campos entre aspas, vírgula dentro do campo e até Enter dentro do campo.
function csvParaLinhas(txt) {
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (aspas) {
      if (c === '"') {
        if (txt[i + 1] === '"') { campo += '"'; i++; } // aspas duplas viram uma aspa
        else aspas = false;                            // fim do campo entre aspas
      } else campo += c;
    } else if (c === '"') aspas = true;                // começo do campo entre aspas
    else if (c === ",") { linha.push(campo); campo = ""; } // próxima coluna
    else if (c === "\n" || c === "\r") {                  // fim da linha
      if (c === "\r" && txt[i + 1] === "\n") i++;
      linha.push(campo); campo = "";
      linhas.push(linha); linha = [];
    } else campo += c;
  }
  linha.push(campo); linhas.push(linha);
  return linhas.filter(l => l.some(c => c.trim() !== "")); // ignora linhas totalmente vazias
}
// Padroniza um produto (da planilha ou do CONFIG) no mesmo formato
function normalizar(p) {
  const preco = Number(p.preco);
  const promo = Number(p.promo);
  return {
    imagem: p.imagem || "",
    alt: p.alt || p.nome || "",                      // texto da foto (se não tiver, usa o nome do produto)
    nome: p.nome || "",
    desc: p.desc || "",
    categoria: p.categoria || "",
    preco,
    promo: promo > 0 && promo < preco ? promo : 0,   // promoção só vale se for menor que o preço normal
    disponivel: p.disponivel !== false,
    destaque: p.destaque === true
  };
}
// Busca a planilha e devolve a lista de produtos. Se algo der errado, lança um erro.
async function carregarPrecos() {
  if (!CONFIG.sheetCsvUrl) return CONFIG.produtos.map(normalizar); // sem planilha: usa os preços do CONFIG
  // Se a planilha não responder em 5 segundos, cancela (o site não fica esperando para sempre)
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 5000);
  try {
    // O "t=" com a hora evita que o navegador/Google devolvam uma cópia antiga
    const url = CONFIG.sheetCsvUrl + (CONFIG.sheetCsvUrl.includes("?") ? "&" : "?") + "t=" + Date.now();
    const r = await fetch(url, { cache: "no-store", signal: controle.signal });
    if (!r.ok) throw new Error("planilha indisponível");
    const texto = (await r.text()).trim();
    if (texto.startsWith("<")) throw new Error("planilha não publicada como CSV"); // veio uma página HTML
    const linhas = csvParaLinhas(texto);
    if (linhas.length < 2) throw new Error("planilha vazia");
    // Descobre qual coluna é qual pelo nome do cabeçalho (preco_promocional e "Preço Promocional" dão no mesmo)
    const cab = linhas.shift().map(t => limpar(t).replace(/\s+/g, "_"));
    const col = nome => cab.indexOf(nome);
    if (col("nome") < 0) throw new Error("coluna 'nome' não encontrada");
    const c = {
      nome: col("nome"), desc: col("descricao"), preco: col("preco"), imagem: col("imagem"),
      categoria: col("categoria"), promo: col("preco_promocional"),
      disponivel: col("disponivel"), destaque: col("destaque")
    };
    const lista = linhas.map(x => {
      // Pega o valor da coluna pelo nome (vazio se a coluna não existir)
      const pega = k => (c[k] >= 0 ? String(x[c[k]] ?? "").trim() : "");
      const nome = pega("nome");
      // Produto padrão com o MESMO NOME (reserva de foto, texto da foto e preço). Pelo nome, e não pela posição, para nunca misturar produtos
      const base = CONFIG.produtos.find(p => limpar(p.nome) === limpar(nome)) || {};
      const valor = lerPreco(pega("preco"));
      return normalizar({
        imagem: pega("imagem") || base.imagem,
        alt: base.alt,
        nome,
        desc: pega("desc") || base.desc,
        categoria: pega("categoria") || base.categoria,
        preco: isNaN(valor) ? base.preco : valor,
        promo: lerPreco(pega("promo")),
        disponivel: lerSimNao(pega("disponivel"), true),
        destaque: lerSimNao(pega("destaque"), false)
      });
    }).filter(p => p.nome && !isNaN(p.preco));
    if (!lista.length) throw new Error("nenhum produto válido");
    return lista;
  } finally {
    clearTimeout(limite); // desliga o cronômetro de 5 segundos
  }
}

/* ====== LISTA DE PRODUTOS: filtros, busca e atualização ====== */
const estado = { lista: [], categoria: "Todos", texto: "" };   // o que está na tela agora
let assinatura = "";                                            // "foto" da lista atual, para saber se a planilha mudou

// Cria as bolinhas de categoria (Todos + as categorias da planilha)
function desenharFiltros() {
  const box = $("#filtros");
  const cats = [...new Set(estado.lista.map(p => p.categoria).filter(Boolean))];
  if (!cats.includes(estado.categoria)) estado.categoria = "Todos"; // categoria sumiu da planilha
  box.hidden = cats.length < 2;                                     // sem categorias: esconde os filtros
  box.innerHTML = ["Todos", ...cats].map(c =>
    `<button class="filtro${c === estado.categoria ? " ativo" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
}
// Cria a lista de produtos (uma linha por produto, estilo tabela de preços).
// "jaVisivel" = true nas atualizações, para os cards não sumirem e reaparecerem com a animação
function desenharProdutos(jaVisivel = false) {
  // Destaques primeiro e esgotados por último (mantém a ordem da planilha dentro de cada grupo)
  const ordem = p => (p.disponivel ? (p.destaque ? 0 : 1) : 2);
  const lista = [...estado.lista].sort((a, b) => ordem(a) - ordem(b));
  $("#produtos-grid").innerHTML = lista.map((p, i) => {
    const precoFinal = p.promo || p.preco;
    // Etiquetas: oferta, destaque ou esgotado
    const selo = !p.disponivel ? `<span class="tag tag-esgotado">Esgotado</span>`
      : p.promo ? `<span class="tag tag-oferta">-${Math.round((1 - p.promo / p.preco) * 100)}%</span>`
      : p.destaque ? `<span class="tag tag-destaque">Destaque</span>` : "";
    // Preço: se tem promoção, mostra o antigo riscado
    const precoHtml = p.promo
      ? `<strong class="preco"><s>${brl(p.preco)}</s>${brl(p.promo)}</strong>`
      : `<strong class="preco">${brl(p.preco)}</strong>`;
    // Botão: esgotado vira "Avisar no Zap"
    const botao = p.disponivel
      ? `<a class="btn btn-mini" data-zap="${esc(`Olá! Quero comprar: ${p.nome} (${brl(precoFinal)})`)}">Pedir no Zap</a>`
      : `<a class="btn btn-mini btn-contorno" data-zap="${esc(`Olá! Quando chega: ${p.nome}?`)}">Avisar no Zap</a>`;
    return `
    <article class="item reveal${jaVisivel ? " visivel" : ""}${p.disponivel ? "" : " esgotado"}" style="--d:${(i % 4) * 70}ms" data-cat="${esc(p.categoria)}">
      <!-- Foto do produto: o alt vem do campo "alt" do produto. Se a imagem não carregar, mostra um fundo colorido -->
      <div class="item-foto"><img src="${esc(p.imagem)}" alt="${esc(p.alt)}" loading="lazy" onerror="this.remove()"></div>
      <div class="item-info">
        <h3>${esc(p.nome)} ${selo}</h3>
        <p>${esc(p.desc)}</p>
      </div>
      ${precoHtml}
      ${botao}
    </article>`;
  }).join("");
  ligarZaps();
  aplicarFiltros();
  iniciarReveal();
}
// Esconde os produtos que não batem com a categoria escolhida e com o texto da busca.
// Nos que ficam visíveis, marca de 2 em 2 com a classe "inverso" (texto de um lado e foto do outro, alternando)
function aplicarFiltros() {
  let visiveis = 0;
  $$(".item").forEach(el => {
    const okCat = estado.categoria === "Todos" || el.dataset.cat === estado.categoria;
    const okTxt = limpar(el.textContent).includes(estado.texto);
    el.hidden = !(okCat && okTxt);
    if (!el.hidden) {
      el.classList.toggle("inverso", visiveis % 2 === 1); // 1º normal, 2º inverso, 3º normal...
      visiveis++;
    }
  });
  $("#busca-vazio").hidden = visiveis > 0; // mostra o aviso se nada foi encontrado
}
// Liga a busca e os cliques nas categorias (roda uma vez só)
function iniciarFiltros() {
  $("#busca").addEventListener("input", e => {
    estado.texto = limpar(e.target.value);
    aplicarFiltros();
  });
  $("#filtros").addEventListener("click", e => {
    const b = e.target.closest(".filtro");
    if (!b) return;
    estado.categoria = b.dataset.cat;
    $$(".filtro").forEach(f => f.classList.toggle("ativo", f === b));
    aplicarFiltros();
  });
}
// Relê a planilha e atualiza a tela sem recarregar a página (só redesenha se algo mudou)
async function atualizarLista() {
  let nova;
  try {
    nova = await carregarPrecos();
  } catch (e) {
    if (assinatura) return;                       // falhou numa atualização: mantém o que já está na tela
    nova = CONFIG.produtos.map(normalizar);       // falhou na 1ª vez: mostra a lista padrão do CONFIG
  }
  const a = JSON.stringify(nova);
  if (a === assinatura) return;                   // nada mudou: não mexe na tela
  const primeira = assinatura === "";
  assinatura = a;
  estado.lista = nova;
  desenharFiltros();
  desenharProdutos(!primeira);
}

/* ====== CARROSSEL DO HERO (desliza de lado, com contador e barra de tempo) ====== */
function iniciarCarrossel() {
  const slides = $$(".slide");
  const dots = $("#dots"), contador = $("#contador"), barra = $("#barra");
  const TEMPO = 5500; // tempo de cada slide (precisa ser igual ao da animação no CSS)
  let atual = 0, timer;
  // Cria uma bolinha para cada slide
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", `Slide ${i + 1}`);
    b.addEventListener("click", () => { ir(i); reiniciar(); });
    dots.appendChild(b);
  });
  function ir(n) {
    const anterior = atual;
    atual = (n + slides.length) % slides.length;
    slides.forEach((s, i) => {
      s.classList.toggle("saindo", i === anterior && anterior !== atual); // o que sai vai para a esquerda
      s.classList.toggle("ativo", i === atual);                            // o que entra vem da direita
    });
    $$("#dots button").forEach((b, i) => b.classList.toggle("ativo", i === atual));
    contador.textContent = `${String(atual + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    // Reinicia a barra de progresso
    barra.classList.remove("rodando"); void barra.offsetWidth; barra.classList.add("rodando");
  }
  function reiniciar() { clearInterval(timer); timer = setInterval(() => ir(atual + 1), TEMPO); }
  $("#prev").addEventListener("click", () => { ir(atual - 1); reiniciar(); });
  $("#next").addEventListener("click", () => { ir(atual + 1); reiniciar(); });
  ir(0); reiniciar();
}

/* ====== ANIMAÇÕES AO ROLAR (revela cada seção, menos o mapa) ====== */
let io; // observador (criado uma vez e reaproveitado quando a lista é redesenhada)
function iniciarReveal() {
  // Se o navegador não tiver IntersectionObserver, mostra tudo direto (senão ficaria invisível)
  if (!("IntersectionObserver" in window)) {
    $$(".reveal").forEach(el => { el.classList.add("visivel"); $$("[data-count]", el).forEach(contar); if (el.hasAttribute("data-count")) contar(el); });
    return;
  }
  io = io || new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("visivel");
      // Se o elemento tem contador, anima o número
      $$("[data-count]", e.target).forEach(contar);
      if (e.target.hasAttribute("data-count")) contar(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  $$(".reveal:not(.visivel)").forEach(el => io.observe(el));
}
// Anima um número de 0 até o valor final
function contar(el) {
  if (el.dataset.feito) return;
  el.dataset.feito = 1;
  const fim = +el.dataset.count, dur = 1600, ini = performance.now();
  (function passo(t) {
    const p = Math.min((t - ini) / dur, 1);
    el.textContent = Math.round(fim * (1 - Math.pow(1 - p, 3))).toLocaleString("pt-BR");
    if (p < 1) requestAnimationFrame(passo);
  })(ini);
}

/* ====== CABEÇALHO, MENU MOBILE E VOLTAR AO TOPO ====== */
function iniciarInterface() {
  const header = $("#header"), topo = $("#topo");
  addEventListener("scroll", () => {
    header.classList.toggle("compacto", scrollY > 60);       // encolhe o cabeçalho
    topo.classList.toggle("mostrar", scrollY > 500);          // mostra o botão de topo
  }, { passive: true });
  topo.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  const menu = $("#menu-btn"), nav = $("#nav");
  menu.addEventListener("click", () => {
    const aberto = nav.classList.toggle("aberto");
    menu.setAttribute("aria-expanded", aberto);
  });
  $$("#nav a").forEach(a => a.addEventListener("click", () => nav.classList.remove("aberto")));
  $("#ano").textContent = new Date().getFullYear();
}

/* ====== INÍCIO ====== */
(async function () {
  // 1º: liga o que não depende da planilha (menu, carrossel, busca, animações do resto da página)
  iniciarInterface();
  iniciarCarrossel();
  iniciarFiltros();
  ligarZaps();
  iniciarReveal();
  // Enquanto a planilha carrega, mostra um aviso no lugar da lista
  $("#produtos-grid").innerHTML = '<p class="vazio">Carregando produtos...</p>';
  // 2º: carrega os produtos (planilha ou lista padrão)
  await atualizarLista();
  // 3º: atualiza os preços sozinho enquanto a página está aberta
  if (CONFIG.sheetCsvUrl && CONFIG.atualizarACada > 0) {
    setInterval(() => { if (!document.hidden) atualizarLista(); }, CONFIG.atualizarACada * 1000);
  }
})();