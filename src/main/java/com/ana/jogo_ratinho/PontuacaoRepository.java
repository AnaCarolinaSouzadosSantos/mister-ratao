package com.ana.jogo_ratinho;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PontuacaoRepository
        extends JpaRepository<Pontuacao, Long> {

    List<Pontuacao> findTop10ByNivelOrderByPontosDescTempoSegundosAscIdAsc(
        String nivel
    );
}