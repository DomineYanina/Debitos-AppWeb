package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Nivel 1 (raíz) del árbol de Cuenta Corriente: representa una entidad financiadora
 * (Obra Social, Prepaga, Mutual) con la suma total de sus montos financieros y sus períodos asociados.
 */
public class CcFinanciadorDTO {

    private String financiador;
    private BigDecimal facturacionFc = BigDecimal.ZERO;
    private BigDecimal incrementosNd = BigDecimal.ZERO;
    private BigDecimal debitosNc = BigDecimal.ZERO;
    private BigDecimal refacturacionNd = BigDecimal.ZERO;
    private BigDecimal cobranzasRc = BigDecimal.ZERO;
    private BigDecimal saldo = BigDecimal.ZERO;
    private List<CcPeriodoDTO> periodos = new ArrayList<>();

    public CcFinanciadorDTO() {}

    public CcFinanciadorDTO(String financiador) {
        this.financiador = financiador;
    }

    public CcFinanciadorDTO(String financiador, BigDecimal facturacionFc, BigDecimal incrementosNd,
                            BigDecimal debitosNc, BigDecimal refacturacionNd,
                            BigDecimal cobranzasRc, BigDecimal saldo,
                            List<CcPeriodoDTO> periodos) {
        this.financiador = financiador;
        this.facturacionFc = facturacionFc != null ? facturacionFc : BigDecimal.ZERO;
        this.incrementosNd = incrementosNd != null ? incrementosNd : BigDecimal.ZERO;
        this.debitosNc = debitosNc != null ? debitosNc : BigDecimal.ZERO;
        this.refacturacionNd = refacturacionNd != null ? refacturacionNd : BigDecimal.ZERO;
        this.cobranzasRc = cobranzasRc != null ? cobranzasRc : BigDecimal.ZERO;
        this.saldo = saldo != null ? saldo : BigDecimal.ZERO;
        this.periodos = periodos != null ? periodos : new ArrayList<>();
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

    public List<CcPeriodoDTO> getPeriodos() {
        return periodos;
    }

    public void setPeriodos(List<CcPeriodoDTO> periodos) {
        this.periodos = periodos;
    }
}
