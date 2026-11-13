package com.debitos.backend.dto.directorio;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DirectorioPrestacionItemDTO {
    private Integer id;
    private String tipoDoc;
    private String letraDoc;
    private Integer ptovtaDoc;
    private Integer numeroDoc;
    private LocalDate fechaPrestacion;
    private LocalDate fechaDoc;
    private String paciente;
    private String carnet;
    private String plan;
    private String codigoPrestacion;
    private String descripcionPrestacion;
    private String especialidad;
    private Integer cantidad;
    private BigDecimal importeTotal = BigDecimal.ZERO;
    private String medico;
    private String cobertura;
    private String tipoRegistro;

    public DirectorioPrestacionItemDTO() {}

    public DirectorioPrestacionItemDTO(Integer id, String tipoDoc, String letraDoc, Integer ptovtaDoc, Integer numeroDoc,
                                     LocalDate fechaPrestacion, LocalDate fechaDoc, String paciente, String carnet,
                                     String plan, String codigoPrestacion, String descripcionPrestacion,
                                     String especialidad, Integer cantidad, BigDecimal importeTotal,
                                     String medico, String cobertura, String tipoRegistro) {
        this.id = id;
        this.tipoDoc = tipoDoc;
        this.letraDoc = letraDoc;
        this.ptovtaDoc = ptovtaDoc;
        this.numeroDoc = numeroDoc;
        this.fechaPrestacion = fechaPrestacion;
        this.fechaDoc = fechaDoc;
        this.paciente = paciente;
        this.carnet = carnet;
        this.plan = plan;
        this.codigoPrestacion = codigoPrestacion;
        this.descripcionPrestacion = descripcionPrestacion;
        this.especialidad = especialidad;
        this.cantidad = cantidad != null ? cantidad : 1;
        this.importeTotal = importeTotal != null ? importeTotal : BigDecimal.ZERO;
        this.medico = medico;
        this.cobertura = cobertura;
        this.tipoRegistro = tipoRegistro;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTipoDoc() {
        return tipoDoc;
    }

    public void setTipoDoc(String tipoDoc) {
        this.tipoDoc = tipoDoc;
    }

    public String getLetraDoc() {
        return letraDoc;
    }

    public void setLetraDoc(String letraDoc) {
        this.letraDoc = letraDoc;
    }

    public Integer getPtovtaDoc() {
        return ptovtaDoc;
    }

    public void setPtovtaDoc(Integer ptovtaDoc) {
        this.ptovtaDoc = ptovtaDoc;
    }

    public Integer getNumeroDoc() {
        return numeroDoc;
    }

    public void setNumeroDoc(Integer numeroDoc) {
        this.numeroDoc = numeroDoc;
    }

    public LocalDate getFechaPrestacion() {
        return fechaPrestacion;
    }

    public void setFechaPrestacion(LocalDate fechaPrestacion) {
        this.fechaPrestacion = fechaPrestacion;
    }

    public LocalDate getFechaDoc() {
        return fechaDoc;
    }

    public void setFechaDoc(LocalDate fechaDoc) {
        this.fechaDoc = fechaDoc;
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

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public String getCodigoPrestacion() {
        return codigoPrestacion;
    }

    public void setCodigoPrestacion(String codigoPrestacion) {
        this.codigoPrestacion = codigoPrestacion;
    }

    public String getDescripcionPrestacion() {
        return descripcionPrestacion;
    }

    public void setDescripcionPrestacion(String descripcionPrestacion) {
        this.descripcionPrestacion = descripcionPrestacion;
    }

    public String getEspecialidad() {
        return especialidad;
    }

    public void setEspecialidad(String especialidad) {
        this.especialidad = especialidad;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getImporteTotal() {
        return importeTotal;
    }

    public void setImporteTotal(BigDecimal importeTotal) {
        this.importeTotal = importeTotal;
    }

    public String getMedico() {
        return medico;
    }

    public void setMedico(String medico) {
        this.medico = medico;
    }

    public String getCobertura() {
        return cobertura;
    }

    public void setCobertura(String cobertura) {
        this.cobertura = cobertura;
    }

    public String getTipoRegistro() {
        return tipoRegistro;
    }

    public void setTipoRegistro(String tipoRegistro) {
        this.tipoRegistro = tipoRegistro;
    }
}
