package com.debitos.backend.repository;

import com.debitos.backend.model.Cabecera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CabeceraRepository extends JpaRepository<Cabecera, Long> {

    @Query("SELECT c FROM Cabecera c WHERE UPPER(c.tipo) = UPPER(:tipo) AND UPPER(c.letra) = UPPER(:letra) AND c.ptovta = :ptovta AND c.numero = :numero")
    Optional<Cabecera> findByTipoAndLetraAndPtovtaAndNumero(@Param("tipo") String tipo, @Param("letra") String letra,
            @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("SELECT c FROM Cabecera c WHERE c.tipo IN :tipos AND UPPER(c.letra) = UPPER(:letra) AND c.ptovta = :ptovta AND c.numero = :numero ORDER BY c.fecha DESC, c.id DESC")
    List<Cabecera> findByTipoInAndLetraAndPtovtaAndNumero(@Param("tipos") Collection<String> tipos,
            @Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("SELECT COUNT(c) > 0 FROM Cabecera c WHERE UPPER(c.tipo) = UPPER(:tipo) AND UPPER(c.letra) = UPPER(:letra) AND c.ptovta = :ptovta AND c.numero = :numero")
    boolean existsByTipoAndLetraAndPtovtaAndNumero(@Param("tipo") String tipo, @Param("letra") String letra,
            @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("SELECT COUNT(c) > 0 FROM Cabecera c WHERE c.tipo IN :tipos AND UPPER(c.letra) = UPPER(:letra) AND c.ptovta = :ptovta AND c.numero = :numero")
    boolean existsByTipoInAndLetraAndPtovtaAndNumero(@Param("tipos") Collection<String> tipos,
            @Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("SELECT c FROM Cabecera c WHERE UPPER(c.letra) = UPPER(:letra) AND c.ptovta = :ptovta AND c.numero = :numero")
    Optional<Cabecera> findByLetraAndPtovtaAndNumero(@Param("letra") String letra, @Param("ptovta") Integer ptovta,
            @Param("numero") Integer numero);

    List<Cabecera> findByAsociadogrupo(Long asociadogrupo);

    @Query("SELECT c FROM Cabecera c WHERE c.asociadogrupo = :idGrupo OR c.grupo = :idGrupo OR c.id = :idGrupo")
    List<Cabecera> findByGrupoOrAsociadogrupoOrId(@Param("idGrupo") Long idGrupo);

    @Query("SELECT c FROM Cabecera c WHERE UPPER(TRIM(c.tipo)) IN :tipos AND (c.asociadogrupo IN :grupos OR c.grupo IN :grupos OR c.asociado IN :grupos OR c.id IN :grupos) ORDER BY c.fecha DESC, c.numero DESC")
    List<Cabecera> findCandidatosPorTipoYGrupos(@Param("tipos") Collection<String> tipos,
            @Param("grupos") Collection<Long> grupos);

    @Query("SELECT c FROM Cabecera c WHERE UPPER(TRIM(c.tipo)) = 'RC' AND c.numero = :numero ORDER BY c.fecha DESC, c.id DESC")
    List<Cabecera> findByTipoRcAndNumero(@Param("numero") Integer numero);

    @Query("SELECT c FROM Cabecera c WHERE UPPER(TRIM(c.tipo)) IN :tipos ORDER BY c.fecha DESC, c.numero DESC")
    List<Cabecera> findTop50ByTipoInOrderByFechaDescNumeroDesc(@Param("tipos") Collection<String> tipos);

    /**
     * Distribucion de cartera: saldo pendiente agrupado por nombre de
     * financiador/cobertura.
     * Saldo = SUM(FC.debe) - SUM(RC.haber).
     * Retorna Object[2]: [0]=cobertura(String), [1]=saldo(BigDecimal).
     * Solo incluye grupos con saldo > 0.
     */
    @Query(value = """
            SELECT
                COALESCE(NULLIF(TRIM(c.cobertura), ''), COALESCE(NULLIF(TRIM(c.codigo_cobertura), ''), 'Sin financiador')) AS financiador,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(c.debe, 0) ELSE 0 END), 0)
              - COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS saldo
            FROM cabecera c
            WHERE c.asociadogrupo IS NOT NULL
            GROUP BY 1
            HAVING
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(c.debe, 0) ELSE 0 END), 0)
              - COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) > 0
            ORDER BY 2 DESC
            """, nativeQuery = true)
    List<Object[]> obtenerSaldosPorFinanciador();

    /**
     * 1. TABLA: Resumen de Cartera y Balance Financiero agrupado por Financiador.
     */
    @Query(value = """
        SELECT 
            COALESCE(NULLIF(TRIM(c.codigo_cobertura), ''), 'S/C') || ' - ' || COALESCE(NULLIF(TRIM(c.cobertura), ''), 'Sin financiador') AS financiador,
            COALESCE(SUM(CASE WHEN c.tipo IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) AS facturacion_fc,
            COALESCE(SUM(CASE WHEN c.tipo IN ('ND','NDE','NDA','NDB') AND NOT EXISTS (
                SELECT 1 FROM notadedebito nd WHERE nd.idcabecera = c.id AND nd.id_notadecredito IS NOT NULL
            ) THEN c.debe ELSE 0 END), 0) AS incrementos_nd,
            COALESCE(SUM(CASE WHEN c.tipo IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS debitos_nc,
            COALESCE(SUM(CASE WHEN c.tipo IN ('ND','NDE','NDA','NDB') AND EXISTS (
                SELECT 1 FROM notadedebito nd WHERE nd.idcabecera = c.id AND nd.id_notadecredito IS NOT NULL
            ) THEN c.debe ELSE 0 END), 0) AS refacturado_nd,
            COALESCE(SUM(CASE WHEN c.tipo IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS cobrado_rc,
            (
                COALESCE(SUM(CASE WHEN c.tipo IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN c.tipo IN ('ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN c.tipo IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN c.tipo IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0)
            ) AS saldo_pendiente
        FROM cabecera c
        WHERE c.fecha IS NOT NULL
          AND c.periodo IS NOT NULL AND TRIM(CAST(c.periodo AS text)) <> '' AND UPPER(TRIM(CAST(c.periodo AS text))) <> 'S/P'
        GROUP BY 1
        HAVING (
            COALESCE(SUM(CASE WHEN c.tipo IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) +
            COALESCE(SUM(CASE WHEN c.tipo IN ('ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN c.tipo IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN c.tipo IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0)
        ) > 0
        ORDER BY saldo_pendiente DESC
    """, nativeQuery = true)
    List<Object[]> obtenerBalanceFinancieroPorFinanciador();

    /**
     * 2. DONUT: Distribución de Cartera por Financiador (Solo saldos positivos).
     */
    @Query(value = """
        SELECT 
            COALESCE(NULLIF(TRIM(c.codigo_cobertura), ''), 'S/C') || ' - ' || COALESCE(NULLIF(TRIM(c.cobertura), ''), 'Sin financiador') AS financiador,
            (
                COALESCE(SUM(CASE WHEN c.tipo IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN c.tipo IN ('ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN c.tipo IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN c.tipo IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0)
            ) AS saldo
        FROM cabecera c
        WHERE c.fecha IS NOT NULL
        GROUP BY 1
        HAVING (
            COALESCE(SUM(CASE WHEN c.tipo IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) +
            COALESCE(SUM(CASE WHEN c.tipo IN ('ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN c.tipo IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN c.tipo IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0)
        ) > 0
        ORDER BY saldo DESC
    """, nativeQuery = true)
    List<Object[]> obtenerDistribucionCarteraDonut();

    /**
     * Evolucion mensual imputada por período de factura original (excluye registros sin período 'S/P').
     * Retorna Object[4]: [0]=periodo(String 'YYYY-MM'), [1]=facturacion,
     * [2]=debitos, [3]=cobranzas.
     */
    @Query(value = """
        SELECT 
            TO_CHAR(COALESCE(fc.fecha, c.fecha), 'YYYY-MM') AS periodo,
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) AS facturado,
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS debitos,
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS cobrado
        FROM cabecera c
        LEFT JOIN cabecera fc ON (
            (c.asociadogrupo IS NOT NULL AND fc.id = c.asociadogrupo)
            OR (c.asociadogrupo IS NULL AND c.asociado IS NOT NULL AND fc.id = c.asociado)
            OR (c.asociadogrupo IS NULL AND c.asociado IS NULL AND c.grupo IS NOT NULL AND fc.id = c.grupo)
        ) AND UPPER(TRIM(fc.tipo)) IN ('FC','FAC','FCE','FCA')
        WHERE c.fecha IS NOT NULL
          AND c.periodo IS NOT NULL 
          AND TRIM(CAST(c.periodo AS text)) <> '' 
          AND UPPER(TRIM(CAST(c.periodo AS text))) <> 'S/P'
        GROUP BY 1
        ORDER BY 1 ASC
        """, nativeQuery = true)
    List<Object[]> obtenerEvolucionMensual();

    /**
     * Aging financiero: saldo pendiente de facturas agrupado por rango de antigüedad.
     * Retorna Object[2]: [0]=rango(String), [1]=saldo(BigDecimal).
     * Solo incluye registros de tipo FC con saldo > 0.
     */
    @Query(value = """
        SELECT
          CASE
            WHEN CURRENT_DATE - c.fecha <= 30  THEN '0-30 días'
            WHEN CURRENT_DATE - c.fecha <= 60  THEN '31-60 días'
            WHEN CURRENT_DATE - c.fecha <= 90  THEN '61-90 días'
            WHEN CURRENT_DATE - c.fecha <= 180 THEN '91-180 días'
            ELSE 'Más de 180 días'
          END AS rango,
          SUM(c.debe - COALESCE(c.haber, 0)) AS saldo
        FROM cabecera c
        WHERE c.tipo IN ('FC','FAC','FCE','FCA')
          AND (c.debe - COALESCE(c.haber, 0)) > 0
        GROUP BY 1
        ORDER BY MIN(CURRENT_DATE - c.fecha) ASC
        """, nativeQuery = true)
    List<Object[]> obtenerAgingFinanciero();

    /**
     * Obtiene las cabeceras necesarias para armar la cuenta corriente a 3 niveles.
     * Excluye registros sin financiador o sin fecha, ordenadas por fecha descendente.
     */
    @Query("""
        SELECT c FROM Cabecera c
        WHERE c.fecha IS NOT NULL
          AND (
            (c.cobertura IS NOT NULL AND TRIM(c.cobertura) <> '')
            OR (c.codigoCobertura IS NOT NULL AND TRIM(c.codigoCobertura) <> '')
            OR c.asociadogrupo IS NOT NULL
            OR c.asociado IS NOT NULL
            OR c.grupo IS NOT NULL
          )
        ORDER BY c.fecha ASC, c.id ASC
    """)
    List<Cabecera> findCabecerasParaCuentaCorriente();

    /**
     * Obtiene los IDs de Cabecera de tipo ND que corresponden a refacturaciones
     * (es decir, que son hijas o derivan de una Nota de Crédito).
     */
    @Query(value = """
        SELECT DISTINCT c.id
        FROM cabecera c
        WHERE UPPER(TRIM(c.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
          AND (
            EXISTS (
                SELECT 1 FROM notadedebito nd
                WHERE nd.idcabecera = c.id
                  AND nd.id_notadecredito IS NOT NULL
            )
            OR EXISTS (
                SELECT 1 FROM cabecera c_nc
                WHERE c_nc.id = c.asociado
                  AND UPPER(TRIM(c_nc.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
            )
            OR EXISTS (
                SELECT 1 FROM nd_ajustedeiva iva
                WHERE iva.idcabecera = c.id
            )
          )
        """, nativeQuery = true)
    List<Long> findIdsNdHijosDeNc();

    /**
     * Obtiene los años disponibles con comprobantes de cobro/recaudación
     * (RC, RCA, RCB, REC, OP), ordenados de mayor a menor.
     */
    @Query(value = """
        SELECT DISTINCT CAST(EXTRACT(YEAR FROM c.fecha) AS INTEGER) AS anio
        FROM cabecera c
        WHERE c.fecha IS NOT NULL
          AND UPPER(TRIM(c.tipo)) IN ('RC', 'RCA', 'RCB', 'REC', 'OP')
        ORDER BY anio DESC
        """, nativeQuery = true)
    List<Integer> obtenerAniosRecaudacionDisponibles();

    /**
     * Obtiene los montos recaudados agrupados por Financiador y Mes (1 al 12)
     * para el año especificado, considerando comprobantes de cobro (RC, RCA, RCB, REC, OP).
     * Retorna Object[3]: [0]=financiador (String), [1]=mes (Integer), [2]=monto (BigDecimal).
     */
    @Query(value = """
        SELECT
            COALESCE(NULLIF(TRIM(c.cobertura), ''), COALESCE(NULLIF(TRIM(c.codigo_cobertura), ''), 'Sin financiador')) AS financiador,
            CAST(EXTRACT(MONTH FROM c.fecha) AS INTEGER) AS mes,
            SUM(CASE WHEN c.haber IS NOT NULL AND c.haber > 0 THEN c.haber WHEN c.debe IS NOT NULL AND c.debe > 0 THEN c.debe ELSE 0 END) AS monto,
            COALESCE(NULLIF(TRIM(c.codigo_cobertura), ''), '') AS codigo_cobertura
        FROM cabecera c
        WHERE c.fecha IS NOT NULL
          AND CAST(EXTRACT(YEAR FROM c.fecha) AS INTEGER) = :anio
          AND UPPER(TRIM(c.tipo)) IN ('RC', 'RCA', 'RCB', 'REC', 'OP')
        GROUP BY 1, 2, 4
        ORDER BY 1 ASC, 2 ASC
        """, nativeQuery = true)
    List<Object[]> obtenerMatrizRecaudacionPorAnio(@Param("anio") Integer anio);

    /**
     * Extrae los comprobantes pertenecientes a cadenas de vida (FC, NC, ND, RC),
     * ordenados cronológicamente por fecha ASC e id ASC para la reconstrucción
     * del historial de trazabilidad en memoria.
     */
    @Query("""
        SELECT c FROM Cabecera c
        WHERE c.fecha IS NOT NULL
          AND (
            c.asociadogrupo IS NOT NULL
            OR c.grupo IS NOT NULL
            OR c.asociado IS NOT NULL
            OR UPPER(TRIM(c.tipo)) IN ('FC', 'FCE', 'FCA', 'FAC')
          )
        ORDER BY c.fecha ASC, c.id ASC
    """)
    List<Cabecera> findComprobantesParaTrazabilidad();

    @Query(value = """
        SELECT 
          CAST(CURRENT_DATE - c.fecha AS INTEGER) AS dias_atraso,
          (c.debe - COALESCE(c.haber, 0)) AS saldo
        FROM cabecera c
        WHERE c.tipo IN ('FC','FAC','FCE','FCA') 
          AND (c.debe - COALESCE(c.haber, 0)) > 0
    """, nativeQuery = true)
    List<Object[]> obtenerDetalleFacturasPendientes();
}

