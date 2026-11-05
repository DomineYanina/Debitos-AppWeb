package com.debitos.backend.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class PrevisualizacionSincronizacionDTO {

    private int anio;
    private long totalPendientes;
    private Map<String, Long> desglosePorTipo = new LinkedHashMap<>();
    private BigDecimal totalDebe = BigDecimal.ZERO;
    private BigDecimal totalHaber = BigDecimal.ZERO;
    private List<ComprobanteCandidatoDTO> comprobantes = new ArrayList<>();

    public PrevisualizacionSincronizacionDTO() {
    }

    public int getAnio() {
        return anio;
    }

    public void setAnio(int anio) {
        this.anio = anio;
    }

    public long getTotalPendientes() {
        return totalPendientes;
    }

    public void setTotalPendientes(long totalPendientes) {
        this.totalPendientes = totalPendientes;
    }

    public Map<String, Long> getDesglosePorTipo() {
        return desglosePorTipo;
    }

    public void setDesglosePorTipo(Map<String, Long> desglosePorTipo) {
        this.desglosePorTipo = desglosePorTipo;
    }

    public BigDecimal getTotalDebe() {
        return totalDebe;
    }

    public void setTotalDebe(BigDecimal totalDebe) {
        this.totalDebe = totalDebe;
    }

    public BigDecimal getTotalHaber() {
        return totalHaber;
    }

    public void setTotalHaber(BigDecimal totalHaber) {
        this.totalHaber = totalHaber;
    }

    public List<ComprobanteCandidatoDTO> getComprobantes() {
        return comprobantes;
    }

    public void setComprobantes(List<ComprobanteCandidatoDTO> comprobantes) {
        this.comprobantes = comprobantes;
    }
}
