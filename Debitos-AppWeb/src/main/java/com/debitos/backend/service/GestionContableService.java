package com.debitos.backend.service;

import com.debitos.backend.dto.contable.*;
import com.debitos.backend.model.*;
import com.debitos.backend.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
public class GestionContableService {

    private static final Logger log = LoggerFactory.getLogger(GestionContableService.class);

    private static final DateTimeFormatter FORMATO_FECHA_ARG = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Autowired
    private TipoOperacionRepository tipoOperacionRepository;

    @Autowired
    private HistorialAjustesContabilidadRepository historialRepository;

    @Autowired
    private CoberturaAliasRepository coberturaAliasRepository;

    @Autowired
    private FacturaPeriodoCorregidoRepository facturaPeriodoCorregidoRepository;

    @Autowired
    private PrestacionConsideracionRepository prestacionConsideracionRepository;

    @Autowired
    private FacturaAnuladaManualRepository facturaAnuladaManualRepository;

    @Autowired
    private CabeceraRepository cabeceraRepository;

    @Autowired
    private MaterializedViewRefreshService materializedViewRefreshService;

    @PersistenceContext
    private EntityManager entityManager;

    // =========================================================================
    // 1. Auditoría Centralizada
    // =========================================================================

    @Transactional
    public void registrarHistorial(String codigoTipoOp, String referencia, String valorAnterior, String valorNuevo, String usuario) {
        try {
            TipoOperacion tipoOp = tipoOperacionRepository.findByCodigo(codigoTipoOp)
                    .orElseGet(() -> tipoOperacionRepository.save(new TipoOperacion(codigoTipoOp, codigoTipoOp)));

            HistorialAjustesContabilidad entry = new HistorialAjustesContabilidad(
                    tipoOp,
                    referencia,
                    valorAnterior,
                    valorNuevo,
                    usuario != null ? usuario : "SISTEMA"
            );
            historialRepository.save(entry);
            log.info("[CONTABILIDAD-HISTORIAL] Op: {}, Ref: {}, Usuario: {}", codigoTipoOp, referencia, usuario);
        } catch (Exception e) {
            log.error("[CONTABILIDAD-HISTORIAL] Error al registrar historial: {}", e.getMessage(), e);
        }
    }

    // =========================================================================
    // 2. Mapeo de Nombres de Coberturas
    // =========================================================================

    @Transactional(readOnly = true)
    public CoberturaAliasDTO obtenerCobertura(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            return null;
        }
        String codigoLimpio = codigo.trim();

        // 1. Buscar si ya tiene alias guardado
        Optional<CoberturaAlias> aliasOpt = coberturaAliasRepository.findById(codigoLimpio);
        if (aliasOpt.isPresent()) {
            CoberturaAlias a = aliasOpt.get();
            return new CoberturaAliasDTO(a.getCodigoCobertura(), a.getNombreOriginal(), a.getNombreMostrar());
        }

        // 2. Si no tiene alias, obtener nombre original desde Cabecera
        String nombreOriginal = "";
        try {
            Query q = entityManager.createNativeQuery(
                    "SELECT cobertura FROM cabecera WHERE codigo_cobertura = :cod AND cobertura IS NOT NULL LIMIT 1"
            );
            q.setParameter("cod", codigoLimpio);
            Object res = q.getSingleResult();
            if (res != null) {
                nombreOriginal = res.toString().trim();
            }
        } catch (Exception ignored) {}

        return new CoberturaAliasDTO(codigoLimpio, nombreOriginal, nombreOriginal);
    }

    @Transactional
    public CoberturaAliasDTO guardarAliasCobertura(GuardarAliasRequest req, String usuario) {
        if (req.getCodigoCobertura() == null || req.getCodigoCobertura().isBlank()) {
            throw new IllegalArgumentException("El código de cobertura es obligatorio.");
        }
        String cod = req.getCodigoCobertura().trim();
        String nuevoNombreMostrar = req.getNombreMostrar() != null ? req.getNombreMostrar().trim() : "";

        Optional<CoberturaAlias> actualOpt = coberturaAliasRepository.findById(cod);
        String valorAnterior = actualOpt.map(CoberturaAlias::getNombreMostrar).orElse(req.getNombreOriginal());

        CoberturaAlias alias = actualOpt.orElse(new CoberturaAlias(cod, req.getNombreOriginal(), nuevoNombreMostrar));
        alias.setNombreMostrar(nuevoNombreMostrar);
        if (alias.getNombreOriginal() == null || alias.getNombreOriginal().isBlank()) {
            alias.setNombreOriginal(req.getNombreOriginal());
        }
        coberturaAliasRepository.save(alias);

        // Registro de Auditoría
        registrarHistorial("COBERTURA_RENOMBRE", cod, valorAnterior, nuevoNombreMostrar, usuario);

        return new CoberturaAliasDTO(alias.getCodigoCobertura(), alias.getNombreOriginal(), alias.getNombreMostrar());
    }

    // =========================================================================
    // 3. Corrección de Períodos de Facturas
    // =========================================================================

    @Transactional(readOnly = true)
    public FacturaPeriodoDTO buscarFacturaParaPeriodo(String tipo, String letra, Integer ptovta, Integer numero) {
        Cabecera cab = buscarCabeceraFactura(tipo, letra, ptovta, numero);
        if (cab == null) {
            return null;
        }

        FacturaPeriodoDTO dto = new FacturaPeriodoDTO();
        dto.setIdCabecera(cab.getId());
        dto.setTipo(cab.getTipo());
        dto.setLetra(cab.getLetra());
        dto.setPtovta(cab.getPtovta() != null ? cab.getPtovta().intValue() : null);
        dto.setNumero(cab.getNumero() != null ? cab.getNumero().intValue() : null);
        dto.setFecha(cab.getFecha());
        dto.setPeriodoOriginal(cab.getPeriodo());
        dto.setCodigoCobertura(cab.getCodigoCobertura());
        dto.setCobertura(cab.getCobertura());
        dto.setImporte(cab.getDebe());

        // Ver si ya tiene período corregido
        facturaPeriodoCorregidoRepository.findByIdCabecera(cab.getId())
                .ifPresent(fpc -> dto.setPeriodoCorregido(fpc.getPeriodoCorregido()));

        return dto;
    }

    @Transactional
    public FacturaPeriodoDTO guardarPeriodoCorregido(CorregirPeriodoRequest req, String usuario) {
        if (req.getIdCabecera() == null) {
            throw new IllegalArgumentException("El ID de comprobante es obligatorio.");
        }
        Cabecera cab = cabeceraRepository.findById(req.getIdCabecera())
                .orElseThrow(() -> new IllegalArgumentException("No se encontró el comprobante con ID: " + req.getIdCabecera()));

        LocalDate fechaCorregida = parsearFecha(req.getPeriodoCorregido());
        if (fechaCorregida == null) {
            throw new IllegalArgumentException("El formato del período corregido no es válido (use DD/MM/YYYY o YYYY-MM-DD).");
        }

        Optional<FacturaPeriodoCorregido> actualOpt = facturaPeriodoCorregidoRepository.findByIdCabecera(cab.getId());
        String valorAnterior = actualOpt.map(f -> f.getPeriodoCorregido().toString())
                .orElse(cab.getPeriodo() != null ? cab.getPeriodo().toString() : "SIN_PERIODO");

        FacturaPeriodoCorregido fpc = actualOpt.orElse(new FacturaPeriodoCorregido(cab, cab.getPeriodo(), fechaCorregida));
        fpc.setPeriodoCorregido(fechaCorregida);
        if (fpc.getPeriodoOriginal() == null) {
            fpc.setPeriodoOriginal(cab.getPeriodo());
        }
        facturaPeriodoCorregidoRepository.save(fpc);

        String refDoc = String.format("%s %s %04d-%08d (ID: %d)",
                cab.getTipo(), cab.getLetra(),
                cab.getPtovta() != null ? cab.getPtovta() : 0,
                cab.getNumero() != null ? cab.getNumero() : 0,
                cab.getId());

        registrarHistorial("PERIODO_CORRECCION", refDoc, valorAnterior, fechaCorregida.toString(), usuario);

        FacturaPeriodoDTO dto = new FacturaPeriodoDTO();
        dto.setIdCabecera(cab.getId());
        dto.setTipo(cab.getTipo());
        dto.setLetra(cab.getLetra());
        dto.setPtovta(cab.getPtovta() != null ? cab.getPtovta().intValue() : null);
        dto.setNumero(cab.getNumero() != null ? cab.getNumero().intValue() : null);
        dto.setFecha(cab.getFecha());
        dto.setPeriodoOriginal(fpc.getPeriodoOriginal());
        dto.setPeriodoCorregido(fpc.getPeriodoCorregido());
        dto.setCodigoCobertura(cab.getCodigoCobertura());
        dto.setCobertura(cab.getCobertura());
        dto.setImporte(cab.getDebe());
        return dto;
    }

    // =========================================================================
    // 4. Prestaciones a No Considerar
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<PrestacionConsideracionDTO> buscarPrestaciones(String filtro, Pageable pageable) {
        Page<PrestacionConsideracion> page = prestacionConsideracionRepository.buscarConFiltro(
                filtro != null ? filtro.trim() : "",
                pageable
        );
        return page.map(p -> new PrestacionConsideracionDTO(p.getCodigo(), p.getDescripcion(), p.getEstado()));
    }

    @Transactional
    public PrestacionConsideracionDTO cambiarEstadoPrestacion(CambiarEstadoPrestacionRequest req, String usuario) {
        if (req.getCodigo() == null || req.getCodigo().isBlank()) {
            throw new IllegalArgumentException("El código de prestación es obligatorio.");
        }
        String cod = req.getCodigo().trim();
        String nuevoEstado = "No considerar".equalsIgnoreCase(req.getEstado()) ? "No considerar" : "Considerar";

        PrestacionConsideracion pc = prestacionConsideracionRepository.findById(cod)
                .orElse(new PrestacionConsideracion(cod, "", "Considerar"));

        String valorAnterior = pc.getEstado();
        pc.setEstado(nuevoEstado);
        prestacionConsideracionRepository.save(pc);

        registrarHistorial("PRESTACION_ESTADO", cod, valorAnterior, nuevoEstado, usuario);

        return new PrestacionConsideracionDTO(pc.getCodigo(), pc.getDescripcion(), pc.getEstado());
    }

    // =========================================================================
    // 5. Facturas Anuladas Manualmente
    // =========================================================================

    @Transactional(readOnly = true)
    public FacturaAnuladaDTO buscarFacturaParaAnulacion(String tipo, String letra, Integer ptovta, Integer numero) {
        Cabecera cab = buscarCabeceraFactura(tipo, letra, ptovta, numero);
        if (cab == null) {
            return null;
        }

        FacturaAnuladaDTO dto = new FacturaAnuladaDTO();
        dto.setIdCabecera(cab.getId());
        dto.setComprobante(cab.getComprobante());
        dto.setTipo(cab.getTipo());
        dto.setLetra(cab.getLetra());
        dto.setPtovta(cab.getPtovta() != null ? cab.getPtovta().intValue() : null);
        dto.setNumero(cab.getNumero() != null ? cab.getNumero().intValue() : null);
        dto.setFecha(cab.getFecha());
        dto.setPeriodo(cab.getPeriodo());
        dto.setCodigoCobertura(cab.getCodigoCobertura());
        dto.setCobertura(cab.getCobertura());
        dto.setImporte(cab.getDebe());

        // Verificar si está anulada manualmente o en comprobantes_anulados
        Optional<FacturaAnuladaManual> manualOpt = facturaAnuladaManualRepository.findByIdCabecera(cab.getId());
        if (manualOpt.isPresent() && Boolean.TRUE.equals(manualOpt.get().getAnulada())) {
            dto.setAnulada(true);
            dto.setOrigenAnulacion("MANUAL");
        } else if (estaEnComprobantesAnulados(cab.getId())) {
            dto.setAnulada(true);
            dto.setOrigenAnulacion("GESTION");
        } else {
            dto.setAnulada(false);
            dto.setOrigenAnulacion(null);
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public Page<FacturaAnuladaDTO> listarFacturasAnuladas(Pageable pageable) {
        Page<FacturaAnuladaManual> manuales = facturaAnuladaManualRepository.findFacturasAnuladasConCabecera(pageable);
        return manuales.map(fam -> {
            Cabecera cab = fam.getCabecera();
            FacturaAnuladaDTO dto = new FacturaAnuladaDTO();
            dto.setIdCabecera(cab.getId());
            dto.setComprobante(cab.getComprobante());
            dto.setTipo(cab.getTipo());
            dto.setLetra(cab.getLetra());
            dto.setPtovta(cab.getPtovta() != null ? cab.getPtovta().intValue() : null);
            dto.setNumero(cab.getNumero() != null ? cab.getNumero().intValue() : null);
            dto.setFecha(cab.getFecha());
            dto.setPeriodo(cab.getPeriodo());
            dto.setCodigoCobertura(cab.getCodigoCobertura());
            dto.setCobertura(cab.getCobertura());
            dto.setImporte(cab.getDebe());
            dto.setAnulada(true);
            dto.setOrigenAnulacion("MANUAL");
            return dto;
        });
    }

    @Transactional
    public FacturaAnuladaDTO cambiarEstadoAnulacionManual(CambiarAnulacionRequest req, String usuario) {
        if (req.getIdCabecera() == null) {
            throw new IllegalArgumentException("El ID de comprobante es obligatorio.");
        }
        Cabecera cab = cabeceraRepository.findById(req.getIdCabecera())
                .orElseThrow(() -> new IllegalArgumentException("No se encontró el comprobante con ID: " + req.getIdCabecera()));

        boolean nuevaAnulada = Boolean.TRUE.equals(req.getAnulada());

        Optional<FacturaAnuladaManual> actualOpt = facturaAnuladaManualRepository.findByIdCabecera(cab.getId());
        String valorAnterior = actualOpt.map(f -> f.getAnulada() ? "ANULADA" : "ACTIVA").orElse("ACTIVA");

        FacturaAnuladaManual fam = actualOpt.orElse(new FacturaAnuladaManual(cab, nuevaAnulada));
        fam.setAnulada(nuevaAnulada);
        facturaAnuladaManualRepository.save(fam);

        String refDoc = String.format("%s %s %04d-%08d (ID: %d)",
                cab.getTipo(), cab.getLetra(),
                cab.getPtovta() != null ? cab.getPtovta() : 0,
                cab.getNumero() != null ? cab.getNumero() : 0,
                cab.getId());

        String opCodigo = nuevaAnulada ? "FACTURA_ANULADA_MANUAL" : "FACTURA_DESANULADA_MANUAL";
        String valorNuevo = nuevaAnulada ? "ANULADA" : "ACTIVA";

        registrarHistorial(opCodigo, refDoc, valorAnterior, valorNuevo, usuario);

        // Refrescar vista materializada en background para impacto inmediato en Tablero de Control
        CompletableFuture.runAsync(() -> {
            try {
                materializedViewRefreshService.ejecutarRefresh();
            } catch (Exception ex) {
                log.warn("[CONTABILIDAD] Error al refrescar mv_ids_anulados tras anulación manual: {}", ex.getMessage());
            }
        });

        FacturaAnuladaDTO dto = new FacturaAnuladaDTO();
        dto.setIdCabecera(cab.getId());
        dto.setComprobante(cab.getComprobante());
        dto.setTipo(cab.getTipo());
        dto.setLetra(cab.getLetra());
        dto.setPtovta(cab.getPtovta() != null ? cab.getPtovta().intValue() : null);
        dto.setNumero(cab.getNumero() != null ? cab.getNumero().intValue() : null);
        dto.setFecha(cab.getFecha());
        dto.setPeriodo(cab.getPeriodo());
        dto.setCodigoCobertura(cab.getCodigoCobertura());
        dto.setCobertura(cab.getCobertura());
        dto.setImporte(cab.getDebe());
        dto.setAnulada(nuevaAnulada);
        dto.setOrigenAnulacion(nuevaAnulada ? "MANUAL" : null);
        return dto;
    }

    // =========================================================================
    // 6. Consulta de Historial de Ajustes
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<HistorialAjusteDTO> obtenerHistorial(String referencia, Pageable pageable) {
        Page<HistorialAjustesContabilidad> page;
        if (referencia != null && !referencia.isBlank()) {
            page = historialRepository.findByReferenciaContainingIgnoreCase(referencia.trim(), pageable);
        } else {
            page = historialRepository.findAll(pageable);
        }

        return page.map(h -> {
            HistorialAjusteDTO dto = new HistorialAjusteDTO();
            dto.setId(h.getId());
            dto.setTipoOperacionCodigo(h.getTipoOperacion() != null ? h.getTipoOperacion().getCodigo() : "");
            dto.setTipoOperacionDescripcion(h.getTipoOperacion() != null ? h.getTipoOperacion().getDescripcion() : "");
            dto.setReferencia(h.getReferencia());
            dto.setValorAnterior(h.getValorAnterior());
            dto.setValorNuevo(h.getValorNuevo());
            dto.setUsuario(h.getUsuario());
            dto.setFechaHora(h.getFechaHora());
            return dto;
        });
    }

    // =========================================================================
    // Métodos Auxiliares
    // =========================================================================

    private Cabecera buscarCabeceraFactura(String tipo, String letra, Integer ptovta, Integer numero) {
        if (tipo == null || letra == null || ptovta == null || numero == null) {
            return null;
        }
        Optional<Cabecera> opt = cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero(
                tipo.trim().toUpperCase(),
                letra.trim().toUpperCase(),
                ptovta,
                numero
        );
        return opt.orElse(null);
    }

    private boolean estaEnComprobantesAnulados(Long idCabecera) {
        try {
            Query q = entityManager.createNativeQuery(
                    "SELECT 1 FROM comprobantes_anulados WHERE idcabecera = :id LIMIT 1"
            );
            q.setParameter("id", idCabecera);
            return !q.getResultList().isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    private LocalDate parsearFecha(String fechaStr) {
        if (fechaStr == null || fechaStr.isBlank()) {
            return null;
        }
        String clean = fechaStr.trim();
        try {
            if (clean.contains("/")) {
                return LocalDate.parse(clean, FORMATO_FECHA_ARG);
            } else {
                return LocalDate.parse(clean, DateTimeFormatter.ISO_LOCAL_DATE);
            }
        } catch (Exception e) {
            log.warn("No se pudo parsear la fecha: {}", fechaStr);
            return null;
        }
    }
}
