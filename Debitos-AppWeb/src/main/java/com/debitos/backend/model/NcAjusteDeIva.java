package com.debitos.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "nc_ajustedeiva")
public class NcAjusteDeIva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idcabecera")
    private Cabecera cabecera;

    @Column(name = "letra_fc", length = 1, nullable = false)
    private String letraFc;

    @Column(name = "ptovta_fc", nullable = false)
    private Integer ptovtaFc;

    @Column(name = "tipo_fc", length = 10, nullable = false)
    private String tipoFc;

    @Column(name = "numero_fc", nullable = false)
    private Integer numeroFc;

    @Column(name = "letra_nc", length = 1)
    private String letraNc;

    @Column(name = "ptovta_nc")
    private Integer ptovtaNc;

    @Column(name = "tipo_nc", length = 10)
    private String tipoNc;

    @Column(name = "numero_nc")
    private Integer numeroNc;

    @Column(name = "neto", precision = 15, scale = 2, nullable = false)
    private BigDecimal neto;

    @Column(name = "iva", precision = 15, scale = 2, nullable = false)
    private BigDecimal iva;

    @Column(name = "porc_iva", precision = 5, scale = 2, nullable = false)
    private BigDecimal porcIva;

    @Column(name = "fecha_registro")
    private ZonedDateTime fechaRegistro;

    public NcAjusteDeIva() {}

    @PrePersist
    @PreUpdate
    public void actualizarFechaRegistro() {
        if (this.fechaRegistro == null) {
            this.fechaRegistro = ZonedDateTime.now();
        }
        if (this.cabecera != null) {
            if (this.letraNc == null) {
                this.letraNc = this.cabecera.getLetra();
            }
            if (this.ptovtaNc == null) {
                this.ptovtaNc = this.cabecera.getPtovta();
            }
            if (this.tipoNc == null) {
                this.tipoNc = this.cabecera.getTipo();
            }
            if (this.numeroNc == null) {
                this.numeroNc = this.cabecera.getNumero();
            }
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
