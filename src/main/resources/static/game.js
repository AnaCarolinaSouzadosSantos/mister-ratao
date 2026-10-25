const $ = (id) => document.getElementById(id);
const canvas = $("jogo");
const ctx = canvas.getContext("2d");

const niveis = {
    facil: { nome: "Fácil", vidas: 5, meta: 10, velocidade: 105, alcance: 170 },
    medio: { nome: "Médio", vidas: 3, meta: 15, velocidade: 140, alcance: 240 },
    dificil: { nome: "Difícil", vidas: 3, meta: 20, velocidade: 175, alcance: 330 }
};

const teclas = new Set();
const bueiro = { x: 100, y: 490, raio: 38 };
let partida;
let animacao;
let ultimoTempo = 0;
let versao = 0;
const postes = [
    { x: 280, y: 235 },
    { x: 570, y: 235 },
    { x: 850, y: 235 }
];

const caixas = [
    { x: 340, y: 410 },
    { x: 740, y: 480 }
];

const cones = [
    { x: 460, y: 350 },
    { x: 810, y: 390 }
];

const pocas = [
    { x: 580, y: 460, rx: 55, ry: 20 },
    { x: 210, y: 340, rx: 40, ry: 15 }
];

let efeitos = [];
let pedras = [];

// Gera as pedras uma vez para a textura não piscar.
for (let linha = 0; linha < 19; linha++) {
    for (let coluna = 0; coluna < 30; coluna++) {
        const x = coluna * 36 + (linha % 2 ? 18 : 0);
        const y = 245 + linha * 20;
        const tom = 43 + Math.floor(Math.random() * 18);

        pedras.push({
            x,
            y,
            largura: 29 + Math.random() * 5,
            altura: 13 + Math.random() * 4,
            tom,
            inclinacao: (Math.random() - 0.5) * 0.12
        });
    }
}

function brilho(x, y, raio, cor) {
    const gradiente = ctx.createRadialGradient(
        x, y, 0,
        x, y, raio
    );

    gradiente.addColorStop(0, cor);
    gradiente.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradiente;
    ctx.beginPath();
    ctx.arc(x, y, raio, 0, Math.PI * 2);
    ctx.fill();
}
function criarEfeito(x, y, texto) {

    // Texto que sobe suavemente.
    efeitos.push({
        x,
        y,
        texto,
        vida: 1,
        vx: 0,
        vy: -35
    });

    // Oito migalhas voando em direções diferentes.
    for (let i = 0; i < 8; i++) {
        efeitos.push({
            x,
            y,
            vida: 0.7,
            vx: (Math.random() - 0.5) * 100,
            vy: -30 - Math.random() * 70
        });
    }
} 
function caixaProxima(rato) {
    return caixas.find((caixa) => distancia(rato, caixa) < 32);
}

function iluminacao(personagem) {
    let luz = 0.3;

    // Luz fria da lua sobre uma parte da rua.
    const distanciaLua = Math.hypot(
        personagem.x - 900,
        (personagem.y - 350) * 0.7
    );

    luz = Math.max(luz, 1 - distanciaLua / 230);

    // Luz dos lampiões.
    postes.forEach((poste) => {
        const distanciaPoste = Math.hypot(
            personagem.x - poste.x,
            personagem.y - 300
        );

        luz = Math.max(luz, 1 - distanciaPoste / 180);
    });

    return Math.max(0.3, Math.min(1, luz));
}

function desenharPersonagem(texto, personagem, tamanho) {
    ctx.save();
    ctx.globalAlpha = iluminacao(personagem);

    const andando = personagem === partida.rato
        ? teclas.size > 0 && !partida.escondido
        : true;

    const balanco = andando
        ? Math.sin(partida.tempo * 13) * 2
        : 0;

    ctx.translate(personagem.x, personagem.y + balanco);

    ctx.rotate(
        andando ? Math.sin(partida.tempo * 10) * 0.035 : 0
    );

    emoji(texto, 0, 0, tamanho);
    ctx.restore();
}
function distancia(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function mostrarTela(id) {
    ["tela-inicial", "tela-jogo", "tela-final"].forEach((tela) => {
        $(tela).hidden = tela !== id;
    });
}

function criarComida() {
    let comida;

    do {
        comida = {
            x: 60 + Math.random() * 880,
            y: 260 + Math.random() * 290,
            tipo: Math.random() > 0.5 ? "🧀" : "🍞"
        };
    } while (distancia(comida, bueiro) < 95);

    return comida;
}

function iniciar(nome, nivel) {
    cancelAnimationFrame(animacao);
    versao++;
    teclas.clear();
    limparControlesTouch();
    efeitos = [];

    const config = niveis[nivel];

    partida = {
        nome,
        nivel,
        config,
        ativa: true,
        vidas: config.vidas,
        pontos: 0,
        tempo: 0,
        carga: 0,
        entregues: 0,
        protecao: 0,
        esconderTempo: 0,
esconderRecarga: 0,
escondido: false,
        rato: { x: bueiro.x, y: bueiro.y },
        comidas: Array.from({ length: 8 }, criarComida),
        inimigos: [
            { x: 860, y: 320, tipo: "🐈", destino: { x: 750, y: 510 } },
            { x: 650, y: 520, tipo: "🧹", destino: { x: 420, y: 290 } }
        ]
    };

    $("hud-jogador").textContent = nome;
    $("hud-nivel").textContent = config.nome;
    $("mensagem-jogo").textContent =
        "Pegue até 3 comidas e volte ao bueiro para entregar!";

    mostrarTela("tela-jogo");
    ultimoTempo = performance.now();
    animacao = requestAnimationFrame(loop);
}

$("form-iniciar").addEventListener("submit", (evento) => {
    evento.preventDefault();
    const nome = $("nome-jogador").value.trim();

    if (!nome) {
        $("nome-jogador").focus();
        return;
    }

    iniciar(nome, $("nivel").value);
});

$("btn-reiniciar").addEventListener("click", () => {
    iniciar(partida.nome, partida.nivel);
});

$("btn-menu").addEventListener("click", () => {
    versao++;
    mostrarTela("tela-inicial");
});

window.addEventListener("keydown", (evento) => {
    if (typeof evento.key !== "string") return;

    const tecla = evento.key.toLowerCase();

    if (partida?.ativa &&
        ["arrowup", "arrowdown", "arrowleft", "arrowright",
         "w", "a", "s", "d", "e"].includes(tecla)) {
        evento.preventDefault();
        teclas.add(tecla);
    }
});

window.addEventListener("keyup", (evento) => {
    if (typeof evento.key !== "string") return;

    teclas.delete(evento.key.toLowerCase());
});

window.addEventListener("blur", () => teclas.clear());

function moverInimigo(inimigo, dt, seguro) {
    const perseguindo =
        !seguro && distancia(inimigo, partida.rato) < partida.config.alcance;

    const alvo = perseguindo ? partida.rato : inimigo.destino;
    const dx = alvo.x - inimigo.x;
    const dy = alvo.y - inimigo.y;
    const tamanho = Math.hypot(dx, dy);

    if (tamanho < 8 && !perseguindo) {
        inimigo.destino = {
            x: 220 + Math.random() * 700,
            y: 270 + Math.random() * 280
        };
        return;
    }

    if (tamanho > 0) {
        const velocidade = partida.config.velocidade *
            (perseguindo ? 1 : 0.45) *
            (inimigo.tipo === "🧹" ? 0.85 : 1);

        const passo = Math.min(tamanho, velocidade * dt);
        inimigo.x += dx / tamanho * passo;
        inimigo.y += dy / tamanho * passo;
    }
}

function atualizar(dt) {
    const p = partida;
    p.tempo += dt;
    p.protecao = Math.max(0, p.protecao - dt);

    let dx = 0;
    let dy = 0;

    if (teclas.has("arrowleft") || teclas.has("a")) dx--;
    if (teclas.has("arrowright") || teclas.has("d")) dx++;
    if (teclas.has("arrowup") || teclas.has("w")) dy--;
    if (teclas.has("arrowdown") || teclas.has("s")) dy++;

    const tamanho = Math.hypot(dx, dy);

    if (tamanho > 0 && !p.escondido) {
        const velocidade = 235 - p.carga * 20;
        p.rato.x += dx / tamanho * velocidade * dt;
        p.rato.y += dy / tamanho * velocidade * dt;
    }

    p.rato.x = Math.max(25, Math.min(975, p.rato.x));
    p.rato.y = Math.max(245, Math.min(575, p.rato.y));

// Impede o rato de atravessar os obstáculos.
cones.forEach((cone) => {
    const dxCone = p.rato.x - cone.x;
    const dyCone = p.rato.y - cone.y;
    const d = Math.hypot(dxCone, dyCone);
    const limite = 28;

    if (d < limite) {
        const direcaoX = d === 0 ? 1 : dxCone / d;
        const direcaoY = d === 0 ? 0 : dyCone / d;

        p.rato.x = cone.x + direcaoX * limite;
        p.rato.y = cone.y + direcaoY * limite;
    }
});

p.esconderRecarga = Math.max(0, p.esconderRecarga - dt);

const pertoDaCaixa = caixaProxima(p.rato);

if (!p.escondido && pertoDaCaixa &&
    teclas.has("e") && p.esconderRecarga === 0) {
    p.escondido = true;
    p.esconderTempo = 3;

    $("mensagem-jogo").textContent =
        "Escondido na caixa! Solte E para sair.";
}

if (p.escondido) {
    p.esconderTempo -= dt;

    if (!teclas.has("e") || !pertoDaCaixa ||
        p.esconderTempo <= 0) {
        p.escondido = false;
        p.esconderRecarga = 6;

        $("mensagem-jogo").textContent =
            "Saiu da caixa! Aguarde 6 segundos para se esconder novamente.";
    }
}

const noBueiro = distancia(p.rato, bueiro) < bueiro.raio;
const seguro = noBueiro || p.escondido;

// Movimenta os efeitos e remove os que terminaram.
efeitos.forEach((efeito) => {
    efeito.vida -= dt;
    efeito.x += efeito.vx * dt;
    efeito.y += efeito.vy * dt;
});

efeitos = efeitos.filter((efeito) => efeito.vida > 0);

    if (noBueiro && p.carga > 0) {
        criarEfeito(bueiro.x, bueiro.y - 25, `+${p.carga * 100}`);
        p.entregues += p.carga;
        p.pontos += p.carga * 100;
        p.carga = 0;
        $("mensagem-jogo").textContent = "Comida entregue! Aqui você está seguro.";

        if (p.entregues >= p.config.meta) {
            finalizar(true);
            return;
        }
    }

    p.comidas.forEach((comida, indice) => {
        if (p.carga < 3 && distancia(p.rato, comida) < 25) {
            criarEfeito(comida.x, comida.y, "+1");
            p.carga++;
            p.comidas[indice] = criarComida();
            $("mensagem-jogo").textContent = p.carga === 3
                ? "Sacola cheia! Corra para o bueiro!"
                : "Pegou comida! Você pode carregar até 3.";
        }
    });

    for (const inimigo of p.inimigos) {
        moverInimigo(inimigo, dt, seguro);

        if (!seguro && p.protecao === 0 &&
            distancia(p.rato, inimigo) < 30) {
            p.vidas--;
            p.carga = 0;
            p.rato.x = bueiro.x;
            p.escondido = false;
            p.rato.y = bueiro.y;
            p.protecao = 2;

            $("mensagem-jogo").textContent =
                "Opa! Perdeu uma vida e a comida carregada. Tente de novo!";

            if (p.vidas === 0) {
                finalizar(false);
                return;
            }

            break;
        }
    }

    atualizarHud();
}

function atualizarHud() {
    const p = partida;
    $("hud-vidas").textContent = p.vidas;
    $("hud-pontos").textContent = p.pontos;
    $("hud-tempo").textContent = `${Math.floor(p.tempo)}s`;
    $("hud-carga").textContent = `${p.carga}/3`;
    $("hud-entregues").textContent = `${p.entregues}/${p.config.meta}`;
}

function emoji(texto, x, y, tamanho = 34) {
    ctx.font = `${tamanho}px "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, x, y);
}

function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Céu e lua.
    ctx.fillStyle = "#101a2b";
    ctx.fillRect(0, 0, 1000, 600);

    brilho(900, 45, 95, "rgba(180, 210, 255, 0.22)");

    ctx.fillStyle = "#e8efff";
    ctx.beginPath();
    ctx.arc(900, 45, 23, 0, Math.PI * 2);
    ctx.fill();

    // Casarões e janelas iluminadas.
    const cores = [
        "#884b43", "#958044", "#426d6b", "#725475", "#445f7b"
    ];

    cores.forEach((cor, i) => {
        const x = i * 200;

        ctx.fillStyle = cor;
        ctx.fillRect(x + 4, 80, 192, 140);

        ctx.fillStyle = "#b5a58c";
        ctx.fillRect(x + 4, 75, 192, 12);

        for (let j = 0; j < 3; j++) {
            const janelaX = x + 25 + j * 58;

            brilho(
                janelaX + 14,
                130,
                48,
                "rgba(255, 166, 55, 0.23)"
            );

            ctx.fillStyle = "#edba65";
            ctx.fillRect(janelaX, 110, 28, 40);

            ctx.strokeStyle = "#cfbb96";
            ctx.strokeRect(janelaX, 110, 28, 40);

            ctx.fillStyle = "#716049";
            ctx.fillRect(janelaX + 13, 110, 2, 40);
            ctx.fillRect(janelaX, 129, 28, 2);
        }

        ctx.fillStyle = "#202731";
        ctx.fillRect(x + 80, 170, 40, 50);
    });

    // Calçada e rua.
    ctx.fillStyle = "#666763";
    ctx.fillRect(0, 220, 1000, 25);

    ctx.fillStyle = "#20272c";
    ctx.fillRect(0, 245, 1000, 355);

    // Paralelepípedos irregulares.
    pedras.forEach((pedra) => {
        ctx.save();
        ctx.translate(pedra.x, pedra.y);
        ctx.rotate(pedra.inclinacao);

        const tom = pedra.tom;
        ctx.fillStyle = `rgb(${tom}, ${tom + 4}, ${tom + 7})`;

        ctx.beginPath();
        ctx.moveTo(3, 0);
        ctx.lineTo(pedra.largura - 3, 1);
        ctx.lineTo(pedra.largura, pedra.altura - 3);
        ctx.lineTo(pedra.largura - 5, pedra.altura);
        ctx.lineTo(1, pedra.altura - 1);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "#1c2328";
        ctx.stroke();
        ctx.restore();
    });

    brilho(900, 350, 230, "rgba(150, 190, 245, 0.14)");

    // Poças com reflexos.
    pocas.forEach((poca) => {
        ctx.fillStyle = "#182c39";
        ctx.beginPath();
        ctx.ellipse(
            poca.x, poca.y,
            poca.rx, poca.ry,
            -0.12, 0, Math.PI * 2
        );
        ctx.fill();

        ctx.strokeStyle = "rgba(195, 217, 250, 0.5)";
        ctx.beginPath();
        ctx.ellipse(
            poca.x + 7,
            poca.y - 3,
            poca.rx * 0.55,
            poca.ry * 0.25,
            -0.12,
            Math.PI,
            Math.PI * 2
        );
        ctx.stroke();
    });

    // Lampiões.
    postes.forEach((poste) => {
        brilho(poste.x, 300, 180, "rgba(255, 170, 65, 0.23)");
        brilho(poste.x, 158, 65, "rgba(255, 180, 70, 0.48)");

        ctx.fillStyle = "#171d22";
        ctx.fillRect(poste.x - 4, 173, 8, 70);
        ctx.fillRect(poste.x - 12, 237, 24, 7);
        ctx.fillRect(poste.x - 14, 139, 28, 34);

        ctx.fillStyle = "#ffd384";
        ctx.fillRect(poste.x - 9, 145, 18, 23);

        ctx.fillStyle = "#171d22";
        ctx.fillRect(poste.x - 1, 145, 2, 23);

        ctx.beginPath();
        ctx.moveTo(poste.x - 19, 139);
        ctx.lineTo(poste.x, 124);
        ctx.lineTo(poste.x + 19, 139);
        ctx.closePath();
        ctx.fill();
    });

    // Placa de rua.
    ctx.fillStyle = "#173b3c";
    ctx.fillRect(407, 184, 186, 29);

    ctx.strokeStyle = "#cfbc86";
    ctx.strokeRect(410, 187, 180, 23);

    ctx.fillStyle = "#f2e5bc";
    ctx.font = "bold 15px Georgia";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RECIFE ANTIGO", 500, 200);

    [180, 480, 780].forEach((x) => emoji("🗑️", x, 265));

    // Cones desenhados no chão.
    cones.forEach((cone) => {
        ctx.fillStyle = "#24282c";
        ctx.fillRect(cone.x - 15, cone.y + 10, 30, 7);

        ctx.fillStyle = "#e88632";
        ctx.beginPath();
        ctx.moveTo(cone.x, cone.y - 20);
        ctx.lineTo(cone.x - 12, cone.y + 12);
        ctx.lineTo(cone.x + 12, cone.y + 12);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#f5e6cf";
        ctx.fillRect(cone.x - 5, cone.y - 5, 10, 5);
    });

    // Bueiro com grade.
    brilho(bueiro.x, bueiro.y, 70, "rgba(65, 235, 195, 0.3)");

    ctx.fillStyle = "#121e23";
    ctx.beginPath();
    ctx.ellipse(
        bueiro.x, bueiro.y, 38, 27, 0, 0, Math.PI * 2
    );
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.strokeStyle = "#54877f";
    ctx.lineWidth = 4;

    for (let x = bueiro.x - 36; x <= bueiro.x + 36; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, bueiro.y - 28);
        ctx.lineTo(x, bueiro.y + 28);
        ctx.stroke();
    }

    ctx.restore();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#77d6c5";
    ctx.beginPath();
    ctx.ellipse(
        bueiro.x, bueiro.y, 38, 27, 0, 0, Math.PI * 2
    );
    ctx.stroke();
    ctx.lineWidth = 1;

    ctx.fillStyle = "#91edce";
    ctx.font = "bold 13px Georgia";
    ctx.fillText("LAR DO RATINHO", bueiro.x, bueiro.y + 48);

    // Comida flutuando.
    partida.comidas.forEach((comida, indice) => {
        const flutuar = Math.sin(partida.tempo * 3 + indice) * 4;
        emoji(comida.tipo, comida.x, comida.y + flutuar, 25);
    });

    // Inimigos e alerta de proximidade.
    const ratoSeguro =
        distancia(partida.rato, bueiro) < bueiro.raio ||
        partida.escondido;

    partida.inimigos.forEach((inimigo) => {
        desenharPersonagem(
            inimigo.tipo === "🧹" ? "🧍" : "🐈",
            inimigo,
            40
        );

        if (inimigo.tipo === "🧹") {
            ctx.save();
            ctx.globalAlpha = iluminacao(inimigo);

            const movimento = Math.sin(partida.tempo * 10) * 5;
            emoji("🧹", inimigo.x + 20, inimigo.y + 5 + movimento, 30);
            ctx.restore();
        }

        if (!ratoSeguro && distancia(inimigo, partida.rato) < 100) {
            ctx.fillStyle = "#ff5a52";
            ctx.font = "bold 30px Arial";
            ctx.fillText("!", inimigo.x, inimigo.y - 37);
        }
    });

    // Ratinho.
    if (!partida.escondido &&
        (partida.protecao === 0 ||
        Math.floor(partida.protecao * 8) % 2 === 0)) {
        desenharPersonagem("🐀", partida.rato, 36);

        if (partida.carga > 0) {
            emoji("🎒", partida.rato.x + 18, partida.rato.y - 18, 20);
        }
    }

    // Caixas de esconderijo.
    caixas.forEach((caixa) => {
        ctx.fillStyle = "#96704a";
        ctx.fillRect(caixa.x - 25, caixa.y - 20, 50, 38);

        ctx.strokeStyle = "#503921";
        ctx.strokeRect(caixa.x - 25, caixa.y - 20, 50, 38);

        ctx.fillStyle = "#c3a077";
        ctx.fillRect(caixa.x - 3, caixa.y - 20, 6, 38);

        ctx.fillStyle = "#f2ddb8";
        ctx.font = "12px Georgia";
        ctx.fillText("E: esconder", caixa.x, caixa.y + 32);

        if (partida.escondido &&
            distancia(partida.rato, caixa) < 32) {
            ctx.fillStyle = "#91edce";
            ctx.fillText(
                `${Math.ceil(partida.esconderTempo)}s`,
                caixa.x,
                caixa.y - 33
            );
        }
    });

    // Partículas e pontos flutuantes.
    efeitos.forEach((efeito) => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, efeito.vida);
        ctx.fillStyle = "#ffe194";

        if (efeito.texto) {
            ctx.font = "bold 20px Georgia";
            ctx.fillText(efeito.texto, efeito.x, efeito.y);
        } else {
            ctx.fillRect(efeito.x, efeito.y, 4, 4);
        }

        ctx.restore();
    });
}

function loop(agora) {
    if (!partida?.ativa) return;

    // Limita o passo para evitar saltos após trocar de aba
    const dt = Math.min((agora - ultimoTempo) / 1000, 0.05);
    ultimoTempo = agora;

    atualizar(dt);
    desenhar();

    if (partida.ativa) {
        animacao = requestAnimationFrame(loop);
    }
}

async function finalizar(venceu) {
    const p = partida;
    p.ativa = false;
    teclas.clear();

    if (venceu) {
        p.pontos += 500 + p.vidas * 50;
    }

    atualizarHud();
    mostrarTela("tela-final");

    $("titulo-resultado").textContent = venceu
        ? "🏆 Ratinho de barriga cheia!"
        : "🐭 Fim da aventura!";

    $("resumo-resultado").textContent =
        `${p.nome}: ${p.pontos} pontos em ${Math.floor(p.tempo)}s. ` +
        `Comidas entregues: ${p.entregues}. Nível: ${p.config.nome}.`;

    $("ranking-corpo").replaceChildren();
    $("status-ranking").textContent = "Salvando resultado…";

    const versaoAtual = versao;
    let salvo = false;

    try {
        const resposta = await fetch("/api/pontuacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nomeJogador: p.nome,
                nivel: p.nivel,
                pontos: p.pontos,
                tempoSegundos: Math.floor(p.tempo)
            })
        });

        if (!resposta.ok) throw new Error("Falha ao salvar");
        salvo = true;
    } catch (erro) {
        console.error(erro);
    }

    if (versaoAtual !== versao) return;

    try {
        const resposta = await fetch(`/api/pontuacoes?nivel=${p.nivel}`);
        if (!resposta.ok) throw new Error("Falha ao consultar");

        const ranking = await resposta.json();
        if (versaoAtual !== versao) return;

        ranking.forEach((resultado, indice) => {
            const linha = document.createElement("tr");

            [
                `${indice + 1}º`,
                resultado.nomeJogador,
                resultado.pontos,
                `${resultado.tempoSegundos}s`
            ].forEach((valor) => {
                const celula = document.createElement("td");
                celula.textContent = valor;
                linha.appendChild(celula);
            });

            $("ranking-corpo").appendChild(linha);
        });

        $("status-ranking").textContent = salvo
            ? "Resultado salvo!"
            : "Não foi possível salvar sua partida. Ranking anterior carregado.";

        if (ranking.length === 0) {
            $("status-ranking").textContent += " O ranking ainda está vazio.";
        }
    } catch (erro) {
        if (versaoAtual !== versao) return;

        $("status-ranking").textContent = salvo
            ? "Resultado salvo, mas não foi possível carregar o ranking."
            : "Não foi possível salvar nem consultar o ranking.";

        console.error(erro);
    }
}
// Controla os dedos que estão pressionando os botões.
const toquesAtivos = new Map();

document.querySelectorAll("#controles-touch [data-tecla]")
    .forEach((botao) => {
        botao.addEventListener("pointerdown", (evento) => {
            if (!partida?.ativa) return;

            evento.preventDefault();
            botao.setPointerCapture(evento.pointerId);

            const tecla = botao.dataset.tecla;

            toquesAtivos.set(evento.pointerId, { tecla, botao });
            teclas.add(tecla);
            botao.classList.add("pressionado");
        });

        function soltar(evento) {
            const toque = toquesAtivos.get(evento.pointerId);
            if (!toque) return;

            toquesAtivos.delete(evento.pointerId);

            // Mantém a tecla se outro dedo ainda a estiver segurando.
            const teclaAindaPressionada = [...toquesAtivos.values()]
                .some((item) => item.tecla === toque.tecla);

            if (!teclaAindaPressionada) {
                teclas.delete(toque.tecla);
            }

            const botaoAindaPressionado = [...toquesAtivos.values()]
                .some((item) => item.botao === toque.botao);

            if (!botaoAindaPressionado) {
                toque.botao.classList.remove("pressionado");
            }
        }

        botao.addEventListener("pointerup", soltar);
        botao.addEventListener("pointercancel", soltar);
        botao.addEventListener("lostpointercapture", soltar);

        botao.addEventListener("contextmenu", (evento) => {
            evento.preventDefault();
        });
    });

function limparControlesTouch() {
    toquesAtivos.forEach(({ tecla, botao }) => {
        teclas.delete(tecla);
        botao.classList.remove("pressionado");
    });

    toquesAtivos.clear();
}

window.addEventListener("blur", limparControlesTouch);

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        limparControlesTouch();
        teclas.clear();
    }
});