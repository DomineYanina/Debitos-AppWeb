package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;

public class PuntoDonutDTO {
    private String etiqueta; // "COD - Nombre"
    private BigDecimal saldo;

    public PuntoDonutDTO() {
    }

    public PuntoDonutDTO(String etiqueta, BigDecimal saldo) {
        this.etiqueta = etiqueta;
        this.saldo = saldo;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    public void setEtiqueta(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public BigDecimal getSaldo() {
        return saldo;
    }

    public void setSaldo(BigDecimal saldo) {
        this.saldo = saldo;
    }
}
