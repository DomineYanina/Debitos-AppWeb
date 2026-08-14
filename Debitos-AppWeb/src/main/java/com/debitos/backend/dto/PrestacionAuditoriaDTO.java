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

    // Regla 2: permite saber en el frontend si la NC buscada es hija de una ND (no null)
    // o hija directa de una FC (null). Si es null, se permiten múltiples ND.
    Integer getIdNotaDeDebito();

    // Datos de la NC a la que ya pertenece esta prestación (si ya fue asignada previamente)
    Integer getNcNumero();
    String getNcTipo();
    String getNcLetra();
    Integer getNcPtoVenta();
    LocalDate getNcFecha();
}