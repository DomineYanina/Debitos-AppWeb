package com.debitos.backend.dto;

import java.math.BigDecimal;

public class FilaHistorialDTO {
    private String tipoDocumento;
    private String letra;
    private Integer puntoVenta;
    private Integer numero;
    private String fechaDocumento;
    private BigDecimal montoNeto;

    public FilaHistorialDTO() {}

    public FilaHistorialDTO(String tipoDocumento, String letra, Integer puntoVenta, Integer numero, String fechaDocumento, BigDecimal montoNeto) {
        this.tipoDocumento = tipoDocumento;
        this.letra = letra;
        this.puntoVenta = puntoVenta;
        this.numero = numero;
        this.fechaDocumento = fechaDocumento;
        this.montoNeto = montoNeto;
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
}
