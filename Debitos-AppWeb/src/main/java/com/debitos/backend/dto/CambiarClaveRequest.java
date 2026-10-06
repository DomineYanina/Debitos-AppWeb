package com.debitos.backend.dto;

public class CambiarClaveRequest {
    private String usuario;
    private String nuevaClave;

    public CambiarClaveRequest() {
    }

    public CambiarClaveRequest(String usuario, String nuevaClave) {
        this.usuario = usuario;
        this.nuevaClave = nuevaClave;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getNuevaClave() {
        return nuevaClave;
    }

    public void setNuevaClave(String nuevaClave) {
        this.nuevaClave = nuevaClave;
    }
}
