package com.debitos.backend.dto;

public class ResumenSincronizacionPrestacionesDTO {

    private boolean exito;
    private String mensaje;
    private int anioProcesado;
    private int totalLeidosGestion;
    private int nuevasInsertadas;
    private int existentesOmitidas;
    private int vinculadasCabecera;
    private int huerfanasSinCabecera;
    private int huerfanasPreviasReconciliadas;
    private long duracionMs;
    private String fechaHora;

    public ResumenSincronizacionPrestacionesDTO() {
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

    public int getNuevasInsertadas() {
        return nuevasInsertadas;
    }

    public void setNuevasInsertadas(int nuevasInsertadas) {
        this.nuevasInsertadas = nuevasInsertadas;
    }

    public int getExistentesOmitidas() {
        return existentesOmitidas;
    }

    public void setExistentesOmitidas(int existentesOmitidas) {
        this.existentesOmitidas = existentesOmitidas;
    }

    public int getVinculadasCabecera() {
        return vinculadasCabecera;
    }

    public void setVinculadasCabecera(int vinculadasCabecera) {
        this.vinculadasCabecera = vinculadasCabecera;
    }

    public int getHuerfanasSinCabecera() {
        return huerfanasSinCabecera;
    }

    public void setHuerfanasSinCabecera(int huerfanasSinCabecera) {
        this.huerfanasSinCabecera = huerfanasSinCabecera;
    }

    public int getHuerfanasPreviasReconciliadas() {
        return huerfanasPreviasReconciliadas;
    }

    public void setHuerfanasPreviasReconciliadas(int huerfanasPreviasReconciliadas) {
        this.huerfanasPreviasReconciliadas = huerfanasPreviasReconciliadas;
    }

    public long getDuracionMs() {
        return duracionMs;
    }

    public void setDuracionMs(long duracionMs) {
        this.duracionMs = duracionMs;
    }

    public String getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(String fechaHora) {
        this.fechaHora = fechaHora;
    }
}
