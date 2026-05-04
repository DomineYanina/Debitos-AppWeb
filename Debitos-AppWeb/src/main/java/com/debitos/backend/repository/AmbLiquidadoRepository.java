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

    // Reemplaza al SELECT DISTINCT tiporegistro de la FC en obtenerTipoRegistro()
    @Query("SELECT DISTINCT a.tiporegistro FROM AmbLiquidado a WHERE a.cobFacturaLetra = :letra AND a.cobFacturaPtoVenta = :ptovta AND a.cobFacturaNumero = :numero")
    String findDistinctTipoRegistro(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    // Reemplaza el bloque principal del SELECT para traer las prestaciones de una Factura
    List<AmbLiquidado> findByCobFacturaLetraAndCobFacturaPtoVentaAndCobFacturaNumero(String letra, Integer ptovta, Integer numero);

    @Query(value = """
        SELECT al.id AS id, al.carnet AS carnet, al.codigo_cobertura AS cobertura, al.paciente AS paciente, 
               al.plan AS plan, al.efector AS efector, al.medico AS medico, al.fecha AS fecha, al.codigo AS codigo, 
               al.descripcion AS descripcion, al.modulo AS modulo, al.grupomodulo AS grupomodulo, al.cantidad AS cantidad, 
               al.total_neto AS totalNeto, al.coseguro AS coseguro, al.total AS total, 
               CASE WHEN nc.debitoaceptado = true THEN 'SI' WHEN nc.debitoaceptado = false THEN 'NO' ELSE NULL END AS debitoAceptado,
               nc.motivodedebito AS motivoDebito, nc.diasfacturados AS diasFacturados, 
               nc.importedebitado AS importeDebitado, nc.comentarios_debito AS comentariosDebito,
               nc.prestacionenglobante AS prestacionEnglobante,
               nc.motivoderefactura AS motivoRefactura, nc.importederefactura AS importeRefactura, 
               NULL AS comentarioPrevio, nc.comentarios AS comentarios
        FROM amb_liquidado al
        LEFT JOIN notadecredito nc ON al.id = nc.id_prestacion AND nc.id_notadedebito IS NULL
        WHERE al.cob_factura_letra = :letra AND al.cob_factura_ptoventa = :ptovta AND al.cob_factura_numero = :numero
        """, nativeQuery = true)
    List<PrestacionAuditoriaDTO> findPrestacionesPorFactura(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);
}