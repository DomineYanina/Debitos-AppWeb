package com.debitos.backend.service;

import jakarta.transaction.Transactional;
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

    @Transactional
    public void procesarGuardadoParcial(Map<String, Object> payload) {
        String documentoOrigen = (String) payload.get("documentoOrigen");
        String letra = (String) payload.get("letra");

        // 1. PARSEO SEGURO DE NÚMEROS: Evitamos el ClassCastException
        Integer ptovta = Integer.valueOf(payload.get("ptovta").toString());
        Integer numero = Integer.valueOf(payload.get("numero").toString());
        String usuario = (String) payload.get("usuario");

        // Obtenemos si es Ambulatorios o Internados para el insert
        String tipoRegistro = obtenerTipoRegistro(documentoOrigen, letra, ptovta, numero);

        List<Map<String, Object>> registros = (List<Map<String, Object>>) payload.get("registros");

        for (Map<String, Object> p : registros) {

            // 2. Extracción segura del ID (Jackson a veces lo lee como Long o Double)
            Integer idPrestacion = ((Number) p.get("id")).intValue();

            // 3. Limpieza de datos: Si Angular manda un string vacío ("") en un campo numérico, lo convertimos a NULL para no romper SQL
            Object importeDebitado = "".equals(p.get("importeDebitado")) ? null : p.get("importeDebitado");
            Object importeRefactura = "".equals(p.get("importeRefactura")) ? null : p.get("importeRefactura");
            Object diasFacturados = "".equals(p.get("diasFacturados")) ? null : p.get("diasFacturados");

            // ========================================================================
            // NUEVO: TRADUCCIÓN DE STRING A BOOLEAN PARA "debitoAceptado"
            // ========================================================================
            Object debitoAceptadoRaw = p.get("debitoAceptado");
            Boolean debitoAceptadoBool = null; // Por defecto null (para vacíos)

            if ("SI".equals(debitoAceptadoRaw)) {
                debitoAceptadoBool = true;
            } else if ("NO".equals(debitoAceptadoRaw)) {
                debitoAceptadoBool = false;
            }
            // ========================================================================

            // =========================================================
            // CASO 1: Viene de FC -> Afecta a notadecredito
            // =========================================================
            if ("FC".equals(documentoOrigen)) {
                String sqlCheck = "SELECT id FROM notadecredito WHERE id_prestacion = ? AND id_notadedebito IS NULL LIMIT 1";
                Integer idExistente = obtenerIdSiExiste(sqlCheck, idPrestacion);

                if (idExistente != null) {
                    // UPDATE: Pasamos debitoAceptadoBool
                    String sqlUpdate = "UPDATE notadecredito SET motivodedebito = ?, importedebitado = ?, debitoaceptado = ?, motivoderefactura = ?, importederefactura = ?, comentarios = ?, diasfacturados = ?, usuario = ? WHERE id = ?";
                    jdbcTemplate.update(sqlUpdate, p.get("motivoDebito"), importeDebitado, debitoAceptadoBool, p.get("motivoRefactura"), importeRefactura, p.get("comentarios"), diasFacturados, usuario, idExistente);
                } else {
                    // INSERT: Pasamos debitoAceptadoBool y NULLs donde corresponde
                    String sqlInsert = "INSERT INTO notadecredito (id_prestacion, tipo, letra, ptovta, numero, fecha, motivodedebito, importedebitado, debitoaceptado, motivoderefactura, importederefactura, prestacionenglobante, usuario, id_notadedebito, cargadocompletamente, comentarios, tiporegistro, diasfacturados) VALUES (?, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, ?, ?, NULL, ?, NULL, false, ?, ?, ?)";
                    jdbcTemplate.update(sqlInsert, idPrestacion, p.get("motivoDebito"), importeDebitado, debitoAceptadoBool, p.get("motivoRefactura"), importeRefactura, usuario, p.get("comentarios"), tipoRegistro, diasFacturados);
                }
            }

            // =========================================================
            // CASO 2: Viene de NC -> Afecta a notadedebito
            // =========================================================
            else if ("NC".equals(documentoOrigen)) {
                // Primero buscamos el ID de la Nota de Crédito "madre"
                String sqlBuscarNc = "SELECT id FROM notadecredito WHERE letra = ? AND ptovta = ? AND numero = ? AND id_prestacion = ? LIMIT 1";
                Integer idNotaCredito = obtenerIdSiExiste(sqlBuscarNc, letra, ptovta, numero, idPrestacion);

                if (idNotaCredito != null) {
                    String sqlCheck = "SELECT id FROM notadedebito WHERE id_notadecredito = ? LIMIT 1";
                    Integer idExistente = obtenerIdSiExiste(sqlCheck, idNotaCredito);

                    if (idExistente != null) {
                        // UPDATE
                        String sqlUpdate = "UPDATE notadedebito SET motivorefactura = ?, importerefactura = ?, comentarios = ?, diasfacturados = ?, usuario = ? WHERE id = ?";
                        jdbcTemplate.update(sqlUpdate, p.get("motivoRefactura"), importeRefactura, p.get("comentarios"), diasFacturados, usuario, idExistente);
                    } else {
                        // INSERT
                        String sqlInsert = "INSERT INTO notadedebito (id_prestacion, tipo, letra, ptovta, numero, fecha, motivorefactura, importerefactura, prestacionenglobante, usuario, id_notadecredito, codigo, comentarios, cargadocompletamente, cargarcompletamente, tiporegistro, diasfacturados) VALUES (?, NULL, NULL, NULL, NULL, NULL, ?, ?, NULL, ?, ?, ?, ?, false, false, ?, ?)";
                        jdbcTemplate.update(sqlInsert, idPrestacion, p.get("motivoRefactura"), importeRefactura, usuario, idNotaCredito, p.get("codigo"), p.get("comentarios"), tipoRegistro, diasFacturados);
                    }
                }
            }

            // =========================================================
            // CASO 3: Viene de ND -> Afecta a notadecredito
            // =========================================================
            else if ("ND".equals(documentoOrigen)) {
                // Primero buscamos el ID de la Nota de Débito "madre"
                String sqlBuscarNd = "SELECT id FROM notadedebito WHERE letra = ? AND ptovta = ? AND numero = ? AND id_prestacion = ? LIMIT 1";
                Integer idNotaDebito = obtenerIdSiExiste(sqlBuscarNd, letra, ptovta, numero, idPrestacion);

                if (idNotaDebito != null) {
                    String sqlCheck = "SELECT id FROM notadecredito WHERE id_notadedebito = ? LIMIT 1";
                    Integer idExistente = obtenerIdSiExiste(sqlCheck, idNotaDebito);

                    if (idExistente != null) {
                        // UPDATE: Pasamos debitoAceptadoBool
                        String sqlUpdate = "UPDATE notadecredito SET motivodedebito = ?, importedebitado = ?, debitoaceptado = ?, motivoderefactura = ?, importederefactura = ?, comentarios = ?, diasfacturados = ?, usuario = ? WHERE id = ?";
                        jdbcTemplate.update(sqlUpdate, p.get("motivoDebito"), importeDebitado, debitoAceptadoBool, p.get("motivoRefactura"), importeRefactura, p.get("comentarios"), diasFacturados, usuario, idExistente);
                    } else {
                        // INSERT: Pasamos debitoAceptadoBool
                        String sqlInsert = "INSERT INTO notadecredito (id_prestacion, tipo, letra, ptovta, numero, fecha, motivodedebito, importedebitado, debitoaceptado, motivoderefactura, importederefactura, prestacionenglobante, usuario, id_notadedebito, cargadocompletamente, comentarios, tiporegistro, diasfacturados) VALUES (?, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, ?, ?, NULL, ?, ?, false, ?, ?, ?)";
                        jdbcTemplate.update(sqlInsert, idPrestacion, p.get("motivoDebito"), importeDebitado, debitoAceptadoBool, p.get("motivoRefactura"), importeRefactura, usuario, idNotaDebito, p.get("comentarios"), tipoRegistro, diasFacturados);
                    }
                }
            }
        }
    }

    // =========================================================================
    // MÉTODO AUXILIAR: Evita usar Try-Catch para registros que no existen
    // =========================================================================
    private Integer obtenerIdSiExiste(String sql, Object... params) {
        List<Integer> resultados = jdbcTemplate.queryForList(sql, Integer.class, params);
        return resultados.isEmpty() ? null : resultados.get(0);
    }

    @Transactional
    public void procesarNuevaNotaCredito(Map<String, Object> payload) {
        String origen = (String) payload.get("origen"); // "FC" o "ND"
        Map<String, Object> datosNota = (Map<String, Object>) payload.get("datosNota");
        List<Integer> idsPrestaciones = (List<Integer>) payload.get("idsPrestaciones");

        if (idsPrestaciones == null || idsPrestaciones.isEmpty()) {
            return;
        }

        // 1. Parseamos los números de forma segura
        Integer puntoVenta = Integer.valueOf(datosNota.get("puntoVenta").toString());
        Integer numero = Integer.valueOf(datosNota.get("numero").toString());

        // 2. CONVERSIÓN DE FECHA: De String ("YYYY-MM-DD") a java.sql.Date
        String fechaString = (String) datosNota.get("fecha");
        java.sql.Date fechaSql = java.sql.Date.valueOf(fechaString);

        for (Integer idPrestacion : idsPrestaciones) {

            if ("FC".equals(origen)) {
                // Si la búsqueda original fue FC, la ND asociada es NULL
                String sqlUpdate = "UPDATE notadecredito SET tipo = ?, letra = ?, ptovta = ?, numero = ?, fecha = ?, cargadocompletamente = true WHERE id_prestacion = ? AND id_notadedebito IS NULL AND cargadocompletamente = false";

                // Fijate que ahora pasamos "fechaSql" en lugar de datosNota.get("fecha")
                jdbcTemplate.update(sqlUpdate,
                        datosNota.get("tipo"),
                        datosNota.get("letra"),
                        puntoVenta,
                        numero,
                        fechaSql,
                        idPrestacion);

            } else if ("ND".equals(origen)) {
                // Si la búsqueda original fue ND, la NC madre TIENE una ND asociada
                String sqlUpdate = "UPDATE notadecredito SET tipo = ?, letra = ?, ptovta = ?, numero = ?, fecha = ?, cargadocompletamente = true WHERE id_prestacion = ? AND id_notadedebito IS NOT NULL AND cargadocompletamente = false";

                jdbcTemplate.update(sqlUpdate,
                        datosNota.get("tipo"),
                        datosNota.get("letra"),
                        puntoVenta,
                        numero,
                        fechaSql,
                        idPrestacion);
            }
        }
    }
}