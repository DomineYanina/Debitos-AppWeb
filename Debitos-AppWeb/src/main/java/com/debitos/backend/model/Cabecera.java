package com.debitos.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "cabecera")
public class Cabecera {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipo;

    @Column(length = 1)
    private String letra;

    private Integer ptovta;
    private Integer numero;
    private LocalDate fecha;
    private LocalDate periodo;
    private String tiporegistro;

    @Column(name = "codigo_cobertura")
    private String codigoCobertura;

    @Column(name = "cobertura")
    private String cobertura;

    @Column(name = "origen")
    private String origen = "APP";

    @Column(name = "grupo")
    private Long grupo;

    @Column(name = "asociado")
    private Long asociado;

    @Column(name = "asociadogrupo")
    private Long asociadogrupo;

    @Column(name = "debe")
    private BigDecimal debe;

    @Column(name = "haber")
    private BigDecimal haber;

    @PrePersist
    @PreUpdate
    public void prePersist() {
        if (this.origen == null || this.origen.trim().isEmpty()) {
            this.origen = "APP";
        }
    }

    public Cabecera() {
        this.origen = "APP";
    }

    public Cabecera(String tipo, String letra, Integer ptovta, Integer numero, LocalDate fecha, LocalDate periodo, String tiporegistro, String codigoCobertura) {
        this.tipo = tipo;
        this.letra = letra;
        this.ptovta = ptovta;
        this.numero = numero;
        this.fecha = fecha;
        this.periodo = periodo;
        this.tiporegistro = tiporegistro;
        this.codigoCobertura = codigoCobertura;
        this.origen = "APP";
    }

    public Cabecera(String tipo, String letra, Integer ptovta, Integer numero, LocalDate fecha, LocalDate periodo, String tiporegistro, String codigoCobertura, String cobertura) {
        this.tipo = tipo;
        this.letra = letra;
        this.ptovta = ptovta;
        this.numero = numero;
        this.fecha = fecha;
        this.periodo = periodo;
        this.tiporegistro = tiporegistro;
        this.codigoCobertura = codigoCobertura;
        this.cobertura = cobertura;
        this.origen = "APP";
    }

    public Cabecera(String tipo, String letra, Integer ptovta, Integer numero, LocalDate fecha, LocalDate periodo, String tiporegistro, String codigoCobertura, String cobertura, String origen) {
        this.tipo = tipo;
        this.letra = letra;
        this.ptovta = ptovta;
        this.numero = numero;
        this.fecha = fecha;
        this.periodo = periodo;
        this.tiporegistro = tiporegistro;
        this.codigoCobertura = codigoCobertura;
        this.cobertura = cobertura;
        this.origen = (origen != null && !origen.trim().isEmpty()) ? origen : "APP";
    }

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

    public String getTiporegistro() {
        return tiporegistro;
    }

    public void setTiporegistro(String tiporegistro) {
        this.tiporegistro = tiporegistro;
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

    public String getOrigen() {
        return origen;
    }

    public void setOrigen(String origen) {
        this.origen = (origen != null && !origen.trim().isEmpty()) ? origen : "APP";
    }

    public Long getGrupo() {
        return grupo;
    }

    public void setGrupo(Long grupo) {
        this.grupo = grupo;
    }

    public Long getAsociado() {
        return asociado;
    }

    public void setAsociado(Long asociado) {
        this.asociado = asociado;
    }

    public Long getAsociadogrupo() {
        return asociadogrupo;
    }

    public void setAsociadogrupo(Long asociadogrupo) {
        this.asociadogrupo = asociadogrupo;
    }

    public BigDecimal getDebe() {
        return debe;
    }

    public void setDebe(BigDecimal debe) {
        this.debe = debe;
    }

    public BigDecimal getHaber() {
        return haber;
    }

    public void setHaber(BigDecimal haber) {
        this.haber = haber;
    }
}
