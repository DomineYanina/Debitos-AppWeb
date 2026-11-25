package com.debitos.backend.dto.contable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

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
    private String tipoRegistro;
    private String comprobanteAsociado;
    private boolean anulada;
    private String origenAnulacion; // "MANUAL" | "GESTION"
    private LocalDateTime fechaAnulacion;
    private String usuarioAnulacion;
    private Long idCabeceraAnulador;
    private String comprobanteAnulador;
    private String tipoAnulador;
    private String letraAnulador;
    private Integer ptovtaAnulador;
    private Integer numeroAnulador;
    private LocalDate fechaAnulador;
    private LocalDate periodoAnulador;
    private String codigoCoberturaAnulador;
    private String coberturaAnulador;
    private BigDecimal importeAnulador;
    private Long asociadogrupoAnulador;
    private String tipoRegistroAnulador;
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

    public String getTipoRegistro() {
        return tipoRegistro;
    }

    public void setTipoRegistro(String tipoRegistro) {
        this.tipoRegistro = tipoRegistro;
    }

    public String getComprobanteAsociado() {
        return comprobanteAsociado;
    }

    public void setComprobanteAsociado(String comprobanteAsociado) {
        this.comprobanteAsociado = comprobanteAsociado;
    }

    public LocalDateTime getFechaAnulacion() {
        return fechaAnulacion;
    }

    public void setFechaAnulacion(LocalDateTime fechaAnulacion) {
        this.fechaAnulacion = fechaAnulacion;
    }

    public String getUsuarioAnulacion() {
        return usuarioAnulacion;
    }

    public void setUsuarioAnulacion(String usuarioAnulacion) {
        this.usuarioAnulacion = usuarioAnulacion;
    }

    public String getTipoAnulador() {
        return tipoAnulador;
    }

    public void setTipoAnulador(String tipoAnulador) {
        this.tipoAnulador = tipoAnulador;
    }

    public String getLetraAnulador() {
        return letraAnulador;
    }

    public void setLetraAnulador(String letraAnulador) {
        this.letraAnulador = letraAnulador;
    }

    public Integer getPtovtaAnulador() {
        return ptovtaAnulador;
    }

    public void setPtovtaAnulador(Integer ptovtaAnulador) {
        this.ptovtaAnulador = ptovtaAnulador;
    }

    public Integer getNumeroAnulador() {
        return numeroAnulador;
    }

    public void setNumeroAnulador(Integer numeroAnulador) {
        this.numeroAnulador = numeroAnulador;
    }

    public LocalDate getFechaAnulador() {
        return fechaAnulador;
    }

    public void setFechaAnulador(LocalDate fechaAnulador) {
        this.fechaAnulador = fechaAnulador;
    }

    public LocalDate getPeriodoAnulador() {
        return periodoAnulador;
    }

    public void setPeriodoAnulador(LocalDate periodoAnulador) {
        this.periodoAnulador = periodoAnulador;
    }

    public String getCodigoCoberturaAnulador() {
        return codigoCoberturaAnulador;
    }

    public void setCodigoCoberturaAnulador(String codigoCoberturaAnulador) {
        this.codigoCoberturaAnulador = codigoCoberturaAnulador;
    }

    public String getCoberturaAnulador() {
        return coberturaAnulador;
    }

    public void setCoberturaAnulador(String coberturaAnulador) {
        this.coberturaAnulador = coberturaAnulador;
    }

    public BigDecimal getImporteAnulador() {
        return importeAnulador;
    }

    public void setImporteAnulador(BigDecimal importeAnulador) {
        this.importeAnulador = importeAnulador;
    }

    public Long getAsociadogrupoAnulador() {
        return asociadogrupoAnulador;
    }

    public void setAsociadogrupoAnulador(Long asociadogrupoAnulador) {
        this.asociadogrupoAnulador = asociadogrupoAnulador;
    }

    public String getTipoRegistroAnulador() {
        return tipoRegistroAnulador;
    }

    public void setTipoRegistroAnulador(String tipoRegistroAnulador) {
        this.tipoRegistroAnulador = tipoRegistroAnulador;
    }
}
