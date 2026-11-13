package com.debitos.backend.dto.directorio;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

public class DirectorioPrestacionesResponseDTO {
    private long totalRegistros;
    private BigDecimal totalMontoFacturado = BigDecimal.ZERO;
    private long cantidadMedicos;
    private long cantidadPacientes;
    private int paginaActual;
    private int totalPaginas;
    private int tamanioPagina;
    private List<DirectorioPrestacionItemDTO> items = Collections.emptyList();

    public DirectorioPrestacionesResponseDTO() {}

    public DirectorioPrestacionesResponseDTO(long totalRegistros, BigDecimal totalMontoFacturado,
                                          long cantidadMedicos, long cantidadPacientes,
                                          int paginaActual, int totalPaginas, int tamanioPagina,
                                          List<DirectorioPrestacionItemDTO> items) {
        this.totalRegistros = totalRegistros;
        this.totalMontoFacturado = totalMontoFacturado != null ? totalMontoFacturado : BigDecimal.ZERO;
        this.cantidadMedicos = cantidadMedicos;
        this.cantidadPacientes = cantidadPacientes;
        this.paginaActual = paginaActual;
        this.totalPaginas = totalPaginas;
        this.tamanioPagina = tamanioPagina;
        this.items = items != null ? items : Collections.emptyList();
    }

    public long getTotalRegistros() {
        return totalRegistros;
    }

    public void setTotalRegistros(long totalRegistros) {
        this.totalRegistros = totalRegistros;
    }

    public BigDecimal getTotalMontoFacturado() {
        return totalMontoFacturado;
    }

    public void setTotalMontoFacturado(BigDecimal totalMontoFacturado) {
        this.totalMontoFacturado = totalMontoFacturado;
    }

    public long getCantidadMedicos() {
        return cantidadMedicos;
    }

    public void setCantidadMedicos(long cantidadMedicos) {
        this.cantidadMedicos = cantidadMedicos;
    }

    public long getCantidadPacientes() {
        return cantidadPacientes;
    }

    public void setCantidadPacientes(long cantidadPacientes) {
        this.cantidadPacientes = cantidadPacientes;
    }

    public int getPaginaActual() {
        return paginaActual;
    }

    public void setPaginaActual(int paginaActual) {
        this.paginaActual = paginaActual;
    }

    public int getTotalPaginas() {
        return totalPaginas;
    }

    public void setTotalPaginas(int totalPaginas) {
        this.totalPaginas = totalPaginas;
    }

    public int getTamanioPagina() {
        return tamanioPagina;
    }

    public void setTamanioPagina(int tamanioPagina) {
        this.tamanioPagina = tamanioPagina;
    }

    public List<DirectorioPrestacionItemDTO> getItems() {
        return items;
    }

    public void setItems(List<DirectorioPrestacionItemDTO> items) {
        this.items = items;
    }
}
