package com.debitos.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ComprobanteSinAsociarDTO {

    private Long id;
    private String tipo;
    private String letra;
    private Integer ptovta;
    private Integer numero;
    private String comprobante;
    private LocalDate fecha;
    private LocalDate periodo;
    private BigDecimal debe;
    private BigDecimal haber;
    private BigDecimal importe;
    private String codigoCobertura;
    private String cobertura;
    private String origen;
    private String comprobanteAsociado;
    private Long asociadogrupo;

    public ComprobanteSinAsociarDTO() {
    }

    public ComprobanteSinAsociarDTO(Long id, String tipo, String letra, Integer ptovta, Integer numero,
                                    String comprobante, LocalDate fecha, LocalDate periodo,
                                    BigDecimal debe, BigDecimal haber, String codigoCobertura,
                                    String cobertura, String origen, String comprobanteAsociado,
                                    Long asociadogrupo) {
        this.id = id;
        this.tipo = tipo != null ? tipo.trim() : null;
        this.letra = letra != null ? letra.trim() : null;
        this.ptovta = ptovta;
        this.numero = numero;
        this.comprobante = comprobante;
        if (this.comprobante == null || this.comprobante.trim().isEmpty()) {
            if (this.tipo != null && this.tipo.toUpperCase().startsWith("RC")) {
                this.comprobante = this.numero != null ? String.valueOf(this.numero) : this.tipo.toUpperCase();
            } else {
                String let = (this.letra != null && !this.letra.trim().isEmpty()) ? this.letra.trim().toUpperCase() : "A";
                this.comprobante = String.format("%s %s%04d-%08d",
                        this.tipo != null ? this.tipo.toUpperCase() : "NC",
                        let,
                        this.ptovta != null ? this.ptovta : 0,
                        this.numero != null ? this.numero : 0);
            }
        }
        this.fecha = fecha;
        this.periodo = periodo;
        this.debe = debe != null ? debe : BigDecimal.ZERO;
        this.haber = haber != null ? haber : BigDecimal.ZERO;
        this.importe = this.haber.compareTo(BigDecimal.ZERO) > 0 ? this.haber : this.debe;
        this.codigoCobertura = codigoCobertura != null ? codigoCobertura.trim() : null;
        this.cobertura = cobertura != null ? cobertura.trim() : null;
        this.origen = origen != null ? origen.trim() : null;
        this.comprobanteAsociado = comprobanteAsociado != null ? comprobanteAsociado.trim() : null;
        this.asociadogrupo = asociadogrupo;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public BigDecimal getImporte() {
        return importe;
    }

    public void setImporte(BigDecimal importe) {
        this.importe = importe;
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

    public String getOrigen() {
        return origen;
    }

    public void setOrigen(String origen) {
        this.origen = origen;
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
}
