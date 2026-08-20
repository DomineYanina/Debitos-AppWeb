package com.debitos.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "nc_ajustedeiva")
public class NcAjusteDeIva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "letra_fc", length = 1, nullable = false)
    private String letraFc;

    @Column(name = "ptovta_fc", nullable = false)
    private Integer ptovtaFc;

    @Column(name = "tipo_fc", length = 10, nullable = false)
    private String tipoFc;

    @Column(name = "numero_fc", nullable = false)
    private Integer numeroFc;

    @Column(name = "letra_nc", length = 1, nullable = false)
    private String letraNc;

    @Column(name = "ptovta_nc", nullable = false)
    private Integer ptovtaNc;

    @Column(name = "tipo_nc", length = 10, nullable = false)
    private String tipoNc;

    @Column(name = "numero_nc", nullable = false)
    private Integer numeroNc;

    @Column(name = "neto", precision = 15, scale = 2, nullable = false)
    private BigDecimal neto;

    @Column(name = "iva", precision = 15, scale = 2, nullable = false)
    private BigDecimal iva;

    @Column(name = "porc_iva", precision = 5, scale = 2, nullable = false)
    private BigDecimal porcIva;

    @Column(name = "fecha_registro")
    private ZonedDateTime fechaRegistro;

    @PrePersist
    @PreUpdate
    public void actualizarFechaRegistro() {
        this.fechaRegistro = ZonedDateTime.now();
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getLetraFc() {
        return letraFc;
    }

    public void setLetraFc(String letraFc) {
        this.letraFc = letraFc;
    }

    public Integer getPtovtaFc() {
        return ptovtaFc;
    }

    public void setPtovtaFc(Integer ptovtaFc) {
        this.ptovtaFc = ptovtaFc;
    }

    public String getTipoFc() {
        return tipoFc;
    }

    public void setTipoFc(String tipoFc) {
        this.tipoFc = tipoFc;
    }

    public Integer getNumeroFc() {
        return numeroFc;
    }

    public void setNumeroFc(Integer numeroFc) {
        this.numeroFc = numeroFc;
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

    public ZonedDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(ZonedDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }
}
