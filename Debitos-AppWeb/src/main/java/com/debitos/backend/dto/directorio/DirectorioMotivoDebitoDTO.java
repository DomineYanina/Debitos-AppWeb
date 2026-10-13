package com.debitos.backend.dto.directorio;

import java.math.BigDecimal;

public class DirectorioMotivoDebitoDTO {
    private String motivo;
    private BigDecimal montoTotal = BigDecimal.ZERO;
    private BigDecimal porcentaje = BigDecimal.ZERO;
    private long cantidadCasos = 0;
    private BigDecimal montoAceptado = BigDecimal.ZERO;
    private BigDecimal montoRefacturado = BigDecimal.ZERO;
    private BigDecimal porcentajeAceptados = BigDecimal.ZERO;
    private BigDecimal porcentajeRefacturados = BigDecimal.ZERO;

    public DirectorioMotivoDebitoDTO() {}

    public DirectorioMotivoDebitoDTO(String motivo, BigDecimal montoTotal, BigDecimal porcentaje, long cantidadCasos) {
        this.motivo = motivo;
        this.montoTotal = montoTotal != null ? montoTotal : BigDecimal.ZERO;
        this.porcentaje = porcentaje != null ? porcentaje : BigDecimal.ZERO;
        this.cantidadCasos = cantidadCasos;
    }

    public DirectorioMotivoDebitoDTO(String motivo, BigDecimal montoTotal, BigDecimal porcentaje, long cantidadCasos,
                                     BigDecimal montoAceptado, BigDecimal montoRefacturado,
                                     BigDecimal porcentajeAceptados, BigDecimal porcentajeRefacturados) {
        this.motivo = motivo;
        this.montoTotal = montoTotal != null ? montoTotal : BigDecimal.ZERO;
        this.porcentaje = porcentaje != null ? porcentaje : BigDecimal.ZERO;
        this.cantidadCasos = cantidadCasos;
        this.montoAceptado = montoAceptado != null ? montoAceptado : BigDecimal.ZERO;
        this.montoRefacturado = montoRefacturado != null ? montoRefacturado : BigDecimal.ZERO;
        this.porcentajeAceptados = porcentajeAceptados != null ? porcentajeAceptados : BigDecimal.ZERO;
        this.porcentajeRefacturados = porcentajeRefacturados != null ? porcentajeRefacturados : BigDecimal.ZERO;
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

    public BigDecimal getMontoAceptado() {
        return montoAceptado;
    }

    public void setMontoAceptado(BigDecimal montoAceptado) {
        this.montoAceptado = montoAceptado;
    }

    public BigDecimal getMontoRefacturado() {
        return montoRefacturado;
    }

    public void setMontoRefacturado(BigDecimal montoRefacturado) {
        this.montoRefacturado = montoRefacturado;
    }

    public BigDecimal getPorcentajeAceptados() {
        return porcentajeAceptados;
    }

    public void setPorcentajeAceptados(BigDecimal porcentajeAceptados) {
        this.porcentajeAceptados = porcentajeAceptados;
    }

    public BigDecimal getPorcentajeRefacturados() {
        return porcentajeRefacturados;
    }

    public void setPorcentajeRefacturados(BigDecimal porcentajeRefacturados) {
        this.porcentajeRefacturados = porcentajeRefacturados;
    }
}
