package com.debitos.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface PrestacionAuditoriaDTO {
    Integer getId();
    String getCarnet();
    String getCobertura();
    String getPaciente();
    String getPlan();
    String getEfector();
    String getMedico();
    LocalDate getFecha();
    String getCodigo();
    String getDescripcion();
    String getModulo();
    String getGrupomodulo();
    Integer getCantidad();
    BigDecimal getTotalNeto();
    BigDecimal getCoseguro();
    BigDecimal getTotal();

    String getDebitoAceptado();
    String getMotivoDebito();
    Integer getDiasFacturados();
    BigDecimal getImporteDebitado();
    String getComentariosDebito();
    String getPrestacionEnglobante();

    String getMotivoRefactura();
    BigDecimal getImporteRefactura();

    String getComentarioPrevio();
    String getComentarios();
}