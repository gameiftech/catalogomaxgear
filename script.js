const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmEezXjOHCJjTEzp30PF3SjBg_1lJ0yYsYOyAftIQPCD2UE2MQmsRH5nhc3ti5cOR8Vg1z8urkbuDE/pub?output=csv";
const CACHE_KEY = "dadosProdutos_v1.2";
const CACHE_EXPIRATION = 30 * 60 * 1000; // 30 minutos em milissegundos

// Elementos DOM
const inputBusca = document.getElementById("busca");
const tabela = document.getElementById("tabela-produtos");
const totalItens = document.getElementById("total-itens");
const totalBloqueados = document.getElementById("total-bloqueados");
const ultimaAtualizacao = document.getElementById("ultima-atualizacao");
const btnLimpar = document.getElementById("btn-limpar");
const btnNaoBloqueados = document.getElementById("btn-nao-bloqueados");
const btnExportCSV = document.getElementById("btn-export-csv");
const btnExportExcel = document.getElementById("btn-export-excel");
const btnAtualizar = document.getElementById("btn-atualizar");
const btnAjuda = document.getElementById("btn-ajuda");
const loadingOverlay = document.getElementById("loading-overlay");
const modalAjuda = document.getElementById("modal-ajuda");
const closeModal = document.querySelector(".close-modal");
const btnAnterior = document.getElementById("btn-anterior");
const btnProximo = document.getElementById("btn-proximo");
const infoPaginacao = document.getElementById("info-paginacao");

// Variáveis globais
let produtos = [];
let produtosFiltrados = [];
let filtroAtivo = false;
let ordenacao = {
  campo: "codigo",
  direcao: "asc"
};
let paginacao = {
  paginaAtual: 1,
  itensPorPagina: 500,
  totalPaginas: 1
};

// Mostrar loading com animação
function showLoading() {
  loadingOverlay.style.display = 'flex';
  loadingOverlay.style.opacity = '0';
  setTimeout(() => {
    loadingOverlay.style.opacity = '1';
  }, 10);
}

// Esconder loading com animação
function hideLoading() {
  loadingOverlay.style.opacity = '0';
  setTimeout(() => {
    loadingOverlay.style.display = 'none';
  }, 300);
}

// Formatador de data
function formatarData(data) {
  if (!data) return "N/A";
  
  const opcoes = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  };
  
  return new Date(data).toLocaleString('pt-BR', opcoes);
}

// Verificar se o cache está válido
function isCacheValid(cacheData) {
  if (!cacheData || !cacheData.timestamp) return false;
  
  const agora = new Date().getTime();
  return (agora - cacheData.timestamp) < CACHE_EXPIRATION;
}

// Carregar dados com cache e atualização
async function carregarDados(forcarAtualizacao = false) {
  showLoading();
  
  try {
    // Verificar cache local se não forçar atualização
    if (!forcarAtualizacao && localStorage.getItem(CACHE_KEY)) {
      const cacheData = JSON.parse(localStorage.getItem(CACHE_KEY));
      
      if (isCacheValid(cacheData)) {
        produtos = cacheData.dados;
        renderizarTabela(produtos);
        ultimaAtualizacao.textContent = `Últ. atualização: ${formatarData(cacheData.timestamp)}`;
        hideLoading();
        return;
      }
    }
    
    // Buscar dados atualizados
    const resposta = await fetch(`${URL_CSV}&t=${new Date().getTime()}`);
    
    if (!resposta.ok) throw new Error("Falha ao carregar dados");
    
    const texto = await resposta.text();

    Papa.parse(texto, {
      header: true,
      skipEmptyLines: true,
      complete: (resultado) => {
        produtos = resultado.data.map(linha => ({
          codigo: linha["Código"]?.trim() || "",
          descricao: linha["Descrição"]?.trim() || "",
          tipo: linha["Tipo"]?.trim() || "",
          unidade: linha["Unidade"]?.trim() || "",
          armazem: linha["Armazém"]?.trim() || "",
          grupo: linha["Grupo"]?.trim() || "",
          bloqueio: linha["Bloqueio"]?.trim() || "",
          local: linha["Local"]?.trim() || "",
          prateleira: linha["Prateleira"]?.trim() || ""
        }));
        
        // Salvar no cache local com timestamp
        const cacheData = {
          dados: produtos,
          timestamp: new Date().getTime()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        
        renderizarTabela(produtos);
        ultimaAtualizacao.textContent = `Últ. atualização: ${formatarData(cacheData.timestamp)}`;
        hideLoading();
      },
      error: (erro) => {
        console.error("Erro ao analisar CSV:", erro);
        mostrarErro("Erro ao processar os dados. Tente novamente mais tarde.");
        hideLoading();
      }
    });
  } catch (erro) {
    console.error("Erro ao carregar CSV:", erro);
    
    // Tentar usar cache mesmo expirado se houver erro na rede
    if (localStorage.getItem(CACHE_KEY)) {
      const cacheData = JSON.parse(localStorage.getItem(CACHE_KEY));
      produtos = cacheData.dados;
      renderizarTabela(produtos);
      ultimaAtualizacao.textContent = `Últ. atualização: ${formatarData(cacheData.timestamp)} (offline)`;
      hideLoading();
      mostrarMensagem("Modo offline: dados podem estar desatualizados");
    } else {
      mostrarErro("Erro ao carregar dados. Verifique sua conexão e recarregue a página.");
      hideLoading();
    }
  }
}

// Mostrar mensagem de erro
function mostrarErro(mensagem) {
  tabela.innerHTML = `<tr><td colspan="9" class="error-message">${mensagem}</td></tr>`;
  atualizarTotais();
}

// Mostrar mensagem temporária
function mostrarMensagem(mensagem, tempo = 3000) {
  const mensagemElement = document.createElement("div");
  mensagemElement.className = "floating-message";
  mensagemElement.textContent = mensagem;
  document.body.appendChild(mensagemElement);
  
  setTimeout(() => {
    mensagemElement.classList.add("fade-out");
    setTimeout(() => {
      document.body.removeChild(mensagemElement);
    }, 500);
  }, tempo);
}

// Renderizar tabela com paginação
function renderizarTabela(lista) {
  tabela.innerHTML = "";
  
  if (lista.length === 0) {
    tabela.innerHTML = `<tr><td colspan="9">Nenhum produto encontrado</td></tr>`;
    atualizarTotais();
    atualizarPaginacao();
    return;
  }
  
  // Ordenar antes de paginar
  ordenarLista(lista);
  
  // Atualizar paginação
  paginacao.totalPaginas = Math.ceil(lista.length / paginacao.itensPorPagina);
  paginacao.paginaAtual = Math.min(paginacao.paginaAtual, paginacao.totalPaginas);
  
  // Obter itens para a página atual
  const inicio = (paginacao.paginaAtual - 1) * paginacao.itensPorPagina;
  const fim = inicio + paginacao.itensPorPagina;
  const itensPagina = lista.slice(inicio, fim);
  
  const fragment = document.createDocumentFragment();

  itensPagina.forEach(prod => {
    const tr = document.createElement("tr");
    if (prod.bloqueio.toLowerCase() === "sim") tr.classList.add("bloqueado");

    tr.innerHTML = `
      <td data-label="Código" class="compacta">${prod.codigo}</td>
      <td data-label="Descrição">${prod.descricao}</td>
      <td data-label="Tipo" class="compacta">${prod.tipo}</td>
      <td data-label="Unidade" class="compacta">${prod.unidade}</td>
      <td data-label="Armazém" class="compacta">${prod.armazem}</td>
      <td data-label="Grupo" class="compacta">${prod.grupo}</td>
      <td data-label="Bloqueio" class="compacta">${prod.bloqueio}</td>
      <td data-label="Local" class="compacta">${prod.local}</td>
      <td data-label="Prateleira" class="compacta">${prod.prateleira}</td>
    `;

    fragment.appendChild(tr);
  });

  tabela.appendChild(fragment);
  ativarSelecaoLinhas();
  atualizarTotais();
  atualizarPaginacao();
}

// Ordenar lista
function ordenarLista(lista) {
  return lista.sort((a, b) => {
    let valorA = a[ordenacao.campo]?.toString().toLowerCase() || "";
    let valorB = b[ordenacao.campo]?.toString().toLowerCase() || "";
    
    // Tratamento especial para campos numéricos
    if (ordenacao.campo === "codigo") {
      valorA = valorA.replace(/\D/g, '');
      valorB = valorB.replace(/\D/g, '');
      return ordenacao.direcao === "asc" 
        ? parseInt(valorA || 0) - parseInt(valorB || 0)
        : parseInt(valorB || 0) - parseInt(valorA || 0);
    }
    
    if (ordenacao.direcao === "asc") {
      return valorA.localeCompare(valorB);
    } else {
      return valorB.localeCompare(valorA);
    }
  });
}

// Atualizar controles de paginação
function atualizarPaginacao() {
  btnAnterior.disabled = paginacao.paginaAtual <= 1;
  btnProximo.disabled = paginacao.paginaAtual >= paginacao.totalPaginas;
  infoPaginacao.textContent = `Página ${paginacao.paginaAtual} de ${paginacao.totalPaginas}`;
}

// Atualizar totais
// Substitua a função atualizarTotais() por esta versão corrigida:
function atualizarTotais() {
  // Usa produtosFiltrados se houver filtro, senão usa todos os produtos
  const listaAtual = produtosFiltrados.length > 0 ? produtosFiltrados : produtos;
  
  const totalItensVisiveis = listaAtual.length;
  const totalBloqueadosVisiveis = listaAtual.filter(prod => 
    prod.bloqueio.toLowerCase() === "sim"
  ).length;

  totalItens.textContent = `${totalItensVisiveis} itens`;
  totalBloqueados.textContent = `${totalBloqueadosVisiveis} bloqueados`;
}

// Ativar seleção de linhas
function ativarSelecaoLinhas() {
  const linhas = tabela.querySelectorAll("tr");
  linhas.forEach(linha => {
    linha.addEventListener("click", () => {
      linhas.forEach(l => l.classList.remove("selecionada"));
      linha.classList.add("selecionada");
      
      // Scroll para garantir que a linha selecionada esteja visível
      linha.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
}

// Aplicar filtro de busca
function aplicarFiltro() {
  const termo = inputBusca.value.toLowerCase();
  
  if (!termo) {
    produtosFiltrados = [];
    renderizarTabela(produtos);
    return;
  }
  
  produtosFiltrados = produtos.filter(prod => {
    const codigo = prod.codigo?.toLowerCase() || "";
    const descricao = prod.descricao?.toLowerCase() || "";
    return codigo.includes(termo) || descricao.includes(termo);
  });
  
  // Resetar para a primeira página ao filtrar
  paginacao.paginaAtual = 1;
  renderizarTabela(produtosFiltrados);
}

// Filtrar apenas não bloqueados
function filtrarNaoBloqueados() {
  filtroAtivo = !filtroAtivo;
  
  if (filtroAtivo) {
    btnNaoBloqueados.classList.add("active");
    btnNaoBloqueados.innerHTML = '<i class="fas fa-times"></i>';
    btnNaoBloqueados.title = "Remover filtro";
    
    const lista = produtosFiltrados.length > 0 ? produtosFiltrados : produtos;
    produtosFiltrados = lista.filter(prod => prod.bloqueio.toLowerCase() !== "sim");
  } else {
    btnNaoBloqueados.classList.remove("active");
    btnNaoBloqueados.innerHTML = '<i class="fas fa-filter"></i>';
    btnNaoBloqueados.title = "Mostrar apenas não bloqueados";
    
    // Manter o filtro de busca se houver termo
    if (inputBusca.value) {
      aplicarFiltro();
      return;
    }
    
    produtosFiltrados = [];
  }
  
  // Resetar para a primeira página ao filtrar
  paginacao.paginaAtual = 1;
  renderizarTabela(produtosFiltrados);
}

// Limpar busca
function limparBusca() {
  inputBusca.value = "";
  produtosFiltrados = [];
  renderizarTabela(produtos);
  
  // Se o filtro de bloqueio estiver ativo, reaplicar
  if (filtroAtivo) {
    filtrarNaoBloqueados();
  }
}

// Exportar para CSV
function exportarParaCSV() {
  let dadosExportar = produtosFiltrados.length > 0 ? produtosFiltrados : produtos;
  
  const csv = Papa.unparse(dadosExportar, {
    columns: ["codigo", "descricao", "tipo", "unidade", "armazem", "grupo", "bloqueio", "local", "prateleira"],
    header: true
  });
  
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `catalogo_produtos_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  mostrarMensagem("Exportação para CSV concluída!");
}

// Exportar para Excel
function exportarParaExcel() {
  let dadosExportar = produtosFiltrados.length > 0 ? produtosFiltrados : produtos;
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dadosExportar);
  XLSX.utils.book_append_sheet(wb, ws, "Catálogo de Produtos");
  XLSX.writeFile(wb, `catalogo_produtos_${new Date().toISOString().slice(0,10)}.xlsx`);
  
  mostrarMensagem("Exportação para Excel concluída!");
}

// Ordenar tabela por coluna
function ordenarPor(coluna) {
  if (ordenacao.campo === coluna) {
    ordenacao.direcao = ordenacao.direcao === "asc" ? "desc" : "asc";
  } else {
    ordenacao.campo = coluna;
    ordenacao.direcao = "asc";
  }
  
 // Atualizar classes de ordenação
  document.querySelectorAll(".sortable").forEach(header => {
    header.classList.remove("sorted-asc", "sorted-desc");
  });
  
  const header = document.querySelector(`th[data-sort="${coluna}"]`);
  if (header) {
    header.classList.add(`sorted-${ordenacao.direcao}`);
    const icon = header.querySelector("i");
    if (icon) {
      icon.className = `fas fa-sort-${ordenacao.direcao === "asc" ? "up" : "down"}`;
    }
  }
  
  renderizarTabela(produtosFiltrados.length > 0 ? produtosFiltrados : produtos);
}

// Mostrar modal de ajuda
function mostrarAjuda() {
  modalAjuda.style.display = "block";
  document.body.style.overflow = "hidden";
}

// Fechar modal
function fecharModal() {
  modalAjuda.style.display = "none";
  document.body.style.overflow = "auto";
}

// Event Listeners
inputBusca.addEventListener("input", aplicarFiltro);
btnLimpar.addEventListener("click", limparBusca);
btnNaoBloqueados.addEventListener("click", filtrarNaoBloqueados);
btnExportCSV.addEventListener("click", exportarParaCSV);
btnExportExcel.addEventListener("click", exportarParaExcel);
btnAtualizar.addEventListener("click", () => carregarDados(true));
btnAjuda.addEventListener("click", mostrarAjuda);
closeModal.addEventListener("click", fecharModal);
btnAnterior.addEventListener("click", () => {
  if (paginacao.paginaAtual > 1) {
    paginacao.paginaAtual--;
    renderizarTabela(produtosFiltrados.length > 0 ? produtosFiltrados : produtos);
  }
});
btnProximo.addEventListener("click", () => {
  if (paginacao.paginaAtual < paginacao.totalPaginas) {
    paginacao.paginaAtual++;
    renderizarTabela(produtosFiltrados.length > 0 ? produtosFiltrados : produtos);
  }
});

// Fechar modal ao clicar fora
window.addEventListener("click", (event) => {
  if (event.target === modalAjuda) {
    fecharModal();
  }
});

// Ordenação por clique no cabeçalho
document.querySelectorAll(".sortable").forEach(header => {
  header.addEventListener("click", () => {
    const coluna = header.getAttribute("data-sort");
    ordenarPor(coluna);
  });
});

// Iniciar
document.addEventListener('DOMContentLoaded', () => {
  carregarDados();
  
  // Configurar tooltips
  document.querySelectorAll('[title]').forEach(el => {
    el.setAttribute('tooltip', el.title);
    el.removeAttribute('title');
  });
});

// Adicionar debounce à busca
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Modificar o event listener
inputBusca.addEventListener("input", debounce(aplicarFiltro, 300));