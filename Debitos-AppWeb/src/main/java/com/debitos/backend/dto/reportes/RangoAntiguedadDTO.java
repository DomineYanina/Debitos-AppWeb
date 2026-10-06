package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;

public class RangoAntiguedadDTO {
    private String rango;
    private Integer cantidadComprobantes;
    private BigDecimal saldoEnMora;
    private BigDecimal porcentajeCartera;

    public RangoAntiguedadDTO() {
    }

    public RangoAntiguedadDTO(String rango, Integer cantidadComprobantes, BigDecimal saldoEnMora, BigDecimal porcentajeCartera) {
        this.rango = rango;
        this.cantidadComprobantes = cantidadComprobantes;
        this.saldoEnMora = saldoEnMora;
        this.porcentajeCartera = porcentajeCartera;
    }

    public String getRango() {
        return rango;
    }

    public void setRango(String rango) {
        this.rango = rango;
    }

    public Integer getCantidadComprobantes() {
        return cantidadComprobantes;
    }

    public void setCantidadComprobantes(Integer cantidadComprobantes) {
        this.cantidadComprobantes = cantidadComprobantes;
    }

    public BigDecimal getSaldoEnMora() {
        return saldoEnMora;
    }

    public void setSaldoEnMora(BigDecimal saldoEnMora) {
        this.saldoEnMora = saldoEnMora;
    }

    public BigDecimal getPorcentajeCartera() {
        return porcentajeCartera;
    }

    public void setPorcentajeCartera(BigDecimal porcentajeCartera) {
        this.porcentajeCartera = porcentajeCartera;
    }
}
