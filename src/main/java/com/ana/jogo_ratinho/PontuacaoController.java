package com.ana.jogo_ratinho;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/pontuacoes")
public class PontuacaoController {

    private final PontuacaoRepository repository;

    public PontuacaoController(PontuacaoRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public Pontuacao salvar(@RequestBody Pontuacao recebida) {
        String nome = recebida.getNomeJogador();

        if (nome == null || nome.isBlank() || nome.trim().length() > 30) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Informe um nome entre 1 e 30 caracteres."
            );
        }

        if (recebida.getPontos() < 0 || recebida.getTempoSegundos() < 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Pontos e tempo não podem ser negativos."
            );
        }

        Pontuacao nova = new Pontuacao();
        nova.setNomeJogador(nome.trim());
        nova.setNivel(validarNivel(recebida.getNivel()));
        nova.setPontos(recebida.getPontos());
        nova.setTempoSegundos(recebida.getTempoSegundos());

        return repository.save(nova);
    }

    @GetMapping
    public List<Pontuacao> ranking(@RequestParam("nivel") String nivel) {
        return repository
            .findTop10ByNivelOrderByPontosDescTempoSegundosAscIdAsc(
                validarNivel(nivel)
            );
    }

    private String validarNivel(String nivel) {
        if (nivel == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Informe o nível."
            );
        }

        String normalizado = nivel.trim().toLowerCase(Locale.ROOT);

        if (!List.of("facil", "medio", "dificil").contains(normalizado)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Use facil, medio ou dificil."
            );
        }

        return normalizado;
    }
}