package com.debitos.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AuditoriaService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public String obtenerTipoRegistro(String tipoFactura, String letra, int ptovta, int numero) {
        String query;
        switch (tipoFactura) {
            case "FC":
                query = "SELECT DISTINCT tiporegistro FROM amb_liquidado WHERE cob_factura_letra = ? AND cob_factura_ptoventa = ? AND cob_factura_numero = ?;";
                break;
            case "NC":
                query = "SELECT DISTINCT tiporegistro FROM notadecredito WHERE letra = ? AND ptovta = ? AND numero = ?;";
                break;
            case "ND":
                query = "SELECT DISTINCT tiporegistro FROM notadedebito WHERE letra = ? AND ptovta = ? AND numero = ?;";
                break;
            default:
                throw new IllegalArgumentException("Tipo de factura desconocido: " + tipoFactura);
        }

        try {
            return jdbcTemplate.queryForObject(query, String.class, letra, ptovta, numero);
        } catch (Exception e) {
            return null; // No se encontró el registro
        }
    }

    public List<Map<String, Object>> obtenerPrestaciones(String facturaTipo, String tipoRegistro, String letra, int ptovta, int numero) {
        String sql = "";
        System.out.println("Entra a obtenerPrestaciones");

        if ("Ambulatorios".equals(tipoRegistro)) {
            switch (facturaTipo) {
                case "NC":
                    sql = """
                        SELECT al.id, al.carnet, al.codigo_cobertura AS "cobertura", al.paciente, al.plan, al.efector, al.medico, al.fecha, al.codigo, al.descripcion, al.modulo, al.cantidad, 
                               al.total_neto AS "totalNeto", al.coseguro, al.total, nc.debitoaceptado AS "debitoAceptado",
                               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", nc.importedebitado AS "importeDebitado", 
                               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura", 
                               nc.comentarios 
                        FROM notadecredito nc
                        LEFT JOIN notadedebito nd ON nc.id = nd.id_notadecredito
                        JOIN amb_liquidado al ON nc.id_prestacion = al.id
                        WHERE nc.letra = ? AND nc.ptovta = ? AND nc.numero = ?;
                        """;
                    break;
                case "ND":
                    sql = """
                        SELECT al.id, al.carnet, al.codigo_cobertura AS "cobertura", al.paciente, al.plan, al.efector, al.medico, al.fecha, al.codigo, al.descripcion, al.modulo, al.cantidad, 
                               al.total_neto AS "totalNeto", al.coseguro, al.total, nc.debitoaceptado AS "debitoAceptado",
                               nd.motivorefactura AS "motivoRefactura", nd.importerefactura AS "importeRefactura", nd.comentarios,
                               nc.diasfacturados AS "diasFacturados", nc.motivodedebito AS "motivoDebito", nc.importedebitado AS "importeDebitado"
                        FROM notadedebito nd 
                        RIGHT JOIN notadecredito nc1 ON nd.id_notadecredito = nc1.id 
                        LEFT JOIN notadecredito nc ON nd.id = nc.id_notadedebito 
                        LEFT JOIN amb_liquidado al ON al.id = nc1.id_prestacion 
                        WHERE nd.letra = ? AND nd.ptovta = ? AND nd.numero = ?;
                        """;
                    break;
                // Ejemplo para el caso FC (replicar la inclusión de carnet y cobertura en NC y ND)
                case "FC":
                    sql = """
                        SELECT al.id, al.carnet, al.codigo_cobertura AS "cobertura", al.paciente, al.plan, al.efector, al.medico, al.fecha, al.codigo, al.descripcion, al.modulo, al.cantidad, 
                               al.total_neto AS "totalNeto", al.coseguro, al.total, nc.debitoaceptado AS "debitoAceptado",
                               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", nc.importedebitado AS "importeDebitado",
                               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura", 
                               nc.comentarios
                        FROM amb_liquidado al
                        LEFT JOIN notadecredito nc ON al.id = nc.id_prestacion AND nc.id_notadedebito IS NULL
                        WHERE al.cob_factura_letra = ? AND al.cob_factura_ptoventa = ? AND al.cob_factura_numero = ?;
                        """;
                    break;
            }
        } else if ("Internados".equals(tipoRegistro)) {
            switch (facturaTipo) {
                // Hacemos el mismo ajuste para Internados
                case "NC":
                    sql = """
                        SELECT al.id, al.carnet, al.codigo_cobertura AS "cobertura", al.modulo, al.grupomodulo, al.paciente, al.plan, al.efector, al.medico, al.fecha, al.codigo, al.descripcion, al.cantidad, 
                               al.total_neto AS "totalNeto", al.coseguro, al.total, nc.debitoaceptado AS "debitoAceptado",
                               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", nc.importedebitado AS "importeDebitado", 
                               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura", 
                               nc.comentarios
                        FROM notadecredito nc
                        LEFT JOIN notadedebito nd ON nc.id = nd.id_notadecredito
                        JOIN amb_liquidado al ON nc.id_prestacion = al.id
                        WHERE nc.letra = ? AND nc.ptovta = ? AND nc.numero = ?;
                        """;
                    break;
                case "ND":
                    sql = """
                        SELECT al.id, al.carnet, al.codigo_cobertura AS "cobertura", al.modulo, al.grupomodulo, al.paciente, al.plan, al.efector, al.medico, al.fecha, al.codigo, al.descripcion, al.cantidad, 
                               al.total_neto AS "totalNeto", al.coseguro, al.total, nc.debitoaceptado AS "debitoAceptado",
                               nd.motivorefactura AS "motivoRefactura", nd.importerefactura AS "importeRefactura", nd.comentarios,
                               nc.diasfacturados AS "diasFacturados", nc.motivodedebito AS "motivoDebito", nc.importedebitado AS "importeDebitado"
                        FROM notadedebito nd 
                        RIGHT JOIN notadecredito nc1 ON nd.id_notadecredito = nc1.id 
                        LEFT JOIN notadecredito nc ON nd.id = nc.id_notadedebito 
                        LEFT JOIN amb_liquidado al ON al.id = nc1.id_prestacion 
                        WHERE nd.letra = ? AND nd.ptovta = ? AND nd.numero = ?;
                        """;
                    break;
                case "FC":
                    sql = """
                        SELECT al.id, al.carnet, al.codigo_cobertura AS "cobertura", al.modulo, al.grupomodulo, al.paciente, al.plan, al.efector, al.medico, al.fecha, al.codigo, al.descripcion, al.cantidad, 
                               al.total_neto AS "totalNeto", al.coseguro, al.total, nc.debitoaceptado AS "debitoAceptado",
                               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", nc.importedebitado AS "importeDebitado",
                               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura", 
                               nc.comentarios
                        FROM amb_liquidado al
                        LEFT JOIN notadecredito nc ON al.id = nc.id_prestacion AND nc.id_notadedebito IS NULL
                        WHERE al.cob_factura_letra = ? AND al.cob_factura_ptoventa = ? AND al.cob_factura_numero = ?;
                        """;
                    break;
            }
        }
        return jdbcTemplate.queryForList(sql, letra, ptovta, numero);
    }
}