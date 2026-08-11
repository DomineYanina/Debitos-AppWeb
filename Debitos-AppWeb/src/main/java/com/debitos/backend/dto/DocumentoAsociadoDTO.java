package com.debitos.backend.dto;

import java.time.LocalDate;

public class DocumentoAsociadoDTO {
    private String tipo;
    private String letra;
    private Integer ptovta;
    private Integer numero;
    private LocalDate fecha;

    public DocumentoAsociadoDTO() {}

    public DocumentoAsociadoDTO(String tipo, String letra, Integer ptovta, Integer numero, LocalDate fecha) {
        this.tipo = tipo;
        this.letra = letra;
        this.ptovta = ptovta;
        this.numero = numero;
        this.fecha = fecha;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getLetra() {
        return letra;
    }

    public void setLetra(String letra) {
        this.letra = letra;
    }

    public Integer getPtovta() {
        return ptovta;
    }

    public void setPtovta(Integer ptovta) {
        this.ptovta = ptovta;
    }

    public Integer getNumero() {
        return numero;
    }

    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }
}
