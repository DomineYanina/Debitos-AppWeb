package com.debitos.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "amb_liquidado")
public class AmbLiquidado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idcabecera")
    @NotFound(action = NotFoundAction.IGNORE)
    private Cabecera cabecera;

    private String carnet;
    private String paciente;
    private String plan;
    private String efector;
    private String medico;
    private LocalDate fecha;
    private String codigo;
    private String descripcion;
    private String modulo;
    private String grupomodulo;
    private Integer cantidad;

    @Column(name = "total_neto")
    private BigDecimal totalNeto;

    @Column(name = "iva")
    private BigDecimal iva;

    private BigDecimal coseguro;
    private BigDecimal total;

    public AmbLiquidado() {}

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Cabecera getCabecera() {
        return cabecera;
    }

    public void setCabecera(Cabecera cabecera) {
        this.cabecera = cabecera;
    }

    public String getCarnet() {
        return carnet;
    }

    public void setCarnet(String carnet) {
        this.carnet = carnet;
    }

    public String getPaciente() {
        return paciente;
    }

    public void setPaciente(String paciente) {
        this.paciente = paciente;
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

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
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

    public String getModulo() {
        return modulo;
    }

    public void setModulo(String modulo) {
        this.modulo = modulo;
    }

    public String getGrupomodulo() {
        return grupomodulo;
    }

    public void setGrupomodulo(String grupomodulo) {
        this.grupomodulo = grupomodulo;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
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

    public BigDecimal getCoseguro() {
        return coseguro;
    }

    public void setCoseguro(BigDecimal coseguro) {
        this.coseguro = coseguro;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }
}