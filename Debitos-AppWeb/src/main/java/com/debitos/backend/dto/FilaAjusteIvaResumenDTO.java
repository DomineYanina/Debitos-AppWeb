package com.debitos.backend.dto;

import java.math.BigDecimal;

public class FilaAjusteIvaResumenDTO {
    private String tipoDocumento;
    private String letra;
    private Integer puntoVenta;
    private Integer numero;
    private String fechaDocumento;
    private BigDecimal montoNeto;
    private BigDecimal porcentajeIva;
    private BigDecimal montoIva;

    public FilaAjusteIvaResumenDTO() {}

    public FilaAjusteIvaResumenDTO(String tipoDocumento, String letra, Integer puntoVenta, Integer numero, String fechaDocumento, BigDecimal montoNeto, BigDecimal porcentajeIva, BigDecimal montoIva) {
        this.tipoDocumento = tipoDocumento;
        this.letra = letra;
        this.puntoVenta = puntoVenta;
        this.numero = numero;
        this.fechaDocumento = fechaDocumento;
        this.montoNeto = montoNeto;
        this.porcentajeIva = porcentajeIva;
        this.montoIva = montoIva;
    }

    public String getTipoDocumento() { return tipoDocumento; }
    public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }

    public String getLetra() { return letra; }
    public void setLetra(String letra) { this.letra = letra; }

    public Integer getPuntoVenta() { return puntoVenta; }
    public void setPuntoVenta(Integer puntoVenta) { this.puntoVenta = puntoVenta; }

    public Integer getNumero() { return numero; }
    public void setNumero(Integer numero) { this.numero = numero; }

    public String getFechaDocumento() { return fechaDocumento; }
    public void setFechaDocumento(String fechaDocumento) { this.fechaDocumento = fechaDocumento; }

    public BigDecimal getMontoNeto() { return montoNeto; }
    public void setMontoNeto(BigDecimal montoNeto) { this.montoNeto = montoNeto; }

    public BigDecimal getPorcentajeIva() { return porcentajeIva; }
    public void setPorcentajeIva(BigDecimal porcentajeIva) { this.porcentajeIva = porcentajeIva; }

    public BigDecimal getMontoIva() { return montoIva; }
    public void setMontoIva(BigDecimal montoIva) { this.montoIva = montoIva; }
}
