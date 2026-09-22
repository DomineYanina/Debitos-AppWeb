package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Nivel 2 del árbol de Cuenta Corriente: representa un período mensual (YYYY-MM)
 * con la acumulación de montos financieros y la lista de comprobantes que lo componen.
 */
public class CcPeriodoDTO {

    private String periodo;
    private BigDecimal facturacionFc = BigDecimal.ZERO;
    private BigDecimal incrementosNd = BigDecimal.ZERO;
    private BigDecimal debitosNc = BigDecimal.ZERO;
    private BigDecimal refacturacionNd = BigDecimal.ZERO;
    private BigDecimal cobranzasRc = BigDecimal.ZERO;
    private BigDecimal saldo = BigDecimal.ZERO;
    private List<CcComprobanteDTO> comprobantes = new ArrayList<>();

    public CcPeriodoDTO() {}

    public CcPeriodoDTO(String periodo) {
        this.periodo = periodo;
    }

    public CcPeriodoDTO(String periodo, BigDecimal facturacionFc, BigDecimal incrementosNd,
                        BigDecimal debitosNc, BigDecimal refacturacionNd,
                        BigDecimal cobranzasRc, BigDecimal saldo,
                        List<CcComprobanteDTO> comprobantes) {
        this.periodo = periodo;
        this.facturacionFc = facturacionFc != null ? facturacionFc : BigDecimal.ZERO;
        this.incrementosNd = incrementosNd != null ? incrementosNd : BigDecimal.ZERO;
        this.debitosNc = debitosNc != null ? debitosNc : BigDecimal.ZERO;
        this.refacturacionNd = refacturacionNd != null ? refacturacionNd : BigDecimal.ZERO;
        this.cobranzasRc = cobranzasRc != null ? cobranzasRc : BigDecimal.ZERO;
        this.saldo = saldo != null ? saldo : BigDecimal.ZERO;
        this.comprobantes = comprobantes != null ? comprobantes : new ArrayList<>();
    }

    public String getPeriodo() {
        return periodo;
    }

    public void setPeriodo(String periodo) {
        this.periodo = periodo;
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

    public BigDecimal getRefacturacionNd() {
        return refacturacionNd;
    }

    public void setRefacturacionNd(BigDecimal refacturacionNd) {
        this.refacturacionNd = refacturacionNd;
    }

    public BigDecimal getCobranzasRc() {
        return cobranzasRc;
    }

    public void setCobranzasRc(BigDecimal cobranzasRc) {
        this.cobranzasRc = cobranzasRc;
    }

    public BigDecimal getSaldo() {
        return saldo;
    }

    public void setSaldo(BigDecimal saldo) {
        this.saldo = saldo;
    }

    public List<CcComprobanteDTO> getComprobantes() {
        return comprobantes;
    }

    public void setComprobantes(List<CcComprobanteDTO> comprobantes) {
        this.comprobantes = comprobantes;
    }
}
