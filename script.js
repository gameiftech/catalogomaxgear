const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmEezXjOHCJjTEzp30PF3SjBg_1lJ0yYsYOyAftIQPCD2UE2MQmsRH5nhc3ti5cOR8Vg1z8urkbuDE/pub?output=csv";

const inputBusca = document.getElementById("busca");
const tabela = document.getElementById("tabela-produtos");
const totalItens = document.getElementById("total-itens");
const totalBloqueados = document.getElementById("total-bloqueados");

let produtos = [];

async function carregarDados() {
  tabela.innerHTML = "<tr><td colspan='9'>Carregando Dados...</td></tr>";

  try {
    if (sessionStorage.getItem("dadosProdutos")) {
      produtos = JSON.parse(sessionStorage.getItem("dadosProdutos"));
    } else {
      const resposta = await fetch(URL_CSV);
      const texto = await resposta.text();

      const resultado = Papa.parse(texto, {
        header: true,
        skipEmptyLines: true
      });

      produtos = resultado.data.map(linha => ({
        codigo: linha["Código"] || "",
        descricao: linha["Descrição"] || "",
        tipo: linha["Tipo"] || "",
        unidade: linha["Unidade"] || "",
        armazem: linha["Armazém"] || "",
        grupo: linha["Grupo"] || "",
        bloqueio: linha["Bloqueio"] || "",
        local: linha["Local"] || "",
        prateleira: linha["Prateleira"] || ""
      }));

      sessionStorage.setItem("dadosProdutos", JSON.stringify(produtos));
    }

    renderizarTabela(produtos);
  } catch (erro) {
    tabela.innerHTML = "<tr><td colspan='9'>Erro ao carregar dados.</td></tr>";
    console.error("Erro ao carregar CSV:", erro);
  }
}

function renderizarTabela(lista) {
  tabela.innerHTML = "";
  const fragment = document.createDocumentFragment();

  lista.forEach(prod => {
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
}

function atualizarTotais() {
  const linhasVisiveis = tabela.querySelectorAll("tr:not([style*='display: none'])");
  let bloqueados = 0;

  linhasVisiveis.forEach(linha => {
    if (linha.classList.contains("bloqueado")) bloqueados++;
  });

  totalItens.innerText = `Total de itens: ${linhasVisiveis.length}`;
  totalBloqueados.innerText = `Itens bloqueados: ${bloqueados}`;
}

function ativarSelecaoLinhas() {
  const linhas = tabela.querySelectorAll("tr");
  linhas.forEach(linha => {
    linha.addEventListener("click", () => {
      linhas.forEach(l => l.classList.remove("selecionada"));
      linha.classList.add("selecionada");
    });
  });
}

function aplicarFiltro() {
  const termo = inputBusca.value.toLowerCase();
  const linhas = tabela.querySelectorAll("tr");

  linhas.forEach(linha => {
    const codigo = linha.cells[0]?.textContent.toLowerCase() || "";
    const descricao = linha.cells[1]?.textContent.toLowerCase() || "";
    const visivel = codigo.includes(termo) || descricao.includes(termo);
    linha.style.display = visivel ? "" : "none";
  });

  atualizarTotais();
}

inputBusca.addEventListener("input", aplicarFiltro);
carregarDados();
