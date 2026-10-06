package com.debitos.backend.dto;

public class RegistroAuditoriaDTO {
    private Integer id;
    private String motivoDebito;
    private Object importeDebitado;
    private Object debitoAceptado;
    private String motivoRefactura;
    private Object importeRefactura;
    private String comentarios;
    private Object diasFacturados;
    private String prestacionEnglobante;
    private String comentariosDebito;
    private String codigo;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getMotivoDebito() {
        return motivoDebito;
    }

    public void setMotivoDebito(String motivoDebito) {
        this.motivoDebito = motivoDebito;
    }

    public Object getImporteDebitado() {
        return importeDebitado;
    }

    public void setImporteDebitado(Object importeDebitado) {
        this.importeDebitado = importeDebitado;
    }

    public Object getDebitoAceptado() {
        return debitoAceptado;
    }

    public void setDebitoAceptado(Object debitoAceptado) {
        this.debitoAceptado = debitoAceptado;
    }

    public String getMotivoRefactura() {
        return motivoRefactura;
    }

    public void setMotivoRefactura(String motivoRefactura) {
        this.motivoRefactura = motivoRefactura;
    }

    public Object getImporteRefactura() {
        return importeRefactura;
    }

    public void setImporteRefactura(Object importeRefactura) {
        this.importeRefactura = importeRefactura;
    }

    public String getComentarios() {
        return comentarios;
    }

    public void setComentarios(String comentarios) {
        this.comentarios = comentarios;
    }

    public Object getDiasFacturados() {
        return diasFacturados;
    }

    public void setDiasFacturados(Object diasFacturados) {
        this.diasFacturados = diasFacturados;
    }

    public String getPrestacionEnglobante() {
        return prestacionEnglobante;
    }

    public void setPrestacionEnglobante(String prestacionEnglobante) {
        this.prestacionEnglobante = prestacionEnglobante;
    }

    public String getComentariosDebito() {
        return comentariosDebito;
    }

    public void setComentariosDebito(String comentariosDebito) {
        this.comentariosDebito = comentariosDebito;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }
}
