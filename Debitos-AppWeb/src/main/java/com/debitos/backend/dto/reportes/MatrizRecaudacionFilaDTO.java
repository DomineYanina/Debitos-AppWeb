package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;
import java.util.Arrays;

/**
 * Fila de la Matriz Anual de Recaudación: representa a un Financiador con
 * los montos cobrados en cada uno de los 12 meses del año (índices 0 a 11)
 * y el total anual recaudado.
 */
public class MatrizRecaudacionFilaDTO {

    private String financiador;
    private BigDecimal[] meses;
    private BigDecimal totalAnual;

    public MatrizRecaudacionFilaDTO() {
        this.meses = inicializarArrayMeses();
        this.totalAnual = BigDecimal.ZERO;
    }

    public MatrizRecaudacionFilaDTO(String financiador) {
        this.financiador = financiador;
        this.meses = inicializarArrayMeses();
        this.totalAnual = BigDecimal.ZERO;
    }

    public MatrizRecaudacionFilaDTO(String financiador, BigDecimal[] meses, BigDecimal totalAnual) {
        this.financiador = financiador;
        this.meses = meses != null ? meses : inicializarArrayMeses();
        this.totalAnual = totalAnual != null ? totalAnual : BigDecimal.ZERO;
    }

    public static BigDecimal[] inicializarArrayMeses() {
        BigDecimal[] arr = new BigDecimal[12];
        Arrays.fill(arr, BigDecimal.ZERO);
        return arr;
    }

    public String getFinanciador() {
        return financiador;
    }

    public void setFinanciador(String financiador) {
        this.financiador = financiador;
    }

    public BigDecimal[] getMeses() {
        return meses;
    }

    public void setMeses(BigDecimal[] meses) {
        this.meses = meses;
    }

    public BigDecimal getTotalAnual() {
        return totalAnual;
    }

    public void setTotalAnual(BigDecimal totalAnual) {
        this.totalAnual = totalAnual;
    }
}
