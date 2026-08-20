package com.debitos.backend.dto;

import java.util.List;

public class GuardarParcialRequest {
    private String documentoOrigen;
    private String letra;
    private Object ptovta;
    private Object numero;
    private String usuario;
    private List<RegistroAuditoriaDTO> registros;

    public String getDocumentoOrigen() {
        return documentoOrigen;
    }

    public void setDocumentoOrigen(String documentoOrigen) {
        this.documentoOrigen = documentoOrigen;
    }

    public String getLetra() {
        return letra;
    }

    public void setLetra(String letra) {
        this.letra = letra;
    }

    public Object getPtovta() {
        return ptovta;
    }

    public void setPtovta(Object ptovta) {
        this.ptovta = ptovta;
    }

    public Object getNumero() {
        return numero;
    }

    public void setNumero(Object numero) {
        this.numero = numero;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public List<RegistroAuditoriaDTO> getRegistros() {
        return registros;
    }

    public void setRegistros(List<RegistroAuditoriaDTO> registros) {
        this.registros = registros;
    }
}
