package com.debitos.backend.repository;

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