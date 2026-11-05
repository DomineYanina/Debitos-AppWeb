package com.debitos.backend.dto;

import java.time.LocalDateTime;

public class EstadoSincronizacionPrestacionesDTO {

    private boolean conexionOk;
    private String mensajeConexion;
    private int anio;
    private long totalGestion;
    private long totalGestionAmbulatorios;
    private long totalGestionInternados;
    private long totalDebitos;
    private long pendientes;
    private long vinculadasCabecera;
    private long huerfanasCabecera;
    private LocalDateTime ultimaSincronizacion;
    private String ultimoUsuario;
    private Integer ultimasInsertadas;

    public EstadoSincronizacionPrestacionesDTO() {
    }

    public boolean isConexionOk() {
        return conexionOk;
    }

    public void setConexionOk(boolean conexionOk) {
        this.conexionOk = conexionOk;
    }

    public String getMensajeConexion() {
        return mensajeConexion;
    }

    public void setMensajeConexion(String mensajeConexion) {
        this.mensajeConexion = mensajeConexion;
    }

    public int getAnio() {
        return anio;
    }

    public void setAnio(int anio) {
        this.anio = anio;
    }

    public long getTotalGestion() {
        return totalGestion;
    }

    public void setTotalGestion(long totalGestion) {
        this.totalGestion = totalGestion;
    }

    public long getTotalGestionAmbulatorios() {
        return totalGestionAmbulatorios;
    }

    public void setTotalGestionAmbulatorios(long totalGestionAmbulatorios) {
        this.totalGestionAmbulatorios = totalGestionAmbulatorios;
    }

    public long getTotalGestionInternados() {
        return totalGestionInternados;
    }

    public void setTotalGestionInternados(long totalGestionInternados) {
        this.totalGestionInternados = totalGestionInternados;
    }

    public long getTotalDebitos() {
        return totalDebitos;
    }

    public void setTotalDebitos(long totalDebitos) {
        this.totalDebitos = totalDebitos;
    }

    public long getPendientes() {
        return pendientes;
    }

    public void setPendientes(long pendientes) {
        this.pendientes = pendientes;
    }

    public long getVinculadasCabecera() {
        return vinculadasCabecera;
    }

    public void setVinculadasCabecera(long vinculadasCabecera) {
        this.vinculadasCabecera = vinculadasCabecera;
    }

    public long getHuerfanasCabecera() {
        return huerfanasCabecera;
    }

    public void setHuerfanasCabecera(long huerfanasCabecera) {
        this.huerfanasCabecera = huerfanasCabecera;
    }

    public LocalDateTime getUltimaSincronizacion() {
        return ultimaSincronizacion;
    }

    public void setUltimaSincronizacion(LocalDateTime ultimaSincronizacion) {
        this.ultimaSincronizacion = ultimaSincronizacion;
    }

    public String getUltimoUsuario() {
        return ultimoUsuario;
    }

    public void setUltimoUsuario(String ultimoUsuario) {
        this.ultimoUsuario = ultimoUsuario;
    }

    public Integer getUltimasInsertadas() {
        return ultimasInsertadas;
    }

    public void setUltimasInsertadas(Integer ultimasInsertadas) {
        this.ultimasInsertadas = ultimasInsertadas;
    }
}
