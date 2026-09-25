package com.debitos.backend.service;

import com.debitos.backend.dto.directorio.*;
import com.debitos.backend.dto.reportes.*;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;
import com.debitos.backend.model.AmbLiquidado;
import com.debitos.backend.model.Cabecera;
import com.debitos.backend.model.NcAjusteDeIva;
import com.debitos.backend.model.NdAjusteDeIva;
import com.debitos.backend.model.NotaDeCredito;
import com.debitos.backend.model.NotaDeDebito;
import com.debitos.backend.repository.AmbLiquidadoRepository;
import com.debitos.backend.repository.CabeceraRepository;
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
            WITH fc_madre AS (
                SELECT DISTINCT ON (COALESCE(asociadogrupo, grupo))
                    COALESCE(asociadogrupo, grupo) AS gid,
                    periodo,
                    fecha
                FROM cabecera
                WHERE UPPER(TRIM(tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(asociadogrupo, grupo) IS NOT NULL
                ORDER BY COALESCE(asociadogrupo, grupo), fecha ASC, id ASC
            )
            SELECT 
                -- 0. Facturación Original (FC)
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) AS facturacion_fc,
                -- 1. Cantidad de comprobantes FC
                COALESCE(COUNT(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN 1 END), 0) AS cant_facturas,

                -- 2. Incrementos (ND no vinculadas a NC)
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') AND NOT (
                    EXISTS (SELECT 1 FROM notadedebito nd WHERE nd.idcabecera = c.id AND nd.id_notadecredito IS NOT NULL)
                    OR EXISTS (SELECT 1 FROM cabecera c_nc WHERE c_nc.id = c.asociado AND UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB'))
                    OR EXISTS (SELECT 1 FROM nd_ajustedeiva iva WHERE iva.idcabecera = c.id)
                ) THEN c.debe ELSE 0 END), 0) AS incrementos_nd,

                -- 3. Débitos Recibidos (NC)
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS debitos_nc,

                -- 4. Refacturación (ND derivadas de NC)
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') AND (
                    EXISTS (SELECT 1 FROM notadedebito nd WHERE nd.idcabecera = c.id AND nd.id_notadecredito IS NOT NULL)
                    OR EXISTS (SELECT 1 FROM cabecera c_nc WHERE c_nc.id = c.asociado AND UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB'))
                    OR EXISTS (SELECT 1 FROM nd_ajustedeiva iva WHERE iva.idcabecera = c.id)
                ) THEN c.debe ELSE 0 END), 0) AS refacturacion_nd,

                -- 5. Cobranzas (RC, REC, OP)
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS cobranzas_rc,

                -- 6. DSO Ponderado por Saldo
                COALESCE(
                    CAST(ROUND(
                        SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') AND (c.debe - COALESCE(c.haber, 0)) > 0 
                                 THEN (CURRENT_DATE - c.fecha) * (c.debe - COALESCE(c.haber, 0)) 
                                 ELSE 0 END)
                        / NULLIF(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') AND (c.debe - COALESCE(c.haber, 0)) > 0 
                                          THEN (c.debe - COALESCE(c.haber, 0)) 
                                          ELSE 0 END), 0)
                    ) AS INTEGER),
                    429
                ) AS dso_ponderado

            FROM cabecera c
            LEFT JOIN fc_madre fc ON COALESCE(c.asociadogrupo, c.grupo) = fc.gid
            WHERE COALESCE(
                CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.periodo ELSE fc.periodo END,
                c.periodo,
                c.fecha
            ) IS NOT NULL
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

    public List<DirectorioGrupoFacturaDTO> obtenerGruposFacturas(String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        StringBuilder sql = new StringBuilder("""
            SELECT c.id, c.tipo, c.letra, c.ptovta, c.numero, c.fecha, c.periodo, 
                   c.codigo_cobertura, c.cobertura, c.asociadogrupo, c.debe, c.id_estado
            FROM cabecera c
            WHERE 1=1
        """);
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sql.append(" AND UPPER(TRIM(c.tipo)) = :tipoDoc");
        } else {
            sql.append(" AND (UPPER(TRIM(c.tipo)) IN ('FC', 'FCE', 'FCA', 'FAC') OR UPPER(TRIM(c.tipo)) LIKE 'FC%')");
        }
        aplicarFiltrosCabeceraPeriodo(sql, "c", null, codigoCobertura, fechaDesde, fechaHasta);
        sql.append(" ORDER BY COALESCE(c.periodo, c.fecha) DESC, c.fecha DESC, c.numero DESC LIMIT 200");

        Query query = crearQueryConFiltros(sql.toString(), codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        List<Object[]> rows = query.getResultList();

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

            List<DirectorioComprobanteDTO> derivados = new ArrayList<>();
            BigDecimal sumaAceptado = BigDecimal.ZERO;
            BigDecimal sumaNoAceptado = BigDecimal.ZERO;
            BigDecimal sumaCobranza = BigDecimal.ZERO;
            int cantRefacturaciones = 0;

            for (Cabecera c : familia) {
                if (Objects.equals(c.getId(), dto.getId())) continue; // omitir la propia factura raíz

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

        return resultado;
    }

    public List<DirectorioMotivoDebitoDTO> obtenerDistribucionMotivos(String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
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
            WITH fc_madre AS (
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
                ORDER BY COALESCE(asociadogrupo, grupo), fecha ASC, id ASC
            )
            SELECT TRIM(nc.motivodedebito) AS motivo, 
                   SUM(COALESCE(nc.importedebitado, 0)) AS montoTotal,
                   COUNT(nc.id) AS cantidadCasos
            FROM notadecredito nc
            LEFT JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
            LEFT JOIN amb_liquidado al ON nc.id_prestacion = al.id
            LEFT JOIN cabecera c_fc ON al.idcabecera = c_fc.id
            LEFT JOIN fc_madre fc ON COALESCE(c_nc.asociadogrupo, c_nc.grupo) = fc.gid
            WHERE nc.motivodedebito IS NOT NULL 
              AND TRIM(nc.motivodedebito) <> ''
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
        if (fechaDesde != null) {
            sql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_nc.periodo, c_fc.fecha, fc.fecha, c_nc.fecha) >= :fechaDesde");
        }
        if (fechaHasta != null) {
            sql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_nc.periodo, c_fc.fecha, fc.fecha, c_nc.fecha) <= :fechaHasta");
        }
        sql.append(" GROUP BY TRIM(nc.motivodedebito) ORDER BY montoTotal DESC");

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

        BigDecimal granTotalDebitado = BigDecimal.ZERO;
        List<DirectorioMotivoDebitoDTO> lista = new ArrayList<>();

        for (Object[] r : rows) {
            String motivo = r[0] != null ? r[0].toString() : "Sin Especificar";
            BigDecimal monto = r[1] != null ? new BigDecimal(r[1].toString()) : BigDecimal.ZERO;
            long casos = r[2] != null ? ((Number) r[2]).longValue() : 0L;
            granTotalDebitado = granTotalDebitado.add(monto);
            lista.add(new DirectorioMotivoDebitoDTO(motivo, monto.setScale(2, RoundingMode.HALF_UP), BigDecimal.ZERO, casos));
        }

        // Calcular porcentajes
        if (granTotalDebitado.compareTo(BigDecimal.ZERO) > 0) {
            for (DirectorioMotivoDebitoDTO item : lista) {
                BigDecimal porc = item.getMontoTotal()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(granTotalDebitado, 2, RoundingMode.HALF_UP);
                item.setPorcentaje(porc);
            }
        }

        return lista;
    }

    public List<DirectorioPrestacionDetalleDTO> obtenerPrestacionesPorMotivo(String motivo, String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
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
            WITH fc_madre AS (
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
        if (fechaDesde != null) {
            sql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_nc.periodo, c_fc.fecha, fc.fecha, c_nc.fecha) >= :fechaDesde");
        }
        if (fechaHasta != null) {
            sql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_nc.periodo, c_fc.fecha, fc.fecha, c_nc.fecha) <= :fechaHasta");
        }
        sql.append(" ORDER BY COALESCE(c_fc.periodo, fc.periodo, c_nc.periodo, c_fc.fecha, fc.fecha, c_nc.fecha) DESC, nc.id DESC LIMIT 500");

        Query q = entityManager.createNativeQuery(sql.toString());
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

        List<Object[]> rows = q.getResultList();
        List<DirectorioPrestacionDetalleDTO> lista = new ArrayList<>();

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

        return lista;
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
            exprPeriodo = String.format("COALESCE(CASE WHEN UPPER(TRIM(%s.tipo)) IN ('FC','FAC','FCE','FCA') THEN %s.periodo ELSE %s.periodo END, %s.periodo, %s.fecha)",
                    aliasCabecera, aliasCabecera, aliasFcMadre, aliasCabecera, aliasCabecera);
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
            WITH fc_madre AS (
                SELECT DISTINCT ON (COALESCE(asociadogrupo, grupo))
                    COALESCE(asociadogrupo, grupo) AS gid,
                    periodo,
                    fecha
                FROM cabecera
                WHERE UPPER(TRIM(tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(asociadogrupo, grupo) IS NOT NULL
                ORDER BY COALESCE(asociadogrupo, grupo), fecha ASC, id ASC
            )
            SELECT 
                COALESCE(NULLIF(TRIM(c.codigo_cobertura), ''), 'S/C') || ' - ' || COALESCE(NULLIF(TRIM(c.cobertura), ''), 'Sin financiador') AS financiador,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) AS facturacion_fc,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') AND NOT (
                    EXISTS (SELECT 1 FROM notadedebito nd WHERE nd.idcabecera = c.id AND nd.id_notadecredito IS NOT NULL)
                    OR EXISTS (SELECT 1 FROM cabecera c_nc WHERE c_nc.id = c.asociado AND UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB'))
                    OR EXISTS (SELECT 1 FROM nd_ajustedeiva iva WHERE iva.idcabecera = c.id)
                ) THEN c.debe ELSE 0 END), 0) AS incrementos_nd,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS debitos_nc,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') AND (
                    EXISTS (SELECT 1 FROM notadedebito nd WHERE nd.idcabecera = c.id AND nd.id_notadecredito IS NOT NULL)
                    OR EXISTS (SELECT 1 FROM cabecera c_nc WHERE c_nc.id = c.asociado AND UPPER(TRIM(c_nc.tipo)) IN ('NC','NCE','NCA','NCB'))
                    OR EXISTS (SELECT 1 FROM nd_ajustedeiva iva WHERE iva.idcabecera = c.id)
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
            WHERE COALESCE(
                CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.periodo ELSE fc.periodo END,
                c.periodo,
                c.fecha
            ) IS NOT NULL
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
            WITH fc_madre AS (
                SELECT DISTINCT ON (COALESCE(asociadogrupo, grupo))
                    COALESCE(asociadogrupo, grupo) AS gid,
                    periodo,
                    fecha
                FROM cabecera
                WHERE UPPER(TRIM(tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(asociadogrupo, grupo) IS NOT NULL
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
            WHERE COALESCE(
                CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.periodo ELSE fc.periodo END,
                c.periodo,
                c.fecha
            ) IS NOT NULL
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
            WITH fc_madre AS (
                SELECT DISTINCT ON (COALESCE(asociadogrupo, grupo))
                    COALESCE(asociadogrupo, grupo) AS gid,
                    periodo,
                    fecha
                FROM cabecera
                WHERE UPPER(TRIM(tipo)) IN ('FC','FAC','FCE','FCA')
                  AND COALESCE(asociadogrupo, grupo) IS NOT NULL
                ORDER BY COALESCE(asociadogrupo, grupo), fecha ASC, id ASC
            )
            SELECT 
                TO_CHAR(COALESCE(
                    CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.periodo ELSE fc.periodo END,
                    c.periodo,
                    c.fecha
                ), 'YYYY-MM') AS periodo,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.debe ELSE 0 END), 0) AS facturado,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS debitos,
                COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC','OP') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS cobrado
            FROM cabecera c
            LEFT JOIN fc_madre fc ON COALESCE(c.asociadogrupo, c.grupo) = fc.gid
            WHERE COALESCE(
                CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN c.periodo ELSE fc.periodo END,
                c.periodo,
                c.fecha
            ) IS NOT NULL
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

        StringBuilder sql = new StringBuilder("""
            SELECT 
              CAST(CURRENT_DATE - c.fecha AS INTEGER) AS dias_atraso,
              (c.debe - COALESCE(c.haber, 0)) AS saldo
            FROM cabecera c
            WHERE (c.debe - COALESCE(c.haber, 0)) > 0
              AND c.fecha IS NOT NULL
        """);

        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sql.append(" AND UPPER(TRIM(c.tipo)) = :tipoDoc");
        } else {
            sql.append(" AND UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA')");
        }

        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            if (nombreCobertura != null) {
                sql.append(" AND (c.codigo_cobertura = :codigoCobertura OR LOWER(TRIM(c.cobertura)) = :nombreCob)");
            } else {
                sql.append(" AND c.codigo_cobertura = :codigoCobertura");
            }
        }

        String exprPeriodo = "COALESCE(c.periodo, c.fecha)";
        if (fechaDesde != null) {
            sql.append(" AND ").append(exprPeriodo).append(" >= :fechaDesde");
        }
        if (fechaHasta != null) {
            sql.append(" AND ").append(exprPeriodo).append(" <= :fechaHasta");
        }

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
            "0 a 30 días",
            "31 a 60 días",
            "61 a 90 días",
            "91 a 180 días",
            "Más de 180 días"
        };

        int[] cantidades = new int[5];
        BigDecimal[] saldos = new BigDecimal[5];
        for (int i = 0; i < 5; i++) {
            saldos[i] = BigDecimal.ZERO;
        }

        BigDecimal saldoTotalMora = BigDecimal.ZERO;
        BigDecimal sumatoriaPonderada = BigDecimal.ZERO;

        for (Object[] row : rows) {
            if (row == null || row[0] == null || row[1] == null) continue;
            int dias = Math.max(0, ((Number) row[0]).intValue());
            BigDecimal saldo = new BigDecimal(row[1].toString()).setScale(2, RoundingMode.HALF_UP);

            if (saldo.compareTo(BigDecimal.ZERO) <= 0) continue;

            saldoTotalMora = saldoTotalMora.add(saldo);
            sumatoriaPonderada = sumatoriaPonderada.add(saldo.multiply(BigDecimal.valueOf(dias)));

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
            saldos[idx] = saldos[idx].add(saldo);
        }

        Integer dsoGlobal = 0;
        if (saldoTotalMora.compareTo(BigDecimal.ZERO) > 0) {
            dsoGlobal = sumatoriaPonderada.divide(saldoTotalMora, 0, RoundingMode.HALF_UP).intValue();
        }

        Integer cobroRealPromedio = 0;

        List<RangoAntiguedadDTO> detalles = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            BigDecimal saldoRango = saldos[i];
            BigDecimal pct = BigDecimal.ZERO;
            if (saldoTotalMora.compareTo(BigDecimal.ZERO) > 0) {
                pct = saldoRango.multiply(BigDecimal.valueOf(100))
                        .divide(saldoTotalMora, 2, RoundingMode.HALF_UP);
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
            WITH fc_madre AS (
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
        if (fechaDesde != null) {
            sql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_nc.periodo, c_fc.fecha, fc.fecha, c_nc.fecha) >= :fechaDesde");
        }
        if (fechaHasta != null) {
            sql.append(" AND COALESCE(c_fc.periodo, fc.periodo, c_nc.periodo, c_fc.fecha, fc.fecha, c_nc.fecha) <= :fechaHasta");
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

    public List<CcFinanciadorDTO> getCuentaCorrienteTresNiveles(String financiadorFiltro, String periodoFiltro, String fechaDesde, String fechaHasta) {
        List<Cabecera> cabeceras = cabeceraRepository.findCabecerasParaCuentaCorriente();
        Set<Long> ndHijosDeNc = new HashSet<>(cabeceraRepository.findIdsNdHijosDeNc());
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
        Map<Long, List<Cabecera>> familias = cabeceras.stream()
                .collect(Collectors.groupingBy(
                        this::resolverIdGrupoTrazabilidad,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        // Estructura intermedia: Financiador -> Periodo (de la FC) -> List<CcComprobanteDTO> (Facturas Madres)
        Map<String, Map<String, List<CcComprobanteDTO>>> agrupado = new LinkedHashMap<>();

        for (List<Cabecera> miembros : familias.values()) {
            if (miembros.isEmpty()) continue;

            // Determinar la Factura Madre (raíz): FC / FAC / FCE / FCA
            Cabecera fcRaiz = miembros.stream()
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
                // Si no hay FC, buscar comprobante más antiguo que no sea RC
                fcRaiz = miembros.stream()
                        .filter(c -> !"RC".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                        .min((c1, c2) -> {
                            if (c1.getFecha() != null && c2.getFecha() != null) {
                                int comp = c1.getFecha().compareTo(c2.getFecha());
                                if (comp != 0) return comp;
                            }
                            return c1.getId().compareTo(c2.getId());
                        })
                        .orElse(miembros.get(0));
            }

            // Financiador: tomado de la FC raíz (o del primer miembro que lo tenga definido)
            String financiador = obtenerNombreFinanciador(fcRaiz);
            if (financiador == null || financiador.trim().isEmpty() || "Sin financiador".equalsIgnoreCase(financiador.trim())) {
                for (Cabecera m : miembros) {
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

            // Período: tomado de la FC raíz (priorizando el campo periodo, luego fecha)
            LocalDate fechaPeriodo = fcRaiz.getPeriodo() != null ? fcRaiz.getPeriodo() : fcRaiz.getFecha();
            if (fechaPeriodo == null) {
                for (Cabecera m : miembros) {
                    if (m.getPeriodo() != null) {
                        fechaPeriodo = m.getPeriodo();
                        break;
                    } else if (m.getFecha() != null) {
                        fechaPeriodo = m.getFecha();
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
            CcComprobanteDTO facturaDTO = construirArbolExpediente(fcRaiz, miembros, ndHijosDeNc);

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

                    if (fc.getHijos() != null) {
                        for (CcComprobanteDTO h : fc.getHijos()) {
                            // Saltar el hijo FC inyectado: ya está sumado en el propio fc (Factura Madre padre).
                            if ("FC".equalsIgnoreCase(h.getOrigenTipo())) continue;
                            perFacturacion = perFacturacion.add(h.getFacturacionFc());
                            perIncrementos = perIncrementos.add(h.getIncrementosNd());
                            perDebitos = perDebitos.add(h.getDebitosNc());
                            perRefacturacion = perRefacturacion.add(h.getRefacturacionNd());
                            perCobranzas = perCobranzas.add(h.getCobranzasRc());
                        }
                    }
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

    private CcComprobanteDTO construirArbolExpediente(Cabecera fcRaiz, List<Cabecera> miembros, Set<Long> ndHijosDeNc) {
        CcComprobanteDTO rootDTO = mapearAComprobanteDTO(fcRaiz, ndHijosDeNc);
        rootDTO.setNivel(0);
        rootDTO.setId(fcRaiz.getId());
        rootDTO.setAsociado(fcRaiz.getAsociado());
        rootDTO.setAsociadogrupo(fcRaiz.getAsociadogrupo());
        rootDTO.setOrigenTipo("FC");

        // Construir mapa de hijos directos en memoria usando la columna asociado
        // padreId -> List<Cabecera>
        Map<Long, List<Cabecera>> hijosPorPadre = new LinkedHashMap<>();

        for (Cabecera c : miembros) {
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
                    for (Cabecera cand : miembros) {
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
        for (List<Cabecera> listaHijos : hijosPorPadre.values()) {
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

        recorrerDescendientesEnProfundidad(fcRaiz.getId(), 1, hijosPorPadre, descendientes, visitados, ndHijosDeNc);

        // Seguridad: agregar cualquier miembro no visitado de la familia
        for (Cabecera c : miembros) {
            if (c.getId() != null && !visitados.contains(c.getId())) {
                visitados.add(c.getId());
                CcComprobanteDTO orfDTO = mapearAComprobanteDTO(c, ndHijosDeNc);
                orfDTO.setNivel(1);
                orfDTO.setId(c.getId());
                orfDTO.setAsociado(c.getAsociado());
                orfDTO.setAsociadogrupo(c.getAsociadogrupo());
                String t = resolverTipoBase(c.getTipo());
                orfDTO.setOrigenTipo("RC".equalsIgnoreCase(t) ? "COB" : ("NC".equalsIgnoreCase(t) ? "DEB" : ("ND".equalsIgnoreCase(t) ? "REF" : t)));
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

        rootDTO.setSaldo(saldoConsolidado);

        return rootDTO;
    }

    private void recorrerDescendientesEnProfundidad(Long padreId, int nivel,
                                                    Map<Long, List<Cabecera>> hijosPorPadre,
                                                    List<CcComprobanteDTO> resultado,
                                                    Set<Long> visitados,
                                                    Set<Long> ndHijosDeNc) {
        if (padreId == null) return;
        List<Cabecera> hijos = hijosPorPadre.get(padreId);
        if (hijos == null || hijos.isEmpty()) return;

        for (Cabecera h : hijos) {
            if (h.getId() != null && visitados.contains(h.getId())) continue;
            if (h.getId() != null) visitados.add(h.getId());

            CcComprobanteDTO hijoDTO = mapearAComprobanteDTO(h, ndHijosDeNc);
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
                hijoDTO.setOrigenTipo(h.getId() != null && ndHijosDeNc.contains(h.getId()) ? "REF" : "INC");
            } else {
                hijoDTO.setOrigenTipo(tipoBase);
            }

            resultado.add(hijoDTO);

            if (h.getId() != null) {
                recorrerDescendientesEnProfundidad(h.getId(), nivel + 1, hijosPorPadre, resultado, visitados, ndHijosDeNc);
            }
        }
    }

    private CcComprobanteDTO mapearAComprobanteDTO(Cabecera c, Set<Long> ndHijosDeNc) {
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
                } else {
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

    private String obtenerNombreFinanciador(Cabecera c) {
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

    private String formatearComprobante(Cabecera c) {
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

        List<Cabecera> comprobantes;
        if (fDesde != null || fHasta != null) {
            List<Long> idsGrupos = cabeceraRepository.findIdsGruposFacturasPorRangoFechas(fDesde, fHasta);
            if (idsGrupos == null || idsGrupos.isEmpty()) {
                return Collections.emptyList();
            }
            comprobantes = cabeceraRepository.findByGrupoOrAsociadogrupoOrIdIn(idsGrupos);
        } else {
            comprobantes = cabeceraRepository.findComprobantesParaTrazabilidad();
        }

        if (comprobantes == null || comprobantes.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> ndHijosDeNc = new HashSet<>(cabeceraRepository.findIdsNdHijosDeNc());

        // Agrupar en memoria usando Java Streams por identificador de grupo (asociadogrupo)
        Map<Long, List<Cabecera>> grupos = comprobantes.stream()
                .collect(Collectors.groupingBy(
                        this::resolverIdGrupoTrazabilidad,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        // Obtener IDs de las facturas raíces de cada grupo para precargar prestaciones y médicos
        Set<Long> fcIds = new HashSet<>();
        for (List<Cabecera> miembros : grupos.values()) {
            Cabecera fcRaiz = miembros.stream()
                    .filter(c -> "FC".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                    .findFirst()
                    .orElse(miembros.get(0));
            if (fcRaiz.getId() != null) {
                fcIds.add(fcRaiz.getId());
            }
        }

        // Carga batch de prestaciones por FC
        Map<Long, AmbLiquidado> prestacionPorFc = fcIds.isEmpty() ? Collections.emptyMap() :
                ambLiquidadoRepository.findByCabecera_IdIn(fcIds).stream()
                        .filter(al -> al.getCabecera() != null)
                        .collect(Collectors.toMap(
                                al -> al.getCabecera().getId(),
                                al -> al,
                                (existente, reemplazo) -> existente
                        ));

        // Carga batch de usuarios responsables de NC y ND
        Set<Long> ncIds = comprobantes.stream()
                .filter(c -> "NC".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                .map(Cabecera::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<NotaDeCredito> notasCredito = ncIds.isEmpty() ? Collections.emptyList() :
                notaDeCreditoRepository.findByCabecera_IdIn(ncIds);

        Map<Long, String> usuariosNc = notasCredito.stream()
                .filter(nc -> nc.getCabecera() != null && nc.getUsuario() != null && !nc.getUsuario().trim().isEmpty())
                .collect(Collectors.toMap(
                        nc -> nc.getCabecera().getId(),
                        nc -> nc.getUsuario().trim(),
                        (e, r) -> e
                ));

        Map<Long, String> motivosNc = notasCredito.stream()
                .filter(nc -> nc.getCabecera() != null && nc.getMotivoDebito() != null && !nc.getMotivoDebito().trim().isEmpty())
                .collect(Collectors.toMap(
                        nc -> nc.getCabecera().getId(),
                        nc -> nc.getMotivoDebito().trim(),
                        (e, r) -> e
                ));

        Set<Long> ndIds = comprobantes.stream()
                .filter(c -> "ND".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                .map(Cabecera::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, String> usuariosNd = ndIds.isEmpty() ? Collections.emptyMap() :
                notaDeDebitoRepository.findByCabecera_IdIn(ndIds).stream()
                        .filter(nd -> nd.getCabecera() != null && nd.getUsuario() != null && !nd.getUsuario().trim().isEmpty())
                        .collect(Collectors.toMap(
                                nd -> nd.getCabecera().getId(),
                                nd -> nd.getUsuario().trim(),
                                (e, r) -> e
                        ));

        Map<Long, String> tiposRegistroPorCabeceraNc = new HashMap<>();
        if (!ncIds.isEmpty()) {
            List<Object[]> tipos = notaDeCreditoRepository.findTiposRegistroPorCabeceraIds(ncIds);
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

        List<CadenaTrazabilidadDTO> cadenas = new ArrayList<>();

        for (Map.Entry<Long, List<Cabecera>> entry : grupos.entrySet()) {
            List<Cabecera> miembros = entry.getValue();
            if (miembros.isEmpty()) continue;

            // Identificar la factura origen (FC) para llenar la cabecera del CadenaTrazabilidadDTO
            Cabecera fcRaiz = miembros.stream()
                    .filter(c -> "FC".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                    .findFirst()
                    .orElse(miembros.get(0));

            AmbLiquidado amb = prestacionPorFc.get(fcRaiz.getId());
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
            List<EventoTrazabilidadDTO> historial = miembros.stream()
                    .sorted(Comparator.comparing(Cabecera::getFecha, Comparator.nullsLast(Comparator.naturalOrder()))
                            .thenComparing(Cabecera::getId, Comparator.nullsLast(Comparator.naturalOrder())))
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
                                resp = (amb != null && amb.getOperador() != null && !amb.getOperador().trim().isEmpty())
                                        ? amb.getOperador().trim()
                                        : "Sin operador asignado";
                            }
                            case "NC" -> {
                                monto = (c.getHaber() != null && c.getHaber().compareTo(BigDecimal.ZERO) > 0)
                                        ? c.getHaber() : (c.getDebe() != null ? c.getDebe() : BigDecimal.ZERO);
                                desc = motivosNc.getOrDefault(c.getId(), "Débito recibido");
                                resp = usuariosNc.getOrDefault(c.getId(),
                                        (c.getOrigen() != null ? c.getOrigen() : "Auditoría Médica"));
                            }
                            case "ND" -> {
                                monto = (c.getDebe() != null && c.getDebe().compareTo(BigDecimal.ZERO) > 0)
                                        ? c.getDebe() : (c.getHaber() != null ? c.getHaber() : BigDecimal.ZERO);
                                desc = ndHijosDeNc.contains(c.getId()) ? "Refacturación" : "Incremento / Ajuste";
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
                                                ? fcRaiz.getTiporegistro().trim()
                                                : (amb != null && amb.getCabecera() != null && amb.getCabecera().getTiporegistro() != null
                                                        ? amb.getCabecera().getTiporegistro().trim() : ""));
                            }
                        } else {
                            tipoReg = (c.getTiporegistro() != null && !c.getTiporegistro().trim().isEmpty())
                                    ? c.getTiporegistro().trim()
                                    : (fcRaiz.getTiporegistro() != null && !fcRaiz.getTiporegistro().trim().isEmpty()
                                            ? fcRaiz.getTiporegistro().trim()
                                            : (amb != null && amb.getCabecera() != null && amb.getCabecera().getTiporegistro() != null
                                                    ? amb.getCabecera().getTiporegistro().trim() : ""));
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
        String fDesdeStr = fechaDesde != null ? fechaDesde.toString() : null;
        String fHastaStr = fechaHasta != null ? fechaHasta.toString() : null;
        List<MetricaAnalistaDTO> analistas = getMetricasAnalistas(periodoFiltro, fechaDesde, fechaHasta);
        List<CadenaTrazabilidadDTO> cadenas = getTrazabilidad(null, null, periodoFiltro, fDesdeStr, fHastaStr);
        List<MetricaMedicoDTO> medicos = (cadenas != null && !cadenas.isEmpty()) ? procesarMetricasMedicos(cadenas) : Collections.emptyList();
        List<MetricaOperadorDTO> operadores = (cadenas != null && !cadenas.isEmpty()) ? procesarMetricasOperadores(cadenas) : Collections.emptyList();

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
        StringBuilder sql = new StringBuilder("""
            WITH items AS (
              SELECT 
                COALESCE(NULLIF(TRIM(nc.usuario), ''), NULLIF(TRIM(nd.usuario), ''), 'Sin Analista') AS analista,
                COALESCE(NULLIF(TRIM(nc.motivodedebito), ''), NULLIF(TRIM(nd.motivorefactura), ''), 'Débito recibido') AS motivo,
                COALESCE(NULLIF(TRIM(c_fc.cobertura), ''), NULLIF(TRIM(c_nc.cobertura), ''), 'Sin especificar') AS financiador,
                COALESCE(nc.importedebitado, 0) AS monto_debitado,
                CASE WHEN nc.debitoaceptado = true THEN COALESCE(nc.importedebitado, 0) ELSE 0 END AS aceptado,
                COALESCE(nd.importerefactura, nc.importederefactura, 0) AS refacturado,
                COALESCE(NULLIF(TRIM(c_fc.tiporegistro), ''), NULLIF(TRIM(c_nc.tiporegistro), ''), 'Ambulatorios') AS tipo_registro,
                COALESCE(c_nc.fecha, nc.fecha_registro::date, c_fc.fecha) AS fecha,
                COALESCE(c_nc.periodo::text, c_fc.periodo::text) AS periodo
              FROM notadecredito nc
              LEFT JOIN notadedebito nd ON (nd.id_notadecredito = nc.id OR nd.id_prestacion = nc.id_prestacion)
              LEFT JOIN amb_liquidado al ON nc.id_prestacion = al.id
              LEFT JOIN cabecera c_fc ON al.idcabecera = c_fc.id
              LEFT JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
              WHERE (nc.usuario IS NOT NULL AND TRIM(nc.usuario) <> '')
                 OR (nd.usuario IS NOT NULL AND TRIM(nd.usuario) <> '')

              UNION ALL

              SELECT 
                COALESCE(NULLIF(TRIM(nd.usuario), ''), 'Sin Analista') AS analista,
                COALESCE(NULLIF(TRIM(nd.motivorefactura), ''), 'Refacturación') AS motivo,
                COALESCE(NULLIF(TRIM(c_fc.cobertura), ''), NULLIF(TRIM(c_nd.cobertura), ''), 'Sin especificar') AS financiador,
                COALESCE(nd.importerefactura, 0) AS monto_debitado,
                0 AS aceptado,
                COALESCE(nd.importerefactura, 0) AS refacturado,
                COALESCE(NULLIF(TRIM(c_fc.tiporegistro), ''), NULLIF(TRIM(c_nd.tiporegistro), ''), 'Ambulatorios') AS tipo_registro,
                COALESCE(c_nd.fecha, nd.fecha_registro::date, c_fc.fecha) AS fecha,
                COALESCE(c_nd.periodo::text, c_fc.periodo::text) AS periodo
              FROM notadedebito nd
              LEFT JOIN amb_liquidado al ON nd.id_prestacion = al.id
              LEFT JOIN cabecera c_fc ON al.idcabecera = c_fc.id
              LEFT JOIN cabecera c_nd ON nd.idcabecera = c_nd.id
              WHERE nd.id_notadecredito IS NULL 
                AND NOT EXISTS (SELECT 1 FROM notadecredito nc WHERE nc.id_prestacion = nd.id_prestacion)
                AND nd.usuario IS NOT NULL AND TRIM(nd.usuario) <> ''
            )
            SELECT 
              analista,
              motivo,
              financiador,
              monto_debitado,
              aceptado,
              refacturado,
              tipo_registro
            FROM items
        """);

        boolean tieneRangoFechas = (fechaDesde != null || fechaHasta != null);
        boolean filtrarPeriodo = !tieneRangoFechas && periodoFiltro != null && !periodoFiltro.trim().isEmpty() && !"TODOS".equalsIgnoreCase(periodoFiltro.trim());

        StringBuilder whereClause = new StringBuilder();
        if (tieneRangoFechas) {
            whereClause.append(" WHERE 1=1 ");
            if (fechaDesde != null) {
                whereClause.append(" AND fecha >= :fechaDesde ");
            }
            if (fechaHasta != null) {
                whereClause.append(" AND fecha <= :fechaHasta ");
            }
        } else if (filtrarPeriodo) {
            whereClause.append(" WHERE (periodo LIKE :periodoFiltro || '%' OR TO_CHAR(fecha, 'YYYY-MM') = :periodoFiltro) ");
        }

        String finalSql = sql.toString() + whereClause.toString();
        Query q = entityManager.createNativeQuery(finalSql);

        if (tieneRangoFechas) {
            if (fechaDesde != null) {
                q.setParameter("fechaDesde", java.sql.Date.valueOf(fechaDesde));
            }
            if (fechaHasta != null) {
                q.setParameter("fechaHasta", java.sql.Date.valueOf(fechaHasta));
            }
        } else if (filtrarPeriodo) {
            q.setParameter("periodoFiltro", periodoFiltro.trim());
        }

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
        String motivo = r != null && r.length > 1 && r[1] != null ? r[1].toString().trim() : "Débito recibido";
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
                    String motivo = (e.getDescripcion() != null && !e.getDescripcion().trim().isEmpty())
                            ? e.getDescripcion().trim() : "Débito recibido";
                    String financiador = (cadena.getFinanciador() != null && !cadena.getFinanciador().trim().isEmpty())
                            ? cadena.getFinanciador().trim() : "Sin especificar";
                    BigDecimal monto = e.getMonto() != null ? e.getMonto() : BigDecimal.ZERO;

                    boolean tieneNdPosterior = false;
                    for (int j = i + 1; j < historial.size(); j++) {
                        if ("ND".equalsIgnoreCase(historial.get(j).getTipo())) {
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
                    String motivo = (e.getDescripcion() != null && !e.getDescripcion().trim().isEmpty())
                            ? e.getDescripcion().trim() : "Débito recibido";
                    String financiador = (cadena.getFinanciador() != null && !cadena.getFinanciador().trim().isEmpty())
                            ? cadena.getFinanciador().trim() : "Sin especificar";
                    BigDecimal monto = e.getMonto() != null ? e.getMonto() : BigDecimal.ZERO;

                    boolean tieneNdPosterior = false;
                    for (int j = i + 1; j < historial.size(); j++) {
                        if ("ND".equalsIgnoreCase(historial.get(j).getTipo())) {
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
        return procesarMetricasOperadores(getTrazabilidad(null, null, periodoFiltro));
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
                    String motivo = (e.getDescripcion() != null && !e.getDescripcion().trim().isEmpty())
                            ? e.getDescripcion().trim() : "Débito recibido";
                    String financiador = (cadena.getFinanciador() != null && !cadena.getFinanciador().trim().isEmpty())
                            ? cadena.getFinanciador().trim() : "Sin especificar";
                    BigDecimal monto = e.getMonto() != null ? e.getMonto() : BigDecimal.ZERO;

                    boolean tieneNdPosterior = false;
                    for (int j = i + 1; j < historial.size(); j++) {
                        if ("ND".equalsIgnoreCase(historial.get(j).getTipo())) {
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

    private Long resolverIdGrupoTrazabilidad(Cabecera c) {
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
        List<CadenaTrazabilidadDTO> todasLasCadenas = getTrazabilidad(financiador, medico, periodo, fechaDesde, fechaHasta);

        return todasLasCadenas.stream()
                .filter(cadena -> {
                    if (cadena.getHistorialEventos() == null) return false;
                    long cantidadNc = cadena.getHistorialEventos().stream()
                            .filter(e -> "NC".equalsIgnoreCase(e.getTipo()))
                            .count();
                    return cantidadNc >= 2;
                })
                .sorted(Comparator
                        .<CadenaTrazabilidadDTO>comparingLong(c -> c.getHistorialEventos().stream()
                                .filter(e -> "NC".equalsIgnoreCase(e.getTipo()))
                                .count())
                        .reversed()
                        .thenComparing(
                                c -> c.getTotalDebitado() != null ? c.getTotalDebitado() : BigDecimal.ZERO,
                                Comparator.reverseOrder()
                        ))
                .collect(Collectors.toList());
    }
}


