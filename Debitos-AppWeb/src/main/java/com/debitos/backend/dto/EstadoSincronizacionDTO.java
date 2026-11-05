package com.debitos.backend.dto;

import java.time.LocalDateTime;

public class EstadoSincronizacionDTO {

    private boolean conexionOk;
    private String mensajeConexion;
    private int anio;
    private long totalGestion;
    private long pendientes;
    private LocalDateTime ultimaSincronizacion;
    private String ultimoUsuario;
    private Integer ultimosInsertados;
    private long totalOrigenBdd;
    private long totalOrigenApp;
    private long comprobantesSinAsociar;

    public EstadoSincronizacionDTO() {
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

    public long getPendientes() {
        return pendientes;
    }

    public void setPendientes(long pendientes) {
        this.pendientes = pendientes;
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

    public Integer getUltimosInsertados() {
        return ultimosInsertados;
    }

    public void setUltimosInsertados(Integer ultimosInsertados) {
        this.ultimosInsertados = ultimosInsertados;
    }

    public long getTotalOrigenBdd() {
        return totalOrigenBdd;
    }

    public void setTotalOrigenBdd(long totalOrigenBdd) {
        this.totalOrigenBdd = totalOrigenBdd;
    }

    public long getTotalOrigenApp() {
        return totalOrigenApp;
    }

    public void setTotalOrigenApp(long totalOrigenApp) {
        this.totalOrigenApp = totalOrigenApp;
    }

    public long getComprobantesSinAsociar() {
        return comprobantesSinAsociar;
    }

    public void setComprobantesSinAsociar(long comprobantesSinAsociar) {
        this.comprobantesSinAsociar = comprobantesSinAsociar;
    }
}
