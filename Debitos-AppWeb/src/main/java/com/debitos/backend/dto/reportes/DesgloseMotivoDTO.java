package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Nivel 2 del reporte de analistas:
 * Motivo o causa de débito tramitado por el analista, con desglose de montos
 * aceptados y refacturados, y sus financiadores vinculados.
 */
public class DesgloseMotivoDTO {

    private String motivo;
    private Integer casos = 0;
    private BigDecimal montoDebitado = BigDecimal.ZERO;
    private BigDecimal aceptado = BigDecimal.ZERO;
    private BigDecimal refacturado = BigDecimal.ZERO;
    private List<DesgloseFinanciadorDTO> financiadores = new ArrayList<>();
    private String distribucionAtencion;
    private BigDecimal porcentajeAmb = BigDecimal.ZERO;
    private BigDecimal porcentajeInt = BigDecimal.ZERO;
    private Integer cantidadAmb = 0;
    private Integer cantidadInt = 0;

    public DesgloseMotivoDTO() {}

    public DesgloseMotivoDTO(String motivo, Integer casos, BigDecimal montoDebitado,
                              BigDecimal aceptado, BigDecimal refacturado,
                              List<DesgloseFinanciadorDTO> financiadores) {
        this(motivo, casos, montoDebitado, aceptado, refacturado, financiadores,
             null, BigDecimal.ZERO, BigDecimal.ZERO, 0, 0);
    }

    public DesgloseMotivoDTO(String motivo, Integer casos, BigDecimal montoDebitado,
                              BigDecimal aceptado, BigDecimal refacturado,
                              List<DesgloseFinanciadorDTO> financiadores,
                              String distribucionAtencion, BigDecimal porcentajeAmb,
                              BigDecimal porcentajeInt, Integer cantidadAmb, Integer cantidadInt) {
        this.motivo = motivo;
        this.casos = casos != null ? casos : 0;
        this.montoDebitado = montoDebitado != null ? montoDebitado : BigDecimal.ZERO;
        this.aceptado = aceptado != null ? aceptado : BigDecimal.ZERO;
        this.refacturado = refacturado != null ? refacturado : BigDecimal.ZERO;
        this.financiadores = financiadores != null ? financiadores : new ArrayList<>();
        this.distribucionAtencion = distribucionAtencion;
        this.porcentajeAmb = porcentajeAmb != null ? porcentajeAmb : BigDecimal.ZERO;
        this.porcentajeInt = porcentajeInt != null ? porcentajeInt : BigDecimal.ZERO;
        this.cantidadAmb = cantidadAmb != null ? cantidadAmb : 0;
        this.cantidadInt = cantidadInt != null ? cantidadInt : 0;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public Integer getCasos() {
        return casos;
    }

    public void setCasos(Integer casos) {
        this.casos = casos;
    }

    public BigDecimal getMontoDebitado() {
        return montoDebitado;
    }

    public void setMontoDebitado(BigDecimal montoDebitado) {
        this.montoDebitado = montoDebitado != null ? montoDebitado : BigDecimal.ZERO;
    }

    public BigDecimal getAceptado() {
        return aceptado;
    }

    public void setAceptado(BigDecimal aceptado) {
        this.aceptado = aceptado != null ? aceptado : BigDecimal.ZERO;
    }

    public BigDecimal getRefacturado() {
        return refacturado;
    }

    public void setRefacturado(BigDecimal refacturado) {
        this.refacturado = refacturado != null ? refacturado : BigDecimal.ZERO;
    }

    public List<DesgloseFinanciadorDTO> getFinanciadores() {
        return financiadores;
    }

    public void setFinanciadores(List<DesgloseFinanciadorDTO> financiadores) {
        this.financiadores = financiadores != null ? financiadores : new ArrayList<>();
    }

    public String getDistribucionAtencion() {
        return distribucionAtencion;
    }

    public void setDistribucionAtencion(String distribucionAtencion) {
        this.distribucionAtencion = distribucionAtencion;
    }

    public BigDecimal getPorcentajeAmb() {
        return porcentajeAmb;
    }

    public void setPorcentajeAmb(BigDecimal porcentajeAmb) {
        this.porcentajeAmb = porcentajeAmb != null ? porcentajeAmb : BigDecimal.ZERO;
    }

    public BigDecimal getPorcentajeInt() {
        return porcentajeInt;
    }

    public void setPorcentajeInt(BigDecimal porcentajeInt) {
        this.porcentajeInt = porcentajeInt != null ? porcentajeInt : BigDecimal.ZERO;
    }

    public Integer getCantidadAmb() {
        return cantidadAmb;
    }

    public void setCantidadAmb(Integer cantidadAmb) {
        this.cantidadAmb = cantidadAmb != null ? cantidadAmb : 0;
    }

    public Integer getCantidadInt() {
        return cantidadInt;
    }

    public void setCantidadInt(Integer cantidadInt) {
        this.cantidadInt = cantidadInt != null ? cantidadInt : 0;
    }
}
