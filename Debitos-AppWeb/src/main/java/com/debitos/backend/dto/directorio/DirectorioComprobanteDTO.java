package com.debitos.backend.dto.directorio;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DirectorioComprobanteDTO {
    private Long id;
    private String tipo;
    private String letra;
    private Integer ptovta;
    private Integer numero;
    private LocalDate fecha;
    private BigDecimal montoNeto = BigDecimal.ZERO;
    private BigDecimal montoIva = BigDecimal.ZERO;
    private BigDecimal total = BigDecimal.ZERO;
    private BigDecimal debitoAceptado = BigDecimal.ZERO;
    private BigDecimal debitoNoAceptado = BigDecimal.ZERO;
    private BigDecimal refacturado = BigDecimal.ZERO;
    private String origenTipo;
    private int nivel;

    public DirectorioComprobanteDTO() {}

    public DirectorioComprobanteDTO(Long id, String tipo, String letra, Integer ptovta, Integer numero, LocalDate fecha,
                                  BigDecimal montoNeto, BigDecimal montoIva, BigDecimal total,
                                  BigDecimal debitoAceptado, BigDecimal debitoNoAceptado, BigDecimal refacturado,
                                  String origenTipo, int nivel) {
        this.id = id;
        this.tipo = tipo;
        this.letra = letra;
        this.ptovta = ptovta;
        this.numero = numero;
        this.fecha = fecha;
        this.montoNeto = montoNeto != null ? montoNeto : BigDecimal.ZERO;
        this.montoIva = montoIva != null ? montoIva : BigDecimal.ZERO;
        this.total = total != null ? total : BigDecimal.ZERO;
        this.debitoAceptado = debitoAceptado != null ? debitoAceptado : BigDecimal.ZERO;
        this.debitoNoAceptado = debitoNoAceptado != null ? debitoNoAceptado : BigDecimal.ZERO;
        this.refacturado = refacturado != null ? refacturado : BigDecimal.ZERO;
        this.origenTipo = origenTipo;
        this.nivel = nivel;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public BigDecimal getMontoNeto() {
        return montoNeto;
    }

    public void setMontoNeto(BigDecimal montoNeto) {
        this.montoNeto = montoNeto;
    }

    public BigDecimal getMontoIva() {
        return montoIva;
    }

    public void setMontoIva(BigDecimal montoIva) {
        this.montoIva = montoIva;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public BigDecimal getDebitoAceptado() {
        return debitoAceptado;
    }

    public void setDebitoAceptado(BigDecimal debitoAceptado) {
        this.debitoAceptado = debitoAceptado;
    }

    public BigDecimal getDebitoNoAceptado() {
        return debitoNoAceptado;
    }

    public void setDebitoNoAceptado(BigDecimal debitoNoAceptado) {
        this.debitoNoAceptado = debitoNoAceptado;
    }

    public BigDecimal getRefacturado() {
        return refacturado;
    }

    public void setRefacturado(BigDecimal refacturado) {
        this.refacturado = refacturado;
    }

    public String getOrigenTipo() {
        return origenTipo;
    }

    public void setOrigenTipo(String origenTipo) {
        this.origenTipo = origenTipo;
    }

    public int getNivel() {
        return nivel;
    }

    public void setNivel(int nivel) {
        this.nivel = nivel;
    }
}
