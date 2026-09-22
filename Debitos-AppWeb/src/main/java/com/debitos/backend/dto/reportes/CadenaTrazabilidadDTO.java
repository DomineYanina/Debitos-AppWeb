package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Expediente o cadena de vida de comprobantes vinculados (FC -> NC -> ND -> RC):
 * Contiene los datos macro de la prestación/factura origen y la cronología completa de sus eventos.
 */
public class CadenaTrazabilidadDTO {

    private String idPrestacion;                 // Identificador principal (Comprobante FC o ID)
    private String descripcion;                  // Descripción de la prestación o servicio facturado
    private String financiador;                  // Nombre de la Obra Social / Prepaga
    private String medico;                       // Médico o profesional interviniente
    private BigDecimal montoFacturadoOriginal = BigDecimal.ZERO;
    private BigDecimal totalDebitado = BigDecimal.ZERO;
    private String tipoRegistro;
    private String codigoCobertura;
    private String fechaFactura;
    private List<EventoTrazabilidadDTO> historialEventos = new ArrayList<>();

    public CadenaTrazabilidadDTO() {}

    public CadenaTrazabilidadDTO(String idPrestacion, String descripcion, String financiador,
                                 String medico, BigDecimal montoFacturadoOriginal,
                                 BigDecimal totalDebitado, List<EventoTrazabilidadDTO> historialEventos) {
        this.idPrestacion = idPrestacion;
        this.descripcion = descripcion;
        this.financiador = financiador;
        this.medico = medico;
        this.montoFacturadoOriginal = montoFacturadoOriginal != null ? montoFacturadoOriginal : BigDecimal.ZERO;
        this.totalDebitado = totalDebitado != null ? totalDebitado : BigDecimal.ZERO;
        this.historialEventos = historialEventos != null ? historialEventos : new ArrayList<>();
    }

    public String getIdPrestacion() {
        return idPrestacion;
    }

    public void setIdPrestacion(String idPrestacion) {
        this.idPrestacion = idPrestacion;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getFinanciador() {
        return financiador;
    }

    public void setFinanciador(String financiador) {
        this.financiador = financiador;
    }

    public String getMedico() {
        return medico;
    }

    public void setMedico(String medico) {
        this.medico = medico;
    }

    public BigDecimal getMontoFacturadoOriginal() {
        return montoFacturadoOriginal;
    }

    public void setMontoFacturadoOriginal(BigDecimal montoFacturadoOriginal) {
        this.montoFacturadoOriginal = montoFacturadoOriginal != null ? montoFacturadoOriginal : BigDecimal.ZERO;
    }

    public BigDecimal getTotalDebitado() {
        return totalDebitado;
    }

    public void setTotalDebitado(BigDecimal totalDebitado) {
        this.totalDebitado = totalDebitado != null ? totalDebitado : BigDecimal.ZERO;
    }

    public List<EventoTrazabilidadDTO> getHistorialEventos() {
        return historialEventos;
    }

    public void setHistorialEventos(List<EventoTrazabilidadDTO> historialEventos) {
        this.historialEventos = historialEventos != null ? historialEventos : new ArrayList<>();
    }

    public String getTipoRegistro() {
        return tipoRegistro;
    }

    public void setTipoRegistro(String tipoRegistro) {
        this.tipoRegistro = tipoRegistro;
    }

    public String getCodigoCobertura() {
        return codigoCobertura;
    }

    public void setCodigoCobertura(String codigoCobertura) {
        this.codigoCobertura = codigoCobertura;
    }

    public String getFechaFactura() {
        return fechaFactura;
    }

    public void setFechaFactura(String fechaFactura) {
        this.fechaFactura = fechaFactura;
    }
}
