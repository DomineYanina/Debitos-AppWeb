package com.debitos.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ComprobanteCandidatoDTO {

    private String tipo;
    private String letra;
    private Integer ptovta;
    private Integer numero;
    private String comprobante;
    private LocalDate fecha;
    private LocalDate periodo;
    private BigDecimal debe;
    private BigDecimal haber;
    private String codigoCobertura;
    private String cobertura;
    private String comprobanteAsociado;
    private Long asociadogrupo;
    private Long idAsignacion;
    private String tiporegistro;

    public ComprobanteCandidatoDTO() {
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

    public String getComprobante() {
        return comprobante;
    }

    public void setComprobante(String comprobante) {
        this.comprobante = comprobante;
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

    public BigDecimal getDebe() {
        return debe;
    }

    public void setDebe(BigDecimal debe) {
        this.debe = debe;
    }

    public BigDecimal getHaber() {
        return haber;
    }

    public void setHaber(BigDecimal haber) {
        this.haber = haber;
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

    public String getComprobanteAsociado() {
        return comprobanteAsociado;
    }

    public void setComprobanteAsociado(String comprobanteAsociado) {
        this.comprobanteAsociado = comprobanteAsociado;
    }

    public Long getAsociadogrupo() {
        return asociadogrupo;
    }

    public void setAsociadogrupo(Long asociadogrupo) {
        this.asociadogrupo = asociadogrupo;
    }

    public Long getIdAsignacion() {
        return idAsignacion;
    }

    public void setIdAsignacion(Long idAsignacion) {
        this.idAsignacion = idAsignacion;
    }

    public String getTiporegistro() {
        return tiporegistro;
    }

    public void setTiporegistro(String tiporegistro) {
        this.tiporegistro = tiporegistro;
    }
}
