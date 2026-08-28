package com.debitos.backend.repository;

import com.debitos.backend.dto.DocumentoAsociadoDTO;
import com.debitos.backend.dto.PrestacionAuditoriaDTO;
import com.debitos.backend.model.NotaDeCredito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotaDeCreditoRepository extends JpaRepository<NotaDeCredito, Integer> {

    @Query("SELECT DISTINCT c.tiporegistro FROM NotaDeCredito n JOIN n.cabecera c WHERE c.letra = :letra AND c.ptovta = :ptovta AND c.numero = :numero")
    String findDistinctTipoRegistro(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("SELECT COUNT(n) > 0 FROM NotaDeCredito n JOIN n.cabecera c WHERE c.tipo = :tipo AND c.letra = :letra AND c.ptovta = :ptovta AND c.numero = :numero")
    boolean existsByTipoAndLetraAndPtovtaAndNumero(@Param("tipo") String tipo, @Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("SELECT COUNT(n) > 0 FROM NotaDeCredito n JOIN n.prestacion p JOIN p.cabecera c WHERE UPPER(c.letra) = UPPER(:letra) AND c.ptovta = :ptovta AND c.numero = :numero AND LOWER(TRIM(n.motivoDebito)) = 'iva mal facturado'")
    boolean existsByFacturaAndIvaMalFacturado(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    List<NotaDeCredito> findByCabecera_LetraAndCabecera_PtovtaAndCabecera_Numero(String letra, Integer ptovta, Integer numero);

    List<NotaDeCredito> findByCabecera_Id(Long idCabecera);

    Optional<NotaDeCredito> findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionId(String letra, Integer ptovta, Integer numero, Integer idPrestacion);

    Optional<NotaDeCredito> findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionIdAndDebitoaceptadoFalse(String letra, Integer ptovta, Integer numero, Integer idPrestacion);

    Optional<NotaDeCredito> findByPrestacionIdAndNotaDeDebitoPadreIsNull(Integer idPrestacion);

    Optional<NotaDeCredito> findByNotaDeDebitoPadreId(Integer idNotaDeDebito);

    @Query(value = """
        SELECT CASE
            WHEN COUNT(al.id) > 0
                 AND COUNT(nc.id) = COUNT(al.id)
                 AND COUNT(c_nc.tipo) = COUNT(al.id)
                 AND COUNT(c_nc.fecha) = COUNT(al.id)
                 AND COUNT(c_nc.letra) = COUNT(al.id)
                 AND COUNT(c_nc.numero) = COUNT(al.id)
                 AND COUNT(c_nc.ptovta) = COUNT(al.id)
            THEN true
            ELSE false
        END
        FROM amb_liquidado al
        INNER JOIN cabecera c_fc ON al.idcabecera = c_fc.id
        LEFT JOIN notadecredito nc
            ON al.id = nc.id_prestacion
           AND nc.id_notadedebito IS NULL
        LEFT JOIN cabecera c_nc
            ON nc.idcabecera = c_nc.id
           AND c_nc.tipo IS NOT NULL
           AND c_nc.fecha IS NOT NULL
           AND c_nc.letra IS NOT NULL
           AND c_nc.numero IS NOT NULL
           AND c_nc.ptovta IS NOT NULL
        WHERE c_fc.letra = :letra
          AND c_fc.ptovta = :ptovta
          AND c_fc.numero = :numero
        """, nativeQuery = true)
    boolean existeNcCompletaParaFactura(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("""
        SELECT DISTINCT new com.debitos.backend.dto.DocumentoAsociadoDTO(cNc.tipo, cNc.letra, cNc.ptovta, cNc.numero, cNc.fecha)
        FROM NotaDeCredito nc
        JOIN nc.cabecera cNc
        JOIN nc.prestacion al
        JOIN al.cabecera cFc
        WHERE cFc.letra = :letra
          AND cFc.ptovta = :ptovta
          AND cFc.numero = :numero
          AND nc.notaDeDebitoPadre IS NULL
          AND cNc.tipo IS NOT NULL
          AND cNc.fecha IS NOT NULL
          AND cNc.letra IS NOT NULL
          AND cNc.numero IS NOT NULL
          AND cNc.ptovta IS NOT NULL
    """)
    List<DocumentoAsociadoDTO> findNcCompletaParaFactura(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query(value = """
        SELECT CASE
            WHEN COUNT(nd.id) > 0
                 AND COUNT(nc.id) = COUNT(nd.id)
                 AND COUNT(c_nc.tipo) = COUNT(nd.id)
                 AND COUNT(c_nc.fecha) = COUNT(nd.id)
                 AND COUNT(c_nc.letra) = COUNT(nd.id)
                 AND COUNT(c_nc.numero) = COUNT(nd.id)
                 AND COUNT(c_nc.ptovta) = COUNT(nd.id)
            THEN true
            ELSE false
        END
        FROM notadedebito nd
        INNER JOIN cabecera c_nd ON nd.idcabecera = c_nd.id
        LEFT JOIN notadecredito nc
            ON nc.id_notadedebito = nd.id
        LEFT JOIN cabecera c_nc
            ON nc.idcabecera = c_nc.id
           AND c_nc.tipo IS NOT NULL
           AND c_nc.fecha IS NOT NULL
           AND c_nc.letra IS NOT NULL
           AND c_nc.numero IS NOT NULL
           AND c_nc.ptovta IS NOT NULL
        WHERE c_nd.letra = :letra
          AND c_nd.ptovta = :ptovta
          AND c_nd.numero = :numero
        """, nativeQuery = true)
    boolean existeNcCompletaParaNotaDebito(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("""
        SELECT DISTINCT new com.debitos.backend.dto.DocumentoAsociadoDTO(cNc.tipo, cNc.letra, cNc.ptovta, cNc.numero, cNc.fecha)
        FROM NotaDeCredito nc
        JOIN nc.cabecera cNc
        JOIN nc.notaDeDebitoPadre nd
        JOIN nd.cabecera cNd
        WHERE cNd.letra = :letra
          AND cNd.ptovta = :ptovta
          AND cNd.numero = :numero
          AND cNc.tipo IS NOT NULL
          AND cNc.fecha IS NOT NULL
          AND cNc.letra IS NOT NULL
          AND cNc.numero IS NOT NULL
          AND cNc.ptovta IS NOT NULL
    """)
    List<DocumentoAsociadoDTO> findNcCompletaParaNotaDebito(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query(value = """
        SELECT al.id AS id, al.carnet AS carnet, c_fc.codigo_cobertura AS cobertura, al.paciente AS paciente, 
               al.plan AS plan, al.efector AS efector, al.medico AS medico, al.fecha AS fecha, al.codigo AS codigo, 
               al.descripcion AS descripcion, al.modulo AS modulo, al.grupomodulo AS grupomodulo, al.cantidad AS cantidad, 
               al.total_neto AS "totalNeto", al.coseguro AS coseguro, al.total AS total, 
               CAST(CASE WHEN nc.debitoaceptado = true THEN 'SI' WHEN nc.debitoaceptado = false THEN 'NO' ELSE NULL END AS VARCHAR) AS "debitoAceptado",
               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", 
               nc.importedebitado AS "importeDebitado", nc.comentarios_debito AS "comentariosDebito", 
               nc.prestacionenglobante AS "prestacionEnglobante",
               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura", 
               ndPadre.comentarios AS "comentarioPrevio", nc.comentarios AS comentarios,
               nc.id_notadedebito AS "idNotaDeDebito"
        FROM notadecredito nc
        INNER JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
        LEFT JOIN notadedebito ndPadre ON nc.id_notadedebito = ndPadre.id
        JOIN amb_liquidado al ON nc.id_prestacion = al.id
        INNER JOIN cabecera c_fc ON al.idcabecera = c_fc.id
        WHERE UPPER(c_nc.letra) = UPPER(:letra) AND c_nc.ptovta = :ptovta AND c_nc.numero = :numero
        """, nativeQuery = true)
    List<PrestacionAuditoriaDTO> findPrestacionesPorNotaCredito(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query(value = """
        SELECT DISTINCT 
               CAST(CASE WHEN nc.id_notadedebito IS NOT NULL THEN c_nd.tipo ELSE 'FC' END AS VARCHAR) AS tipo,
               CAST(CASE WHEN nc.id_notadedebito IS NOT NULL THEN c_nd.letra ELSE c_fc.letra END AS VARCHAR) AS letra,
               CAST(CASE WHEN nc.id_notadedebito IS NOT NULL THEN c_nd.ptovta ELSE c_fc.ptovta END AS INTEGER) AS ptovta,
               CAST(CASE WHEN nc.id_notadedebito IS NOT NULL THEN c_nd.numero ELSE c_fc.numero END AS INTEGER) AS numero,
               CAST(CASE WHEN nc.id_notadedebito IS NOT NULL THEN c_nd.fecha ELSE al.fecha END AS DATE) AS fecha
        FROM notadecredito nc
        INNER JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
        JOIN amb_liquidado al ON nc.id_prestacion = al.id
        INNER JOIN cabecera c_fc ON al.idcabecera = c_fc.id
        LEFT JOIN notadedebito ndPadre ON nc.id_notadedebito = ndPadre.id
        LEFT JOIN cabecera c_nd ON ndPadre.idcabecera = c_nd.id
        WHERE c_nc.letra = :letra AND c_nc.ptovta = :ptovta AND c_nc.numero = :numero
        """, nativeQuery = true)
    List<Object[]> findDocumentoAsociadoPadreRaw(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query(value = """
        SELECT DISTINCT c_fc.letra, c_fc.ptovta, c_fc.numero
        FROM notadecredito nc
        INNER JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
        JOIN amb_liquidado al ON nc.id_prestacion = al.id
        INNER JOIN cabecera c_fc ON al.idcabecera = c_fc.id
        WHERE c_nc.letra = :letra AND c_nc.ptovta = :ptovta AND c_nc.numero = :numero
        """, nativeQuery = true)
    List<Object[]> findFacturaMadreDeNc(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query(value = """
        SELECT c_nc.tipo AS tipo, c_nc.letra AS letra, c_nc.ptovta AS ptovta, c_nc.numero AS numero, 
               CAST(MIN(c_nc.fecha) AS VARCHAR) AS fecha, SUM(COALESCE(nc.importedebitado, 0)) AS montoNeto,
               SUM(COALESCE(al.iva, 0)) AS montoIva
        FROM notadecredito nc
        INNER JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
        JOIN amb_liquidado al ON nc.id_prestacion = al.id
        INNER JOIN cabecera c_fc ON al.idcabecera = c_fc.id
        WHERE UPPER(c_fc.letra) = UPPER(:letra) 
          AND c_fc.ptovta = :ptovta 
          AND c_fc.numero = :numero
          AND nc.id_notadedebito IS NULL
          AND c_nc.tipo IS NOT NULL AND c_nc.letra IS NOT NULL AND c_nc.numero IS NOT NULL AND c_nc.ptovta IS NOT NULL
        GROUP BY c_nc.tipo, c_nc.letra, c_nc.ptovta, c_nc.numero
        ORDER BY MIN(c_nc.fecha) ASC, c_nc.numero ASC
        """, nativeQuery = true)
    List<Object[]> findNcsResumenParaFacturaMadre(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query(value = """
        SELECT c_nc.tipo AS tipo, c_nc.letra AS letra, c_nc.ptovta AS ptovta, c_nc.numero AS numero, 
               CAST(MIN(c_nc.fecha) AS VARCHAR) AS fecha, SUM(COALESCE(nc.importedebitado, 0)) AS montoNeto,
               SUM(COALESCE(al.iva, 0)) AS montoIva
        FROM notadecredito nc
        INNER JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
        JOIN notadedebito nd ON nc.id_notadedebito = nd.id
        INNER JOIN cabecera c_nd ON nd.idcabecera = c_nd.id
        JOIN amb_liquidado al ON nc.id_prestacion = al.id
        WHERE UPPER(c_nd.letra) = UPPER(:letraNd) 
          AND c_nd.ptovta = :ptovtaNd 
          AND c_nd.numero = :numeroNd
          AND c_nc.tipo IS NOT NULL AND c_nc.letra IS NOT NULL AND c_nc.numero IS NOT NULL AND c_nc.ptovta IS NOT NULL
        GROUP BY c_nc.tipo, c_nc.letra, c_nc.ptovta, c_nc.numero
        ORDER BY MIN(c_nc.fecha) ASC, c_nc.numero ASC
        """, nativeQuery = true)
    List<Object[]> findNcsResumenParaNdPadre(@Param("letraNd") String letraNd, @Param("ptovtaNd") Integer ptovtaNd, @Param("numeroNd") Integer numeroNd);
}