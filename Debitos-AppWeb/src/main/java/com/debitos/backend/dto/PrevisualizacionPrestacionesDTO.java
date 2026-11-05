package com.debitos.backend.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class PrevisualizacionPrestacionesDTO {

    private int anio;
    private long totalPendientes;
    private long totalAmbulatorios;
    private long totalInternados;
    private long conFacturaEnCabecera;
    private long sinFacturaEnCabecera;
    private BigDecimal sumaTotalNeto = BigDecimal.ZERO;
    private BigDecimal sumaIva = BigDecimal.ZERO;
    private BigDecimal sumaTotal = BigDecimal.ZERO;
    private List<PrestacionCandidataDTO> prestaciones = new ArrayList<>();

    public PrevisualizacionPrestacionesDTO() {
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

    public long getTotalAmbulatorios() {
        return totalAmbulatorios;
    }

    public void setTotalAmbulatorios(long totalAmbulatorios) {
        this.totalAmbulatorios = totalAmbulatorios;
    }

    public long getTotalInternados() {
        return totalInternados;
    }

    public void setTotalInternados(long totalInternados) {
        this.totalInternados = totalInternados;
    }

    public long getConFacturaEnCabecera() {
        return conFacturaEnCabecera;
    }

    public void setConFacturaEnCabecera(long conFacturaEnCabecera) {
        this.conFacturaEnCabecera = conFacturaEnCabecera;
    }

    public long getSinFacturaEnCabecera() {
        return sinFacturaEnCabecera;
    }

    public void setSinFacturaEnCabecera(long sinFacturaEnCabecera) {
        this.sinFacturaEnCabecera = sinFacturaEnCabecera;
    }

    public BigDecimal getSumaTotalNeto() {
        return sumaTotalNeto;
    }

    public void setSumaTotalNeto(BigDecimal sumaTotalNeto) {
        this.sumaTotalNeto = sumaTotalNeto;
    }

    public BigDecimal getSumaIva() {
        return sumaIva;
    }

    public void setSumaIva(BigDecimal sumaIva) {
        this.sumaIva = sumaIva;
    }

    public BigDecimal getSumaTotal() {
        return sumaTotal;
    }

    public void setSumaTotal(BigDecimal sumaTotal) {
        this.sumaTotal = sumaTotal;
    }

    public List<PrestacionCandidataDTO> getPrestaciones() {
        return prestaciones;
    }

    public void setPrestaciones(List<PrestacionCandidataDTO> prestaciones) {
        this.prestaciones = prestaciones;
    }
}
