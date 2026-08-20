package com.debitos.backend.repository;

import com.debitos.backend.dto.DocumentoAsociadoDTO;
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

    // Reemplaza al SELECT DISTINCT tiporegistro de la ND
    @Query("SELECT DISTINCT n.tiporegistro FROM NotaDeDebito n WHERE n.letra = :letra AND n.ptovta = :ptovta AND n.numero = :numero")
    String findDistinctTipoRegistro(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    // Verifica si ya existe una ND con el mismo tipo, letra, pto venta y número
    @Query("SELECT COUNT(n) > 0 FROM NotaDeDebito n WHERE n.tipo = :tipo AND n.letra = :letra AND n.ptovta = :ptovta AND n.numero = :numero")
    boolean existsByTipoAndLetraAndPtovtaAndNumero(@Param("tipo") String tipo, @Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    // Para traer todos los registros al consultar la grilla por ND
    List<NotaDeDebito> findByLetraAndPtovtaAndNumero(String letra, Integer ptovta, Integer numero);

    // Busca una ND específica para mapearla con la prestación
    Optional<NotaDeDebito> findByLetraAndPtovtaAndNumeroAndPrestacionId(String letra, Integer ptovta, Integer numero, Integer idPrestacion);

    // Verifica si ya existe una ND hija generada a partir de una NC madre específica
    Optional<NotaDeDebito> findByNotaDeCreditoPadreId(Integer idNotaCredito);

    // Verifica si todas las prestaciones de una NC ya tienen una ND "completa" (tipo, fecha, letra, numero y ptovta no nulos)
    @Query(value = """
        SELECT CASE
            WHEN COUNT(nc.id) > 0
                 AND COUNT(nd.id) = COUNT(nc.id)
                 AND COUNT(nd.tipo) = COUNT(nc.id)
                 AND COUNT(nd.fecha) = COUNT(nc.id)
                 AND COUNT(nd.letra) = COUNT(nc.id)
                 AND COUNT(nd.numero) = COUNT(nc.id)
                 AND COUNT(nd.ptovta) = COUNT(nc.id)
            THEN true
            ELSE false
        END
        FROM notadecredito nc
        LEFT JOIN notadedebito nd
            ON nd.id_notadecredito = nc.id
           AND nd.tipo IS NOT NULL
           AND nd.fecha IS NOT NULL
           AND nd.letra IS NOT NULL
           AND nd.numero IS NOT NULL
           AND nd.ptovta IS NOT NULL
        WHERE nc.letra = :letra
          AND nc.ptovta = :ptovta
          AND nc.numero = :numero
        """, nativeQuery = true)
    boolean existeNdCompletaParaNotaCredito(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query(value = """
        SELECT DISTINCT nd.tipo AS tipo, nd.letra AS letra, nd.ptovta AS ptovta, nd.numero AS numero, nd.fecha AS fecha, nd.tipo_nd AS tipoNd
        FROM notadedebito nd
        LEFT JOIN notadecredito nc ON nd.id_notadecredito = nc.id
        WHERE (nc.letra = :letra AND nc.ptovta = :ptovta AND nc.numero = :numero)
           OR (nd.tipo_nd = 'Por ajuste de IVA' AND nd.tiporegistro = (SELECT DISTINCT n2.tiporegistro FROM notadecredito n2 WHERE n2.letra = :letra AND n2.ptovta = :ptovta AND n2.numero = :numero LIMIT 1))
        """, nativeQuery = true)
    List<Object[]> findNdCompletaParaNotaCreditoRaw(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("SELECT COUNT(nd) > 0 FROM NotaDeDebito nd WHERE nd.notaDeCreditoPadre.id = :notaDeCreditoPadreId AND nd.tipoNd = :tipoNd")
    boolean existsByNotaDeCreditoPadreIdAndTipoNd(@Param("notaDeCreditoPadreId") Integer notaDeCreditoPadreId, @Param("tipoNd") String tipoNd);

    @Query("SELECT COUNT(nd) > 0 FROM NotaDeDebito nd WHERE nd.tiporegistro = :tipoRegistro AND nd.tipoNd = :tipoNd")
    boolean existsByTiporegistroAndTipoNd(@Param("tipoRegistro") String tipoRegistro, @Param("tipoNd") String tipoNd);

    @Query(value = """
        SELECT al.id AS id, al.carnet AS carnet, al.codigo_cobertura AS cobertura, al.paciente AS paciente, 
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
        RIGHT JOIN notadecredito nc1 ON nd.id_notadecredito = nc1.id 
        LEFT JOIN notadecredito nc ON nd.id = nc.id_notadedebito 
        LEFT JOIN amb_liquidado al ON al.id = nc1.id_prestacion 
        WHERE nd.letra = :letra AND nd.ptovta = :ptovta AND nd.numero = :numero
        """, nativeQuery = true)
    List<PrestacionAuditoriaDTO> findPrestacionesPorNotaDebito(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query(value = """
        SELECT DISTINCT al.cob_factura_letra, al.cob_factura_ptoventa, al.cob_factura_numero
        FROM notadedebito nd
        JOIN amb_liquidado al ON nd.id_prestacion = al.id
        WHERE nd.letra = :letra AND nd.ptovta = :ptovta AND nd.numero = :numero
        """, nativeQuery = true)
    List<Object[]> findFacturaMadreDeNd(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query(value = """
        SELECT nd.tipo AS tipo, nd.letra AS letra, nd.ptovta AS ptovta, nd.numero AS numero, 
               CAST(MIN(nd.fecha) AS VARCHAR) AS fecha, SUM(al.total_neto) AS montoNeto,
               SUM(COALESCE(al.iva, 0)) AS montoIva
        FROM notadedebito nd
        JOIN notadecredito nc ON nc.id = nd.id_notadecredito
        JOIN amb_liquidado al ON nd.id_prestacion = al.id
        WHERE UPPER(nc.letra) = UPPER(:letraNc) 
          AND nc.ptovta = :ptovtaNc 
          AND nc.numero = :numeroNc
          AND nd.tipo IS NOT NULL AND nd.letra IS NOT NULL AND nd.numero IS NOT NULL AND nd.ptovta IS NOT NULL
        GROUP BY nd.tipo, nd.letra, nd.ptovta, nd.numero
        ORDER BY MIN(nd.fecha) ASC, nd.numero ASC
        """, nativeQuery = true)
    List<Object[]> findNdsResumenParaNcPadre(@Param("letraNc") String letraNc, @Param("ptovtaNc") Integer ptovtaNc, @Param("numeroNc") Integer numeroNc);
}