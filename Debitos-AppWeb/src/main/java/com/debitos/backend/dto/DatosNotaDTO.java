package com.debitos.backend.dto;

public class DatosNotaDTO {
    private Object puntoVenta;
    private Object numero;
    private Object fecha;
    private String tipo;
    private String letra;
    private String tipoNd;
    private Object importeRefactura;
    private String tipoNc;
    private String subtipoIva;
    private Object neto;
    private Object iva;
    private Object porcIva;
    private Object netoNc;
    private Object ivaNc;
    private Long idCabeceraSeleccionada;
    private boolean creadoManualmente;

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

    public Object getPuntoVenta() {
        return puntoVenta;
    }

    public void setPuntoVenta(Object puntoVenta) {
        this.puntoVenta = puntoVenta;
    }

    public Object getNumero() {
        return numero;
    }

    public void setNumero(Object numero) {
        this.numero = numero;
    }

    public Object getFecha() {
        return fecha;
    }

    public void setFecha(Object fecha) {
        this.fecha = fecha;
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

    public String getTipoNd() {
        return tipoNd;
    }

    public void setTipoNd(String tipoNd) {
        this.tipoNd = tipoNd;
    }

    public Object getImporteRefactura() {
        return importeRefactura;
    }

    public void setImporteRefactura(Object importeRefactura) {
        this.importeRefactura = importeRefactura;
    }

    public String getTipoNc() {
        return tipoNc;
    }

    public void setTipoNc(String tipoNc) {
        this.tipoNc = tipoNc;
    }

    public String getSubtipoIva() {
        return subtipoIva;
    }

    public void setSubtipoIva(String subtipoIva) {
        this.subtipoIva = subtipoIva;
    }

    public Object getNeto() {
        return neto != null ? neto : netoNc;
    }

    public void setNeto(Object neto) {
        this.neto = neto;
    }

    public Object getIva() {
        return iva != null ? iva : ivaNc;
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

    public Object getNetoNc() {
        return netoNc;
    }

    public void setNetoNc(Object netoNc) {
        this.netoNc = netoNc;
    }

    public Object getIvaNc() {
        return ivaNc;
    }

    public void setIvaNc(Object ivaNc) {
        this.ivaNc = ivaNc;
    }
}

