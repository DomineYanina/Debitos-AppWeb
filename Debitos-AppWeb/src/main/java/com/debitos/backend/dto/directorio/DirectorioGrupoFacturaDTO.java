package com.debitos.backend.dto.directorio;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class DirectorioGrupoFacturaDTO {
    private Long id;
    private String tipo;
    private String letra;
    private Integer ptovta;
    private Integer numero;
    private LocalDate fecha;
    private LocalDate periodo;
    private String codigoCobertura;
    private String cobertura;
    private Long asociadogrupo;
    private BigDecimal totalFacturado = BigDecimal.ZERO;
    private BigDecimal totalDebitadoAceptado = BigDecimal.ZERO;
    private BigDecimal totalDebitadoNoAceptado = BigDecimal.ZERO;
    private BigDecimal totalCobranza = BigDecimal.ZERO;
    private int cantidadRefacturaciones = 0;
    private Integer idEstado = 1;
    private List<DirectorioComprobanteDTO> comprobantesDerivados = new ArrayList<>();

    public DirectorioGrupoFacturaDTO() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getLetra() {
        return letra;
    }

    public void setLetra(String letra) {
        this.letra = letra;
    }

    public Integer getPtovta() {
        return ptovta;
    }

    public void setPtovta(Integer ptovta) {
        this.ptovta = ptovta;
    }

    public Integer getNumero() {
        return numero;
    }

    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public LocalDate getPeriodo() {
        return periodo;
    }

    public void setPeriodo(LocalDate periodo) {
        this.periodo = periodo;
    }

    public String getCodigoCobertura() {
        return codigoCobertura;
    }

    public void setCodigoCobertura(String codigoCobertura) {
        this.codigoCobertura = codigoCobertura;
    }

    public String getCobertura() {
        return cobertura;
    }

    public void setCobertura(String cobertura) {
        this.cobertura = cobertura;
    }

    public Long getAsociadogrupo() {
        return asociadogrupo;
    }

    public void setAsociadogrupo(Long asociadogrupo) {
        this.asociadogrupo = asociadogrupo;
    }

    public BigDecimal getTotalFacturado() {
        return totalFacturado;
    }

    public void setTotalFacturado(BigDecimal totalFacturado) {
        this.totalFacturado = totalFacturado;
    }

    public BigDecimal getTotalDebitadoAceptado() {
        return totalDebitadoAceptado;
    }

    public void setTotalDebitadoAceptado(BigDecimal totalDebitadoAceptado) {
        this.totalDebitadoAceptado = totalDebitadoAceptado;
    }

    public BigDecimal getTotalDebitadoNoAceptado() {
        return totalDebitadoNoAceptado;
    }

    public void setTotalDebitadoNoAceptado(BigDecimal totalDebitadoNoAceptado) {
        this.totalDebitadoNoAceptado = totalDebitadoNoAceptado;
    }

    public BigDecimal getTotalCobranza() {
        return totalCobranza;
    }

    public void setTotalCobranza(BigDecimal totalCobranza) {
        this.totalCobranza = totalCobranza;
    }

    public int getCantidadRefacturaciones() {
        return cantidadRefacturaciones;
    }

    public void setCantidadRefacturaciones(int cantidadRefacturaciones) {
        this.cantidadRefacturaciones = cantidadRefacturaciones;
    }

    public Integer getIdEstado() {
        return idEstado;
    }

    public void setIdEstado(Integer idEstado) {
        this.idEstado = idEstado;
    }

    public List<DirectorioComprobanteDTO> getComprobantesDerivados() {
        return comprobantesDerivados;
    }

    public void setComprobantesDerivados(List<DirectorioComprobanteDTO> comprobantesDerivados) {
        this.comprobantesDerivados = comprobantesDerivados;
    }
}
