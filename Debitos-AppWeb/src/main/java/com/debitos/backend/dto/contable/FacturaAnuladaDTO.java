package com.debitos.backend.dto.contable;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FacturaAnuladaDTO {
    private Long idCabecera;
    private Long asociadogrupo;
    private String comprobante;
    private String tipo;
    private String letra;
    private Integer ptovta;
    private Integer numero;
    private LocalDate fecha;
    private LocalDate periodo;
    private String codigoCobertura;
    private String cobertura;
    private BigDecimal importe;
    private boolean anulada;
    private String origenAnulacion; // "MANUAL" | "GESTION"
    private Long idCabeceraAnulador;
    private String comprobanteAnulador;
    private boolean tieneSolicitudAnulacion;
    private Long idNotificacionSolicitud;
    private String usuarioSolicitante;
    private String motivoSolicitudAnulacion;

    public FacturaAnuladaDTO() {}

    public Long getIdCabecera() {
        return idCabecera;
    }

    public void setIdCabecera(Long idCabecera) {
        this.idCabecera = idCabecera;
    }

    public Long getAsociadogrupo() {
        return asociadogrupo;
    }

    public void setAsociadogrupo(Long asociadogrupo) {
        this.asociadogrupo = asociadogrupo;
    }

    public String getComprobante() {
        return comprobante;
    }

    public void setComprobante(String comprobante) {
        this.comprobante = comprobante;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getLetra() {
        return letra;
    }

    public void setLetra(String letra) {
        this.letra = letra;
    }

    public Integer getPtovta() {
        return ptovta;
    }

    public void setPtovta(Integer ptovta) {
        this.ptovta = ptovta;
    }

    public Integer getNumero() {
        return numero;
    }

    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public LocalDate getPeriodo() {
        return periodo;
    }

    public void setPeriodo(LocalDate periodo) {
        this.periodo = periodo;
    }

    public String getCodigoCobertura() {
        return codigoCobertura;
    }

    public void setCodigoCobertura(String codigoCobertura) {
        this.codigoCobertura = codigoCobertura;
    }

    public String getCobertura() {
        return cobertura;
    }

    public void setCobertura(String cobertura) {
        this.cobertura = cobertura;
    }

    public BigDecimal getImporte() {
        return importe;
    }

    public void setImporte(BigDecimal importe) {
        this.importe = importe;
    }

    public boolean isAnulada() {
        return anulada;
    }

    public void setAnulada(boolean anulada) {
        this.anulada = anulada;
    }

    public String getOrigenAnulacion() {
        return origenAnulacion;
    }

    public void setOrigenAnulacion(String origenAnulacion) {
        this.origenAnulacion = origenAnulacion;
    }

    public Long getIdCabeceraAnulador() {
        return idCabeceraAnulador;
    }

    public void setIdCabeceraAnulador(Long idCabeceraAnulador) {
        this.idCabeceraAnulador = idCabeceraAnulador;
    }

    public String getComprobanteAnulador() {
        return comprobanteAnulador;
    }

    public void setComprobanteAnulador(String comprobanteAnulador) {
        this.comprobanteAnulador = comprobanteAnulador;
    }

    public boolean isTieneSolicitudAnulacion() {
        return tieneSolicitudAnulacion;
    }

    public void setTieneSolicitudAnulacion(boolean tieneSolicitudAnulacion) {
        this.tieneSolicitudAnulacion = tieneSolicitudAnulacion;
    }

    public Long getIdNotificacionSolicitud() {
        return idNotificacionSolicitud;
    }

    public void setIdNotificacionSolicitud(Long idNotificacionSolicitud) {
        this.idNotificacionSolicitud = idNotificacionSolicitud;
    }

    public String getUsuarioSolicitante() {
        return usuarioSolicitante;
    }

    public void setUsuarioSolicitante(String usuarioSolicitante) {
        this.usuarioSolicitante = usuarioSolicitante;
    }

    public String getMotivoSolicitudAnulacion() {
        return motivoSolicitudAnulacion;
    }

    public void setMotivoSolicitudAnulacion(String motivoSolicitudAnulacion) {
        this.motivoSolicitudAnulacion = motivoSolicitudAnulacion;
    }
}
