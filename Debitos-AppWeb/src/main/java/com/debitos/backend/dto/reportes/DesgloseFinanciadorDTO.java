package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;

/**
 * Nivel 3 del reporte de analistas:
 * Financiador / Obra Social afectada dentro de un motivo de débito.
 */
public class DesgloseFinanciadorDTO {

    private String financiador;
    private Integer casos = 0;
    private BigDecimal monto = BigDecimal.ZERO;
    private BigDecimal montoDebitado = BigDecimal.ZERO;
    private BigDecimal aceptado = BigDecimal.ZERO;
    private BigDecimal refacturado = BigDecimal.ZERO;
    private String distribucionAtencion;
    private BigDecimal tasaRecupero = BigDecimal.ZERO;

    public DesgloseFinanciadorDTO() {}

    public DesgloseFinanciadorDTO(String financiador, Integer casos, BigDecimal monto) {
        this.financiador = financiador;
        this.casos = casos != null ? casos : 0;
        this.monto = monto != null ? monto : BigDecimal.ZERO;
        this.montoDebitado = this.monto;
    }

    public DesgloseFinanciadorDTO(String financiador, Integer casos, BigDecimal montoDebitado,
                                  BigDecimal aceptado, BigDecimal refacturado,
                                  String distribucionAtencion, BigDecimal tasaRecupero) {
        this.financiador = financiador;
        this.casos = casos != null ? casos : 0;
        this.montoDebitado = montoDebitado != null ? montoDebitado : BigDecimal.ZERO;
        this.monto = this.montoDebitado;
        this.aceptado = aceptado != null ? aceptado : BigDecimal.ZERO;
        this.refacturado = refacturado != null ? refacturado : BigDecimal.ZERO;
        this.distribucionAtencion = distribucionAtencion;
        this.tasaRecupero = tasaRecupero != null ? tasaRecupero : BigDecimal.ZERO;
    }

    public String getFinanciador() {
        return financiador;
    }

    public void setFinanciador(String financiador) {
        this.financiador = financiador;
    }

    public Integer getCasos() {
        return casos;
    }

    public void setCasos(Integer casos) {
        this.casos = casos;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto != null ? monto : BigDecimal.ZERO;
        if (this.montoDebitado == null || this.montoDebitado.compareTo(BigDecimal.ZERO) == 0) {
            this.montoDebitado = this.monto;
        }
    }

    public BigDecimal getMontoDebitado() {
        return montoDebitado != null ? montoDebitado : monto;
    }

    public void setMontoDebitado(BigDecimal montoDebitado) {
        this.montoDebitado = montoDebitado;
        this.monto = montoDebitado;
    }

    public BigDecimal getAceptado() {
        return aceptado;
    }

    public void setAceptado(BigDecimal aceptado) {
        this.aceptado = aceptado;
    }

    public BigDecimal getRefacturado() {
        return refacturado;
    }

    public void setRefacturado(BigDecimal refacturado) {
        this.refacturado = refacturado;
    }

    public String getDistribucionAtencion() {
        return distribucionAtencion;
    }

    public void setDistribucionAtencion(String distribucionAtencion) {
        this.distribucionAtencion = distribucionAtencion;
    }

    public BigDecimal getTasaRecupero() {
        return tasaRecupero;
    }

    public void setTasaRecupero(BigDecimal tasaRecupero) {
        this.tasaRecupero = tasaRecupero;
    }
}
