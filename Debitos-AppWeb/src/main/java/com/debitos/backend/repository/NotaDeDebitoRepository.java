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

    // Reemplaza al SELECT DISTINCT tiporegistro de la ND
    @Query("SELECT DISTINCT n.tiporegistro FROM NotaDeDebito n WHERE n.letra = :letra AND n.ptovta = :ptovta AND n.numero = :numero")
    String findDistinctTipoRegistro(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    // Para traer todos los registros al consultar la grilla por ND
    List<NotaDeDebito> findByLetraAndPtovtaAndNumero(String letra, Integer ptovta, Integer numero);

    // Busca una ND específica para mapearla con la prestación
    Optional<NotaDeDebito> findByLetraAndPtovtaAndNumeroAndPrestacionId(String letra, Integer ptovta, Integer numero, Integer idPrestacion);

    // Verifica si ya existe una ND hija generada a partir de una NC madre específica
    Optional<NotaDeDebito> findByNotaDeCreditoPadreId(Integer idNotaCredito);

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
}