package com.debitos.backend.dto;

public class NuevaNotaDebitoAjusteIvaRequest {

    private String tipoNc;
    private String letraNc;
    private Object ptovtaNc;
    private Object numeroNc;

    private String tipoNd;
    private String letraNd;
    private Object ptovtaNd;
    private Object numeroNd;

    private Object neto;
    private Object iva;
    private Object porcIva;
    private Object fecha;
    private String usuario;
    private Long idCabeceraSeleccionada;
    private boolean creadoManualmente;

    public NuevaNotaDebitoAjusteIvaRequest() {}

    public Long getIdCabeceraSeleccionada() {
        return idCabeceraSeleccionada;
    }

    public void setIdCabeceraSeleccionada(Long idCabeceraSeleccionada) {
        this.idCabeceraSeleccionada = idCabeceraSeleccionada;
    }

    public boolean isCreadoManualmente() {
        return creadoManualmente;
    }

    public void setCreadoManualmente(boolean creadoManualmente) {
        this.creadoManualmente = creadoManualmente;
    }

    public String getTipoNc() {
        return tipoNc;
    }

    public void setTipoNc(String tipoNc) {
        this.tipoNc = tipoNc;
    }

    public String getLetraNc() {
        return letraNc;
    }

    public void setLetraNc(String letraNc) {
        this.letraNc = letraNc;
    }

    public Object getPtovtaNc() {
        return ptovtaNc;
    }

    public void setPtovtaNc(Object ptovtaNc) {
        this.ptovtaNc = ptovtaNc;
    }

    public Object getNumeroNc() {
        return numeroNc;
    }

    public void setNumeroNc(Object numeroNc) {
        this.numeroNc = numeroNc;
    }

    public String getTipoNd() {
        return tipoNd;
    }

    public void setTipoNd(String tipoNd) {
        this.tipoNd = tipoNd;
    }

    public String getLetraNd() {
        return letraNd;
    }

    public void setLetraNd(String letraNd) {
        this.letraNd = letraNd;
    }

    public Object getPtovtaNd() {
        return ptovtaNd;
    }

    public void setPtovtaNd(Object ptovtaNd) {
        this.ptovtaNd = ptovtaNd;
    }

    public Object getNumeroNd() {
        return numeroNd;
    }

    public void setNumeroNd(Object numeroNd) {
        this.numeroNd = numeroNd;
    }

    public Object getNeto() {
        return neto;
    }

    public void setNeto(Object neto) {
        this.neto = neto;
    }

    public Object getIva() {
        return iva;
    }

    public void setIva(Object iva) {
        this.iva = iva;
    }

    public Object getPorcIva() {
        return porcIva;
    }

    public void setPorcIva(Object porcIva) {
        this.porcIva = porcIva;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public Object getFecha() {
        return fecha;
    }

    public void setFecha(Object fecha) {
        this.fecha = fecha;
    }
}
