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

    // Reemplaza al SELECT DISTINCT tiporegistro de la NC
    @Query("SELECT DISTINCT n.tiporegistro FROM NotaDeCredito n WHERE n.letra = :letra AND n.ptovta = :ptovta AND n.numero = :numero")
    String findDistinctTipoRegistro(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    // Para traer todos los registros al consultar la grilla por NC
    List<NotaDeCredito> findByLetraAndPtovtaAndNumero(String letra, Integer ptovta, Integer numero);

    // Busca una NC específica por su letra, pto venta, numero y el ID de la prestación original
    Optional<NotaDeCredito> findByLetraAndPtovtaAndNumeroAndPrestacionId(String letra, Integer ptovta, Integer numero, Integer idPrestacion);

    // EL CANDADO DEFINITIVO: Busca la NC para generar una ND, exigiendo por base de datos que debitoaceptado sea false
    Optional<NotaDeCredito> findByLetraAndPtovtaAndNumeroAndPrestacionIdAndDebitoaceptadoFalse(String letra, Integer ptovta, Integer numero, Integer idPrestacion);

    // Verifica si ya existe una NC primaria para una prestación (que viene de una FC) que NO tenga una ND asociada
    Optional<NotaDeCredito> findByPrestacionIdAndNotaDeDebitoPadreIsNull(Integer idPrestacion);

    // Verifica si ya existe una NC generada a partir de una ND específica
    Optional<NotaDeCredito> findByNotaDeDebitoPadreId(Integer idNotaDeDebito);

    // Verifica si todas las prestaciones de una FC ya tienen una NC "completa" (tipo, fecha, letra, numero y ptovta no nulos)
    @Query(value = """
        SELECT CASE
            WHEN COUNT(al.id) > 0
                 AND COUNT(nc.id) = COUNT(al.id)
                 AND COUNT(nc.tipo) = COUNT(al.id)
                 AND COUNT(nc.fecha) = COUNT(al.id)
                 AND COUNT(nc.letra) = COUNT(al.id)
                 AND COUNT(nc.numero) = COUNT(al.id)
                 AND COUNT(nc.ptovta) = COUNT(al.id)
            THEN true
            ELSE false
        END
        FROM amb_liquidado al
        LEFT JOIN notadecredito nc
            ON al.id = nc.id_prestacion
           AND nc.id_notadedebito IS NULL
           AND nc.tipo IS NOT NULL
           AND nc.fecha IS NOT NULL
           AND nc.letra IS NOT NULL
           AND nc.numero IS NOT NULL
           AND nc.ptovta IS NOT NULL
        WHERE al.cob_factura_letra = :letra
          AND al.cob_factura_ptoventa = :ptovta
          AND al.cob_factura_numero = :numero
        """, nativeQuery = true)
    boolean existeNcCompletaParaFactura(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("""
        SELECT DISTINCT new com.debitos.backend.dto.DocumentoAsociadoDTO(nc.tipo, nc.letra, nc.ptovta, nc.numero, nc.fecha)
        FROM NotaDeCredito nc
        JOIN nc.prestacion al
        WHERE al.cobFacturaLetra = :letra
          AND al.cobFacturaPtoVenta = :ptovta
          AND al.cobFacturaNumero = :numero
          AND nc.notaDeDebitoPadre IS NULL
          AND nc.tipo IS NOT NULL
          AND nc.fecha IS NOT NULL
          AND nc.letra IS NOT NULL
          AND nc.numero IS NOT NULL
          AND nc.ptovta IS NOT NULL
    """)
    List<DocumentoAsociadoDTO> findNcCompletaParaFactura(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    // Verifica si todas las ND (identificadas por letra/ptovta/numero) ya tienen una NC hija "completa" (tipo, fecha, letra, numero y ptovta no nulos)
    @Query(value = """
        SELECT CASE
            WHEN COUNT(nd.id) > 0
                 AND COUNT(nc.id) = COUNT(nd.id)
                 AND COUNT(nc.tipo) = COUNT(nd.id)
                 AND COUNT(nc.fecha) = COUNT(nd.id)
                 AND COUNT(nc.letra) = COUNT(nd.id)
                 AND COUNT(nc.numero) = COUNT(nd.id)
                 AND COUNT(nc.ptovta) = COUNT(nd.id)
            THEN true
            ELSE false
        END
        FROM notadedebito nd
        LEFT JOIN notadecredito nc
            ON nc.id_notadedebito = nd.id
           AND nc.tipo IS NOT NULL
           AND nc.fecha IS NOT NULL
           AND nc.letra IS NOT NULL
           AND nc.numero IS NOT NULL
           AND nc.ptovta IS NOT NULL
        WHERE nd.letra = :letra
          AND nd.ptovta = :ptovta
          AND nd.numero = :numero
        """, nativeQuery = true)
    boolean existeNcCompletaParaNotaDebito(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("""
        SELECT DISTINCT new com.debitos.backend.dto.DocumentoAsociadoDTO(nc.tipo, nc.letra, nc.ptovta, nc.numero, nc.fecha)
        FROM NotaDeCredito nc
        JOIN nc.notaDeDebitoPadre nd
        WHERE nd.letra = :letra
          AND nd.ptovta = :ptovta
          AND nd.numero = :numero
          AND nc.tipo IS NOT NULL
          AND nc.fecha IS NOT NULL
          AND nc.letra IS NOT NULL
          AND nc.numero IS NOT NULL
          AND nc.ptovta IS NOT NULL
    """)
    List<DocumentoAsociadoDTO> findNcCompletaParaNotaDebito(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query(value = """
        SELECT al.id AS id, al.carnet AS carnet, al.codigo_cobertura AS cobertura, al.paciente AS paciente, 
               al.plan AS plan, al.efector AS efector, al.medico AS medico, al.fecha AS fecha, al.codigo AS codigo, 
               al.descripcion AS descripcion, al.modulo AS modulo, al.grupomodulo AS grupomodulo, al.cantidad AS cantidad, 
               al.total_neto AS "totalNeto", al.coseguro AS coseguro, al.total AS total, 
               CAST(CASE WHEN nc.debitoaceptado = true THEN 'SI' WHEN nc.debitoaceptado = false THEN 'NO' ELSE NULL END AS VARCHAR) AS "debitoAceptado",
               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", 
               nc.importedebitado AS "importeDebitado", nc.comentarios_debito AS "comentariosDebito", 
               nc.prestacionenglobante AS "prestacionEnglobante",
               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura", 
               
               -- CORRECCIÓN: Traemos los comentarios de la ND padre mediante el JOIN
               ndPadre.comentarios AS "comentarioPrevio", nc.comentarios AS comentarios
        FROM notadecredito nc
        LEFT JOIN notadedebito ndPadre ON nc.id_notadedebito = ndPadre.id
        JOIN amb_liquidado al ON nc.id_prestacion = al.id
        WHERE nc.letra = :letra AND nc.ptovta = :ptovta AND nc.numero = :numero
        """, nativeQuery = true)
    List<PrestacionAuditoriaDTO> findPrestacionesPorNotaCredito(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);
}