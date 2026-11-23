package com.debitos.backend.service;

import com.debitos.backend.dto.ComprobanteCandidatoDTO;
import com.debitos.backend.dto.ComprobanteSinAsociarDTO;
import com.debitos.backend.dto.EstadoSincronizacionDTO;

import com.debitos.backend.dto.PrevisualizacionSincronizacionDTO;
import com.debitos.backend.dto.ResumenSincronizacionDTO;
import com.debitos.backend.model.Cabecera;
import com.debitos.backend.repository.CabeceraRepository;

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
public class SincronizacionCtaCteService {

    private static final Logger log = LoggerFactory.getLogger(SincronizacionCtaCteService.class);

    @Autowired(required = false)
    @Qualifier("gestionJdbcTemplate")
    private NamedParameterJdbcTemplate gestionJdbcTemplate;

    @Autowired
    private JdbcTemplate debitosJdbcTemplate;

    @Autowired
    private CabeceraRepository cabeceraRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private static final String SQL_EXTRACCION = """
            SELECT
                c.idcomprobante,
                NULL::bigint AS id_asignacion,
                t.abreviatura AS tipo,
                COALESCE(NULLIF(TRIM(c.letra), ''), 'X') AS letra,
                COALESCE(NULLIF(TRIM(c.num4), ''), '0') AS ptovta_str,
                COALESCE(NULLIF(TRIM(c.num8), ''), NULLIF(TRIM(c.numero), '')) AS numero_str,
                c.fecha,
                COALESCE(c.periodo, c.fecha::date) AS periodo,
                c.importe,
                c.idcomprobante_asociado,
                a.idgrupocomp AS asociadogrupo,
                p.codigo AS codigo_cobertura,
                p.nombre AS cobertura,
                COALESCE(t_asoc.abreviatura, grp.tipo_grp, t_orig.abreviatura) AS tipo_asoc,
                COALESCE(c_asoc.letra, grp.letra_grp, c_orig.letra) AS letra_asoc,
                COALESCE(c_asoc.num4, grp.ptovta_grp, c_orig.num4) AS ptovta_asoc,
                COALESCE(NULLIF(TRIM(c_asoc.num8), ''), NULLIF(TRIM(c_asoc.numero), ''), grp.numero_grp, NULLIF(TRIM(c_orig.num8), ''), NULLIF(TRIM(c_orig.numero), '')) AS numero_asoc,
                COALESCE(c.idcomprobante_asociado, grp.idcomp_grp, c.idcomporigen) AS idcomprobante_asociado_final,
                liq.tiporegistro_liq
            FROM cct_comprobantes c
            JOIN cct_comprobantes_tipo t ON c.idtipocomp = t.idtipocomp
            LEFT JOIN cct_persona p ON c.idpersona = p.idpersona
            LEFT JOIN LATERAL (
                SELECT idgrupocomp
                FROM cct_comprobantes_asignacion
                WHERE idcomprobante = c.idcomprobante
                ORDER BY idgrupocomp DESC
                LIMIT 1
            ) a ON TRUE
            LEFT JOIN cct_comprobantes c_asoc ON c.idcomprobante_asociado = c_asoc.idcomprobante
            LEFT JOIN cct_comprobantes_tipo t_asoc ON c_asoc.idtipocomp = t_asoc.idtipocomp
            LEFT JOIN cct_comprobantes c_orig ON c.idcomporigen = c_orig.idcomprobante
            LEFT JOIN cct_comprobantes_tipo t_orig ON c_orig.idtipocomp = t_orig.idtipocomp
            LEFT JOIN LATERAL (
                SELECT 
                    c2.idcomprobante AS idcomp_grp,
                    t2.abreviatura AS tipo_grp,
                    c2.letra AS letra_grp,
                    c2.num4 AS ptovta_grp,
                    COALESCE(NULLIF(TRIM(c2.num8), ''), NULLIF(TRIM(c2.numero), '')) AS numero_grp
                FROM cct_comprobantes_asignacion a2
                JOIN cct_comprobantes c2 ON a2.idcomprobante = c2.idcomprobante
                JOIN cct_comprobantes_tipo t2 ON c2.idtipocomp = t2.idtipocomp
                WHERE a2.idgrupocomp = a.idgrupocomp
                  AND c2.idcomprobante <> c.idcomprobante
                  AND t2.idtipo = 1
                ORDER BY 
                    CASE WHEN UPPER(TRIM(t2.abreviatura)) IN ('FAC', 'FC', 'FCE', 'FR') THEN 0 ELSE 1 END,
                    c2.fecha DESC
                LIMIT 1
            ) grp ON (c.idcomprobante_asociado IS NULL AND a.idgrupocomp IS NOT NULL)
            LEFT JOIN LATERAL (
                SELECT 
                    CASE 
                        WHEN UPPER(TRIM(cl.ambint)) = 'I' THEN 'Internados'
                        WHEN UPPER(TRIM(cl.ambint)) = 'A' THEN 'Ambulatorios'
                        ELSE NULL
                    END AS tiporegistro_liq
                FROM cob_liquidaciones cl
                WHERE cl.letra = c.letra
                  AND cl.num4 = LPAD(TRIM(c.num4), 4, '0')
                  AND cl.num8 = LPAD(COALESCE(NULLIF(TRIM(c.num8), ''), TRIM(c.numero)), 8, '0')
                ORDER BY cl.idliquidacion DESC
                LIMIT 1
            ) liq ON (UPPER(TRIM(t.abreviatura)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB'))
            WHERE EXTRACT(YEAR FROM COALESCE(c.periodo, c.fecha)) = :anio
              AND COALESCE(c.periodo, c.fecha) <= CURRENT_DATE
              AND t.idtipo = 1
              AND (t.abreviatura IS NULL OR UPPER(TRIM(t.abreviatura)) NOT IN ('RC', 'RCA', 'RCB', 'REC', 'OP'))

            UNION ALL

            SELECT
                c.idcomprobante,
                a.id AS id_asignacion,
                t.abreviatura AS tipo,
                COALESCE(NULLIF(TRIM(c.letra), ''), 'X') AS letra,
                COALESCE(NULLIF(TRIM(c.num4), ''), '0') AS ptovta_str,
                COALESCE(NULLIF(TRIM(c.num8), ''), NULLIF(TRIM(c.numero), '')) AS numero_str,
                c.fecha,
                COALESCE(c.periodo, c.fecha::date) AS periodo,
                a.monto AS importe,
                c.idcomprobante_asociado,
                a.idgrupocomp AS asociadogrupo,
                p.codigo AS codigo_cobertura,
                p.nombre AS cobertura,
                COALESCE(t_asoc.abreviatura, grp.tipo_grp, t_orig.abreviatura) AS tipo_asoc,
                COALESCE(c_asoc.letra, grp.letra_grp, c_orig.letra) AS letra_asoc,
                COALESCE(c_asoc.num4, grp.ptovta_grp, c_orig.num4) AS ptovta_asoc,
                COALESCE(NULLIF(TRIM(c_asoc.num8), ''), NULLIF(TRIM(c_asoc.numero), ''), grp.numero_grp, NULLIF(TRIM(c_orig.num8), ''), NULLIF(TRIM(c_orig.numero), '')) AS numero_asoc,
                COALESCE(grp.idcomp_grp, c.idcomprobante_asociado, c.idcomporigen) AS idcomprobante_asociado_final,
                NULL::text AS tiporegistro_liq
            FROM cct_comprobantes c
            JOIN cct_comprobantes_tipo t ON c.idtipocomp = t.idtipocomp
            JOIN cct_comprobantes_asignacion a ON a.idcomprobante = c.idcomprobante
            LEFT JOIN cct_persona p ON c.idpersona = p.idpersona
            LEFT JOIN cct_comprobantes c_asoc ON c.idcomprobante_asociado = c_asoc.idcomprobante
            LEFT JOIN cct_comprobantes_tipo t_asoc ON c_asoc.idtipocomp = t_asoc.idtipocomp
            LEFT JOIN cct_comprobantes c_orig ON c.idcomporigen = c_orig.idcomprobante
            LEFT JOIN cct_comprobantes_tipo t_orig ON c_orig.idtipocomp = t_orig.idtipocomp
            LEFT JOIN LATERAL (
                SELECT 
                    c2.idcomprobante AS idcomp_grp,
                    t2.abreviatura AS tipo_grp,
                    c2.letra AS letra_grp,
                    c2.num4 AS ptovta_grp,
                    COALESCE(NULLIF(TRIM(c2.num8), ''), NULLIF(TRIM(c2.numero), '')) AS numero_grp
                FROM cct_comprobantes_asignacion a2
                JOIN cct_comprobantes c2 ON a2.idcomprobante = c2.idcomprobante
                JOIN cct_comprobantes_tipo t2 ON c2.idtipocomp = t2.idtipocomp
                WHERE a2.idgrupocomp = a.idgrupocomp
                  AND c2.idcomprobante <> c.idcomprobante
                  AND t2.idtipo = 1
                ORDER BY 
                    CASE WHEN UPPER(TRIM(t2.abreviatura)) IN ('FAC', 'FC', 'FCE', 'FR') THEN 0 ELSE 1 END,
                    c2.fecha DESC
                LIMIT 1
            ) grp ON TRUE
            WHERE EXTRACT(YEAR FROM COALESCE(c.periodo, c.fecha)) = :anio
              AND COALESCE(c.periodo, c.fecha) <= CURRENT_DATE
              AND t.idtipo = 1
              AND UPPER(TRIM(t.abreviatura)) IN ('RC', 'RCA', 'RCB', 'REC', 'OP')

            UNION ALL

            SELECT
                c.idcomprobante,
                NULL::bigint AS id_asignacion,
                t.abreviatura AS tipo,
                COALESCE(NULLIF(TRIM(c.letra), ''), 'X') AS letra,
                COALESCE(NULLIF(TRIM(c.num4), ''), '0') AS ptovta_str,
                COALESCE(NULLIF(TRIM(c.num8), ''), NULLIF(TRIM(c.numero), '')) AS numero_str,
                c.fecha,
                COALESCE(c.periodo, c.fecha::date) AS periodo,
                c.importe,
                c.idcomprobante_asociado,
                NULL::bigint AS asociadogrupo,
                p.codigo AS codigo_cobertura,
                p.nombre AS cobertura,
                NULL::varchar AS tipo_asoc,
                NULL::varchar AS letra_asoc,
                NULL::varchar AS ptovta_asoc,
                NULL::varchar AS numero_asoc,
                NULL::bigint AS idcomprobante_asociado_final,
                NULL::text AS tiporegistro_liq
            FROM cct_comprobantes c
            JOIN cct_comprobantes_tipo t ON c.idtipocomp = t.idtipocomp
            LEFT JOIN cct_persona p ON c.idpersona = p.idpersona
            WHERE EXTRACT(YEAR FROM COALESCE(c.periodo, c.fecha)) = :anio
              AND COALESCE(c.periodo, c.fecha) <= CURRENT_DATE
              AND t.idtipo = 1
              AND UPPER(TRIM(t.abreviatura)) IN ('RC', 'RCA', 'RCB', 'REC', 'OP')
              AND NOT EXISTS (
                  SELECT 1 FROM cct_comprobantes_asignacion a WHERE a.idcomprobante = c.idcomprobante
              )
            ORDER BY fecha ASC, idcomprobante ASC, id_asignacion ASC NULLS FIRST
            """;

    /**
     * Obtiene el estado actual de sincronización, salud de conexión a Gestión y
     * métricas operativas.
     */
    public EstadoSincronizacionDTO obtenerEstado(Integer anioParam) {
        int anio = (anioParam != null && anioParam > 2000) ? anioParam : LocalDate.now().getYear();
        EstadoSincronizacionDTO estado = new EstadoSincronizacionDTO();
        estado.setAnio(anio);

        // 1. Health check y conexión a Gestión
        if (gestionJdbcTemplate == null) {
            estado.setConexionOk(false);
            estado.setMensajeConexion("El DataSource de Gestión no está inicializado.");
            cargarMetricasLocales(estado, anio);
            return estado;
        }

        try {
            gestionJdbcTemplate.getJdbcTemplate().queryForObject("SELECT 1", Integer.class);
            estado.setConexionOk(true);
            estado.setMensajeConexion("Conectado a base de datos");
        } catch (Exception e) {
            Throwable root = e;
            while (root.getCause() != null && root.getCause() != root) {
                root = root.getCause();
            }
            String detalle = root.getMessage() != null ? root.getMessage() : e.getMessage();
            log.warn("Fallo de conexión a base de datos Gestión: {}", detalle);
            estado.setConexionOk(false);
            estado.setMensajeConexion("Error de conexión a Gestión: " + detalle);
            cargarMetricasLocales(estado, anio);
            return estado;
        }

        // 2. Conteo de comprobantes e imputaciones en Gestión para el año
        try {
            Set<String> existentesEnDebitos = obtenerClavesExistentesEnDebitos(anio);

            List<Map<String, Object>> filasGestion = gestionJdbcTemplate.queryForList(
                    SQL_EXTRACCION,
                    new MapSqlParameterSource("anio", anio));

            estado.setTotalGestion((long) filasGestion.size());

            long pendientes = 0;
            for (Map<String, Object> fila : filasGestion) {
                String tipo = trimOrNull(fila.get("tipo"));
                String letra = trimOrNull(fila.get("letra"));
                Integer ptovta = parseEntero(fila.get("ptovta_str"));
                Integer numero = parseEntero(fila.get("numero_str"));
                Integer idGrupoComp = parseEntero(fila.get("asociadogrupo"));
                Long asociadogrupo = idGrupoComp != null ? idGrupoComp.longValue() : null;
                Long idAsignacion = fila.get("id_asignacion") != null ? ((Number) fila.get("id_asignacion")).longValue() : null;

                if (tipo != null && letra != null && ptovta != null && numero != null) {
                    if (!yaExisteEnDebitos(existentesEnDebitos, tipo, letra, ptovta, numero, asociadogrupo, idAsignacion)) {
                        pendientes++;
                    }
                }
            }
            estado.setPendientes(pendientes);

        } catch (Exception e) {
            log.error("Error al consultar comprobantes en Gestión: {}", e.getMessage(), e);
            estado.setMensajeConexion("Error consultando Gestión: " + e.getMessage());
        }

        // 5. Cargar métricas locales de Débitos
        cargarMetricasLocales(estado, anio);

        return estado;
    }

    /**
     * Previsualiza los comprobantes que van a ser importados, calculando métricas
     * y retornando una muestra representativa de comprobantes candidatos.
     */
    /**
     * Previsualiza los comprobantes que van a ser importados, calculando métricas
     * y retornando una muestra representativa de comprobantes candidatos.
     */
    public PrevisualizacionSincronizacionDTO previsualizar(Integer anioParam, int limite, String tipoDoc) {
        int anio = (anioParam != null && anioParam > 2000) ? anioParam : LocalDate.now().getYear();
        int maxItems = (limite > 0 && limite <= 1000) ? limite : 300;

        PrevisualizacionSincronizacionDTO prev = new PrevisualizacionSincronizacionDTO();
        prev.setAnio(anio);

        if (gestionJdbcTemplate == null) {
            return prev;
        }

        try {
            Set<String> existentesEnDebitos = obtenerClavesExistentesEnDebitos(anio);

            List<Map<String, Object>> filas = gestionJdbcTemplate.queryForList(
                    SQL_EXTRACCION,
                    new MapSqlParameterSource("anio", anio));

            long totalPendientes = 0;
            BigDecimal sumaDebe = BigDecimal.ZERO;
            BigDecimal sumaHaber = BigDecimal.ZERO;
            Map<String, Long> desglose = new LinkedHashMap<>();
            List<ComprobanteCandidatoDTO> todosCandidatos = new ArrayList<>();

            for (Map<String, Object> f : filas) {
                String tipo = trimOrNull(f.get("tipo"));
                String letra = trimOrNull(f.get("letra"));
                Integer ptovta = parseEntero(f.get("ptovta_str"));
                Integer numero = parseEntero(f.get("numero_str"));
                Integer idGrupoComp = parseEntero(f.get("asociadogrupo"));
                Long asociadogrupo = idGrupoComp != null ? idGrupoComp.longValue() : null;
                Long idAsignacion = f.get("id_asignacion") != null ? ((Number) f.get("id_asignacion")).longValue() : null;

                if (tipo == null || letra == null || ptovta == null || numero == null) {
                    continue;
                }

                if (yaExisteEnDebitos(existentesEnDebitos, tipo, letra, ptovta, numero, asociadogrupo, idAsignacion)) {
                    continue;
                }

                totalPendientes++;
                String tipoKey = tipo.toUpperCase();
                desglose.put(tipoKey, desglose.getOrDefault(tipoKey, 0L) + 1L);

                BigDecimal importe = f.get("importe") != null ? new BigDecimal(f.get("importe").toString()) : BigDecimal.ZERO;
                BigDecimal debe = BigDecimal.ZERO;
                BigDecimal haber = BigDecimal.ZERO;

                String t = tipo.trim().toUpperCase();
                if ("FC".equals(t) || "ND".equals(t)) {
                    debe = importe;
                } else if ("NC".equals(t) || "RC".equals(t) || "RCA".equals(t) || "RCB".equals(t) || "OP".equals(t) || "REC".equals(t)) {
                    haber = importe;
                } else {
                    if (t.startsWith("NC") || t.startsWith("RC")) {
                        haber = importe;
                    } else {
                        debe = importe;
                    }
                }

                sumaDebe = sumaDebe.add(debe);
                sumaHaber = sumaHaber.add(haber);

                ComprobanteCandidatoDTO c = new ComprobanteCandidatoDTO();
                c.setTipo(tipo);
                c.setLetra(letra);
                c.setPtovta(ptovta);
                c.setNumero(numero);
                c.setIdAsignacion(idAsignacion);
                c.setAsociadogrupo(asociadogrupo);

                if ("RC".equalsIgnoreCase(tipo) || "REC".equalsIgnoreCase(tipo) || "RCA".equalsIgnoreCase(tipo) || "RCB".equalsIgnoreCase(tipo) || "OP".equalsIgnoreCase(tipo)) {
                    c.setComprobante(String.valueOf(numero));
                } else {
                    c.setComprobante(String.format("%s %s%04d-%08d", tipo.toUpperCase(), letra.toUpperCase(), ptovta, numero));
                }

                Date sqlFecha = (Date) f.get("fecha");
                c.setFecha(sqlFecha != null ? sqlFecha.toLocalDate() : null);

                Date sqlPeriodo = (Date) f.get("periodo");
                c.setPeriodo(sqlPeriodo != null ? sqlPeriodo.toLocalDate() : null);

                c.setDebe(debe);
                c.setHaber(haber);
                c.setCodigoCobertura(trimOrNull(f.get("codigo_cobertura")));
                c.setCobertura(trimOrNull(f.get("cobertura")));
                c.setTiporegistro(trimOrNull(f.get("tiporegistro_liq")));

                // Regla de Factura: comprobante_asociado debe contener el comprobante propio
                if (Cabecera.esFactura(tipo)) {
                    c.setComprobanteAsociado(c.getComprobante());
                } else {
                    String tipoAsoc = trimOrNull(f.get("tipo_asoc"));
                    String letraAsoc = trimOrNull(f.get("letra_asoc"));
                    Integer ptovtaAsoc = parseEntero(f.get("ptovta_asoc"));
                    Integer numeroAsoc = parseEntero(f.get("numero_asoc"));
                    if (tipoAsoc != null && letraAsoc != null && ptovtaAsoc != null && numeroAsoc != null) {
                        c.setComprobanteAsociado(String.format("%s %s%04d-%08d", tipoAsoc.toUpperCase(), letraAsoc.toUpperCase(), ptovtaAsoc, numeroAsoc));
                    }
                }

                todosCandidatos.add(c);
            }

            prev.setTotalPendientes(totalPendientes);
            prev.setTotalDebe(sumaDebe);
            prev.setTotalHaber(sumaHaber);
            prev.setDesglosePorTipo(desglose);

            // Muestreo: específico por tipo o balanceado estratificado
            boolean filtrarPorTipo = tipoDoc != null && !tipoDoc.isBlank() && !"TODOS".equalsIgnoreCase(tipoDoc.trim());
            if (filtrarPorTipo) {
                String filtroUpper = tipoDoc.trim().toUpperCase();
                List<ComprobanteCandidatoDTO> muestraTipo = todosCandidatos.stream()
                        .filter(c -> filtroUpper.equalsIgnoreCase(c.getTipo()))
                        .limit(maxItems)
                        .toList();
                prev.getComprobantes().addAll(muestraTipo);
            } else {
                Map<String, Integer> cuotaPorTipo = new HashMap<>();
                List<ComprobanteCandidatoDTO> muestraEstratificada = new ArrayList<>();
                List<ComprobanteCandidatoDTO> excedentes = new ArrayList<>();

                for (ComprobanteCandidatoDTO c : todosCandidatos) {
                    String tUpper = c.getTipo().toUpperCase();
                    int cant = cuotaPorTipo.getOrDefault(tUpper, 0);
                    if (cant < 40 && muestraEstratificada.size() < maxItems) {
                        muestraEstratificada.add(c);
                        cuotaPorTipo.put(tUpper, cant + 1);
                    } else {
                        excedentes.add(c);
                    }
                }
                for (ComprobanteCandidatoDTO exc : excedentes) {
                    if (muestraEstratificada.size() >= maxItems) break;
                    muestraEstratificada.add(exc);
                }
                prev.getComprobantes().addAll(muestraEstratificada);
            }

        } catch (Exception e) {
            log.error("Error al previsualizar sincronización: {}", e.getMessage(), e);
        }

        return prev;
    }

    public PrevisualizacionSincronizacionDTO previsualizar(Integer anioParam, int limite) {
        return previsualizar(anioParam, limite, null);
    }

    /**
     * Obtiene la lista completa de comprobantes candidatos a importar (sin límite de muestreo),
     * para su exportación íntegra a Excel.
     */
    public List<ComprobanteCandidatoDTO> obtenerTodosCandidatos(Integer anioParam, String tipoDoc) {
        int anio = (anioParam != null && anioParam > 2000) ? anioParam : LocalDate.now().getYear();
        List<ComprobanteCandidatoDTO> lista = new ArrayList<>();

        if (gestionJdbcTemplate == null) {
            return lista;
        }

        try {
            Set<String> existentesEnDebitos = obtenerClavesExistentesEnDebitos(anio);

            List<Map<String, Object>> filas = gestionJdbcTemplate.queryForList(
                    SQL_EXTRACCION,
                    new MapSqlParameterSource("anio", anio));

            boolean filtrarPorTipo = tipoDoc != null && !tipoDoc.isBlank() && !"TODOS".equalsIgnoreCase(tipoDoc.trim());
            String filtroUpper = filtrarPorTipo ? tipoDoc.trim().toUpperCase() : null;

            for (Map<String, Object> f : filas) {
                String tipo = trimOrNull(f.get("tipo"));
                String letra = trimOrNull(f.get("letra"));
                Integer ptovta = parseEntero(f.get("ptovta_str"));
                Integer numero = parseEntero(f.get("numero_str"));
                Integer idGrupoComp = parseEntero(f.get("asociadogrupo"));
                Long asociadogrupo = idGrupoComp != null ? idGrupoComp.longValue() : null;
                Long idAsignacion = f.get("id_asignacion") != null ? ((Number) f.get("id_asignacion")).longValue() : null;

                if (tipo == null || letra == null || ptovta == null || numero == null) {
                    continue;
                }

                if (filtroUpper != null && !filtroUpper.equalsIgnoreCase(tipo)) {
                    continue;
                }

                if (yaExisteEnDebitos(existentesEnDebitos, tipo, letra, ptovta, numero, asociadogrupo, idAsignacion)) {
                    continue;
                }

                BigDecimal importe = f.get("importe") != null ? new BigDecimal(f.get("importe").toString()) : BigDecimal.ZERO;
                BigDecimal debe = BigDecimal.ZERO;
                BigDecimal haber = BigDecimal.ZERO;

                String t = tipo.trim().toUpperCase();
                if ("FC".equals(t) || "ND".equals(t)) {
                    debe = importe;
                } else if ("NC".equals(t) || "RC".equals(t) || "RCA".equals(t) || "RCB".equals(t) || "OP".equals(t) || "REC".equals(t)) {
                    haber = importe;
                } else {
                    if (t.startsWith("NC") || t.startsWith("RC")) {
                        haber = importe;
                    } else {
                        debe = importe;
                    }
                }

                ComprobanteCandidatoDTO c = new ComprobanteCandidatoDTO();
                c.setTipo(tipo);
                c.setLetra(letra);
                c.setPtovta(ptovta);
                c.setNumero(numero);
                c.setIdAsignacion(idAsignacion);
                c.setAsociadogrupo(asociadogrupo);

                if ("RC".equalsIgnoreCase(tipo) || "REC".equalsIgnoreCase(tipo) || "RCA".equalsIgnoreCase(tipo) || "RCB".equalsIgnoreCase(tipo) || "OP".equalsIgnoreCase(tipo)) {
                    c.setComprobante(String.valueOf(numero));
                } else {
                    c.setComprobante(String.format("%s %s%04d-%08d", tipo.toUpperCase(), letra.toUpperCase(), ptovta, numero));
                }

                Date sqlFecha = (Date) f.get("fecha");
                c.setFecha(sqlFecha != null ? sqlFecha.toLocalDate() : null);

                Date sqlPeriodo = (Date) f.get("periodo");
                c.setPeriodo(sqlPeriodo != null ? sqlPeriodo.toLocalDate() : null);

                c.setDebe(debe);
                c.setHaber(haber);
                c.setCodigoCobertura(trimOrNull(f.get("codigo_cobertura")));
                c.setCobertura(trimOrNull(f.get("cobertura")));
                c.setTiporegistro(trimOrNull(f.get("tiporegistro_liq")));

                if (Cabecera.esFactura(tipo)) {
                    c.setComprobanteAsociado(c.getComprobante());
                } else {
                    String tipoAsoc = trimOrNull(f.get("tipo_asoc"));
                    String letraAsoc = trimOrNull(f.get("letra_asoc"));
                    Integer ptovtaAsoc = parseEntero(f.get("ptovta_asoc"));
                    Integer numeroAsoc = parseEntero(f.get("numero_asoc"));
                    if (tipoAsoc != null && letraAsoc != null && ptovtaAsoc != null && numeroAsoc != null) {
                        c.setComprobanteAsociado(String.format("%s %s%04d-%08d", tipoAsoc.toUpperCase(), letraAsoc.toUpperCase(), ptovtaAsoc, numeroAsoc));
                    }
                }

                lista.add(c);
            }
        } catch (Exception e) {
            log.error("Error al obtener lista completa de candidatos a exportar: {}", e.getMessage(), e);
        }

        return lista;
    }

    /**
     * Obtiene la lista completa de comprobantes que no están asociados a un comprobante padre
     * (asociado IS NULL o 0) y que no son facturas.
     */
    public List<ComprobanteSinAsociarDTO> obtenerComprobantesSinAsociar(String filtroTipo) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                c.id, c.tipo, c.letra, c.ptovta, c.numero, c.comprobante, c.fecha, c.periodo,
                c.debe, c.haber, c.codigo_cobertura, c.cobertura, c.origen,
                c.comprobante_asociado, c.asociadogrupo
            FROM cabecera c
            WHERE (c.asociado IS NULL OR c.asociado = 0)
              AND UPPER(TRIM(c.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB', 'RC', 'RCA', 'RCB')
              AND c.id NOT IN (SELECT ca.idcabecera FROM comprobantes_anulados ca WHERE ca.idcabecera IS NOT NULL)
        """);

        List<Object> params = new ArrayList<>();
        if (filtroTipo != null && !filtroTipo.trim().isEmpty() && !"TODOS".equalsIgnoreCase(filtroTipo.trim())) {
            String[] tipos = filtroTipo.split(",");
            List<String> listaTipos = new ArrayList<>();
            for (String t : tipos) {
                if (!t.trim().isEmpty()) {
                    listaTipos.add(t.trim().toUpperCase());
                }
            }
            if (!listaTipos.isEmpty()) {
                sql.append(" AND UPPER(TRIM(c.tipo)) IN (");
                for (int i = 0; i < listaTipos.size(); i++) {
                    if (i > 0) sql.append(", ");
                    sql.append("?");
                    params.add(listaTipos.get(i));
                }
                sql.append(")");
            }
        }

        sql.append(" ORDER BY c.fecha DESC NULLS LAST, c.id DESC");

        List<ComprobanteSinAsociarDTO> resultado = new ArrayList<>();
        debitosJdbcTemplate.query(sql.toString(), rs -> {
            ComprobanteSinAsociarDTO dto = new ComprobanteSinAsociarDTO();
            dto.setId(rs.getLong("id"));
            dto.setTipo(trimOrNull(rs.getString("tipo")));
            dto.setLetra(trimOrNull(rs.getString("letra")));
            dto.setPtovta(rs.getInt("ptovta"));
            dto.setNumero(rs.getInt("numero"));

            String comp = rs.getString("comprobante");
            if (comp == null || comp.trim().isEmpty()) {
                String t = dto.getTipo() != null ? dto.getTipo().toUpperCase() : "";
                String l = dto.getLetra() != null ? dto.getLetra().toUpperCase() : "";
                if ("RC".equalsIgnoreCase(t)) {
                    comp = String.valueOf(dto.getNumero());
                } else {
                    comp = String.format("%s %s%04d-%08d", t, l, dto.getPtovta() != null ? dto.getPtovta() : 0, dto.getNumero() != null ? dto.getNumero() : 0);
                }
            }
            dto.setComprobante(comp);

            java.sql.Date f = rs.getDate("fecha");
            dto.setFecha(f != null ? f.toLocalDate() : null);

            java.sql.Date p = rs.getDate("periodo");
            dto.setPeriodo(p != null ? p.toLocalDate() : null);

            BigDecimal debe = rs.getBigDecimal("debe");
            BigDecimal haber = rs.getBigDecimal("haber");
            dto.setDebe(debe != null ? debe : BigDecimal.ZERO);
            dto.setHaber(haber != null ? haber : BigDecimal.ZERO);

            if (dto.getHaber().compareTo(BigDecimal.ZERO) > 0) {
                dto.setImporte(dto.getHaber());
            } else {
                dto.setImporte(dto.getDebe());
            }

            dto.setCodigoCobertura(trimOrNull(rs.getString("codigo_cobertura")));
            dto.setCobertura(trimOrNull(rs.getString("cobertura")));
            dto.setOrigen(trimOrNull(rs.getString("origen")));
            dto.setComprobanteAsociado(trimOrNull(rs.getString("comprobante_asociado")));

            long grupo = rs.getLong("asociadogrupo");
            dto.setAsociadogrupo(rs.wasNull() ? null : grupo);

            resultado.add(dto);
        }, params.toArray());

        return resultado;
    }

    /**
     * Ejecuta el proceso de sincronización completa del año especificado.
     * La inserción de nuevos comprobantes y la reconciliación retrospectiva se ejecutan
     * en transacciones aisladas para garantizar que cualquier contingencia en comprobantes
     * históricos nunca revierta la importación de nuevas cabeceras.
     */
    public ResumenSincronizacionDTO ejecutarSincronizacion(String usuario, Integer anioParam) {
        long inicioMs = System.currentTimeMillis();
        int anio = (anioParam != null && anioParam > 2000) ? anioParam : LocalDate.now().getYear();

        ResumenSincronizacionDTO resumen = new ResumenSincronizacionDTO();
        resumen.setAnioProcesado(anio);

        if (gestionJdbcTemplate == null) {
            resumen.setExito(false);
            resumen.setMensaje("No se pudo iniciar: DataSource de Gestión no disponible.");
            return resumen;
        }

        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        try {
            // 1. Obtener claves ya existentes en Débitos
            Set<String> existentesEnDebitos = obtenerClavesExistentesEnDebitos(anio);

            List<Map<String, Object>> filas = gestionJdbcTemplate.queryForList(
                    SQL_EXTRACCION,
                    new MapSqlParameterSource("anio", anio));

            resumen.setTotalLeidosGestion(filas.size());

            // 3. Fase 1: Separar nuevos e insertarlos
            List<Cabecera> nuevasCabeceras = new ArrayList<>();
            Map<String, Cabecera> mapaGestionACabecera = new HashMap<>();
            Map<String, DatosComprobantePadre> mapaComprobantesAsociados = new HashMap<>();

            int omitidos = 0;
            List<Object[]> periodosAActualizar = new ArrayList<>();
            List<Object[]> vinculosAActualizar = new ArrayList<>();
            List<Object[]> vinculosRecibosAActualizar = new ArrayList<>();
            List<Object[]> recibosPreliminaresAEliminar = new ArrayList<>();

            for (Map<String, Object> f : filas) {
                Integer idComprobanteGestion = parseEntero(f.get("idcomprobante"));
                Long idAsignacion = f.get("id_asignacion") != null ? ((Number) f.get("id_asignacion")).longValue() : null;
                Integer idGrupoComp = parseEntero(f.get("asociadogrupo"));
                Long asociadogrupo = idGrupoComp != null ? idGrupoComp.longValue() : null;

                String tipo = trimOrNull(f.get("tipo"));
                String letra = trimOrNull(f.get("letra"));
                Integer ptovta = parseEntero(f.get("ptovta_str"));
                Integer numero = parseEntero(f.get("numero_str"));

                if (tipo == null || letra == null || ptovta == null || numero == null) {
                    continue;
                }

                String clave = armarClave(tipo, letra, ptovta, numero, asociadogrupo, idAsignacion);
                if (yaExisteEnDebitos(existentesEnDebitos, tipo, letra, ptovta, numero, asociadogrupo, idAsignacion)) {
                    omitidos++;
                    Date sqlPeriodo = (Date) f.get("periodo");
                    if (sqlPeriodo != null) {
                        periodosAActualizar.add(new Object[] {
                                sqlPeriodo.toLocalDate(), sqlPeriodo.toLocalDate(), tipo.toUpperCase(), letra.toUpperCase(), ptovta, numero
                        });
                    }
                    if (!Cabecera.esFactura(tipo)) {
                        String tipoAsoc = trimOrNull(f.get("tipo_asoc"));
                        String letraAsoc = trimOrNull(f.get("letra_asoc"));
                        Integer ptovtaAsoc = parseEntero(f.get("ptovta_asoc"));
                        Integer numeroAsoc = parseEntero(f.get("numero_asoc"));
                        if (tipoAsoc != null && letraAsoc != null && ptovtaAsoc != null && numeroAsoc != null) {
                            String compPadre = String.format("%s %s%04d-%08d", tipoAsoc.toUpperCase(), letraAsoc.toUpperCase(), ptovtaAsoc, numeroAsoc);
                            if (Cabecera.esRecibo(tipo) && asociadogrupo != null) {
                                vinculosRecibosAActualizar.add(new Object[] {
                                        compPadre, compPadre, tipo.toUpperCase(), letra.toUpperCase(), ptovta, numero, asociadogrupo
                                });
                            } else {
                                vinculosAActualizar.add(new Object[] {
                                        compPadre, compPadre, tipo.toUpperCase(), letra.toUpperCase(), ptovta, numero
                                });
                            }
                        }
                    }
                    continue;
                }

                // Si es un recibo con grupo/asignación, registrar para eliminar cualquier registro preliminar huérfano "sin imputar"
                if (Cabecera.esRecibo(tipo) && (asociadogrupo != null || idAsignacion != null)) {
                    recibosPreliminaresAEliminar.add(new Object[] { tipo.toUpperCase(), letra.toUpperCase(), ptovta, numero });
                }

                // Es nuevo: mapeamos los datos
                Cabecera cab = new Cabecera();
                cab.setTipo(tipo);
                cab.setLetra(letra);
                cab.setPtovta(ptovta);
                cab.setNumero(numero);
                cab.setOrigen("APP_AUTO_ADMIN");
                cab.setIdEstado(1);
                cab.setIdAsignacion(idAsignacion);
                cab.setAsociadogrupo(asociadogrupo);

                Date sqlFecha = (Date) f.get("fecha");
                cab.setFecha(sqlFecha != null ? sqlFecha.toLocalDate() : null);

                Date sqlPeriodo = (Date) f.get("periodo");
                cab.setPeriodo(sqlPeriodo != null ? sqlPeriodo.toLocalDate() : null);

                // Reglas contables: FC y ND -> DEBE, NC y RC -> HABER
                BigDecimal importe = f.get("importe") != null ? new BigDecimal(f.get("importe").toString())
                        : BigDecimal.ZERO;
                asignarDebeHaber(cab, tipo, importe);

                // Cobertura
                cab.setCodigoCobertura(trimOrNull(f.get("codigo_cobertura")));
                cab.setCobertura(trimOrNull(f.get("cobertura")));

                // Tipo de registro (Ambulatorios / Internados)
                String tipoRegistro = trimOrNull(f.get("tiporegistro_liq"));
                if (tipoRegistro == null && Cabecera.esFactura(tipo)) {
                    tipoRegistro = "Ambulatorios";
                }
                cab.setTiporegistro(tipoRegistro);

                // Si es factura, comprobante_asociado debe contener el comprobante propio
                if (Cabecera.esFactura(tipo)) {
                    String compCalculado = String.format("%s %s%04d-%08d", tipo.toUpperCase(), letra.toUpperCase(), ptovta, numero);
                    cab.setComprobante(compCalculado);
                    cab.setComprobanteAsociado(compCalculado);
                } else if ("RC".equalsIgnoreCase(tipo) || "REC".equalsIgnoreCase(tipo) || "RCA".equalsIgnoreCase(tipo) || "RCB".equalsIgnoreCase(tipo) || "OP".equalsIgnoreCase(tipo)) {
                    cab.setComprobante(String.valueOf(numero));
                } else {
                    String compCalculado = String.format("%s %s%04d-%08d", tipo.toUpperCase(), letra.toUpperCase(), ptovta, numero);
                    cab.setComprobante(compCalculado);
                }

                // Pre-asignar comprobante_asociado si viene en la consulta de Gestión
                if (!Cabecera.esFactura(tipo)) {
                    String tipoAsoc = trimOrNull(f.get("tipo_asoc"));
                    String letraAsoc = trimOrNull(f.get("letra_asoc"));
                    Integer ptovtaAsoc = parseEntero(f.get("ptovta_asoc"));
                    Integer numeroAsoc = parseEntero(f.get("numero_asoc"));
                    if (tipoAsoc != null && letraAsoc != null && ptovtaAsoc != null && numeroAsoc != null) {
                        String compPadre = String.format("%s %s%04d-%08d", tipoAsoc.toUpperCase(), letraAsoc.toUpperCase(), ptovtaAsoc, numeroAsoc);
                        cab.setComprobanteAsociado(compPadre);
                    }
                }

                nuevasCabeceras.add(cab);
                existentesEnDebitos.add(clave);

                if (idComprobanteGestion != null) {
                    String keyComp = idComprobanteGestion + "_" + (idAsignacion != null ? idAsignacion : 0);
                    mapaGestionACabecera.put(keyComp, cab);

                    // Guardar datos del asociado para documentos no-factura
                    if (!Cabecera.esFactura(tipo)) {
                        Integer idCompAsoc = parseEntero(f.get("idcomprobante_asociado_final"));
                        if (idCompAsoc != null) {
                            String tipoAsoc = trimOrNull(f.get("tipo_asoc"));
                            String letraAsoc = trimOrNull(f.get("letra_asoc"));
                            Integer ptovtaAsoc = parseEntero(f.get("ptovta_asoc"));
                            Integer numeroAsoc = parseEntero(f.get("numero_asoc"));

                            mapaComprobantesAsociados.put(keyComp,
                                    new DatosComprobantePadre(idCompAsoc, tipoAsoc, letraAsoc, ptovtaAsoc, numeroAsoc));
                        }
                    }
                }
            }

            resumen.setExistentesOmitidos(omitidos);

            // Transacción 1: Persistencia atómica e independiente de nuevas cabeceras y vínculos de la tanda
            final int[] contadorAsociados = new int[] { 0 };
            txTemplate.executeWithoutResult(status -> {
                // Eliminar preliminares huérfanos sin imputar
                if (!recibosPreliminaresAEliminar.isEmpty()) {
                    for (Object[] r : recibosPreliminaresAEliminar) {
                        debitosJdbcTemplate.update("""
                            DELETE FROM cabecera
                            WHERE UPPER(TRIM(tipo)) = ?
                              AND UPPER(TRIM(letra)) = ?
                              AND ptovta = ?
                              AND numero = ?
                              AND (asociadogrupo IS NULL OR asociadogrupo = 0)
                              AND (id_asignacion IS NULL OR id_asignacion = 0)
                        """, r[0], r[1], r[2], r[3]);
                    }
                }

                // Actualizar 'periodo' en cabecera para comprobantes que ya existían pero difieren de Gestión
                if (!periodosAActualizar.isEmpty()) {
                    int[] actualizados = debitosJdbcTemplate.batchUpdate("""
                        UPDATE cabecera
                        SET periodo = ?
                        WHERE (periodo IS NULL OR periodo <> ?)
                          AND UPPER(TRIM(tipo)) = ?
                          AND UPPER(TRIM(letra)) = ?
                          AND ptovta = ?
                          AND numero = ?
                    """, periodosAActualizar);
                    int totalPeriodosCompletados = 0;
                    for (int count : actualizados) {
                        if (count > 0) totalPeriodosCompletados += count;
                    }
                    if (totalPeriodosCompletados > 0) {
                        log.info("Sincronización: se corrigió el período contable en {} comprobantes existentes.", totalPeriodosCompletados);
                    }
                }

                // Actualizar 'comprobante_asociado' en cabecera para comprobantes existentes que difieren de Gestión
                if (!vinculosAActualizar.isEmpty()) {
                    int[] actualizadosV = debitosJdbcTemplate.batchUpdate("""
                        UPDATE cabecera
                        SET comprobante_asociado = ?
                        WHERE (comprobante_asociado IS NULL OR comprobante_asociado <> ?)
                          AND UPPER(TRIM(tipo)) = ?
                          AND UPPER(TRIM(letra)) = ?
                          AND ptovta = ?
                          AND numero = ?
                    """, vinculosAActualizar);
                    int totalVinculosActualizados = 0;
                    for (int count : actualizadosV) {
                        if (count > 0) totalVinculosActualizados += count;
                    }
                    if (totalVinculosActualizados > 0) {
                        log.info("Sincronización: se actualizó el comprobante asociado en {} comprobantes existentes.", totalVinculosActualizados);
                    }
                }

                // Actualizar 'comprobante_asociado' en recibos existentes diferenciando por asociadogrupo
                if (!vinculosRecibosAActualizar.isEmpty()) {
                    int[] actualizadosVr = debitosJdbcTemplate.batchUpdate("""
                        UPDATE cabecera
                        SET comprobante_asociado = ?
                        WHERE (comprobante_asociado IS NULL OR comprobante_asociado <> ?)
                          AND UPPER(TRIM(tipo)) = ?
                          AND UPPER(TRIM(letra)) = ?
                          AND ptovta = ?
                          AND numero = ?
                          AND asociadogrupo = ?
                    """, vinculosRecibosAActualizar);
                    int totalRecibosActualizados = 0;
                    for (int count : actualizadosVr) {
                        if (count > 0) totalRecibosActualizados += count;
                    }
                    if (totalRecibosActualizados > 0) {
                        log.info("Sincronización: se actualizó el comprobante asociado en {} imputaciones de recibos existentes.", totalRecibosActualizados);
                    }
                }

                // Inserción masiva en lote optimizada (aprovecha reWriteBatchedInserts=true)
                if (!nuevasCabeceras.isEmpty()) {
                    String sqlInsertCab = """
                        INSERT INTO cabecera (
                            tipo, letra, ptovta, numero, origen, id_estado, id_asignacion,
                            asociadogrupo, fecha, periodo, debe, haber, codigo_cobertura,
                            cobertura, comprobante, comprobante_asociado, tiporegistro
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """;
                    int batchSize = 2000;
                    for (int i = 0; i < nuevasCabeceras.size(); i += batchSize) {
                        List<Cabecera> sublista = nuevasCabeceras.subList(i, Math.min(i + batchSize, nuevasCabeceras.size()));
                        List<Object[]> batchParams = new ArrayList<>(sublista.size());
                        for (Cabecera c : sublista) {
                            batchParams.add(new Object[] {
                                c.getTipo(),
                                c.getLetra(),
                                c.getPtovta(),
                                c.getNumero(),
                                c.getOrigen() != null ? c.getOrigen() : "APP_AUTO_ADMIN",
                                c.getIdEstado() != null ? c.getIdEstado() : 1,
                                c.getIdAsignacion(),
                                c.getAsociadogrupo(),
                                c.getFecha() != null ? Date.valueOf(c.getFecha()) : null,
                                c.getPeriodo() != null ? Date.valueOf(c.getPeriodo()) : null,
                                c.getDebe() != null ? c.getDebe() : BigDecimal.ZERO,
                                c.getHaber() != null ? c.getHaber() : BigDecimal.ZERO,
                                c.getCodigoCobertura(),
                                c.getCobertura(),
                                c.getComprobante(),
                                c.getComprobanteAsociado(),
                                c.getTiporegistro()
                            });
                        }
                        debitosJdbcTemplate.batchUpdate(sqlInsertCab, batchParams);
                    }
                }

                // Paso 4.1: En facturas, auto-asociarse a sí mismas (asociado = id) en un solo UPDATE en lote (acotado al año si aplica)
                StringBuilder sqlFacturas = new StringBuilder("""
                    UPDATE cabecera
                    SET asociado = id,
                        comprobante_asociado = COALESCE(comprobante_asociado, comprobante)
                    WHERE UPPER(TRIM(tipo)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
                      AND (asociado IS NULL OR asociado <> id)
                """);
                int facturasAutoAsociadas;
                if (anio > 2000) {
                    sqlFacturas.append("""
                      AND (
                          (periodo >= ? AND periodo <= ?)
                          OR (periodo IS NULL AND fecha >= ? AND fecha <= ?)
                      )
                    """);
                    Date fechaDesde = Date.valueOf(LocalDate.of(anio, 1, 1));
                    Date fechaHasta = Date.valueOf(LocalDate.of(anio, 12, 31));
                    facturasAutoAsociadas = debitosJdbcTemplate.update(sqlFacturas.toString(), fechaDesde, fechaHasta, fechaDesde, fechaHasta);
                } else {
                    facturasAutoAsociadas = debitosJdbcTemplate.update(sqlFacturas.toString());
                }
                contadorAsociados[0] += facturasAutoAsociadas;

                // Paso 4.2: En documentos hijos con comprobante_asociado textual, vincular al ID del padre y heredar asociadogrupo
                StringBuilder sqlHijos = new StringBuilder("""
                    UPDATE cabecera c_hijo
                    SET asociado = c_padre.id,
                        asociadogrupo = COALESCE(c_padre.asociadogrupo, c_hijo.asociadogrupo)
                    FROM cabecera c_padre
                    WHERE c_hijo.comprobante_asociado IS NOT NULL
                      AND UPPER(TRIM(c_hijo.tipo)) NOT IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
                      AND (
                          UPPER(TRIM(COALESCE(c_padre.comprobante, c_padre.comprobante_asociado))) = UPPER(TRIM(c_hijo.comprobante_asociado))
                          OR REPLACE(REPLACE(UPPER(TRIM(COALESCE(c_padre.comprobante, UPPER(TRIM(c_padre.tipo)) || UPPER(TRIM(c_padre.letra)) || LPAD(c_padre.ptovta::text, 4, '0') || LPAD(c_padre.numero::text, 8, '0')))), ' ', ''), '-', '') = REPLACE(REPLACE(UPPER(TRIM(c_hijo.comprobante_asociado)), ' ', ''), '-', '')
                      )
                      AND (
                          c_hijo.asociado IS NULL OR c_hijo.asociado = 0 OR c_hijo.asociado <> c_padre.id
                          OR (c_padre.asociadogrupo IS NOT NULL AND c_padre.asociadogrupo > 0 AND (c_hijo.asociadogrupo IS NULL OR c_hijo.asociadogrupo <> c_padre.asociadogrupo))
                      )
                """);
                int hijosAsociados;
                if (anio > 2000) {
                    sqlHijos.append("""
                      AND (
                          (c_hijo.periodo >= ? AND c_hijo.periodo <= ?)
                          OR (c_hijo.periodo IS NULL AND c_hijo.fecha >= ? AND c_hijo.fecha <= ?)
                      )
                    """);
                    Date fechaDesde = Date.valueOf(LocalDate.of(anio, 1, 1));
                    Date fechaHasta = Date.valueOf(LocalDate.of(anio, 12, 31));
                    hijosAsociados = debitosJdbcTemplate.update(sqlHijos.toString(), fechaDesde, fechaHasta, fechaDesde, fechaHasta);
                } else {
                    hijosAsociados = debitosJdbcTemplate.update(sqlHijos.toString());
                }
                contadorAsociados[0] += hijosAsociados;

                // Paso 4.3: Propagar tiporegistro de facturas a documentos hijos (NC, ND, RC) vinculados
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
            });

            resumen.setNuevosInsertados(nuevasCabeceras.size());
            resumen.setAsociadosActualizados(contadorAsociados[0]);

            // 5. Fase 3: Escaneo y Reconciliación Retrospectiva de huérfanos en todo el histórico de cabecera
            // Se ejecuta de manera aislada para blindar la importación principal contra contingencias en datos legacy
            int huerfanosReconciliados = 0;
            try {
                Integer cantHuerfanos = txTemplate.execute(status -> reconciliarHuerfanosHistoricos());
                huerfanosReconciliados = (cantHuerfanos != null) ? cantHuerfanos : 0;
            } catch (Exception exHuerfanos) {
                log.error("Aviso: Error durante la reconciliación retrospectiva de huérfanos históricos: {}", exHuerfanos.getMessage(), exHuerfanos);
            }
            resumen.setHuerfanosReconciliados(huerfanosReconciliados);

            resumen.setExito(true);
            resumen.setDuracionMs(System.currentTimeMillis() - inicioMs);
            resumen.setMensaje(String.format(
                    "Sincronización completada con éxito. %d comprobantes nuevos insertados, %d ya existentes omitidos, %d vínculos resueltos en la tanda, %d comprobantes huérfanos históricos reconciliados.",
                    resumen.getNuevosInsertados(), resumen.getExistentesOmitidos(),
                    resumen.getAsociadosActualizados(), resumen.getHuerfanosReconciliados()));

            // 6. Registrar auditoría (en transacción propia aislada)
            try {
                txTemplate.executeWithoutResult(status -> {
                    registrarAuditoria(usuario, anio, resumen.getNuevosInsertados(), resumen.getExistentesOmitidos(),
                            resumen.getAsociadosActualizados(), resumen.getHuerfanosReconciliados(), resumen.getDuracionMs(), "EXITO", resumen.getMensaje());
                });
            } catch (Exception exAudit) {
                log.error("No se pudo registrar la auditoría de sincronización: {}", exAudit.getMessage());
            }

            log.info("Sincronización finalizada por usuario '{}': {}", usuario, resumen.getMensaje());

        } catch (Exception e) {
            long duracion = System.currentTimeMillis() - inicioMs;
            log.error("Error durante la sincronización de cuenta corriente: {}", e.getMessage(), e);
            resumen.setExito(false);
            resumen.setDuracionMs(duracion);
            resumen.setMensaje("Ocurrió un error durante la sincronización: " + e.getMessage());

            try {
                txTemplate.executeWithoutResult(status -> {
                    registrarAuditoria(usuario, anio, 0, 0, 0, 0, duracion, "ERROR", e.getMessage());
                });
            } catch (Exception exAudit) {
                log.error("No se pudo registrar la auditoría de error: {}", exAudit.getMessage());
            }
        }

        return resumen;
    }

    /**
     * Aplica la regla contable de Debe y Haber según el tipo de comprobante.
     */
    private void asignarDebeHaber(Cabecera cab, String tipo, BigDecimal importe) {
        if (tipo == null) {
            cab.setDebe(BigDecimal.ZERO);
            cab.setHaber(BigDecimal.ZERO);
            return;
        }

        String t = tipo.trim().toUpperCase();
        if ("FC".equals(t) || "ND".equals(t)) {
            cab.setDebe(importe);
            cab.setHaber(BigDecimal.ZERO);
        } else if ("NC".equals(t) || "RC".equals(t) || "RCA".equals(t) || "RCB".equals(t) || "OP".equals(t)
                || "REC".equals(t)) {
            cab.setHaber(importe);
            cab.setDebe(BigDecimal.ZERO);
        } else {
            // Regla por defecto para otros tipos
            if (t.startsWith("NC") || t.startsWith("RC")) {
                cab.setHaber(importe);
                cab.setDebe(BigDecimal.ZERO);
            } else {
                cab.setDebe(importe);
                cab.setHaber(BigDecimal.ZERO);
            }
        }
    }

    private Set<String> obtenerClavesExistentesEnDebitos(Integer anio) {
        String sql;
        Object[] params;
        if (anio != null) {
            sql = "SELECT UPPER(TRIM(tipo)), COALESCE(NULLIF(UPPER(TRIM(letra)), ''), 'X'), COALESCE(ptovta, 0), numero, asociadogrupo, id_asignacion FROM cabecera WHERE EXTRACT(YEAR FROM COALESCE(periodo, fecha)) BETWEEN ? - 1 AND ? + 1 AND tipo IS NOT NULL AND numero IS NOT NULL";
            params = new Object[] { anio, anio };
        } else {
            sql = "SELECT UPPER(TRIM(tipo)), COALESCE(NULLIF(UPPER(TRIM(letra)), ''), 'X'), COALESCE(ptovta, 0), numero, asociadogrupo, id_asignacion FROM cabecera WHERE tipo IS NOT NULL AND numero IS NOT NULL";
            params = new Object[] {};
        }

        Set<String> set = new HashSet<>();
        debitosJdbcTemplate.query(sql, rs -> {
            String tipo = rs.getString(1);
            String letra = rs.getString(2);
            int ptovta = rs.getInt(3);
            int numero = rs.getInt(4);
            Long asociadogrupo = rs.getObject(5) != null ? rs.getLong(5) : null;
            Long idAsignacion = rs.getObject(6) != null ? rs.getLong(6) : null;
            if (tipo != null) {
                set.add(armarClave(tipo, letra, ptovta, numero, asociadogrupo, idAsignacion));
                if (Cabecera.esRecibo(tipo)) {
                    String t = tipo.trim().toUpperCase();
                    String l = (letra != null && !letra.trim().isEmpty()) ? letra.trim().toUpperCase() : "X";
                    if (asociadogrupo != null && asociadogrupo > 0) {
                        set.add(t + "|" + l + "|" + ptovta + "|" + numero + "|GRP:" + asociadogrupo);
                    }
                    if (idAsignacion != null && idAsignacion > 0) {
                        set.add(t + "|" + l + "|" + ptovta + "|" + numero + "|ASIG:" + idAsignacion);
                    }
                }
            }
        }, params);
        return set;
    }

    private boolean yaExisteEnDebitos(Set<String> existentesEnDebitos, String tipo, String letra, Integer ptovta, Integer numero, Long asociadogrupo, Long idAsignacion) {
        String clave = armarClave(tipo, letra, ptovta, numero, asociadogrupo, idAsignacion);
        if (existentesEnDebitos.contains(clave)) {
            return true;
        }
        if (Cabecera.esRecibo(tipo)) {
            String l = (letra != null && !letra.trim().isEmpty()) ? letra.trim().toUpperCase() : "X";
            int p = ptovta != null ? ptovta : 0;
            int n = numero != null ? numero : 0;
            String t = tipo != null ? tipo.trim().toUpperCase() : "";
            if (asociadogrupo != null && asociadogrupo > 0) {
                if (existentesEnDebitos.contains(t + "|" + l + "|" + p + "|" + n + "|GRP:" + asociadogrupo)) {
                    return true;
                }
            }
            if (idAsignacion != null && idAsignacion > 0) {
                if (existentesEnDebitos.contains(t + "|" + l + "|" + p + "|" + n + "|ASIG:" + idAsignacion)) {
                    return true;
                }
            }
        }
        return false;
    }

    private void cargarMetricasLocales(EstadoSincronizacionDTO estado, int anio) {
        try {
            // Comprobantes por origen
            Long origenBdd = debitosJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM cabecera WHERE origen IN ('BDD', 'APP_AUTO_ADMIN')", Long.class);
            Long origenApp = debitosJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM cabecera WHERE origen = 'APP' OR origen IS NULL", Long.class);
            estado.setTotalOrigenBdd(origenBdd != null ? origenBdd : 0L);
            estado.setTotalOrigenApp(origenApp != null ? origenApp : 0L);

            // Documentos crédito (NC/RC) sin comprobante asociado (excluyendo anulados)
            Long sinAsociar = debitosJdbcTemplate.queryForObject("""
                    SELECT COUNT(*) FROM cabecera c
                    WHERE UPPER(TRIM(c.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB', 'RC', 'RCA', 'RCB')
                      AND (c.asociado IS NULL OR c.asociado = 0)
                      AND c.id NOT IN (SELECT ca.idcabecera FROM comprobantes_anulados ca WHERE ca.idcabecera IS NOT NULL)
                    """, Long.class);
            estado.setComprobantesSinAsociar(sinAsociar != null ? sinAsociar : 0L);

            // Última sincronización registrada
            List<Map<String, Object>> ultimas = debitosJdbcTemplate.queryForList("""
                        SELECT fecha_hora, usuario, nuevos_insertados
                        FROM registro_sincronizacion
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
                estado.setUltimosInsertados((Integer) u.get("nuevos_insertados"));
            }

        } catch (Exception e) {
            log.warn("No se pudieron cargar algunas métricas locales: {}", e.getMessage());
        }
    }

    /**
     * Escanea todo el histórico de la tabla cabecera en búsqueda de comprobantes que
     * no tengan un comprobante padre vinculado (asociado IS NULL o 0), e intenta
     * resolver su relación contra las facturas existentes (incluyendo las recién insertadas).
     *
     * @return Cantidad total de comprobantes huérfanos que fueron reconciliados con éxito.
     */
    private int reconciliarHuerfanosHistoricos() {
        int totalReconciliados = 0;

        try {
            // Reconciliación de períodos: Completar período si es NULL a partir de fecha
            int periodosReparados = debitosJdbcTemplate.update("""
                UPDATE cabecera
                SET periodo = DATE_TRUNC('month', fecha)::date
                WHERE periodo IS NULL AND fecha IS NOT NULL
            """);
            if (periodosReparados > 0) {
                log.info("Reconciliación: {} comprobantes con período NULL completados a partir de su fecha.", periodosReparados);
            }

            // Reconciliación de comprobante canónico si es NULL en NC, ND, etc.
            int comprobantesReparados = debitosJdbcTemplate.update("""
                UPDATE cabecera
                SET comprobante = CASE 
                    WHEN UPPER(TRIM(tipo)) IN ('RC', 'REC', 'OP', 'RCA', 'RCB') THEN numero::text
                    ELSE UPPER(TRIM(tipo)) || ' ' || UPPER(TRIM(letra)) || LPAD(ptovta::text, 4, '0') || '-' || LPAD(numero::text, 8, '0')
                END
                WHERE comprobante IS NULL AND tipo IS NOT NULL AND numero IS NOT NULL
            """);
            if (comprobantesReparados > 0) {
                log.info("Reconciliación: {} comprobantes completaron su texto canónico en cabecera.", comprobantesReparados);
            }

            // Nivel 1: Auto-asociación de facturas huérfanas históricas (asociado = id)
            int facturasAutoAsociadas = debitosJdbcTemplate.update("""
                UPDATE cabecera
                SET asociado = id,
                    comprobante_asociado = COALESCE(comprobante_asociado, comprobante)
                WHERE (asociado IS NULL OR asociado = 0)
                  AND UPPER(TRIM(tipo)) IN ('FAC', 'FC', 'FCE', 'FR')
            """);
            totalReconciliados += facturasAutoAsociadas;
            if (facturasAutoAsociadas > 0) {
                log.info("Reconciliación Nivel 1: {} facturas huérfanas auto-asociadas a sí mismas.", facturasAutoAsociadas);
            }

            // Nivel 1.5: Documentos que ya tienen 'asociado' (ID del padre) pero comprobante_asociado IS NULL
            int porIdAsociadoExistente = debitosJdbcTemplate.update("""
                UPDATE cabecera c_hijo
                SET comprobante_asociado = COALESCE(
                    c_padre.comprobante,
                    CASE 
                        WHEN UPPER(TRIM(c_padre.tipo)) = 'RC' THEN c_padre.numero::text
                        ELSE UPPER(TRIM(c_padre.tipo)) || ' ' || UPPER(TRIM(c_padre.letra)) || LPAD(c_padre.ptovta::text, 4, '0') || '-' || LPAD(c_padre.numero::text, 8, '0')
                    END
                )
                FROM cabecera c_padre
                WHERE c_hijo.comprobante_asociado IS NULL
                  AND c_hijo.asociado IS NOT NULL 
                  AND c_hijo.asociado > 0
                  AND c_padre.id = c_hijo.asociado
            """);
            if (porIdAsociadoExistente > 0) {
                log.info("Reconciliación Nivel 1.5: {} documentos con ID de padre completaron su comprobante_asociado textual.", porIdAsociadoExistente);
            }

            // Nivel 2: Documentos con comprobante_asociado textual pero asociado o asociadogrupo desactualizado o nulo
            int porComprobanteAsoc = debitosJdbcTemplate.update("""
                UPDATE cabecera c_hijo
                SET asociado = c_padre.id,
                    asociadogrupo = COALESCE(c_padre.asociadogrupo, c_hijo.asociadogrupo)
                FROM cabecera c_padre
                WHERE c_hijo.comprobante_asociado IS NOT NULL
                  AND UPPER(TRIM(c_hijo.tipo)) NOT IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
                  AND (
                      UPPER(TRIM(COALESCE(c_padre.comprobante, c_padre.comprobante_asociado))) = UPPER(TRIM(c_hijo.comprobante_asociado))
                      OR REPLACE(REPLACE(UPPER(TRIM(COALESCE(c_padre.comprobante, UPPER(TRIM(c_padre.tipo)) || UPPER(TRIM(c_padre.letra)) || LPAD(c_padre.ptovta::text, 4, '0') || LPAD(c_padre.numero::text, 8, '0')))), ' ', ''), '-', '') = REPLACE(REPLACE(UPPER(TRIM(c_hijo.comprobante_asociado)), ' ', ''), '-', '')
                  )
                  AND (
                      c_hijo.asociado IS NULL OR c_hijo.asociado = 0 OR c_hijo.asociado <> c_padre.id
                      OR (c_padre.asociadogrupo IS NOT NULL AND c_padre.asociadogrupo > 0 AND (c_hijo.asociadogrupo IS NULL OR c_hijo.asociadogrupo <> c_padre.asociadogrupo))
                  )
            """);
            totalReconciliados += porComprobanteAsoc;
            if (porComprobanteAsoc > 0) {
                log.info("Reconciliación Nivel 2: {} huérfanos vinculados directamente por comprobante_asociado.", porComprobanteAsoc);
            }

            // Nivel 2.5: Alinear asociadogrupo de comprobantes cuyo padre pertenece a una familia con asociadogrupo
            int porAsociadoAlineado = debitosJdbcTemplate.update("""
                UPDATE cabecera c_hijo
                SET asociadogrupo = c_padre.asociadogrupo
                FROM cabecera c_padre
                WHERE c_hijo.asociado = c_padre.id
                  AND c_padre.asociadogrupo IS NOT NULL AND c_padre.asociadogrupo > 0
                  AND UPPER(TRIM(c_hijo.tipo)) NOT IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
                  AND (c_hijo.asociadogrupo IS NULL OR c_hijo.asociadogrupo = 0 OR c_hijo.asociadogrupo <> c_padre.asociadogrupo)
            """);
            if (porAsociadoAlineado > 0) {
                log.info("Reconciliación Nivel 2.5: {} documentos alinearon su asociadogrupo con la familia del documento al que apuntan.", porAsociadoAlineado);
            }

            // Nivel 3: Consulta directa contra Gestión para resolver la relación real (idcomprobante_asociado)
            if (gestionJdbcTemplate != null) {
                List<Map<String, Object>> huerfanosRestantes = debitosJdbcTemplate.queryForList("""
                    SELECT id, tipo, letra, ptovta, numero, asociadogrupo
                    FROM cabecera
                    WHERE (asociado IS NULL OR asociado = 0)
                      AND UPPER(TRIM(tipo)) NOT IN ('FAC', 'FC', 'FCE', 'FR')
                      AND ptovta IS NOT NULL AND numero IS NOT NULL
                    LIMIT 200
                """);

                if (!huerfanosRestantes.isEmpty()) {
                    int reconciliadosGestion = 0;
                    for (Map<String, Object> h : huerfanosRestantes) {
                        Long idHijo = ((Number) h.get("id")).longValue();
                        String tipoHijo = trimOrNull(h.get("tipo"));
                        String letraHijo = trimOrNull(h.get("letra"));
                        Integer ptovtaHijo = parseEntero(h.get("ptovta"));
                        Integer numeroHijo = parseEntero(h.get("numero"));
                        Long asociadogrupoHijo = h.get("asociadogrupo") != null ? ((Number) h.get("asociadogrupo")).longValue() : null;
                        if (asociadogrupoHijo != null && asociadogrupoHijo <= 0L) {
                            asociadogrupoHijo = null;
                        }

                        if (tipoHijo == null || letraHijo == null || ptovtaHijo == null || numeroHijo == null) {
                            continue;
                        }

                        try {
                            String ptovtaStr = String.valueOf(ptovtaHijo);
                            String ptovtaPad = String.format("%04d", ptovtaHijo);
                            String numeroStr = String.valueOf(numeroHijo);
                            String numeroPad = String.format("%08d", numeroHijo);

                            List<Map<String, Object>> relaciones = gestionJdbcTemplate.queryForList("""
                                SELECT 
                                    COALESCE(t_asoc.abreviatura, grp.tipo_grp, t_orig.abreviatura) AS tipo_padre,
                                    COALESCE(c_asoc.letra, grp.letra_grp, c_orig.letra) AS letra_padre,
                                    COALESCE(c_asoc.num4, grp.ptovta_grp, c_orig.num4) AS ptovta_padre,
                                    COALESCE(c_asoc.num8, grp.numero_grp, c_orig.num8) AS numero_padre,
                                    a.idgrupocomp AS grupo_gestion
                                FROM cct_comprobantes c
                                LEFT JOIN cct_comprobantes_tipo t ON c.idtipocomp = t.idtipocomp
                                LEFT JOIN LATERAL (
                                    SELECT idgrupocomp
                                    FROM cct_comprobantes_asignacion
                                    WHERE idcomprobante = c.idcomprobante
                                      AND (:asociadogrupo IS NULL OR idgrupocomp = :asociadogrupo)
                                    ORDER BY idgrupocomp DESC
                                    LIMIT 1
                                ) a ON TRUE
                                LEFT JOIN cct_comprobantes c_asoc ON c.idcomprobante_asociado = c_asoc.idcomprobante
                                LEFT JOIN cct_comprobantes_tipo t_asoc ON c_asoc.idtipocomp = t_asoc.idtipocomp
                                LEFT JOIN cct_comprobantes c_orig ON c.idcomporigen = c_orig.idcomprobante
                                LEFT JOIN cct_comprobantes_tipo t_orig ON c_orig.idtipocomp = t_orig.idtipocomp
                                LEFT JOIN LATERAL (
                                    SELECT 
                                        t2.abreviatura AS tipo_grp,
                                        c2.letra AS letra_grp,
                                        c2.num4 AS ptovta_grp,
                                        c2.num8 AS numero_grp
                                    FROM cct_comprobantes_asignacion a2
                                    JOIN cct_comprobantes c2 ON a2.idcomprobante = c2.idcomprobante
                                    JOIN cct_comprobantes_tipo t2 ON c2.idtipocomp = t2.idtipocomp
                                    WHERE a2.idgrupocomp = a.idgrupocomp
                                      AND c2.idcomprobante <> c.idcomprobante
                                      AND t2.idtipo = 1
                                    ORDER BY 
                                        CASE WHEN UPPER(TRIM(t2.abreviatura)) IN ('FAC', 'FC', 'FCE', 'FR') THEN 0 ELSE 1 END,
                                        c2.fecha DESC
                                    LIMIT 1
                                ) grp ON (c.idcomprobante_asociado IS NULL AND a.idgrupocomp IS NOT NULL)
                                WHERE UPPER(TRIM(t.abreviatura)) = :tipo
                                  AND UPPER(TRIM(c.letra)) = :letra
                                  AND (c.num4 = :ptovtaStr OR c.num4 = :ptovtaPad)
                                  AND (c.num8 = :numeroStr OR c.num8 = :numeroPad)
                                  AND (:asociadogrupo IS NULL OR a.idgrupocomp = :asociadogrupo)
                                  AND t.idtipo = 1
                                LIMIT 1
                            """, new MapSqlParameterSource()
                                    .addValue("tipo", tipoHijo.toUpperCase())
                                    .addValue("letra", letraHijo.toUpperCase())
                                    .addValue("ptovtaStr", ptovtaStr)
                                    .addValue("ptovtaPad", ptovtaPad)
                                    .addValue("numeroStr", numeroStr)
                                    .addValue("numeroPad", numeroPad)
                                    .addValue("asociadogrupo", asociadogrupoHijo));

                            if (!relaciones.isEmpty()) {
                                Map<String, Object> rel = relaciones.get(0);
                                String tipoP = trimOrNull(rel.get("tipo_padre"));
                                String letraP = trimOrNull(rel.get("letra_padre"));
                                Integer ptovtaP = parseEntero(rel.get("ptovta_padre"));
                                Integer numeroP = parseEntero(rel.get("numero_padre"));
                                Integer grupoG = parseEntero(rel.get("grupo_gestion"));

                                String compPadreStr = (tipoP != null && letraP != null && ptovtaP != null && numeroP != null)
                                        ? String.format("%s %s%04d-%08d", tipoP.toUpperCase(), letraP.toUpperCase(), ptovtaP, numeroP)
                                        : null;

                                Long idPadre = null;
                                if (compPadreStr != null) {
                                    List<Cabecera> padres = cabeceraRepository.findByComprobanteIgnoreCase(compPadreStr);
                                    if (!padres.isEmpty()) {
                                        idPadre = padres.get(0).getId();
                                    } else if (tipoP != null && letraP != null && ptovtaP != null && numeroP != null) {
                                        Optional<Cabecera> padreOpt = cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero(
                                                tipoP, letraP, ptovtaP, numeroP);
                                        if (padreOpt.isPresent()) {
                                            idPadre = padreOpt.get().getId();
                                        }
                                    }
                                }

                                if (idPadre != null) {
                                    debitosJdbcTemplate.update("""
                                        UPDATE cabecera
                                        SET asociado = ?,
                                            comprobante_asociado = ?,
                                            asociadogrupo = COALESCE(asociadogrupo, ?)
                                        WHERE id = ?
                                    """, idPadre, compPadreStr, grupoG != null ? grupoG.longValue() : null, idHijo);
                                    reconciliadosGestion++;
                                } else if (compPadreStr != null || grupoG != null) {
                                    debitosJdbcTemplate.update("""
                                        UPDATE cabecera
                                        SET comprobante_asociado = COALESCE(comprobante_asociado, ?),
                                            asociadogrupo = COALESCE(asociadogrupo, ?)
                                        WHERE id = ?
                                    """, compPadreStr, grupoG != null ? grupoG.longValue() : null, idHijo);
                                }
                            }
                        } catch (Exception exFila) {
                            log.debug("No se pudo resolver huérfano {} en Gestión: {}", idHijo, exFila.getMessage());
                        }
                    }

                    totalReconciliados += reconciliadosGestion;
                    if (reconciliadosGestion > 0) {
                        log.info("Reconciliación Nivel 3: {} huérfanos resueltos consultando relaciones reales de Gestión.", reconciliadosGestion);
                    }
                }
            }

            // Nivel 4: Fallback y reparación por grupo (asociadogrupo compartido con una factura)
            int porGrupo = debitosJdbcTemplate.update("""
                UPDATE cabecera c_hijo
                SET asociado = c_padre.id,
                    comprobante_asociado = COALESCE(c_hijo.comprobante_asociado, c_padre.comprobante)
                FROM (
                    SELECT DISTINCT ON (asociadogrupo)
                        id,
                        COALESCE(
                            comprobante,
                            comprobante_asociado,
                            UPPER(TRIM(tipo)) || ' ' || UPPER(TRIM(letra)) || LPAD(ptovta::text, 4, '0') || '-' || LPAD(numero::text, 8, '0')
                        ) AS comprobante,
                        asociadogrupo
                    FROM cabecera
                    WHERE UPPER(TRIM(tipo)) IN ('FAC', 'FC', 'FCE', 'FR')
                      AND asociadogrupo IS NOT NULL AND asociadogrupo > 0
                    ORDER BY asociadogrupo, fecha DESC
                ) c_padre
                WHERE c_hijo.asociadogrupo IS NOT NULL AND c_hijo.asociadogrupo > 0
                  AND UPPER(TRIM(c_hijo.tipo)) NOT IN ('FAC', 'FC', 'FCE', 'FR')
                  AND c_padre.asociadogrupo = c_hijo.asociadogrupo
                  AND c_padre.id <> c_hijo.id
                  AND (
                      c_hijo.asociado IS NULL
                      OR c_hijo.asociado = 0
                      OR NOT EXISTS (SELECT 1 FROM cabecera c_asoc WHERE c_asoc.id = c_hijo.asociado)
                      OR EXISTS (
                          SELECT 1 FROM cabecera c_asoc
                          WHERE c_asoc.id = c_hijo.asociado
                            AND c_asoc.asociadogrupo IS NOT NULL
                            AND c_asoc.asociadogrupo > 0
                            AND c_asoc.asociadogrupo <> c_hijo.asociadogrupo
                            AND (
                                UPPER(TRIM(c_hijo.tipo)) IN ('RC', 'REC', 'RCA', 'RCB', 'OP')
                                OR UPPER(TRIM(c_asoc.tipo)) IN ('FAC', 'FC', 'FCE', 'FR')
                            )
                      )
                  )
            """);
            totalReconciliados += porGrupo;
            if (porGrupo > 0) {
                log.info("Reconciliación Nivel 4: {} huérfanos o comprobantes desalineados vinculados por coincidencia de grupo (asociadogrupo).", porGrupo);
            }

            // Nivel 5: Propagar tiporegistro desde facturas a todos los comprobantes hijos reconciliados
            int porTipoRegAsociado = debitosJdbcTemplate.update("""
                UPDATE cabecera c_hijo
                SET tiporegistro = c_padre.tiporegistro
                FROM cabecera c_padre
                WHERE c_hijo.asociado = c_padre.id
                  AND c_padre.tiporegistro IS NOT NULL
                  AND c_hijo.tiporegistro IS NULL
            """);

            int porTipoRegGrupo = debitosJdbcTemplate.update("""
                UPDATE cabecera c_hijo
                SET tiporegistro = c_fac.tiporegistro
                FROM cabecera c_fac
                WHERE c_hijo.asociadogrupo = c_fac.asociadogrupo
                  AND c_fac.asociadogrupo IS NOT NULL AND c_fac.asociadogrupo > 0
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
                  AND c_fac.tiporegistro IS NOT NULL
                  AND c_hijo.tiporegistro IS NULL
            """);

            int porTipoRegLegacy = debitosJdbcTemplate.update("""
                UPDATE cabecera c_hijo
                SET tiporegistro = c_fac.tiporegistro
                FROM cabecera c_fac
                WHERE c_hijo.grupo = c_fac.grupo
                  AND c_fac.grupo IS NOT NULL AND c_fac.grupo > 0
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FAC', 'FC', 'FCE', 'FR', 'FCA', 'FCB')
                  AND c_fac.tiporegistro IS NOT NULL
                  AND c_hijo.tiporegistro IS NULL
            """);

            int totalTipoReg = porTipoRegAsociado + porTipoRegGrupo + porTipoRegLegacy;
            if (totalTipoReg > 0) {
                log.info("Reconciliación Nivel 5: {} comprobantes hijos heredaron tiporegistro de su factura padre.", totalTipoReg);
            }

            // Nivel 6: Detección y persistencia automática de comprobantes anulados (NC <-> ND con montos idénticos)
            int autoAnuladosNcNd = debitosJdbcTemplate.update("""
                INSERT INTO facturas_anuladas_manual (id_cabecera, id_cabecera_anulador, anulada, fecha_anulacion, usuario)
                SELECT 
                    c_nc.id AS id_cabecera,
                    c_nd.id AS id_cabecera_anulador,
                    TRUE AS anulada,
                    NOW() AS fecha_anulacion,
                    'SISTEMA_AUTO' AS usuario
                FROM cabecera c_nc
                JOIN cabecera c_nd ON (
                    c_nd.asociado = c_nc.id 
                    OR (
                        c_nd.comprobante_asociado IS NOT NULL 
                        AND REPLACE(REPLACE(UPPER(TRIM(COALESCE(c_nc.comprobante, UPPER(TRIM(c_nc.tipo)) || UPPER(TRIM(c_nc.letra)) || LPAD(c_nc.ptovta::text, 4, '0') || LPAD(c_nc.numero::text, 8, '0')))), ' ', ''), '-', '') = REPLACE(REPLACE(UPPER(TRIM(c_nd.comprobante_asociado)), ' ', ''), '-', '')
                    )
                )
                WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
                  AND UPPER(TRIM(c_nd.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
                  AND GREATEST(COALESCE(c_nc.debe, 0), COALESCE(c_nc.haber, 0)) > 0
                  AND GREATEST(COALESCE(c_nc.debe, 0), COALESCE(c_nc.haber, 0)) = GREATEST(COALESCE(c_nd.debe, 0), COALESCE(c_nd.haber, 0))
                  AND NOT EXISTS (
                      SELECT 1 FROM facturas_anuladas_manual fam WHERE fam.id_cabecera = c_nc.id
                  )
            """);

            int autoAnuladosNdNc = debitosJdbcTemplate.update("""
                INSERT INTO facturas_anuladas_manual (id_cabecera, id_cabecera_anulador, anulada, fecha_anulacion, usuario)
                SELECT 
                    c_nc.id AS id_cabecera,
                    c_nd.id AS id_cabecera_anulador,
                    TRUE AS anulada,
                    NOW() AS fecha_anulacion,
                    'SISTEMA_AUTO' AS usuario
                FROM cabecera c_nd
                JOIN cabecera c_nc ON (
                    c_nc.asociado = c_nd.id 
                    OR (
                        c_nc.comprobante_asociado IS NOT NULL 
                        AND REPLACE(REPLACE(UPPER(TRIM(COALESCE(c_nd.comprobante, UPPER(TRIM(c_nd.tipo)) || UPPER(TRIM(c_nd.letra)) || LPAD(c_nd.ptovta::text, 4, '0') || LPAD(c_nd.numero::text, 8, '0')))), ' ', ''), '-', '') = REPLACE(REPLACE(UPPER(TRIM(c_nc.comprobante_asociado)), ' ', ''), '-', '')
                    )
                )
                WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC', 'NCE', 'NCA', 'NCB')
                  AND UPPER(TRIM(c_nd.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB')
                  AND GREATEST(COALESCE(c_nc.debe, 0), COALESCE(c_nc.haber, 0)) > 0
                  AND GREATEST(COALESCE(c_nc.debe, 0), COALESCE(c_nc.haber, 0)) = GREATEST(COALESCE(c_nd.debe, 0), COALESCE(c_nd.haber, 0))
                  AND NOT EXISTS (
                      SELECT 1 FROM facturas_anuladas_manual fam WHERE fam.id_cabecera = c_nc.id
                  )
            """);

            int totalAutoAnulados = autoAnuladosNcNd + autoAnuladosNdNc;
            if (totalAutoAnulados > 0) {
                log.info("Reconciliación Nivel 6: {} pares de comprobantes (NC/ND con importes coincidentes) registrados automáticamente como anulados en facturas_anuladas_manual.", totalAutoAnulados);
            }

        } catch (Exception e) {
            log.error("Error durante el escaneo y reconciliación de huérfanos: {}", e.getMessage(), e);
        }

        return totalReconciliados;
    }

    private void registrarAuditoria(String usuario, int anio, int nuevos, int omitidos, int asociados, int huerfanos,
            long duracionMs, String estado, String mensaje) {
        try {
            debitosJdbcTemplate.update(
                    """
                                INSERT INTO registro_sincronizacion
                                (usuario, anio_procesado, nuevos_insertados, existentes_omitidos, asociados_actualizados, huerfanos_reconciliados, duracion_ms, estado, mensaje)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                    usuario, anio, nuevos, omitidos, asociados, huerfanos, duracionMs, estado, mensaje);
        } catch (Exception e) {
            log.error("No se pudo registrar la auditoría de sincronización: {}", e.getMessage());
        }
    }

    private String armarClave(String tipo, String letra, Integer ptovta, Integer numero, Long asociadogrupo, Long idAsignacion) {
        String t = tipo != null ? tipo.trim().toUpperCase() : "";
        String l = (letra != null && !letra.trim().isEmpty()) ? letra.trim().toUpperCase() : "X";
        int p = ptovta != null ? ptovta : 0;
        int n = numero != null ? numero : 0;
        if (Cabecera.esRecibo(t)) {
            if (idAsignacion != null && idAsignacion > 0) {
                return t + "|" + l + "|" + p + "|" + n + "|ASIG:" + idAsignacion;
            }
            if (asociadogrupo != null && asociadogrupo > 0) {
                return t + "|" + l + "|" + p + "|" + n + "|GRP:" + asociadogrupo;
            }
            return t + "|" + l + "|" + p + "|" + n + "|SIN_GRUPO";
        }
        return t + "|" + l + "|" + p + "|" + n;
    }

    private String armarClave(String tipo, String letra, Integer ptovta, Integer numero) {
        return armarClave(tipo, letra, ptovta, numero, null, null);
    }

    private Integer parseEntero(Object obj) {
        if (obj == null)
            return null;
        if (obj instanceof Number)
            return ((Number) obj).intValue();
        try {
            String s = obj.toString().trim();
            if (s.isEmpty())
                return null;
            return Integer.parseInt(s);
        } catch (Exception e) {
            return null;
        }
    }

    private String trimOrNull(Object obj) {
        if (obj == null)
            return null;
        String s = obj.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private static class DatosComprobantePadre {
        final Integer idCompPadre;
        final String tipo;
        final String letra;
        final Integer ptovta;
        final Integer numero;

        DatosComprobantePadre(Integer idCompPadre, String tipo, String letra, Integer ptovta, Integer numero) {
            this.idCompPadre = idCompPadre;
            this.tipo = tipo;
            this.letra = letra;
            this.ptovta = ptovta;
            this.numero = numero;
        }
    }
}
