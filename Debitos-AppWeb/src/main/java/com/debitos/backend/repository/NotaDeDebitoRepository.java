package com.debitos.backend.repository;

import com.debitos.backend.dto.PrestacionAuditoriaDTO;
import com.debitos.backend.model.NotaDeDebito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotaDeDebitoRepository extends JpaRepository<NotaDeDebito, Integer> {

    @Query("SELECT DISTINCT c.tiporegistro FROM NotaDeDebito n JOIN n.cabecera c WHERE c.letra = :letra AND c.ptovta = :ptovta AND c.numero = :numero")
    String findDistinctTipoRegistro(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("SELECT COUNT(n) > 0 FROM NotaDeDebito n JOIN n.cabecera c WHERE c.tipo = :tipo AND c.letra = :letra AND c.ptovta = :ptovta AND c.numero = :numero")
    boolean existsByTipoAndLetraAndPtovtaAndNumero(@Param("tipo") String tipo, @Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    List<NotaDeDebito> findByCabecera_LetraAndCabecera_PtovtaAndCabecera_Numero(String letra, Integer ptovta, Integer numero);

    List<NotaDeDebito> findByCabecera_Id(Long idCabecera);

    Optional<NotaDeDebito> findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionId(String letra, Integer ptovta, Integer numero, Integer idPrestacion);

    Optional<NotaDeDebito> findByNotaDeCreditoPadreId(Integer idNotaCredito);

    @Query(value = """
        SELECT CASE
            WHEN COUNT(nc.id) > 0
                 AND COUNT(nd.id) = COUNT(nc.id)
                 AND COUNT(c_nd.tipo) = COUNT(nc.id)
                 AND COUNT(c_nd.fecha) = COUNT(nc.id)
                 AND COUNT(c_nd.letra) = COUNT(nc.id)
                 AND COUNT(c_nd.numero) = COUNT(nc.id)
                 AND COUNT(c_nd.ptovta) = COUNT(nc.id)
            THEN true
            ELSE false
        END
        FROM notadecredito nc
        INNER JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
        LEFT JOIN notadedebito nd
            ON nd.id_notadecredito = nc.id
        LEFT JOIN cabecera c_nd
            ON nd.idcabecera = c_nd.id
           AND c_nd.tipo IS NOT NULL
           AND c_nd.fecha IS NOT NULL
           AND c_nd.letra IS NOT NULL
           AND c_nd.numero IS NOT NULL
           AND c_nd.ptovta IS NOT NULL
        WHERE c_nc.letra = :letra
          AND c_nc.ptovta = :ptovta
          AND c_nc.numero = :numero
        """, nativeQuery = true)
    boolean existeNdCompletaParaNotaCredito(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query(value = """
        SELECT DISTINCT c_nd.tipo AS tipo, c_nd.letra AS letra, c_nd.ptovta AS ptovta, c_nd.numero AS numero, c_nd.fecha AS fecha, nd.tipo_nd AS tipoNd
        FROM notadedebito nd
        INNER JOIN cabecera c_nd ON nd.idcabecera = c_nd.id
        LEFT JOIN notadecredito nc ON nd.id_notadecredito = nc.id
        LEFT JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
        WHERE (c_nc.letra = :letra AND c_nc.ptovta = :ptovta AND c_nc.numero = :numero)
           OR (nd.tipo_nd = 'Por ajuste de IVA' AND c_nd.tiporegistro = (SELECT DISTINCT c2.tiporegistro FROM notadecredito n2 JOIN cabecera c2 ON n2.idcabecera = c2.id WHERE c2.letra = :letra AND c2.ptovta = :ptovta AND c2.numero = :numero LIMIT 1))
        """, nativeQuery = true)
    List<Object[]> findNdCompletaParaNotaCreditoRaw(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("SELECT COUNT(nd) > 0 FROM NotaDeDebito nd WHERE nd.notaDeCreditoPadre.id = :notaDeCreditoPadreId AND nd.tipoNd = :tipoNd")
    boolean existsByNotaDeCreditoPadreIdAndTipoNd(@Param("notaDeCreditoPadreId") Integer notaDeCreditoPadreId, @Param("tipoNd") String tipoNd);

    @Query("SELECT COUNT(nd) > 0 FROM NotaDeDebito nd JOIN nd.cabecera c WHERE c.tiporegistro = :tipoRegistro AND nd.tipoNd = :tipoNd")
    boolean existsByTiporegistroAndTipoNd(@Param("tipoRegistro") String tipoRegistro, @Param("tipoNd") String tipoNd);

    @Query(value = """
        SELECT al.id AS id, al.carnet AS carnet, c_fc.codigo_cobertura AS cobertura, al.paciente AS paciente, 
               al.plan AS plan, al.efector AS efector, al.medico AS medico, al.fecha AS fecha, al.codigo AS codigo, 
               al.descripcion AS descripcion, al.modulo AS modulo, al.grupomodulo AS grupomodulo, al.cantidad AS cantidad, 
               al.total_neto AS "totalNeto", al.coseguro AS coseguro, al.total AS total, 
               CASE WHEN nc.debitoaceptado = true THEN 'SI' WHEN nc.debitoaceptado = false THEN 'NO' ELSE NULL END AS "debitoAceptado",
               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", 
               nc.importedebitado AS "importeDebitado", nc.comentarios_debito AS "comentariosDebito",
               nc.prestacionenglobante AS "prestacionEnglobante",
               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura",
               nc1.comentarios AS "comentarioPrevio", nc.comentarios AS comentarios
        FROM notadedebito nd 
        INNER JOIN cabecera c_nd ON nd.idcabecera = c_nd.id
        RIGHT JOIN notadecredito nc1 ON nd.id_notadecredito = nc1.id 
        LEFT JOIN notadecredito nc ON nd.id = nc.id_notadedebito 
        LEFT JOIN amb_liquidado al ON al.id = nc1.id_prestacion 
        LEFT JOIN cabecera c_fc ON al.idcabecera = c_fc.id
        WHERE UPPER(c_nd.letra) = UPPER(:letra) AND c_nd.ptovta = :ptovta AND c_nd.numero = :numero
        """, nativeQuery = true)
    List<PrestacionAuditoriaDTO> findPrestacionesPorNotaDebito(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Deprecated
    @Query(value = """
        SELECT DISTINCT c_fc.letra, c_fc.ptovta, c_fc.numero
        FROM notadedebito nd
        INNER JOIN cabecera c_nd ON nd.idcabecera = c_nd.id
        JOIN amb_liquidado al ON nd.id_prestacion = al.id
        INNER JOIN cabecera c_fc ON al.idcabecera = c_fc.id
        WHERE c_nd.letra = :letra AND c_nd.ptovta = :ptovta AND c_nd.numero = :numero
        """, nativeQuery = true)
    List<Object[]> findFacturaMadreDeNd(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Deprecated
    @Query(value = """
        SELECT c_nd.tipo AS tipo, c_nd.letra AS letra, c_nd.ptovta AS ptovta, c_nd.numero AS numero, 
               CAST(MIN(c_nd.fecha) AS VARCHAR) AS fecha, SUM(COALESCE(nd.importerefactura, 0)) AS montoNeto,
               SUM(COALESCE(al.iva, 0)) AS montoIva
        FROM notadedebito nd
        INNER JOIN cabecera c_nd ON nd.idcabecera = c_nd.id
        JOIN notadecredito nc ON nc.id = nd.id_notadecredito
        INNER JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
        LEFT JOIN amb_liquidado al ON nd.id_prestacion = al.id
        WHERE UPPER(c_nc.letra) = UPPER(:letraNc) 
          AND c_nc.ptovta = :ptovtaNc 
          AND c_nc.numero = :numeroNc
          AND c_nd.tipo IS NOT NULL AND c_nd.letra IS NOT NULL AND c_nd.numero IS NOT NULL AND c_nd.ptovta IS NOT NULL
        GROUP BY c_nd.tipo, c_nd.letra, c_nd.ptovta, c_nd.numero
        ORDER BY MIN(c_nd.fecha) ASC, c_nd.numero ASC
        """, nativeQuery = true)
    List<Object[]> findNdsResumenParaNcPadre(@Param("letraNc") String letraNc, @Param("ptovtaNc") Integer ptovtaNc, @Param("numeroNc") Integer numeroNc);
}