package com.debitos.backend.dto.directorio;

import java.math.BigDecimal;

public class DirectorioMotivoDebitoDTO {
    private String motivo;
    private BigDecimal montoTotal = BigDecimal.ZERO;
    private BigDecimal porcentaje = BigDecimal.ZERO;
    private long cantidadCasos = 0;

    public DirectorioMotivoDebitoDTO() {}

    public DirectorioMotivoDebitoDTO(String motivo, BigDecimal montoTotal, BigDecimal porcentaje, long cantidadCasos) {
        this.motivo = motivo;
        this.montoTotal = montoTotal != null ? montoTotal : BigDecimal.ZERO;
        this.porcentaje = porcentaje != null ? porcentaje : BigDecimal.ZERO;
        this.cantidadCasos = cantidadCasos;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public BigDecimal getMontoTotal() {
        return montoTotal;
    }

    public void setMontoTotal(BigDecimal montoTotal) {
        this.montoTotal = montoTotal;
    }

    public BigDecimal getPorcentaje() {
        return porcentaje;
    }

    public void setPorcentaje(BigDecimal porcentaje) {
        this.porcentaje = porcentaje;
    }

    public long getCantidadCasos() {
        return cantidadCasos;
    }

    public void setCantidadCasos(long cantidadCasos) {
        this.cantidadCasos = cantidadCasos;
    }
}
