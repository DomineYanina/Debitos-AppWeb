package com.debitos.backend.dto;

public class LoginResponse {
    private String token;
    private String usuario;
    private String rol;

    public LoginResponse(String token, String usuario, String rol) {
        this.token = token;
        this.usuario = usuario;
        this.rol = rol;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }
}
