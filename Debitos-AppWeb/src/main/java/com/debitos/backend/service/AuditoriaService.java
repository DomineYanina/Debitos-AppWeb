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
                               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", nc.importedebitado AS "importeDebitado", nc.comentarios_debito AS "comentariosDebito", 
                               nc.prestacionenglobante AS "prestacionEnglobante",
                               
                               -- CORRECCIÓN: La NC lee su propia tabla (nc) para mostrar lo que se refacturó
                               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura", 
                               NULL AS "comentarioPrevio", nc.comentarios AS "comentarios"
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
                               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", nc.importedebitado AS "importeDebitado", nc.comentarios_debito AS "comentariosDebito",
                               nc.prestacionenglobante AS "prestacionEnglobante",
                               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura",
                               
                               -- CORRECCIÓN ACÁ: Cruzamos bien los comentarios
                               nd.comentarios AS "comentarioPrevio", nc.comentarios AS "comentarios"
                        FROM notadedebito nd 
                        RIGHT JOIN notadecredito nc1 ON nd.id_notadecredito = nc1.id 
                        LEFT JOIN notadecredito nc ON nd.id = nc.id_notadedebito 
                        LEFT JOIN amb_liquidado al ON al.id = nc1.id_prestacion 
                        WHERE nd.letra = ? AND nd.ptovta = ? AND nd.numero = ?;
                        """;
                    break;
                case "FC":
                    sql = """
                        SELECT al.id, al.carnet, al.codigo_cobertura AS "cobertura", al.paciente, al.plan, al.efector, al.medico, al.fecha, al.codigo, al.descripcion, al.modulo, al.cantidad, 
                               al.total_neto AS "totalNeto", al.coseguro, al.total, nc.debitoaceptado AS "debitoAceptado",
                               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", nc.importedebitado AS "importeDebitado", nc.comentarios_debito AS "comentariosDebito",
                               nc.prestacionenglobante AS "prestacionEnglobante",
                               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura", 
                               nc.comentarios AS "comentarios"
                        FROM amb_liquidado al
                        LEFT JOIN notadecredito nc ON al.id = nc.id_prestacion AND nc.id_notadedebito IS NULL
                        WHERE al.cob_factura_letra = ? AND al.cob_factura_ptoventa = ? AND al.cob_factura_numero = ?;
                        """;
                    break;
            }
        } else if ("Internados".equals(tipoRegistro)) {
            switch (facturaTipo) {
                case "NC":
                    sql = """
                        SELECT al.id, al.carnet, al.codigo_cobertura AS "cobertura", al.modulo, al.grupomodulo, al.paciente, al.plan, al.efector, al.medico, al.fecha, al.codigo, al.descripcion, al.cantidad, 
                               al.total_neto AS "totalNeto", al.coseguro, al.total, nc.debitoaceptado AS "debitoAceptado",
                               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", nc.importedebitado AS "importeDebitado", nc.comentarios_debito AS "comentariosDebito", 
                               nc.prestacionenglobante AS "prestacionEnglobante",
                               
                               -- CORRECCIÓN: La NC lee su propia tabla (nc) para mostrar lo que se refacturó
                               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura", 
                               NULL AS "comentarioPrevio", nc.comentarios AS "comentarios"
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
                               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", nc.importedebitado AS "importeDebitado", nc.comentarios_debito AS "comentariosDebito",
                               nc.prestacionenglobante AS "prestacionEnglobante",
                               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura",
                               
                               -- CORRECCIÓN ACÁ: Cruzamos bien los comentarios
                               nd.comentarios AS "comentarioPrevio", nc.comentarios AS "comentarios"
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
                               nc.motivodedebito AS "motivoDebito", nc.diasfacturados AS "diasFacturados", nc.importedebitado AS "importeDebitado", nc.comentarios_debito AS "comentariosDebito",
                               nc.prestacionenglobante AS "prestacionEnglobante",
                               nc.motivoderefactura AS "motivoRefactura", nc.importederefactura AS "importeRefactura", 
                               nc.comentarios AS "comentarios"
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
            Object prestacionEnglobante = p.get("prestacionEnglobante") != null ? p.get("prestacionEnglobante") : "";

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
                    // UPDATE: Pasamos prestacionenglobante y debitoAceptadoBool
                    String sqlUpdate = "UPDATE notadecredito SET motivodedebito = ?, importedebitado = ?, debitoaceptado = ?, motivoderefactura = ?, importederefactura = ?, comentarios = ?, diasfacturados = ?, prestacionenglobante = ?, usuario = ?, comentarios_debito = ? WHERE id = ?";
                    jdbcTemplate.update(sqlUpdate, p.get("motivoDebito"), importeDebitado, debitoAceptadoBool, p.get("motivoRefactura"), importeRefactura, p.get("comentarios"), diasFacturados, prestacionEnglobante, usuario, p.get("comentariosDebito"), idExistente);
                } else {
                    // INSERT: Pasamos prestacionenglobante
                    String sqlInsert = "INSERT INTO notadecredito (id_prestacion, tipo, letra, ptovta, numero, fecha, motivodedebito, importedebitado, debitoaceptado, motivoderefactura, importederefactura, prestacionenglobante, usuario, id_notadedebito, cargadocompletamente, comentarios, tiporegistro, diasfacturados, comentarios_debito) VALUES (?, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, NULL, false, ?, ?, ?, ?)";
                    jdbcTemplate.update(sqlInsert, idPrestacion, p.get("motivoDebito"), importeDebitado, debitoAceptadoBool, p.get("motivoRefactura"), importeRefactura, prestacionEnglobante, usuario, p.get("comentarios"), tipoRegistro, diasFacturados, p.get("comentariosDebito"));
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
                        // UPDATE: Pasamos prestacionenglobante y debitoAceptadoBool
                        String sqlUpdate = "UPDATE notadecredito SET motivodedebito = ?, importedebitado = ?, debitoaceptado = ?, motivoderefactura = ?, importederefactura = ?, comentarios = ?, diasfacturados = ?, prestacionenglobante = ?, usuario = ?, comentarios_debito = ? WHERE id = ?";
                        jdbcTemplate.update(sqlUpdate, p.get("motivoDebito"), importeDebitado, debitoAceptadoBool, p.get("motivoRefactura"), importeRefactura, p.get("comentarios"), diasFacturados, prestacionEnglobante, usuario, p.get("comentariosDebito"), idExistente);
                    } else {
                        // INSERT: Pasamos prestacionenglobante
                        String sqlInsert = "INSERT INTO notadecredito (id_prestacion, tipo, letra, ptovta, numero, fecha, motivodedebito, importedebitado, debitoaceptado, motivoderefactura, importederefactura, prestacionenglobante, usuario, id_notadedebito, cargadocompletamente, comentarios, tiporegistro, diasfacturados, comentarios_debito) VALUES (?, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, false, ?, ?, ?, ?)";
                        jdbcTemplate.update(sqlInsert, idPrestacion, p.get("motivoDebito"), importeDebitado, debitoAceptadoBool, p.get("motivoRefactura"), importeRefactura, prestacionEnglobante, usuario, idNotaDebito, p.get("comentarios"), tipoRegistro, diasFacturados, p.get("comentariosDebito"));
                    }
                }
            }
        }
    }

    private Integer obtenerIdSiExiste(String sql, Object... params) {
        List<Integer> resultados = jdbcTemplate.queryForList(sql, Integer.class, params);
        return resultados.isEmpty() ? null : resultados.get(0);
    }

    @Transactional
    public void procesarNuevaNotaDebito(Map<String, Object> payload) {
        String usuario = (String) payload.get("usuario");
        Map<String, Object> datosNota = (Map<String, Object>) payload.get("datosNota");
        List<Map<String, Object>> registros = (List<Map<String, Object>>) payload.get("registros");

        // NUEVO: Obtenemos el tipo de registro original (que en este caso viene de una NC)
        String tipoRegistro = obtenerTipoRegistro(
                (String) payload.get("origen"),
                (String) payload.get("letraOriginal"),
                Integer.valueOf(payload.get("ptovtaOriginal").toString()),
                Integer.valueOf(payload.get("numeroOriginal").toString())
        );

        if (registros == null || registros.isEmpty()) return;

        Integer puntoVenta = Integer.valueOf(datosNota.get("puntoVenta").toString());
        Integer numero = Integer.valueOf(datosNota.get("numero").toString());
        java.sql.Date fechaSql = java.sql.Date.valueOf(datosNota.get("fecha").toString());
        String tipoDoc = (String) datosNota.get("tipo");
        String letraDoc = (String) datosNota.get("letra");

        for (Map<String, Object> p : registros) {
            Integer idPrestacion = ((Number) p.get("id")).intValue();
            Object importeRefactura = "".equals(p.get("importeRefactura")) ? null : p.get("importeRefactura");
            Object diasFacturados = "".equals(p.get("diasFacturados")) ? null : p.get("diasFacturados");

            // Candado Definitivo: Exigimos "AND debitoaceptado = false" en la base de datos
            String sqlBuscarNc = "SELECT id FROM notadecredito WHERE letra = ? AND ptovta = ? AND numero = ? AND id_prestacion = ? AND debitoaceptado = false LIMIT 1";

            Integer idNotaCredito = obtenerIdSiExiste(sqlBuscarNc, payload.get("letraOriginal"), payload.get("ptovtaOriginal"), payload.get("numeroOriginal"), idPrestacion);
            if (idNotaCredito != null) {
                String sqlCheck = "SELECT id FROM notadedebito WHERE id_notadecredito = ? LIMIT 1";
                Integer idExistente = obtenerIdSiExiste(sqlCheck, idNotaCredito);

                if (idExistente != null) {
                    String sqlUpdate = "UPDATE notadedebito SET tipo = ?, letra = ?, ptovta = ?, numero = ?, fecha = ?, " +
                            "motivorefactura = ?, importerefactura = ?, comentarios = ?, diasfacturados = ?, " +
                            "usuario = ?, tiporegistro = ?, cargadocompletamente = true, comentarios_debito = ? WHERE id = ?";
                    jdbcTemplate.update(sqlUpdate, tipoDoc, letraDoc, puntoVenta, numero, fechaSql,
                            p.get("motivoRefactura"), importeRefactura, p.get("comentarios"), diasFacturados, usuario, tipoRegistro, p.get("comentariosDebito"), idExistente);
                } else {
                    String sqlInsert = "INSERT INTO notadedebito (id_prestacion, tipo, letra, ptovta, numero, fecha, " +
                            "motivorefactura, importerefactura, prestacionenglobante, usuario, id_notadecredito, " +
                            "codigo, comentarios, cargadocompletamente, cargarcompletamente, diasfacturados, tiporegistro, comentarios_debito) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, true, true, ?, ?, ?)";
                    jdbcTemplate.update(sqlInsert, idPrestacion, tipoDoc, letraDoc, puntoVenta, numero, fechaSql,
                            p.get("motivoRefactura"), importeRefactura, usuario, idNotaCredito, p.get("codigo"),
                            p.get("comentarios"), diasFacturados, tipoRegistro, p.get("comentariosDebito"));
                }
            }
        }
    }

    @Transactional
    public void procesarNuevaNotaCredito(Map<String, Object> payload) {
        String origen = (String) payload.get("origen");
        String usuario = (String) payload.get("usuario");
        Map<String, Object> datosNota = (Map<String, Object>) payload.get("datosNota");
        List<Map<String, Object>> registros = (List<Map<String, Object>>) payload.get("registros");

        // NUEVO: Obtenemos el tipo de registro original
        String tipoRegistro = obtenerTipoRegistro(
                origen,
                (String) payload.get("letraOriginal"),
                Integer.valueOf(payload.get("ptovtaOriginal").toString()),
                Integer.valueOf(payload.get("numeroOriginal").toString())
        );

        if (registros == null || registros.isEmpty()) return;

        Integer puntoVenta = Integer.valueOf(datosNota.get("puntoVenta").toString());
        Integer numero = Integer.valueOf(datosNota.get("numero").toString());
        java.sql.Date fechaSql = java.sql.Date.valueOf(datosNota.get("fecha").toString());
        String tipoDoc = (String) datosNota.get("tipo");
        String letraDoc = (String) datosNota.get("letra");

        for (Map<String, Object> p : registros) {
            Integer idPrestacion = ((Number) p.get("id")).intValue();

            Object importeDebitado = "".equals(p.get("importeDebitado")) ? null : p.get("importeDebitado");
            Object importeRefactura = "".equals(p.get("importeRefactura")) ? null : p.get("importeRefactura");
            Object diasFacturados = "".equals(p.get("diasFacturados")) ? null : p.get("diasFacturados");
            Object prestacionEnglobante = p.get("prestacionEnglobante") != null ? p.get("prestacionEnglobante") : "";

            Boolean debitoAceptadoBool = null;
            if ("SI".equals(p.get("debitoAceptado"))) debitoAceptadoBool = true;
            else if ("NO".equals(p.get("debitoAceptado"))) debitoAceptadoBool = false;

            if ("FC".equals(origen)) {
                String sqlCheck = "SELECT id FROM notadecredito WHERE id_prestacion = ? AND id_notadedebito IS NULL LIMIT 1";
                Integer idExistente = obtenerIdSiExiste(sqlCheck, idPrestacion);

                if (idExistente != null) {
                    // CORRECCIÓN: Si EXISTE, hacemos UPDATE (Acá estaba el bug del INSERT duplicado)
                    String sqlUpdate = "UPDATE notadecredito SET tipo = ?, letra = ?, ptovta = ?, numero = ?, fecha = ?, " +
                            "motivodedebito = ?, importedebitado = ?, debitoaceptado = ?, motivoderefactura = ?, " +
                            "importederefactura = ?, comentarios = ?, diasfacturados = ?, prestacionenglobante = ?, " +
                            "usuario = ?, tiporegistro = ?, comentarios_debito = ?, cargadocompletamente = true WHERE id = ?";

                    jdbcTemplate.update(sqlUpdate, tipoDoc, letraDoc, puntoVenta, numero, fechaSql,
                            p.get("motivoDebito"), importeDebitado, debitoAceptadoBool, p.get("motivoRefactura"),
                            importeRefactura, p.get("comentarios"), diasFacturados, prestacionEnglobante,
                            usuario, tipoRegistro, p.get("comentariosDebito"), idExistente);
                } else {
                    // Si NO EXISTE, hacemos INSERT (con los 19 campos y 19 signos de interrogación)
                    String sqlInsert = "INSERT INTO notadecredito (id_prestacion, tipo, letra, ptovta, numero, fecha, " +
                            "motivodedebito, importedebitado, debitoaceptado, motivoderefactura, importederefactura, " +
                            "prestacionenglobante, usuario, id_notadedebito, cargadocompletamente, comentarios, diasfacturados, tiporegistro, comentarios_debito) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, true, ?, ?, ?, ?)";

                    jdbcTemplate.update(sqlInsert, idPrestacion, tipoDoc, letraDoc, puntoVenta, numero, fechaSql,
                            p.get("motivoDebito"), importeDebitado, debitoAceptadoBool, p.get("motivoRefactura"),
                            importeRefactura, prestacionEnglobante, usuario, p.get("comentarios"), diasFacturados, tipoRegistro, p.get("comentariosDebito"));
                }
            } else if ("ND".equals(origen)) {
                String sqlBuscarNd = "SELECT id FROM notadedebito WHERE letra = ? AND ptovta = ? AND numero = ? AND id_prestacion = ? LIMIT 1";
                Integer idNotaDebito = obtenerIdSiExiste(sqlBuscarNd, payload.get("letraOriginal"), payload.get("ptovtaOriginal"), payload.get("numeroOriginal"), idPrestacion);

                if (idNotaDebito != null) {
                    String sqlCheck = "SELECT id FROM notadecredito WHERE id_notadedebito = ? LIMIT 1";
                    Integer idExistente = obtenerIdSiExiste(sqlCheck, idNotaDebito);

                    if (idExistente != null) {
                        String sqlUpdate = "UPDATE notadecredito SET tipo = ?, letra = ?, ptovta = ?, numero = ?, fecha = ?, " +
                                "motivodedebito = ?, importedebitado = ?, debitoaceptado = ?, motivoderefactura = ?, " +
                                "importederefactura = ?, comentarios = ?, diasfacturados = ?, prestacionenglobante = ?, " +
                                "usuario = ?, tiporegistro = ?, comentarios_debito = ?, cargadocompletamente = true WHERE id = ?";
                        jdbcTemplate.update(sqlUpdate, tipoDoc, letraDoc, puntoVenta, numero, fechaSql,
                                p.get("motivoDebito"), importeDebitado, debitoAceptadoBool, p.get("motivoRefactura"),
                                importeRefactura, p.get("comentarios"), diasFacturados, prestacionEnglobante, usuario, tipoRegistro, p.get("comentariosDebito"), idExistente);
                    } else {
                        String sqlInsert = "INSERT INTO notadecredito (id_prestacion, tipo, letra, ptovta, numero, fecha, " +
                                "motivodedebito, importedebitado, debitoaceptado, motivoderefactura, importederefactura, " +
                                "prestacionenglobante, usuario, id_notadedebito, cargadocompletamente, comentarios, diasfacturados, tiporegistro, comentarios_debito) " +
                                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, ?, ?, ?, ?)";
                        jdbcTemplate.update(sqlInsert, idPrestacion, tipoDoc, letraDoc, puntoVenta, numero, fechaSql,
                                p.get("motivoDebito"), importeDebitado, debitoAceptadoBool, p.get("motivoRefactura"),
                                importeRefactura, prestacionEnglobante, usuario, idNotaDebito, p.get("comentarios"), diasFacturados, tipoRegistro, p.get("comentariosDebito"));
                    }
                }
            }
        }
    }
}