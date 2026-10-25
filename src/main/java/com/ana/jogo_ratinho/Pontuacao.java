package com.ana.jogo_ratinho;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Pontuacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomeJogador;
    private String nivel;
    private int pontos;
    private int tempoSegundos;

    public Pontuacao() {
    }

    public Long getId() {
        return id;
    }

    public String getNomeJogador() {
        return nomeJogador;
    }

    public void setNomeJogador(String nomeJogador) {
        this.nomeJogador = nomeJogador;
    }

    public String getNivel() {
        return nivel;
    }

    public void setNivel(String nivel) {
        this.nivel = nivel;
    }

    public int getPontos() {
        return pontos;
    }

    public void setPontos(int pontos) {
        this.pontos = pontos;
    }

    public int getTempoSegundos() {
        return tempoSegundos;
    }

    public void setTempoSegundos(int tempoSegundos) {
        this.tempoSegundos = tempoSegundos;
    }
}