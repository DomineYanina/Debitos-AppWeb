package com.debitos.backend.repository;

import com.debitos.backend.model.FacturaAnuladaManual;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacturaAnuladaManualRepository extends JpaRepository<FacturaAnuladaManual, Long> {
    Optional<FacturaAnuladaManual> findByIdCabecera(Long idCabecera);

    @Query(value = "SELECT fam FROM FacturaAnuladaManual fam JOIN FETCH fam.cabecera c LEFT JOIN FETCH fam.cabeceraAnulador ca WHERE fam.anulada = true AND c.ptovta IN :puntosVenta",
           countQuery = "SELECT COUNT(fam) FROM FacturaAnuladaManual fam JOIN fam.cabecera c WHERE fam.anulada = true AND c.ptovta IN :puntosVenta")
    Page<FacturaAnuladaManual> findFacturasAnuladasConCabecera(@Param("puntosVenta") Collection<Integer> puntosVenta, Pageable pageable);

    @Query(value = "SELECT fam FROM FacturaAnuladaManual fam " +
                   "JOIN FETCH fam.cabecera c " +
                   "LEFT JOIN FETCH fam.cabeceraAnulador ca " +
                   "WHERE fam.anulada = true " +
                   "AND c.ptovta IN :puntosVenta " +
                   "AND (:filtrarTipos = false OR UPPER(TRIM(c.tipo)) IN :tipos) " +
                   "AND (:filtro = '' OR " +
                   "LOWER(COALESCE(c.comprobante, '')) LIKE LOWER(CONCAT('%', :filtro, '%')) OR " +
                   "LOWER(COALESCE(c.cobertura, '')) LIKE LOWER(CONCAT('%', :filtro, '%')) OR " +
                   "LOWER(COALESCE(c.codigoCobertura, '')) LIKE LOWER(CONCAT('%', :filtro, '%')) OR " +
                   "CAST(c.numero AS string) LIKE CONCAT('%', :filtro, '%') OR " +
                   "LOWER(COALESCE(ca.comprobante, '')) LIKE LOWER(CONCAT('%', :filtro, '%')))",
           countQuery = "SELECT COUNT(fam) FROM FacturaAnuladaManual fam " +
                        "JOIN fam.cabecera c " +
                        "LEFT JOIN fam.cabeceraAnulador ca " +
                        "WHERE fam.anulada = true " +
                        "AND c.ptovta IN :puntosVenta " +
                        "AND (:filtrarTipos = false OR UPPER(TRIM(c.tipo)) IN :tipos) " +
                        "AND (:filtro = '' OR " +
                        "LOWER(COALESCE(c.comprobante, '')) LIKE LOWER(CONCAT('%', :filtro, '%')) OR " +
                        "LOWER(COALESCE(c.cobertura, '')) LIKE LOWER(CONCAT('%', :filtro, '%')) OR " +
                        "LOWER(COALESCE(c.codigoCobertura, '')) LIKE LOWER(CONCAT('%', :filtro, '%')) OR " +
                        "CAST(c.numero AS string) LIKE CONCAT('%', :filtro, '%') OR " +
                        "LOWER(COALESCE(ca.comprobante, '')) LIKE LOWER(CONCAT('%', :filtro, '%')))")
    Page<FacturaAnuladaManual> findFacturasAnuladasConCabeceraFiltradas(
            @Param("puntosVenta") Collection<Integer> puntosVenta,
            @Param("filtrarTipos") boolean filtrarTipos,
            @Param("tipos") Collection<String> tipos,
            @Param("filtro") String filtro,
            Pageable pageable);

    @Query("SELECT fam.idCabecera FROM FacturaAnuladaManual fam WHERE fam.anulada = true")
    List<Long> findIdsCabeceraAnuladasManual();

    @Query("SELECT fam.idCabecera FROM FacturaAnuladaManual fam WHERE fam.anulada = true AND fam.idCabecera IN :ids")
    List<Long> findIdsCabeceraAnuladasEn(@Param("ids") Collection<Long> ids);

    @Query("SELECT fam.idCabeceraAnulador FROM FacturaAnuladaManual fam WHERE fam.anulada = true AND fam.idCabeceraAnulador IS NOT NULL")
    List<Long> findIdsCabeceraAnuladoresManual();

    @Query("SELECT fam FROM FacturaAnuladaManual fam LEFT JOIN FETCH fam.cabecera LEFT JOIN FETCH fam.cabeceraAnulador WHERE fam.anulada = true AND (fam.idCabecera IN :ids OR fam.idCabeceraAnulador IN :ids)")
    List<FacturaAnuladaManual> findActivasPorIdsCabeceraOAnulador(@Param("ids") Collection<Long> ids);
}
