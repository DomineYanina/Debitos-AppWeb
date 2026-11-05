package com.debitos.backend.dto;

public class ResultadoReconciliacionDTO {

    private boolean exito;
    private int totalReconciliadas;
    private int ambulatoriosReconciliados;
    private int internadosReconciliados;
    private String mensaje;

    public ResultadoReconciliacionDTO() {
    }

    public ResultadoReconciliacionDTO(boolean exito, int totalReconciliadas, int ambulatoriosReconciliados, int internadosReconciliados, String mensaje) {
        this.exito = exito;
        this.totalReconciliadas = totalReconciliadas;
        this.ambulatoriosReconciliados = ambulatoriosReconciliados;
        this.internadosReconciliados = internadosReconciliados;
        this.mensaje = mensaje;
    }

    public boolean isExito() {
        return exito;
    }

    public void setExito(boolean exito) {
        this.exito = exito;
    }

    public int getTotalReconciliadas() {
        return totalReconciliadas;
    }

    public void setTotalReconciliadas(int totalReconciliadas) {
        this.totalReconciliadas = totalReconciliadas;
    }

    public int getAmbulatoriosReconciliados() {
        return ambulatoriosReconciliados;
    }

    public void setAmbulatoriosReconciliados(int ambulatoriosReconciliados) {
        this.ambulatoriosReconciliados = ambulatoriosReconciliados;
    }

    public int getInternadosReconciliados() {
        return internadosReconciliados;
    }

    public void setInternadosReconciliados(int internadosReconciliados) {
        this.internadosReconciliados = internadosReconciliados;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }
}

