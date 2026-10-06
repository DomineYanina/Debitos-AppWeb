package com.debitos.backend.dto;

public class CambioEstadoResponse {
    private boolean requiereConfirmacion;
    private String mensajeAlerta;
    private boolean exito;

    public CambioEstadoResponse() {}

    public CambioEstadoResponse(boolean requiereConfirmacion, String mensajeAlerta, boolean exito) {
        this.requiereConfirmacion = requiereConfirmacion;
        this.mensajeAlerta = mensajeAlerta;
        this.exito = exito;
    }

    public boolean isRequiereConfirmacion() {
        return requiereConfirmacion;
    }

    public void setRequiereConfirmacion(boolean requiereConfirmacion) {
        this.requiereConfirmacion = requiereConfirmacion;
    }

    public String getMensajeAlerta() {
        return mensajeAlerta;
    }

    public void setMensajeAlerta(String mensajeAlerta) {
        this.mensajeAlerta = mensajeAlerta;
    }

    public boolean isExito() {
        return exito;
    }

    public void setExito(boolean exito) {
        this.exito = exito;
    }
}
