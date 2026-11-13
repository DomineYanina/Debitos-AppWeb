package com.debitos.backend.dto;

import java.util.HashMap;
import java.util.Map;

public class GuardarParcialResponseDTO {
    private Map<Integer, Integer> idsMapeados = new HashMap<>();
    private String mensaje;

    public GuardarParcialResponseDTO() {}

    public GuardarParcialResponseDTO(Map<Integer, Integer> idsMapeados, String mensaje) {
        this.idsMapeados = idsMapeados != null ? idsMapeados : new HashMap<>();
        this.mensaje = mensaje;
    }

    public Map<Integer, Integer> getIdsMapeados() {
        return idsMapeados;
    }

    public void setIdsMapeados(Map<Integer, Integer> idsMapeados) {
        this.idsMapeados = idsMapeados;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }
}
