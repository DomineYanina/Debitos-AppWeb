package com.debitos.backend.service;

import com.debitos.backend.dto.EstadoSincronizacionPrestacionesDTO;
import com.debitos.backend.dto.PrestacionCandidataDTO;
import com.debitos.backend.dto.PrevisualizacionPrestacionesDTO;
import com.debitos.backend.dto.ResultadoReconciliacionDTO;
import com.debitos.backend.dto.ResumenSincronizacionPrestacionesDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class SincronizacionPrestacionesService {

    private static final Logger log = LoggerFactory.getLogger(SincronizacionPrestacionesService.class);

    @Autowired(required = false)
    @Qualifier("gestionJdbcTemplate")
    private NamedParameterJdbcTemplate gestionJdbcTemplate;

    @Autowired
    private JdbcTemplate debitosJdbcTemplate;

    @Autowired(required = false)
    private PlatformTransactionManager transactionManager;

    /**
     * Consulta el estado de la sincronización de prestaciones para el año indicado.
     */
    public EstadoSincronizacionPrestacionesDTO obtenerEstado(Integer anioParam) {
        int anio = (anioParam != null && anioParam > 2000) ? anioParam : LocalDate.now().getYear();
        EstadoSincronizacionPrestacionesDTO estado = new EstadoSincronizacionPrestacionesDTO();
        estado.setAnio(anio);

        // 1. Verificación de conectividad con Gestión
        if (gestionJdbcTemplate == null) {
            estado.setConexionOk(false);
            estado.setMensajeConexion("DataSource de Gestión no disponible.");
            cargarMetricasLocales(estado, anio);
            return estado;
        }

        try {
            gestionJdbcTemplate.getJdbcTemplate().execute("SELECT 1");
            estado.setConexionOk(true);
            estado.setMensajeConexion("Conexión activa con base de datos Gestión (Solo Lectura)");
        } catch (Exception e) {
            estado.setConexionOk(false);
            estado.setMensajeConexion("Error de conexión a Gestión: " + e.getMessage());
            cargarMetricasLocales(estado, anio);
            return estado;
        }

        try {
            Date inicio = Date.valueOf(LocalDate.of(anio, 1, 1));
            Date fin = Date.valueOf(LocalDate.of(anio, 12, 31));
            MapSqlParameterSource params = new MapSqlParameterSource()
                    .addValue("inicio", inicio)
                    .addValue("fin", fin);

            // 2. Extraer listas livianas de IDs de Gestión para el año (sólo columna idregistro)
            List<Integer> idsAmbGestion = gestionJdbcTemplate.query(
                    "SELECT cd.idregistro FROM cob_detaliq cd WHERE cd.fecha >= :inicio AND cd.fecha <= :fin AND cd.idregistro IS NOT NULL",
                    params,
                    (rs, rowNum) -> rs.getInt(1));

            List<Integer> idsIntGestion = gestionJdbcTemplate.query(
                    "SELECT ip.id AS idregistro FROM int_prestaciones ip WHERE ip.fecha >= :inicio AND ip.fecha <= :fin AND ip.id IS NOT NULL",
                    params,
                    (rs, rowNum) -> rs.getInt(1));

            long amb = idsAmbGestion.size();
            long intern = idsIntGestion.size();

            estado.setTotalGestionAmbulatorios(amb);
            estado.setTotalGestionInternados(intern);
            estado.setTotalGestion(amb + intern);

            // 3. Obtener conjuntos de IDs existentes en Débitos diferenciando por tipo de registro
            Set<Integer> existentesAmb = new HashSet<>();
            Set<Integer> existentesInt = new HashSet<>();
            debitosJdbcTemplate.query(
                    "SELECT idregistro, tiporegistro FROM amb_liquidado WHERE idregistro IS NOT NULL",
                    rs -> {
                        int id = rs.getInt(1);
                        String tipo = rs.getString(2);
                        if ("Internados".equalsIgnoreCase(tipo)) {
                            existentesInt.add(id);
                        } else {
                            existentesAmb.add(id);
                        }
                    }
            );

            // 4. Calcular delta real exacto por ID y tipo (evita colisiones y consultas repetitivas)
            long pendientesAmb = 0;
            for (Integer id : idsAmbGestion) {
                if (!existentesAmb.contains(id)) {
                    pendientesAmb++;
                }
            }
            long pendientesInt = 0;
            for (Integer id : idsIntGestion) {
                if (!existentesInt.contains(id)) {
                    pendientesInt++;
                }
            }

            estado.setPendientes(pendientesAmb + pendientesInt);

        } catch (Exception e) {
            log.error("Error al consultar prestaciones en Gestión: {}", e.getMessage(), e);
            estado.setMensajeConexion("Error consultando prestaciones en Gestión: " + e.getMessage());
        }

        // 5. Cargar métricas locales
        cargarMetricasLocales(estado, anio);

        return estado;
    }

    /**
     * Previsualiza las prestaciones candidatas a ser importadas para el año indicado.
     */
    public PrevisualizacionPrestacionesDTO previsualizar(Integer anioParam, int limite, String tipoFiltro) {
        int anio = (anioParam != null && anioParam > 2000) ? anioParam : LocalDate.now().getYear();
        int maxItems = (limite > 0 && limite <= 1000) ? limite : 300;

        PrevisualizacionPrestacionesDTO prev = new PrevisualizacionPrestacionesDTO();
        prev.setAnio(anio);

        if (gestionJdbcTemplate == null) {
            return prev;
        }

        try {
            Date inicio = Date.valueOf(LocalDate.of(anio, 1, 1));
            Date fin = Date.valueOf(LocalDate.of(anio, 12, 31));
            MapSqlParameterSource params = new MapSqlParameterSource()
                    .addValue("inicio", inicio)
                    .addValue("fin", fin);

            // 1. Obtener listas livianas de IDs de Gestión para el año
            List<Integer> idsAmbGestion = gestionJdbcTemplate.query(
                    "SELECT cd.idregistro FROM cob_detaliq cd WHERE cd.fecha >= :inicio AND cd.fecha <= :fin AND cd.idregistro IS NOT NULL",
                    params,
                    (rs, rowNum) -> rs.getInt(1));

            List<Integer> idsIntGestion = gestionJdbcTemplate.query(
                    "SELECT ip.id AS idregistro FROM int_prestaciones ip WHERE ip.fecha >= :inicio AND ip.fecha <= :fin AND ip.id IS NOT NULL",
                    params,
                    (rs, rowNum) -> rs.getInt(1));

            // 2. Obtener IDs ya existentes en Débitos por tipo de registro
            Set<Integer> existentesAmb = new HashSet<>();
            Set<Integer> existentesInt = new HashSet<>();
            debitosJdbcTemplate.query(
                    "SELECT idregistro, tiporegistro FROM amb_liquidado WHERE idregistro IS NOT NULL",
                    rs -> {
                        int id = rs.getInt(1);
                        String tipo = rs.getString(2);
                        if ("Internados".equalsIgnoreCase(tipo)) {
                            existentesInt.add(id);
                        } else {
                            existentesAmb.add(id);
                        }
                    }
            );

            // 3. Calcular IDs faltantes reales
            List<Integer> faltantesAmb = new ArrayList<>();
            for (Integer id : idsAmbGestion) {
                if (!existentesAmb.contains(id)) {
                    faltantesAmb.add(id);
                }
            }

            List<Integer> faltantesInt = new ArrayList<>();
            for (Integer id : idsIntGestion) {
                if (!existentesInt.contains(id)) {
                    faltantesInt.add(id);
                }
            }

            prev.setTotalAmbulatorios((long) faltantesAmb.size());
            prev.setTotalInternados((long) faltantesInt.size());
            prev.setTotalPendientes((long) (faltantesAmb.size() + faltantesInt.size()));

            Map<String, Long> mapaFacturasCabecera = obtenerMapaFacturasCabecera();

            boolean incluirAmb = tipoFiltro == null || "TODOS".equalsIgnoreCase(tipoFiltro) || "Ambulatorios".equalsIgnoreCase(tipoFiltro);
            boolean incluirInt = tipoFiltro == null || "TODOS".equalsIgnoreCase(tipoFiltro) || "Internados".equalsIgnoreCase(tipoFiltro);

            List<PrestacionCandidataDTO> todasCandidatas = new ArrayList<>();
            long conCabecera = 0;
            long sinCabecera = 0;
            BigDecimal sumaNeto = BigDecimal.ZERO;
            BigDecimal sumaIva = BigDecimal.ZERO;
            BigDecimal sumaTotal = BigDecimal.ZERO;

            // 4. Muestra Ambulatorios a partir de los IDs faltantes reales
            if (incluirAmb && !faltantesAmb.isEmpty()) {
                List<Integer> muestraAmbIds = faltantesAmb.subList(0, Math.min(faltantesAmb.size(), maxItems));
                MapSqlParameterSource sampleAmbParams = new MapSqlParameterSource("ids", muestraAmbIds);

                String sqlAmb = """
                    SELECT 
                        cd.idregistro,
                        tt.idturno AS grupo_de_turno,
                        cd.fecha,
                        pl.plan,
                        p.nro_doc,
                        p.tip_doc,
                        p.hc,
                        cd.codigo,
                        cd.descripcion,
                        cd.cantidad,
                        cd.coseguro,
                        tp.reintegro,
                        tp.imp_no_cubierto,
                        cl.refacturacion,
                        cd.especialista,
                        cd.ayudante AS ayudantes,
                        cd.anestesista,
                        cd.gastos,
                        cd.iva,
                        cd.total,
                        cd.porc_e AS porcentaje_especialista,
                        cd.porc_a1 AS porcentaje_ayudante1,
                        cd.porc_a2 AS porcentaje_ayudante2,
                        cd.porc_a AS porcentaje_anestesista,
                        cd.porc_g AS porcentaje_gastos,
                        p.nombre AS paciente,
                        med.nombre AS medico,
                        p.carnet,
                        ef.nombre AS efector,
                        cob.codigo AS codigo_cobertura,
                        cl.tipo_doc AS cob_factura_tipo,
                        cl.letra AS cob_factura_letra,
                        cl.num4 AS cob_factura_ptoventa,
                        cl.num8 AS cob_factura_numero
                    FROM cob_detaliq cd
                    LEFT JOIN tur_prestaciones tp ON cd.idregistro = tp.id
                    LEFT JOIN tur_turnos tt ON tp.idturno = tt.idturno
                    LEFT JOIN cob_liquidaciones cl ON cd.idliquidacion = cl.idliquidacion
                    LEFT JOIN pac_pacientes p ON cd.idpac = p.idpac
                    LEFT JOIN cob_cobertura cob ON tt.idcob = cob.idcob
                    LEFT JOIN cob_planes pl ON cd.idplan = pl.id
                    LEFT JOIN med_medicos med ON cd.idmed = med.idmed
                    LEFT JOIN med_medicos ef ON tp.idefector = ef.idmed
                    WHERE cd.idregistro IN (:ids)
                    ORDER BY cd.fecha DESC
                """;

                List<Map<String, Object>> filasAmb = gestionJdbcTemplate.queryForList(sqlAmb, sampleAmbParams);
                for (Map<String, Object> f : filasAmb) {
                    Integer idreg = parseEntero(f.get("idregistro"));
                    BigDecimal tot = toBigDecimal(f.get("total"));
                    BigDecimal iva = toBigDecimal(f.get("iva"));
                    BigDecimal neto = tot.subtract(iva);

                    sumaNeto = sumaNeto.add(neto);
                    sumaIva = sumaIva.add(iva);
                    sumaTotal = sumaTotal.add(tot);

                    PrestacionCandidataDTO dto = mapearCandidata(f, "Ambulatorios", idreg, neto, iva, tot, mapaFacturasCabecera);
                    if (dto.isFacturaExisteEnDebitos()) {
                        conCabecera++;
                    } else {
                        sinCabecera++;
                    }
                    todasCandidatas.add(dto);
                    if (todasCandidatas.size() >= maxItems) break;
                }
            }

            // 5. Muestra Internados a partir de los IDs faltantes reales
            if (incluirInt && !faltantesInt.isEmpty() && todasCandidatas.size() < maxItems) {
                int restantes = maxItems - todasCandidatas.size();
                List<Integer> muestraIntIds = faltantesInt.subList(0, Math.min(faltantesInt.size(), restantes));
                MapSqlParameterSource sampleIntParams = new MapSqlParameterSource("ids", muestraIntIds);

                String sqlInt = """
                    SELECT 
                        ip.id AS idregistro,
                        ii.nro_internacion,
                        ip.fecha,
                        pl.plan,
                        p.nro_doc,
                        p.tip_doc,
                        p.hc,
                        cp.codigo,
                        cp.descripcion,
                        ip.cantidad,
                        cl.refacturacion,
                        cdi.especialista,
                        cdi.ayudante AS ayudantes,
                        cdi.anestesista,
                        cdi.gastos,
                        cdi.iva,
                        p.nombre AS paciente,
                        med.nombre AS medico,
                        ii.carnet,
                        cob.codigo AS codigo_cobertura,
                        cl.tipo_doc AS cob_factura_tipo,
                        cl.letra AS cob_factura_letra,
                        cl.num4 AS cob_factura_ptoventa,
                        cl.num8 AS cob_factura_numero
                    FROM int_prestaciones ip
                    JOIN int_internaciones ii ON ip.idinternacion = ii.idinternacion
                    LEFT JOIN cob_detaliq_i cdi ON cdi.idregistro = ip.id
                    LEFT JOIN cob_liquidaciones cl ON ip.idliquidacion = cl.idliquidacion
                    LEFT JOIN pac_pacientes p ON ii.idpac = p.idpac
                    LEFT JOIN cob_cobertura cob ON ii.idcob = cob.idcob
                    LEFT JOIN cob_planes pl ON ii.idplan = pl.id
                    LEFT JOIN med_medicos med ON ii.idmedresponsable = med.idmed
                    LEFT JOIN cob_prestaciones cp ON ip.idprestacion = cp.idprestacion
                    WHERE ip.id IN (:ids)
                    ORDER BY ip.fecha DESC
                """;

                List<Map<String, Object>> filasInt = gestionJdbcTemplate.queryForList(sqlInt, sampleIntParams);
                for (Map<String, Object> f : filasInt) {
                    Integer idreg = parseEntero(f.get("idregistro"));
                    BigDecimal esp = toBigDecimal(f.get("especialista"));
                    BigDecimal ayu = toBigDecimal(f.get("ayudantes"));
                    BigDecimal ane = toBigDecimal(f.get("anestesista"));
                    BigDecimal gas = toBigDecimal(f.get("gastos"));
                    BigDecimal iva = toBigDecimal(f.get("iva"));

                    BigDecimal neto = esp.add(ayu).add(ane).add(gas);
                    BigDecimal tot = neto.add(iva);

                    sumaNeto = sumaNeto.add(neto);
                    sumaIva = sumaIva.add(iva);
                    sumaTotal = sumaTotal.add(tot);

                    PrestacionCandidataDTO dto = mapearCandidata(f, "Internados", idreg, neto, iva, tot, mapaFacturasCabecera);
                    if (dto.isFacturaExisteEnDebitos()) {
                        conCabecera++;
                    } else {
                        sinCabecera++;
                    }
                    todasCandidatas.add(dto);
                    if (todasCandidatas.size() >= maxItems) break;
                }
            }

            prev.setConFacturaEnCabecera(conCabecera);
            prev.setSinFacturaEnCabecera(sinCabecera);
            prev.setSumaTotalNeto(sumaNeto);
            prev.setSumaIva(sumaIva);
            prev.setSumaTotal(sumaTotal);
            prev.setPrestaciones(todasCandidatas);

        } catch (Exception e) {
            log.error("Error al previsualizar sincronización de prestaciones: {}", e.getMessage(), e);
        }

        return prev;
    }

    /**
     * Ejecuta el proceso de extracción, transformación y migración hacia amb_liquidado.
     */
    public ResumenSincronizacionPrestacionesDTO sincronizar(String usuario, Integer anioParam) {
        long inicioMs = System.currentTimeMillis();
        int anio = (anioParam != null && anioParam > 2000) ? anioParam : LocalDate.now().getYear();

        ResumenSincronizacionPrestacionesDTO resumen = new ResumenSincronizacionPrestacionesDTO();
        resumen.setAnioProcesado(anio);
        resumen.setFechaHora(LocalDateTime.now().toString());

        if (gestionJdbcTemplate == null) {
            resumen.setExito(false);
            resumen.setMensaje("DataSource de Gestión no disponible.");
            return resumen;
        }

        try {
            Map<String, Long> mapaFacturasCabecera = obtenerMapaFacturasCabecera();

            int totalLeidos = 0;
            int totalNuevas = 0;
            int omitidos = 0;
            int vinculados = 0;
            int sinCabecera = 0;

            String sqlInsertAmb = """
                INSERT INTO amb_liquidado (
                    idregistro, grupo_de_turno, fecha, plan, nro_doc, tip_doc, hc,
                    codigo, descripcion, cantidad, coseguro, reintegro, imp_no_cubierto,
                    refacturacion, especialista, ayudantes, anestesista, gastos, iva, total,
                    porcentaje_especialista, porcentaje_ayudante1, porcentaje_ayudante2,
                    porcentaje_anestesista, porcentaje_gastos, paciente, medico, total_neto,
                    carnet, efector, idcabecera, operador, ope_recepcion, vo, especialidad,
                    serv_espe, derivador, grupo, centrocosto, operador_liquida,
                    tiporegistro, codigo_cobertura, fechaimportacion
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, CURRENT_DATE
                )
                ON CONFLICT (idregistro, tiporegistro) DO NOTHING
            """;

            String sqlInsertInt = """
                INSERT INTO amb_liquidado (
                    idregistro, fecha, plan, nro_doc, tip_doc, hc,
                    codigo, descripcion, cantidad, refacturacion, especialista, ayudantes,
                    anestesista, gastos, iva, total, porcentaje_especialista, porcentaje_ayudante1,
                    porcentaje_ayudante2, porcentaje_anestesista, porcentaje_gastos, paciente,
                    medico, total_neto, nro_internacion, fecha_ingreso, fecha_egreso, modulo,
                    grupomodulo, carnet, idcabecera, vo, derivador, grupo, centrocosto,
                    tipo_internacion, prog_urg, patologia, medico_responsable_matricula, diagnostico_i,
                    operador_liquida, tiporegistro, codigo_cobertura, fechaimportacion
                ) VALUES (
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, CURRENT_DATE
                )
                ON CONFLICT (idregistro, tiporegistro) DO NOTHING
            """;

            Date inicio = Date.valueOf(LocalDate.of(anio, 1, 1));
            Date fin = Date.valueOf(LocalDate.of(anio, 12, 31));
            MapSqlParameterSource paramsAnio = new MapSqlParameterSource()
                    .addValue("inicio", inicio)
                    .addValue("fin", fin);

            log.info("Sincronización {} de amb_liquidado: obteniendo IDs candidatos desde Gestión...", anio);

            // 1. Obtener lista ultra-liviana de IDs desde Gestión (sólo columna idregistro)
            List<Integer> idsAmbGestion = gestionJdbcTemplate.query(
                    "SELECT cd.idregistro FROM cob_detaliq cd WHERE cd.fecha >= :inicio AND cd.fecha <= :fin AND cd.idregistro IS NOT NULL",
                    paramsAnio,
                    (rs, rowNum) -> rs.getInt(1));

            List<Integer> idsIntGestion = gestionJdbcTemplate.query(
                    "SELECT ip.id AS idregistro FROM int_prestaciones ip WHERE ip.fecha >= :inicio AND ip.fecha <= :fin AND ip.id IS NOT NULL",
                    paramsAnio,
                    (rs, rowNum) -> rs.getInt(1));

            totalLeidos = idsAmbGestion.size() + idsIntGestion.size();
            log.info("Gestión reporta {} ambulatorios y {} internados para el año {} (total: {}).",
                    idsAmbGestion.size(), idsIntGestion.size(), anio, totalLeidos);

            // 2. Obtener IDs ya existentes en Débitos por tipo de registro
            Set<Integer> existentesAmb = new HashSet<>();
            Set<Integer> existentesInt = new HashSet<>();
            debitosJdbcTemplate.query(
                    "SELECT idregistro, tiporegistro FROM amb_liquidado WHERE idregistro IS NOT NULL",
                    rs -> {
                        int id = rs.getInt(1);
                        String tipo = rs.getString(2);
                        if ("Internados".equalsIgnoreCase(tipo)) {
                            existentesInt.add(id);
                        } else {
                            existentesAmb.add(id);
                        }
                    });
            log.info("Débitos ya cuenta con {} ambulatorios y {} internados registrados.",
                    existentesAmb.size(), existentesInt.size());

            // 3. Calcular los IDs faltantes (delta exacto por tipo)
            List<Integer> faltantesAmb = new ArrayList<>();
            for (Integer id : idsAmbGestion) {
                if (!existentesAmb.contains(id)) {
                    faltantesAmb.add(id);
                }
            }

            List<Integer> faltantesInt = new ArrayList<>();
            for (Integer id : idsIntGestion) {
                if (!existentesInt.contains(id)) {
                    faltantesInt.add(id);
                }
            }

            omitidos = totalLeidos - (faltantesAmb.size() + faltantesInt.size());
            log.info("Delta a sincronizar: {} ambulatorios nuevos, {} internados nuevos (omitidos ya existentes: {}).",
                    faltantesAmb.size(), faltantesInt.size(), omitidos);

            int batchChunkSize = 2000;

            // 4. Extracción rica de Ambulatorios SÓLO para los IDs que faltan
            if (!faltantesAmb.isEmpty()) {
                log.info("Extrayendo e insertando {} ambulatorios faltantes desde Gestión...", faltantesAmb.size());
                for (int i = 0; i < faltantesAmb.size(); i += batchChunkSize) {
                    List<Integer> chunk = faltantesAmb.subList(i, Math.min(i + batchChunkSize, faltantesAmb.size()));
                    MapSqlParameterSource chunkParams = new MapSqlParameterSource("ids", chunk);

                    String sqlExtractAmbPorIds = """
                        SELECT 
                            cd.idregistro,
                            tt.idturno AS grupo_de_turno,
                            cd.fecha,
                            pl.plan,
                            p.nro_doc,
                            p.tip_doc,
                            p.hc,
                            cd.codigo,
                            cd.descripcion,
                            cd.cantidad,
                            cd.coseguro,
                            tp.reintegro,
                            tp.imp_no_cubierto,
                            cl.refacturacion,
                            cd.especialista,
                            cd.ayudante AS ayudantes,
                            cd.anestesista,
                            cd.gastos,
                            cd.iva,
                            cd.total,
                            cd.porc_e AS porcentaje_especialista,
                            cd.porc_a1 AS porcentaje_ayudante1,
                            cd.porc_a2 AS porcentaje_ayudante2,
                            cd.porc_a AS porcentaje_anestesista,
                            cd.porc_g AS porcentaje_gastos,
                            p.nombre AS paciente,
                            med.nombre AS medico,
                            p.carnet,
                            ef.nombre AS efector,
                            tp.operador,
                            tt.operador AS ope_recepcion,
                            cd.vo,
                            esp.serv_espe AS especialidad,
                            esp.nombre AS serv_espe,
                            der.nombre AS derivador,
                            grp.grupo,
                            cc.centrocosto,
                            cl.operador AS operador_liquida,
                            cl.tipo_doc AS cob_factura_tipo,
                            cl.letra AS cob_factura_letra,
                            cl.num4 AS cob_factura_ptoventa,
                            cl.num8 AS cob_factura_numero,
                            cob.codigo AS codigo_cobertura
                        FROM cob_detaliq cd
                        LEFT JOIN tur_prestaciones tp ON cd.idregistro = tp.id
                        LEFT JOIN tur_turnos tt ON tp.idturno = tt.idturno
                        LEFT JOIN cob_liquidaciones cl ON cd.idliquidacion = cl.idliquidacion
                        LEFT JOIN pac_pacientes p ON cd.idpac = p.idpac
                        LEFT JOIN cob_cobertura cob ON tt.idcob = cob.idcob
                        LEFT JOIN cob_planes pl ON cd.idplan = pl.id
                        LEFT JOIN med_medicos med ON cd.idmed = med.idmed
                        LEFT JOIN med_medicos ef ON tp.idefector = ef.idmed
                        LEFT JOIN med_especialidades esp ON cd.idespe = esp.idespe
                        LEFT JOIN med_derivadores der ON cd.idderivador = der.idderivador
                        LEFT JOIN cob_grupos grp ON cd.idgrupo = grp.idgrupo
                        LEFT JOIN cfg_centrocosto cc ON cd.idcentrocosto = cc.idcentrocosto
                        WHERE cd.idregistro IN (:ids)
                    """;

                    List<Map<String, Object>> filasAmb = gestionJdbcTemplate.queryForList(sqlExtractAmbPorIds, chunkParams);
                    List<Object[]> batchAmbulatorios = new ArrayList<>();
                    Set<Integer> yaEnLoteAmb = new HashSet<>();
                    for (Map<String, Object> f : filasAmb) {
                        Integer idreg = parseEntero(f.get("idregistro"));
                        if (idreg == null || !yaEnLoteAmb.add(idreg)) continue;

                        BigDecimal tot = toBigDecimal(f.get("total"));
                        BigDecimal iva = toBigDecimal(f.get("iva"));
                        BigDecimal neto = tot.subtract(iva);

                        Long idCabecera = resolverIdCabecera(f, mapaFacturasCabecera);
                        if (idCabecera != null) {
                            vinculados++;
                        } else {
                            sinCabecera++;
                        }

                        Object[] p = new Object[] {
                            idreg,
                            parseEntero(f.get("grupo_de_turno")),
                            toDate(f.get("fecha")),
                            trimOrNull(f.get("plan")),
                            parseLong(f.get("nro_doc")),
                            trimOrNull(f.get("tip_doc")),
                            trimOrNull(f.get("hc")),
                            trimOrNull(f.get("codigo")),
                            trimOrNull(f.get("descripcion")),
                            toBigDecimal(f.get("cantidad")),
                            toBigDecimal(f.get("coseguro")),
                            toBigDecimal(f.get("reintegro")),
                            toBigDecimal(f.get("imp_no_cubierto")),
                            trimOrNull(f.get("refacturacion")),
                            toBigDecimal(f.get("especialista")),
                            toBigDecimal(f.get("ayudantes")),
                            toBigDecimal(f.get("anestesista")),
                            toBigDecimal(f.get("gastos")),
                            iva,
                            tot,
                            toBigDecimal(f.get("porcentaje_especialista")),
                            toBigDecimal(f.get("porcentaje_ayudante1")),
                            toBigDecimal(f.get("porcentaje_ayudante2")),
                            toBigDecimal(f.get("porcentaje_anestesista")),
                            toBigDecimal(f.get("porcentaje_gastos")),
                            trimOrNull(f.get("paciente")),
                            trimOrNull(f.get("medico")),
                            neto,
                            trimOrNull(f.get("carnet")),
                            trimOrNull(f.get("efector")),
                            idCabecera,
                            trimOrNull(f.get("operador")),
                            trimOrNull(f.get("ope_recepcion")),
                            trimOrNull(f.get("vo")),
                            trimOrNull(f.get("especialidad")),
                            trimOrNull(f.get("serv_espe")),
                            trimOrNull(f.get("derivador")),
                            trimOrNull(f.get("grupo")),
                            trimOrNull(f.get("centrocosto")),
                            trimOrNull(f.get("operador_liquida")),
                            "Ambulatorios",
                            trimOrNull(f.get("codigo_cobertura"))
                        };

                        batchAmbulatorios.add(p);
                    }

                    if (!batchAmbulatorios.isEmpty()) {
                        ejecutarEnLotes(sqlInsertAmb, batchAmbulatorios, 1000);
                        totalNuevas += batchAmbulatorios.size();
                    }
                }
            }

            // 5. Extracción rica de Internados SÓLO para los IDs que faltan
            if (!faltantesInt.isEmpty()) {
                log.info("Extrayendo e insertando {} internados faltantes desde Gestión...", faltantesInt.size());
                for (int i = 0; i < faltantesInt.size(); i += batchChunkSize) {
                    List<Integer> chunk = faltantesInt.subList(i, Math.min(i + batchChunkSize, faltantesInt.size()));
                    MapSqlParameterSource chunkParams = new MapSqlParameterSource("ids", chunk);

                    String sqlExtractIntPorIds = """
                        SELECT 
                            ip.id AS idregistro,
                            ii.nro_internacion,
                            ip.fecha,
                            pl.plan,
                            p.nro_doc,
                            p.tip_doc,
                            p.hc,
                            cp.codigo,
                            cp.descripcion,
                            ip.cantidad,
                            cl.refacturacion,
                            cdi.especialista,
                            cdi.ayudante AS ayudantes,
                            cdi.anestesista,
                            cdi.gastos,
                            cdi.iva,
                            ip.porc_e AS porcentaje_especialista,
                            ip.porc_a1 AS porcentaje_ayudante1,
                            ip.porc_a2 AS porcentaje_ayudante2,
                            ip.porc_a AS porcentaje_anestesista,
                            ip.porc_g AS porcentaje_gastos,
                            p.nombre AS paciente,
                            med.nombre AS medico,
                            ii.carnet,
                            ii.fecha_ingreso,
                            ii.fecha_egreso,
                            ip.idmod_id AS modulo,
                            ip.id AS grupomodulo,
                            ii.vo,
                            der.nombre AS derivador,
                            grp.grupo,
                            cc.centrocosto,
                            ii.tipo_internacion,
                            ii.prog_urg,
                            pat.patologia,
                            med.matricula AS medico_responsable_m,
                            diag.diagnostico AS diagnostico_i,
                            cl.operador AS operador_liquida,
                            cl.tipo_doc AS cob_factura_tipo,
                            cl.letra AS cob_factura_letra,
                            cl.num4 AS cob_factura_ptoventa,
                            cl.num8 AS cob_factura_numero,
                            cob.codigo AS codigo_cobertura
                        FROM int_prestaciones ip
                        JOIN int_internaciones ii ON ip.idinternacion = ii.idinternacion
                        LEFT JOIN cob_detaliq_i cdi ON cdi.idregistro = ip.id
                        LEFT JOIN cob_liquidaciones cl ON ip.idliquidacion = cl.idliquidacion
                        LEFT JOIN pac_pacientes p ON ii.idpac = p.idpac
                        LEFT JOIN cob_cobertura cob ON ii.idcob = cob.idcob
                        LEFT JOIN cob_planes pl ON ii.idplan = pl.id
                        LEFT JOIN med_medicos med ON ii.idmedresponsable = med.idmed
                        LEFT JOIN med_derivadores der ON ii.idderivador = der.idderivador
                        LEFT JOIN int_patologias pat ON ii.idpatologia = pat.idpatologia
                        LEFT JOIN cob_prestaciones cp ON ip.idprestacion = cp.idprestacion
                        LEFT JOIN cob_grupos grp ON cp.idgrupo = grp.idgrupo
                        LEFT JOIN cfg_centrocosto cc ON ip.idcentrocosto = cc.idcentrocosto
                        LEFT JOIN med_diag diag ON diag.iddiag::text = TRIM(ii.diag_ing)
                        WHERE ip.id IN (:ids)
                    """;

                    List<Map<String, Object>> filasInt = gestionJdbcTemplate.queryForList(sqlExtractIntPorIds, chunkParams);
                    List<Object[]> batchInternados = new ArrayList<>();
                    Set<Integer> yaEnLoteInt = new HashSet<>();
                    for (Map<String, Object> f : filasInt) {
                        Integer idreg = parseEntero(f.get("idregistro"));
                        if (idreg == null || !yaEnLoteInt.add(idreg)) continue;

                        BigDecimal esp = toBigDecimal(f.get("especialista"));
                        BigDecimal ayu = toBigDecimal(f.get("ayudantes"));
                        BigDecimal ane = toBigDecimal(f.get("anestesista"));
                        BigDecimal gas = toBigDecimal(f.get("gastos"));
                        BigDecimal iva = toBigDecimal(f.get("iva"));

                        BigDecimal neto = esp.add(ayu).add(ane).add(gas);
                        BigDecimal tot = neto.add(iva);

                        Long idCabecera = resolverIdCabecera(f, mapaFacturasCabecera);
                        if (idCabecera != null) {
                            vinculados++;
                        } else {
                            sinCabecera++;
                        }

                        Object[] p = new Object[] {
                            idreg,
                            toDate(f.get("fecha")),
                            trimOrNull(f.get("plan")),
                            parseLong(f.get("nro_doc")),
                            trimOrNull(f.get("tip_doc")),
                            trimOrNull(f.get("hc")),
                            trimOrNull(f.get("codigo")),
                            trimOrNull(f.get("descripcion")),
                            toBigDecimal(f.get("cantidad")),
                            trimOrNull(f.get("refacturacion")),
                            esp,
                            ayu,
                            ane,
                            gas,
                            iva,
                            tot,
                            toBigDecimal(f.get("porcentaje_especialista")),
                            toBigDecimal(f.get("porcentaje_ayudante1")),
                            toBigDecimal(f.get("porcentaje_ayudante2")),
                            toBigDecimal(f.get("porcentaje_anestesista")),
                            toBigDecimal(f.get("porcentaje_gastos")),
                            trimOrNull(f.get("paciente")),
                            trimOrNull(f.get("medico")),
                            neto,
                            parseLong(f.get("nro_internacion")),
                            toDate(f.get("fecha_ingreso")),
                            toDate(f.get("fecha_egreso")),
                            parseLong(f.get("modulo")),
                            parseLong(f.get("grupomodulo")),
                            trimOrNull(f.get("carnet")),
                            idCabecera,
                            trimOrNull(f.get("vo")),
                            trimOrNull(f.get("derivador")),
                            trimOrNull(f.get("grupo")),
                            trimOrNull(f.get("centrocosto")),
                            trimOrNull(f.get("tipo_internacion")),
                            trimOrNull(f.get("prog_urg")),
                            trimOrNull(f.get("patologia")),
                            parseLong(f.get("medico_responsable_m")),
                            trimOrNull(f.get("diagnostico_i")),
                            trimOrNull(f.get("operador_liquida")),
                            "Internados",
                            trimOrNull(f.get("codigo_cobertura"))
                        };

                        batchInternados.add(p);
                    }

                    if (!batchInternados.isEmpty()) {
                        ejecutarEnLotes(sqlInsertInt, batchInternados, 1000);
                        totalNuevas += batchInternados.size();
                    }
                }
            }

            // 4. Reconciliación adicional de huérfanas existentes en amb_liquidado
            int huerfanasReconciliadas = reconciliarHuerfanasConCabecera(anio).getTotalReconciliadas();

            resumen.setExito(true);
            resumen.setTotalLeidosGestion(totalLeidos);
            resumen.setNuevasInsertadas(totalNuevas);
            resumen.setExistentesOmitidas(omitidos);
            resumen.setVinculadasCabecera(vinculados);
            resumen.setHuerfanasSinCabecera(sinCabecera);
            resumen.setHuerfanasPreviasReconciliadas(huerfanasReconciliadas);
            resumen.setDuracionMs(System.currentTimeMillis() - inicioMs);
            resumen.setMensaje(String.format(
                "Sincronización de prestaciones completada con éxito. %d nuevas insertadas (%d con factura vinculada, %d huérfanas), %d ya existentes omitidas. %d huérfanas históricas reconciliadas.",
                resumen.getNuevasInsertadas(), resumen.getVinculadasCabecera(), resumen.getHuerfanasSinCabecera(),
                resumen.getExistentesOmitidas(), resumen.getHuerfanasPreviasReconciliadas()
            ));

            registrarAuditoria(usuario, anio, totalNuevas, omitidos, vinculados, sinCabecera, resumen.getDuracionMs(), "EXITO", resumen.getMensaje());
            log.info("Sincronización de prestaciones finalizada por '{}': {}", usuario, resumen.getMensaje());

        } catch (Exception e) {
            long duracion = System.currentTimeMillis() - inicioMs;
            log.error("Error durante sincronización de prestaciones: {}", e.getMessage(), e);
            resumen.setExito(false);
            resumen.setDuracionMs(duracion);
            resumen.setMensaje("Ocurrió un error durante la sincronización: " + e.getMessage());
            registrarAuditoria(usuario, anio, 0, 0, 0, 0, duracion, "ERROR", e.getMessage());
        }

        return resumen;
    }

    /**
     * Escanea las prestaciones con idcabecera IS NULL del año actual e intenta vincularlas si sus facturas
     * ya fueron importadas o cargadas en cabecera.
     */
    public int reconciliarHuerfanasConCabecera() {
        return reconciliarHuerfanasConCabecera(LocalDate.now().getYear()).getTotalReconciliadas();
    }

    /**
     * Reconcilia prestaciones huérfanas en amb_liquidado para el año especificado:
     * - Fase 1: Ambulatorios (consulta directa y vinculación inmediata a cabecera).
     * - Fase 2: Internados (paginación por cursor secuencial id > ultimoId para inspeccionar lotes sin interrupción prematura).
     */
    public ResultadoReconciliacionDTO reconciliarHuerfanasConCabecera(Integer anioParam) {
        int anio = (anioParam != null && anioParam > 2000) ? anioParam : LocalDate.now().getYear();
        ResultadoReconciliacionDTO resultado = new ResultadoReconciliacionDTO();
        resultado.setExito(true);

        if (gestionJdbcTemplate == null) {
            resultado.setMensaje("Conexión a base de datos Gestión no disponible.");
            return resultado;
        }

        int totalAmb = 0;
        int totalInt = 0;

        try {
            Date inicio = Date.valueOf(LocalDate.of(anio, 1, 1));
            Date fin = Date.valueOf(LocalDate.of(anio, 12, 31));

            Map<String, Long> mapaFacturasCabecera = obtenerMapaFacturasCabecera();
            if (mapaFacturasCabecera.isEmpty()) {
                resultado.setMensaje("No se encontraron comprobantes en la tabla cabecera para vincular.");
                return resultado;
            }

            // ==========================================
            // FASE 1: RECONCILIAR AMBULATORIOS
            // ==========================================
            List<Integer> idsAmbHuerfanos = debitosJdbcTemplate.queryForList(
                "SELECT idregistro FROM amb_liquidado WHERE (tiporegistro = 'Ambulatorios' OR (tiporegistro IS NULL AND nro_internacion IS NULL)) AND idcabecera IS NULL AND idregistro IS NOT NULL AND fecha >= ? AND fecha <= ?",
                Integer.class,
                inicio, fin
            );

            if (idsAmbHuerfanos != null && !idsAmbHuerfanos.isEmpty()) {
                int batchSize = 1000;
                String sqlLiqAmb = """
                    SELECT cd.idregistro, cl.tipo_doc, cl.letra, cl.num4, cl.num8
                    FROM cob_detaliq cd
                    JOIN cob_liquidaciones cl ON cd.idliquidacion = cl.idliquidacion
                    WHERE cd.idregistro IN (:ids)
                      AND cl.tipo_doc IS NOT NULL AND TRIM(cl.tipo_doc) <> ''
                      AND cl.num8 IS NOT NULL AND TRIM(cl.num8) <> ''
                """;

                for (int i = 0; i < idsAmbHuerfanos.size(); i += batchSize) {
                    List<Integer> subIds = idsAmbHuerfanos.subList(i, Math.min(i + batchSize, idsAmbHuerfanos.size()));
                    List<Map<String, Object>> filasLiqAmb = gestionJdbcTemplate.queryForList(sqlLiqAmb, new MapSqlParameterSource("ids", subIds));

                    List<Object[]> batchUpdatesAmb = new ArrayList<>();
                    for (Map<String, Object> f : filasLiqAmb) {
                        Integer idreg = parseEntero(f.get("idregistro"));
                        String tipo = trimOrNull(f.get("tipo_doc"));
                        String letra = trimOrNull(f.get("letra"));
                        Integer ptovta = parseEntero(f.get("num4"));
                        Integer numero = parseEntero(f.get("num8"));

                        if (idreg != null && tipo != null && letra != null && ptovta != null && numero != null) {
                            String clave = armarClave(tipo, letra, ptovta, numero);
                            Long idCab = mapaFacturasCabecera.get(clave);
                            if (idCab != null) {
                                batchUpdatesAmb.add(new Object[] { idCab, idreg });
                            }
                        }
                    }

                    if (!batchUpdatesAmb.isEmpty()) {
                        debitosJdbcTemplate.batchUpdate(
                            "UPDATE amb_liquidado SET idcabecera = ?, tiporegistro = COALESCE(tiporegistro, 'Ambulatorios') WHERE idregistro = ? AND (tiporegistro = 'Ambulatorios' OR tiporegistro IS NULL) AND idcabecera IS NULL",
                            batchUpdatesAmb
                        );
                        totalAmb += batchUpdatesAmb.size();

                        List<Object[]> cabParamsAmb = batchUpdatesAmb.stream()
                                .map(p -> new Object[] { p[0] })
                                .distinct()
                                .toList();
                        debitosJdbcTemplate.batchUpdate(
                            "UPDATE cabecera SET tiporegistro = 'Ambulatorios' WHERE id = ? AND tiporegistro IS NULL",
                            cabParamsAmb
                        );
                    }
                }
            }

            // ==========================================
            // FASE 2: RECONCILIAR INTERNADOS (CON PAGINACIÓN POR CURSOR ID)
            // ==========================================
            String sqlLiqInt = """
                SELECT ip.id AS idregistro, cl.tipo_doc, cl.letra, cl.num4, cl.num8
                FROM int_prestaciones ip
                JOIN cob_liquidaciones cl ON ip.idliquidacion = cl.idliquidacion
                WHERE ip.id IN (:ids)
                  AND cl.tipo_doc IS NOT NULL AND TRIM(cl.tipo_doc) <> ''
                  AND cl.num8 IS NOT NULL AND TRIM(cl.num8) <> ''
            """;

            long ultimoId = 0L;
            int maxLotes = 30; // Escanea hasta 30.000 internados por ejecución

            while (maxLotes-- > 0) {
                List<Map<String, Object>> filasIntLocal = debitosJdbcTemplate.queryForList(
                    "SELECT id, idregistro FROM amb_liquidado WHERE (tiporegistro = 'Internados' OR (tiporegistro IS NULL AND nro_internacion IS NOT NULL)) AND id > ? AND idcabecera IS NULL AND idregistro IS NOT NULL AND fecha >= ? AND fecha <= ? ORDER BY id ASC LIMIT 1000",
                    ultimoId, inicio, fin
                );

                if (filasIntLocal.isEmpty()) {
                    break;
                }

                List<Integer> idsSinCabeceraInt = new ArrayList<>(filasIntLocal.size());
                for (Map<String, Object> r : filasIntLocal) {
                    Number rowId = (Number) r.get("id");
                    if (rowId != null && rowId.longValue() > ultimoId) {
                        ultimoId = rowId.longValue();
                    }
                    Integer idreg = parseEntero(r.get("idregistro"));
                    if (idreg != null) {
                        idsSinCabeceraInt.add(idreg);
                    }
                }

                if (idsSinCabeceraInt.isEmpty()) {
                    continue;
                }

                List<Map<String, Object>> filasLiqInt = gestionJdbcTemplate.queryForList(sqlLiqInt, new MapSqlParameterSource("ids", idsSinCabeceraInt));
                List<Object[]> batchUpdatesInt = new ArrayList<>();
                for (Map<String, Object> f : filasLiqInt) {
                    Integer idreg = parseEntero(f.get("idregistro"));
                    String tipo = trimOrNull(f.get("tipo_doc"));
                    String letra = trimOrNull(f.get("letra"));
                    Integer ptovta = parseEntero(f.get("num4"));
                    Integer numero = parseEntero(f.get("num8"));

                    if (idreg != null && tipo != null && letra != null && ptovta != null && numero != null) {
                        String clave = armarClave(tipo, letra, ptovta, numero);
                        Long idCab = mapaFacturasCabecera.get(clave);
                        if (idCab != null) {
                            batchUpdatesInt.add(new Object[] { idCab, idreg });
                        }
                    }
                }

                if (!batchUpdatesInt.isEmpty()) {
                    debitosJdbcTemplate.batchUpdate(
                        "UPDATE amb_liquidado SET idcabecera = ?, tiporegistro = COALESCE(tiporegistro, 'Internados') WHERE idregistro = ? AND (tiporegistro = 'Internados' OR tiporegistro IS NULL) AND idcabecera IS NULL",
                        batchUpdatesInt
                    );
                    totalInt += batchUpdatesInt.size();

                    List<Object[]> cabParamsInt = batchUpdatesInt.stream()
                            .map(p -> new Object[] { p[0] })
                            .distinct()
                            .toList();
                    debitosJdbcTemplate.batchUpdate(
                        "UPDATE cabecera SET tiporegistro = 'Internados' WHERE id = ? AND tiporegistro IS NULL",
                        cabParamsInt
                    );
                }
                // Nota: el cursor ultimoId avanza siempre, inspeccionando el siguiente lote sin bloquearse
            }

            int total = totalAmb + totalInt;
            resultado.setTotalReconciliadas(total);
            resultado.setAmbulatoriosReconciliados(totalAmb);
            resultado.setInternadosReconciliados(totalInt);

            if (total > 0) {
                propagarTipoRegistroDocumentos();
                resultado.setMensaje(String.format(
                    "Reconciliación exitosa para el año %d: se vincularon %d prestaciones a cabecera (%d ambulatorias, %d internaciones).",
                    anio, total, totalAmb, totalInt
                ));
                log.info("Reconciliación para el año {}: {} prestaciones huérfanas vinculadas a cabecera (Amb: {}, Int: {}).",
                    anio, total, totalAmb, totalInt);
            } else {
                resultado.setMensaje(String.format(
                    "Reconciliación completada para el año %d: No se hallaron nuevas facturas coincidentes en cabecera. Las prestaciones restantes en amb_liquidado corresponden a internaciones en curso o pendientes de facturación en Gestión.",
                    anio
                ));
            }

        } catch (Exception e) {
            log.error("Error al reconciliar huérfanas en amb_liquidado para el año {}: {}", anio, e.getMessage(), e);
            resultado.setExito(false);
            resultado.setMensaje("Error al reconciliar huérfanas: " + e.getMessage());
        }

        return resultado;
    }

    private void propagarTipoRegistroDocumentos() {
        try {
            debitosJdbcTemplate.update("""
                UPDATE cabecera c_hijo
                SET tiporegistro = c_padre.tiporegistro
                FROM cabecera c_padre
                WHERE c_hijo.asociado = c_padre.id
                  AND c_padre.tiporegistro IS NOT NULL
                  AND c_hijo.tiporegistro IS NULL
            """);

            debitosJdbcTemplate.update("""
                UPDATE cabecera c_hijo
                SET tiporegistro = c_fac.tiporegistro
                FROM cabecera c_fac
                WHERE c_hijo.asociadogrupo = c_fac.asociadogrupo
                  AND c_fac.asociadogrupo IS NOT NULL AND c_fac.asociadogrupo > 0
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
                  AND c_fac.tiporegistro IS NOT NULL
                  AND c_hijo.tiporegistro IS NULL
            """);

            debitosJdbcTemplate.update("""
                UPDATE cabecera c_hijo
                SET tiporegistro = c_fac.tiporegistro
                FROM cabecera c_fac
                WHERE c_hijo.grupo = c_fac.grupo
                  AND c_fac.grupo IS NOT NULL AND c_fac.grupo > 0
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
                  AND c_fac.tiporegistro IS NOT NULL
                  AND c_hijo.tiporegistro IS NULL
            """);
        } catch (Exception e) {
            log.warn("Aviso en propagación de tiporegistro: {}", e.getMessage());
        }
    }

    private void ejecutarEnLotes(String sql, List<Object[]> listaParams, int batchSize) {
        int total = listaParams.size();
        if (total == 0) return;

        if (transactionManager != null) {
            TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
            txTemplate.executeWithoutResult(status -> {
                for (int i = 0; i < total; i += batchSize) {
                    int toIndex = Math.min(i + batchSize, total);
                    List<Object[]> sublista = listaParams.subList(i, toIndex);
                    debitosJdbcTemplate.batchUpdate(sql, sublista);
                }
            });
        } else {
            for (int i = 0; i < total; i += batchSize) {
                int toIndex = Math.min(i + batchSize, total);
                List<Object[]> sublista = listaParams.subList(i, toIndex);
                debitosJdbcTemplate.batchUpdate(sql, sublista);
            }
        }
    }

    private Long resolverIdCabecera(Map<String, Object> f, Map<String, Long> mapaFacturasCabecera) {
        String tipo = trimOrNull(f.get("cob_factura_tipo"));
        String letra = trimOrNull(f.get("cob_factura_letra"));
        Integer ptovta = parseEntero(f.get("cob_factura_ptoventa"));
        Integer numero = parseEntero(f.get("cob_factura_numero"));

        if (tipo != null && letra != null && ptovta != null && numero != null) {
            String clave = armarClave(tipo, letra, ptovta, numero);
            return mapaFacturasCabecera.get(clave);
        }
        return null;
    }

    private PrestacionCandidataDTO mapearCandidata(Map<String, Object> f, String tipoRegistro, Integer idreg,
                                                   BigDecimal neto, BigDecimal iva, BigDecimal tot,
                                                   Map<String, Long> mapaFacturasCabecera) {
        PrestacionCandidataDTO dto = new PrestacionCandidataDTO();
        dto.setIdregistro(idreg);
        dto.setTiporegistro(tipoRegistro);

        Date d = (Date) f.get("fecha");
        dto.setFecha(d != null ? d.toLocalDate() : null);

        dto.setPaciente(trimOrNull(f.get("paciente")));
        dto.setCarnet(trimOrNull(f.get("carnet")));
        dto.setCodigo(trimOrNull(f.get("codigo")));
        dto.setDescripcion(trimOrNull(f.get("descripcion")));
        dto.setCantidad(parseEntero(f.get("cantidad")));
        dto.setMedico(trimOrNull(f.get("medico")));
        dto.setEfector(trimOrNull(f.get("efector")));
        dto.setCodigoCobertura(trimOrNull(f.get("codigo_cobertura")));
        dto.setPlan(trimOrNull(f.get("plan")));

        dto.setTotalNeto(neto);
        dto.setIva(iva);
        dto.setTotal(tot);

        String fcTipo = trimOrNull(f.get("cob_factura_tipo"));
        String fcLetra = trimOrNull(f.get("cob_factura_letra"));
        Integer fcPtovta = parseEntero(f.get("cob_factura_ptoventa"));
        Integer fcNumero = parseEntero(f.get("cob_factura_numero"));

        if (fcTipo != null && fcLetra != null && fcPtovta != null && fcNumero != null) {
            String comp = String.format("%s %s%04d-%08d", fcTipo.toUpperCase(), fcLetra.toUpperCase(), fcPtovta, fcNumero);
            dto.setFacturaComprobante(comp);

            String clave = armarClave(fcTipo, fcLetra, fcPtovta, fcNumero);
            Long idCab = mapaFacturasCabecera.get(clave);
            if (idCab != null) {
                dto.setIdcabecera(idCab);
                dto.setFacturaExisteEnDebitos(true);
            } else {
                dto.setFacturaExisteEnDebitos(false);
            }
        } else {
            dto.setFacturaExisteEnDebitos(false);
        }

        return dto;
    }

    private Set<Integer> obtenerIdsExistentesEnDebitos(Collection<Integer> candidateIds) {
        if (candidateIds == null || candidateIds.isEmpty()) {
            return new HashSet<>();
        }
        Set<Integer> set = new HashSet<>();
        List<Integer> list = new ArrayList<>(candidateIds);
        int batchSize = 1000;
        for (int i = 0; i < list.size(); i += batchSize) {
            List<Integer> sublist = list.subList(i, Math.min(i + batchSize, list.size()));
            String placeholders = String.join(",", Collections.nCopies(sublist.size(), "?"));
            try {
                List<Integer> encontrados = debitosJdbcTemplate.query(
                    "SELECT idregistro FROM amb_liquidado WHERE idregistro IN (" + placeholders + ")",
                    (rs, rowNum) -> rs.getInt(1),
                    sublist.toArray()
                );
                set.addAll(encontrados);
            } catch (Exception e) {
                log.warn("Error al consultar idregistros existentes en lote: {}", e.getMessage());
            }
        }
        return set;
    }

    private Map<String, Long> obtenerMapaFacturasCabecera() {
        Map<String, Long> map = new HashMap<>();
        try {
            debitosJdbcTemplate.query(
                "SELECT id, UPPER(TRIM(tipo)), UPPER(TRIM(letra)), ptovta, numero FROM cabecera WHERE tipo IS NOT NULL AND letra IS NOT NULL AND ptovta IS NOT NULL AND numero IS NOT NULL",
                rs -> {
                    long id = rs.getLong(1);
                    String tipo = rs.getString(2);
                    String letra = rs.getString(3);
                    int ptovta = rs.getInt(4);
                    int numero = rs.getInt(5);
                    map.put(armarClave(tipo, letra, ptovta, numero), id);
                }
            );
        } catch (Exception e) {
            log.error("Error al cargar mapa de comprobantes de cabecera: {}", e.getMessage());
        }
        return map;
    }

    private void cargarMetricasLocales(EstadoSincronizacionPrestacionesDTO estado, int anio) {
        try {
            Date inicio = Date.valueOf(LocalDate.of(anio, 1, 1));
            Date fin = Date.valueOf(LocalDate.of(anio, 12, 31));

            Long total = debitosJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM amb_liquidado WHERE fecha >= ? AND fecha <= ?",
                    Long.class, inicio, fin);
            estado.setTotalDebitos(total != null ? total : 0L);

            Long vinculadas = debitosJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM amb_liquidado WHERE fecha >= ? AND fecha <= ? AND idcabecera IS NOT NULL",
                    Long.class, inicio, fin);
            estado.setVinculadasCabecera(vinculadas != null ? vinculadas : 0L);

            Long huerfanas = debitosJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM amb_liquidado WHERE fecha >= ? AND fecha <= ? AND idcabecera IS NULL",
                    Long.class, inicio, fin);
            estado.setHuerfanasCabecera(huerfanas != null ? huerfanas : 0L);

            List<Map<String, Object>> ultimas = debitosJdbcTemplate.queryForList("""
                SELECT fecha_hora, usuario, nuevas_insertadas
                FROM registro_sincronizacion_prestaciones
                WHERE estado = 'EXITO'
                ORDER BY fecha_hora DESC
                LIMIT 1
            """);

            if (!ultimas.isEmpty()) {
                Map<String, Object> u = ultimas.get(0);
                Timestamp ts = (Timestamp) u.get("fecha_hora");
                if (ts != null) {
                    estado.setUltimaSincronizacion(ts.toLocalDateTime());
                }
                estado.setUltimoUsuario((String) u.get("usuario"));
                estado.setUltimasInsertadas((Integer) u.get("nuevas_insertadas"));
            }

        } catch (Exception e) {
            log.warn("No se pudieron cargar algunas métricas locales de amb_liquidado para el año {}: {}", anio, e.getMessage());
        }
    }

    private void registrarAuditoria(String usuario, int anio, int nuevas, int omitidas, int vinculadas, int sinCabecera,
                                    long duracionMs, String estado, String mensaje) {
        try {
            debitosJdbcTemplate.update("""
                INSERT INTO registro_sincronizacion_prestaciones
                (usuario, anio_procesado, nuevas_insertadas, existentes_omitidas, vinculadas_cabecera, sin_cabecera, duracion_ms, estado, mensaje)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, usuario, anio, nuevas, omitidas, vinculadas, sinCabecera, duracionMs, estado, mensaje);
        } catch (Exception e) {
            log.error("No se pudo registrar la auditoría de sincronización de prestaciones: {}", e.getMessage());
        }
    }

    private String armarClave(String tipo, String letra, Integer ptovta, Integer numero) {
        return tipo.trim().toUpperCase() + "|" + letra.trim().toUpperCase() + "|" + ptovta + "|" + numero;
    }

    private Integer parseEntero(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).intValue();
        try {
            String s = obj.toString().trim();
            if (s.isEmpty()) return null;
            return Integer.parseInt(s);
        } catch (Exception e) {
            return null;
        }
    }

    private Long parseLong(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).longValue();
        try {
            String s = obj.toString().trim();
            if (s.isEmpty()) return null;
            return Long.parseLong(s);
        } catch (Exception e) {
            return null;
        }
    }

    private Double toDouble(Object obj) {
        if (obj == null) return 0.0;
        if (obj instanceof Number) return ((Number) obj).doubleValue();
        try {
            String s = obj.toString().trim();
            if (s.isEmpty()) return 0.0;
            return Double.parseDouble(s);
        } catch (Exception e) {
            return 0.0;
        }
    }

    private BigDecimal toBigDecimal(Object obj) {
        if (obj == null) return BigDecimal.ZERO;
        if (obj instanceof BigDecimal) return (BigDecimal) obj;
        try {
            return new BigDecimal(obj.toString().trim());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private Date toDate(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Date) return (Date) obj;
        if (obj instanceof java.util.Date) return new Date(((java.util.Date) obj).getTime());
        return null;
    }

    private String trimOrNull(Object obj) {
        if (obj == null) return null;
        String s = obj.toString().trim();
        return s.isEmpty() ? null : s;
    }
}
