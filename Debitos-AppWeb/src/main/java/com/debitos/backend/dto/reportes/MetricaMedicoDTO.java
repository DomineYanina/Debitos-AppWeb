package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Reporte de desempeño por médico / prestador (Tabla a 3 Niveles):
 * Métricas consolidadas por profesional médico, indicadores clave y
 * árbol anidado de motivos de débito y financiadores afectados.
 */
public class MetricaMedicoDTO {

    private String medico;
    private Integer cantidadRegistros = 0;
    private BigDecimal debitosAceptados = BigDecimal.ZERO;
    private BigDecimal debitosRefacturados = BigDecimal.ZERO;
    private BigDecimal totalTramitado = BigDecimal.ZERO;
    private BigDecimal ticketPromedio = BigDecimal.ZERO;
    private BigDecimal tasaRecupero = BigDecimal.ZERO;
    private List<DesgloseMotivoDTO> motivos = new ArrayList<>();

    public MetricaMedicoDTO() {}

    public MetricaMedicoDTO(String medico, Integer cantidadRegistros,
                            BigDecimal debitosAceptados, BigDecimal debitosRefacturados,
                            BigDecimal totalTramitado, BigDecimal ticketPromedio,
                            BigDecimal tasaRecupero, List<DesgloseMotivoDTO> motivos) {
        this.medico = medico;
        this.cantidadRegistros = cantidadRegistros != null ? cantidadRegistros : 0;
        this.debitosAceptados = debitosAceptados != null ? debitosAceptados : BigDecimal.ZERO;
        this.debitosRefacturados = debitosRefacturados != null ? debitosRefacturados : BigDecimal.ZERO;
        this.totalTramitado = totalTramitado != null ? totalTramitado : BigDecimal.ZERO;
        this.ticketPromedio = ticketPromedio != null ? ticketPromedio : BigDecimal.ZERO;
        this.tasaRecupero = tasaRecupero != null ? tasaRecupero : BigDecimal.ZERO;
        this.motivos = motivos != null ? motivos : new ArrayList<>();
    }

    public String getMedico() {
        return medico;
    }

    public void setMedico(String medico) {
        this.medico = medico;
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
}
