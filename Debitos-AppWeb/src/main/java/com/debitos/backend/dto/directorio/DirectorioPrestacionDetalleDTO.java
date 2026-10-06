package com.debitos.backend.dto.directorio;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DirectorioPrestacionDetalleDTO {
    private Integer id;
    private String paciente;
    private String carnet;
    private String plan;
    private String efector;
    private String medico;
    private LocalDate fechaPrestacion;
    private String codigo;
    private String descripcion;
    private String tipoDoc;
    private String letraDoc;
    private Integer ptovtaDoc;
    private Integer numeroDoc;
    private LocalDate fechaDoc;
    private String motivoDebito;
    private String comentariosDebito;
    private BigDecimal importeDebitado = BigDecimal.ZERO;
    private Boolean debitoAceptado;

    public DirectorioPrestacionDetalleDTO() {}

    public DirectorioPrestacionDetalleDTO(Integer id, String paciente, String carnet, String plan, String efector,
                                        String medico, LocalDate fechaPrestacion, String codigo, String descripcion,
                                        String tipoDoc, String letraDoc, Integer ptovtaDoc, Integer numeroDoc,
                                        LocalDate fechaDoc, String motivoDebito, String comentariosDebito,
                                        BigDecimal importeDebitado, Boolean debitoAceptado) {
        this.id = id;
        this.paciente = paciente;
        this.carnet = carnet;
        this.plan = plan;
        this.efector = efector;
        this.medico = medico;
        this.fechaPrestacion = fechaPrestacion;
        this.codigo = codigo;
        this.descripcion = descripcion;
        this.tipoDoc = tipoDoc;
        this.letraDoc = letraDoc;
        this.ptovtaDoc = ptovtaDoc;
        this.numeroDoc = numeroDoc;
        this.fechaDoc = fechaDoc;
        this.motivoDebito = motivoDebito;
        this.comentariosDebito = comentariosDebito;
        this.importeDebitado = importeDebitado != null ? importeDebitado : BigDecimal.ZERO;
        this.debitoAceptado = debitoAceptado;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public String getEfector() {
        return efector;
    }

    public void setEfector(String efector) {
        this.efector = efector;
    }

    public String getMedico() {
        return medico;
    }

    public void setMedico(String medico) {
        this.medico = medico;
    }

    public LocalDate getFechaPrestacion() {
        return fechaPrestacion;
    }

    public void setFechaPrestacion(LocalDate fechaPrestacion) {
        this.fechaPrestacion = fechaPrestacion;
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

    public LocalDate getFechaDoc() {
        return fechaDoc;
    }

    public void setFechaDoc(LocalDate fechaDoc) {
        this.fechaDoc = fechaDoc;
    }

    public String getMotivoDebito() {
        return motivoDebito;
    }

    public void setMotivoDebito(String motivoDebito) {
        this.motivoDebito = motivoDebito;
    }

    public String getComentariosDebito() {
        return comentariosDebito;
    }

    public void setComentariosDebito(String comentariosDebito) {
        this.comentariosDebito = comentariosDebito;
    }

    public BigDecimal getImporteDebitado() {
        return importeDebitado;
    }

    public void setImporteDebitado(BigDecimal importeDebitado) {
        this.importeDebitado = importeDebitado;
    }

    public Boolean getDebitoAceptado() {
        return debitoAceptado;
    }

    public void setDebitoAceptado(Boolean debitoAceptado) {
        this.debitoAceptado = debitoAceptado;
    }
}
