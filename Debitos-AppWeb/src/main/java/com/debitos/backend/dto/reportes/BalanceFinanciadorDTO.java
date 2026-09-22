package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;

public class BalanceFinanciadorDTO {
    private String financiador; // Formato: "COD - Nombre"
    private BigDecimal facturacionFc;
    private BigDecimal incrementosNd;
    private BigDecimal debitosNc;
    private BigDecimal refacturadoNd;
    private BigDecimal cobradoRc;
    private BigDecimal saldoPendiente;

    public BalanceFinanciadorDTO() {
    }

    public BalanceFinanciadorDTO(String financiador, BigDecimal facturacionFc, BigDecimal incrementosNd,
                                 BigDecimal debitosNc, BigDecimal refacturadoNd, BigDecimal cobradoRc,
                                 BigDecimal saldoPendiente) {
        this.financiador = financiador;
        this.facturacionFc = facturacionFc;
        this.incrementosNd = incrementosNd;
        this.debitosNc = debitosNc;
        this.refacturadoNd = refacturadoNd;
        this.cobradoRc = cobradoRc;
        this.saldoPendiente = saldoPendiente;
    }

    public String getFinanciador() {
        return financiador;
    }

    public void setFinanciador(String financiador) {
        this.financiador = financiador;
    }

    public BigDecimal getFacturacionFc() {
        return facturacionFc;
    }

    public void setFacturacionFc(BigDecimal facturacionFc) {
        this.facturacionFc = facturacionFc;
    }

    public BigDecimal getIncrementosNd() {
        return incrementosNd;
    }

    public void setIncrementosNd(BigDecimal incrementosNd) {
        this.incrementosNd = incrementosNd;
    }

    public BigDecimal getDebitosNc() {
        return debitosNc;
    }

    public void setDebitosNc(BigDecimal debitosNc) {
        this.debitosNc = debitosNc;
    }

    public BigDecimal getRefacturadoNd() {
        return refacturadoNd;
    }

    public void setRefacturadoNd(BigDecimal refacturadoNd) {
        this.refacturadoNd = refacturadoNd;
    }

    public BigDecimal getCobradoRc() {
        return cobradoRc;
    }

    public void setCobradoRc(BigDecimal cobradoRc) {
        this.cobradoRc = cobradoRc;
    }

    public BigDecimal getSaldoPendiente() {
        return saldoPendiente;
    }

    public void setSaldoPendiente(BigDecimal saldoPendiente) {
        this.saldoPendiente = saldoPendiente;
    }
}
