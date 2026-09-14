package com.debitos.backend.dto.directorio;

import java.math.BigDecimal;

public class DirectorioTotalesDTO {
    private BigDecimal totalFacturado = BigDecimal.ZERO;
    private BigDecimal cobranzaEfectiva = BigDecimal.ZERO;
    private BigDecimal perdidaAsumida = BigDecimal.ZERO;
    private BigDecimal deudaNeta = BigDecimal.ZERO;
    private long cantidadFacturas = 0;
    private long cantidadComprobantes = 0;

    public DirectorioTotalesDTO() {}

    public DirectorioTotalesDTO(BigDecimal totalFacturado, BigDecimal cobranzaEfectiva, BigDecimal perdidaAsumida, BigDecimal deudaNeta, long cantidadFacturas, long cantidadComprobantes) {
        this.totalFacturado = totalFacturado != null ? totalFacturado : BigDecimal.ZERO;
        this.cobranzaEfectiva = cobranzaEfectiva != null ? cobranzaEfectiva : BigDecimal.ZERO;
        this.perdidaAsumida = perdidaAsumida != null ? perdidaAsumida : BigDecimal.ZERO;
        this.deudaNeta = deudaNeta != null ? deudaNeta : BigDecimal.ZERO;
        this.cantidadFacturas = cantidadFacturas;
        this.cantidadComprobantes = cantidadComprobantes;
    }

    public BigDecimal getTotalFacturado() {
        return totalFacturado;
    }

    public void setTotalFacturado(BigDecimal totalFacturado) {
        this.totalFacturado = totalFacturado;
    }

    public BigDecimal getCobranzaEfectiva() {
        return cobranzaEfectiva;
    }

    public void setCobranzaEfectiva(BigDecimal cobranzaEfectiva) {
        this.cobranzaEfectiva = cobranzaEfectiva;
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
    }

    public long getCantidadFacturas() {
        return cantidadFacturas;
    }

    public void setCantidadFacturas(long cantidadFacturas) {
        this.cantidadFacturas = cantidadFacturas;
    }

    public long getCantidadComprobantes() {
        return cantidadComprobantes;
    }

    public void setCantidadComprobantes(long cantidadComprobantes) {
        this.cantidadComprobantes = cantidadComprobantes;
    }
}
