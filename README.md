# Catálogo de Produtos MAX GEAR

## Descrição

O Catálogo de Produtos MAX GEAR é uma aplicação web desenvolvida para gerenciamento e visualização de inventário de produtos. Este sistema oferece:

- Visualização organizada de produtos com filtros e ordenação
- Busca rápida por código ou descrição
- Filtro para mostrar apenas produtos não bloqueados
- Exportação de dados para CSV e Excel
- Interface responsiva que se adapta a diferentes tamanhos de tela
- Atualização automática dos dados com cache local

## Tecnologias Utilizadas

- **Frontend**:
  - HTML5, CSS3, JavaScript
  - Bibliotecas:
    - [PapaParse](https://www.papaparse.com/) - para manipulação de CSV
    - [SheetJS](https://sheetjs.com/) - para exportação em Excel
    - [Font Awesome](https://fontawesome.com/) - ícones
    - [Animate.css](https://animate.style/) - animações

## Funcionalidades Principais

1. **Sistema de Busca Avançada**:
   - Busca por código ou descrição do produto
   - Filtro para mostrar apenas itens não bloqueados

2. **Visualização de Dados**:
   - Tabela responsiva com paginação
   - Ordenação por qualquer coluna
   - Destaque para produtos bloqueados
   - Seleção de linhas para melhor visualização

3. **Exportação de Dados**:
   - Exportar para CSV
   - Exportar para Excel (XLSX)

4. **Atualização Automática**:
   - Cache local com validade de 30 minutos
   - Opção de atualização manual
   - Modo offline com dados cacheados

5. **Interface Responsiva**:
   - Adaptável para desktop, tablet e mobile
   - Design moderno com tema escuro
   - Animações e transições suaves

## Como Utilizar

1. Acesse a aplicação no navegador
2. Utilize o campo de busca para encontrar produtos específicos
3. Clique nos cabeçalhos da tabela para ordenar os resultados
4. Use o botão de filtro para mostrar apenas produtos não bloqueados
5. Exporte os dados conforme necessário usando os botões na parte superior

## Configuração

Para implementar sua própria versão:

1. Substitua a URL_CSV no arquivo `script.js` pelo link do seu Google Sheets
2. Personalize as cores e estilos no arquivo `styles.css` conforme necessário
3. Adicione seu logo no arquivo `logo.png`

## Requisitos

Navegadores modernos com suporte a:
- ES6 JavaScript
- CSS Flexbox/Grid
- LocalStorage API

## Autor

Desenvolvido por **Deivid Castro**  
[LinkedIn](https://www.linkedin.com/in/deividfcastro/)

## Versão

Atual: **v1.3.0**

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
