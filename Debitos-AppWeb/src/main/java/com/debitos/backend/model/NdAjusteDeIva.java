package com.debitos.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "nd_ajustedeiva")
public class NdAjusteDeIva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idcabecera")
    private Cabecera cabecera;

    @Column(name = "letra_nc", nullable = false, length = 1)
    private String letraNc;

    @Column(name = "ptovta_nc", nullable = false)
    private Integer ptovtaNc;

    @Column(name = "tipo_nc", nullable = false, length = 10)
    private String tipoNc;

    @Column(name = "numero_nc", nullable = false)
    private Integer numeroNc;

    @Column(name = "neto", nullable = false, precision = 15, scale = 2)
    private BigDecimal neto;

    @Column(name = "iva", nullable = false, precision = 15, scale = 2)
    private BigDecimal iva;

    @Column(name = "porc_iva", nullable = false, precision = 5, scale = 2)
    private BigDecimal porcIva;

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro;

    public NdAjusteDeIva() {}

    @PrePersist
    public void prePersist() {
        if (this.fechaRegistro == null) {
            this.fechaRegistro = LocalDateTime.now();
        }
    }

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

    public String getLetraNc() {
        return letraNc;
    }

    public void setLetraNc(String letraNc) {
        this.letraNc = letraNc;
    }

    public Integer getPtovtaNc() {
        return ptovtaNc;
    }

    public void setPtovtaNc(Integer ptovtaNc) {
        this.ptovtaNc = ptovtaNc;
    }

    public String getTipoNc() {
        return tipoNc;
    }

    public void setTipoNc(String tipoNc) {
        this.tipoNc = tipoNc;
    }

    public Integer getNumeroNc() {
        return numeroNc;
    }

    public void setNumeroNc(Integer numeroNc) {
        this.numeroNc = numeroNc;
    }

    public BigDecimal getNeto() {
        return neto;
    }

    public void setNeto(BigDecimal neto) {
        this.neto = neto;
    }

    public BigDecimal getIva() {
        return iva;
    }

    public void setIva(BigDecimal iva) {
        this.iva = iva;
    }

    public BigDecimal getPorcIva() {
        return porcIva;
    }

    public void setPorcIva(BigDecimal porcIva) {
        this.porcIva = porcIva;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }
}
