package com.debitos.backend.dto.contable;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FacturaPeriodoDTO {
    private Long idCabecera;
    private String tipo;
    private String letra;
    private Integer ptovta;
    private Integer numero;
    private LocalDate fecha;
    private LocalDate periodoOriginal;
    private LocalDate periodoCorregido;
    private String codigoCobertura;
    private String cobertura;
    private BigDecimal importe;

    public FacturaPeriodoDTO() {}

    public Long getIdCabecera() {
        return idCabecera;
    }

    public void setIdCabecera(Long idCabecera) {
        this.idCabecera = idCabecera;
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

    public LocalDate getPeriodoOriginal() {
        return periodoOriginal;
    }

    public void setPeriodoOriginal(LocalDate periodoOriginal) {
        this.periodoOriginal = periodoOriginal;
    }

    public LocalDate getPeriodoCorregido() {
        return periodoCorregido;
    }

    public void setPeriodoCorregido(LocalDate periodoCorregido) {
        this.periodoCorregido = periodoCorregido;
    }

    public String getCodigoCobertura() {
        return codigoCobertura;
    }

    public void setCodigoCobertura(String codigoCobertura) {
        this.codigoCobertura = codigoCobertura;
    }

    public String getCobertura() {
        return cobertura;
    }

    public void setCobertura(String cobertura) {
        this.cobertura = cobertura;
    }

    public BigDecimal getImporte() {
        return importe;
    }

    public void setImporte(BigDecimal importe) {
        this.importe = importe;
    }
}
