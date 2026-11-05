package com.debitos.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PrestacionCandidataDTO {

    private Integer idregistro;
    private String tiporegistro;
    private LocalDate fecha;
    private String paciente;
    private String carnet;
    private String codigo;
    private String descripcion;
    private Integer cantidad;
    private String medico;
    private String efector;
    private String codigoCobertura;
    private String plan;
    private BigDecimal totalNeto;
    private BigDecimal iva;
    private BigDecimal total;
    private String facturaComprobante;
    private Long idcabecera;
    private boolean facturaExisteEnDebitos;

    public PrestacionCandidataDTO() {
    }

    public Integer getIdregistro() {
        return idregistro;
    }

    public void setIdregistro(Integer idregistro) {
        this.idregistro = idregistro;
    }

    public String getTiporegistro() {
        return tiporegistro;
    }

    public void setTiporegistro(String tiporegistro) {
        this.tiporegistro = tiporegistro;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public String getPaciente() {
        return paciente;
    }

    public void setPaciente(String paciente) {
        this.paciente = paciente;
    }

    public String getCarnet() {
        return carnet;
    }

    public void setCarnet(String carnet) {
        this.carnet = carnet;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public String getMedico() {
        return medico;
    }

    public void setMedico(String medico) {
        this.medico = medico;
    }

    public String getEfector() {
        return efector;
    }

    public void setEfector(String efector) {
        this.efector = efector;
    }

    public String getCodigoCobertura() {
        return codigoCobertura;
    }

    public void setCodigoCobertura(String codigoCobertura) {
        this.codigoCobertura = codigoCobertura;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public BigDecimal getTotalNeto() {
        return totalNeto;
    }

    public void setTotalNeto(BigDecimal totalNeto) {
        this.totalNeto = totalNeto;
    }

    public BigDecimal getIva() {
        return iva;
    }

    public void setIva(BigDecimal iva) {
        this.iva = iva;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public String getFacturaComprobante() {
        return facturaComprobante;
    }

    public void setFacturaComprobante(String facturaComprobante) {
        this.facturaComprobante = facturaComprobante;
    }

    public Long getIdcabecera() {
        return idcabecera;
    }

    public void setIdcabecera(Long idcabecera) {
        this.idcabecera = idcabecera;
    }

    public boolean isFacturaExisteEnDebitos() {
        return facturaExisteEnDebitos;
    }

    public void setFacturaExisteEnDebitos(boolean facturaExisteEnDebitos) {
        this.facturaExisteEnDebitos = facturaExisteEnDebitos;
    }
}
