package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;

/**
 * Evento individual dentro del ciclo de vida o historial de un comprobante/expediente:
 * (Emisión inicial FC, Débito recibido NC, Refacturación / Incremento ND, Cobranza RC).
 */
public class EventoTrazabilidadDTO {

    private String tipo;          // FC, NC, ND, RC
    private String comprobante;   // Letra Ptovta-Numero
    private String fecha;         // YYYY-MM-DD
    private BigDecimal monto = BigDecimal.ZERO;
    private String descripcion;   // 'Emisión inicial', 'Débito recibido', 'Refacturación', etc.
    private String responsable;   // Operador o analista responsable
    private String tipoRegistro;  // Ambulatorios / Internados (AMB / INT)

    public EventoTrazabilidadDTO() {}

    public EventoTrazabilidadDTO(String tipo, String comprobante, String fecha, BigDecimal monto,
                                 String descripcion, String responsable) {
        this(tipo, comprobante, fecha, monto, descripcion, responsable, null);
    }

    public EventoTrazabilidadDTO(String tipo, String comprobante, String fecha, BigDecimal monto,
                                 String descripcion, String responsable, String tipoRegistro) {
        this.tipo = tipo;
        this.comprobante = comprobante;
        this.fecha = fecha;
        this.monto = monto != null ? monto : BigDecimal.ZERO;
        this.descripcion = descripcion;
        this.responsable = responsable;
        this.tipoRegistro = tipoRegistro;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getComprobante() {
        return comprobante;
    }

    public void setComprobante(String comprobante) {
        this.comprobante = comprobante;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto != null ? monto : BigDecimal.ZERO;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getResponsable() {
        return responsable;
    }

    public void setResponsable(String responsable) {
        this.responsable = responsable;
    }

    public String getTipoRegistro() {
        return tipoRegistro;
    }

    public void setTipoRegistro(String tipoRegistro) {
        this.tipoRegistro = tipoRegistro;
    }
}
