package com.debitos.backend.dto;

public class RegistroAuditoriaDTO {
    private Object id;
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
    private Boolean esManual;
    private String paciente;
    private String cobertura;
    private String plan;
    private String carnet;
    private String descripcion;
    private Object fecha;
    private Integer cantidad;

    public Integer getId() {
        if (id == null)
            return null;
        if (id instanceof Number n) {
            long val = n.longValue();
            if (val < Integer.MIN_VALUE)
                return -1;
            if (val > Integer.MAX_VALUE)
                return Integer.MAX_VALUE;
            return (int) val;
        }
        try {
            long val = Long.parseLong(id.toString().trim());
            if (val < Integer.MIN_VALUE)
                return -1;
            if (val > Integer.MAX_VALUE)
                return Integer.MAX_VALUE;
            return (int) val;
        } catch (Exception e) {
            return null;
        }
    }

    public void setId(Object id) {
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

    public Boolean getEsManual() {
        return esManual;
    }

    public void setEsManual(Boolean esManual) {
        this.esManual = esManual;
    }

    public String getPaciente() {
        return paciente;
    }

    public void setPaciente(String paciente) {
        this.paciente = paciente;
    }

    public String getCobertura() {
        return cobertura;
    }

    public void setCobertura(String cobertura) {
        this.cobertura = cobertura;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public String getCarnet() {
        return carnet;
    }

    public void setCarnet(String carnet) {
        this.carnet = carnet;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Object getFecha() {
        return fecha;
    }

    public void setFecha(Object fecha) {
        this.fecha = fecha;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }
}
