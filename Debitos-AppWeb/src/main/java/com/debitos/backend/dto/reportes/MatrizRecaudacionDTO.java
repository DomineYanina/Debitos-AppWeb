package com.debitos.backend.dto.reportes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * DTO contenedor de la Matriz Anual de Recaudación:
 * Cruce de financiadores contra los 12 meses de un año,
 * con totales por mes y gran total anual recaudado.
 */
public class MatrizRecaudacionDTO {

    private Integer anioSeleccionado;
    private List<Integer> aniosDisponibles = new ArrayList<>();
    private List<MatrizRecaudacionFilaDTO> filas = new ArrayList<>();
    private BigDecimal[] totalesMes = inicializarArrayMeses();
    private BigDecimal granTotal = BigDecimal.ZERO;

    public MatrizRecaudacionDTO() {}

    public MatrizRecaudacionDTO(Integer anioSeleccionado, List<Integer> aniosDisponibles,
                                List<MatrizRecaudacionFilaDTO> filas, BigDecimal[] totalesMes,
                                BigDecimal granTotal) {
        this.anioSeleccionado = anioSeleccionado;
        this.aniosDisponibles = aniosDisponibles != null ? aniosDisponibles : new ArrayList<>();
        this.filas = filas != null ? filas : new ArrayList<>();
        this.totalesMes = totalesMes != null ? totalesMes : inicializarArrayMeses();
        this.granTotal = granTotal != null ? granTotal : BigDecimal.ZERO;
    }

    public static BigDecimal[] inicializarArrayMeses() {
        BigDecimal[] arr = new BigDecimal[12];
        Arrays.fill(arr, BigDecimal.ZERO);
        return arr;
    }

    public Integer getAnioSeleccionado() {
        return anioSeleccionado;
    }

    public void setAnioSeleccionado(Integer anioSeleccionado) {
        this.anioSeleccionado = anioSeleccionado;
    }

    public List<Integer> getAniosDisponibles() {
        return aniosDisponibles;
    }

    public void setAniosDisponibles(List<Integer> aniosDisponibles) {
        this.aniosDisponibles = aniosDisponibles;
    }

    public List<MatrizRecaudacionFilaDTO> getFilas() {
        return filas;
    }

    public void setFilas(List<MatrizRecaudacionFilaDTO> filas) {
        this.filas = filas;
    }

    public BigDecimal[] getTotalesMes() {
        return totalesMes;
    }

    public void setTotalesMes(BigDecimal[] totalesMes) {
        this.totalesMes = totalesMes;
    }

    public BigDecimal getGranTotal() {
        return granTotal;
    }

    public void setGranTotal(BigDecimal granTotal) {
        this.granTotal = granTotal;
    }
}
