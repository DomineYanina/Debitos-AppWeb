package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Nivel 1 del reporte de desempeño por analistas de débito:
 * Métricas consolidadas por responsable (analista), indicadores clave y
 * árbol anidado de motivos y financiadores.
 */
public class MetricaAnalistaDTO {

    private String analista;
    private Integer cantidadRegistros = 0;
    private BigDecimal debitosAceptados = BigDecimal.ZERO;
    private BigDecimal debitosRefacturados = BigDecimal.ZERO;
    private BigDecimal totalTramitado = BigDecimal.ZERO;
    private BigDecimal ticketPromedio = BigDecimal.ZERO;
    private BigDecimal tasaRecupero = BigDecimal.ZERO;
    private List<DesgloseMotivoDTO> motivos = new ArrayList<>();
    private String distribucionAtencion;
    private BigDecimal porcentajeAmb = BigDecimal.ZERO;
    private BigDecimal porcentajeInt = BigDecimal.ZERO;
    private Integer cantidadAmb = 0;
    private Integer cantidadInt = 0;

    public MetricaAnalistaDTO() {}

    public MetricaAnalistaDTO(String analista, Integer cantidadRegistros,
                              BigDecimal debitosAceptados, BigDecimal debitosRefacturados,
                              BigDecimal totalTramitado, BigDecimal ticketPromedio,
                              BigDecimal tasaRecupero, List<DesgloseMotivoDTO> motivos) {
        this(analista, cantidadRegistros, debitosAceptados, debitosRefacturados,
             totalTramitado, ticketPromedio, tasaRecupero, motivos,
             null, BigDecimal.ZERO, BigDecimal.ZERO, 0, 0);
    }

    public MetricaAnalistaDTO(String analista, Integer cantidadRegistros,
                              BigDecimal debitosAceptados, BigDecimal debitosRefacturados,
                              BigDecimal totalTramitado, BigDecimal ticketPromedio,
                              BigDecimal tasaRecupero, List<DesgloseMotivoDTO> motivos,
                              String distribucionAtencion, BigDecimal porcentajeAmb,
                              BigDecimal porcentajeInt, Integer cantidadAmb, Integer cantidadInt) {
        this.analista = analista;
        this.cantidadRegistros = cantidadRegistros != null ? cantidadRegistros : 0;
        this.debitosAceptados = debitosAceptados != null ? debitosAceptados : BigDecimal.ZERO;
        this.debitosRefacturados = debitosRefacturados != null ? debitosRefacturados : BigDecimal.ZERO;
        this.totalTramitado = totalTramitado != null ? totalTramitado : BigDecimal.ZERO;
        this.ticketPromedio = ticketPromedio != null ? ticketPromedio : BigDecimal.ZERO;
        this.tasaRecupero = tasaRecupero != null ? tasaRecupero : BigDecimal.ZERO;
        this.motivos = motivos != null ? motivos : new ArrayList<>();
        this.distribucionAtencion = distribucionAtencion;
        this.porcentajeAmb = porcentajeAmb != null ? porcentajeAmb : BigDecimal.ZERO;
        this.porcentajeInt = porcentajeInt != null ? porcentajeInt : BigDecimal.ZERO;
        this.cantidadAmb = cantidadAmb != null ? cantidadAmb : 0;
        this.cantidadInt = cantidadInt != null ? cantidadInt : 0;
    }

    public String getAnalista() {
        return analista;
    }

    public void setAnalista(String analista) {
        this.analista = analista;
    }

    public Integer getCantidadRegistros() {
        return cantidadRegistros;
    }

    public void setCantidadRegistros(Integer cantidadRegistros) {
        this.cantidadRegistros = cantidadRegistros;
    }

    public BigDecimal getDebitosAceptados() {
        return debitosAceptados;
    }

    public void setDebitosAceptados(BigDecimal debitosAceptados) {
        this.debitosAceptados = debitosAceptados != null ? debitosAceptados : BigDecimal.ZERO;
    }

    public BigDecimal getDebitosRefacturados() {
        return debitosRefacturados;
    }

    public void setDebitosRefacturados(BigDecimal debitosRefacturados) {
        this.debitosRefacturados = debitosRefacturados != null ? debitosRefacturados : BigDecimal.ZERO;
    }

    public BigDecimal getTotalTramitado() {
        return totalTramitado;
    }

    public void setTotalTramitado(BigDecimal totalTramitado) {
        this.totalTramitado = totalTramitado != null ? totalTramitado : BigDecimal.ZERO;
    }

    public BigDecimal getTicketPromedio() {
        return ticketPromedio;
    }

    public void setTicketPromedio(BigDecimal ticketPromedio) {
        this.ticketPromedio = ticketPromedio != null ? ticketPromedio : BigDecimal.ZERO;
    }

    public BigDecimal getTasaRecupero() {
        return tasaRecupero;
    }

    public void setTasaRecupero(BigDecimal tasaRecupero) {
        this.tasaRecupero = tasaRecupero != null ? tasaRecupero : BigDecimal.ZERO;
    }

    public List<DesgloseMotivoDTO> getMotivos() {
        return motivos;
    }

    public void setMotivos(List<DesgloseMotivoDTO> motivos) {
        this.motivos = motivos != null ? motivos : new ArrayList<>();
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
