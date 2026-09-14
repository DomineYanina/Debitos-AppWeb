package com.debitos.backend.service;

import com.debitos.backend.dto.directorio.*;
import com.debitos.backend.model.Cabecera;
import com.debitos.backend.model.NcAjusteDeIva;
import com.debitos.backend.model.NdAjusteDeIva;
import com.debitos.backend.model.NotaDeCredito;
import com.debitos.backend.model.NotaDeDebito;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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

    public DirectorioTotalesDTO obtenerTotalesMacro(String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        // 1. Total Facturado (FC, FCE, FCA, FAC o tipo específico)
        StringBuilder sqlFc = new StringBuilder("""
            SELECT COALESCE(SUM(COALESCE(c.debe, 0)), 0), COUNT(c.id)
            FROM cabecera c
            WHERE 1=1
        """);
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sqlFc.append(" AND UPPER(TRIM(c.tipo)) = :tipoDoc");
        } else {
            sqlFc.append(" AND (UPPER(TRIM(c.tipo)) IN ('FC', 'FCE', 'FCA', 'FAC') OR UPPER(TRIM(c.tipo)) LIKE 'FC%')");
        }
        aplicarFiltrosCabecera(sqlFc, "c", codigoCobertura, fechaDesde, fechaHasta);
        Query qFc = crearQueryConFiltros(sqlFc.toString(), codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        Object[] resFc = (Object[]) qFc.getSingleResult();
        BigDecimal totalFacturado = resFc[0] != null ? new BigDecimal(resFc[0].toString()) : BigDecimal.ZERO;
        long cantidadFacturas = resFc[1] != null ? ((Number) resFc[1]).longValue() : 0L;

        // 2. Cobranza Efectiva (Recibos: RC, RCB, RCA)
        StringBuilder sqlRc = new StringBuilder("""
            SELECT COALESCE(SUM(CASE 
                WHEN c.haber IS NOT NULL AND c.haber > 0 THEN c.haber 
                WHEN c.debe IS NOT NULL AND c.debe > 0 THEN c.debe 
                ELSE 0 END), 0)
            FROM cabecera c
            WHERE (UPPER(TRIM(c.tipo)) IN ('RC', 'RCB', 'RCA', 'REC') OR UPPER(TRIM(c.tipo)) LIKE 'RC%')
        """);
        aplicarFiltrosCabecera(sqlRc, "c", codigoCobertura, fechaDesde, fechaHasta);
        Query qRc = crearQueryConFiltros(sqlRc.toString(), codigoCobertura, null, fechaDesde, fechaHasta);
        Object resRc = qRc.getSingleResult();
        BigDecimal cobranzaEfectiva = resRc != null ? new BigDecimal(resRc.toString()) : BigDecimal.ZERO;

        // 3. Pérdida Asumida (débitos aceptados = true en notadecredito)
        StringBuilder sqlPerdida = new StringBuilder("""
            SELECT COALESCE(SUM(COALESCE(nc.importedebitado, 0)), 0)
            FROM notadecredito nc
            INNER JOIN amb_liquidado al ON nc.id_prestacion = al.id
            INNER JOIN cabecera c_fc ON al.idcabecera = c_fc.id
            WHERE nc.debitoaceptado = true
        """);
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sqlPerdida.append(" AND UPPER(TRIM(c_fc.tipo)) = :tipoDoc");
        }
        aplicarFiltrosCabecera(sqlPerdida, "c_fc", codigoCobertura, fechaDesde, fechaHasta);
        Query qPerdida = crearQueryConFiltros(sqlPerdida.toString(), codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        Object resPerdida = qPerdida.getSingleResult();
        BigDecimal perdidaAsumida = resPerdida != null ? new BigDecimal(resPerdida.toString()) : BigDecimal.ZERO;

        // 4. Total ND (ND1 + ND2)
        StringBuilder sqlNd = new StringBuilder("""
            SELECT COALESCE(SUM(COALESCE(c.debe, 0)), 0)
            FROM cabecera c
            WHERE (UPPER(TRIM(c.tipo)) IN ('ND', 'NDE', 'NDA', 'NDB') OR UPPER(TRIM(c.tipo)) LIKE 'ND%')
        """);
        aplicarFiltrosCabecera(sqlNd, "c", codigoCobertura, fechaDesde, fechaHasta);
        Query qNd = crearQueryConFiltros(sqlNd.toString(), codigoCobertura, null, fechaDesde, fechaHasta);
        Object resNd = qNd.getSingleResult();
        BigDecimal totalNd = resNd != null ? new BigDecimal(resNd.toString()) : BigDecimal.ZERO;

        // Conteo total de comprobantes
        StringBuilder sqlTotalComp = new StringBuilder("""
            SELECT COUNT(c.id) FROM cabecera c WHERE 1=1
        """);
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sqlTotalComp.append(" AND UPPER(TRIM(c.tipo)) = :tipoDoc");
        }
        aplicarFiltrosCabecera(sqlTotalComp, "c", codigoCobertura, fechaDesde, fechaHasta);
        Query qTotalComp = crearQueryConFiltros(sqlTotalComp.toString(), codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        long cantidadComprobantes = ((Number) qTotalComp.getSingleResult()).longValue();

        // Deuda Neta = Total Facturado + ND1 + ND2 - Cobranza - Pérdida Asumida
        BigDecimal deudaNeta = totalFacturado.add(totalNd).subtract(cobranzaEfectiva).subtract(perdidaAsumida);

        return new DirectorioTotalesDTO(
                totalFacturado.setScale(2, RoundingMode.HALF_UP),
                cobranzaEfectiva.setScale(2, RoundingMode.HALF_UP),
                perdidaAsumida.setScale(2, RoundingMode.HALF_UP),
                deudaNeta.setScale(2, RoundingMode.HALF_UP),
                cantidadFacturas,
                cantidadComprobantes
        );
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
        aplicarFiltrosCabecera(sql, "c", codigoCobertura, fechaDesde, fechaHasta);
        sql.append(" ORDER BY c.fecha DESC, c.numero DESC LIMIT 200");

        Query query = crearQueryConFiltros(sql.toString(), codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        List<Object[]> rows = query.getResultList();

        List<DirectorioGrupoFacturaDTO> resultado = new ArrayList<>();

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

            // Obtener comprobantes derivados de este grupo
            Long idGrupo = dto.getAsociadogrupo() != null ? dto.getAsociadogrupo() : id;
            List<Cabecera> familia = cabeceraRepository.findByGrupoOrAsociadogrupoOrId(idGrupo);

            List<DirectorioComprobanteDTO> derivados = new ArrayList<>();
            BigDecimal sumaAceptado = BigDecimal.ZERO;
            BigDecimal sumaNoAceptado = BigDecimal.ZERO;
            BigDecimal sumaCobranza = BigDecimal.ZERO;
            int cantRefacturaciones = 0;

            for (Cabecera c : familia) {
                if (Objects.equals(c.getId(), id)) continue; // omitir la propia factura raíz

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
                    List<NotaDeCredito> ncs = notaDeCreditoRepository.findByCabecera_Id(c.getId());
                    if (ncs.isEmpty() && c.getLetra() != null && c.getPtovta() != null && c.getNumero() != null) {
                        ncs = notaDeCreditoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_Numero(c.getLetra(), c.getPtovta(), c.getNumero());
                    }

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

                    List<NotaDeDebito> nds = notaDeDebitoRepository.findByCabecera_Id(c.getId());
                    if (nds.isEmpty() && c.getLetra() != null && c.getPtovta() != null && c.getNumero() != null) {
                        nds = notaDeDebitoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_Numero(c.getLetra(), c.getPtovta(), c.getNumero());
                    }
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

            resultado.add(dto);
        }

        return resultado;
    }

    public List<DirectorioMotivoDebitoDTO> obtenerDistribucionMotivos(String codigoCobertura, String tipoDoc, LocalDate fechaDesde, LocalDate fechaHasta) {
        StringBuilder sql = new StringBuilder("""
            SELECT TRIM(nc.motivodedebito) AS motivo, 
                   SUM(COALESCE(nc.importedebitado, 0)) AS montoTotal,
                   COUNT(nc.id) AS cantidadCasos
            FROM notadecredito nc
            INNER JOIN amb_liquidado al ON nc.id_prestacion = al.id
            INNER JOIN cabecera c_fc ON al.idcabecera = c_fc.id
            WHERE nc.motivodedebito IS NOT NULL 
              AND TRIM(nc.motivodedebito) <> ''
        """);
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sql.append(" AND UPPER(TRIM(c_fc.tipo)) = :tipoDoc");
        }
        aplicarFiltrosCabecera(sql, "c_fc", codigoCobertura, fechaDesde, fechaHasta);
        sql.append(" GROUP BY TRIM(nc.motivodedebito) ORDER BY montoTotal DESC");

        Query q = crearQueryConFiltros(sql.toString(), codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
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
        StringBuilder sql = new StringBuilder("""
            SELECT al.id, al.paciente, al.carnet, al.plan, al.efector, al.medico, al.fecha AS fechaPrestacion,
                   al.codigo, al.descripcion, c_nc.tipo AS tipoDoc, c_nc.letra AS letraDoc, c_nc.ptovta AS ptovtaDoc, 
                   c_nc.numero AS numeroDoc, c_nc.fecha AS fechaDoc, nc.motivodedebito, nc.comentarios_debito,
                   nc.importedebitado, nc.debitoaceptado
            FROM notadecredito nc
            INNER JOIN cabecera c_nc ON nc.idcabecera = c_nc.id
            INNER JOIN amb_liquidado al ON nc.id_prestacion = al.id
            INNER JOIN cabecera c_fc ON al.idcabecera = c_fc.id
            WHERE LOWER(TRIM(nc.motivodedebito)) = LOWER(TRIM(:motivo))
        """);

        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            sql.append(" AND (c_fc.codigo_cobertura = :codigoCobertura OR c_nc.codigo_cobertura = :codigoCobertura)");
        }
        if (tipoDoc != null && !tipoDoc.trim().isEmpty() && !"TODOS".equalsIgnoreCase(tipoDoc.trim())) {
            sql.append(" AND (UPPER(TRIM(c_fc.tipo)) = :tipoDoc OR UPPER(TRIM(c_nc.tipo)) = :tipoDoc)");
        }
        if (fechaDesde != null) {
            sql.append(" AND c_fc.fecha >= :fechaDesde");
        }
        if (fechaHasta != null) {
            sql.append(" AND c_fc.fecha <= :fechaHasta");
        }
        sql.append(" ORDER BY c_nc.fecha DESC, al.id DESC LIMIT 300");

        Query q = entityManager.createNativeQuery(sql.toString());
        q.setParameter("motivo", motivo != null ? motivo.trim() : "");
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
        if (codigoCobertura != null && !codigoCobertura.trim().isEmpty() && !"TODAS".equalsIgnoreCase(codigoCobertura.trim())) {
            sb.append(" AND ").append(alias).append(".codigo_cobertura = :codigoCobertura");
        }
        if (fechaDesde != null) {
            sb.append(" AND ").append(alias).append(".fecha >= :fechaDesde");
        }
        if (fechaHasta != null) {
            sb.append(" AND ").append(alias).append(".fecha <= :fechaHasta");
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
}
