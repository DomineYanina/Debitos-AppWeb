package com.debitos.backend.model;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Contrato base para entidades y proyecciones de Cabecera.
 * Permite que los algoritmos de negocio y agrupamiento operen indistintamente
 * sobre entidades JPA completas o sobre DTOs livianos en memoria.
 */
public interface CabeceraBase {
    Long getId();
    String getTipo();
    String getLetra();
    Integer getPtovta();
    Integer getNumero();
    LocalDate getFecha();
    LocalDate getPeriodo();
    String getTiporegistro();
    String getCodigoCobertura();
    String getCobertura();
    String getOrigen();
    Long getGrupo();
    Long getAsociado();
    Long getAsociadogrupo();
    BigDecimal getDebe();
    BigDecimal getHaber();
    Integer getIdEstado();
    String getComprobante();
}
