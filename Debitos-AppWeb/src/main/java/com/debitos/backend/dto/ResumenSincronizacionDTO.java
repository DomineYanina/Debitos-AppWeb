package com.debitos.backend.dto;

import java.time.LocalDateTime;

public class ResumenSincronizacionDTO {

    private boolean exito;
    private String mensaje;
    private int anioProcesado;
    private int totalLeidosGestion;
    private int nuevosInsertados;
    private int existentesOmitidos;
    private int asociadosActualizados;
    private int huerfanosReconciliados;
    private long duracionMs;
    private LocalDateTime fechaHora;

    public ResumenSincronizacionDTO() {
        this.fechaHora = LocalDateTime.now();
    }

    public boolean isExito() {
        return exito;
    }

    public void setExito(boolean exito) {
        this.exito = exito;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public int getAnioProcesado() {
        return anioProcesado;
    }

    public void setAnioProcesado(int anioProcesado) {
        this.anioProcesado = anioProcesado;
    }

    public int getTotalLeidosGestion() {
        return totalLeidosGestion;
    }

    public void setTotalLeidosGestion(int totalLeidosGestion) {
        this.totalLeidosGestion = totalLeidosGestion;
    }

    public int getNuevosInsertados() {
        return nuevosInsertados;
    }

    public void setNuevosInsertados(int nuevosInsertados) {
        this.nuevosInsertados = nuevosInsertados;
    }

    public int getExistentesOmitidos() {
        return existentesOmitidos;
    }

    public void setExistentesOmitidos(int existentesOmitidos) {
        this.existentesOmitidos = existentesOmitidos;
    }

    public int getAsociadosActualizados() {
        return asociadosActualizados;
    }

    public void setAsociadosActualizados(int asociadosActualizados) {
        this.asociadosActualizados = asociadosActualizados;
    }

    public int getHuerfanosReconciliados() {
        return huerfanosReconciliados;
    }

    public void setHuerfanosReconciliados(int huerfanosReconciliados) {
        this.huerfanosReconciliados = huerfanosReconciliados;
    }

    public long getDuracionMs() {
        return duracionMs;
    }

    public void setDuracionMs(long duracionMs) {
        this.duracionMs = duracionMs;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }
}
