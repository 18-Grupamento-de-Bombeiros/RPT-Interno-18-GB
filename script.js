// ============================================================
// CONFIGURAÇÃO DA API
// ============================================================

// URL do Google Apps Script.

const API_URL =
    "https://script.google.com/macros/s/AKfycbzKFFIK-fQYKP4ue-EW2xG2AEDAphldp4yBfQBpGJfXGOgBYMvh-ifJtYpRHvjoEh6C/exec";


// ============================================================
// ANIMAÇÃO DE CARREGAMENTO
// ============================================================

const carregando = document.querySelector(".carregando");

let pontos = 0;

const animacao = setInterval(() => {

    pontos = (pontos + 1) % 4;

    carregando.textContent =
        "Carregando inscrições" + ".".repeat(pontos);

}, 400);


// ============================================================
// BUSCAR DADOS DA API
// ============================================================

// Solicita os dados das inscrições ao Google Apps Script.
fetch(API_URL)

    // Converte a resposta recebida para JSON.
    .then(response => response.json())

    // Executado quando os dados são recebidos corretamente.
    .then(dados => {

        // Encerra a animação de carregamento.
        clearInterval(animacao);

        // Exibe os dados recebidos no console do navegador.
        // Útil para testes e identificação de problemas.
        console.log("Dados recebidos:", dados);

        // Envia os dados para a função que monta o RPT.
        gerarRPT(dados);

    })

    // Executado caso ocorra algum erro durante a comunicação com a API.
    .catch(erro => {

        // Encerra a animação de carregamento.
        clearInterval(animacao);

        // Registra o erro no console.
        console.error("Erro ao carregar os dados:", erro);

        // Substitui a mensagem de carregamento por uma mensagem de erro.
        document.getElementById("resultado").innerHTML = `

            <p class="carregando">
                Erro ao carregar os dados.
            </p>

        `;

    });


// ============================================================
// GERAR O RPT
// ============================================================

// Recebe os dados da API e cria suas respectivas tabelas.
function gerarRPT(dados) {

    // Local onde todo o conteúdo do RPT será inserido.
    const resultado = document.getElementById("resultado");

    // Remove a mensagem inicial de carregamento.
    resultado.innerHTML = "";


    // ========================================================
    // AGRUPAR INSCRIÇÕES POR DESTINO
    // ========================================================

    // Separa as inscrições de acordo com o município de destino.
    const gruposPorDestino = {};


    // Percorre todas as inscrições recebidas.
    dados.forEach(inscrito => {

        // Obtém o município de destino da inscrição.
        const destino = inscrito.destino;


        // Cria um novo grupo caso esse destino
        // ainda não exista.
        if (!gruposPorDestino[destino]) {

            gruposPorDestino[destino] = [];

        }


        // Adiciona a inscrição ao respectivo destino.
        gruposPorDestino[destino].push(inscrito);

    });


    // ========================================================
    // ORDENAR DESTINOS
    // ========================================================

    // Obtém todos os destinos e os organiza
    // em ordem alfabética.
    const destinos = Object.keys(gruposPorDestino).sort();


    // ========================================================
    // CRIAR CADA DESTINO
    // ========================================================

    destinos.forEach(destino => {

        // Recupera todas as inscrições daquele destino.
        const inscritos = gruposPorDestino[destino];


        // ====================================================
        // SEPARAR POR GRADUAÇÃO
        // ====================================================

        // Divide os inscritos em:
        //
        // - Subtenentes e Sargentos
        // - Cabos e Soldados
        const gruposGraduacao = separarPorGraduacao(inscritos);


        // ====================================================
        // CONTAINER DO DESTINO
        // ====================================================

        // Cria um card que reunirá o destino e suas respectivas tabelas.
        const grupo = document.createElement("div");

        grupo.className = "grupo";


        // ====================================================
        // TÍTULO DO DESTINO
        // ====================================================

        const titulo = document.createElement("h2");

        titulo.textContent = `Destino: ${destino}`;

        grupo.appendChild(titulo);


        // ====================================================
        // SUBTENENTES E SARGENTOS
        // ====================================================

        if (gruposGraduacao.subtenentesSargentos.length > 0) {

            criarTabelaGraduacao(

                grupo,

                "Subtenentes e Sargentos",

                gruposGraduacao.subtenentesSargentos

            );

        }


        // ====================================================
        // CABOS E SOLDADOS
        // ====================================================

        if (gruposGraduacao.cabosSoldados.length > 0) {

            criarTabelaGraduacao(

                grupo,

                "Cabos e Soldados",

                gruposGraduacao.cabosSoldados

            );

        }


        // Adiciona o destino completo à página.
        resultado.appendChild(grupo);

    });


    // ========================================================
    // ATUALIZAR DATA DO SITE
    // ========================================================

    // Atualiza a informação de última atualização
    // exibida no cabeçalho da página.
    //
    // A data corresponde à data atual do computador
    // do visitante.
    document.getElementById("data-atualizacao").textContent =
        new Date().toLocaleDateString("pt-BR");

}


// ============================================================
// SEPARAR INSCRIÇÕES POR GRADUAÇÃO
// ============================================================

// Divide as inscrições de um determinado destino
// em dois grupos:
//
// 1. Subtenentes e Sargentos
// 2. Cabos e Soldados
//
// O sistema trabalha exclusivamente com as seis graduações previstas no formulário:
//
// - SubTen PM
// - 1º Sgt PM
// - 2º Sgt PM
// - 3º Sgt PM
// - Cb PM
// - Sd PM
function separarPorGraduacao(inscritos) {

    const grupos = {

        subtenentesSargentos: [],

        cabosSoldados: []

    };


    // Percorre todas as inscrições daquele destino.
    inscritos.forEach(inscrito => {

        // Normaliza a graduação para facilitar
        // a identificação.
        const graduacao = normalizarGraduacao(inscrito.graduacao);


        // ====================================================
        // SUBTENENTE E SARGENTOS
        // ====================================================

        // Identifica:
        //
        // SubTen PM
        // 1º Sgt PM
        // 2º Sgt PM
        // 3º Sgt PM
        if (

            graduacao.startsWith("SUBTEN") ||

            graduacao.includes("SGT")

        ) {

            grupos.subtenentesSargentos.push(inscrito);

            return;

        }


        // ====================================================
        // CABOS E SOLDADOS
        // ====================================================

        // Identifica:
        //
        // Cb PM
        // Sd PM
        if (

            graduacao.startsWith("CB") ||

            graduacao.startsWith("SD")

        ) {

            grupos.cabosSoldados.push(inscrito);

            return;

        }

    });


    // Retorna os dois grupos já separados.
    return grupos;

}


// ============================================================
// CRIAR TABELA DE UM GRUPO
// ============================================================

// Cria uma tabela completa para um grupo de graduação.
//
// Parâmetros:
//
// container
// → local onde a tabela será inserida
//
// tituloGrupo
// → título exibido acima da tabela
//
// inscritos
// → lista de militares daquele grupo
function criarTabelaGraduacao(container, tituloGrupo, inscritos) {


    // ========================================================
    // ORDENAR POR DATA DE INSCRIÇÃO
    // ========================================================

    // Organiza os inscritos da inscrição mais antiga
    // para a mais recente.
    //
    // Isso mantém a classificação atual do RPT.
    inscritos.sort((a, b) => {

        return converterData(a.data) - converterData(b.data);

    });


    // ========================================================
    // TÍTULO DO GRUPO
    // ========================================================

    // Cria o subtítulo da tabela.
    const subtitulo = document.createElement("h3");

    subtitulo.className = "subgrupo-titulo";

    subtitulo.textContent = tituloGrupo;

    container.appendChild(subtitulo);


    // ========================================================
    // CRIAR TABELA
    // ========================================================


    const tabela = document.createElement("table");


    // ========================================================
    // CABEÇALHO DA TABELA
    // ========================================================

    
    tabela.innerHTML = `

        <thead>

            <tr>

                <th>Class.</th>

                <th>Post/Grad</th>

                <th>RE</th>

                <th>QRA</th>

                <th>EB Atual</th>

                <th>Data de Inscrição</th>

            </tr>

        </thead>

        <tbody></tbody>

    `;


    
    const tbody = tabela.querySelector("tbody");


    // ========================================================
    // INSERIR INSCRITOS
    // ========================================================

    inscritos.forEach((inscrito, indice) => {

        // Cria uma nova linha.
        const linha = document.createElement("tr");


        // Preenche a linha com os dados do militar.
        linha.innerHTML = `

            <!-- Classificação dentro do grupo -->
            <td>${indice + 1}º</td>

            <!-- Posto ou graduação -->
            <td>${escaparHTML(inscrito.graduacao)}</td>

            <!-- RE -->
            <td>${escaparHTML(inscrito.re)}</td>

            <!-- QRA -->
            <td>${escaparHTML(inscrito.qra)}</td>

            <!-- Município/unidade de origem -->
            <td>${escaparHTML(inscrito.origem)}</td>

            <!-- Data da inscrição -->
            <td>${formatarData(inscrito.data)}</td>

        `;


        // Adiciona a linha ao corpo da tabela.
        tbody.appendChild(linha);

    });


    // Adiciona a tabela ao destino.
    container.appendChild(tabela);


    // ========================================================
    // TOTAL DE INSCRITOS
    // ========================================================

    // Cria o elemento que mostra a quantidade de inscritos naquele grupo.
    const total = document.createElement("div");

    total.className = "total-inscritos";


   
    total.innerHTML = `

        Total de inscritos:
        <strong>${inscritos.length}</strong>

    `;


    // Adiciona o total logo abaixo da tabela.
    container.appendChild(total);

}


// ============================================================
// NORMALIZAR GRADUAÇÃO
// ============================================================

// Padroniza o texto da graduação para facilitar as comparações.

function normalizarGraduacao(graduacao) {

    return String(graduacao || "")

        // Separa letras de seus acentos.
        .normalize("NFD")

        // Remove os acentos.
        .replace(/[\u0300-\u036f]/g, "")

        // Converte tudo para maiúsculas.
        .toUpperCase()

        // Remove espaços extras nas extremidades.
        .trim();

}


// ============================================================
// CONVERTER DATA PARA ORDENAÇÃO
// ============================================================

// Converte a data recebida da API:
//
// DD/MM/AAAA HH:MM:SS
//
// em um objeto Date.
//
// Isso permite ordenar corretamente as inscrições
// pela data em que foram realizadas.
function converterData(data) {

    const partes = data.split(" ")[0].split("/");

    return new Date(

        partes[2],

        partes[1] - 1,

        partes[0]

    );

}


// ============================================================
// FORMATAR DATA PARA EXIBIÇÃO
// ============================================================

// Remove o horário e mantém somente a data.

function formatarData(data) {

    return data.split(" ")[0];

}


// ============================================================
// PROTEÇÃO CONTRA HTML
// ============================================================


function escaparHTML(texto) {

    const div = document.createElement("div");

    div.textContent = texto;

    return div.innerHTML;

}
