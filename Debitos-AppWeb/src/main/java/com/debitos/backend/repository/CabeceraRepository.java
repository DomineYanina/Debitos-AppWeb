package com.debitos.backend.repository;

import com.debitos.backend.model.Cabecera;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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

    @Query("SELECT c FROM Cabecera c WHERE c.asociadogrupo IN :idsGrupos OR c.grupo IN :idsGrupos OR c.asociado IN :idsGrupos OR c.id IN :idsGrupos")
    List<Cabecera> findByGrupoOrAsociadogrupoOrIdIn(@Param("idsGrupos") Collection<Long> idsGrupos);

    @Query("""
        SELECT new com.debitos.backend.dto.CabeceraLigeraDTO(
            c.id, c.tipo, c.letra, c.ptovta, c.numero, c.fecha, c.periodo,
            c.tiporegistro, c.codigoCobertura, c.cobertura, c.origen, c.grupo,
            c.asociado, c.asociadogrupo, c.debe, c.haber, c.idEstado, c.comprobante
        )
        FROM Cabecera c
        WHERE c.asociadogrupo IN :idsGrupos OR c.grupo IN :idsGrupos OR c.asociado IN :idsGrupos OR c.id IN :idsGrupos
    """)
    List<com.debitos.backend.dto.CabeceraLigeraDTO> findLigeraByGrupoOrAsociadogrupoOrIdIn(@Param("idsGrupos") Collection<Long> idsGrupos);

    @Query("""
        SELECT new com.debitos.backend.dto.CabeceraLigeraDTO(
            c.id, c.tipo, c.letra, c.ptovta, c.numero, c.fecha, c.periodo,
            c.tiporegistro, c.codigoCobertura, c.cobertura, c.origen, c.grupo,
            c.asociado, c.asociadogrupo, c.debe, c.haber, c.idEstado, c.comprobante
        )
        FROM Cabecera c
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
    List<com.debitos.backend.dto.CabeceraLigeraDTO> findCabecerasLigerasParaCuentaCorriente();

    @Query("""
        SELECT new com.debitos.backend.dto.CabeceraLigeraDTO(
            c.id, c.tipo, c.letra, c.ptovta, c.numero, c.fecha, c.periodo,
            c.tiporegistro, c.codigoCobertura, c.cobertura, c.origen, c.grupo,
            c.asociado, c.asociadogrupo, c.debe, c.haber, c.idEstado, c.comprobante
        )
        FROM Cabecera c
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
    Page<com.debitos.backend.dto.CabeceraLigeraDTO> findCabecerasLigerasParaCuentaCorriente(Pageable pageable);

    @Query("""
        SELECT new com.debitos.backend.dto.CabeceraLigeraDTO(
            c.id, c.tipo, c.letra, c.ptovta, c.numero, c.fecha, c.periodo,
            c.tiporegistro, c.codigoCobertura, c.cobertura, c.origen, c.grupo,
            c.asociado, c.asociadogrupo, c.debe, c.haber, c.idEstado, c.comprobante
        )
        FROM Cabecera c
        WHERE c.fecha IS NOT NULL
          AND (
            c.asociadogrupo IS NOT NULL
            OR c.grupo IS NOT NULL
            OR c.asociado IS NOT NULL
            OR UPPER(TRIM(c.tipo)) IN ('FC', 'FCE', 'FCA', 'FAC')
          )
        ORDER BY c.fecha ASC, c.id ASC
    """)
    List<com.debitos.backend.dto.CabeceraLigeraDTO> findComprobantesLigerosParaTrazabilidad();

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
        WITH docs_anulados AS (
            SELECT DISTINCT ca.idcabecera AS id
            FROM comprobantes_anulados ca
            WHERE ca.idcabecera IS NOT NULL
        ),
        docs_anuladores AS (
            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
        ),
        pares_anulados_15d AS (
            SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
            FROM cabecera c_nc
            JOIN cabecera c_fac ON (
                c_nc.asociado = c_fac.id
                OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                    AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                         OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
            )
            WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
              AND COALESCE(c_fac.debe, 0) > 0
              AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
              AND c_fac.fecha IS NOT NULL
              AND c_nc.fecha IS NOT NULL
              AND ABS(c_nc.fecha - c_fac.fecha) <= 15
        ),
        ids_anulados_15d AS (
            SELECT id FROM docs_anulados
            UNION
            SELECT id FROM docs_anuladores
            UNION
            SELECT id_fac AS id FROM pares_anulados_15d
            UNION
            SELECT id_nc AS id FROM pares_anulados_15d
        )
        SELECT 
            COALESCE(NULLIF(TRIM(c.codigo_cobertura), ''), 'S/C') || ' - ' || COALESCE(NULLIF(TRIM(c.cobertura), ''), 'Sin financiador') AS financiador,
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) AS facturacion_fc,
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') AND EXISTS (
                SELECT 1 FROM cabecera c_fac WHERE c_fac.id = c.asociado AND UPPER(TRIM(c_fac.tipo)) LIKE '%F%'
            ) THEN c.debe ELSE 0 END), 0) AS incrementos_nd,
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS debitos_nc,
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') AND EXISTS (
                SELECT 1 FROM cabecera c_nc WHERE c_nc.id = c.asociado AND UPPER(TRIM(c_nc.tipo)) LIKE '%N%'
            ) THEN c.debe ELSE 0 END), 0) AS refacturado_nd,
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS cobrado_rc,
            (
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0)
            ) AS saldo_pendiente
        FROM cabecera c
        WHERE c.fecha IS NOT NULL
          AND (c.periodo IS NOT NULL OR c.fecha IS NOT NULL)
          AND c.id NOT IN (SELECT id FROM ids_anulados_15d)
        GROUP BY 1
        HAVING (
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) +
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0)
        ) > 0
        ORDER BY saldo_pendiente DESC
    """, nativeQuery = true)
    List<Object[]> obtenerBalanceFinancieroPorFinanciador();

    /**
     * 2. DONUT: Distribución de Cartera por Financiador (Solo saldos positivos).
     */
    @Query(value = """
        WITH docs_anulados AS (
            SELECT DISTINCT ca.idcabecera AS id
            FROM comprobantes_anulados ca
            WHERE ca.idcabecera IS NOT NULL
        ),
        docs_anuladores AS (
            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
        ),
        pares_anulados_15d AS (
            SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
            FROM cabecera c_nc
            JOIN cabecera c_fac ON (
                c_nc.asociado = c_fac.id
                OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                    AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                         OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
            )
            WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
              AND COALESCE(c_fac.debe, 0) > 0
              AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
              AND c_fac.fecha IS NOT NULL
              AND c_nc.fecha IS NOT NULL
              AND ABS(c_nc.fecha - c_fac.fecha) <= 15
        ),
        ids_anulados_15d AS (
            SELECT id FROM docs_anulados
            UNION
            SELECT id FROM docs_anuladores
            UNION
            SELECT id_fac AS id FROM pares_anulados_15d
            UNION
            SELECT id_nc AS id FROM pares_anulados_15d
        )
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
          AND c.id NOT IN (SELECT id FROM ids_anulados_15d)
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
     * Evolucion mensual agrupada por periodo de la factura original.
     * Retorna Object[4]: [0]=periodo(String 'YYYY-MM'), [1]=facturacion,
     * [2]=debitos, [3]=cobranzas.
     */
    @Query(value = """
        WITH docs_anulados AS (
            SELECT DISTINCT ca.idcabecera AS id
            FROM comprobantes_anulados ca
            WHERE ca.idcabecera IS NOT NULL
        ),
        docs_anuladores AS (
            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
        ),
        pares_anulados_15d AS (
            SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
            FROM cabecera c_nc
            JOIN cabecera c_fac ON (
                c_nc.asociado = c_fac.id
                OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                    AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                         OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
            )
            WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
              AND COALESCE(c_fac.debe, 0) > 0
              AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
              AND c_fac.fecha IS NOT NULL
              AND c_nc.fecha IS NOT NULL
              AND ABS(c_nc.fecha - c_fac.fecha) <= 15
        ),
        ids_anulados_15d AS (
            SELECT id FROM docs_anulados
            UNION
            SELECT id FROM docs_anuladores
            UNION
            SELECT id_fac AS id FROM pares_anulados_15d
            UNION
            SELECT id_nc AS id FROM pares_anulados_15d
        ),
        fc_madre AS (
            SELECT DISTINCT ON (COALESCE(asociadogrupo, grupo))
                COALESCE(asociadogrupo, grupo) AS gid,
                periodo,
                fecha
            FROM cabecera
            WHERE UPPER(TRIM(tipo)) IN ('FC','FAC','FCE','FCA')
              AND COALESCE(asociadogrupo, grupo) IS NOT NULL
              AND id NOT IN (SELECT id FROM ids_anulados_15d)
            ORDER BY COALESCE(asociadogrupo, grupo), fecha ASC, id ASC
        )
        SELECT 
            TO_CHAR(
                CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(c.periodo, c.fecha)
                     ELSE COALESCE(fc.periodo, fc.fecha)
                END
            , 'YYYY-MM') AS periodo,
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) AS facturado,
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS debitos,
            COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS cobrado
        FROM cabecera c
        LEFT JOIN fc_madre fc ON COALESCE(c.asociadogrupo, c.grupo) = fc.gid
        WHERE (
            CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(c.periodo, c.fecha)
                 ELSE COALESCE(fc.periodo, fc.fecha)
            END
        ) IS NOT NULL
          AND c.id NOT IN (SELECT id FROM ids_anulados_15d)
        GROUP BY 1
        ORDER BY 1 ASC
        """, nativeQuery = true)
    List<Object[]> obtenerEvolucionMensual();

    /**
     * Aging financiero: saldo vivo pendiente agrupado por familia de comprobantes
     * y clasificado por rango de antigüedad (CURRENT_DATE - fecha de emisión de Factura Madre).
     * Retorna Object[2]: [0]=rango(String), [1]=saldo(BigDecimal).
     * Solo incluye familias con saldo vivo > 0.
     */
    @Query(value = """
        WITH docs_anulados AS (
            SELECT DISTINCT ca.idcabecera AS id
            FROM comprobantes_anulados ca
            WHERE ca.idcabecera IS NOT NULL
        ),
        docs_anuladores AS (
            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
        ),
        pares_anulados_15d AS (
            SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
            FROM cabecera c_nc
            JOIN cabecera c_fac ON (
                c_nc.asociado = c_fac.id
                OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                    AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                         OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
            )
            WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
              AND COALESCE(c_fac.debe, 0) > 0
              AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
              AND c_fac.fecha IS NOT NULL
              AND c_nc.fecha IS NOT NULL
              AND ABS(c_nc.fecha - c_fac.fecha) <= 15
        ),
        ids_anulados_15d AS (
            SELECT id FROM docs_anulados
            UNION
            SELECT id FROM docs_anuladores
            UNION
            SELECT id_fac AS id FROM pares_anulados_15d
            UNION
            SELECT id_nc AS id FROM pares_anulados_15d
        ),
        familia AS (
            SELECT 
                COALESCE(c.asociadogrupo, c.grupo, c.asociado, c.id) AS id_familia,
                MIN(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.fecha END) AS fecha_emision,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA','ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0)
                - COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP','NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS saldo_vivo
            FROM cabecera c
            WHERE c.id NOT IN (SELECT id FROM ids_anulados_15d)
            GROUP BY COALESCE(c.asociadogrupo, c.grupo, c.asociado, c.id)
            HAVING MIN(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.fecha END) IS NOT NULL
               AND (
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA','ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0)
                    - COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP','NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0)
               ) > 0
        )
        SELECT 
            CASE 
                WHEN CURRENT_DATE - fecha_emision <= 30 THEN '0-30 días'
                WHEN CURRENT_DATE - fecha_emision <= 60 THEN '31-60 días'
                WHEN CURRENT_DATE - fecha_emision <= 90 THEN '61-90 días'
                WHEN CURRENT_DATE - fecha_emision <= 180 THEN '91-180 días'
                ELSE 'Más de 180 días'
            END AS rango,
            SUM(saldo_vivo) AS saldo
        FROM familia
        GROUP BY 1
        ORDER BY MIN(CURRENT_DATE - fecha_emision) ASC
        """, nativeQuery = true)
    List<Object[]> obtenerAgingFinanciero();

    /**
     * Tiempo de Cobranza (Cobro Real Promedio / DSO de lo Cobrado):
     * Calcula los días promedio ponderados transcurridos entre la fecha de emisión
     * de la Factura Madre y la fecha de cobro efectivo de sus Recibos vinculados por familia.
     */
    @Query(value = """
        WITH docs_anulados AS (
            SELECT DISTINCT ca.idcabecera AS id
            FROM comprobantes_anulados ca
            WHERE ca.idcabecera IS NOT NULL
        ),
        docs_anuladores AS (
            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
        ),
        pares_anulados_15d AS (
            SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
            FROM cabecera c_nc
            JOIN cabecera c_fac ON (
                c_nc.asociado = c_fac.id
                OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                    AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                         OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
            )
            WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
              AND COALESCE(c_fac.debe, 0) > 0
              AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
              AND c_fac.fecha IS NOT NULL
              AND c_nc.fecha IS NOT NULL
              AND ABS(c_nc.fecha - c_fac.fecha) <= 15
        ),
        ids_anulados_15d AS (
            SELECT id FROM docs_anulados
            UNION
            SELECT id FROM docs_anuladores
            UNION
            SELECT id_fac AS id FROM pares_anulados_15d
            UNION
            SELECT id_nc AS id FROM pares_anulados_15d
        ),
        facturas AS (
            SELECT 
                COALESCE(c.asociadogrupo, c.grupo, c.asociado, c.id) AS id_familia,
                MIN(c.fecha) AS fecha_emision
            FROM cabecera c
            WHERE UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA')
              AND c.fecha IS NOT NULL
              AND c.id NOT IN (SELECT id FROM ids_anulados_15d)
            GROUP BY COALESCE(c.asociadogrupo, c.grupo, c.asociado, c.id)
        ),
        recibos AS (
            SELECT 
                COALESCE(c.asociadogrupo, c.grupo, c.asociado, c.id) AS id_familia,
                c.fecha AS fecha_pago,
                COALESCE(CASE WHEN c.haber > 0 THEN c.haber WHEN c.debe > 0 THEN c.debe ELSE 0 END, 0) AS monto_recibo
            FROM cabecera c
            WHERE UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP')
              AND c.fecha IS NOT NULL
              AND (c.haber > 0 OR c.debe > 0)
        )
        SELECT 
            COALESCE(
                CAST(ROUND(
                    SUM(r.monto_recibo * GREATEST(0, CAST(r.fecha_pago - f.fecha_emision AS INTEGER)))
                    / NULLIF(SUM(r.monto_recibo), 0)
                ) AS INTEGER),
                0
            ) AS cobro_real_promedio
        FROM recibos r
        JOIN facturas f ON r.id_familia = f.id_familia
        """, nativeQuery = true)
    Integer obtenerCobroRealPromedio();

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
     * (es decir, aquellas cuyo comprobante asociado contiene 'N' en su tipo).
     */
    @Query(value = """
        SELECT DISTINCT c.id
        FROM cabecera c
        WHERE UPPER(TRIM(c.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
          AND EXISTS (
              SELECT 1 FROM cabecera c_nc
              WHERE c_nc.id = c.asociado
                AND UPPER(TRIM(c_nc.tipo)) LIKE '%N%'
          )
        """, nativeQuery = true)
    List<Long> findIdsNdHijosDeNc();

    /**
     * Obtiene los IDs de Cabecera de tipo ND que corresponden a incrementos / ajustes
     * (es decir, aquellas cuyo comprobante asociado contiene 'F' en su tipo).
     */
    @Query(value = """
        SELECT DISTINCT c.id
        FROM cabecera c
        WHERE UPPER(TRIM(c.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
          AND EXISTS (
              SELECT 1 FROM cabecera c_fac
              WHERE c_fac.id = c.asociado
                AND UPPER(TRIM(c_fac.tipo)) LIKE '%F%'
          )
        """, nativeQuery = true)
    List<Long> findIdsNdHijosDeFc();

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
            CASE
                WHEN c.codigo_cobertura IS NOT NULL AND TRIM(c.codigo_cobertura) <> '' 
                     AND c.cobertura IS NOT NULL AND TRIM(c.cobertura) <> ''
                     AND TRIM(c.cobertura) NOT LIKE TRIM(c.codigo_cobertura) || ' - %'
                THEN TRIM(c.codigo_cobertura) || ' - ' || TRIM(c.cobertura)
                WHEN c.codigo_cobertura IS NOT NULL AND TRIM(c.codigo_cobertura) <> ''
                THEN TRIM(c.codigo_cobertura)
                ELSE COALESCE(NULLIF(TRIM(c.cobertura), ''), 'Sin financiador')
            END AS financiador,
            CAST(EXTRACT(MONTH FROM c.fecha) AS INTEGER) AS mes,
            SUM(CASE WHEN c.haber IS NOT NULL AND c.haber > 0 THEN c.haber WHEN c.debe IS NOT NULL AND c.debe > 0 THEN c.debe ELSE 0 END) AS monto,
            COALESCE(NULLIF(TRIM(c.codigo_cobertura), ''), '') AS codigo_cobertura
        FROM cabecera c
        WHERE c.fecha IS NOT NULL
          AND c.fecha >= MAKE_DATE(:anio, 1, 1)
          AND c.fecha <= MAKE_DATE(:anio, 12, 31)
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
        WITH docs_anulados AS (
            SELECT DISTINCT ca.idcabecera AS id
            FROM comprobantes_anulados ca
            WHERE ca.idcabecera IS NOT NULL
        ),
        docs_anuladores AS (
            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
        ),
        pares_anulados_15d AS (
            SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
            FROM cabecera c_nc
            JOIN cabecera c_fac ON (
                c_nc.asociado = c_fac.id
                OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                    AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                         OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
            )
            WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
              AND COALESCE(c_fac.debe, 0) > 0
              AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
              AND c_fac.fecha IS NOT NULL
              AND c_nc.fecha IS NOT NULL
              AND ABS(c_nc.fecha - c_fac.fecha) <= 15
        ),
        ids_anulados_15d AS (
            SELECT id FROM docs_anulados
            UNION
            SELECT id FROM docs_anuladores
            UNION
            SELECT id_fac AS id FROM pares_anulados_15d
            UNION
            SELECT id_nc AS id FROM pares_anulados_15d
        ),
        familia AS (
            SELECT 
                COALESCE(c.asociadogrupo, c.grupo, c.asociado, c.id) AS id_familia,
                MIN(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.fecha END) AS fecha_emision,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA','ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0)
                - COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP','NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS saldo_vivo
            FROM cabecera c
            WHERE c.id NOT IN (SELECT id FROM ids_anulados_15d)
            GROUP BY COALESCE(c.asociadogrupo, c.grupo, c.asociado, c.id)
            HAVING MIN(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.fecha END) IS NOT NULL
               AND (
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA','ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0)
                    - COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP','NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0)
               ) > 0
        )
        SELECT 
          CAST(CURRENT_DATE - fecha_emision AS INTEGER) AS dias_atraso,
          saldo_vivo AS saldo
        FROM familia
    """, nativeQuery = true)
    List<Object[]> obtenerDetalleFacturasPendientes();

    /**
     * Obtiene los IDs de comprobantes (tanto la Factura como la Nota de Crédito)
     * en aquellos casos donde una NC apunta a una FC, ambos comprobantes tienen
     * exactamente el mismo monto y la diferencia entre sus fechas es de 15 días o menos.
     */
    @Query(value = """
        WITH docs_anulados AS (
            SELECT DISTINCT ca.idcabecera AS id
            FROM comprobantes_anulados ca
            WHERE ca.idcabecera IS NOT NULL
        ),
        docs_anuladores AS (
            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
              AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15

            UNION

            SELECT c_anulador.id
            FROM cabecera c_anulador
            JOIN cabecera c_anulado ON (
                c_anulador.asociado = c_anulado.id
                OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id)
            )
            JOIN docs_anulados da ON da.id = c_anulado.id
            WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
              AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
              AND COALESCE(c_anulado.debe, 0) > 0
              AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
              AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
              AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
        ),
        pares_anulados_15d AS (
            SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
            FROM cabecera c_nc
            JOIN cabecera c_fac ON (
                c_nc.asociado = c_fac.id
                OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                    AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                         OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
            )
            WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
              AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
              AND COALESCE(c_fac.debe, 0) > 0
              AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
              AND c_fac.fecha IS NOT NULL
              AND c_nc.fecha IS NOT NULL
              AND ABS(c_nc.fecha - c_fac.fecha) <= 15
        ),
        ids_anulados_15d AS (
            SELECT id FROM docs_anulados
            UNION
            SELECT id FROM docs_anuladores
            UNION
            SELECT id_fac AS id FROM pares_anulados_15d
            UNION
            SELECT id_nc AS id FROM pares_anulados_15d
        )
        SELECT id FROM ids_anulados_15d
        """, nativeQuery = true)
    List<Long> findIdsComprobantesAnulados15Dias();

    /**
     * Obtiene los IDs de grupo (asociadogrupo, grupo, asociado o id) de las facturas origen (FC)
     * cuya fecha se encuentre dentro del rango especificado para acelerar la trazabilidad.
     */
    @Query(value = """
        SELECT DISTINCT COALESCE(NULLIF(c.asociadogrupo, 0), NULLIF(c.grupo, 0), NULLIF(c.asociado, 0), c.id)
        FROM cabecera c
        WHERE UPPER(TRIM(c.tipo)) IN ('FC', 'FAC', 'FCE', 'FCA')
          AND c.fecha IS NOT NULL
          AND (CAST(:desde AS date) IS NULL OR c.fecha >= :desde)
          AND (CAST(:hasta AS date) IS NULL OR c.fecha <= :hasta)
        """, nativeQuery = true)
    List<Long> findIdsGruposFacturasPorRangoFechas(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    /**
     * Obtiene los IDs de grupo (asociadogrupo, grupo, asociado o id) de las facturas origen (FC)
     * ordenadas por fecha más reciente descendente, filtrando opcionalmente por financiador y acotando por límite.
     */
    @Query(value = """
        SELECT COALESCE(NULLIF(c.asociadogrupo, 0), NULLIF(c.grupo, 0), NULLIF(c.asociado, 0), c.id)
        FROM cabecera c
        WHERE UPPER(TRIM(c.tipo)) IN ('FC', 'FAC', 'FCE', 'FCA')
          AND c.fecha IS NOT NULL
          AND (CAST(:desde AS date) IS NULL OR c.fecha >= :desde)
          AND (CAST(:hasta AS date) IS NULL OR c.fecha <= :hasta)
          AND (
              :financiador IS NULL 
              OR TRIM(:financiador) = '' 
              OR UPPER(TRIM(:financiador)) = 'TODAS'
              OR UPPER(TRIM(c.codigo_cobertura)) = UPPER(TRIM(:financiador))
              OR UPPER(TRIM(c.cobertura)) LIKE UPPER(CONCAT('%', TRIM(:financiador), '%'))
          )
        GROUP BY COALESCE(NULLIF(c.asociadogrupo, 0), NULLIF(c.grupo, 0), NULLIF(c.asociado, 0), c.id)
        ORDER BY MAX(c.fecha) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Long> findIdsGruposFacturasPorRangoFechasYFinanciador(
            @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta,
            @Param("financiador") String financiador,
            @Param("limit") int limit);

    /**
     * Obtiene los IDs de grupo (asociadogrupo, grupo, asociado o id) de las facturas origen (FC)
     * cuyo período se encuentre dentro del rango especificado para la solapa Cuenta Corriente.
     */
    @Query(value = """
        SELECT DISTINCT COALESCE(NULLIF(c.asociadogrupo, 0), NULLIF(c.grupo, 0), NULLIF(c.asociado, 0), c.id)
        FROM cabecera c
        WHERE UPPER(TRIM(c.tipo)) IN ('FC', 'FAC', 'FCE', 'FCA')
          AND c.periodo IS NOT NULL
          AND (CAST(:desde AS date) IS NULL OR c.periodo >= :desde)
          AND (CAST(:hasta AS date) IS NULL OR c.periodo <= :hasta)
        """, nativeQuery = true)
    List<Long> findIdsGruposFacturasPorRangoPeriodos(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query(value = """
        SELECT DISTINCT COALESCE(NULLIF(c.asociadogrupo, 0), NULLIF(c.grupo, 0), NULLIF(c.asociado, 0), c.id)
        FROM cabecera c
        WHERE UPPER(TRIM(c.tipo)) IN ('FC', 'FAC', 'FCE', 'FCA')
          AND c.fecha IS NOT NULL
          AND (CAST(:desde AS date) IS NULL OR c.fecha >= :desde)
          AND (CAST(:hasta AS date) IS NULL OR c.fecha <= :hasta)
        ORDER BY 1
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Long> findIdsGruposFacturasPorRangoFechasPaginado(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta, @Param("limit") int limit, @Param("offset") int offset);

    @Query(value = """
        SELECT COUNT(DISTINCT COALESCE(NULLIF(c.asociadogrupo, 0), NULLIF(c.grupo, 0), NULLIF(c.asociado, 0), c.id))
        FROM cabecera c
        WHERE UPPER(TRIM(c.tipo)) IN ('FC', 'FAC', 'FCE', 'FCA')
          AND c.fecha IS NOT NULL
          AND (CAST(:desde AS date) IS NULL OR c.fecha >= :desde)
          AND (CAST(:hasta AS date) IS NULL OR c.fecha <= :hasta)
        """, nativeQuery = true)
    long countIdsGruposFacturasPorRangoFechas(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    /**
     * Obtiene los IDs de grupo (asociadogrupo, grupo, asociado o id) de las familias
     * Obtiene los IDs de grupo (asociadogrupo, grupo, asociado o id) de aquellos comprobantes
     * que contienen 2 o más Notas de Débito (ND) y al menos 1 Nota de Crédito (NC), lo que indica
     * un posible "bucle de insistencia" (refacturaciones sucesivas ante débitos).
     * Se limita al rango de fechas indicado para reducir el volumen de datos procesado.
     */
    @Query(value = """
        SELECT COALESCE(NULLIF(c.asociadogrupo, 0), NULLIF(c.grupo, 0), NULLIF(c.asociado, 0), c.id)
        FROM cabecera c
        GROUP BY COALESCE(NULLIF(c.asociadogrupo, 0), NULLIF(c.grupo, 0), NULLIF(c.asociado, 0), c.id)
        HAVING (
            COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
                            AND c.fecha IS NOT NULL
                            AND (CAST(:desde AS date) IS NULL OR c.fecha >= :desde)
                            AND (CAST(:hasta AS date) IS NULL OR c.fecha <= :hasta)
                       THEN 1 END) >= 2
            OR (
                COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB') THEN 1 END) >= 2
                AND COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC', 'FAC', 'FCE', 'FCA')
                               AND c.fecha IS NOT NULL
                               AND (CAST(:desde AS date) IS NULL OR c.fecha >= :desde)
                               AND (CAST(:hasta AS date) IS NULL OR c.fecha <= :hasta)
                          THEN 1 END) >= 1
            )
        )
           AND COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB') THEN 1 END) >= 1
        """, nativeQuery = true)
    List<Long> findIdsGruposConMultiplesNc(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query(value = """
        SELECT COALESCE(NULLIF(c.asociadogrupo, 0), NULLIF(c.grupo, 0), NULLIF(c.asociado, 0), c.id)
        FROM cabecera c
        GROUP BY COALESCE(NULLIF(c.asociadogrupo, 0), NULLIF(c.grupo, 0), NULLIF(c.asociado, 0), c.id)
        HAVING (
            COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
                            AND c.fecha IS NOT NULL
                            AND (CAST(:desde AS date) IS NULL OR c.fecha >= :desde)
                            AND (CAST(:hasta AS date) IS NULL OR c.fecha <= :hasta)
                       THEN 1 END) >= 2
            OR (
                COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB') THEN 1 END) >= 2
                AND COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC', 'FAC', 'FCE', 'FCA')
                               AND c.fecha IS NOT NULL
                               AND (CAST(:desde AS date) IS NULL OR c.fecha >= :desde)
                               AND (CAST(:hasta AS date) IS NULL OR c.fecha <= :hasta)
                          THEN 1 END) >= 1
            )
        )
           AND COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB') THEN 1 END) >= 1
        ORDER BY 1
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Long> findIdsGruposConMultiplesNcPaginado(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta, @Param("limit") int limit, @Param("offset") int offset);

    @Query(value = """
        SELECT COUNT(*) FROM (
            SELECT COALESCE(NULLIF(c.asociadogrupo, 0), NULLIF(c.grupo, 0), NULLIF(c.asociado, 0), c.id)
            FROM cabecera c
            GROUP BY COALESCE(NULLIF(c.asociadogrupo, 0), NULLIF(c.grupo, 0), NULLIF(c.asociado, 0), c.id)
            HAVING (
                COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
                                AND c.fecha IS NOT NULL
                                AND (CAST(:desde AS date) IS NULL OR c.fecha >= :desde)
                                AND (CAST(:hasta AS date) IS NULL OR c.fecha <= :hasta)
                           THEN 1 END) >= 2
                OR (
                    COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB') THEN 1 END) >= 2
                    AND COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC', 'FAC', 'FCE', 'FCA')
                                   AND c.fecha IS NOT NULL
                                   AND (CAST(:desde AS date) IS NULL OR c.fecha >= :desde)
                                   AND (CAST(:hasta AS date) IS NULL OR c.fecha <= :hasta)
                              THEN 1 END) >= 1
                )
            )
               AND COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB') THEN 1 END) >= 1
        ) sub
        """, nativeQuery = true)
    long countIdsGruposConMultiplesNc(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);
}

