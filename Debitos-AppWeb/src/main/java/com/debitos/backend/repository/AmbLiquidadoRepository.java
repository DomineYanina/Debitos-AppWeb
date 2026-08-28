package com.debitos.backend.repository;

import com.debitos.backend.dto.PrestacionAuditoriaDTO;
import com.debitos.backend.model.AmbLiquidado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AmbLiquidadoRepository extends JpaRepository<AmbLiquidado, Integer> {

    @Query("SELECT DISTINCT c.tiporegistro FROM AmbLiquidado a JOIN a.cabecera c WHERE c.letra = :letra AND c.ptovta = :ptovta AND c.numero = :numero")
    String findDistinctTipoRegistro(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    List<AmbLiquidado> findByCabecera_LetraAndCabecera_PtovtaAndCabecera_Numero(String letra, Integer ptovta, Integer numero);

    List<AmbLiquidado> findByCabecera_Id(Long idCabecera);

    @Query(value = """
        SELECT al.id AS id, al.carnet AS carnet, c.codigo_cobertura AS cobertura, al.paciente AS paciente, 
               al.plan AS plan, al.efector AS efector, al.medico AS medico, al.fecha AS fecha, al.codigo AS codigo, 
               al.descripcion AS descripcion, al.modulo AS modulo, al.grupomodulo AS grupomodulo, al.cantidad AS cantidad, 
               al.total_neto AS "totalNeto", al.coseguro AS coseguro, al.total AS total, 
               CASE WHEN nc.debitoaceptado = true THEN 'SI' WHEN nc.debitoaceptado = false THEN 'NO' ELSE NULL END AS "debitoAceptado",
               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", 
               nc.importedebitado AS "importeDebitado", nc.comentarios_debito AS "comentariosDebito",
               nc.prestacionenglobante AS "prestacionEnglobante",
               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura", 
               NULL AS "comentarioPrevio", nc.comentarios AS comentarios,
               c_nc.numero AS "ncNumero", c_nc.tipo AS "ncTipo", c_nc.letra AS "ncLetra", c_nc.ptovta AS "ncPtoVenta", c_nc.fecha AS "ncFecha"
        FROM amb_liquidado al
        INNER JOIN cabecera c ON al.idcabecera = c.id
        LEFT JOIN notadecredito nc ON al.id = nc.id_prestacion AND nc.id_notadedebito IS NULL
        LEFT JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
        WHERE UPPER(c.letra) = UPPER(:letra) AND c.ptovta = :ptovta AND c.numero = :numero
        """, nativeQuery = true)
    List<PrestacionAuditoriaDTO> findPrestacionesPorFactura(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query(value = """
        SELECT c.periodo AS periodo,
               SUM(COALESCE(al.total_neto, 0)) AS montoNeto,
               SUM(COALESCE(al.iva, 0)) AS montoIva
        FROM amb_liquidado al
        INNER JOIN cabecera c ON al.idcabecera = c.id
        WHERE UPPER(c.letra) = UPPER(:letra) 
          AND c.ptovta = :ptovta 
          AND c.numero = :numero
        GROUP BY c.periodo
        """, nativeQuery = true)
    Object[] findTotalesFacturaMadre(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);
}