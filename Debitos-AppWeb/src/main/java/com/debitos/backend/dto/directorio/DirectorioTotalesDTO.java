package com.debitos.backend.dto.directorio;

import java.math.BigDecimal;

public class DirectorioTotalesDTO {
    // 1. Facturación Original (FC)
    private BigDecimal totalFacturado = BigDecimal.ZERO;
    private long cantidadFacturas = 0;

    // 2. Incrementos (ND)
    private BigDecimal totalIncrementosNd = BigDecimal.ZERO;

    // 3. Débitos Recibidos (NC)
    private BigDecimal totalDebitosNc = BigDecimal.ZERO;

    // 4. Refacturación (ND-NC) y Tasa de Recupero %
    private BigDecimal totalRefacturacionNd = BigDecimal.ZERO;
    private BigDecimal tasaRecupero = BigDecimal.ZERO;

    // 5. Cobranzas (RC) y Efectividad %
    private BigDecimal totalCobranzas = BigDecimal.ZERO;
    private BigDecimal efectividadCobro = BigDecimal.ZERO;

    // 6. Saldo Pendiente Real y DSO Ponderado (días)
    private BigDecimal saldoPendienteReal = BigDecimal.ZERO;
    private Integer dsoPonderadoDias = 429;

    // Campos legados para compatibilidad
    private BigDecimal cobranzaEfectiva = BigDecimal.ZERO;
    private BigDecimal perdidaAsumida = BigDecimal.ZERO;
    private BigDecimal deudaNeta = BigDecimal.ZERO;
    private long cantidadComprobantes = 0;

    public DirectorioTotalesDTO() {}

    public DirectorioTotalesDTO(BigDecimal totalFacturado, BigDecimal cobranzaEfectiva, BigDecimal perdidaAsumida,
                                BigDecimal deudaNeta, long cantidadFacturas, long cantidadComprobantes) {
        this.totalFacturado = totalFacturado != null ? totalFacturado : BigDecimal.ZERO;
        this.cobranzaEfectiva = cobranzaEfectiva != null ? cobranzaEfectiva : BigDecimal.ZERO;
        this.totalCobranzas = this.cobranzaEfectiva;
        this.perdidaAsumida = perdidaAsumida != null ? perdidaAsumida : BigDecimal.ZERO;
        this.deudaNeta = deudaNeta != null ? deudaNeta : BigDecimal.ZERO;
        this.saldoPendienteReal = this.deudaNeta;
        this.cantidadFacturas = cantidadFacturas;
        this.cantidadComprobantes = cantidadComprobantes;
    }

    public BigDecimal getTotalFacturado() {
        return totalFacturado;
    }

    public void setTotalFacturado(BigDecimal totalFacturado) {
        this.totalFacturado = totalFacturado;
    }

    public long getCantidadFacturas() {
        return cantidadFacturas;
    }

    public void setCantidadFacturas(long cantidadFacturas) {
        this.cantidadFacturas = cantidadFacturas;
    }

    public BigDecimal getTotalIncrementosNd() {
        return totalIncrementosNd;
    }

    public void setTotalIncrementosNd(BigDecimal totalIncrementosNd) {
        this.totalIncrementosNd = totalIncrementosNd;
    }

    public BigDecimal getTotalDebitosNc() {
        return totalDebitosNc;
    }

    public void setTotalDebitosNc(BigDecimal totalDebitosNc) {
        this.totalDebitosNc = totalDebitosNc;
    }

    public BigDecimal getTotalRefacturacionNd() {
        return totalRefacturacionNd;
    }

    public void setTotalRefacturacionNd(BigDecimal totalRefacturacionNd) {
        this.totalRefacturacionNd = totalRefacturacionNd;
    }

    public BigDecimal getTasaRecupero() {
        return tasaRecupero;
    }

    public void setTasaRecupero(BigDecimal tasaRecupero) {
        this.tasaRecupero = tasaRecupero;
    }

    public BigDecimal getTotalCobranzas() {
        return totalCobranzas;
    }

    public void setTotalCobranzas(BigDecimal totalCobranzas) {
        this.totalCobranzas = totalCobranzas;
        this.cobranzaEfectiva = totalCobranzas;
    }

    public BigDecimal getEfectividadCobro() {
        return efectividadCobro;
    }

    public void setEfectividadCobro(BigDecimal efectividadCobro) {
        this.efectividadCobro = efectividadCobro;
    }

    public BigDecimal getSaldoPendienteReal() {
        return saldoPendienteReal;
    }

    public void setSaldoPendienteReal(BigDecimal saldoPendienteReal) {
        this.saldoPendienteReal = saldoPendienteReal;
        this.deudaNeta = saldoPendienteReal;
    }

    public Integer getDsoPonderadoDias() {
        return dsoPonderadoDias;
    }

    public void setDsoPonderadoDias(Integer dsoPonderadoDias) {
        this.dsoPonderadoDias = dsoPonderadoDias;
    }

    public BigDecimal getCobranzaEfectiva() {
        return cobranzaEfectiva;
    }

    public void setCobranzaEfectiva(BigDecimal cobranzaEfectiva) {
        this.cobranzaEfectiva = cobranzaEfectiva;
        this.totalCobranzas = cobranzaEfectiva;
    }

    public BigDecimal getPerdidaAsumida() {
        return perdidaAsumida;
    }

    public void setPerdidaAsumida(BigDecimal perdidaAsumida) {
        this.perdidaAsumida = perdidaAsumida;
    }

    public BigDecimal getDeudaNeta() {
        return deudaNeta;
    }

    public void setDeudaNeta(BigDecimal deudaNeta) {
        this.deudaNeta = deudaNeta;
        this.saldoPendienteReal = deudaNeta;
    }

    public long getCantidadComprobantes() {
        return cantidadComprobantes;
    }

    public void setCantidadComprobantes(long cantidadComprobantes) {
        this.cantidadComprobantes = cantidadComprobantes;
    }
}
