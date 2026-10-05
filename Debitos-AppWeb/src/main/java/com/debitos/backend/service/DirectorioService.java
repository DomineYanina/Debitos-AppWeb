package com.debitos.backend.service;

import com.debitos.backend.dto.directorio.*;
import com.debitos.backend.dto.reportes.*;
import com.debitos.backend.dto.PrestacionAuditoriaDTO;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;
import com.debitos.backend.model.AmbLiquidado;
import com.debitos.backend.model.Cabecera;
import com.debitos.backend.model.CabeceraBase;
import com.debitos.backend.dto.CabeceraLigeraDTO;
import com.debitos.backend.dto.PrestacionLigeraDTO;
import com.debitos.backend.dto.NotaCreditoLigeraDTO;
import com.debitos.backend.dto.NotaDebitoLigeraDTO;
import com.debitos.backend.model.NcAjusteDeIva;
import com.debitos.backend.model.NdAjusteDeIva;
import com.debitos.backend.model.NotaDeCredito;
import com.debitos.backend.model.NotaDeDebito;
import com.debitos.backend.repository.AmbLiquidadoRepository;
import com.debitos.backend.repository.CabeceraRepository;
import com.debitos.backend.repository.ComprobanteAnuladoRepository;
import com.debitos.backend.repository.NcAjusteDeIvaRepository;
import com.debitos.backend.repository.NdAjusteDeIvaRepository;
import com.debitos.backend.repository.NotaDeCreditoRepository;
import com.debitos.backend.repository.NotaDeDebitoRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import com.debitos.backend.config.CacheConfig;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.*;


@Service
@Transactional(readOnly = true)
public class DirectorioService {

    private static final Logger log = LoggerFactory.getLogger(DirectorioService.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private CabeceraRepository cabeceraRepository;

    @Autowired
    private NotaDeCreditoRepository notaDeCreditoRepository;

    @Autowired
    private NotaDeDebitoRepository notaDeDebitoRepository;

    @Autowired
    private NcAjusteDeIvaRepository ncAjusteDeIvaRepository;

    @Autowired
    private NdAjusteDeIvaRepository ndAjusteDeIvaRepository;

    @Autowired
    private AmbLiquidadoRepository ambLiquidadoRepository;

    @Autowired
    private ComprobanteAnuladoRepository comprobanteAnuladoRepository;

    /**
     * Auto-inyección perezosa para permitir que las llamadas internas pasen por el
     * proxy de Spring y se beneficien de @Cacheable y @Transactional.
     * Evita el problema de self-invocation sin necesidad de dividir el servicio.
     */
    @Autowired
    @org.springframework.context.annotation.Lazy
    private DirectorioService self;

    /**
     * Identifica en memoria los IDs de comprobantes anulados y sus anuladores:
     * 1. Comprobantes presentes formalmente en la tabla comprobantes_anulados.
     * 2. Documentos anuladores asociados con <= 15 días de diferencia y mismo monto:
     *    - Caso 1: Factura anulada por Nota de Crédito
     *    - Caso 2: Nota de Crédito anulada por Nota de Débito
     *    - Caso 3: Nota de Débito anulada por Nota de Crédito
     * 3. Pares directos de NC que apuntan a FC con <= 15 días y mismo monto.
     */
    private Set<Long> identificarComprobantesAnulados15Dias(Collection<? extends CabeceraBase> cabeceras, Set<Long> idsDesdeRepo) {
        Set<Long> anulados = new HashSet<>();
        if (idsDesdeRepo != null) {
            anulados.addAll(idsDesdeRepo);
        }
        if (comprobanteAnuladoRepository != null) {
            try {
                List<Long> idsCa = comprobanteAnuladoRepository.findIdsCabeceraAnulados();
                if (idsCa != null) {
                    anulados.addAll(idsCa);
                }
            } catch (Exception e) {
                log.warn("No se pudieron cargar IDs desde comprobanteAnuladoRepository: {}", e.getMessage());
            }
        }
        if (cabeceras == null || cabeceras.isEmpty()) {
            return anulados;
        }

        // ── Índices O(1) para eliminar los bucles anidados O(N²) ─────────────────
        // porId:       id → CabeceraBase
        // porAsociado: asociado → List<CabeceraBase>  (comprobantes que apuntan a ese padre)
        // porGrupo:    idGrupo → List<CabeceraBase>   (todos los miembros de la familia)
        Map<Long, CabeceraBase> porId = new HashMap<>(cabeceras.size() * 2);
        Map<Long, List<CabeceraBase>> porAsociado = new HashMap<>();
        Map<Long, List<CabeceraBase>> porGrupo = new HashMap<>();

        for (CabeceraBase c : cabeceras) {
            if (c == null) continue;
            if (c.getId() != null) {
                porId.put(c.getId(), c);
            }
            // Indexar por asociado solo cuando NO apunta a sí mismo
            if (c.getAsociado() != null && !c.getAsociado().equals(c.getId())) {
                porAsociado.computeIfAbsent(c.getAsociado(), k -> new ArrayList<>()).add(c);
            }
            Long g = resolverIdGrupoTrazabilidad(c);
            if (g != null) {
                porGrupo.computeIfAbsent(g, k -> new ArrayList<>()).add(c);
            }
        }

        // 1. Pares donde un documento anulado (en comprobantes_anulados) tiene un anulador con <= 15 días y mismo monto
        for (CabeceraBase cAnulado : cabeceras) {
            if (cAnulado == null || cAnulado.getId() == null || !anulados.contains(cAnulado.getId())) {
                continue;
            }
            String tAnulado = resolverTipoBase(cAnulado.getTipo());
            String expectedAnuladorTipo = null;
            if ("FC".equalsIgnoreCase(tAnulado)) {
                expectedAnuladorTipo = "NC"; // Caso 1: FC anulada por NC
            } else if ("NC".equalsIgnoreCase(tAnulado)) {
                expectedAnuladorTipo = "ND"; // Caso 2: NC anulada por ND
            } else if ("ND".equalsIgnoreCase(tAnulado)) {
                expectedAnuladorTipo = "NC"; // Caso 3: ND anulada por NC
            }
            if (expectedAnuladorTipo == null) continue;
            BigDecimal montoAnulado = resolverMontoDocumento(cAnulado);
            if (montoAnulado.compareTo(BigDecimal.ZERO) <= 0 || cAnulado.getFecha() == null) continue;

            // Candidatos con asociado directo → O(1) en lugar de O(N)
            List<CabeceraBase> candidatosPorAsociado = porAsociado.getOrDefault(cAnulado.getId(), Collections.emptyList());
            for (CabeceraBase cAnulador : candidatosPorAsociado) {
                if (cAnulador == null || cAnulador.getId() == null) continue;
                if (!expectedAnuladorTipo.equalsIgnoreCase(resolverTipoBase(cAnulador.getTipo()))) continue;
                if (cAnulador.getFecha() == null) continue;
                BigDecimal montoAnulador = resolverMontoDocumento(cAnulador);
                if (montoAnulador.compareTo(montoAnulado) == 0) {
                    long diffDias = Math.abs(java.time.temporal.ChronoUnit.DAYS.between(cAnulado.getFecha(), cAnulador.getFecha()));
                    if (diffDias <= 15) {
                        anulados.add(cAnulador.getId());
                    }
                }
            }

            // Candidatos sin asociado directo, hallados por grupo compartido
            Long grupoAnulado = resolverIdGrupoTrazabilidad(cAnulado);
            if (grupoAnulado != null) {
                List<CabeceraBase> miembrosGrupo = porGrupo.getOrDefault(grupoAnulado, Collections.emptyList());
                for (CabeceraBase cAnulador : miembrosGrupo) {
                    if (cAnulador == null || cAnulador.getId() == null
                            || Objects.equals(cAnulador.getId(), cAnulado.getId())) continue;
                    // Saltar los ya cubiertos por porAsociado (tienen asociado != null)
                    if (cAnulador.getAsociado() != null && !cAnulador.getAsociado().equals(cAnulador.getId())) continue;
                    if (!expectedAnuladorTipo.equalsIgnoreCase(resolverTipoBase(cAnulador.getTipo()))) continue;
                    if (cAnulador.getFecha() == null) continue;
                    BigDecimal montoAnulador = resolverMontoDocumento(cAnulador);
                    if (montoAnulador.compareTo(montoAnulado) == 0) {
                        long diffDias = Math.abs(java.time.temporal.ChronoUnit.DAYS.between(cAnulado.getFecha(), cAnulador.getFecha()));
                        if (diffDias <= 15) {
                            anulados.add(cAnulador.getId());
                        }
                    }
                }
            }
        }

        // 2. Par general NC -> FC con <= 15 días y mismo monto
        for (CabeceraBase nc : cabeceras) {
            if (nc == null || !"NC".equalsIgnoreCase(resolverTipoBase(nc.getTipo())) || nc.getFecha() == null) {
                continue;
            }
            BigDecimal montoNc = resolverMontoDocumento(nc);
            if (montoNc.compareTo(BigDecimal.ZERO) <= 0) continue;

            if (nc.getAsociado() != null && !nc.getAsociado().equals(nc.getId())) {
                // Caso 1: la NC apunta directamente a la FC → lookup O(1)
                CabeceraBase fc = porId.get(nc.getAsociado());
                if (fc != null && "FC".equalsIgnoreCase(resolverTipoBase(fc.getTipo())) && fc.getFecha() != null) {
                    BigDecimal montoFc = resolverMontoDocumento(fc);
                    if (montoFc.compareTo(montoNc) == 0) {
                        long diffDias = Math.abs(java.time.temporal.ChronoUnit.DAYS.between(fc.getFecha(), nc.getFecha()));
                        if (diffDias <= 15) {
                            if (nc.getId() != null) anulados.add(nc.getId());
                            if (fc.getId() != null) anulados.add(fc.getId());
                        }
                    }
                }
            } else {
                // Caso 2: la NC no tiene asociado directo → buscar FC en el mismo grupo
                Long grupoNc = resolverIdGrupoTrazabilidad(nc);
                if (grupoNc != null) {
                    List<CabeceraBase> miembrosGrupo = porGrupo.getOrDefault(grupoNc, Collections.emptyList());
                    for (CabeceraBase fc : miembrosGrupo) {
                        if (fc == null || Objects.equals(fc.getId(), nc.getId())) continue;
                        if (!"FC".equalsIgnoreCase(resolverTipoBase(fc.getTipo())) || fc.getFecha() == null) continue;
                        BigDecimal montoFc = resolverMontoDocumento(fc);
                        if (montoFc.compareTo(montoNc) == 0) {
                            long diffDias = Math.abs(java.time.temporal.ChronoUnit.DAYS.between(fc.getFecha(), nc.getFecha()));
                            if (diffDias <= 15) {
                                if (nc.getId() != null) anulados.add(nc.getId());
                                if (fc.getId() != null) anulados.add(fc.getId());
                            }
                        }
                    }
                }
            }
        }

        return anulados;
    }

    private BigDecimal resolverMontoDocumento(CabeceraBase c) {
        if (c == null) return BigDecimal.ZERO;
        String t = resolverTipoBase(c.getTipo());
        if ("NC".equalsIgnoreCase(t)) {
            return (c.getHaber() != null && c.getHaber().compareTo(BigDecimal.ZERO) > 0)
                    ? c.getHaber()
                    : (c.getDebe() != null ? c.getDebe() : BigDecimal.ZERO);
        }
        return c.getDebe() != null ? c.getDebe() : BigDecimal.ZERO;
    }

    private boolean sonAsociados(CabeceraBase hijo, CabeceraBase padre) {
        if (hijo == null || padre == null) return false;
        if (hijo.getAsociado() != null && padre.getId() != null && Objects.equals(hijo.getAsociado(), padre.getId())) {
            return true;
        }
        if (hijo.getAsociado() == null) {
            Long gHijo = resolverIdGrupoTrazabilidad(hijo);
            Long gPadre = resolverIdGrupoTrazabilidad(padre);
            if (gHijo != null && gPadre != null && Objects.equals(gHijo, gPadre)) {
                return true;
            }
            if (gHijo != null && padre.getId() != null && Objects.equals(gHijo, padre.getId())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Clasifica los comprobantes de tipo ND en refacturaciones (hijos de NC) o incrementos/ajustes (hijos de FC)
     * resolviendo primero las relaciones en memoria sobre la colección recibida, y únicamente si algún comprobante
     * padre no se encuentra en el lote actual, consultando sus IDs específicos mediante una búsqueda puntual por PK.
     * Evita escaneos de tabla completa y subconsultas correlacionadas sobre toda la base de datos.
     */
    private void clasificarHijosNd(Collection<? extends CabeceraBase> comprobantes, Set<Long> ndHijosDeNc, Set<Long> ndHijosDeFc) {
        if (comprobantes == null || comprobantes.isEmpty()) return;
        Map<Long, CabeceraBase> cabeceraMap = comprobantes.stream()
                .filter(c -> c.getId() != null)
                .collect(Collectors.toMap(CabeceraBase::getId, c -> c, (a, b) -> a));

        for (CabeceraBase c : comprobantes) {
            if ("ND".equalsIgnoreCase(resolverTipoBase(c.getTipo())) && c.getAsociado() != null && c.getId() != null) {
                CabeceraBase p = cabeceraMap.get(c.getAsociado());
                if (p != null && p.getTipo() != null) {
                    String pt = p.getTipo().toUpperCase();
                    if (pt.contains("N")) {
                        ndHijosDeNc.add(c.getId());
                    } else if (pt.contains("F")) {
                        ndHijosDeFc.add(c.getId());
                    }
                }
            }
        }

        Set<Long> missingParentIds = comprobantes.stream()
                .filter(c -> "ND".equalsIgnoreCase(resolverTipoBase(c.getTipo()))
                        && c.getAsociado() != null
                        && c.getId() != null
                        && !ndHijosDeNc.contains(c.getId())
                        && !ndHijosDeFc.contains(c.getId())
                        && !cabeceraMap.containsKey(c.getAsociado()))
                .map(CabeceraBase::getAsociado)
                .collect(Collectors.toSet());

        if (!missingParentIds.isEmpty()) {
            Map<Long, String> tiposPorId = cabeceraRepository.findAllById(missingParentIds).stream()
                    .filter(p -> p.getId() != null && p.getTipo() != null)
                    .collect(Collectors.toMap(Cabecera::getId, p -> p.getTipo().toUpperCase(), (a, b) -> a));
            for (CabeceraBase c : comprobantes) {
                if ("ND".equalsIgnoreCase(resolverTipoBase(c.getTipo())) && c.getAsociado() != null && c.getId() != null) {
                    String pt = tiposPorId.get(c.getAsociado());
                    if (pt != null) {
                        if (pt.contains("N")) {
                            ndHijosDeNc.add(c.getId());
                        } else if (pt.contains("F")) {
                            ndHijosDeFc.add(c.getId());
                        }
                    }
                }
            }
        }
    }

    @Cacheable(CacheConfig.CACHE_COBERTURAS)
    public List<DirectorioCoberturaDTO> obtenerCoberturasDisponibles() {
        String sql = """
            SELECT DISTINCT codigo_cobertura, cobertura 
            FROM cabecera 
            WHERE codigo_cobertura IS NOT NULL AND TRIM(codigo_cobertura) <> ''
            ORDER BY cobertura ASC, codigo_cobertura ASC
        """;
        Query q = entityManager.createNativeQuery(sql);
        List<Object[]> rows = q.getResultList();
        List<DirectorioCoberturaDTO> lista = new ArrayList<>();
        for (Object[] row : rows) {
            String cod = row[0] != null ? row[0].toString().trim() : "";
            String nom = row[1] != null ? row[1].toString().trim() : cod;
            if (!cod.isEmpty()) {
                lista.add(new DirectorioCoberturaDTO(cod, nom));
            }
        }
        return lista;
    }

    @Cacheable(CacheConfig.CACHE_TIPOS_DOC)
    public List<String> obtenerTiposDocumentoDisponibles() {
        String sql = """
            SELECT DISTINCT UPPER(TRIM(tipo)) 
            FROM cabecera 
            WHERE tipo IS NOT NULL AND TRIM(tipo) <> ''
            ORDER BY UPPER(TRIM(tipo)) ASC
        """;
        Query q = entityManager.createNativeQuery(sql);
        List<Object> rows = q.getResultList();
        List<String> lista = new ArrayList<>();
        for (Object row : rows) {
            if (row != null && !row.toString().trim().isEmpty()) {
                String tipo = row.toString().trim();
                if (!lista.contains(tipo)) {
                    lista.add(tipo);
                }
            }
        }
        return lista;
    }

    @Cacheable(CacheConfig.CACHE_TOTALES)
    public DirectorioTotalesDTO obtenerTotalesMacro(String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        StringBuilder sql = new StringBuilder("""
            WITH docs_anulados AS (
                SELECT DISTINCT ca.idcabecera AS id
                FROM comprobantes_anulados ca
                WHERE ca.idcabecera IS NOT NULL
            ),
            docs_anuladores AS (
                -- Caso 1: Factura anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 2: NC anulada por ND
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 3: ND anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
            ),
            pares_anulados_15d AS (
                SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
                FROM cabecera c_nc
                JOIN cabecera c_fac ON (
                    c_nc.asociado = c_fac.id
                    OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                        AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                             OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
                )
                WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(c_fac.debe, 0) > 0
                  AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
                  AND c_fac.fecha IS NOT NULL
                  AND c_nc.fecha IS NOT NULL
                  AND ABS(c_nc.fecha - c_fac.fecha) <= 15
            ),
            ids_anulados_15d AS (
                SELECT id FROM docs_anulados
                UNION
                SELECT id FROM docs_anuladores
                UNION
                SELECT id_fac AS id FROM pares_anulados_15d
                UNION
                SELECT id_nc AS id FROM pares_anulados_15d
            ),
            fc_madre AS (
                SELECT DISTINCT ON (COALESCE(asociadogrupo, grupo))
                    COALESCE(asociadogrupo, grupo) AS gid,
                    periodo,
                    fecha
                FROM cabecera
                WHERE UPPER(TRIM(tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(asociadogrupo, grupo) IS NOT NULL
                  AND id NOT IN (SELECT id FROM ids_anulados_15d)
                ORDER BY COALESCE(asociadogrupo, grupo), fecha ASC, id ASC
            )
            SELECT 
                -- 0. Facturación Original (FC)
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) AS facturacion_fc,
                -- 1. Cantidad de comprobantes FC
                COALESCE(COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN 1 END), 0) AS cant_facturas,

                -- 2. Incrementos (ND cuyo asociado es Factura con 'F')
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') AND EXISTS (
                    SELECT 1 FROM cabecera c_fac WHERE c_fac.id = c.asociado AND UPPER(TRIM(c_fac.tipo)) LIKE '%F%'
                ) THEN c.debe ELSE 0 END), 0) AS incrementos_nd,

                -- 3. Débitos Recibidos (NC)
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS debitos_nc,

                -- 4. Refacturación (ND cuyo asociado es NC con 'N')
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') AND EXISTS (
                    SELECT 1 FROM cabecera c_nc WHERE c_nc.id = c.asociado AND UPPER(TRIM(c_nc.tipo)) LIKE '%N%'
                ) THEN c.debe ELSE 0 END), 0) AS refacturacion_nd,

                -- 5. Cobranzas (RC, REC, OP)
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS cobranzas_rc,

                -- 6. DSO Ponderado por Saldo Vivo de Familias
                COALESCE(
                    CAST(ROUND(
                        (SELECT SUM(GREATEST(0, CAST(CURRENT_DATE - f.fecha_emision AS INTEGER)) * f.saldo_vivo) / NULLIF(SUM(f.saldo_vivo), 0)
                         FROM (
                             SELECT 
                                 MIN(CASE WHEN UPPER(TRIM(c2.tipo)) IN ('FC','FAC','FCE','FCA') THEN c2.fecha END) AS fecha_emision,
                                 COALESCE(SUM(CASE WHEN UPPER(TRIM(c2.tipo)) IN ('FC','FAC','FCE','FCA','ND','NDE','NDA','NDB') THEN c2.debe ELSE 0 END), 0)
                                 - COALESCE(SUM(CASE WHEN UPPER(TRIM(c2.tipo)) IN ('RC','RCA','RCB','REC','OP','NC','NCE','NCA','NCB') THEN COALESCE(c2.haber, c2.debe, 0) ELSE 0 END), 0) AS saldo_vivo
                             FROM cabecera c2
                             WHERE c2.id NOT IN (SELECT id FROM ids_anulados_15d)
                             GROUP BY COALESCE(c2.asociadogrupo, c2.grupo, c2.asociado, c2.id)
                             HAVING MIN(CASE WHEN UPPER(TRIM(c2.tipo)) IN ('FC','FAC','FCE','FCA') THEN c2.fecha END) IS NOT NULL
                                AND (
                                     COALESCE(SUM(CASE WHEN UPPER(TRIM(c2.tipo)) IN ('FC','FAC','FCE','FCA','ND','NDE','NDA','NDB') THEN c2.debe ELSE 0 END), 0)
                                     - COALESCE(SUM(CASE WHEN UPPER(TRIM(c2.tipo)) IN ('RC','RCA','RCB','REC','OP','NC','NCE','NCA','NCB') THEN COALESCE(c2.haber, c2.debe, 0) ELSE 0 END), 0)
                                ) > 0
                         ) f)
                    ) AS INTEGER),
                    429
                ) AS dso_ponderado

            FROM cabecera c
            LEFT JOIN fc_madre fc ON COALESCE(c.asociadogrupo, c.grupo) = fc.gid
            WHERE (
                CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(c.periodo, c.fecha)
                     ELSE COALESCE(fc.periodo, fc.fecha)
                END
            ) IS NOT NULL
              AND c.id NOT IN (SELECT id FROM ids_anulados_15d)
        """);

        aplicarFiltrosCabeceraPeriodo(sql, "c", "fc", codigoCobertura, fechaDesde, fechaHasta);
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sql.append(" AND UPPER(TRIM(c.tipo)) = :tipoDoc");
        }

        Query q = crearQueryConFiltros(sql.toString(), codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        Object[] row = (Object[]) q.getSingleResult();

        BigDecimal fc = row[0] != null ? new BigDecimal(row[0].toString()) : BigDecimal.ZERO;
        long cantFacturas = row[1] != null ? ((Number) row[1]).longValue() : 0L;
        BigDecimal incrementoNd = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
        BigDecimal debitosNc = row[3] != null ? new BigDecimal(row[3].toString()) : BigDecimal.ZERO;
        BigDecimal refacturacionNd = row[4] != null ? new BigDecimal(row[4].toString()) : BigDecimal.ZERO;
        BigDecimal cobranzasRc = row[5] != null ? new BigDecimal(row[5].toString()) : BigDecimal.ZERO;
        Integer dso = row[6] != null ? ((Number) row[6]).intValue() : 429;

        // 1. Tasa de Recupero % = (Refacturación ND / Débitos NC) * 100
        BigDecimal tasaRecupero = BigDecimal.ZERO;
        if (debitosNc.compareTo(BigDecimal.ZERO) > 0) {
            tasaRecupero = refacturacionNd.multiply(BigDecimal.valueOf(100))
                    .divide(debitosNc, 1, RoundingMode.HALF_UP);
        }

        // 2. Efectividad % = (Cobranzas RC / (FC + Incrementos ND)) * 100
        BigDecimal denominadorEfectividad = fc.add(incrementoNd);
        BigDecimal efectividadCobro = BigDecimal.ZERO;
        if (denominadorEfectividad.compareTo(BigDecimal.ZERO) > 0) {
            efectividadCobro = cobranzasRc.multiply(BigDecimal.valueOf(100))
                    .divide(denominadorEfectividad, 1, RoundingMode.HALF_UP);
        }

        // 3. Saldo Pendiente Real = FC + Incrementos ND + Refacturación ND - Débitos NC - Cobranzas RC
        BigDecimal saldoReal = fc.add(incrementoNd)
                .add(refacturacionNd)
                .subtract(debitosNc)
                .subtract(cobranzasRc)
                .setScale(2, RoundingMode.HALF_UP);

        DirectorioTotalesDTO dto = new DirectorioTotalesDTO();
        dto.setTotalFacturado(fc.setScale(2, RoundingMode.HALF_UP));
        dto.setCantidadFacturas(cantFacturas);
        dto.setTotalIncrementosNd(incrementoNd.setScale(2, RoundingMode.HALF_UP));
        dto.setTotalDebitosNc(debitosNc.setScale(2, RoundingMode.HALF_UP));
        dto.setTotalRefacturacionNd(refacturacionNd.setScale(2, RoundingMode.HALF_UP));
        dto.setTasaRecupero(tasaRecupero);
        dto.setTotalCobranzas(cobranzasRc.setScale(2, RoundingMode.HALF_UP));
        dto.setEfectividadCobro(efectividadCobro);
        dto.setSaldoPendienteReal(saldoReal);
        dto.setDsoPonderadoDias(dso);

        // Campos legados por compatibilidad
        dto.setCobranzaEfectiva(dto.getTotalCobranzas());
        dto.setDeudaNeta(dto.getSaldoPendienteReal());
        BigDecimal perdidaAsumida = debitosNc.subtract(refacturacionNd);
        if (perdidaAsumida.compareTo(BigDecimal.ZERO) < 0) {
            perdidaAsumida = BigDecimal.ZERO;
        }
        dto.setPerdidaAsumida(perdidaAsumida.setScale(2, RoundingMode.HALF_UP));
        dto.setCantidadComprobantes(cantFacturas);

        return dto;
    }

    public PaginatedResponseDTO<DirectorioGrupoFacturaDTO> obtenerGruposFacturasPaginado(
            String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta, int page, int size) {
        int pageIndex = Math.max(0, page);
        int pageSize = size > 0 ? size : 50;
        int offset = pageIndex * pageSize;

        String cte = """
            WITH docs_anulados AS (
                SELECT DISTINCT ca.idcabecera AS id
                FROM comprobantes_anulados ca
                WHERE ca.idcabecera IS NOT NULL
            ),
            docs_anuladores AS (
                -- Caso 1: Factura anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 2: NC anulada por ND
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 3: ND anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
            ),
            pares_anulados_15d AS (
                SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
                FROM cabecera c_nc
                JOIN cabecera c_fac ON (
                    c_nc.asociado = c_fac.id
                    OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                        AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                             OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
                )
                WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(c_fac.debe, 0) > 0
                  AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
                  AND c_fac.fecha IS NOT NULL
                  AND c_nc.fecha IS NOT NULL
                  AND ABS(c_nc.fecha - c_fac.fecha) <= 15
            ),
            ids_anulados_15d AS (
                SELECT id FROM docs_anulados
                UNION
                SELECT id FROM docs_anuladores
                UNION
                SELECT id_fac AS id FROM pares_anulados_15d
                UNION
                SELECT id_nc AS id FROM pares_anulados_15d
            )
            """;

        StringBuilder whereSql = new StringBuilder("""
            FROM cabecera c
            WHERE c.id NOT IN (SELECT id FROM ids_anulados_15d)
        """);
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            whereSql.append(" AND UPPER(TRIM(c.tipo)) = :tipoDoc");
        } else {
            whereSql.append(" AND (UPPER(TRIM(c.tipo)) IN ('FC', 'FCE', 'FCA', 'FAC') OR UPPER(TRIM(c.tipo)) LIKE 'FC%')");
        }
        aplicarFiltrosCabeceraPeriodo(whereSql, "c", null, codigoCobertura, fechaDesde, fechaHasta);

        String countSql = cte + " SELECT COUNT(c.id) " + whereSql;
        Query countQuery = crearQueryConFiltros(countSql, codigoCobertura, tipoDoc, fechaDesde, fechaHasta);

        long totalElements = 0L;
        try {
            Object countRes = countQuery.getSingleResult();
            if (countRes instanceof Number) {
                totalElements = ((Number) countRes).longValue();
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener el COUNT previo para grupos de facturas: {}", e.getMessage());
        }

        String dataSql = cte + """
            SELECT c.id, c.tipo, c.letra, c.ptovta, c.numero, c.fecha, c.periodo, 
                   c.codigo_cobertura, c.cobertura, c.asociadogrupo, c.debe, c.id_estado
        """ + whereSql + " ORDER BY COALESCE(c.periodo, c.fecha) DESC, c.fecha DESC, c.numero DESC LIMIT :limit OFFSET :offset";

        Query query = crearQueryConFiltros(dataSql, codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        query.setParameter("limit", pageSize);
        query.setParameter("offset", offset);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();

        if (totalElements == 0 && rows != null && !rows.isEmpty()) {
            totalElements = rows.size() + (long) offset;
        }

        List<DirectorioGrupoFacturaDTO> resultado = new ArrayList<>();
        Set<Long> grupoIds = new HashSet<>();

        for (Object[] r : rows) {
            DirectorioGrupoFacturaDTO dto = new DirectorioGrupoFacturaDTO();
            Long id = r[0] != null ? ((Number) r[0]).longValue() : null;
            dto.setId(id);
            dto.setTipo(r[1] != null ? r[1].toString() : "FC");
            dto.setLetra(r[2] != null ? r[2].toString() : "");
            dto.setPtovta(r[3] != null ? ((Number) r[3]).intValue() : 0);
            dto.setNumero(r[4] != null ? ((Number) r[4]).intValue() : 0);
            dto.setFecha(convertirALocalDate(r[5]));
            dto.setPeriodo(convertirALocalDate(r[6]));
            dto.setCodigoCobertura(r[7] != null ? r[7].toString() : "");
            dto.setCobertura(r[8] != null ? r[8].toString() : "");
            dto.setAsociadogrupo(r[9] != null ? ((Number) r[9]).longValue() : id);
            dto.setTotalFacturado(r[10] != null ? new BigDecimal(r[10].toString()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
            dto.setIdEstado(r[11] != null ? ((Number) r[11]).intValue() : 1);

            Long idGrupo = dto.getAsociadogrupo() != null ? dto.getAsociadogrupo() : id;
            if (idGrupo != null) {
                grupoIds.add(idGrupo);
            }
            resultado.add(dto);
        }

        // Carga BATCH de todas las familias de cabecera en una sola consulta
        Map<Long, List<Cabecera>> familiaPorGrupo = new HashMap<>();
        Set<Long> ncCabeceraIds = new HashSet<>();
        Set<Long> ndCabeceraIds = new HashSet<>();

        if (!grupoIds.isEmpty()) {
            List<Cabecera> todasLasFamilias = cabeceraRepository.findByGrupoOrAsociadogrupoOrIdIn(grupoIds);
            for (Cabecera c : todasLasFamilias) {
                for (Long gId : grupoIds) {
                    if (Objects.equals(c.getAsociadogrupo(), gId) || Objects.equals(c.getGrupo(), gId) || Objects.equals(c.getId(), gId)) {
                        familiaPorGrupo.computeIfAbsent(gId, k -> new ArrayList<>()).add(c);
                    }
                }
                String t = resolverTipoBase(c.getTipo());
                if ("NC".equalsIgnoreCase(t) && c.getId() != null) {
                    ncCabeceraIds.add(c.getId());
                } else if ("ND".equalsIgnoreCase(t) && c.getId() != null) {
                    ndCabeceraIds.add(c.getId());
                }
            }
        }

        // Carga BATCH de Notas de Crédito
        Map<Long, List<NotaDeCredito>> ncsPorCabeceraId = new HashMap<>();
        if (!ncCabeceraIds.isEmpty()) {
            List<NotaDeCredito> todasNcs = notaDeCreditoRepository.findByCabecera_IdIn(ncCabeceraIds);
            for (NotaDeCredito nc : todasNcs) {
                if (nc.getCabecera() != null && nc.getCabecera().getId() != null) {
                    ncsPorCabeceraId.computeIfAbsent(nc.getCabecera().getId(), k -> new ArrayList<>()).add(nc);
                }
            }
        }

        // Carga BATCH de Notas de Débito
        Map<Long, List<NotaDeDebito>> ndsPorCabeceraId = new HashMap<>();
        if (!ndCabeceraIds.isEmpty()) {
            List<NotaDeDebito> todasNds = notaDeDebitoRepository.findByCabecera_IdIn(ndCabeceraIds);
            for (NotaDeDebito nd : todasNds) {
                if (nd.getCabecera() != null && nd.getCabecera().getId() != null) {
                    ndsPorCabeceraId.computeIfAbsent(nd.getCabecera().getId(), k -> new ArrayList<>()).add(nd);
                }
            }
        }

        // Mapeo en memoria (0 consultas SQL adicionales)
        for (DirectorioGrupoFacturaDTO dto : resultado) {
            Long idGrupo = dto.getAsociadogrupo() != null ? dto.getAsociadogrupo() : dto.getId();
            List<Cabecera> familia = familiaPorGrupo.getOrDefault(idGrupo, Collections.emptyList());
            Set<Long> idsAnuladosGrupo = identificarComprobantesAnulados15Dias(familia, null);

            List<DirectorioComprobanteDTO> derivados = new ArrayList<>();
            BigDecimal sumaAceptado = BigDecimal.ZERO;
            BigDecimal sumaNoAceptado = BigDecimal.ZERO;
            BigDecimal sumaCobranza = BigDecimal.ZERO;
            int cantRefacturaciones = 0;

            for (Cabecera c : familia) {
                if (Objects.equals(c.getId(), dto.getId())) continue; // omitir la propia factura raíz
                if (c.getId() != null && idsAnuladosGrupo.contains(c.getId())) continue; // omitir comprobantes anulados <= 15 días

                String t = resolverTipoBase(c.getTipo());
                DirectorioComprobanteDTO derivado = new DirectorioComprobanteDTO();
                derivado.setId(c.getId());
                derivado.setTipo(c.getTipo());
                derivado.setLetra(c.getLetra());
                derivado.setPtovta(c.getPtovta());
                derivado.setNumero(c.getNumero());
                derivado.setFecha(c.getFecha());

                if ("NC".equalsIgnoreCase(t)) {
                    derivado.setOrigenTipo("DEB");
                    List<NotaDeCredito> ncs = ncsPorCabeceraId.getOrDefault(c.getId(), Collections.emptyList());

                    BigDecimal debAcep = BigDecimal.ZERO;
                    BigDecimal debNoAcep = BigDecimal.ZERO;
                    for (NotaDeCredito nc : ncs) {
                        BigDecimal imp = nc.getImporteDebitado() != null ? nc.getImporteDebitado() : BigDecimal.ZERO;
                        if (Boolean.TRUE.equals(nc.getDebitoaceptado())) {
                            debAcep = debAcep.add(imp);
                        } else {
                            debNoAcep = debNoAcep.add(imp);
                        }
                    }

                    derivado.setDebitoAceptado(debAcep);
                    derivado.setDebitoNoAceptado(debNoAcep);
                    derivado.setTotal(debAcep.add(debNoAcep));
                    sumaAceptado = sumaAceptado.add(debAcep);
                    sumaNoAceptado = sumaNoAceptado.add(debNoAcep);
                } else if ("ND".equalsIgnoreCase(t)) {
                    derivado.setOrigenTipo("REF");
                    cantRefacturaciones++;

                    List<NotaDeDebito> nds = ndsPorCabeceraId.getOrDefault(c.getId(), Collections.emptyList());
                    BigDecimal totalRef = nds.stream()
                            .map(NotaDeDebito::getImporterefactura)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    if (totalRef.compareTo(BigDecimal.ZERO) == 0 && c.getDebe() != null) {
                        totalRef = c.getDebe();
                    }
                    derivado.setRefacturado(totalRef);
                    derivado.setTotal(totalRef);
                } else if ("RC".equalsIgnoreCase(t)) {
                    derivado.setOrigenTipo("COB");
                    BigDecimal montoCob = c.getHaber() != null && c.getHaber().compareTo(BigDecimal.ZERO) > 0 ? c.getHaber()
                            : (c.getDebe() != null ? c.getDebe() : BigDecimal.ZERO);
                    derivado.setTotal(montoCob);
                    sumaCobranza = sumaCobranza.add(montoCob);
                }

                derivados.add(derivado);
            }

            // Ordenar derivados por fecha
            derivados.sort((d1, d2) -> {
                if (d1.getFecha() != null && d2.getFecha() != null) {
                    return d1.getFecha().compareTo(d2.getFecha());
                }
                return 0;
            });

            dto.setComprobantesDerivados(derivados);
            dto.setTotalDebitadoAceptado(sumaAceptado.setScale(2, RoundingMode.HALF_UP));
            dto.setTotalDebitadoNoAceptado(sumaNoAceptado.setScale(2, RoundingMode.HALF_UP));
            dto.setTotalCobranza(sumaCobranza.setScale(2, RoundingMode.HALF_UP));
            dto.setCantidadRefacturaciones(cantRefacturaciones);
        }

        return new PaginatedResponseDTO<>(resultado, totalElements, pageIndex, pageSize);
    }

    public List<DirectorioGrupoFacturaDTO> obtenerGruposFacturas(String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        return obtenerGruposFacturasPaginado(codigoCobertura, tipoDoc, fechaDesde, fechaHasta, 0, 200).getContent();
    }

    private static final String CTE_ANULADOS_15D_CON_FC_MADRE = """
            WITH docs_anulados AS (
                SELECT DISTINCT ca.idcabecera AS id
                FROM comprobantes_anulados ca
                WHERE ca.idcabecera IS NOT NULL
            ),
            docs_anuladores AS (
                -- Caso 1: Factura anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 2: NC anulada por ND
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 3: ND anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
            ),
            pares_anulados_15d AS (
                SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
                FROM cabecera c_nc
                JOIN cabecera c_fac ON (
                    c_nc.asociado = c_fac.id
                    OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                        AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                             OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
                )
                WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(c_fac.debe, 0) > 0
                  AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
                  AND c_fac.fecha IS NOT NULL
                  AND c_nc.fecha IS NOT NULL
                  AND ABS(c_nc.fecha - c_fac.fecha) <= 15
            ),
            ids_anulados_15d AS (
                SELECT id FROM docs_anulados
                UNION
                SELECT id FROM docs_anuladores
                UNION
                SELECT id_fac AS id FROM pares_anulados_15d
                UNION
                SELECT id_nc AS id FROM pares_anulados_15d
            ),
            fc_madre AS (
                SELECT DISTINCT ON (COALESCE(asociadogrupo, grupo))
                    COALESCE(asociadogrupo, grupo) AS gid,
                    periodo,
                    fecha,
                    codigo_cobertura,
                    cobertura,
                    tipo,
                    letra,
                    ptovta,
                    numero
                FROM cabecera
                WHERE UPPER(TRIM(tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(asociadogrupo, grupo) IS NOT NULL
                  AND id NOT IN (SELECT id FROM ids_anulados_15d)
                ORDER BY COALESCE(asociadogrupo, grupo), fecha ASC, id ASC
            )
            """;

    public PaginatedResponseDTO<DirectorioMotivoDebitoDTO> obtenerDistribucionMotivosPaginado(
            String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta, int page, int size) {
        int pageIndex = Math.max(0, page);
        int pageSize = size > 0 ? size : 50;
        int offset = pageIndex * pageSize;

        String nombreCobertura = null;
        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            for (DirectorioCoberturaDTO c : obtenerCoberturasDisponibles()) {
                if (c.getCodigo().equalsIgnoreCase(codigoCobertura.trim())) {
                    nombreCobertura = c.getNombre() != null ? c.getNombre().trim().toLowerCase() : null;
                    break;
                }
            }
        }

        StringBuilder whereSql = new StringBuilder("""
            FROM notadecredito nc
            LEFT JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
            LEFT JOIN amb_liquidado al ON nc.id_prestacion = al.id
            LEFT JOIN cabecera c_fc ON al.idcabecera = c_fc.id
            LEFT JOIN fc_madre fc ON COALESCE(c_nc.asociadogrupo, c_nc.grupo) = fc.gid
            WHERE nc.motivodedebito IS NOT NULL 
              AND TRIM(nc.motivodedebito) <> ''
              AND (c_nc.id IS NULL OR c_nc.id NOT IN (SELECT id FROM ids_anulados_15d))
              AND (c_fc.id IS NULL OR c_fc.id NOT IN (SELECT id FROM ids_anulados_15d))
        """);

        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            if (nombreCobertura != null) {
                whereSql.append(" AND (c_nc.codigo_cobertura = :codigoCobertura OR c_fc.codigo_cobertura = :codigoCobertura OR fc.codigo_cobertura = :codigoCobertura OR LOWER(TRIM(c_nc.cobertura)) = :nombreCob OR LOWER(TRIM(c_fc.cobertura)) = :nombreCob OR LOWER(TRIM(fc.cobertura)) = :nombreCob)");
            } else {
                whereSql.append(" AND (c_nc.codigo_cobertura = :codigoCobertura OR c_fc.codigo_cobertura = :codigoCobertura OR fc.codigo_cobertura = :codigoCobertura)");
            }
        }
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            whereSql.append(" AND (UPPER(TRIM(c_nc.tipo)) = :tipoDoc OR UPPER(TRIM(c_fc.tipo)) = :tipoDoc OR UPPER(TRIM(fc.tipo)) = :tipoDoc)");
        }
        whereSql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_fc.fecha, fc.fecha) IS NOT NULL");
        if (fechaDesde != null) {
            whereSql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_fc.fecha, fc.fecha) >= :fechaDesde");
        }
        if (fechaHasta != null) {
            whereSql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_fc.fecha, fc.fecha) <= :fechaHasta");
        }

        String countSql = CTE_ANULADOS_15D_CON_FC_MADRE + """
            SELECT COUNT(DISTINCT TRIM(nc.motivodedebito)),
                   COALESCE(SUM(COALESCE(nc.importedebitado, 0)), 0)
        """ + whereSql;

        Query qCount = crearQueryConFiltrosDetalle(countSql, null, codigoCobertura, nombreCobertura, tipoDoc, fechaDesde, fechaHasta);

        long totalElements = 0L;
        BigDecimal granTotalDebitado = BigDecimal.ZERO;
        try {
            Object res = qCount.getSingleResult();
            if (res instanceof Object[]) {
                Object[] arr = (Object[]) res;
                if (arr.length > 0 && arr[0] instanceof Number) {
                    totalElements = ((Number) arr[0]).longValue();
                }
                if (arr.length > 1 && arr[1] != null) {
                    granTotalDebitado = new BigDecimal(arr[1].toString());
                }
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener el COUNT/SUM global para motivos: {}", e.getMessage());
        }

        String dataSql = CTE_ANULADOS_15D_CON_FC_MADRE + """
            SELECT TRIM(nc.motivodedebito) AS motivo, 
                   SUM(COALESCE(nc.importedebitado, 0)) AS montoTotal,
                   COUNT(nc.id) AS cantidadCasos
        """ + whereSql + " GROUP BY TRIM(nc.motivodedebito) ORDER BY montoTotal DESC LIMIT :limit OFFSET :offset";

        Query q = crearQueryConFiltrosDetalle(dataSql, null, codigoCobertura, nombreCobertura, tipoDoc, fechaDesde, fechaHasta);
        q.setParameter("limit", pageSize);
        q.setParameter("offset", offset);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();

        List<DirectorioMotivoDebitoDTO> lista = new ArrayList<>();
        BigDecimal sumaPagina = BigDecimal.ZERO;

        if (rows != null) {
            for (Object[] r : rows) {
                String motivo = r[0] != null ? r[0].toString() : "Sin Especificar";
                BigDecimal monto = r[1] != null ? new BigDecimal(r[1].toString()) : BigDecimal.ZERO;
                long casos = r[2] != null ? ((Number) r[2]).longValue() : 0L;
                sumaPagina = sumaPagina.add(monto);
                lista.add(new DirectorioMotivoDebitoDTO(motivo, monto.setScale(2, RoundingMode.HALF_UP), BigDecimal.ZERO, casos));
            }
        }

        if (totalElements == 0 && rows != null && !rows.isEmpty()) {
            totalElements = rows.size() + (long) offset;
        }
        if (granTotalDebitado.compareTo(BigDecimal.ZERO) <= 0) {
            granTotalDebitado = sumaPagina;
        }

        // Calcular porcentajes contra el granTotalDebitado del universo total filtrado
        if (granTotalDebitado.compareTo(BigDecimal.ZERO) > 0) {
            for (DirectorioMotivoDebitoDTO item : lista) {
                BigDecimal porc = item.getMontoTotal()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(granTotalDebitado, 2, RoundingMode.HALF_UP);
                item.setPorcentaje(porc);
            }
        }

        return new PaginatedResponseDTO<>(lista, totalElements, pageIndex, pageSize);
    }

    public List<DirectorioMotivoDebitoDTO> obtenerDistribucionMotivos(String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        return obtenerDistribucionMotivosPaginado(codigoCobertura, tipoDoc, fechaDesde, fechaHasta, 0, 100).getContent();
    }

    public PaginatedResponseDTO<DirectorioPrestacionDetalleDTO> obtenerPrestacionesPorMotivoPaginado(
            String motivo, String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta, int page, int size) {
        int pageIndex = Math.max(0, page);
        int pageSize = size > 0 ? size : 50;
        int offset = pageIndex * pageSize;
        String nombreCobertura = null;
        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            for (DirectorioCoberturaDTO c : obtenerCoberturasDisponibles()) {
                if (c.getCodigo().equalsIgnoreCase(codigoCobertura.trim())) {
                    nombreCobertura = c.getNombre() != null ? c.getNombre().trim().toLowerCase() : null;
                    break;
                }
            }
        }

        StringBuilder sql = new StringBuilder("""
            WITH docs_anulados AS (
                SELECT DISTINCT ca.idcabecera AS id
                FROM comprobantes_anulados ca
                WHERE ca.idcabecera IS NOT NULL
            ),
            docs_anuladores AS (
                -- Caso 1: Factura anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 2: NC anulada por ND
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 3: ND anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
            ),
            pares_anulados_15d AS (
                SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
                FROM cabecera c_nc
                JOIN cabecera c_fac ON (
                    c_nc.asociado = c_fac.id
                    OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                        AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                             OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
                )
                WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(c_fac.debe, 0) > 0
                  AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
                  AND c_fac.fecha IS NOT NULL
                  AND c_nc.fecha IS NOT NULL
                  AND ABS(c_nc.fecha - c_fac.fecha) <= 15
            ),
            ids_anulados_15d AS (
                SELECT id FROM docs_anulados
                UNION
                SELECT id FROM docs_anuladores
                UNION
                SELECT id_fac AS id FROM pares_anulados_15d
                UNION
                SELECT id_nc AS id FROM pares_anulados_15d
            ),
            fc_madre AS (
                SELECT DISTINCT ON (COALESCE(asociadogrupo, grupo))
                    COALESCE(asociadogrupo, grupo) AS gid,
                    periodo,
                    fecha,
                    codigo_cobertura,
                    cobertura,
                    tipo,
                    letra,
                    ptovta,
                    numero
                FROM cabecera
                WHERE UPPER(TRIM(tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(asociadogrupo, grupo) IS NOT NULL
                  AND id NOT IN (SELECT id FROM ids_anulados_15d)
                ORDER BY COALESCE(asociadogrupo, grupo), fecha ASC, id ASC
            )
            SELECT COALESCE(al.id, nc.id) AS id, 
                   al.paciente, al.carnet, al.plan, al.efector, al.medico, al.fecha AS fechaPrestacion,
                   al.codigo, al.descripcion, 
                   COALESCE(c_nc.tipo, c_fc.tipo, fc.tipo) AS tipoDoc, 
                   COALESCE(c_nc.letra, c_fc.letra, fc.letra) AS letraDoc, 
                   COALESCE(c_nc.ptovta, c_fc.ptovta, fc.ptovta) AS ptovtaDoc, 
                   COALESCE(c_nc.numero, c_fc.numero, fc.numero) AS numeroDoc, 
                   COALESCE(c_fc.periodo, fc.periodo, c_nc.periodo, c_fc.fecha, fc.fecha, c_nc.fecha) AS fechaDoc, 
                   nc.motivodedebito, nc.comentarios_debito,
                   nc.importedebitado, nc.debitoaceptado
            FROM notadecredito nc
            LEFT JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
            LEFT JOIN amb_liquidado al ON nc.id_prestacion = al.id
            LEFT JOIN cabecera c_fc ON al.idcabecera = c_fc.id
            LEFT JOIN fc_madre fc ON COALESCE(c_nc.asociadogrupo, c_nc.grupo) = fc.gid
        """);

        if (motivo == null || motivo.trim().isEmpty() || "Sin Especificar".equalsIgnoreCase(motivo.trim()) || "Sin motivo especificado".equalsIgnoreCase(motivo.trim())) {
            sql.append(" WHERE (nc.motivodedebito IS NULL OR TRIM(nc.motivodedebito) = '')");
        } else {
            sql.append(" WHERE LOWER(TRIM(nc.motivodedebito)) = LOWER(TRIM(:motivo))");
        }
        sql.append(" AND (c_nc.id IS NULL OR c_nc.id NOT IN (SELECT id FROM ids_anulados_15d))");
        sql.append(" AND (c_fc.id IS NULL OR c_fc.id NOT IN (SELECT id FROM ids_anulados_15d))");

        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            if (nombreCobertura != null) {
                sql.append(" AND (c_nc.codigo_cobertura = :codigoCobertura OR c_fc.codigo_cobertura = :codigoCobertura OR fc.codigo_cobertura = :codigoCobertura OR LOWER(TRIM(c_nc.cobertura)) = :nombreCob OR LOWER(TRIM(c_fc.cobertura)) = :nombreCob OR LOWER(TRIM(fc.cobertura)) = :nombreCob)");
            } else {
                sql.append(" AND (c_nc.codigo_cobertura = :codigoCobertura OR c_fc.codigo_cobertura = :codigoCobertura OR fc.codigo_cobertura = :codigoCobertura)");
            }
        }
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sql.append(" AND (UPPER(TRIM(c_nc.tipo)) = :tipoDoc OR UPPER(TRIM(c_fc.tipo)) = :tipoDoc OR UPPER(TRIM(fc.tipo)) = :tipoDoc)");
        }
        sql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_fc.fecha, fc.fecha) IS NOT NULL");
        if (fechaDesde != null) {
            sql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_fc.fecha, fc.fecha) >= :fechaDesde");
        }
        if (fechaHasta != null) {
            sql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_fc.fecha, fc.fecha) <= :fechaHasta");
        }
        // Consulta COUNT previa
        String baseSql = sql.toString();
        int idxFrom = baseSql.indexOf("FROM notadecredito nc");
        int idxSelect = idxFrom >= 0 ? baseSql.lastIndexOf("SELECT ", idxFrom) : -1;
        String countSql;
        if (idxSelect >= 0 && idxFrom > idxSelect) {
            countSql = baseSql.substring(0, idxSelect) + "SELECT COUNT(nc.id) " + baseSql.substring(idxFrom);
        } else {
            countSql = CTE_ANULADOS_15D_CON_FC_MADRE + "SELECT COUNT(nc.id) " + (idxFrom >= 0 ? baseSql.substring(idxFrom) : "FROM notadecredito nc");
        }

        long totalElements = 0L;
        try {
            Query qCount = crearQueryConFiltrosDetalle(countSql, motivo, codigoCobertura, nombreCobertura, tipoDoc, fechaDesde, fechaHasta);
            Object countRes = qCount.getSingleResult();
            if (countRes instanceof Number) {
                totalElements = ((Number) countRes).longValue();
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener el COUNT previo para prestaciones por motivo: {}", e.getMessage());
        }

        sql.append(" ORDER BY COALESCE(c_fc.periodo, fc.periodo, c_fc.fecha, fc.fecha) DESC, nc.id DESC LIMIT :limit OFFSET :offset");

        Query q = crearQueryConFiltrosDetalle(sql.toString(), motivo, codigoCobertura, nombreCobertura, tipoDoc, fechaDesde, fechaHasta);
        q.setParameter("limit", pageSize);
        q.setParameter("offset", offset);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();

        if (totalElements == 0 && rows != null && !rows.isEmpty()) {
            totalElements = rows.size() + (long) offset;
        }

        List<DirectorioPrestacionDetalleDTO> lista = new ArrayList<>();

        if (rows != null) {
            for (Object[] r : rows) {
                Integer id = r[0] != null ? ((Number) r[0]).intValue() : null;
                String paciente = r[1] != null ? r[1].toString() : "";
                String carnet = r[2] != null ? r[2].toString() : "";
                String plan = r[3] != null ? r[3].toString() : "";
                String efector = r[4] != null ? r[4].toString() : "";
                String medico = r[5] != null ? r[5].toString() : "";
                LocalDate fechaPrestacion = convertirALocalDate(r[6]);
                String codigo = r[7] != null ? r[7].toString() : "";
                String descripcion = r[8] != null ? r[8].toString() : "";
                String tipoDocumento = r[9] != null ? r[9].toString() : "";
                String letraDoc = r[10] != null ? r[10].toString() : "";
                Integer ptovtaDoc = r[11] != null ? ((Number) r[11]).intValue() : null;
                Integer numeroDoc = r[12] != null ? ((Number) r[12]).intValue() : null;
                LocalDate fechaDoc = convertirALocalDate(r[13]);
                String motivoDebito = r[14] != null ? r[14].toString() : "";
                String comentariosDebito = r[15] != null ? r[15].toString() : "";
                BigDecimal importeDebitado = r[16] != null ? new BigDecimal(r[16].toString()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                Boolean debitoAceptado = r[17] != null ? (Boolean) r[17] : null;

                lista.add(new DirectorioPrestacionDetalleDTO(
                        id, paciente, carnet, plan, efector, medico, fechaPrestacion, codigo, descripcion,
                        tipoDocumento, letraDoc, ptovtaDoc, numeroDoc, fechaDoc, motivoDebito, comentariosDebito,
                        importeDebitado, debitoAceptado
                ));
            }
        }

        return new PaginatedResponseDTO<>(lista, totalElements, pageIndex, pageSize);
    }

    public List<DirectorioPrestacionDetalleDTO> obtenerPrestacionesPorMotivo(String motivo, String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        return obtenerPrestacionesPorMotivoPaginado(motivo, codigoCobertura, tipoDoc, fechaDesde, fechaHasta, 0, 500).getContent();
    }

    private void aplicarFiltrosCabecera(StringBuilder sb, String alias, String codigoCobertura, LocalDate fechaDesde, LocalDate fechaHasta) {
        aplicarFiltrosCabeceraPeriodo(sb, alias, null, codigoCobertura, fechaDesde, fechaHasta);
    }

    private void aplicarFiltrosCabeceraPeriodo(StringBuilder sb, String aliasCabecera, String aliasFcMadre, String codigoCobertura, LocalDate fechaDesde, LocalDate fechaHasta) {
        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            sb.append(" AND ").append(aliasCabecera).append(".codigo_cobertura = :codigoCobertura");
        }
        String exprPeriodo;
        if (aliasFcMadre != null && !aliasFcMadre.trim().isEmpty()) {
            exprPeriodo = String.format("CASE WHEN UPPER(TRIM(%s.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(%s.periodo, %s.fecha) ELSE COALESCE(%s.periodo, %s.fecha) END",
                    aliasCabecera, aliasCabecera, aliasCabecera, aliasFcMadre, aliasFcMadre);
            sb.append(" AND (").append(exprPeriodo).append(") IS NOT NULL");
        } else {
            exprPeriodo = String.format("COALESCE(%s.periodo, %s.fecha)", aliasCabecera, aliasCabecera);
        }

        if (fechaDesde != null) {
            sb.append(" AND ").append(exprPeriodo).append(" >= :fechaDesde");
        }
        if (fechaHasta != null) {
            sb.append(" AND ").append(exprPeriodo).append(" <= :fechaHasta");
        }
    }

    private Query crearQueryConFiltros(String sql, String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        Query q = entityManager.createNativeQuery(sql);
        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            q.setParameter("codigoCobertura", codigoCobertura.trim());
        }
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            q.setParameter("tipoDoc", tipoDoc.trim().toUpperCase());
        }
        if (fechaDesde != null) {
            q.setParameter("fechaDesde", fechaDesde);
        }
        if (fechaHasta != null) {
            q.setParameter("fechaHasta", fechaHasta);
        }
        return q;
    }

    private Query crearQueryConFiltrosDetalle(String sql, String motivo, String codigoCobertura, String nombreCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        Query q = entityManager.createNativeQuery(sql);
        if (motivo != null && !motivo.trim().isEmpty() && !"Sin Especificar".equalsIgnoreCase(motivo.trim()) && !"Sin motivo especificado".equalsIgnoreCase(motivo.trim())) {
            q.setParameter("motivo", motivo.trim());
        }
        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            q.setParameter("codigoCobertura", codigoCobertura.trim());
            if (nombreCobertura != null) {
                q.setParameter("nombreCob", nombreCobertura.toLowerCase());
            }
        }
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            q.setParameter("tipoDoc", tipoDoc.trim().toUpperCase());
        }
        if (fechaDesde != null) {
            q.setParameter("fechaDesde", fechaDesde);
        }
        if (fechaHasta != null) {
            q.setParameter("fechaHasta", fechaHasta);
        }
        return q;
    }

    private String resolverTipoBase(String tipo) {
        if (tipo == null || tipo.trim().isEmpty()) return "";
        String t = tipo.trim().toUpperCase();
        if ("NC".equals(t) || "NCE".equals(t) || "NCB".equals(t) || "NCA".equals(t)) return "NC";
        if ("ND".equals(t) || "NDE".equals(t) || "NDB".equals(t) || "NDA".equals(t)) return "ND";
        if ("FC".equals(t) || "FAC".equals(t) || "FCE".equals(t) || "FCA".equals(t) || "FCB".equals(t)) return "FC";
        if ("RC".equals(t) || "RCB".equals(t) || "RCA".equals(t) || "REC".equals(t)) return "RC";
        return t;
    }

    private LocalDate convertirALocalDate(Object obj) {
        if (obj == null) return null;
        if (obj instanceof LocalDate ld) return ld;
        if (obj instanceof java.sql.Date sqld) return sqld.toLocalDate();
        if (obj instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toLocalDate();
        if (obj instanceof java.util.Date d) return d.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
        try {
            return LocalDate.parse(obj.toString());
        } catch (Exception e) {
            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Gráficos financieros
    // -------------------------------------------------------------------------

    /**
     * 1. TABLA: Resumen de Cartera y Balance Financiero por Financiador.
     */
    public List<BalanceFinanciadorDTO> obtenerBalanceFinanciero() {
        return obtenerBalanceFinanciero(null, null, null, null);
    }

    @Cacheable(CacheConfig.CACHE_BALANCE)
    public List<BalanceFinanciadorDTO> obtenerBalanceFinanciero(String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        StringBuilder sql = new StringBuilder("""
            WITH docs_anulados AS (
                SELECT DISTINCT ca.idcabecera AS id
                FROM comprobantes_anulados ca
                WHERE ca.idcabecera IS NOT NULL
            ),
            docs_anuladores AS (
                -- Caso 1: Factura anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 2: NC anulada por ND
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 3: ND anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
            ),
            pares_anulados_15d AS (
                SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
                FROM cabecera c_nc
                JOIN cabecera c_fac ON (
                    c_nc.asociado = c_fac.id
                    OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                        AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                             OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
                )
                WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(c_fac.debe, 0) > 0
                  AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
                  AND c_fac.fecha IS NOT NULL
                  AND c_nc.fecha IS NOT NULL
                  AND ABS(c_nc.fecha - c_fac.fecha) <= 15
            ),
            ids_anulados_15d AS (
                SELECT id FROM docs_anulados
                UNION
                SELECT id FROM docs_anuladores
                UNION
                SELECT id_fac AS id FROM pares_anulados_15d
                UNION
                SELECT id_nc AS id FROM pares_anulados_15d
            ),
            fc_madre AS (
                SELECT DISTINCT ON (COALESCE(asociadogrupo, grupo))
                    COALESCE(asociadogrupo, grupo) AS gid,
                    periodo,
                    fecha
                FROM cabecera
                WHERE UPPER(TRIM(tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(asociadogrupo, grupo) IS NOT NULL
                  AND id NOT IN (SELECT id FROM ids_anulados_15d)
                ORDER BY COALESCE(asociadogrupo, grupo), fecha ASC, id ASC
            )
            SELECT 
                COALESCE(NULLIF(TRIM(c.codigo_cobertura), ''), 'S/C') || ' - ' || COALESCE(NULLIF(TRIM(c.cobertura), ''), 'Sin financiador') AS financiador,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) AS facturacion_fc,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') AND EXISTS (
                    SELECT 1 FROM cabecera c_fac WHERE c_fac.id = c.asociado AND UPPER(TRIM(c_fac.tipo)) LIKE '%F%'
                ) THEN c.debe ELSE 0 END), 0) AS incrementos_nd,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS debitos_nc,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') AND EXISTS (
                    SELECT 1 FROM cabecera c_nc WHERE c_nc.id = c.asociado AND UPPER(TRIM(c_nc.tipo)) LIKE '%N%'
                ) THEN c.debe ELSE 0 END), 0) AS refacturado_nd,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS cobrado_rc,
                (
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) +
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0) -
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) -
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0)
                ) AS saldo_pendiente
            FROM cabecera c
            LEFT JOIN fc_madre fc ON COALESCE(c.asociadogrupo, c.grupo) = fc.gid
            WHERE (
                CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(c.periodo, c.fecha)
                     ELSE COALESCE(fc.periodo, fc.fecha)
                END
            ) IS NOT NULL
              AND c.id NOT IN (SELECT id FROM ids_anulados_15d)
        """);

        aplicarFiltrosCabeceraPeriodo(sql, "c", "fc", codigoCobertura, fechaDesde, fechaHasta);
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sql.append(" AND UPPER(TRIM(c.tipo)) = :tipoDoc");
        }

        sql.append("""
            GROUP BY 1
            HAVING (
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) <> 0
                OR COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0) <> 0
                OR COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) <> 0
                OR COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) <> 0
            )
            ORDER BY saldo_pendiente DESC, facturacion_fc DESC
        """);

        Query q = crearQueryConFiltros(sql.toString(), codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        List<Object[]> rows = q.getResultList();
        List<BalanceFinanciadorDTO> lista = new ArrayList<>();
        for (Object[] r : rows) {
            String financiador = r[0] != null ? r[0].toString().trim() : "Sin financiador";
            BigDecimal facturacionFc = r[1] != null ? new BigDecimal(r[1].toString()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal incrementosNd = r[2] != null ? new BigDecimal(r[2].toString()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal debitosNc = r[3] != null ? new BigDecimal(r[3].toString()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal refacturadoNd = r[4] != null ? new BigDecimal(r[4].toString()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal cobradoRc = r[5] != null ? new BigDecimal(r[5].toString()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal saldoPendiente = r[6] != null ? new BigDecimal(r[6].toString()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

            lista.add(new BalanceFinanciadorDTO(
                financiador, facturacionFc, incrementosNd, debitosNc, refacturadoNd, cobradoRc, saldoPendiente
            ));
        }
        return lista;
    }

    /**
     * 2. DONUT: Distribución de Cartera por Financiador (solo saldos positivos).
     */
    public List<PuntoDonutDTO> obtenerDistribucionCarteraDonut() {
        return obtenerDistribucionCarteraDonut(null, null, null, null);
    }

    @Cacheable(CacheConfig.CACHE_DONUT)
    public List<PuntoDonutDTO> obtenerDistribucionCarteraDonut(String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        StringBuilder sql = new StringBuilder("""
            WITH docs_anulados AS (
                SELECT DISTINCT ca.idcabecera AS id
                FROM comprobantes_anulados ca
                WHERE ca.idcabecera IS NOT NULL
            ),
            docs_anuladores AS (
                -- Caso 1: Factura anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 2: NC anulada por ND
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 3: ND anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
            ),
            pares_anulados_15d AS (
                SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
                FROM cabecera c_nc
                JOIN cabecera c_fac ON (
                    c_nc.asociado = c_fac.id
                    OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                        AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                             OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
                )
                WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(c_fac.debe, 0) > 0
                  AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
                  AND c_fac.fecha IS NOT NULL
                  AND c_nc.fecha IS NOT NULL
                  AND ABS(c_nc.fecha - c_fac.fecha) <= 15
            ),
            ids_anulados_15d AS (
                SELECT id FROM docs_anulados
                UNION
                SELECT id FROM docs_anuladores
                UNION
                SELECT id_fac AS id FROM pares_anulados_15d
                UNION
                SELECT id_nc AS id FROM pares_anulados_15d
            ),
            fc_madre AS (
                SELECT DISTINCT ON (COALESCE(asociadogrupo, grupo))
                    COALESCE(asociadogrupo, grupo) AS gid,
                    periodo,
                    fecha
                FROM cabecera
                WHERE UPPER(TRIM(tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(asociadogrupo, grupo) IS NOT NULL
                  AND id NOT IN (SELECT id FROM ids_anulados_15d)
                ORDER BY COALESCE(asociadogrupo, grupo), fecha ASC, id ASC
            )
            SELECT 
                COALESCE(NULLIF(TRIM(c.codigo_cobertura), ''), 'S/C') || ' - ' || COALESCE(NULLIF(TRIM(c.cobertura), ''), 'Sin financiador') AS financiador,
                (
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) +
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0) -
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) -
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0)
                ) AS saldo
            FROM cabecera c
            LEFT JOIN fc_madre fc ON COALESCE(c.asociadogrupo, c.grupo) = fc.gid
            WHERE (
                CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(c.periodo, c.fecha)
                     ELSE COALESCE(fc.periodo, fc.fecha)
                END
            ) IS NOT NULL
              AND c.id NOT IN (SELECT id FROM ids_anulados_15d)
        """);

        aplicarFiltrosCabeceraPeriodo(sql, "c", "fc", codigoCobertura, fechaDesde, fechaHasta);
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sql.append(" AND UPPER(TRIM(c.tipo)) = :tipoDoc");
        }

        sql.append("""
            GROUP BY 1
            HAVING (
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0)
            ) > 0
            ORDER BY saldo DESC
        """);

        Query q = crearQueryConFiltros(sql.toString(), codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        List<Object[]> rows = q.getResultList();
        List<PuntoDonutDTO> lista = new ArrayList<>();
        for (Object[] r : rows) {
            String financiador = r[0] != null ? r[0].toString().trim() : "Sin financiador";
            BigDecimal saldo = r[1] != null ? new BigDecimal(r[1].toString()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            lista.add(new PuntoDonutDTO(financiador, saldo));
        }
        return lista;
    }

    /**
     * Distribución de cartera: saldo pendiente por financiador (Dataset tradicional).
     */
    public DatasetGraficoDTO getDistribucionCartera() {
        return getDistribucionCartera(null, null, null, null);
    }

    @Cacheable(CacheConfig.CACHE_DISTRIBUCION)
    public DatasetGraficoDTO getDistribucionCartera(String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        List<PuntoDonutDTO> donuts = obtenerDistribucionCarteraDonut(codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        List<PuntoGraficoDTO> puntos = new ArrayList<>();
        for (PuntoDonutDTO p : donuts) {
            puntos.add(new PuntoGraficoDTO(p.getEtiqueta(), p.getSaldo()));
        }
        return new DatasetGraficoDTO("Saldo por Financiador", puntos);
    }

    /**
     * Evolución mensual: 3 datasets (Facturación, Débitos, Cobranzas) agrupados por período YYYY-MM.
     * Cada dataset tiene un PuntoGraficoDTO por mes con etiqueta=período y valor=monto.
     */
    public List<DatasetGraficoDTO> getEvolucionMensual() {
        return getEvolucionMensual(null, null, null, null);
    }

    @Cacheable(CacheConfig.CACHE_EVOLUCION)
    public List<DatasetGraficoDTO> getEvolucionMensual(String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        LocalDate fDesdeEfectiva = fechaDesde;
        LocalDate fHastaEfectiva = fechaHasta;

        if (fDesdeEfectiva != null && fHastaEfectiva != null) {
            boolean mismoMes = fDesdeEfectiva.getYear() == fHastaEfectiva.getYear() 
                    && fDesdeEfectiva.getMonthValue() == fHastaEfectiva.getMonthValue();
            if (mismoMes) {
                // Si el filtro abarca un único mes (ej. mes anterior por defecto),
                // se genera una ventana móvil de los 12 meses culminando en fechaHasta.
                fDesdeEfectiva = fHastaEfectiva.minusMonths(11).withDayOfMonth(1);
            }
        }

        StringBuilder sql = new StringBuilder("""
            WITH docs_anulados AS (
                SELECT DISTINCT ca.idcabecera AS id
                FROM comprobantes_anulados ca
                WHERE ca.idcabecera IS NOT NULL
            ),
            docs_anuladores AS (
                -- Caso 1: Factura anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 2: NC anulada por ND
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 3: ND anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
            ),
            pares_anulados_15d AS (
                SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
                FROM cabecera c_nc
                JOIN cabecera c_fac ON (
                    c_nc.asociado = c_fac.id
                    OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                        AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                             OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
                )
                WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(c_fac.debe, 0) > 0
                  AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
                  AND c_fac.fecha IS NOT NULL
                  AND c_nc.fecha IS NOT NULL
                  AND ABS(c_nc.fecha - c_fac.fecha) <= 15
            ),
            ids_anulados_15d AS (
                SELECT id FROM docs_anulados
                UNION
                SELECT id FROM docs_anuladores
                UNION
                SELECT id_fac AS id FROM pares_anulados_15d
                UNION
                SELECT id_nc AS id FROM pares_anulados_15d
            ),
            fc_madre AS (
                SELECT DISTINCT ON (COALESCE(asociadogrupo, grupo))
                    COALESCE(asociadogrupo, grupo) AS gid,
                    periodo,
                    fecha
                FROM cabecera
                WHERE UPPER(TRIM(tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(asociadogrupo, grupo) IS NOT NULL
                  AND id NOT IN (SELECT id FROM ids_anulados_15d)
                ORDER BY COALESCE(asociadogrupo, grupo), fecha ASC, id ASC
            )
            SELECT 
                TO_CHAR(
                    CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(c.periodo, c.fecha)
                         ELSE COALESCE(fc.periodo, fc.fecha)
                    END
                , 'YYYY-MM') AS periodo,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) AS facturado,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS debitos,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS cobrado
            FROM cabecera c
            LEFT JOIN fc_madre fc ON COALESCE(c.asociadogrupo, c.grupo) = fc.gid
            WHERE (
                CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(c.periodo, c.fecha)
                     ELSE COALESCE(fc.periodo, fc.fecha)
                END
            ) IS NOT NULL
              AND c.id NOT IN (SELECT id FROM ids_anulados_15d)
        """);

        aplicarFiltrosCabeceraPeriodo(sql, "c", "fc", codigoCobertura, fDesdeEfectiva, fHastaEfectiva);
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sql.append(" AND UPPER(TRIM(c.tipo)) = :tipoDoc");
        }

        sql.append("""
            GROUP BY 1
            ORDER BY 1 ASC
        """);

        Query q = crearQueryConFiltros(sql.toString(), codigoCobertura, tipoDoc, fDesdeEfectiva, fHastaEfectiva);

        List<Object[]> rows = q.getResultList();

        Map<String, BigDecimal[]> mapaMeses = new LinkedHashMap<>();
        if (fDesdeEfectiva != null && fHastaEfectiva != null) {
            LocalDate cursor = fDesdeEfectiva.withDayOfMonth(1);
            LocalDate fin = fHastaEfectiva.withDayOfMonth(1);
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
            while (!cursor.isAfter(fin)) {
                mapaMeses.put(cursor.format(fmt), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
                cursor = cursor.plusMonths(1);
            }
        }

        for (Object[] row : rows) {
            String periodo = row[0] != null ? row[0].toString() : "";
            BigDecimal mtoFc = row[1] != null ? new BigDecimal(row[1].toString()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal mtoNc = row[2] != null ? new BigDecimal(row[2].toString()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal mtoRc = row[3] != null ? new BigDecimal(row[3].toString()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

            mapaMeses.put(periodo, new BigDecimal[]{mtoFc, mtoNc, mtoRc});
        }

        List<PuntoGraficoDTO> facturacion = new ArrayList<>();
        List<PuntoGraficoDTO> debitos     = new ArrayList<>();
        List<PuntoGraficoDTO> cobranzas   = new ArrayList<>();

        for (Map.Entry<String, BigDecimal[]> entry : mapaMeses.entrySet()) {
            String mes = entry.getKey();
            BigDecimal[] vals = entry.getValue();
            facturacion.add(new PuntoGraficoDTO(mes, vals[0]));
            debitos.add(new PuntoGraficoDTO(mes, vals[1]));
            cobranzas.add(new PuntoGraficoDTO(mes, vals[2]));
        }

        return List.of(
            new DatasetGraficoDTO("Facturación", facturacion),
            new DatasetGraficoDTO("Débitos",     debitos),
            new DatasetGraficoDTO("Cobranzas",   cobranzas)
        );
    }

    /**
     * Aging financiero: saldo pendiente de FC agrupado por rango de antigüedad.
     * Devuelve un único DatasetGraficoDTO con título "Saldo en Mora".
     * Cada PuntoGraficoDTO: etiqueta=rango ('0-30 días', etc.), valor=saldo.
     */
    @Cacheable(CacheConfig.CACHE_AGING)
    public DatasetGraficoDTO getAgingFinanciero() {
        List<Object[]> rows = cabeceraRepository.obtenerAgingFinanciero();
        List<PuntoGraficoDTO> puntos = new ArrayList<>();
        for (Object[] row : rows) {
            String rango = row[0] != null ? row[0].toString().trim() : "Sin rango";
            BigDecimal saldo = row[1] != null
                    ? new BigDecimal(row[1].toString()).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            puntos.add(new PuntoGraficoDTO(rango, saldo));
        }
        return new DatasetGraficoDTO("Saldo en Mora", puntos);
    }

    /**
     * Tiempos de Cobranza: métricas de DSO global, cobro real promedio,
     * saldo total en mora y desglose en 5 rangos de antigüedad.
     */
    public TiemposCobranzaDTO getTiemposCobranza() {
        return getTiemposCobranza(null, null, null, null);
    }

    @Cacheable(CacheConfig.CACHE_TIEMPOS)
    public TiemposCobranzaDTO getTiemposCobranza(String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        String nombreCobertura = null;
        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            for (DirectorioCoberturaDTO c : obtenerCoberturasDisponibles()) {
                if (c.getCodigo().equalsIgnoreCase(codigoCobertura.trim())) {
                    nombreCobertura = c.getNombre() != null ? c.getNombre().trim().toLowerCase() : null;
                    break;
                }
            }
        }

        // 1. Cobranzas por plazo (recibos) y Deuda pendiente (Aún no cobrados)
        StringBuilder sql = new StringBuilder("""
            WITH docs_anulados AS (
                SELECT DISTINCT ca.idcabecera AS id
                FROM comprobantes_anulados ca
                WHERE ca.idcabecera IS NOT NULL
            ),
            docs_anuladores AS (
                -- Caso 1: Factura anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 2: NC anulada por ND
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 3: ND anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
            ),
            pares_anulados_15d AS (
                SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
                FROM cabecera c_nc
                JOIN cabecera c_fac ON (
                    c_nc.asociado = c_fac.id
                    OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                        AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                             OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
                )
                WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(c_fac.debe, 0) > 0
                  AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
                  AND c_fac.fecha IS NOT NULL
                  AND c_nc.fecha IS NOT NULL
                  AND ABS(c_nc.fecha - c_fac.fecha) <= 15
            ),
            ids_anulados_15d AS (
                SELECT id FROM docs_anulados
                UNION
                SELECT id FROM docs_anuladores
                UNION
                SELECT id_fac AS id FROM pares_anulados_15d
                UNION
                SELECT id_nc AS id FROM pares_anulados_15d
            ),
            facturas AS (
                SELECT 
                    COALESCE(c.asociadogrupo, c.grupo, c.asociado, c.id) AS id_familia,
                    MIN(c.fecha) AS fecha_emision,
                    MIN(c.periodo) AS periodo_emision,
                    MAX(c.codigo_cobertura) AS codigo_cobertura,
                    MAX(c.cobertura) AS cobertura,
                    MAX(UPPER(TRIM(c.tipo))) AS tipo_doc
                FROM cabecera c
                WHERE UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND c.fecha IS NOT NULL
                  AND c.id NOT IN (SELECT id FROM ids_anulados_15d)
                GROUP BY COALESCE(c.asociadogrupo, c.grupo, c.asociado, c.id)
            ),
            recibos AS (
                SELECT 
                    c.id,
                    COALESCE(c.asociadogrupo, c.grupo, c.asociado, c.id) AS id_familia,
                    c.fecha AS fecha_pago,
                    COALESCE(CASE WHEN c.haber > 0 THEN c.haber WHEN c.debe > 0 THEN c.debe ELSE 0 END, 0) AS monto_recibo
                FROM cabecera c
                WHERE UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP')
                  AND c.fecha IS NOT NULL
                  AND (c.haber > 0 OR c.debe > 0)
                  AND c.id NOT IN (SELECT id FROM ids_anulados_15d)
            ),
            familia_saldo AS (
                SELECT 
                    COALESCE(c.asociadogrupo, c.grupo, c.asociado, c.id) AS id_familia,
                    MIN(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.fecha END) AS fecha_emision,
                    MIN(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.periodo END) AS periodo_emision,
                    MAX(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.codigo_cobertura END) AS codigo_cobertura,
                    MAX(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.cobertura END) AS cobertura,
                    MAX(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN UPPER(TRIM(c.tipo)) END) AS tipo_doc,
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA','ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0)
                    - COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP','NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS saldo_vivo
                FROM cabecera c
                WHERE c.id NOT IN (SELECT id FROM ids_anulados_15d)
                GROUP BY COALESCE(c.asociadogrupo, c.grupo, c.asociado, c.id)
                HAVING MIN(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.fecha END) IS NOT NULL
                   AND (
                        COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA','ND','NDE','NDA','NDB') THEN c.debe ELSE 0 END), 0)
                        - COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP','NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0)
                   ) > 0
            )
            SELECT 
                'COBRADO' AS tipo_registro,
                GREATEST(0, CAST(r.fecha_pago - f.fecha_emision AS INTEGER)) AS dias,
                r.monto_recibo AS monto
            FROM recibos r
            JOIN facturas f ON r.id_familia = f.id_familia
            WHERE 1=1
        """);

        StringBuilder sqlFilterF = new StringBuilder();
        StringBuilder sqlFilterFs = new StringBuilder();

        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sqlFilterF.append(" AND f.tipo_doc = :tipoDoc");
            sqlFilterFs.append(" AND fs.tipo_doc = :tipoDoc");
        }
        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            if (nombreCobertura != null) {
                sqlFilterF.append(" AND (f.codigo_cobertura = :codigoCobertura OR LOWER(TRIM(f.cobertura)) = :nombreCob)");
                sqlFilterFs.append(" AND (fs.codigo_cobertura = :codigoCobertura OR LOWER(TRIM(fs.cobertura)) = :nombreCob)");
            } else {
                sqlFilterF.append(" AND f.codigo_cobertura = :codigoCobertura");
                sqlFilterFs.append(" AND fs.codigo_cobertura = :codigoCobertura");
            }
        }
        if (fechaDesde != null) {
            sqlFilterF.append(" AND COALESCE(f.periodo_emision, f.fecha_emision) >= :fechaDesde");
            sqlFilterFs.append(" AND COALESCE(fs.periodo_emision, fs.fecha_emision) >= :fechaDesde");
        }
        if (fechaHasta != null) {
            sqlFilterF.append(" AND COALESCE(f.periodo_emision, f.fecha_emision) <= :fechaHasta");
            sqlFilterFs.append(" AND COALESCE(fs.periodo_emision, fs.fecha_emision) <= :fechaHasta");
        }

        sql.append(sqlFilterF);
        sql.append("""
            
            UNION ALL
            
            SELECT 
                'PENDIENTE' AS tipo_registro,
                GREATEST(0, CAST(CURRENT_DATE - fs.fecha_emision AS INTEGER)) AS dias,
                fs.saldo_vivo AS monto
            FROM familia_saldo fs
            WHERE 1=1
        """);
        sql.append(sqlFilterFs);

        Query q = entityManager.createNativeQuery(sql.toString());
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            q.setParameter("tipoDoc", tipoDoc.trim().toUpperCase());
        }
        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            q.setParameter("codigoCobertura", codigoCobertura.trim());
            if (nombreCobertura != null) {
                q.setParameter("nombreCob", nombreCobertura);
            }
        }
        if (fechaDesde != null) {
            q.setParameter("fechaDesde", fechaDesde);
        }
        if (fechaHasta != null) {
            q.setParameter("fechaHasta", fechaHasta);
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();

        String[] nombresRangos = {
            "De 0 a 30 días",
            "De 31 a 60 días",
            "De 61 a 90 días",
            "De 91 a 180 días",
            "Más de 180 días",
            "Aún no cobrados"
        };

        int[] cantidades = new int[6];
        BigDecimal[] saldos = new BigDecimal[6];
        for (int i = 0; i < 6; i++) {
            saldos[i] = BigDecimal.ZERO;
        }

        BigDecimal saldoTotalMora = BigDecimal.ZERO;
        BigDecimal sumatoriaPonderadaDso = BigDecimal.ZERO;
        BigDecimal sumatoriaPonderadaCobro = BigDecimal.ZERO;
        BigDecimal totalCobrado = BigDecimal.ZERO;

        for (Object[] row : rows) {
            if (row == null) continue;
            String tipo = "PENDIENTE";
            int dias = 0;
            BigDecimal monto = BigDecimal.ZERO;

            if (row.length >= 3 && row[0] != null && row[1] != null && row[2] != null) {
                tipo = row[0].toString();
                dias = Math.max(0, ((Number) row[1]).intValue());
                monto = new BigDecimal(row[2].toString()).setScale(2, RoundingMode.HALF_UP);
            } else if (row.length == 2 && row[0] != null && row[1] != null) {
                // Compatibilidad con pruebas unitarias de 2 columnas [dias, saldo]
                dias = Math.max(0, ((Number) row[0]).intValue());
                monto = new BigDecimal(row[1].toString()).setScale(2, RoundingMode.HALF_UP);
                tipo = "PENDIENTE";
            } else {
                continue;
            }

            if (monto.compareTo(BigDecimal.ZERO) <= 0) continue;

            if ("PENDIENTE".equalsIgnoreCase(tipo)) {
                cantidades[5]++;
                saldos[5] = saldos[5].add(monto);
                saldoTotalMora = saldoTotalMora.add(monto);
                sumatoriaPonderadaDso = sumatoriaPonderadaDso.add(monto.multiply(BigDecimal.valueOf(dias)));
            } else {
                totalCobrado = totalCobrado.add(monto);
                sumatoriaPonderadaCobro = sumatoriaPonderadaCobro.add(monto.multiply(BigDecimal.valueOf(dias)));

                int idx;
                if (dias <= 30) {
                    idx = 0;
                } else if (dias <= 60) {
                    idx = 1;
                } else if (dias <= 90) {
                    idx = 2;
                } else if (dias <= 180) {
                    idx = 3;
                } else {
                    idx = 4;
                }

                cantidades[idx]++;
                saldos[idx] = saldos[idx].add(monto);
            }
        }

        Integer dsoGlobal = 0;
        if (saldoTotalMora.compareTo(BigDecimal.ZERO) > 0) {
            dsoGlobal = sumatoriaPonderadaDso.divide(saldoTotalMora, 0, RoundingMode.HALF_UP).intValue();
        }

        Integer cobroRealPromedio = 0;
        if (totalCobrado.compareTo(BigDecimal.ZERO) > 0) {
            cobroRealPromedio = sumatoriaPonderadaCobro.divide(totalCobrado, 0, RoundingMode.HALF_UP).intValue();
        }

        BigDecimal totalGeneral = BigDecimal.ZERO;
        for (int i = 0; i < 6; i++) {
            totalGeneral = totalGeneral.add(saldos[i]);
        }

        List<RangoAntiguedadDTO> detalles = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            BigDecimal saldoRango = saldos[i];
            BigDecimal pct = BigDecimal.ZERO;
            if (totalGeneral.compareTo(BigDecimal.ZERO) > 0) {
                pct = saldoRango.multiply(BigDecimal.valueOf(100))
                        .divide(totalGeneral, 1, RoundingMode.HALF_UP);
            }
            detalles.add(new RangoAntiguedadDTO(
                nombresRangos[i],
                cantidades[i],
                saldoRango,
                pct
            ));
        }

        return new TiemposCobranzaDTO(
            dsoGlobal,
            cobroRealPromedio,
            saldoTotalMora.setScale(2, RoundingMode.HALF_UP),
            detalles
        );
    }

    /**
     * Pareto de glosas (motivos de débito): top 10 por monto.
     * Devuelve exactamente 2 DatasetGraficoDTO:
     *   [0] "Refacturado" → índice [1] del Object[]
     *   [1] "Pérdida"     → índice [2] del Object[]
     * La etiqueta de cada PuntoGraficoDTO es el nombre del motivo.
     */
    public List<DatasetGraficoDTO> getParetoMotivos() {
        return getParetoMotivos(null, null, null, null);
    }

    @Cacheable(CacheConfig.CACHE_MOTIVOS)
    public List<DatasetGraficoDTO> getParetoMotivos(String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        String nombreCobertura = null;
        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            for (DirectorioCoberturaDTO c : obtenerCoberturasDisponibles()) {
                if (c.getCodigo().equalsIgnoreCase(codigoCobertura.trim())) {
                    nombreCobertura = c.getNombre() != null ? c.getNombre().trim().toLowerCase() : null;
                    break;
                }
            }
        }

        StringBuilder sql = new StringBuilder("""
            WITH docs_anulados AS (
                SELECT DISTINCT ca.idcabecera AS id
                FROM comprobantes_anulados ca
                WHERE ca.idcabecera IS NOT NULL
            ),
            docs_anuladores AS (
                -- Caso 1: Factura anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 2: NC anulada por ND
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                UNION
                -- Caso 3: ND anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
            ),
            pares_anulados_15d AS (
                SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
                FROM cabecera c_nc
                JOIN cabecera c_fac ON (
                    c_nc.asociado = c_fac.id
                    OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                        AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                             OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
                )
                WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(c_fac.debe, 0) > 0
                  AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
                  AND c_fac.fecha IS NOT NULL
                  AND c_nc.fecha IS NOT NULL
                  AND ABS(c_nc.fecha - c_fac.fecha) <= 15
            ),
            ids_anulados_15d AS (
                SELECT id FROM docs_anulados
                UNION
                SELECT id FROM docs_anuladores
                UNION
                SELECT id_fac AS id FROM pares_anulados_15d
                UNION
                SELECT id_nc AS id FROM pares_anulados_15d
            ),
            fc_madre AS (
                SELECT DISTINCT ON (COALESCE(asociadogrupo, grupo))
                    COALESCE(asociadogrupo, grupo) AS gid,
                    periodo,
                    fecha,
                    codigo_cobertura,
                    cobertura,
                    tipo
                FROM cabecera
                WHERE UPPER(TRIM(tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(asociadogrupo, grupo) IS NOT NULL
                  AND id NOT IN (SELECT id FROM ids_anulados_15d)
                ORDER BY COALESCE(asociadogrupo, grupo), fecha ASC, id ASC
            )
            SELECT
              COALESCE(NULLIF(TRIM(nc.motivodedebito), ''), 'Sin motivo especificado') AS motivo,
              SUM(COALESCE(nc.importederefactura, 0)) AS refacturado,
              SUM(CASE WHEN nc.debitoaceptado = true THEN COALESCE(nc.importedebitado, 0) ELSE 0 END) AS perdida
            FROM notadecredito nc
            LEFT JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
            LEFT JOIN amb_liquidado al ON nc.id_prestacion = al.id
            LEFT JOIN cabecera c_fc ON al.idcabecera = c_fc.id
            LEFT JOIN fc_madre fc ON COALESCE(c_nc.asociadogrupo, c_nc.grupo) = fc.gid
            WHERE nc.motivodedebito IS NOT NULL AND TRIM(nc.motivodedebito) <> ''
              AND (c_nc.id IS NULL OR c_nc.id NOT IN (SELECT id FROM ids_anulados_15d))
              AND (c_fc.id IS NULL OR c_fc.id NOT IN (SELECT id FROM ids_anulados_15d))
        """);

        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            if (nombreCobertura != null) {
                sql.append(" AND (c_nc.codigo_cobertura = :codigoCobertura OR c_fc.codigo_cobertura = :codigoCobertura OR fc.codigo_cobertura = :codigoCobertura OR LOWER(TRIM(c_nc.cobertura)) = :nombreCob OR LOWER(TRIM(c_fc.cobertura)) = :nombreCob OR LOWER(TRIM(fc.cobertura)) = :nombreCob)");
            } else {
                sql.append(" AND (c_nc.codigo_cobertura = :codigoCobertura OR c_fc.codigo_cobertura = :codigoCobertura OR fc.codigo_cobertura = :codigoCobertura)");
            }
        }
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sql.append(" AND (UPPER(TRIM(c_nc.tipo)) = :tipoDoc OR UPPER(TRIM(c_fc.tipo)) = :tipoDoc OR UPPER(TRIM(fc.tipo)) = :tipoDoc)");
        }
        sql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_fc.fecha, fc.fecha) IS NOT NULL");
        if (fechaDesde != null) {
            sql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_fc.fecha, fc.fecha) >= :fechaDesde");
        }
        if (fechaHasta != null) {
            sql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_fc.fecha, fc.fecha) <= :fechaHasta");
        }

        sql.append("""
            GROUP BY 1
            ORDER BY (SUM(COALESCE(nc.importederefactura, 0)) + SUM(CASE WHEN nc.debitoaceptado = true THEN COALESCE(nc.importedebitado, 0) ELSE 0 END)) DESC, 2 DESC
            LIMIT 10
        """);

        Query q = entityManager.createNativeQuery(sql.toString());
        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            q.setParameter("codigoCobertura", codigoCobertura.trim());
            if (nombreCobertura != null) {
                q.setParameter("nombreCob", nombreCobertura.toLowerCase());
            }
        }
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            q.setParameter("tipoDoc", tipoDoc.trim().toUpperCase());
        }
        if (fechaDesde != null) {
            q.setParameter("fechaDesde", fechaDesde);
        }
        if (fechaHasta != null) {
            q.setParameter("fechaHasta", fechaHasta);
        }

        List<Object[]> rows = q.getResultList();

        List<PuntoGraficoDTO> refacturado = new ArrayList<>();
        List<PuntoGraficoDTO> perdida     = new ArrayList<>();

        for (Object[] row : rows) {
            String motivo = row[0] != null ? row[0].toString().trim() : "Sin motivo";
            BigDecimal mtoRef = row[1] != null
                    ? new BigDecimal(row[1].toString()).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            BigDecimal mtoPer = row[2] != null
                    ? new BigDecimal(row[2].toString()).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            refacturado.add(new PuntoGraficoDTO(motivo, mtoRef));
            perdida.add(new PuntoGraficoDTO(motivo, mtoPer));
        }

        return List.of(
            new DatasetGraficoDTO("Refacturado", refacturado),
            new DatasetGraficoDTO("Pérdida",     perdida)
        );
    }

    /**
     * Cuenta Corriente a 3 Niveles:
     * Nivel 1: Financiador (ordenado por saldo descendente)
     * Nivel 2: Período YYYY-MM (ordenado cronológicamente inverso)
     * Nivel 3: Comprobantes detallados (FC, ND, NC, RC)
     *
     * Agrupa y calcula los saldos y acumuladores mediante Java Streams (Collectors.groupingBy).
     */
    public List<CcFinanciadorDTO> getCuentaCorrienteTresNiveles(String financiadorFiltro, String periodoFiltro) {
        return getCuentaCorrienteTresNiveles(financiadorFiltro, periodoFiltro, null, null);
    }

    @Cacheable(CacheConfig.CACHE_CUENTA_CORRIENTE)
    public List<CcFinanciadorDTO> getCuentaCorrienteTresNiveles(String financiadorFiltro, String periodoFiltro, String fechaDesde, String fechaHasta) {

        // ── Pre-filtrado a nivel SQL: cargar sólo las familias del rango de períodos solicitado ──
        // Sigue el mismo patrón de dos pasos ya usado en getTrazabilidad().
        LocalDate fDesde = null;
        LocalDate fHasta = null;
        if (fechaDesde != null && !fechaDesde.trim().isEmpty()) {
            try { fDesde = LocalDate.parse(fechaDesde.trim()).withDayOfMonth(1); } catch (Exception ignored) {}
        }
        if (fechaHasta != null && !fechaHasta.trim().isEmpty()) {
            try { fHasta = LocalDate.parse(fechaHasta.trim()).with(TemporalAdjusters.lastDayOfMonth()); } catch (Exception ignored) {}
        }
        // Si no se especificó ningún rango, aplicar ventana por defecto de 24 meses
        // para evitar cargar el histórico completo en cada petición sin filtro.
        if (fDesde == null && fHasta == null) {
            fDesde = LocalDate.now().minusMonths(24).withDayOfMonth(1);
        }

        List<? extends CabeceraBase> cabeceras;
        if (fDesde != null || fHasta != null) {
            List<Long> idsGrupos = cabeceraRepository.findIdsGruposFacturasPorRangoPeriodos(fDesde, fHasta);
            if (idsGrupos != null && !idsGrupos.isEmpty()) {
                List<CabeceraLigeraDTO> ligeras = new ArrayList<>();
                int batchSize = 500;
                for (int i = 0; i < idsGrupos.size(); i += batchSize) {
                    List<Long> batch = idsGrupos.subList(i, Math.min(i + batchSize, idsGrupos.size()));
                    ligeras.addAll(cabeceraRepository.findLigeraByGrupoOrAsociadogrupoOrIdIn(batch));
                }
                cabeceras = ligeras;
            } else {
                List<CabeceraLigeraDTO> ligeras = cabeceraRepository.findCabecerasLigerasParaCuentaCorriente();
                if (ligeras != null && !ligeras.isEmpty()) {
                    cabeceras = ligeras;
                } else {
                    cabeceras = cabeceraRepository.findCabecerasParaCuentaCorriente();
                }
            }
        } else {
            List<CabeceraLigeraDTO> ligeras = cabeceraRepository.findCabecerasLigerasParaCuentaCorriente();
            if (ligeras != null && !ligeras.isEmpty()) {
                cabeceras = ligeras;
            } else {
                cabeceras = cabeceraRepository.findCabecerasParaCuentaCorriente();
            }
        }

        if (cabeceras == null || cabeceras.isEmpty()) {
            return Collections.emptyList();
        }
        Set<Long> idsAnulados = new HashSet<>(identificarComprobantesAnulados15Dias(cabeceras, null));
        if (!idsAnulados.isEmpty()) {
            cabeceras = cabeceras.stream()
                    .filter(c -> c.getId() == null || !idsAnulados.contains(c.getId()))
                    .collect(Collectors.toList());
            if (cabeceras.isEmpty()) {
                return Collections.emptyList();
            }
        }
        Set<Long> ndHijosDeNc = new HashSet<>();
        Set<Long> ndHijosDeFc = new HashSet<>();
        clasificarHijosNd(cabeceras, ndHijosDeNc, ndHijosDeFc);
        DateTimeFormatter periodoFormatter = DateTimeFormatter.ofPattern("yyyy-MM");

        YearMonth ymDesde = null;
        if (fechaDesde != null && !fechaDesde.trim().isEmpty()) {
            String fd = fechaDesde.trim();
            try {
                ymDesde = fd.length() >= 7 ? YearMonth.parse(fd.substring(0, 7)) : YearMonth.parse(fd);
            } catch (Exception ignored) {}
        }

        YearMonth ymHasta = null;
        if (fechaHasta != null && !fechaHasta.trim().isEmpty()) {
            String fh = fechaHasta.trim();
            try {
                ymHasta = fh.length() >= 7 ? YearMonth.parse(fh.substring(0, 7)) : YearMonth.parse(fh);
            } catch (Exception ignored) {}
        }

        // 1. Agrupar comprobantes por Familia/Grupo (asociadogrupo / grupo / asociado / id)
        Map<Long, List<CabeceraBase>> familias = cabeceras.stream()
                .collect(Collectors.groupingBy(
                        this::resolverIdGrupoTrazabilidad,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        // Estructura intermedia: Financiador -> Periodo (de la FC) -> List<CcComprobanteDTO> (Facturas Madres)
        Map<String, Map<String, List<CcComprobanteDTO>>> agrupado = new LinkedHashMap<>();

        for (List<CabeceraBase> miembros : familias.values()) {
            if (miembros.isEmpty()) continue;

            // Determinar la Factura Madre (raíz): FC / FAC / FCE / FCA
            CabeceraBase fcRaiz = miembros.stream()
                    .filter(c -> "FC".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                    .min((c1, c2) -> {
                        boolean c1Self = c1.getAsociado() != null && c1.getAsociado().equals(c1.getId());
                        boolean c2Self = c2.getAsociado() != null && c2.getAsociado().equals(c2.getId());
                        if (c1Self != c2Self) return c1Self ? -1 : 1;
                        if (c1.getFecha() != null && c2.getFecha() != null) {
                            int comp = c1.getFecha().compareTo(c2.getFecha());
                            if (comp != 0) return comp;
                        }
                        return c1.getId().compareTo(c2.getId());
                    })
                    .orElse(null);

            if (fcRaiz == null) {
                // Si la familia no tiene Factura Madre (FC), se descarta según las reglas de negocio
                continue;
            }

            // Financiador: tomado de la FC raíz (o del primer miembro que lo tenga definido)
            String financiador = obtenerNombreFinanciador(fcRaiz);
            if (financiador == null || financiador.trim().isEmpty() || "Sin financiador".equalsIgnoreCase(financiador.trim())) {
                for (CabeceraBase m : miembros) {
                    String finM = obtenerNombreFinanciador(m);
                    if (finM != null && !finM.trim().isEmpty() && !"Sin financiador".equalsIgnoreCase(finM.trim())) {
                        financiador = finM;
                        break;
                    }
                }
            }
            if (financiador == null || financiador.trim().isEmpty() || "Sin financiador".equalsIgnoreCase(financiador.trim())) {
                continue; // Omitir sin financiador
            }

            // Filtro por Financiador
            if (financiadorFiltro != null && !financiadorFiltro.trim().isEmpty()) {
                String fFiltro = financiadorFiltro.trim().toLowerCase();
                String cod = fcRaiz.getCodigoCobertura() != null ? fcRaiz.getCodigoCobertura().trim().toLowerCase() : "";
                String nom = fcRaiz.getCobertura() != null ? fcRaiz.getCobertura().trim().toLowerCase() : "";
                if (!financiador.toLowerCase().contains(fFiltro) && !cod.contains(fFiltro) && !nom.contains(fFiltro)) {
                    continue;
                }
            }

            // Período: tomado exclusivamente del campo periodo de la FC raíz (no se usa fecha)
            LocalDate fechaPeriodo = fcRaiz.getPeriodo();
            if (fechaPeriodo == null) {
                for (CabeceraBase m : miembros) {
                    if (m.getPeriodo() != null) {
                        fechaPeriodo = m.getPeriodo();
                        break;
                    }
                }
            }
            if (fechaPeriodo == null) continue;

            YearMonth ymPeriodo = YearMonth.from(fechaPeriodo);
            if (ymDesde != null && ymPeriodo.isBefore(ymDesde)) {
                continue;
            }
            if (ymHasta != null && ymPeriodo.isAfter(ymHasta)) {
                continue;
            }

            String periodo = fechaPeriodo.format(periodoFormatter);
            if (periodoFiltro != null && !periodoFiltro.trim().isEmpty()) {
                if (!periodo.equalsIgnoreCase(periodoFiltro.trim())) {
                    continue;
                }
            }

            // Construir el árbol de la Factura Madre y sus descendientes
            CcComprobanteDTO facturaDTO = construirArbolExpediente(fcRaiz, miembros, ndHijosDeNc, ndHijosDeFc);

            agrupado
                    .computeIfAbsent(financiador, k -> new LinkedHashMap<>())
                    .computeIfAbsent(periodo, k -> new ArrayList<>())
                    .add(facturaDTO);
        }

        List<CcFinanciadorDTO> resultadoFinanciadores = new ArrayList<>();

        for (Map.Entry<String, Map<String, List<CcComprobanteDTO>>> entryFin : agrupado.entrySet()) {
            String financiador = entryFin.getKey();
            Map<String, List<CcComprobanteDTO>> periodosMap = entryFin.getValue();

            List<CcPeriodoDTO> periodosDTO = new ArrayList<>();

            for (Map.Entry<String, List<CcComprobanteDTO>> entryPer : periodosMap.entrySet()) {
                String periodo = entryPer.getKey();
                List<CcComprobanteDTO> facturasDTO = entryPer.getValue();

                // Ordenar facturas por fecha descendente, luego número
                facturasDTO.sort(Comparator.comparing(CcComprobanteDTO::getFecha, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(CcComprobanteDTO::getComprobante, Comparator.nullsLast(Comparator.naturalOrder())));

                // Totalizadores Nivel 2 (Período): suman la Factura Madre + todos sus hijos dependientes
                BigDecimal perFacturacion = BigDecimal.ZERO;
                BigDecimal perIncrementos = BigDecimal.ZERO;
                BigDecimal perDebitos = BigDecimal.ZERO;
                BigDecimal perRefacturacion = BigDecimal.ZERO;
                BigDecimal perCobranzas = BigDecimal.ZERO;

                for (CcComprobanteDTO fc : facturasDTO) {
                    perFacturacion = perFacturacion.add(fc.getFacturacionFc());
                    perIncrementos = perIncrementos.add(fc.getIncrementosNd());
                    perDebitos = perDebitos.add(fc.getDebitosNc());
                    perRefacturacion = perRefacturacion.add(fc.getRefacturacionNd());
                    perCobranzas = perCobranzas.add(fc.getCobranzasRc());
                }

                perFacturacion = perFacturacion.setScale(2, RoundingMode.HALF_UP);
                perIncrementos = perIncrementos.setScale(2, RoundingMode.HALF_UP);
                perDebitos = perDebitos.setScale(2, RoundingMode.HALF_UP);
                perRefacturacion = perRefacturacion.setScale(2, RoundingMode.HALF_UP);
                perCobranzas = perCobranzas.setScale(2, RoundingMode.HALF_UP);

                BigDecimal perSaldo = perFacturacion
                        .add(perIncrementos)
                        .add(perRefacturacion)
                        .subtract(perDebitos)
                        .subtract(perCobranzas)
                        .setScale(2, RoundingMode.HALF_UP);

                periodosDTO.add(new CcPeriodoDTO(
                        periodo,
                        perFacturacion,
                        perIncrementos,
                        perDebitos,
                        perRefacturacion,
                        perCobranzas,
                        perSaldo,
                        facturasDTO
                ));
            }

            // Ordenar períodos cronológicamente inverso (más reciente primero)
            periodosDTO.sort(Comparator.comparing(CcPeriodoDTO::getPeriodo, Comparator.nullsLast(Comparator.reverseOrder())));

            if (periodosDTO.isEmpty()) {
                continue;
            }

            // Totalizadores Nivel 1 (Financiador)
            BigDecimal finFacturacion = periodosDTO.stream()
                    .map(CcPeriodoDTO::getFacturacionFc)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal finIncrementos = periodosDTO.stream()
                    .map(CcPeriodoDTO::getIncrementosNd)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal finDebitos = periodosDTO.stream()
                    .map(CcPeriodoDTO::getDebitosNc)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal finRefacturacion = periodosDTO.stream()
                    .map(CcPeriodoDTO::getRefacturacionNd)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal finCobranzas = periodosDTO.stream()
                    .map(CcPeriodoDTO::getCobranzasRc)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal finSaldo = finFacturacion
                    .add(finIncrementos)
                    .add(finRefacturacion)
                    .subtract(finDebitos)
                    .subtract(finCobranzas)
                    .setScale(2, RoundingMode.HALF_UP);

            resultadoFinanciadores.add(new CcFinanciadorDTO(
                    financiador,
                    finFacturacion,
                    finIncrementos,
                    finDebitos,
                    finRefacturacion,
                    finCobranzas,
                    finSaldo,
                    periodosDTO
            ));
        }

        // Ordenar financiadores por saldo descendente
        resultadoFinanciadores.sort(Comparator.comparing(CcFinanciadorDTO::getSaldo, Comparator.nullsLast(Comparator.reverseOrder())));

        return resultadoFinanciadores;
    }

    private CcComprobanteDTO construirArbolExpediente(CabeceraBase fcRaiz, List<? extends CabeceraBase> miembros, Set<Long> ndHijosDeNc, Set<Long> ndHijosDeFc) {
        CcComprobanteDTO rootDTO = mapearAComprobanteDTO(fcRaiz, ndHijosDeNc, ndHijosDeFc);
        rootDTO.setNivel(0);
        rootDTO.setId(fcRaiz.getId());
        rootDTO.setAsociado(fcRaiz.getAsociado());
        rootDTO.setAsociadogrupo(fcRaiz.getAsociadogrupo());
        rootDTO.setOrigenTipo("FC");

        // Construir mapa de hijos directos en memoria usando la columna asociado
        // padreId -> List<CabeceraBase>
        Map<Long, List<CabeceraBase>> hijosPorPadre = new LinkedHashMap<>();

        for (CabeceraBase c : miembros) {
            if (Objects.equals(c.getId(), fcRaiz.getId())) continue;

            Long padreId = c.getAsociado();
            // Si el asociado apunta a sí mismo:
            if (padreId != null && padreId.equals(c.getId())) {
                padreId = null;
            }

            if (padreId != null) {
                hijosPorPadre.computeIfAbsent(padreId, k -> new ArrayList<>()).add(c);
            } else {
                // Si asociado es nulo:
                // Caso especial de RC: si comparte grupo con una ND de la familia, su padre es esa ND
                Long padrePorGrupo = null;
                if (c.getGrupo() != null && c.getGrupo() != 0L) {
                    for (CabeceraBase cand : miembros) {
                        if (!Objects.equals(cand.getId(), c.getId())
                                && "ND".equalsIgnoreCase(resolverTipoBase(cand.getTipo()))
                                && Objects.equals(cand.getGrupo(), c.getGrupo())) {
                            padrePorGrupo = cand.getId();
                            break;
                        }
                    }
                }
                if (padrePorGrupo != null && !Objects.equals(padrePorGrupo, c.getId())) {
                    hijosPorPadre.computeIfAbsent(padrePorGrupo, k -> new ArrayList<>()).add(c);
                } else {
                    // Si no tiene asociado ni grupo específico, es hijo directo de la Factura Madre
                    hijosPorPadre.computeIfAbsent(fcRaiz.getId(), k -> new ArrayList<>()).add(c);
                }
            }
        }

        // Ordenar hijos por fecha ASC, id ASC dentro de cada padre
        for (List<CabeceraBase> listaHijos : hijosPorPadre.values()) {
            listaHijos.sort((c1, c2) -> {
                if (c1.getFecha() != null && c2.getFecha() != null) {
                    int comp = c1.getFecha().compareTo(c2.getFecha());
                    if (comp != 0) return comp;
                }
                if (c1.getId() != null && c2.getId() != null) {
                    return c1.getId().compareTo(c2.getId());
                }
                return 0;
            });
        }

        // Recorrido en profundidad recursivo para construir la lista de descendientes con su nivel
        List<CcComprobanteDTO> descendientes = new ArrayList<>();
        Set<Long> visitados = new HashSet<>();
        if (fcRaiz.getId() != null) {
            visitados.add(fcRaiz.getId());
        }

        recorrerDescendientesEnProfundidad(fcRaiz.getId(), 1, hijosPorPadre, descendientes, visitados, ndHijosDeNc, ndHijosDeFc);

        // Seguridad: agregar cualquier miembro no visitado de la familia
        for (CabeceraBase c : miembros) {
            if (c.getId() != null && !visitados.contains(c.getId())) {
                visitados.add(c.getId());
                CcComprobanteDTO orfDTO = mapearAComprobanteDTO(c, ndHijosDeNc, ndHijosDeFc);
                orfDTO.setNivel(1);
                orfDTO.setId(c.getId());
                orfDTO.setAsociado(c.getAsociado());
                orfDTO.setAsociadogrupo(c.getAsociadogrupo());
                String t = resolverTipoBase(c.getTipo());
                String origenTipo = t;
                if ("RC".equalsIgnoreCase(t)) origenTipo = "COB";
                else if ("NC".equalsIgnoreCase(t)) origenTipo = "DEB";
                else if ("ND".equalsIgnoreCase(t)) {
                    origenTipo = (c.getId() != null && ndHijosDeNc.contains(c.getId())) ? "REF"
                            : ((c.getId() != null && ndHijosDeFc.contains(c.getId())) ? "INC" : "ND");
                }
                orfDTO.setOrigenTipo(origenTipo);
                descendientes.add(orfDTO);
            }
        }

        rootDTO.setHijos(descendientes);

        // ── HIJO FC RAÍZ (posición 0): factura de origen con monto bruto original ──────────
        // Se inserta PRIMERO en la lista de hijos para que el acordeón muestre la FC cabecera
        // con su importe bruto original (antes de cualquier descuento), dejando las demás
        // columnas financieras en cero. El padre (rootDTO) NO se modifica y sigue mostrando
        // el saldo neto real con todas las deducciones aplicadas.
        BigDecimal montoBrutoOriginal = fcRaiz.getDebe() != null
                ? fcRaiz.getDebe().setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        CcComprobanteDTO hijoFcRaiz = new CcComprobanteDTO(
                fcRaiz.getTipo() != null ? fcRaiz.getTipo().trim().toUpperCase() : "FC",
                formatearComprobante(fcRaiz),
                fcRaiz.getFecha() != null ? fcRaiz.getFecha().toString() : "",
                montoBrutoOriginal,  // facturacionFc = monto bruto original
                BigDecimal.ZERO,     // incrementosNd = 0
                BigDecimal.ZERO,     // debitosNc = 0
                BigDecimal.ZERO,     // refacturacionNd = 0
                BigDecimal.ZERO,     // cobranzasRc = 0
                montoBrutoOriginal   // saldo = monto bruto (sin deducciones)
        );
        hijoFcRaiz.setId(fcRaiz.getId());
        hijoFcRaiz.setAsociado(fcRaiz.getAsociado());
        hijoFcRaiz.setAsociadogrupo(fcRaiz.getAsociadogrupo());
        hijoFcRaiz.setNivel(1);
        hijoFcRaiz.setOrigenTipo("FC");

        descendientes.add(0, hijoFcRaiz);


        // Saldo consolidado de la Factura Madre:
        // Saldo = Facturación FC + sum(incrementos) + sum(refacturacion) - sum(debitos) - sum(cobranzas)
        BigDecimal totFc = rootDTO.getFacturacionFc();
        BigDecimal totInc = rootDTO.getIncrementosNd();
        BigDecimal totDeb = rootDTO.getDebitosNc();
        BigDecimal totRef = rootDTO.getRefacturacionNd();
        BigDecimal totCob = rootDTO.getCobranzasRc();

        for (CcComprobanteDTO h : descendientes) {
            // Saltar el hijo FC inyectado (posición 0): su facturacionFc ya está
            // contabilizada en rootDTO.getFacturacionFc() (el debe de la FC raíz).
            // Sumarlo nuevamente inflaría el saldo del encabezado padre.
            if ("FC".equalsIgnoreCase(h.getOrigenTipo())) continue;
            totFc = totFc.add(h.getFacturacionFc());
            totInc = totInc.add(h.getIncrementosNd());
            totDeb = totDeb.add(h.getDebitosNc());
            totRef = totRef.add(h.getRefacturacionNd());
            totCob = totCob.add(h.getCobranzasRc());
        }

        BigDecimal saldoConsolidado = totFc
                .add(totInc)
                .add(totRef)
                .subtract(totDeb)
                .subtract(totCob)
                .setScale(2, RoundingMode.HALF_UP);

        rootDTO.setFacturacionFc(totFc.setScale(2, RoundingMode.HALF_UP));
        rootDTO.setIncrementosNd(totInc.setScale(2, RoundingMode.HALF_UP));
        rootDTO.setDebitosNc(totDeb.setScale(2, RoundingMode.HALF_UP));
        rootDTO.setRefacturacionNd(totRef.setScale(2, RoundingMode.HALF_UP));
        rootDTO.setCobranzasRc(totCob.setScale(2, RoundingMode.HALF_UP));
        rootDTO.setSaldo(saldoConsolidado);

        return rootDTO;
    }

    private void recorrerDescendientesEnProfundidad(Long padreId, int nivel,
                                                    Map<Long, List<CabeceraBase>> hijosPorPadre,
                                                    List<CcComprobanteDTO> resultado,
                                                    Set<Long> visitados,
                                                    Set<Long> ndHijosDeNc,
                                                    Set<Long> ndHijosDeFc) {
        if (padreId == null) return;
        List<CabeceraBase> hijos = hijosPorPadre.get(padreId);
        if (hijos == null || hijos.isEmpty()) return;

        for (CabeceraBase h : hijos) {
            if (h.getId() != null && visitados.contains(h.getId())) continue;
            if (h.getId() != null) visitados.add(h.getId());

            CcComprobanteDTO hijoDTO = mapearAComprobanteDTO(h, ndHijosDeNc, ndHijosDeFc);
            hijoDTO.setNivel(nivel);
            hijoDTO.setId(h.getId());
            hijoDTO.setAsociado(h.getAsociado());
            hijoDTO.setAsociadogrupo(h.getAsociadogrupo());

            String tipoBase = resolverTipoBase(h.getTipo());
            if ("RC".equalsIgnoreCase(tipoBase)) {
                hijoDTO.setOrigenTipo("COB");
            } else if ("NC".equalsIgnoreCase(tipoBase)) {
                hijoDTO.setOrigenTipo("DEB");
            } else if ("ND".equalsIgnoreCase(tipoBase)) {
                if (h.getId() != null && ndHijosDeNc.contains(h.getId())) {
                    hijoDTO.setOrigenTipo("REF");
                } else if (h.getId() != null && ndHijosDeFc.contains(h.getId())) {
                    hijoDTO.setOrigenTipo("INC");
                } else {
                    hijoDTO.setOrigenTipo("ND");
                }
            } else {
                hijoDTO.setOrigenTipo(tipoBase);
            }

            resultado.add(hijoDTO);

            if (h.getId() != null) {
                recorrerDescendientesEnProfundidad(h.getId(), nivel + 1, hijosPorPadre, resultado, visitados, ndHijosDeNc, ndHijosDeFc);
            }
        }
    }

    private CcComprobanteDTO mapearAComprobanteDTO(CabeceraBase c, Set<Long> ndHijosDeNc, Set<Long> ndHijosDeFc) {
        String tipoBase = resolverTipoBase(c.getTipo());
        String tipoRaw = c.getTipo() != null ? c.getTipo().trim().toUpperCase() : "";
        String comp = formatearComprobante(c);
        String fecha = c.getFecha() != null ? c.getFecha().toString() : "";

        BigDecimal facturacion = BigDecimal.ZERO;
        BigDecimal incrementos = BigDecimal.ZERO;
        BigDecimal debitos = BigDecimal.ZERO;
        BigDecimal refacturacion = BigDecimal.ZERO;
        BigDecimal cobranzas = BigDecimal.ZERO;

        switch (tipoBase) {
            case "FC" -> {
                facturacion = c.getDebe() != null ? c.getDebe() : BigDecimal.ZERO;
            }
            case "NC" -> {
                debitos = (c.getHaber() != null && c.getHaber().compareTo(BigDecimal.ZERO) > 0)
                        ? c.getHaber()
                        : (c.getDebe() != null ? c.getDebe() : BigDecimal.ZERO);
            }
            case "RC" -> {
                cobranzas = (c.getHaber() != null && c.getHaber().compareTo(BigDecimal.ZERO) > 0)
                        ? c.getHaber()
                        : (c.getDebe() != null ? c.getDebe() : BigDecimal.ZERO);
            }
            case "ND" -> {
                BigDecimal montoNd = c.getDebe() != null ? c.getDebe()
                        : (c.getHaber() != null ? c.getHaber() : BigDecimal.ZERO);
                if (c.getId() != null && ndHijosDeNc.contains(c.getId())) {
                    refacturacion = montoNd;
                } else if (c.getId() != null && ndHijosDeFc.contains(c.getId())) {
                    incrementos = montoNd;
                }
            }
            default -> {
                if (c.getDebe() != null && c.getDebe().compareTo(BigDecimal.ZERO) > 0) {
                    facturacion = c.getDebe();
                } else if (c.getHaber() != null && c.getHaber().compareTo(BigDecimal.ZERO) > 0) {
                    cobranzas = c.getHaber();
                }
            }
        }

        facturacion = facturacion.setScale(2, RoundingMode.HALF_UP);
        incrementos = incrementos.setScale(2, RoundingMode.HALF_UP);
        debitos = debitos.setScale(2, RoundingMode.HALF_UP);
        refacturacion = refacturacion.setScale(2, RoundingMode.HALF_UP);
        cobranzas = cobranzas.setScale(2, RoundingMode.HALF_UP);

        BigDecimal saldo = facturacion
                .add(incrementos)
                .add(refacturacion)
                .subtract(debitos)
                .subtract(cobranzas)
                .setScale(2, RoundingMode.HALF_UP);

        return new CcComprobanteDTO(
                tipoRaw,
                comp,
                fecha,
                facturacion,
                incrementos,
                debitos,
                refacturacion,
                cobranzas,
                saldo
        );
    }

    private String obtenerNombreFinanciador(CabeceraBase c) {
        String cod = c.getCodigoCobertura() != null && !c.getCodigoCobertura().trim().isEmpty()
                ? c.getCodigoCobertura().trim()
                : null;
        String nom = c.getCobertura() != null && !c.getCobertura().trim().isEmpty()
                ? c.getCobertura().trim()
                : null;

        if (cod != null && nom != null) {
            if (nom.startsWith(cod)) {
                return nom;
            }
            return cod + " - " + nom;
        } else if (nom != null) {
            return nom;
        } else if (cod != null) {
            return cod;
        }
        return "Sin financiador";
    }

    private String formatearComprobante(CabeceraBase c) {
        if (c.getComprobante() != null && !c.getComprobante().trim().isEmpty()) {
            return c.getComprobante().trim();
        }
        String tipo = c.getTipo() != null ? c.getTipo().trim().toUpperCase() : "";
        if ("RC".equalsIgnoreCase(tipo)) {
            if (c.getNumero() != null && c.getNumero() != 0) {
                return String.valueOf(c.getNumero());
            }
            return c.getId() != null ? "RC #" + c.getId() : "-";
        }
        String letra = c.getLetra() != null ? c.getLetra().trim().toUpperCase() : "";
        int ptovta = c.getPtovta() != null ? c.getPtovta() : 0;
        int numero = c.getNumero() != null ? c.getNumero() : 0;
        return String.format("%s %s%04d-%08d", tipo, letra, ptovta, numero).trim();
    }

    /**
     * Matriz Anual de Recaudación:
     * Cruza los financiadores contra los 12 meses de un año específico,
     * sumando únicamente los comprobantes de cobro.
     *
     * @param anioObjetivo año a consultar (si es nulo, se utiliza el año calendario actual)
     * @return MatrizRecaudacionDTO con los años disponibles, filas por financiador, totales mensuales y gran total.
     */
    public MatrizRecaudacionDTO getMatrizRecaudacion(Integer anioObjetivo) {
        return getMatrizRecaudacion(anioObjetivo, null);
    }

    @Cacheable(CacheConfig.CACHE_MATRIZ)
    public MatrizRecaudacionDTO getMatrizRecaudacion(Integer anioObjetivo, String financiadorFiltro) {
        int anio = anioObjetivo != null ? anioObjetivo : LocalDate.now().getYear();

        List<Integer> aniosDisponibles = cabeceraRepository.obtenerAniosRecaudacionDisponibles();
        if (aniosDisponibles == null) {
            aniosDisponibles = new ArrayList<>();
        }

        // Si anioObjetivo fue nulo y el año actual no tiene datos pero existen años previos, seleccionamos el más reciente
        if (anioObjetivo == null && !aniosDisponibles.isEmpty() && !aniosDisponibles.contains(anio)) {
            anio = aniosDisponibles.get(0);
        }

        List<Object[]> rows = cabeceraRepository.obtenerMatrizRecaudacionPorAnio(anio);

        String nombreCobertura = null;
        if (financiadorFiltro != null && !financiadorFiltro.trim().isEmpty() && !"TODAS".equalsIgnoreCase(financiadorFiltro.trim())) {
            for (DirectorioCoberturaDTO c : obtenerCoberturasDisponibles()) {
                if (c.getCodigo().equalsIgnoreCase(financiadorFiltro.trim())) {
                    nombreCobertura = c.getNombre() != null ? c.getNombre().trim().toLowerCase() : null;
                    break;
                }
            }
        }

        Map<String, MatrizRecaudacionFilaDTO> mapaFinanciadores = new LinkedHashMap<>();
        BigDecimal[] totalesMes = MatrizRecaudacionDTO.inicializarArrayMeses();
        BigDecimal granTotal = BigDecimal.ZERO;

        for (Object[] row : rows) {
            String financiador = row[0] != null ? row[0].toString().trim() : "Sin financiador";
            int mes = row[1] != null ? ((Number) row[1]).intValue() : 0;
            BigDecimal monto = row[2] != null
                    ? new BigDecimal(row[2].toString()).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            String codCob = row.length > 3 && row[3] != null ? row[3].toString().trim() : "";

            if (financiadorFiltro != null && !financiadorFiltro.trim().isEmpty() && !"TODAS".equalsIgnoreCase(financiadorFiltro.trim())) {
                String fFiltro = financiadorFiltro.trim().toLowerCase();
                String finNorm = financiador.toLowerCase();
                boolean coincideCod = !codCob.isEmpty() && codCob.equalsIgnoreCase(financiadorFiltro.trim());
                boolean coincideNombre = finNorm.contains(fFiltro);
                boolean coincidePorDenominacion = nombreCobertura != null && (finNorm.contains(nombreCobertura) || nombreCobertura.contains(finNorm));
                if (!coincideCod && !coincideNombre && !coincidePorDenominacion) {
                    continue;
                }
            }

            MatrizRecaudacionFilaDTO fila = mapaFinanciadores.computeIfAbsent(
                    financiador,
                    k -> new MatrizRecaudacionFilaDTO(k)
            );

            int mesIndex = mes - 1; // Mes 1 (Enero) -> índice 0, Mes 12 (Diciembre) -> índice 11
            if (mesIndex >= 0 && mesIndex < 12) {
                // Inyectar en el array del mes para esta fila
                fila.getMeses()[mesIndex] = fila.getMeses()[mesIndex].add(monto);
                fila.setTotalAnual(fila.getTotalAnual().add(monto));

                // Incrementar acumuladores globales
                totalesMes[mesIndex] = totalesMes[mesIndex].add(monto);
                granTotal = granTotal.add(monto);
            }
        }

        // Ordenar filas por totalAnual descendente
        List<MatrizRecaudacionFilaDTO> filas = new ArrayList<>(mapaFinanciadores.values());
        filas.sort(Comparator.comparing(MatrizRecaudacionFilaDTO::getTotalAnual, Comparator.nullsLast(Comparator.reverseOrder())));

        return new MatrizRecaudacionDTO(
                anio,
                aniosDisponibles,
                filas,
                totalesMes,
                granTotal
        );
    }

    /**
     * Módulo de Detalle y Trazabilidad (Árbol Encadenado):
     * Agrupa comprobantes vinculados a la misma cadena de vida (por asociadogrupo/grupo/id),
     * reconstruyendo su cronología de eventos (FC -> NC -> ND -> RC) y metadatos de prestación.
     *
     * @param financiadorFiltro filtro opcional por financiador o código de cobertura
     * @param medicoFiltro      filtro opcional por profesional / médico interviniente
     * @param periodoFiltro     filtro opcional por período (YYYY-MM)
     * @return Lista de hasta 500 expedientes/cadenas ordenadas cronológicamente
     */
    public List<CadenaTrazabilidadDTO> getTrazabilidad(String financiadorFiltro, String medicoFiltro, String periodoFiltro) {
        return getTrazabilidad(financiadorFiltro, medicoFiltro, periodoFiltro, null, null);
    }

    @Cacheable(CacheConfig.CACHE_TRAZABILIDAD)
    public List<CadenaTrazabilidadDTO> getTrazabilidad(String financiadorFiltro, String medicoFiltro, String periodoFiltro, String fechaDesde, String fechaHasta) {
        LocalDate fDesde = null;
        LocalDate fHasta = null;
        if (fechaDesde != null && !fechaDesde.trim().isEmpty()) {
            try { fDesde = LocalDate.parse(fechaDesde.trim()); } catch (Exception ignored) {}
        }
        if (fechaHasta != null && !fechaHasta.trim().isEmpty()) {
            try { fHasta = LocalDate.parse(fechaHasta.trim()); } catch (Exception ignored) {}
        }
        // Si no se pasaron fechas específicas pero sí un período (ej: "2026-03"):
        if (fDesde == null && fHasta == null && periodoFiltro != null && !periodoFiltro.trim().isEmpty() && !"TODOS".equalsIgnoreCase(periodoFiltro.trim())) {
            try {
                YearMonth ym = YearMonth.parse(periodoFiltro.trim());
                fDesde = ym.atDay(1);
                fHasta = ym.atEndOfMonth();
            } catch (Exception ignored) {}
        }
        // Protección contra OOM: si no se especificó ninguna fecha ni período, acotar por defecto a los últimos 12 meses
        if (fDesde == null && fHasta == null) {
            fDesde = LocalDate.now().minusMonths(12).withDayOfMonth(1);
        }

        List<? extends CabeceraBase> comprobantes;
        if (fDesde != null || fHasta != null) {
            List<Long> idsGrupos = cabeceraRepository.findIdsGruposFacturasPorRangoFechas(fDesde, fHasta);
            if (idsGrupos != null && !idsGrupos.isEmpty()) {
                List<CabeceraLigeraDTO> ligeros = new ArrayList<>();
                int batchSize = 500;
                for (int i = 0; i < idsGrupos.size(); i += batchSize) {
                    List<Long> batch = idsGrupos.subList(i, Math.min(i + batchSize, idsGrupos.size()));
                    ligeros.addAll(cabeceraRepository.findLigeraByGrupoOrAsociadogrupoOrIdIn(batch));
                }
                comprobantes = ligeros;
            } else {
                List<CabeceraLigeraDTO> ligeros = cabeceraRepository.findComprobantesLigerosParaTrazabilidad();
                if (ligeros != null && !ligeros.isEmpty()) {
                    comprobantes = ligeros;
                } else {
                    comprobantes = cabeceraRepository.findComprobantesParaTrazabilidad();
                }
            }
        } else {
            List<CabeceraLigeraDTO> ligeros = cabeceraRepository.findComprobantesLigerosParaTrazabilidad();
            if (ligeros != null && !ligeros.isEmpty()) {
                comprobantes = ligeros;
            } else {
                comprobantes = cabeceraRepository.findComprobantesParaTrazabilidad();
            }
        }

        if (comprobantes == null || comprobantes.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> idsAnulados = new HashSet<>(identificarComprobantesAnulados15Dias(comprobantes, null));
        if (!idsAnulados.isEmpty()) {
            comprobantes = comprobantes.stream()
                    .filter(c -> c.getId() == null || !idsAnulados.contains(c.getId()))
                    .collect(Collectors.toList());
            if (comprobantes.isEmpty()) {
                return Collections.emptyList();
            }
        }

        return construirCadenasTrazabilidad(comprobantes, financiadorFiltro, medicoFiltro, periodoFiltro, fDesde, fHasta);
    }

    /**
     * Construye la lista de {@link CadenaTrazabilidadDTO} a partir de un conjunto de comprobantes
     * ya cargados y filtrados (sin anulados). Este método es reutilizado por
     * {@link #getTrazabilidad} y {@link #getBuclesInsistencia} para evitar duplicación de lógica.
     */
    private List<CadenaTrazabilidadDTO> construirCadenasTrazabilidad(
            List<? extends CabeceraBase> comprobantes,
            String financiadorFiltro, String medicoFiltro, String periodoFiltro,
            LocalDate fDesde, LocalDate fHasta) {

        Set<Long> ndHijosDeNc = new HashSet<>();
        Set<Long> ndHijosDeFc = new HashSet<>();
        clasificarHijosNd(comprobantes, ndHijosDeNc, ndHijosDeFc);

        // Agrupar en memoria usando Java Streams por identificador de grupo (asociadogrupo)
        Map<Long, List<CabeceraBase>> grupos = comprobantes.stream()
                .collect(Collectors.groupingBy(
                        this::resolverIdGrupoTrazabilidad,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        // Obtener IDs de las facturas raíces de cada grupo para precargar prestaciones y médicos
        Set<Long> fcIds = new HashSet<>();
        for (List<CabeceraBase> miembros : grupos.values()) {
            CabeceraBase fcRaiz = miembros.stream()
                    .filter(c -> "FC".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                    .findFirst()
                    .orElse(miembros.get(0));
            if (fcRaiz.getId() != null) {
                fcIds.add(fcRaiz.getId());
            }
        }

        // Carga batch de prestaciones por FC en lotes seguros de 500 elementos usando DTOs livianos
        Map<Long, PrestacionLigeraDTO> prestacionPorFc = new HashMap<>();
        if (!fcIds.isEmpty()) {
            List<Long> fcIdsList = new ArrayList<>(fcIds);
            int batchSize = 500;
            for (int i = 0; i < fcIdsList.size(); i += batchSize) {
                List<Long> batch = fcIdsList.subList(i, Math.min(i + batchSize, fcIdsList.size()));
                List<PrestacionLigeraDTO> dtos = ambLiquidadoRepository.findPrestacionesLigerasPorCabeceraIds(batch);
                if (dtos != null && !dtos.isEmpty()) {
                    dtos.forEach(dto -> prestacionPorFc.putIfAbsent(dto.getIdCabecera(), dto));
                } else {
                    ambLiquidadoRepository.findByCabecera_IdIn(batch).stream()
                            .filter(al -> al.getCabecera() != null)
                            .forEach(al -> prestacionPorFc.putIfAbsent(al.getCabecera().getId(),
                                    new PrestacionLigeraDTO(al.getCabecera().getId(), al.getMedico(), al.getDescripcion(), al.getOperador())));
                }
            }
        }

        // Carga batch de usuarios responsables de NC y ND en lotes seguros usando DTOs livianos
        Set<Long> ncIds = comprobantes.stream()
                .filter(c -> "NC".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                .map(CabeceraBase::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<NotaCreditoLigeraDTO> notasCredito = new ArrayList<>();
        if (!ncIds.isEmpty()) {
            List<Long> ncIdsList = new ArrayList<>(ncIds);
            int batchSize = 500;
            for (int i = 0; i < ncIdsList.size(); i += batchSize) {
                List<Long> batch = ncIdsList.subList(i, Math.min(i + batchSize, ncIdsList.size()));
                List<NotaCreditoLigeraDTO> dtos = notaDeCreditoRepository.findNotasCreditoLigerasPorCabeceraIds(batch);
                if (dtos != null && !dtos.isEmpty()) {
                    notasCredito.addAll(dtos);
                } else {
                    notaDeCreditoRepository.findByCabecera_IdIn(batch).stream()
                            .filter(nc -> nc.getCabecera() != null)
                            .forEach(nc -> notasCredito.add(new NotaCreditoLigeraDTO(
                                    nc.getCabecera().getId(), nc.getUsuario(), nc.getMotivoDebito())));
                }
            }
        }

        Map<Long, String> usuariosNc = notasCredito.stream()
                .filter(nc -> nc.getIdCabecera() != null && nc.getUsuario() != null && !nc.getUsuario().trim().isEmpty())
                .collect(Collectors.toMap(
                        NotaCreditoLigeraDTO::getIdCabecera,
                        nc -> nc.getUsuario().trim(),
                        (e, r) -> e
                ));

        Map<Long, String> motivosNc = notasCredito.stream()
                .filter(nc -> nc.getIdCabecera() != null && nc.getMotivoDebito() != null && !nc.getMotivoDebito().trim().isEmpty())
                .collect(Collectors.toMap(
                        NotaCreditoLigeraDTO::getIdCabecera,
                        nc -> nc.getMotivoDebito().trim(),
                        (e, r) -> e
                ));

        Set<Long> ndIds = comprobantes.stream()
                .filter(c -> "ND".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                .map(CabeceraBase::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, String> usuariosNd = new HashMap<>();
        if (!ndIds.isEmpty()) {
            List<Long> ndIdsList = new ArrayList<>(ndIds);
            int batchSize = 500;
            for (int i = 0; i < ndIdsList.size(); i += batchSize) {
                List<Long> batch = ndIdsList.subList(i, Math.min(i + batchSize, ndIdsList.size()));
                List<NotaDebitoLigeraDTO> dtos = notaDeDebitoRepository.findNotasDebitoLigerasPorCabeceraIds(batch);
                if (dtos != null && !dtos.isEmpty()) {
                    dtos.stream()
                            .filter(nd -> nd.getIdCabecera() != null && nd.getUsuario() != null && !nd.getUsuario().trim().isEmpty())
                            .forEach(nd -> usuariosNd.putIfAbsent(nd.getIdCabecera(), nd.getUsuario().trim()));
                } else {
                    notaDeDebitoRepository.findByCabecera_IdIn(batch).stream()
                            .filter(nd -> nd.getCabecera() != null && nd.getUsuario() != null && !nd.getUsuario().trim().isEmpty())
                            .forEach(nd -> usuariosNd.putIfAbsent(nd.getCabecera().getId(), nd.getUsuario().trim()));
                }
            }
        }

        Map<Long, String> tiposRegistroPorCabeceraNc = new HashMap<>();
        if (!ncIds.isEmpty()) {
            List<Long> ncIdsList = new ArrayList<>(ncIds);
            int batchSize = 500;
            for (int i = 0; i < ncIdsList.size(); i += batchSize) {
                List<Long> batch = ncIdsList.subList(i, Math.min(i + batchSize, ncIdsList.size()));
                List<Object[]> tipos = notaDeCreditoRepository.findTiposRegistroPorCabeceraIds(new HashSet<>(batch));
                for (Object[] row : tipos) {
                    if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                        Long cId = ((Number) row[0]).longValue();
                        String tipoReg = row[1].toString().trim();
                        if (!tipoReg.isEmpty() && !tiposRegistroPorCabeceraNc.containsKey(cId)) {
                            tiposRegistroPorCabeceraNc.put(cId, tipoReg);
                        }
                    }
                }
            }
        }

        List<CadenaTrazabilidadDTO> cadenas = new ArrayList<>();

        for (Map.Entry<Long, List<CabeceraBase>> entry : grupos.entrySet()) {
            List<CabeceraBase> miembros = entry.getValue();
            if (miembros.isEmpty()) continue;

            // Identificar la factura origen (FC) para llenar la cabecera del CadenaTrazabilidadDTO
            CabeceraBase fcRaiz = miembros.stream()
                    .filter(c -> "FC".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                    .findFirst()
                    .orElse(null);

            if (fcRaiz == null) {
                continue; // Descartar grupos sin Factura Madre (FC)
            }

            PrestacionLigeraDTO amb = prestacionPorFc.get(fcRaiz.getId());
            String medico = (amb != null && amb.getMedico() != null && !amb.getMedico().trim().isEmpty())
                    ? amb.getMedico().trim() : "No especificado";
            String descripcion = (amb != null && amb.getDescripcion() != null && !amb.getDescripcion().trim().isEmpty())
                    ? amb.getDescripcion().trim() : ("Factura " + formatearComprobante(fcRaiz));
            String financiador = obtenerNombreFinanciador(fcRaiz);
            String idPrestacion = formatearComprobante(fcRaiz);

            // Filtro por Financiador
            if (financiadorFiltro != null && !financiadorFiltro.trim().isEmpty() && !"TODAS".equalsIgnoreCase(financiadorFiltro.trim())) {
                String fFiltro = financiadorFiltro.trim().toLowerCase();
                String cob = fcRaiz.getCobertura() != null ? fcRaiz.getCobertura().toLowerCase() : "";
                String cod = fcRaiz.getCodigoCobertura() != null ? fcRaiz.getCodigoCobertura().toLowerCase() : "";
                if (!cob.contains(fFiltro) && !cod.contains(fFiltro)) {
                    continue;
                }
            }

            // Filtro por Período
            if (periodoFiltro != null && !periodoFiltro.trim().isEmpty() && !"TODOS".equalsIgnoreCase(periodoFiltro.trim())) {
                String pFiltro = periodoFiltro.trim();
                String perStr = fcRaiz.getPeriodo() != null ? fcRaiz.getPeriodo().toString() : "";
                String fecStr = fcRaiz.getFecha() != null ? fcRaiz.getFecha().toString() : "";
                if (!perStr.startsWith(pFiltro) && !fecStr.startsWith(pFiltro)) {
                    continue;
                }
            }

            // Filtro por Rango de Fechas de la Factura Origen (fechaDesde y fechaHasta)
            if (fDesde != null && (fcRaiz.getFecha() == null || fcRaiz.getFecha().isBefore(fDesde))) {
                continue;
            }
            if (fHasta != null && (fcRaiz.getFecha() == null || fcRaiz.getFecha().isAfter(fHasta))) {
                continue;
            }

            // Filtro por Médico
            if (medicoFiltro != null && !medicoFiltro.trim().isEmpty() && !"TODOS".equalsIgnoreCase(medicoFiltro.trim())) {
                String mFiltro = medicoFiltro.trim().toLowerCase();
                if (!medico.toLowerCase().contains(mFiltro)) {
                    continue;
                }
            }

            BigDecimal montoFacturadoOriginal = fcRaiz.getDebe() != null
                    ? fcRaiz.getDebe().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

            BigDecimal totalDebitado = miembros.stream()
                    .filter(c -> "NC".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                    .map(c -> (c.getHaber() != null && c.getHaber().compareTo(BigDecimal.ZERO) > 0)
                            ? c.getHaber() : (c.getDebe() != null ? c.getDebe() : BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            // Mapear cada comprobante a un EventoTrazabilidadDTO ordenados cronológicamente
            final PrestacionLigeraDTO ambFinal = amb;
            List<EventoTrazabilidadDTO> historial = miembros.stream()
                    .sorted(Comparator.comparing(CabeceraBase::getFecha, Comparator.nullsLast(Comparator.naturalOrder()))
                            .thenComparing(CabeceraBase::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                    .map(c -> {
                        String t = resolverTipoBase(c.getTipo());
                        String comp = formatearComprobante(c);
                        String fechaStr = c.getFecha() != null ? c.getFecha().toString() : "";
                        BigDecimal monto;
                        String desc;
                        String resp;

                        switch (t) {
                            case "FC" -> {
                                monto = c.getDebe() != null ? c.getDebe() : BigDecimal.ZERO;
                                desc = "Emisión inicial";
                                resp = (ambFinal != null && ambFinal.getOperador() != null && !ambFinal.getOperador().trim().isEmpty())
                                        ? ambFinal.getOperador().trim()
                                        : "Sin operador asignado";
                            }
                            case "NC" -> {
                                monto = (c.getHaber() != null && c.getHaber().compareTo(BigDecimal.ZERO) > 0)
                                        ? c.getHaber() : (c.getDebe() != null ? c.getDebe() : BigDecimal.ZERO);
                                desc = motivosNc.getOrDefault(c.getId(), "Sin motivo especificado");
                                resp = usuariosNc.getOrDefault(c.getId(),
                                        (c.getOrigen() != null ? c.getOrigen() : "Auditoría Médica"));
                            }
                            case "ND" -> {
                                monto = (c.getDebe() != null && c.getDebe().compareTo(BigDecimal.ZERO) > 0)
                                        ? c.getDebe() : (c.getHaber() != null ? c.getHaber() : BigDecimal.ZERO);
                                desc = (c.getId() != null && ndHijosDeNc.contains(c.getId())) ? "Refacturación"
                                        : ((c.getId() != null && ndHijosDeFc.contains(c.getId())) ? "Incremento / Ajuste" : "Nota de Débito");
                                resp = usuariosNd.getOrDefault(c.getId(),
                                        (c.getOrigen() != null ? c.getOrigen() : "Facturación"));
                            }
                            case "RC" -> {
                                monto = (c.getHaber() != null && c.getHaber().compareTo(BigDecimal.ZERO) > 0)
                                        ? c.getHaber() : (c.getDebe() != null ? c.getDebe() : BigDecimal.ZERO);
                                desc = "Cobranza percibida";
                                resp = c.getOrigen() != null ? c.getOrigen() : "Tesorería";
                            }
                            default -> {
                                monto = c.getDebe() != null ? c.getDebe() : (c.getHaber() != null ? c.getHaber() : BigDecimal.ZERO);
                                desc = c.getTipo();
                                resp = c.getOrigen() != null ? c.getOrigen() : "Sistema";
                            }
                        }

                        String tipoReg;
                        if ("NC".equalsIgnoreCase(t)) {
                            tipoReg = tiposRegistroPorCabeceraNc.get(c.getId());
                            if (tipoReg == null || tipoReg.isEmpty()) {
                                tipoReg = (c.getTiporegistro() != null && !c.getTiporegistro().trim().isEmpty())
                                        ? c.getTiporegistro().trim()
                                        : (fcRaiz.getTiporegistro() != null && !fcRaiz.getTiporegistro().trim().isEmpty()
                                                ? fcRaiz.getTiporegistro().trim() : "");
                            }
                        } else {
                            tipoReg = (c.getTiporegistro() != null && !c.getTiporegistro().trim().isEmpty())
                                    ? c.getTiporegistro().trim()
                                    : (fcRaiz.getTiporegistro() != null && !fcRaiz.getTiporegistro().trim().isEmpty()
                                            ? fcRaiz.getTiporegistro().trim() : "");
                        }

                        return new EventoTrazabilidadDTO(
                                t,
                                comp,
                                fechaStr,
                                monto.setScale(2, RoundingMode.HALF_UP),
                                desc,
                                resp,
                                tipoReg
                        );
                    })
                    .collect(Collectors.toList());

            CadenaTrazabilidadDTO cad = new CadenaTrazabilidadDTO(
                    idPrestacion,
                    descripcion,
                    financiador,
                    medico,
                    montoFacturadoOriginal,
                    totalDebitado,
                    historial
            );
            cad.setTipoRegistro(fcRaiz.getTiporegistro() != null ? fcRaiz.getTiporegistro().trim() : "");
            cad.setCodigoCobertura(fcRaiz.getCodigoCobertura() != null ? fcRaiz.getCodigoCobertura().trim() : "");
            cad.setFechaFactura(fcRaiz.getFecha() != null ? fcRaiz.getFecha().toString() : "");
            cadenas.add(cad);
        }

        // Ordenar expedientes por fecha de comprobante origen descendente (más recientes primero)
        // y limitar a los 500 expedientes más recientes para la vista si aplica
        return cadenas.stream()
                .sorted((a, b) -> {
                    String fA = (a.getHistorialEventos() != null && !a.getHistorialEventos().isEmpty())
                            ? a.getHistorialEventos().get(0).getFecha() : "";
                    String fB = (b.getHistorialEventos() != null && !b.getHistorialEventos().isEmpty())
                            ? b.getHistorialEventos().get(0).getFecha() : "";
                    return fB.compareTo(fA);
                })
                .limit(500)
                .collect(Collectors.toList());
    }

    /**
     * Reporte de Desempeño por Analistas de Débito (Tabla a 3 Niveles):
     * Nivel 1: Analista (Responsable de débito)
     * Nivel 2: Motivo de Débito (Glosa)
     * Nivel 3: Financiador Afectado (Obra Social / Prepaga)
     *
     * @param periodoFiltro período opcional (YYYY-MM o TODOS)
     * @return Lista de MetricaAnalistaDTO ordenadas por monto total tramitado descendente
     */
    // Estructuras internas auxiliares para el cálculo de desempeño a 3 niveles
    private record ItemDebitoDesempeno(
            String actor,
            String motivo,
            String financiador,
            BigDecimal montoDebitado,
            BigDecimal montoAceptado,
            BigDecimal montoRefacturado,
            String tipoAtencion
    ) {
        public ItemDebitoDesempeno(String actor, String motivo, String financiador, BigDecimal monto, boolean esRefacturado, String tipoAtencion) {
            this(
                    actor,
                    motivo,
                    financiador,
                    monto != null ? monto : BigDecimal.ZERO,
                    esRefacturado ? BigDecimal.ZERO : (monto != null ? monto : BigDecimal.ZERO),
                    esRefacturado ? (monto != null ? monto : BigDecimal.ZERO) : BigDecimal.ZERO,
                    tipoAtencion
            );
        }
    }

    private record MetricasActorConsolidadas(
            String actor,
            int cantidadRegistros,
            BigDecimal debitosAceptados,
            BigDecimal debitosRefacturados,
            BigDecimal totalTramitado,
            BigDecimal ticketPromedio,
            BigDecimal tasaRecupero,
            List<DesgloseMotivoDTO> motivos,
            String distribucionAtencion,
            BigDecimal porcentajeAmb,
            BigDecimal porcentajeInt,
            int cantidadAmb,
            int cantidadInt
    ) {}

    private boolean esAmbulatorio(String tipo) {
        if (tipo == null) return false;
        String t = tipo.trim().toUpperCase();
        return t.contains("AMB");
    }

    private boolean esInternado(String tipo) {
        if (tipo == null) return false;
        String t = tipo.trim().toUpperCase();
        return t.contains("INT");
    }

    private List<MetricasActorConsolidadas> agruparMetricasPorItems(List<ItemDebitoDesempeno> items) {
        if (items == null || items.isEmpty()) {
            return Collections.emptyList();
        }

        // Nivel 1: Actor (Analista / Médico / Operador)
        Map<String, List<ItemDebitoDesempeno>> porActor = items.stream()
                .collect(Collectors.groupingBy(ItemDebitoDesempeno::actor, LinkedHashMap::new, Collectors.toList()));

        List<MetricasActorConsolidadas> resultado = new ArrayList<>();

        for (Map.Entry<String, List<ItemDebitoDesempeno>> entryActor : porActor.entrySet()) {
            String actor = entryActor.getKey();
            List<ItemDebitoDesempeno> itemsActor = entryActor.getValue();

            // Nivel 2: Motivo
            Map<String, List<ItemDebitoDesempeno>> porMotivo = itemsActor.stream()
                .collect(Collectors.groupingBy(ItemDebitoDesempeno::motivo, LinkedHashMap::new, Collectors.toList()));

            List<DesgloseMotivoDTO> motivosDto = new ArrayList<>();

            for (Map.Entry<String, List<ItemDebitoDesempeno>> entryMotivo : porMotivo.entrySet()) {
                String motivo = entryMotivo.getKey();
                List<ItemDebitoDesempeno> itemsMotivo = entryMotivo.getValue();

                // Nivel 3: Financiador
                Map<String, List<ItemDebitoDesempeno>> porFinanciador = itemsMotivo.stream()
                        .collect(Collectors.groupingBy(ItemDebitoDesempeno::financiador, LinkedHashMap::new, Collectors.toList()));

                List<DesgloseFinanciadorDTO> financiadoresDto = porFinanciador.entrySet().stream()
                        .map(ef -> {
                            String fin = ef.getKey();
                            List<ItemDebitoDesempeno> itemsFin = ef.getValue();
                            int cCasos = itemsFin.size();
                            BigDecimal cAceptado = itemsFin.stream()
                                    .map(ItemDebitoDesempeno::montoAceptado)
                                    .filter(Objects::nonNull)
                                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                                    .setScale(2, RoundingMode.HALF_UP);
                            BigDecimal cRefacturado = itemsFin.stream()
                                    .map(ItemDebitoDesempeno::montoRefacturado)
                                    .filter(Objects::nonNull)
                                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                                    .setScale(2, RoundingMode.HALF_UP);
                            BigDecimal sumDebitadoF = itemsFin.stream()
                                    .map(ItemDebitoDesempeno::montoDebitado)
                                    .filter(Objects::nonNull)
                                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                                    .setScale(2, RoundingMode.HALF_UP);
                            BigDecimal cMontoDebitado = sumDebitadoF.max(cAceptado.add(cRefacturado));

                            long fCountAmb = itemsFin.stream().filter(it -> esAmbulatorio(it.tipoAtencion())).count();
                            long fCountInt = itemsFin.stream().filter(it -> esInternado(it.tipoAtencion())).count();
                            long fTotalConTipo = fCountAmb + fCountInt;
                            BigDecimal fPctAmb;
                            BigDecimal fPctInt;
                            if (fTotalConTipo > 0) {
                                fPctAmb = BigDecimal.valueOf(fCountAmb * 100.0 / fTotalConTipo).setScale(1, RoundingMode.HALF_UP);
                                fPctInt = BigDecimal.valueOf(100.0).subtract(fPctAmb).setScale(1, RoundingMode.HALF_UP);
                            } else {
                                fPctAmb = BigDecimal.valueOf(100.0).setScale(1, RoundingMode.HALF_UP);
                                fPctInt = BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);
                            }
                            String fDistribucion;
                            if (fPctAmb.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) == 0 &&
                                fPctInt.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) == 0) {
                                fDistribucion = String.format(Locale.US, "%.0f%% Amb / %.0f%% Int", fPctAmb, fPctInt);
                            } else {
                                fDistribucion = String.format(Locale.US, "%.1f%% Amb / %.1f%% Int", fPctAmb, fPctInt);
                            }

                            BigDecimal fTasaRecupero = BigDecimal.ZERO;
                            if (cMontoDebitado.compareTo(BigDecimal.ZERO) > 0) {
                                fTasaRecupero = cRefacturado.multiply(BigDecimal.valueOf(100))
                                        .divide(cMontoDebitado, 1, RoundingMode.HALF_UP);
                            }

                            return new DesgloseFinanciadorDTO(fin, cCasos, cMontoDebitado, cAceptado, cRefacturado, fDistribucion, fTasaRecupero);
                        })
                        .sorted(Comparator.comparing(DesgloseFinanciadorDTO::getMontoDebitado, Comparator.reverseOrder()))
                        .collect(Collectors.toList());

                int mCasos = itemsMotivo.size();
                BigDecimal mAceptado = itemsMotivo.stream()
                        .map(ItemDebitoDesempeno::montoAceptado)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .setScale(2, RoundingMode.HALF_UP);
                BigDecimal mRefacturado = itemsMotivo.stream()
                        .map(ItemDebitoDesempeno::montoRefacturado)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .setScale(2, RoundingMode.HALF_UP);
                BigDecimal sumDebitadoM = itemsMotivo.stream()
                        .map(ItemDebitoDesempeno::montoDebitado)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .setScale(2, RoundingMode.HALF_UP);
                BigDecimal mMontoDebitado = sumDebitadoM.max(mAceptado.add(mRefacturado));

                long mCountAmb = itemsMotivo.stream().filter(it -> esAmbulatorio(it.tipoAtencion())).count();
                long mCountInt = itemsMotivo.stream().filter(it -> esInternado(it.tipoAtencion())).count();
                long mTotalConTipo = mCountAmb + mCountInt;
                BigDecimal mPctAmb;
                BigDecimal mPctInt;
                if (mTotalConTipo > 0) {
                    mPctAmb = BigDecimal.valueOf(mCountAmb * 100.0 / mTotalConTipo).setScale(1, RoundingMode.HALF_UP);
                    mPctInt = BigDecimal.valueOf(100.0).subtract(mPctAmb).setScale(1, RoundingMode.HALF_UP);
                } else {
                    mPctAmb = BigDecimal.valueOf(100.0).setScale(1, RoundingMode.HALF_UP);
                    mPctInt = BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);
                }
                String mDistribucion;
                if (mPctAmb.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) == 0 &&
                    mPctInt.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) == 0) {
                    mDistribucion = String.format(Locale.US, "%.0f%% Amb / %.0f%% Int", mPctAmb, mPctInt);
                } else {
                    mDistribucion = String.format(Locale.US, "%.1f%% Amb / %.1f%% Int", mPctAmb, mPctInt);
                }

                motivosDto.add(new DesgloseMotivoDTO(
                        motivo,
                        mCasos,
                        mMontoDebitado,
                        mAceptado,
                        mRefacturado,
                        financiadoresDto,
                        mDistribucion,
                        mPctAmb,
                        mPctInt,
                        (int) mCountAmb,
                        (int) mCountInt
                ));
            }

            motivosDto.sort(Comparator.comparing(DesgloseMotivoDTO::getMontoDebitado, Comparator.reverseOrder()));

            // Cálculos consolidados Nivel 1
            int aCantidadRegistros = itemsActor.size();
            long countAmb = itemsActor.stream().filter(it -> esAmbulatorio(it.tipoAtencion())).count();
            long countInt = itemsActor.stream().filter(it -> esInternado(it.tipoAtencion())).count();
            long totalConTipo = countAmb + countInt;

            BigDecimal pctAmb;
            BigDecimal pctInt;
            if (totalConTipo > 0) {
                pctAmb = BigDecimal.valueOf(countAmb * 100.0 / totalConTipo).setScale(1, RoundingMode.HALF_UP);
                pctInt = BigDecimal.valueOf(100.0).subtract(pctAmb).setScale(1, RoundingMode.HALF_UP);
            } else {
                pctAmb = BigDecimal.valueOf(100.0).setScale(1, RoundingMode.HALF_UP);
                pctInt = BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);
            }

            String distribucionAtencion;
            if (pctAmb.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) == 0 &&
                pctInt.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) == 0) {
                distribucionAtencion = String.format(Locale.US, "%.0f%% Amb / %.0f%% Int", pctAmb, pctInt);
            } else {
                distribucionAtencion = String.format(Locale.US, "%.1f%% Amb / %.1f%% Int", pctAmb, pctInt);
            }

            BigDecimal aAceptados = itemsActor.stream()
                    .map(ItemDebitoDesempeno::montoAceptado)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal aRefacturados = itemsActor.stream()
                    .map(ItemDebitoDesempeno::montoRefacturado)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal sumDebitadoA = itemsActor.stream()
                    .map(ItemDebitoDesempeno::montoDebitado)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal aTotalTramitado = sumDebitadoA.max(aAceptados.add(aRefacturados));

            BigDecimal aTicketPromedio = (aCantidadRegistros > 0)
                    ? aTotalTramitado.divide(BigDecimal.valueOf(aCantidadRegistros), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

            BigDecimal aTasaRecupero = (aTotalTramitado.compareTo(BigDecimal.ZERO) > 0)
                    ? aRefacturados.multiply(BigDecimal.valueOf(100)).divide(aTotalTramitado, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

            resultado.add(new MetricasActorConsolidadas(
                    actor,
                    aCantidadRegistros,
                    aAceptados,
                    aRefacturados,
                    aTotalTramitado,
                    aTicketPromedio,
                    aTasaRecupero,
                    motivosDto,
                    distribucionAtencion,
                    pctAmb,
                    pctInt,
                    (int) countAmb,
                    (int) countInt
            ));
        }

        resultado.sort(Comparator.comparing(MetricasActorConsolidadas::totalTramitado, Comparator.reverseOrder()));
        return resultado;
    }

    /**
     * Reporte Unificado de Desempeño Operativo (Tabla a 3 Niveles):
     * Procesa las prestaciones auditadas en notadecredito y notadedebito para Analistas,
     * y la trazabilidad de expedientes para Médicos/Prestadores y Operadores de Carga.
     *
     * @param periodoFiltro período opcional (YYYY-MM o TODOS)
     * @return DesempenoGlobalDTO con analistas, medicos y operadores
     */
    public DesempenoGlobalDTO getDesempenoGlobal(String periodoFiltro) {
        return getDesempenoGlobal(periodoFiltro, null, null);
    }

    @Cacheable(CacheConfig.CACHE_DESEMPENO)
    public DesempenoGlobalDTO getDesempenoGlobal(String periodoFiltro, LocalDate fechaDesde, LocalDate fechaHasta) {
        final String fDesdeStr = fechaDesde != null ? fechaDesde.toString() : null;
        final String fHastaStr = fechaHasta != null ? fechaHasta.toString() : null;

        // ── Ejecución SECUENCIAL — segura con transacciones Spring ───────────────────
        // CORRECCIÓN: Se eliminó CompletableFuture.supplyAsync() que usaba el
        // ForkJoinPool.commonPool(). Esos hilos no son gestionados por Spring y
        // abrían conexiones JPA independientes que HikariCP no podía rastrear,
        // causando el error "Apparent connection leak detected" con filtros de 2+ años.
        // Como ambos métodos tienen @Cacheable, la segunda llamada es instantánea
        // desde caché, por lo que no hay pérdida real de performance.
        List<MetricaAnalistaDTO> analistas = self.getMetricasAnalistas(periodoFiltro, fechaDesde, fechaHasta);
        List<CadenaTrazabilidadDTO> cadenas = self.getTrazabilidad(null, null, periodoFiltro, fDesdeStr, fHastaStr);

        if (analistas == null) analistas = Collections.emptyList();
        if (cadenas == null) cadenas = Collections.emptyList();

        List<MetricaMedicoDTO> medicos = cadenas.isEmpty() ? Collections.emptyList() : procesarMetricasMedicos(cadenas);
        List<MetricaOperadorDTO> operadores = self.getMetricasOperadores(periodoFiltro, fechaDesde, fechaHasta);
        if (operadores == null) operadores = Collections.emptyList();
        return new DesempenoGlobalDTO(analistas, medicos, operadores);
    }

    /**
     * Reporte de Desempeño por Analistas de Débito (Tabla a 3 Niveles):
     * Nivel 1: Analista (Usuario de notadecredito / notadedebito por prestación)
     * Nivel 2: Motivo de Débito (Glosa)
     * Nivel 3: Financiador Afectado (Obra Social / Prepaga)
     *
     * Extrae el contenido de la columna usuario de las tablas notadecredito o notadedebito
     * según corresponda a cada prestación.
     *
     * @param periodoFiltro período opcional (YYYY-MM o TODOS)
     * @return Lista de MetricaAnalistaDTO ordenadas por monto total tramitado descendente
     */
    public List<MetricaAnalistaDTO> getMetricasAnalistas(String periodoFiltro) {
        return getMetricasAnalistas(periodoFiltro, null, null);
    }

    @Cacheable(CacheConfig.CACHE_ANALISTAS)
    public List<MetricaAnalistaDTO> getMetricasAnalistas(String periodoFiltro, LocalDate fechaDesde, LocalDate fechaHasta) {

        // Protección contra OOM: si no hay filtro de fechas ni período, acotar a los últimos 12 meses
        // (igual que la protección aplicada en trazabilidad y cuenta corriente).
        boolean filtrarPeriodo = periodoFiltro != null && !periodoFiltro.trim().isEmpty() && !"TODOS".equalsIgnoreCase(periodoFiltro.trim());
        if (fechaDesde == null && fechaHasta == null && !filtrarPeriodo) {
            fechaDesde = LocalDate.now().minusMonths(12).withDayOfMonth(1);
        }

        // ── El filtro de fecha se inyecta DENTRO de la CTE items para que ──────────────
        // PostgreSQL pueda usar los índices de fecha antes de materializar los CTEs.
        // Se usan parámetros con cast explícito para que el planner resuelva null = sin filtro.
        String sql = """
            WITH docs_anulados AS (
                SELECT DISTINCT ca.idcabecera AS id
                FROM comprobantes_anulados ca
                WHERE ca.idcabecera IS NOT NULL
            ),
            docs_anuladores AS (
                -- Caso 1: Factura anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                  AND (CAST(:p_fd AS DATE) IS NULL OR c_anulado.fecha >= CAST(:p_fd AS DATE) - INTERVAL '30 days')
                  AND (CAST(:p_fh AS DATE) IS NULL OR c_anulado.fecha <= CAST(:p_fh AS DATE) + INTERVAL '30 days')
                UNION
                -- Caso 2: NC anulada por ND
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                  AND (CAST(:p_fd AS DATE) IS NULL OR c_anulado.fecha >= CAST(:p_fd AS DATE) - INTERVAL '30 days')
                  AND (CAST(:p_fh AS DATE) IS NULL OR c_anulado.fecha <= CAST(:p_fh AS DATE) + INTERVAL '30 days')
                UNION
                -- Caso 3: ND anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                  AND (CAST(:p_fd AS DATE) IS NULL OR c_anulado.fecha >= CAST(:p_fd AS DATE) - INTERVAL '30 days')
                  AND (CAST(:p_fh AS DATE) IS NULL OR c_anulado.fecha <= CAST(:p_fh AS DATE) + INTERVAL '30 days')
            ),
            pares_anulados_15d AS (
                SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
                FROM cabecera c_nc
                JOIN cabecera c_fac ON (
                    c_nc.asociado = c_fac.id
                    OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                        AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                             OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
                )
                WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(c_fac.debe, 0) > 0
                  AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
                  AND c_fac.fecha IS NOT NULL
                  AND c_nc.fecha IS NOT NULL
                  AND ABS(c_nc.fecha - c_fac.fecha) <= 15
                  AND (CAST(:p_fd AS DATE) IS NULL OR c_fac.fecha >= CAST(:p_fd AS DATE) - INTERVAL '30 days')
                  AND (CAST(:p_fh AS DATE) IS NULL OR c_fac.fecha <= CAST(:p_fh AS DATE) + INTERVAL '30 days')
            ),
            ids_anulados_15d AS (
                SELECT id FROM docs_anulados
                UNION
                SELECT id FROM docs_anuladores
                UNION
                SELECT id_fac AS id FROM pares_anulados_15d
                UNION
                SELECT id_nc AS id FROM pares_anulados_15d
            ),
            items AS (
              SELECT
                COALESCE(NULLIF(TRIM(nc.usuario), ''), NULLIF(TRIM(COALESCE(nd.usuario, nd_prest.usuario)), ''), 'Sin Analista') AS analista,
                COALESCE(NULLIF(TRIM(nc.motivodedebito), ''), NULLIF(TRIM(COALESCE(nd.motivorefactura, nd_prest.motivorefactura)), ''), 'Sin motivo especificado') AS motivo,
                COALESCE(NULLIF(TRIM(c_fc.cobertura), ''), NULLIF(TRIM(c_nc.cobertura), ''), 'Sin especificar') AS financiador,
                COALESCE(nc.importedebitado, 0) AS monto_debitado,
                CASE WHEN nc.debitoaceptado = true THEN COALESCE(nc.importedebitado, 0) ELSE 0 END AS aceptado,
                COALESCE(COALESCE(nd.importerefactura, nd_prest.importerefactura), nc.importederefactura, 0) AS refacturado,
                COALESCE(NULLIF(TRIM(c_fc.tiporegistro), ''), NULLIF(TRIM(c_nc.tiporegistro), ''), 'Ambulatorios') AS tipo_registro
              FROM notadecredito nc
              LEFT JOIN LATERAL (
                  SELECT nd_sub.id, nd_sub.usuario, nd_sub.motivorefactura, nd_sub.importerefactura
                  FROM notadedebito nd_sub
                  LEFT JOIN cabecera c_nd_sub ON nd_sub.idcabecera = c_nd_sub.id
                  WHERE nd_sub.id_notadecredito = nc.id
                  ORDER BY CASE WHEN c_nd_sub.origen <> 'BDD' THEN 0 ELSE 1 END, nd_sub.id DESC
                  LIMIT 1
              ) nd ON true
              LEFT JOIN notadedebito nd_prest ON (nd.id IS NULL AND nd_prest.id_prestacion = nc.id_prestacion)
              LEFT JOIN amb_liquidado al ON nc.id_prestacion = al.id
              LEFT JOIN cabecera c_fc ON al.idcabecera = c_fc.id
              LEFT JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
              LEFT JOIN ids_anulados_15d da_nc ON da_nc.id = c_nc.id
              LEFT JOIN ids_anulados_15d da_fc ON da_fc.id = c_fc.id
              WHERE ((nc.usuario IS NOT NULL AND TRIM(nc.usuario) <> '')
                 OR (COALESCE(nd.usuario, nd_prest.usuario) IS NOT NULL AND TRIM(COALESCE(nd.usuario, nd_prest.usuario)) <> ''))
                AND da_nc.id IS NULL
                AND da_fc.id IS NULL
                AND (CAST(:p_fd AS DATE) IS NULL OR COALESCE(c_nc.fecha, nc.fecha_registro::date, c_fc.fecha) >= CAST(:p_fd AS DATE))
                AND (CAST(:p_fh AS DATE) IS NULL OR COALESCE(c_nc.fecha, nc.fecha_registro::date, c_fc.fecha) <= CAST(:p_fh AS DATE))
                AND (:p_per IS NULL OR COALESCE(c_nc.periodo::text, c_fc.periodo::text) LIKE :p_per || '%'
                     OR TO_CHAR(COALESCE(c_nc.fecha, nc.fecha_registro::date, c_fc.fecha), 'YYYY-MM') = :p_per)

              UNION ALL

              SELECT
                COALESCE(NULLIF(TRIM(nd.usuario), ''), 'Sin Analista') AS analista,
                COALESCE(NULLIF(TRIM(nd.motivorefactura), ''), 'Refacturación') AS motivo,
                COALESCE(NULLIF(TRIM(c_fc.cobertura), ''), NULLIF(TRIM(c_nd.cobertura), ''), 'Sin especificar') AS financiador,
                COALESCE(nd.importerefactura, 0) AS monto_debitado,
                0 AS aceptado,
                COALESCE(nd.importerefactura, 0) AS refacturado,
                COALESCE(NULLIF(TRIM(c_fc.tiporegistro), ''), NULLIF(TRIM(c_nd.tiporegistro), ''), 'Ambulatorios') AS tipo_registro
              FROM notadedebito nd
              LEFT JOIN amb_liquidado al ON nd.id_prestacion = al.id
              LEFT JOIN cabecera c_fc ON al.idcabecera = c_fc.id
              LEFT JOIN cabecera c_nd ON nd.idcabecera = c_nd.id
              LEFT JOIN ids_anulados_15d da_nd ON da_nd.id = c_nd.id
              LEFT JOIN ids_anulados_15d da_fc ON da_fc.id = c_fc.id
              WHERE nd.id_notadecredito IS NULL
                AND NOT EXISTS (SELECT 1 FROM notadecredito nc WHERE nc.id_prestacion = nd.id_prestacion)
                AND nd.usuario IS NOT NULL AND TRIM(nd.usuario) <> ''
                AND da_nd.id IS NULL
                AND da_fc.id IS NULL
                AND (CAST(:p_fd AS DATE) IS NULL OR COALESCE(c_nd.fecha, nd.fecha_registro::date, c_fc.fecha) >= CAST(:p_fd AS DATE))
                AND (CAST(:p_fh AS DATE) IS NULL OR COALESCE(c_nd.fecha, nd.fecha_registro::date, c_fc.fecha) <= CAST(:p_fh AS DATE))
                AND (:p_per IS NULL OR COALESCE(c_nd.periodo::text, c_fc.periodo::text) LIKE :p_per || '%'
                     OR TO_CHAR(COALESCE(c_nd.fecha, nd.fecha_registro::date, c_fc.fecha), 'YYYY-MM') = :p_per)
            )
            SELECT analista, motivo, financiador, monto_debitado, aceptado, refacturado, tipo_registro
            FROM items
            """;

        Query q = entityManager.createNativeQuery(sql);
        q.setParameter("p_fd", fechaDesde != null ? java.sql.Date.valueOf(fechaDesde) : null);
        q.setParameter("p_fh", fechaHasta != null ? java.sql.Date.valueOf(fechaHasta) : null);
        q.setParameter("p_per", filtrarPeriodo ? periodoFiltro.trim() : null);

        List<ItemDebitoDesempeno> items = new ArrayList<>();
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        for (Object[] r : rows) {
            items.add(mapearFilaItemDebito(r));
        }

        return agruparMetricasPorItems(items).stream()
                .map(m -> new MetricaAnalistaDTO(
                        m.actor(),
                        m.cantidadRegistros(),
                        m.debitosAceptados(),
                        m.debitosRefacturados(),
                        m.totalTramitado(),
                        m.ticketPromedio(),
                        m.tasaRecupero(),
                        m.motivos(),
                        m.distribucionAtencion(),
                        m.porcentajeAmb(),
                        m.porcentajeInt(),
                        m.cantidadAmb(),
                        m.cantidadInt()
                ))
                .collect(Collectors.toList());
    }

    private ItemDebitoDesempeno mapearFilaItemDebito(Object[] r) {
        String actor = r != null && r.length > 0 && r[0] != null ? r[0].toString().trim() : "Sin Analista";
        String motivo = (r != null && r.length > 1 && r[1] != null && !r[1].toString().trim().isEmpty() && !"Débito recibido".equalsIgnoreCase(r[1].toString().trim()))
                ? r[1].toString().trim() : "Sin motivo especificado";
        String financiador = r != null && r.length > 2 && r[2] != null ? r[2].toString().trim() : "Sin especificar";
        BigDecimal montoDebitado = r != null && r.length > 3 && r[3] != null ? new BigDecimal(r[3].toString()) : BigDecimal.ZERO;
        BigDecimal montoAceptado = r != null && r.length > 4 && r[4] != null ? new BigDecimal(r[4].toString()) : BigDecimal.ZERO;
        BigDecimal montoRefacturado = r != null && r.length > 5 && r[5] != null ? new BigDecimal(r[5].toString()) : BigDecimal.ZERO;
        String tipoAtencion = r != null && r.length > 6 && r[6] != null ? r[6].toString().trim() : "Ambulatorios";

        return new ItemDebitoDesempeno(
                actor,
                motivo,
                financiador,
                montoDebitado,
                montoAceptado,
                montoRefacturado,
                tipoAtencion
        );
    }

    public List<MetricaAnalistaDTO> procesarMetricasAnalistas(List<CadenaTrazabilidadDTO> cadenas) {
        if (cadenas == null || cadenas.isEmpty()) {
            return Collections.emptyList();
        }

        List<ItemDebitoDesempeno> items = new ArrayList<>();

        for (CadenaTrazabilidadDTO cadena : cadenas) {
            List<EventoTrazabilidadDTO> historial = cadena.getHistorialEventos();
            if (historial == null || historial.isEmpty()) {
                continue;
            }

            for (int i = 0; i < historial.size(); i++) {
                EventoTrazabilidadDTO e = historial.get(i);
                if ("NC".equalsIgnoreCase(e.getTipo())) {
                    String analista = (e.getResponsable() != null && !e.getResponsable().trim().isEmpty())
                            ? e.getResponsable().trim() : "Auditoría Médica";
                    String motivo = (e.getDescripcion() != null && !e.getDescripcion().trim().isEmpty() && !"Débito recibido".equalsIgnoreCase(e.getDescripcion().trim()))
                            ? e.getDescripcion().trim() : "Sin motivo especificado";
                    String financiador = (cadena.getFinanciador() != null && !cadena.getFinanciador().trim().isEmpty())
                            ? cadena.getFinanciador().trim() : "Sin especificar";
                    BigDecimal monto = e.getMonto() != null ? e.getMonto() : BigDecimal.ZERO;

                    boolean tieneNdPosterior = false;
                    for (int j = i + 1; j < historial.size(); j++) {
                        EventoTrazabilidadDTO evPost = historial.get(j);
                        if ("ND".equalsIgnoreCase(evPost.getTipo()) && !"Incremento / Ajuste".equalsIgnoreCase(evPost.getDescripcion())) {
                            tieneNdPosterior = true;
                            break;
                        }
                    }

                    items.add(new ItemDebitoDesempeno(analista, motivo, financiador, monto, tieneNdPosterior, e.getTipoRegistro()));
                }
            }
        }

        return agruparMetricasPorItems(items).stream()
                .map(m -> new MetricaAnalistaDTO(
                        m.actor(),
                        m.cantidadRegistros(),
                        m.debitosAceptados(),
                        m.debitosRefacturados(),
                        m.totalTramitado(),
                        m.ticketPromedio(),
                        m.tasaRecupero(),
                        m.motivos(),
                        m.distribucionAtencion(),
                        m.porcentajeAmb(),
                        m.porcentajeInt(),
                        m.cantidadAmb(),
                        m.cantidadInt()
                ))
                .collect(Collectors.toList());
    }

    /**
     * Reporte de Desempeño por Médicos / Prestadores (Tabla a 3 Niveles):
     * Nivel 1: Médico (Profesional interviniente en la prestación facturada)
     * Nivel 2: Motivo de Débito (Glosa)
     * Nivel 3: Financiador Afectado (Obra Social / Prepaga)
     *
     * @param periodoFiltro período opcional (YYYY-MM o TODOS)
     * @return Lista de MetricaMedicoDTO ordenadas por monto total tramitado descendente
     */
    public List<MetricaMedicoDTO> getMetricasMedicos(String periodoFiltro) {
        return procesarMetricasMedicos(getTrazabilidad(null, null, periodoFiltro));
    }

    public List<MetricaMedicoDTO> procesarMetricasMedicos(List<CadenaTrazabilidadDTO> cadenas) {
        if (cadenas == null || cadenas.isEmpty()) {
            return Collections.emptyList();
        }

        List<ItemDebitoDesempeno> items = new ArrayList<>();

        for (CadenaTrazabilidadDTO cadena : cadenas) {
            List<EventoTrazabilidadDTO> historial = cadena.getHistorialEventos();
            if (historial == null || historial.isEmpty()) {
                continue;
            }

            String medico = (cadena.getMedico() != null && !cadena.getMedico().trim().isEmpty() && !"No especificado".equalsIgnoreCase(cadena.getMedico().trim()))
                    ? cadena.getMedico().trim() : "Médico no especificado";

            for (int i = 0; i < historial.size(); i++) {
                EventoTrazabilidadDTO e = historial.get(i);
                if ("NC".equalsIgnoreCase(e.getTipo())) {
                    String motivo = (e.getDescripcion() != null && !e.getDescripcion().trim().isEmpty() && !"Débito recibido".equalsIgnoreCase(e.getDescripcion().trim()))
                            ? e.getDescripcion().trim() : "Sin motivo especificado";
                    String financiador = (cadena.getFinanciador() != null && !cadena.getFinanciador().trim().isEmpty())
                            ? cadena.getFinanciador().trim() : "Sin especificar";
                    BigDecimal monto = e.getMonto() != null ? e.getMonto() : BigDecimal.ZERO;

                    boolean tieneNdPosterior = false;
                    for (int j = i + 1; j < historial.size(); j++) {
                        EventoTrazabilidadDTO evPost = historial.get(j);
                        if ("ND".equalsIgnoreCase(evPost.getTipo()) && !"Incremento / Ajuste".equalsIgnoreCase(evPost.getDescripcion())) {
                            tieneNdPosterior = true;
                            break;
                        }
                    }

                    items.add(new ItemDebitoDesempeno(medico, motivo, financiador, monto, tieneNdPosterior, e.getTipoRegistro()));
                }
            }
        }

        return agruparMetricasPorItems(items).stream()
                .map(m -> new MetricaMedicoDTO(
                        m.actor(),
                        m.cantidadRegistros(),
                        m.debitosAceptados(),
                        m.debitosRefacturados(),
                        m.totalTramitado(),
                        m.ticketPromedio(),
                        m.tasaRecupero(),
                        m.motivos()
                ))
                .collect(Collectors.toList());
    }

    /**
     * Reporte de Desempeño por Usuarios de Carga / Operadores (Tabla a 3 Niveles):
     * Nivel 1: Operador (Responsable del comprobante de emisión inicial FC)
     * Nivel 2: Motivo de Débito (Glosa)
     * Nivel 3: Financiador Afectado (Obra Social / Prepaga)
     *
     * @param periodoFiltro período opcional (YYYY-MM o TODOS)
     * @return Lista de MetricaOperadorDTO ordenadas por monto total tramitado descendente
     */
    public List<MetricaOperadorDTO> getMetricasOperadores(String periodoFiltro) {
        return getMetricasOperadores(periodoFiltro, null, null);
    }

    @Cacheable(CacheConfig.CACHE_OPERADORES)
    public List<MetricaOperadorDTO> getMetricasOperadores(String periodoFiltro, LocalDate fechaDesde, LocalDate fechaHasta) {
        boolean filtrarPeriodo = periodoFiltro != null && !periodoFiltro.trim().isEmpty() && !"TODOS".equalsIgnoreCase(periodoFiltro.trim());

        if (!filtrarPeriodo && fechaDesde == null && fechaHasta == null) {
            fechaDesde = LocalDate.now().minusMonths(12).withDayOfMonth(1);
        }

        String sql = """
            WITH docs_anulados AS (
                SELECT DISTINCT ca.idcabecera AS id
                FROM comprobantes_anulados ca
                WHERE ca.idcabecera IS NOT NULL
            ),
            docs_anuladores AS (
                -- Caso 1: Factura anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                  AND (CAST(:p_fd AS DATE) IS NULL OR c_anulado.fecha >= CAST(:p_fd AS DATE) - INTERVAL '30 days')
                  AND (CAST(:p_fh AS DATE) IS NULL OR c_anulado.fecha <= CAST(:p_fh AS DATE) + INTERVAL '30 days')
                UNION
                -- Caso 2: NC anulada por ND
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) > 0
                  AND COALESCE(NULLIF(c_anulado.haber, 0), c_anulado.debe, 0) = COALESCE(c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                  AND (CAST(:p_fd AS DATE) IS NULL OR c_anulado.fecha >= CAST(:p_fd AS DATE) - INTERVAL '30 days')
                  AND (CAST(:p_fh AS DATE) IS NULL OR c_anulado.fecha <= CAST(:p_fh AS DATE) + INTERVAL '30 days')
                UNION
                -- Caso 3: ND anulada por NC
                SELECT c_anulador.id
                FROM cabecera c_anulador
                JOIN cabecera c_anulado ON (
                    c_anulador.asociado = c_anulado.id
                    OR (c_anulador.asociado IS NULL AND COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) IS NOT NULL
                        AND (COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = c_anulado.id
                             OR COALESCE(c_anulador.asociadogrupo, c_anulador.grupo) = COALESCE(c_anulado.asociadogrupo, c_anulado.grupo)))
                )
                JOIN docs_anulados da ON da.id = c_anulado.id
                WHERE UPPER(TRIM(c_anulado.tipo)) IN ('ND','NDE','NDA','NDB')
                  AND UPPER(TRIM(c_anulador.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND COALESCE(c_anulado.debe, 0) > 0
                  AND COALESCE(c_anulado.debe, 0) = COALESCE(NULLIF(c_anulador.haber, 0), c_anulador.debe, 0)
                  AND c_anulado.fecha IS NOT NULL AND c_anulador.fecha IS NOT NULL
                  AND ABS(c_anulador.fecha - c_anulado.fecha) <= 15
                  AND (CAST(:p_fd AS DATE) IS NULL OR c_anulado.fecha >= CAST(:p_fd AS DATE) - INTERVAL '30 days')
                  AND (CAST(:p_fh AS DATE) IS NULL OR c_anulado.fecha <= CAST(:p_fh AS DATE) + INTERVAL '30 days')
            ),
            pares_anulados_15d AS (
                SELECT c_fac.id AS id_fac, c_nc.id AS id_nc
                FROM cabecera c_nc
                JOIN cabecera c_fac ON (
                    c_nc.asociado = c_fac.id
                    OR (c_nc.asociado IS NULL AND COALESCE(c_nc.asociadogrupo, c_nc.grupo) IS NOT NULL
                        AND (COALESCE(c_nc.asociadogrupo, c_nc.grupo) = c_fac.id
                             OR COALESCE(c_nc.asociadogrupo, c_nc.grupo) = COALESCE(c_fac.asociadogrupo, c_fac.grupo)))
                )
                WHERE UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB')
                  AND UPPER(TRIM(c_fac.tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(c_fac.debe, 0) > 0
                  AND COALESCE(c_fac.debe, 0) = COALESCE(NULLIF(c_nc.haber, 0), c_nc.debe, 0)
                  AND c_fac.fecha IS NOT NULL
                  AND c_nc.fecha IS NOT NULL
                  AND ABS(c_nc.fecha - c_fac.fecha) <= 15
                  AND (CAST(:p_fd AS DATE) IS NULL OR c_fac.fecha >= CAST(:p_fd AS DATE) - INTERVAL '30 days')
                  AND (CAST(:p_fh AS DATE) IS NULL OR c_fac.fecha <= CAST(:p_fh AS DATE) + INTERVAL '30 days')
            ),
            ids_anulados_15d AS (
                SELECT id FROM docs_anulados
                UNION
                SELECT id FROM docs_anuladores
                UNION
                SELECT id_fac AS id FROM pares_anulados_15d
                UNION
                SELECT id_nc AS id FROM pares_anulados_15d
            ),
            items AS (
              SELECT
                COALESCE(NULLIF(TRIM(al.operador), ''), 'Sin operador asignado') AS operador,
                COALESCE(NULLIF(TRIM(nc.motivodedebito), ''), NULLIF(TRIM(COALESCE(nd.motivorefactura, nd_prest.motivorefactura)), ''), 'Sin motivo especificado') AS motivo,
                COALESCE(NULLIF(TRIM(c_fc.cobertura), ''), NULLIF(TRIM(c_nc.cobertura), ''), 'Sin especificar') AS financiador,
                COALESCE(nc.importedebitado, 0) AS monto_debitado,
                CASE WHEN nc.debitoaceptado = true THEN COALESCE(nc.importedebitado, 0) ELSE 0 END AS aceptado,
                COALESCE(COALESCE(nd.importerefactura, nd_prest.importerefactura), nc.importederefactura, 0) AS refacturado,
                COALESCE(NULLIF(TRIM(c_fc.tiporegistro), ''), NULLIF(TRIM(c_nc.tiporegistro), ''), 'Ambulatorios') AS tipo_registro
              FROM notadecredito nc
              LEFT JOIN LATERAL (
                  SELECT nd_sub.id, nd_sub.usuario, nd_sub.motivorefactura, nd_sub.importerefactura
                  FROM notadedebito nd_sub
                  LEFT JOIN cabecera c_nd_sub ON nd_sub.idcabecera = c_nd_sub.id
                  WHERE nd_sub.id_notadecredito = nc.id
                  ORDER BY CASE WHEN c_nd_sub.origen <> 'BDD' THEN 0 ELSE 1 END, nd_sub.id DESC
                  LIMIT 1
              ) nd ON true
              LEFT JOIN notadedebito nd_prest ON (nd.id IS NULL AND nd_prest.id_prestacion = nc.id_prestacion)
              LEFT JOIN amb_liquidado al ON nc.id_prestacion = al.id
              LEFT JOIN cabecera c_fc ON al.idcabecera = c_fc.id
              LEFT JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
              LEFT JOIN ids_anulados_15d da_nc ON da_nc.id = c_nc.id
              LEFT JOIN ids_anulados_15d da_fc ON da_fc.id = c_fc.id
              WHERE da_nc.id IS NULL
                AND da_fc.id IS NULL
                AND (CAST(:p_fd AS DATE) IS NULL OR COALESCE(c_nc.fecha, nc.fecha_registro::date, c_fc.fecha) >= CAST(:p_fd AS DATE))
                AND (CAST(:p_fh AS DATE) IS NULL OR COALESCE(c_nc.fecha, nc.fecha_registro::date, c_fc.fecha) <= CAST(:p_fh AS DATE))
                AND (:p_per IS NULL OR COALESCE(c_nc.periodo::text, c_fc.periodo::text) LIKE :p_per || '%'
                     OR TO_CHAR(COALESCE(c_nc.fecha, nc.fecha_registro::date, c_fc.fecha), 'YYYY-MM') = :p_per)

              UNION ALL

              SELECT
                COALESCE(NULLIF(TRIM(al.operador), ''), 'Sin operador asignado') AS operador,
                COALESCE(NULLIF(TRIM(nd.motivorefactura), ''), 'Refacturación') AS motivo,
                COALESCE(NULLIF(TRIM(c_fc.cobertura), ''), NULLIF(TRIM(c_nd.cobertura), ''), 'Sin especificar') AS financiador,
                COALESCE(nd.importerefactura, 0) AS monto_debitado,
                0 AS aceptado,
                COALESCE(nd.importerefactura, 0) AS refacturado,
                COALESCE(NULLIF(TRIM(c_fc.tiporegistro), ''), NULLIF(TRIM(c_nd.tiporegistro), ''), 'Ambulatorios') AS tipo_registro
              FROM notadedebito nd
              LEFT JOIN amb_liquidado al ON nd.id_prestacion = al.id
              LEFT JOIN cabecera c_fc ON al.idcabecera = c_fc.id
              LEFT JOIN cabecera c_nd ON nd.idcabecera = c_nd.id
              LEFT JOIN ids_anulados_15d da_nd ON da_nd.id = c_nd.id
              LEFT JOIN ids_anulados_15d da_fc ON da_fc.id = c_fc.id
              WHERE nd.id_notadecredito IS NULL
                AND NOT EXISTS (SELECT 1 FROM notadecredito nc WHERE nc.id_prestacion = nd.id_prestacion)
                AND da_nd.id IS NULL
                AND da_fc.id IS NULL
                AND (CAST(:p_fd AS DATE) IS NULL OR COALESCE(c_nd.fecha, nd.fecha_registro::date, c_fc.fecha) >= CAST(:p_fd AS DATE))
                AND (CAST(:p_fh AS DATE) IS NULL OR COALESCE(c_nd.fecha, nd.fecha_registro::date, c_fc.fecha) <= CAST(:p_fh AS DATE))
                AND (:p_per IS NULL OR COALESCE(c_nd.periodo::text, c_fc.periodo::text) LIKE :p_per || '%'
                     OR TO_CHAR(COALESCE(c_nd.fecha, nd.fecha_registro::date, c_fc.fecha), 'YYYY-MM') = :p_per)
            )
            SELECT operador, motivo, financiador, monto_debitado, aceptado, refacturado, tipo_registro
            FROM items
            """;

        Query q = entityManager.createNativeQuery(sql);
        q.setParameter("p_fd", fechaDesde != null ? java.sql.Date.valueOf(fechaDesde) : null);
        q.setParameter("p_fh", fechaHasta != null ? java.sql.Date.valueOf(fechaHasta) : null);
        q.setParameter("p_per", filtrarPeriodo ? periodoFiltro.trim() : null);

        List<ItemDebitoDesempeno> items = new ArrayList<>();
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        for (Object[] r : rows) {
            items.add(mapearFilaItemDebito(r));
        }

        return agruparMetricasPorItems(items).stream()
                .map(m -> new MetricaOperadorDTO(
                        m.actor(),
                        m.cantidadRegistros(),
                        m.debitosAceptados(),
                        m.debitosRefacturados(),
                        m.totalTramitado(),
                        m.ticketPromedio(),
                        m.tasaRecupero(),
                        m.motivos()
                ))
                .collect(Collectors.toList());
    }

    public List<MetricaOperadorDTO> procesarMetricasOperadores(List<CadenaTrazabilidadDTO> cadenas) {
        if (cadenas == null || cadenas.isEmpty()) {
            return Collections.emptyList();
        }

        List<ItemDebitoDesempeno> items = new ArrayList<>();

        for (CadenaTrazabilidadDTO cadena : cadenas) {
            List<EventoTrazabilidadDTO> historial = cadena.getHistorialEventos();
            if (historial == null || historial.isEmpty()) {
                continue;
            }

            // Extraer el operador responsable del evento FC (emisión inicial)
            String operador = historial.stream()
                    .filter(e -> "FC".equalsIgnoreCase(e.getTipo()) && e.getResponsable() != null && !e.getResponsable().trim().isEmpty())
                    .map(EventoTrazabilidadDTO::getResponsable)
                    .findFirst()
                    .orElse("Sin operador asignado");

            for (int i = 0; i < historial.size(); i++) {
                EventoTrazabilidadDTO e = historial.get(i);
                if ("NC".equalsIgnoreCase(e.getTipo())) {
                    String motivo = (e.getDescripcion() != null && !e.getDescripcion().trim().isEmpty() && !"Débito recibido".equalsIgnoreCase(e.getDescripcion().trim()))
                            ? e.getDescripcion().trim() : "Sin motivo especificado";
                    String financiador = (cadena.getFinanciador() != null && !cadena.getFinanciador().trim().isEmpty())
                            ? cadena.getFinanciador().trim() : "Sin especificar";
                    BigDecimal monto = e.getMonto() != null ? e.getMonto() : BigDecimal.ZERO;

                    boolean tieneNdPosterior = false;
                    for (int j = i + 1; j < historial.size(); j++) {
                        EventoTrazabilidadDTO evPost = historial.get(j);
                        if ("ND".equalsIgnoreCase(evPost.getTipo()) && !"Incremento / Ajuste".equalsIgnoreCase(evPost.getDescripcion())) {
                            tieneNdPosterior = true;
                            break;
                        }
                    }

                    items.add(new ItemDebitoDesempeno(operador, motivo, financiador, monto, tieneNdPosterior, e.getTipoRegistro()));
                }
            }
        }

        return agruparMetricasPorItems(items).stream()
                .map(m -> new MetricaOperadorDTO(
                        m.actor(),
                        m.cantidadRegistros(),
                        m.debitosAceptados(),
                        m.debitosRefacturados(),
                        m.totalTramitado(),
                        m.ticketPromedio(),
                        m.tasaRecupero(),
                        m.motivos()
                ))
                .collect(Collectors.toList());
    }

    private Long resolverIdGrupoTrazabilidad(CabeceraBase c) {
        if (c.getAsociadogrupo() != null && c.getAsociadogrupo() != 0L) {
            return c.getAsociadogrupo();
        }
        if (c.getGrupo() != null && c.getGrupo() != 0L) {
            return c.getGrupo();
        }
        if (c.getAsociado() != null && c.getAsociado() != 0L) {
            return c.getAsociado();
        }
        return c.getId();
    }

    /**
     * Bucles de Insistencia:
     * Reutiliza el motor de trazabilidad para filtrar únicamente aquellos expedientes
     * que hayan recibido 2 o más débitos (eventos de tipo 'NC') a lo largo de su ciclo de vida,
     * ordenados por severidad: cantidad de débitos descendente y monto debitado descendente.
     *
     * @param financiador filtro opcional por financiador
     * @param medico      filtro opcional por médico
     * @param periodo     filtro opcional por período
     * @return Lista de CadenaTrazabilidadDTO con bucles de insistencia
     */
    public List<CadenaTrazabilidadDTO> getBuclesInsistencia(String financiador, String medico, String periodo) {
        return getBuclesInsistencia(financiador, medico, periodo, null, null);
    }

    @Cacheable(CacheConfig.CACHE_BUCLES)
    public List<CadenaTrazabilidadDTO> getBuclesInsistencia(String financiador, String medico, String periodo, String fechaDesde, String fechaHasta) {
        // ── Pre-filtrado SQL: solo familias con ND >= 2 y NC >= 1 (bucles candidatos) ─────────
        LocalDate fDesde = null;
        LocalDate fHasta = null;
        if (fechaDesde != null && !fechaDesde.trim().isEmpty()) {
            try { fDesde = LocalDate.parse(fechaDesde.trim()); } catch (Exception ignored) {}
        }
        if (fechaHasta != null && !fechaHasta.trim().isEmpty()) {
            try { fHasta = LocalDate.parse(fechaHasta.trim()); } catch (Exception ignored) {}
        }
        if (fDesde == null && fHasta == null && periodo != null && !periodo.trim().isEmpty() && !"TODOS".equalsIgnoreCase(periodo.trim())) {
            try {
                YearMonth ym = YearMonth.parse(periodo.trim());
                fDesde = ym.atDay(1);
                fHasta = ym.atEndOfMonth();
            } catch (Exception ignored) {}
        }
        // Protección: ventana de 12 meses por defecto si no hay filtro
        if (fDesde == null && fHasta == null) {
            fDesde = LocalDate.now().minusMonths(12).withDayOfMonth(1);
        }

        // Solo cargar las familias que tienen 2+ ND y 1+ NC (candidatos a bucle de insistencia)
        List<Long> idsGruposConBucles = cabeceraRepository.findIdsGruposConMultiplesNc(fDesde, fHasta);
        if (idsGruposConBucles == null || idsGruposConBucles.isEmpty()) {
            return Collections.emptyList();
        }

        List<? extends CabeceraBase> comprobantes;
        List<CabeceraLigeraDTO> comprobantesLigeros = new ArrayList<>();
        int batchSize = 500;
        for (int i = 0; i < idsGruposConBucles.size(); i += batchSize) {
            List<Long> batch = idsGruposConBucles.subList(i, Math.min(i + batchSize, idsGruposConBucles.size()));
            comprobantesLigeros.addAll(cabeceraRepository.findLigeraByGrupoOrAsociadogrupoOrIdIn(batch));
        }
        if (!comprobantesLigeros.isEmpty()) {
            comprobantes = comprobantesLigeros;
        } else {
            List<Cabecera> comprobantesEntidad = new ArrayList<>();
            for (int i = 0; i < idsGruposConBucles.size(); i += batchSize) {
                List<Long> batch = idsGruposConBucles.subList(i, Math.min(i + batchSize, idsGruposConBucles.size()));
                comprobantesEntidad.addAll(cabeceraRepository.findByGrupoOrAsociadogrupoOrIdIn(batch));
            }
            comprobantes = comprobantesEntidad;
        }
        if (comprobantes.isEmpty()) {
            return Collections.emptyList();
        }

        // Filtrar comprobantes anulados antes de construir las cadenas
        Set<Long> idsAnulados = new HashSet<>(identificarComprobantesAnulados15Dias(comprobantes, null));
        if (!idsAnulados.isEmpty()) {
            comprobantes = comprobantes.stream()
                    .filter(c -> c.getId() == null || !idsAnulados.contains(c.getId()))
                    .collect(Collectors.toList());
            if (comprobantes.isEmpty()) return Collections.emptyList();
        }

        // Construir cadenas de bucles desglosadas por prestación
        return construirCadenasBucles(comprobantes, financiador, medico, periodo, fDesde, fHasta);
    }

    private List<CadenaTrazabilidadDTO> construirCadenasBucles(
            List<? extends CabeceraBase> comprobantes,
            String financiadorFiltro, String medicoFiltro, String periodoFiltro,
            LocalDate fDesde, LocalDate fHasta) {

        // Agrupar en memoria usando Java Streams por identificador de grupo
        Map<Long, List<CabeceraBase>> grupos = comprobantes.stream()
                .collect(Collectors.groupingBy(
                        this::resolverIdGrupoTrazabilidad,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        // Obtener IDs de las facturas raíces de cada grupo
        Set<Long> fcIds = new HashSet<>();
        Set<Long> ncIds = new HashSet<>();
        Set<Long> ndIds = new HashSet<>();

        for (List<CabeceraBase> miembros : grupos.values()) {
            for (CabeceraBase c : miembros) {
                if (c.getId() == null) continue;
                String t = resolverTipoBase(c.getTipo());
                if ("FC".equalsIgnoreCase(t)) fcIds.add(c.getId());
                else if ("NC".equalsIgnoreCase(t)) ncIds.add(c.getId());
                else if ("ND".equalsIgnoreCase(t)) ndIds.add(c.getId());
            }
        }

        // 1. Carga batch de prestaciones por FC
        Map<Long, List<AmbLiquidado>> ambPorFcId = new HashMap<>();
        if (!fcIds.isEmpty()) {
            List<Long> fcIdsList = new ArrayList<>(fcIds);
            int batchSize = 500;
            for (int i = 0; i < fcIdsList.size(); i += batchSize) {
                List<Long> batch = fcIdsList.subList(i, Math.min(i + batchSize, fcIdsList.size()));
                List<AmbLiquidado> ambs = ambLiquidadoRepository.findByCabecera_IdIn(batch);
                for (AmbLiquidado al : ambs) {
                    if (al.getCabecera() != null && al.getCabecera().getId() != null) {
                        ambPorFcId.computeIfAbsent(al.getCabecera().getId(), k -> new ArrayList<>()).add(al);
                    }
                }
            }
        }

        // 2. Carga batch de Notas de Crédito
        Map<Long, List<NotaDeCredito>> ncPorCabeceraId = new HashMap<>();
        Map<Integer, NotaDeCredito> ncPorId = new HashMap<>();
        if (!ncIds.isEmpty()) {
            List<Long> ncIdsList = new ArrayList<>(ncIds);
            int batchSize = 500;
            for (int i = 0; i < ncIdsList.size(); i += batchSize) {
                List<Long> batch = ncIdsList.subList(i, Math.min(i + batchSize, ncIdsList.size()));
                List<NotaDeCredito> ncs = notaDeCreditoRepository.findByCabecera_IdIn(batch);
                for (NotaDeCredito nc : ncs) {
                    if (nc.getId() != null) ncPorId.put(nc.getId(), nc);
                    if (nc.getCabecera() != null && nc.getCabecera().getId() != null) {
                        ncPorCabeceraId.computeIfAbsent(nc.getCabecera().getId(), k -> new ArrayList<>()).add(nc);
                    }
                }
            }
        }

        // 3. Carga batch de Notas de Débito
        Map<Long, List<NotaDeDebito>> ndPorCabeceraId = new HashMap<>();
        Map<Integer, NotaDeDebito> ndPorId = new HashMap<>();
        if (!ndIds.isEmpty()) {
            List<Long> ndIdsList = new ArrayList<>(ndIds);
            int batchSize = 500;
            for (int i = 0; i < ndIdsList.size(); i += batchSize) {
                List<Long> batch = ndIdsList.subList(i, Math.min(i + batchSize, ndIdsList.size()));
                List<NotaDeDebito> nds = notaDeDebitoRepository.findByCabecera_IdIn(batch);
                for (NotaDeDebito nd : nds) {
                    if (nd.getId() != null) ndPorId.put(nd.getId(), nd);
                    if (nd.getCabecera() != null && nd.getCabecera().getId() != null) {
                        ndPorCabeceraId.computeIfAbsent(nd.getCabecera().getId(), k -> new ArrayList<>()).add(nd);
                    }
                }
            }
        }

        List<CadenaTrazabilidadDTO> resultado = new ArrayList<>();

        for (Map.Entry<Long, List<CabeceraBase>> entry : grupos.entrySet()) {
            List<CabeceraBase> miembros = entry.getValue();
            if (miembros.isEmpty()) continue;

            CabeceraBase fcRaiz = miembros.stream()
                    .filter(c -> "FC".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                    .findFirst()
                    .orElse(null);

            if (fcRaiz == null) continue;

            // Filtros generales de Factura
            if (financiadorFiltro != null && !financiadorFiltro.trim().isEmpty() && !"TODAS".equalsIgnoreCase(financiadorFiltro.trim())) {
                String fFiltro = financiadorFiltro.trim().toLowerCase();
                String cob = fcRaiz.getCobertura() != null ? fcRaiz.getCobertura().toLowerCase() : "";
                String cod = fcRaiz.getCodigoCobertura() != null ? fcRaiz.getCodigoCobertura().toLowerCase() : "";
                if (!cob.contains(fFiltro) && !cod.contains(fFiltro)) {
                    continue;
                }
            }

            if (periodoFiltro != null && !periodoFiltro.trim().isEmpty() && !"TODOS".equalsIgnoreCase(periodoFiltro.trim())) {
                String pFiltro = periodoFiltro.trim();
                String perStr = fcRaiz.getPeriodo() != null ? fcRaiz.getPeriodo().toString() : "";
                String fecStr = fcRaiz.getFecha() != null ? fcRaiz.getFecha().toString() : "";
                if (!perStr.startsWith(pFiltro) && !fecStr.startsWith(pFiltro)) {
                    continue;
                }
            }

            if (fDesde != null && (fcRaiz.getFecha() == null || fcRaiz.getFecha().isBefore(fDesde))) {
                continue;
            }
            if (fHasta != null && (fcRaiz.getFecha() == null || fcRaiz.getFecha().isAfter(fHasta))) {
                continue;
            }

            // Obtener NCs y NDs del grupo
            List<NotaDeCredito> ncsGrupo = new ArrayList<>();
            for (CabeceraBase c : miembros) {
                if ("NC".equalsIgnoreCase(resolverTipoBase(c.getTipo()))) {
                    List<NotaDeCredito> list = c.getId() != null ? ncPorCabeceraId.get(c.getId()) : null;
                    if (list != null && !list.isEmpty()) {
                        ncsGrupo.addAll(list);
                    } else if (c.getLetra() != null && c.getPtovta() != null && c.getNumero() != null) {
                        List<NotaDeCredito> porComprobante = notaDeCreditoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_Numero(
                                c.getLetra(), c.getPtovta(), c.getNumero());
                        if (porComprobante != null && !porComprobante.isEmpty()) {
                            ncsGrupo.addAll(porComprobante);
                            for (NotaDeCredito nc : porComprobante) {
                                if (nc.getId() != null) ncPorId.put(nc.getId(), nc);
                            }
                        }
                    }
                }
            }

            List<NotaDeDebito> ndsGrupo = new ArrayList<>();
            for (CabeceraBase c : miembros) {
                if ("ND".equalsIgnoreCase(resolverTipoBase(c.getTipo()))) {
                    List<NotaDeDebito> list = c.getId() != null ? ndPorCabeceraId.get(c.getId()) : null;
                    if (list != null && !list.isEmpty()) {
                        ndsGrupo.addAll(list);
                    } else if (c.getLetra() != null && c.getPtovta() != null && c.getNumero() != null) {
                        List<NotaDeDebito> porComprobante = notaDeDebitoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_Numero(
                                c.getLetra(), c.getPtovta(), c.getNumero());
                        if (porComprobante != null && !porComprobante.isEmpty()) {
                            ndsGrupo.addAll(porComprobante);
                            for (NotaDeDebito nd : porComprobante) {
                                if (nd.getId() != null) ndPorId.put(nd.getId(), nd);
                            }
                        }
                    }
                }
            }

            // Recolectar todas las prestaciones candidatas (facturadas o involucradas en débitos/refacturaciones)
            Map<Integer, AmbLiquidado> prestacionesCandidatas = new LinkedHashMap<>();

            // A) Desde el mapa de FC por ID
            if (ambPorFcId.containsKey(fcRaiz.getId())) {
                for (AmbLiquidado amb : ambPorFcId.get(fcRaiz.getId())) {
                    if (amb.getId() != null) prestacionesCandidatas.put(amb.getId(), amb);
                }
            }

            // B) Por letra, ptovta, numero si estaba vacío
            if (prestacionesCandidatas.isEmpty() && fcRaiz.getLetra() != null && fcRaiz.getPtovta() != null && fcRaiz.getNumero() != null) {
                List<AmbLiquidado> porComprobante = ambLiquidadoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_Numero(
                        fcRaiz.getLetra(), fcRaiz.getPtovta(), fcRaiz.getNumero());
                if (porComprobante != null) {
                    for (AmbLiquidado amb : porComprobante) {
                        if (amb.getId() != null) prestacionesCandidatas.putIfAbsent(amb.getId(), amb);
                    }
                }
            }

            // C) Desde las prestaciones asociadas directamente a los débitos NC del grupo
            for (NotaDeCredito nc : ncsGrupo) {
                AmbLiquidado p = resolverPrestacionDeNc(nc, ndPorId, ncPorId);
                if (p != null && p.getId() != null) {
                    prestacionesCandidatas.putIfAbsent(p.getId(), p);
                }
            }

            // D) Desde las prestaciones asociadas a las refacturaciones ND del grupo
            for (NotaDeDebito nd : ndsGrupo) {
                AmbLiquidado p = resolverPrestacionDeNd(nd, ncPorId);
                if (p != null && p.getId() != null) {
                    prestacionesCandidatas.putIfAbsent(p.getId(), p);
                }
            }

            // E) Fallback nativo: findPrestacionesPorFactura si aún no hay candidatos
            if (prestacionesCandidatas.isEmpty() && fcRaiz.getLetra() != null && fcRaiz.getPtovta() != null && fcRaiz.getNumero() != null) {
                try {
                    List<PrestacionAuditoriaDTO> auditDtos = ambLiquidadoRepository.findPrestacionesPorFactura(
                            fcRaiz.getLetra(), fcRaiz.getPtovta(), fcRaiz.getNumero());
                    if (auditDtos != null) {
                        for (PrestacionAuditoriaDTO dto : auditDtos) {
                            if (dto.getId() != null && !prestacionesCandidatas.containsKey(dto.getId())) {
                                AmbLiquidado ambStub = new AmbLiquidado();
                                ambStub.setId(dto.getId());
                                ambStub.setCodigo(dto.getCodigo());
                                ambStub.setDescripcion(dto.getDescripcion());
                                ambStub.setPaciente(dto.getPaciente());
                                ambStub.setCarnet(dto.getCarnet());
                                ambStub.setMedico(dto.getMedico());
                                ambStub.setTotal(dto.getTotal());
                                ambStub.setTotalNeto(dto.getTotalNeto());
                                prestacionesCandidatas.put(dto.getId(), ambStub);
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }

            // F) Fallback nativo: findPrestacionesPorNotaCredito
            if (prestacionesCandidatas.isEmpty()) {
                for (CabeceraBase cNc : miembros) {
                    if ("NC".equalsIgnoreCase(resolverTipoBase(cNc.getTipo())) && cNc.getLetra() != null && cNc.getPtovta() != null && cNc.getNumero() != null) {
                        try {
                            List<PrestacionAuditoriaDTO> auditNcs = notaDeCreditoRepository.findPrestacionesPorNotaCredito(
                                    cNc.getLetra(), cNc.getPtovta(), cNc.getNumero());
                            if (auditNcs != null) {
                                for (PrestacionAuditoriaDTO dto : auditNcs) {
                                    if (dto.getId() != null && !prestacionesCandidatas.containsKey(dto.getId())) {
                                        AmbLiquidado ambStub = new AmbLiquidado();
                                        ambStub.setId(dto.getId());
                                        ambStub.setCodigo(dto.getCodigo());
                                        ambStub.setDescripcion(dto.getDescripcion());
                                        ambStub.setPaciente(dto.getPaciente());
                                        ambStub.setCarnet(dto.getCarnet());
                                        ambStub.setMedico(dto.getMedico());
                                        ambStub.setTotal(dto.getTotal());
                                        ambStub.setTotalNeto(dto.getTotalNeto());
                                        prestacionesCandidatas.put(dto.getId(), ambStub);
                                    }
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                }
            }

            List<BuclePrestacionDTO> prestacionesBucle = new ArrayList<>();

            for (AmbLiquidado amb : new ArrayList<>(prestacionesCandidatas.values())) {
                if (amb == null) continue;
                Integer pId = amb.getId();
                if (pId == null) continue;
                String codigoTemp;
                try {
                    codigoTemp = amb.getCodigo() != null ? amb.getCodigo().trim() : "";
                } catch (Exception e) {
                    // Si el registro de prestación referenciado no existe físicamente en la BD (huérfano), se descarta
                    continue;
                }
                final String pCod = codigoTemp;

                List<NotaDeCredito> ncsPrest = ncsGrupo.stream()
                        .filter(nc -> {
                            Integer idResuelto = resolverIdPrestacionNc(nc, ndPorId, ncPorId);
                            if (idResuelto != null && Objects.equals(pId, idResuelto)) return true;
                            if (idResuelto == null && !pCod.isEmpty() && nc.getPrestacionenglobante() != null
                                    && pCod.equalsIgnoreCase(nc.getPrestacionenglobante().trim())) {
                                return true;
                            }
                            return false;
                        })
                        .collect(Collectors.toList());

                List<NotaDeDebito> ndsPrest = ndsGrupo.stream()
                        .filter(nd -> {
                            Integer idResuelto = resolverIdPrestacionNd(nd, ncPorId);
                            if (idResuelto != null && Objects.equals(pId, idResuelto)) return true;
                            if (idResuelto == null && !pCod.isEmpty()) {
                                if (nd.getCodigo() != null && pCod.equalsIgnoreCase(nd.getCodigo().trim())) return true;
                                if (nd.getPrestacionenglobante() != null && pCod.equalsIgnoreCase(nd.getPrestacionenglobante().trim())) return true;
                            }
                            return false;
                        })
                        .collect(Collectors.toList());

                // Condición estricta de bucle de insistencia:
                // Al menos 2 Notas de Débito Y al menos 1 Nota de Crédito para esta prestación específica
                // (Facturación -> Débito recibido -> Refacturación reiterada >= 2 NDs)
                boolean esBuclePresta = (ndsPrest.size() >= 2) && (!ncsPrest.isEmpty());
                if (!esBuclePresta) continue;

                // Construir eventos cronológicos específicos de ESTA prestación con SUS montos
                List<EventoTrazabilidadDTO> eventosPrest = new ArrayList<>();

                // 1. Emisión inicial de la prestación (FC)
                BigDecimal montoPresta = BigDecimal.ZERO;
                try {
                    montoPresta = (amb.getTotal() != null && amb.getTotal().compareTo(BigDecimal.ZERO) > 0)
                            ? amb.getTotal().setScale(2, RoundingMode.HALF_UP)
                            : (amb.getTotalNeto() != null ? amb.getTotalNeto().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
                } catch (Exception ignored) {}

                String compFc = formatearComprobante(fcRaiz);
                String fechaFcStr = fcRaiz.getFecha() != null ? fcRaiz.getFecha().toString() : "";
                String respFc = "Sin operador asignado";
                try {
                    if (amb.getOperador() != null && !amb.getOperador().trim().isEmpty()) {
                        respFc = amb.getOperador().trim();
                    }
                } catch (Exception ignored) {}

                eventosPrest.add(new EventoTrazabilidadDTO(
                        "FC",
                        compFc,
                        fechaFcStr,
                        montoPresta,
                        "Emisión inicial",
                        respFc,
                        fcRaiz.getTiporegistro() != null ? fcRaiz.getTiporegistro().trim() : ""
                ));

                // 2. Débitos recibidos de la prestación (NC)
                for (NotaDeCredito nc : ncsPrest) {
                    Cabecera cNc = nc.getCabecera();
                    String compNc = cNc != null ? formatearComprobante(cNc) : "NC";
                    String fechaNc = (cNc != null && cNc.getFecha() != null) ? cNc.getFecha().toString() : "";
                    BigDecimal montoNc = nc.getImporteDebitado() != null
                            ? nc.getImporteDebitado().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                    String descNc = (nc.getMotivoDebito() != null && !nc.getMotivoDebito().trim().isEmpty() && !"Débito recibido".equalsIgnoreCase(nc.getMotivoDebito().trim()))
                            ? nc.getMotivoDebito().trim() : "Sin motivo especificado";
                    String respNc = (nc.getUsuario() != null && !nc.getUsuario().trim().isEmpty())
                            ? nc.getUsuario().trim()
                            : (cNc != null && cNc.getOrigen() != null ? cNc.getOrigen() : "Auditoría Médica");

                    eventosPrest.add(new EventoTrazabilidadDTO(
                            "NC",
                            compNc,
                            fechaNc,
                            montoNc,
                            descNc,
                            respNc,
                            cNc != null && cNc.getTiporegistro() != null ? cNc.getTiporegistro().trim() : ""
                    ));
                }

                // 3. Refacturaciones de la prestación (ND)
                for (NotaDeDebito nd : ndsPrest) {
                    Cabecera cNd = nd.getCabecera();
                    String compNd = cNd != null ? formatearComprobante(cNd) : "ND";
                    String fechaNd = (cNd != null && cNd.getFecha() != null) ? cNd.getFecha().toString() : "";
                    BigDecimal montoNd = nd.getImporterefactura() != null
                            ? nd.getImporterefactura().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                    String descNd = (nd.getMotivorefactura() != null && !nd.getMotivorefactura().trim().isEmpty())
                            ? nd.getMotivorefactura().trim() : "Refacturación";
                    String respNd = (nd.getUsuario() != null && !nd.getUsuario().trim().isEmpty())
                            ? nd.getUsuario().trim()
                            : (cNd != null && cNd.getOrigen() != null ? cNd.getOrigen() : "Facturación");

                    eventosPrest.add(new EventoTrazabilidadDTO(
                            "ND",
                            compNd,
                            fechaNd,
                            montoNd,
                            descNd,
                            respNd,
                            cNd != null && cNd.getTiporegistro() != null ? cNd.getTiporegistro().trim() : ""
                    ));
                }

                // Ordenar cronológicamente los eventos de la prestación
                eventosPrest.sort((e1, e2) -> {
                    int cmpFecha = (e1.getFecha() != null && e2.getFecha() != null)
                            ? e1.getFecha().compareTo(e2.getFecha()) : 0;
                    if (cmpFecha != 0) return cmpFecha;
                    int p1 = prioridadTipoEvento(e1.getTipo());
                    int p2 = prioridadTipoEvento(e2.getTipo());
                    return Integer.compare(p1, p2);
                });

                BigDecimal totalDebitadoPresta = ncsPrest.stream()
                        .map(nc -> nc.getImporteDebitado() != null ? nc.getImporteDebitado() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .setScale(2, RoundingMode.HALF_UP);

                BigDecimal totalRefacturadoPresta = ndsPrest.stream()
                        .map(nd -> nd.getImporterefactura() != null ? nd.getImporterefactura() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .setScale(2, RoundingMode.HALF_UP);

                String codPresta = pCod;
                String descPresta = "Prestación " + codPresta;
                String pacPresta = "";
                String carPresta = "";
                String medPresta = "No especificado";
                try {
                    if (amb.getDescripcion() != null && !amb.getDescripcion().trim().isEmpty()) {
                        descPresta = amb.getDescripcion().trim();
                    }
                    if (amb.getPaciente() != null) pacPresta = amb.getPaciente().trim();
                    if (amb.getCarnet() != null) carPresta = amb.getCarnet().trim();
                    if (amb.getMedico() != null && !amb.getMedico().trim().isEmpty()) {
                        medPresta = amb.getMedico().trim();
                    }
                } catch (Exception ignored) {}

                BuclePrestacionDTO bucleDto = new BuclePrestacionDTO(
                        amb.getId(),
                        codPresta,
                        descPresta,
                        pacPresta,
                        carPresta,
                        medPresta,
                        montoPresta,
                        totalDebitadoPresta,
                        ncsPrest.size(),
                        eventosPrest
                );
                bucleDto.setCantidadRefacturaciones(ndsPrest.size());
                bucleDto.setTotalRefacturado(totalRefacturadoPresta);
                prestacionesBucle.add(bucleDto);
            }

            if (prestacionesBucle.isEmpty()) continue;

            // Ordenar prestaciones por cantidad de refacturaciones (ND) desc, débitos (NC) desc y total debitado desc
            prestacionesBucle.sort(Comparator
                    .<BuclePrestacionDTO>comparingInt(BuclePrestacionDTO::getCantidadRefacturaciones)
                    .reversed()
                    .thenComparing(
                            Comparator.<BuclePrestacionDTO>comparingInt(BuclePrestacionDTO::getCantidadDebitos).reversed()
                    )
                    .thenComparing(
                            p -> p.getTotalDebitado() != null ? p.getTotalDebitado() : BigDecimal.ZERO,
                            Comparator.reverseOrder()
                    ));

            // Filtro por médico (si se especificó en filtros)
            if (medicoFiltro != null && !medicoFiltro.trim().isEmpty() && !"TODOS".equalsIgnoreCase(medicoFiltro.trim())) {
                String mFiltro = medicoFiltro.trim().toLowerCase();
                boolean coincide = prestacionesBucle.stream()
                        .anyMatch(p -> p.getMedico() != null && p.getMedico().toLowerCase().contains(mFiltro));
                if (!coincide) continue;
            }

            // Datos consolidados de cabecera de la factura
            BigDecimal montoFacturadoOriginal = fcRaiz.getDebe() != null
                    ? fcRaiz.getDebe().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

            BigDecimal totalDebitadoFactura = miembros.stream()
                    .filter(c -> "NC".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                    .map(c -> (c.getHaber() != null && c.getHaber().compareTo(BigDecimal.ZERO) > 0)
                            ? c.getHaber() : (c.getDebe() != null ? c.getDebe() : BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            String idPrestacion = formatearComprobante(fcRaiz);
            String financiador = obtenerNombreFinanciador(fcRaiz);

            // Determinar descripción y médico para la fila principal de la factura
            String descripcion;
            if (prestacionesBucle.size() > 1) {
                descripcion = prestacionesBucle.size() + " prestaciones con bucle recurrente";
            } else {
                descripcion = prestacionesBucle.get(0).getDescripcion();
            }

            Set<String> medicosDistintos = prestacionesBucle.stream()
                    .map(BuclePrestacionDTO::getMedico)
                    .filter(m -> m != null && !m.trim().isEmpty() && !"No especificado".equalsIgnoreCase(m.trim()))
                    .collect(Collectors.toSet());

            String medicoFinal;
            if (medicosDistintos.isEmpty()) {
                medicoFinal = "No especificado";
            } else if (medicosDistintos.size() == 1) {
                medicoFinal = medicosDistintos.iterator().next();
            } else {
                medicoFinal = "Varios médicos (" + medicosDistintos.size() + ")";
            }

            // Historial de eventos representativo (si hay 1 sola prestación, su timeline directo)
            List<EventoTrazabilidadDTO> historialRepresentativo = prestacionesBucle.size() == 1
                    ? prestacionesBucle.get(0).getHistorialEventos()
                    : prestacionesBucle.get(0).getHistorialEventos();

            CadenaTrazabilidadDTO cad = new CadenaTrazabilidadDTO(
                    idPrestacion,
                    descripcion,
                    financiador,
                    medicoFinal,
                    montoFacturadoOriginal,
                    totalDebitadoFactura,
                    historialRepresentativo
            );

            cad.setPrestaciones(prestacionesBucle);
            cad.setTipoRegistro(fcRaiz.getTiporegistro() != null ? fcRaiz.getTiporegistro().trim() : "");
            cad.setCodigoCobertura(fcRaiz.getCodigoCobertura() != null ? fcRaiz.getCodigoCobertura().trim() : "");
            cad.setFechaFactura(fcRaiz.getFecha() != null ? fcRaiz.getFecha().toString() : "");

            resultado.add(cad);
        }

        // Ordenar facturas por cantidad de prestaciones con bucle y total debitado descendente
        resultado.sort(Comparator
                .<CadenaTrazabilidadDTO>comparingInt(c -> c.getPrestaciones() != null ? c.getPrestaciones().size() : 0)
                .reversed()
                .thenComparing(
                        c -> c.getTotalDebitado() != null ? c.getTotalDebitado() : BigDecimal.ZERO,
                        Comparator.reverseOrder()
                ));

        return resultado;
    }

    private AmbLiquidado obtenerPrestacionSegura(AmbLiquidado p) {
        if (p == null) return null;
        try {
            // Verificar si el proxy existe realmente en BD (evita ObjectNotFoundException si la fila fue eliminada)
            p.getCodigo();
            return p;
        } catch (Exception e) {
            return null;
        }
    }

    private Integer resolverIdPrestacionNc(NotaDeCredito nc, Map<Integer, NotaDeDebito> ndPorId, Map<Integer, NotaDeCredito> ncPorId) {
        AmbLiquidado p = resolverPrestacionDeNc(nc, ndPorId, ncPorId);
        return (p != null) ? p.getId() : null;
    }

    private Integer resolverIdPrestacionNd(NotaDeDebito nd, Map<Integer, NotaDeCredito> ncPorId) {
        AmbLiquidado p = resolverPrestacionDeNd(nd, ncPorId);
        return (p != null) ? p.getId() : null;
    }

    private AmbLiquidado resolverPrestacionDeNc(NotaDeCredito nc, Map<Integer, NotaDeDebito> ndPorId, Map<Integer, NotaDeCredito> ncPorId) {
        if (nc == null) return null;
        try {
            AmbLiquidado p = obtenerPrestacionSegura(nc.getPrestacion());
            if (p != null) {
                return p;
            }
            if (nc.getNotaDeDebitoPadre() != null) {
                NotaDeDebito nd = nc.getNotaDeDebitoPadre();
                p = obtenerPrestacionSegura(nd.getPrestacion());
                if (p != null) {
                    return p;
                }
                if (nd.getNotaDeCreditoPadre() != null) {
                    p = obtenerPrestacionSegura(nd.getNotaDeCreditoPadre().getPrestacion());
                    if (p != null) {
                        return p;
                    }
                }
                if (nd.getId() != null && ndPorId.containsKey(nd.getId())) {
                    NotaDeDebito ndFull = ndPorId.get(nd.getId());
                    p = obtenerPrestacionSegura(ndFull.getPrestacion());
                    if (p != null) {
                        return p;
                    }
                    if (ndFull.getNotaDeCreditoPadre() != null) {
                        NotaDeCredito ncAbuelo = ndFull.getNotaDeCreditoPadre();
                        p = obtenerPrestacionSegura(ncAbuelo.getPrestacion());
                        if (p != null) {
                            return p;
                        }
                        if (ncAbuelo.getId() != null && ncPorId.containsKey(ncAbuelo.getId())) {
                            NotaDeCredito ncAbueloFull = ncPorId.get(ncAbuelo.getId());
                            p = obtenerPrestacionSegura(ncAbueloFull.getPrestacion());
                            if (p != null) {
                                return p;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Protección contra referencias huérfanas en la base de datos
        }
        return null;
    }

    private AmbLiquidado resolverPrestacionDeNd(NotaDeDebito nd, Map<Integer, NotaDeCredito> ncPorId) {
        if (nd == null) return null;
        try {
            AmbLiquidado p = obtenerPrestacionSegura(nd.getPrestacion());
            if (p != null) {
                return p;
            }
            if (nd.getNotaDeCreditoPadre() != null) {
                NotaDeCredito nc = nd.getNotaDeCreditoPadre();
                p = obtenerPrestacionSegura(nc.getPrestacion());
                if (p != null) {
                    return p;
                }
                if (nc.getId() != null && ncPorId.containsKey(nc.getId())) {
                    NotaDeCredito ncFull = ncPorId.get(nc.getId());
                    p = obtenerPrestacionSegura(ncFull.getPrestacion());
                    if (p != null) {
                        return p;
                    }
                }
            }
        } catch (Exception e) {
            // Protección contra referencias huérfanas en la base de datos
        }
        return null;
    }

    private int prioridadTipoEvento(String tipo) {
        if (tipo == null) return 99;
        String t = tipo.trim().toUpperCase();
        if (t.startsWith("FC") || t.startsWith("FAC")) return 1;
        if (t.startsWith("NC")) return 2;
        if (t.startsWith("ND")) return 3;
        if (t.startsWith("RC")) return 4;
        return 5;
    }
}


