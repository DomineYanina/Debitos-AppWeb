package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;

/**
 * Nivel 3 del árbol de Cuenta Corriente: representa un comprobante individual
 * (Factura, Nota de Débito, Nota de Crédito o Recibo) y su desglose en las 5 columnas financieras.
 */
public class CcComprobanteDTO {

    private String tipo;
    private String comprobante;
    private String fecha;
    private BigDecimal facturacionFc = BigDecimal.ZERO;
    private BigDecimal incrementosNd = BigDecimal.ZERO;
    private BigDecimal debitosNc = BigDecimal.ZERO;
    private BigDecimal refacturacionNd = BigDecimal.ZERO;
    private BigDecimal cobranzasRc = BigDecimal.ZERO;
    private BigDecimal saldo = BigDecimal.ZERO;

    private Long id;
    private Long asociado;
    private Long asociadogrupo;
    private Integer nivel = 0;
    private String origenTipo;
    private java.util.List<CcComprobanteDTO> hijos = new java.util.ArrayList<>();

    public CcComprobanteDTO() {}

    public CcComprobanteDTO(String tipo, String comprobante, String fecha,
                            BigDecimal facturacionFc, BigDecimal incrementosNd,
                            BigDecimal debitosNc, BigDecimal refacturacionNd,
                            BigDecimal cobranzasRc, BigDecimal saldo) {
        this.tipo = tipo;
        this.comprobante = comprobante;
        this.fecha = fecha;
        this.facturacionFc = facturacionFc != null ? facturacionFc : BigDecimal.ZERO;
        this.incrementosNd = incrementosNd != null ? incrementosNd : BigDecimal.ZERO;
        this.debitosNc = debitosNc != null ? debitosNc : BigDecimal.ZERO;
        this.refacturacionNd = refacturacionNd != null ? refacturacionNd : BigDecimal.ZERO;
        this.cobranzasRc = cobranzasRc != null ? cobranzasRc : BigDecimal.ZERO;
        this.saldo = saldo != null ? saldo : BigDecimal.ZERO;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAsociado() {
        return asociado;
    }

    public void setAsociado(Long asociado) {
        this.asociado = asociado;
    }

    public Long getAsociadogrupo() {
        return asociadogrupo;
    }

    public void setAsociadogrupo(Long asociadogrupo) {
        this.asociadogrupo = asociadogrupo;
    }

    public Integer getNivel() {
        return nivel;
    }

    public void setNivel(Integer nivel) {
        this.nivel = nivel;
    }

    public String getOrigenTipo() {
        return origenTipo;
    }

    public void setOrigenTipo(String origenTipo) {
        this.origenTipo = origenTipo;
    }

    public java.util.List<CcComprobanteDTO> getHijos() {
        return hijos;
    }

    public void setHijos(java.util.List<CcComprobanteDTO> hijos) {
        this.hijos = hijos != null ? hijos : new java.util.ArrayList<>();
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getComprobante() {
        return comprobante;
    }

    public void setComprobante(String comprobante) {
        this.comprobante = comprobante;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getFacturacionFc() {
        return facturacionFc;
    }

    public void setFacturacionFc(BigDecimal facturacionFc) {
        this.facturacionFc = facturacionFc;
    }

    public BigDecimal getIncrementosNd() {
        return incrementosNd;
    }

    public void setIncrementosNd(BigDecimal incrementosNd) {
        this.incrementosNd = incrementosNd;
    }

    public BigDecimal getDebitosNc() {
        return debitosNc;
    }

    public void setDebitosNc(BigDecimal debitosNc) {
        this.debitosNc = debitosNc;
    }

    public BigDecimal getRefacturacionNd() {
        return refacturacionNd;
    }

    public void setRefacturacionNd(BigDecimal refacturacionNd) {
        this.refacturacionNd = refacturacionNd;
    }

    public BigDecimal getCobranzasRc() {
        return cobranzasRc;
    }

    public void setCobranzasRc(BigDecimal cobranzasRc) {
        this.cobranzasRc = cobranzasRc;
    }

    public BigDecimal getSaldo() {
        return saldo;
    }

    public void setSaldo(BigDecimal saldo) {
        this.saldo = saldo;
    }
}
