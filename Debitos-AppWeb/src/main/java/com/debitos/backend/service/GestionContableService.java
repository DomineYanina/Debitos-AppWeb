package com.debitos.backend.service;

import com.debitos.backend.dto.FilaHistorialDTO;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

@Service
public class GestionContableService {

    private static final Logger log = LoggerFactory.getLogger(GestionContableService.class);

    private static final DateTimeFormatter FORMATO_FECHA_ARG = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Set<String> TIPOS_RECIBO_OP = Set.of("RC", "RCA", "RCB", "REC", "OP");
    public static final Set<Integer> PTO_VTA_PERMITIDOS = Set.of(30, 31, 32, 36, 53);

    private static final Map<String, List<String>> ORDEN_COBERTURAS = Map.of(
            "codigocobertura", List.of("codigoCobertura"),
            "nombreoriginal", List.of("nombreOriginal"),
            "nombremostrar", List.of("nombreMostrar")
    );

    private static final Map<String, List<String>> ORDEN_PRESTACIONES = Map.of(
            "codigo", List.of("codigo"),
            "descripcion", List.of("descripcion"),
            "estado", List.of("estado"),
            "estadoambulatorio", List.of("estadoAmbulatorio"),
            "estadoambulatorios", List.of("estadoAmbulatorio"),
            "estadointernado", List.of("estadoInternado"),
            "estadointernados", List.of("estadoInternado")
    );

    private static final Map<String, List<String>> ORDEN_ANULADAS = Map.of(
            "comprobante", List.of("cabecera.tipo", "cabecera.letra", "cabecera.ptovta", "cabecera.numero"),
            "fecha", List.of("cabecera.fecha"),
            "cobertura", List.of("cabecera.cobertura"),
            "importe", List.of("cabecera.debe")
    );

    public static final Set<String> CODIGOS_NO_INSTITUCIONALES_EXCLUIDOS = Set.of(
            "1", "259", "10001583", "002014", "002016", "002018", "800", "1186", "1193", "1969", "2029"
    );

    private static final Map<String, List<String>> ORDEN_HISTORIAL = Map.of(
            "fechahora", List.of("fechaHora"),
            "operacion", List.of("tipoOperacion.descripcion"),
            "referencia", List.of("referencia"),
            "valoranterior", List.of("valorAnterior"),
            "valornuevo", List.of("valorNuevo"),
            "usuario", List.of("usuario")
    );

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

    @Autowired(required = false)
    private AuditoriaService auditoriaService;

    @Autowired(required = false)
    private NotificacionService notificacionService;

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
    public Page<CoberturaAliasDTO> buscarCoberturasPaginadas(String filtro, int page, int size, String sortBy, String sortDir) {
        Pageable pageable = construirPageable(
                page, size, sortBy, sortDir, ORDEN_COBERTURAS,
                Sort.by(Sort.Direction.ASC, "codigoCobertura"),
                Sort.Order.asc("codigoCobertura"));
        return buscarCoberturasPaginadas(filtro, pageable);
    }

    private boolean esCodigoNoInstitucional(String codigo) {
        if (codigo == null) return false;
        return CODIGOS_NO_INSTITUCIONALES_EXCLUIDOS.contains(codigo.trim());
    }

    private boolean esNombreSistemasPP(String nombre) {
        if (nombre == null) return false;
        return nombre.toUpperCase().contains("SISTEMAS PP");
    }

    @Transactional(readOnly = true)
    public Page<CoberturaAliasDTO> buscarCoberturasPaginadas(String filtro, Pageable pageable) {
        String f = (filtro != null && !filtro.isBlank()) ? filtro.trim() : null;
        Page<CoberturaAlias> page = coberturaAliasRepository.buscarConFiltro(f, pageable);
        return page.map(c -> new CoberturaAliasDTO(c.getCodigoCobertura(), c.getNombreOriginal(), c.getNombreMostrar()));
    }

    @Transactional(readOnly = true)
    public CoberturaAliasDTO obtenerCobertura(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            return null;
        }
        String codigoLimpio = codigo.trim();
        if (esCodigoNoInstitucional(codigoLimpio)) {
            return null;
        }

        // 1. Buscar si ya tiene alias guardado
        Optional<CoberturaAlias> aliasOpt = coberturaAliasRepository.findById(codigoLimpio);
        if (aliasOpt.isPresent()) {
            CoberturaAlias a = aliasOpt.get();
            if (esNombreSistemasPP(a.getNombreOriginal()) || esNombreSistemasPP(a.getNombreMostrar())) {
                return null;
            }
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

        if (esNombreSistemasPP(nombreOriginal)) {
            return null;
        }

        return new CoberturaAliasDTO(codigoLimpio, nombreOriginal, nombreOriginal);
    }

    @Transactional
    public CoberturaAliasDTO guardarAliasCobertura(GuardarAliasRequest req, String usuario) {
        if (req.getCodigoCobertura() == null || req.getCodigoCobertura().isBlank()) {
            throw new IllegalArgumentException("El código de cobertura es obligatorio.");
        }
        String cod = req.getCodigoCobertura().trim();
        if (esCodigoNoInstitucional(cod) || esNombreSistemasPP(req.getNombreOriginal()) || esNombreSistemasPP(req.getNombreMostrar())) {
            throw new IllegalArgumentException("No está permitido modificar o asignar alias a una entidad no institucional.");
        }
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
        dto.setImporte(resolverImporteDocumento(cab));

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
            throw new IllegalArgumentException("El formato del período corregido no es válido (use DD/MM/YYYY, YYYY-MM o YYYY-MM-DD).");
        }
        fechaCorregida = fechaCorregida.withDayOfMonth(1);

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
        dto.setImporte(resolverImporteDocumento(cab));
        return dto;
    }

    @Transactional(readOnly = true)
    public Page<FacturaPeriodoDTO> listarFacturasPeriodoCorregido(Pageable pageable) {
        Page<FacturaPeriodoCorregido> page = facturaPeriodoCorregidoRepository.findFacturasPeriodoCorregidoConCabecera(pageable);
        return page.map(fpc -> {
            Cabecera cab = fpc.getCabecera();
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
            dto.setImporte(resolverImporteDocumento(cab));
            return dto;
        });
    }

    // =========================================================================
    // 4. Prestaciones a No Considerar
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<PrestacionConsideracionDTO> buscarPrestaciones(String filtro, String estadoAmb, String estadoInt, int page, int size, String sortBy, String sortDir) {
        Pageable pageable = construirPageable(
                page, size, sortBy, sortDir, ORDEN_PRESTACIONES,
                Sort.by(Sort.Direction.ASC, "codigo"),
                Sort.Order.asc("codigo"));
        return buscarPrestaciones(filtro, estadoAmb, estadoInt, pageable);
    }

    @Transactional(readOnly = true)
    public Page<PrestacionConsideracionDTO> buscarPrestaciones(String filtro, String estado, int page, int size, String sortBy, String sortDir) {
        return buscarPrestaciones(filtro, estado, null, page, size, sortBy, sortDir);
    }

    @Transactional(readOnly = true)
    public Page<PrestacionConsideracionDTO> buscarPrestaciones(String filtro, int page, int size, String sortBy, String sortDir) {
        return buscarPrestaciones(filtro, null, null, page, size, sortBy, sortDir);
    }

    @Transactional(readOnly = true)
    public Page<PrestacionConsideracionDTO> buscarPrestaciones(String filtro, Pageable pageable) {
        return buscarPrestaciones(filtro, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<PrestacionConsideracionDTO> buscarPrestaciones(String filtro, String estado, Pageable pageable) {
        return buscarPrestaciones(filtro, estado, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<PrestacionConsideracionDTO> buscarPrestaciones(String filtro, String estadoAmb, String estadoInt, Pageable pageable) {
        String filtroNorm = filtro != null ? filtro.trim() : "";
        String estadoAmbNorm = (estadoAmb != null && !estadoAmb.isBlank() && !"TODOS".equalsIgnoreCase(estadoAmb.trim()))
                ? estadoAmb.trim()
                : "";
        String estadoIntNorm = (estadoInt != null && !estadoInt.isBlank() && !"TODOS".equalsIgnoreCase(estadoInt.trim()))
                ? estadoInt.trim()
                : "";
        Page<PrestacionConsideracion> page = prestacionConsideracionRepository.buscarConFiltro(
                filtroNorm,
                estadoAmbNorm,
                estadoIntNorm,
                pageable
        );
        return page.map(p -> new PrestacionConsideracionDTO(p.getCodigo(), p.getDescripcion(), p.getEstado(), p.getEstadoAmbulatorio(), p.getEstadoInternado()));
    }

    @Transactional
    public PrestacionConsideracionDTO cambiarEstadoPrestacion(CambiarEstadoPrestacionRequest req, String usuario) {
        if (req.getCodigo() == null || req.getCodigo().isBlank()) {
            throw new IllegalArgumentException("El código de prestación es obligatorio.");
        }
        String cod = req.getCodigo().trim();

        PrestacionConsideracion pc = prestacionConsideracionRepository.findById(cod)
                .orElse(new PrestacionConsideracion(cod, "", "Considerar", "Considerar"));

        String valorAnteriorAmb = pc.getEstadoAmbulatorio();
        String valorAnteriorInt = pc.getEstadoInternado();

        String nuevoAmb;
        if (req.getEstadoAmbulatorio() != null && !req.getEstadoAmbulatorio().isBlank()) {
            nuevoAmb = "No considerar".equalsIgnoreCase(req.getEstadoAmbulatorio()) ? "No considerar" : "Considerar";
        } else if (req.getEstado() != null && !req.getEstado().isBlank()) {
            nuevoAmb = "No considerar".equalsIgnoreCase(req.getEstado()) ? "No considerar" : "Considerar";
        } else {
            nuevoAmb = (valorAnteriorAmb != null) ? valorAnteriorAmb : "Considerar";
        }

        String nuevoInt;
        if (req.getEstadoInternado() != null && !req.getEstadoInternado().isBlank()) {
            nuevoInt = "No considerar".equalsIgnoreCase(req.getEstadoInternado()) ? "No considerar" : "Considerar";
        } else if (req.getEstado() != null && !req.getEstado().isBlank()) {
            nuevoInt = "No considerar".equalsIgnoreCase(req.getEstado()) ? "No considerar" : "Considerar";
        } else {
            nuevoInt = (valorAnteriorInt != null) ? valorAnteriorInt : "Considerar";
        }

        pc.setEstadoAmbulatorio(nuevoAmb);
        pc.setEstadoInternado(nuevoInt);
        pc.setEstado(("No considerar".equalsIgnoreCase(nuevoAmb) && "No considerar".equalsIgnoreCase(nuevoInt)) ? "No considerar" : nuevoAmb);

        prestacionConsideracionRepository.save(pc);

        if (!Objects.equals(valorAnteriorAmb, nuevoAmb)) {
            registrarHistorial("PRESTACION_ESTADO_AMBULATORIO", cod, valorAnteriorAmb, nuevoAmb, usuario);
        }
        if (!Objects.equals(valorAnteriorInt, nuevoInt)) {
            registrarHistorial("PRESTACION_ESTADO_INTERNADO", cod, valorAnteriorInt, nuevoInt, usuario);
        }
        if (Objects.equals(valorAnteriorAmb, nuevoAmb) && Objects.equals(valorAnteriorInt, nuevoInt) && req.getEstado() != null) {
            registrarHistorial("PRESTACION_ESTADO", cod, valorAnteriorAmb, nuevoAmb, usuario);
        }

        return new PrestacionConsideracionDTO(pc.getCodigo(), pc.getDescripcion(), pc.getEstado(), pc.getEstadoAmbulatorio(), pc.getEstadoInternado());
    }

    // =========================================================================
    // 5. Facturas Anuladas Manualmente
    // =========================================================================

    @Transactional(readOnly = true)
    public FacturaAnuladaDTO buscarFacturaParaAnulacion(String tipo, String letra, Integer ptovta, Integer numero) {
        if (ptovta != null && !PTO_VTA_PERMITIDOS.contains(ptovta)) {
            return null;
        }
        Cabecera cab = buscarCabeceraFactura(tipo, letra, ptovta, numero);
        if (cab == null) {
            return null;
        }
        if (cab.getPtovta() == null || !PTO_VTA_PERMITIDOS.contains(cab.getPtovta())) {
            return null;
        }

        // Verificar si está anulada manualmente o en comprobantes_anulados
        Optional<FacturaAnuladaManual> manualOpt = facturaAnuladaManualRepository.findByIdCabecera(cab.getId());
        FacturaAnuladaDTO dto;
        if (manualOpt.isPresent() && Boolean.TRUE.equals(manualOpt.get().getAnulada())) {
            FacturaAnuladaManual fam = manualOpt.get();
            Cabecera cabAnulador = fam.getCabeceraAnulador();
            Long idAnulador = fam.getIdCabeceraAnulador();
            String compAnulador = fam.getComprobanteAnulador();
            if (cabAnulador == null && idAnulador != null) {
                cabAnulador = cabeceraRepository.findById(idAnulador).orElse(null);
            }
            if (cabAnulador == null && idAnulador == null && cab.getId() != null) {
                List<FacturaAnuladaManual> vinculadas = facturaAnuladaManualRepository.findActivasPorIdsCabeceraOAnulador(List.of(cab.getId()));
                if (vinculadas != null) {
                    for (FacturaAnuladaManual vinc : vinculadas) {
                        if (vinc != null && Objects.equals(vinc.getIdCabeceraAnulador(), cab.getId()) && vinc.getCabecera() != null) {
                            cabAnulador = vinc.getCabecera();
                            idAnulador = cabAnulador.getId();
                            break;
                        }
                    }
                }
            }
            if ((compAnulador == null || compAnulador.isBlank()) && cabAnulador != null) {
                compAnulador = formatearComprobanteCabecera(cabAnulador);
            }
            dto = construirFacturaAnuladaDTO(
                    cab,
                    true,
                    "MANUAL",
                    idAnulador,
                    compAnulador,
                    cabAnulador,
                    fam.getFechaAnulacion(),
                    fam.getUsuario());
        } else if (estaEnComprobantesAnulados(cab.getId())) {
            dto = construirFacturaAnuladaDTO(cab, true, "GESTION", null, null);
        } else {
            dto = construirFacturaAnuladaDTO(cab, false, null, null, null);
        }

        if (notificacionService != null && !dto.isAnulada()) {
            notificacionService.buscarSolicitudAnulacionActiva(cab.getTipo(), cab.getLetra(), cab.getPtovta(), cab.getNumero())
                    .ifPresent(notif -> {
                        dto.setTieneSolicitudAnulacion(true);
                        dto.setIdNotificacionSolicitud(notif.getId());
                        dto.setUsuarioSolicitante(notif.getUsuarioOrigen());
                        dto.setMotivoSolicitudAnulacion(notif.getMensaje());
                    });
        }
        return dto;
    }

    /**
     * Obtiene los comprobantes candidatos para actuar como documento anulador
     * dentro del mismo {@code asociadogrupo} del comprobante origen, excluyendo
     * al propio comprobante, recibos/órdenes de pago y documentos ya anulados.
     */
    @Transactional(readOnly = true)
    public List<FacturaAnuladaDTO> buscarCandidatosAnuladorPorGrupo(Long idCabeceraOrigen) {
        if (idCabeceraOrigen == null) {
            throw new IllegalArgumentException("El ID del documento a anular es obligatorio.");
        }
        Cabecera origen = cabeceraRepository.findById(idCabeceraOrigen)
                .orElseThrow(() -> new IllegalArgumentException("No se encontró el documento origen con ID: " + idCabeceraOrigen));

        Long grupo = origen.getAsociadogrupo();
        List<Cabecera> delGrupo = new ArrayList<>();
        if (grupo != null && grupo > 0) {
            List<Cabecera> docsGrupo = cabeceraRepository.findByAsociadogrupoOrderByFechaDescIdDesc(grupo);
            if (docsGrupo != null) {
                delGrupo.addAll(docsGrupo);
            }
        }

        // Incorporar comprobantes que apunten al documento origen por asociado o comprobante_asociado
        // (por ejemplo si fueron importados con un asociadogrupo temporal de anulación)
        if (origen.getComprobante() != null && !origen.getComprobante().isBlank()) {
            List<Cabecera> porCompAsoc = cabeceraRepository.findByComprobanteAsociadoIgnoreCase(origen.getComprobante().trim());
            if (porCompAsoc != null) {
                for (Cabecera c : porCompAsoc) {
                    if (delGrupo.stream().noneMatch(existente -> Objects.equals(existente.getId(), c.getId()))) {
                        delGrupo.add(c);
                    }
                }
            }
        }
        if (origen.getId() != null) {
            List<Cabecera> porAsociado = cabeceraRepository.findByAsociado(origen.getId());
            if (porAsociado != null) {
                for (Cabecera c : porAsociado) {
                    if (delGrupo.stream().noneMatch(existente -> Objects.equals(existente.getId(), c.getId()))) {
                        delGrupo.add(c);
                    }
                }
            }
        }

        if (delGrupo.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> idsEvaluar = new ArrayList<>();
        for (Cabecera c : delGrupo) {
            if (c != null && c.getId() != null && !Objects.equals(c.getId(), idCabeceraOrigen) && !esTipoReciboOOrdenPago(c)) {
                idsEvaluar.add(c.getId());
            }
        }
        if (idsEvaluar.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> idsNoElegibles = new HashSet<>();
        // 1. Documentos formalmente anulados en facturas_anuladas_manual
        List<Long> manualAnulados = facturaAnuladaManualRepository.findIdsCabeceraAnuladasEn(idsEvaluar);
        if (manualAnulados != null) {
            idsNoElegibles.addAll(manualAnulados);
        }
        // 2. Documentos formalmente registrados como anuladores en facturas_anuladas_manual
        List<Long> manualAnuladores = facturaAnuladaManualRepository.findIdsCabeceraAnuladoresManual();
        if (manualAnuladores != null) {
            idsNoElegibles.addAll(manualAnuladores);
        }
        // 3. Documentos anulados en comprobantes_anulados
        idsNoElegibles.addAll(obtenerIdsEnComprobantesAnulados(idsEvaluar));

        // 4. Documentos anulados o anuladores detectados contablemente en el historial familiar
        if (auditoriaService != null) {
            try {
                List<FilaHistorialDTO> historial = auditoriaService.obtenerHistorialComprobantes(
                        origen.getTipo(), origen.getLetra(), origen.getPtovta(), origen.getNumero()
                );
                if (historial != null) {
                    for (FilaHistorialDTO fila : historial) {
                        if (fila != null && fila.getIdCabecera() != null) {
                            if (fila.isAnulado() || fila.isAnulador()) {
                                idsNoElegibles.add(fila.getIdCabecera());
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("No se pudo obtener historial de auditoría para filtrar candidatos anuladores: {}", e.getMessage());
            }
        }

        List<FacturaAnuladaDTO> candidatos = new ArrayList<>();
        for (Cabecera c : delGrupo) {
            if (c == null || c.getId() == null || Objects.equals(c.getId(), idCabeceraOrigen)) {
                continue;
            }
            if (esTipoReciboOOrdenPago(c) || idsNoElegibles.contains(c.getId())) {
                continue;
            }
            if (c.getPtovta() == null || !PTO_VTA_PERMITIDOS.contains(c.getPtovta())) {
                continue;
            }
            candidatos.add(construirFacturaAnuladaDTO(c, false, null, null, null));
        }
        return candidatos;
    }

    @Transactional(readOnly = true)
    public Page<FacturaAnuladaDTO> listarFacturasAnuladas(int page, int size, String sortBy, String sortDir) {
        return listarFacturasAnuladas(null, null, page, size, sortBy, sortDir);
    }

    @Transactional(readOnly = true)
    public Page<FacturaAnuladaDTO> listarFacturasAnuladas(String tipo, String filtro, int page, int size, String sortBy, String sortDir) {
        Pageable pageable = construirPageable(
                page, size, sortBy, sortDir, ORDEN_ANULADAS,
                Sort.by(Sort.Direction.DESC, "cabecera.fecha").and(Sort.by(Sort.Direction.DESC, "idCabecera")),
                Sort.Order.desc("idCabecera"));
        return listarFacturasAnuladas(tipo, filtro, pageable);
    }

    @Transactional(readOnly = true)
    public Page<FacturaAnuladaDTO> listarFacturasAnuladas(Pageable pageable) {
        return listarFacturasAnuladas(null, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<FacturaAnuladaDTO> listarFacturasAnuladas(String tipo, String filtro, Pageable pageable) {
        List<String> tiposFiltro = resolverTiposFiltroAnuladas(tipo);
        boolean filtrarTipos = !tiposFiltro.isEmpty();
        String filtroNorm = (filtro != null) ? filtro.trim() : "";

        Page<FacturaAnuladaManual> manuales;
        if (!filtrarTipos && filtroNorm.isEmpty()) {
            manuales = facturaAnuladaManualRepository.findFacturasAnuladasConCabecera(PTO_VTA_PERMITIDOS, pageable);
        } else {
            List<String> tiposQuery = filtrarTipos ? tiposFiltro : List.of("FC");
            manuales = facturaAnuladaManualRepository.findFacturasAnuladasConCabeceraFiltradas(
                    PTO_VTA_PERMITIDOS,
                    filtrarTipos,
                    tiposQuery,
                    filtroNorm,
                    pageable);
        }
        Map<Long, Cabecera> contrapartidasInversas = new java.util.HashMap<>();
        List<Long> idsSinAnulador = new ArrayList<>();
        for (FacturaAnuladaManual fam : manuales.getContent()) {
            if (fam != null && fam.getIdCabeceraAnulador() == null && fam.getCabeceraAnulador() == null && fam.getIdCabecera() != null) {
                idsSinAnulador.add(fam.getIdCabecera());
            }
        }
        if (!idsSinAnulador.isEmpty()) {
            List<FacturaAnuladaManual> vinculadas = facturaAnuladaManualRepository.findActivasPorIdsCabeceraOAnulador(idsSinAnulador);
            if (vinculadas != null) {
                for (FacturaAnuladaManual vinc : vinculadas) {
                    if (vinc != null && vinc.getIdCabeceraAnulador() != null && vinc.getCabecera() != null) {
                        contrapartidasInversas.putIfAbsent(vinc.getIdCabeceraAnulador(), vinc.getCabecera());
                    }
                }
            }
        }

        return manuales.map(fam -> {
            Cabecera cabAnulador = fam.getCabeceraAnulador();
            Long idAnulador = fam.getIdCabeceraAnulador();
            String compAnulador = fam.getComprobanteAnulador();
            if (cabAnulador == null && idAnulador == null && fam.getIdCabecera() != null) {
                Cabecera inversa = contrapartidasInversas.get(fam.getIdCabecera());
                if (inversa != null) {
                    cabAnulador = inversa;
                    idAnulador = inversa.getId();
                    compAnulador = formatearComprobanteCabecera(inversa);
                }
            }
            return construirFacturaAnuladaDTO(
                    fam.getCabecera(),
                    true,
                    "MANUAL",
                    idAnulador,
                    compAnulador,
                    cabAnulador,
                    fam.getFechaAnulacion(),
                    fam.getUsuario());
        });
    }

    private List<String> resolverTiposFiltroAnuladas(String tipo) {
        if (tipo == null || tipo.isBlank() || "TODOS".equalsIgnoreCase(tipo.trim())) {
            return Collections.emptyList();
        }
        String norm = tipo.trim().toUpperCase();
        return switch (norm) {
            case "FACTURAS" -> List.of("FC", "FAC", "FCE", "FCA");
            case "NOTAS_CREDITO" -> List.of("NC", "NCE", "NCA", "NCB");
            case "NOTAS_DEBITO" -> List.of("ND", "NDE", "NDA", "NDB");
            default -> List.of(norm);
        };
    }

    @Transactional
    public FacturaAnuladaDTO cambiarEstadoAnulacionManual(CambiarAnulacionRequest req, String usuario) {
        if (req.getIdCabecera() == null) {
            throw new IllegalArgumentException("El ID de comprobante es obligatorio.");
        }
        Cabecera cab = cabeceraRepository.findById(req.getIdCabecera())
                .orElseThrow(() -> new IllegalArgumentException("No se encontró el comprobante con ID: " + req.getIdCabecera()));

        if (cab.getPtovta() == null || !PTO_VTA_PERMITIDOS.contains(cab.getPtovta())) {
            throw new IllegalArgumentException("No se permite modificar el estado de anulación de un comprobante cuyo punto de venta ("
                    + cab.getPtovta() + ") no pertenezca a los permitidos (30, 31, 32, 36, 53).");
        }

        boolean nuevaAnulada = Boolean.TRUE.equals(req.getAnulada());

        Optional<FacturaAnuladaManual> actualOpt = facturaAnuladaManualRepository.findByIdCabecera(cab.getId());
        String valorAnterior = actualOpt.map(f -> f.getAnulada() ? "ANULADA" : "ACTIVA").orElse("ACTIVA");

        FacturaAnuladaManual fam;
        if (actualOpt.isPresent()) {
            fam = actualOpt.get();
        } else {
            fam = new FacturaAnuladaManual(cab, nuevaAnulada);
            fam.setIdCabecera(cab.getId());
            fam.setNewEntity(true);
        }
        fam.setAnulada(nuevaAnulada);

        if (nuevaAnulada) {
            Long grupoOrigen = cab.getAsociadogrupo();
            if (grupoOrigen == null || grupoOrigen <= 0) {
                throw new IllegalArgumentException("El documento a anular no posee asociadogrupo asignado.");
            }
            if (req.getIdCabeceraAnulador() == null) {
                throw new IllegalArgumentException("Debe seleccionar un documento anulador del mismo asociadogrupo.");
            }
            Cabecera cabAnulador = cabeceraRepository.findById(req.getIdCabeceraAnulador())
                    .orElseThrow(() -> new IllegalArgumentException("No se encontró el documento anulador con ID: " + req.getIdCabeceraAnulador()));

            if (Objects.equals(cab.getId(), cabAnulador.getId())) {
                throw new IllegalArgumentException("El documento anulador no puede ser el mismo documento que se intenta anular.");
            }
            if (esTipoReciboOOrdenPago(cabAnulador)) {
                throw new IllegalArgumentException("No se puede utilizar un recibo u orden de pago como documento anulador.");
            }
            if (cabAnulador.getPtovta() == null || !PTO_VTA_PERMITIDOS.contains(cabAnulador.getPtovta())) {
                throw new IllegalArgumentException("El documento anulador seleccionado posee un punto de venta ("
                        + cabAnulador.getPtovta() + ") no permitido.");
            }
            if (!Objects.equals(grupoOrigen, cabAnulador.getAsociadogrupo())) {
                log.info("Documento anulador ID {} tenía asociadogrupo #{} distinto del documento a anular (#{}); unificando asociadogrupo...",
                        cabAnulador.getId(), cabAnulador.getAsociadogrupo(), grupoOrigen);
                cabAnulador.setAsociadogrupo(grupoOrigen);
                if (cabAnulador.getAsociado() == null || cabAnulador.getAsociado() == 0) {
                    cabAnulador.setAsociado(cab.getId());
                }
                cabeceraRepository.save(cabAnulador);
            }
            if (estaDocumentoAnuladoOAnulador(cabAnulador.getId(), cab)) {
                throw new IllegalArgumentException("El comprobante anulador seleccionado ya se encuentra anulado o actúa como anulador de otro documento.");
            }

            fam.setIdCabeceraAnulador(cabAnulador.getId());
            fam.setCabeceraAnulador(cabAnulador);
            fam.setFechaAnulacion(LocalDateTime.now());
            fam.setUsuario(usuario);
        } else {
            fam.setIdCabeceraAnulador(null);
            fam.setCabeceraAnulador(null);
            fam.setFechaAnulacion(null);
            fam.setUsuario(usuario);
        }

        facturaAnuladaManualRepository.save(fam);

        if (nuevaAnulada && notificacionService != null) {
            notificacionService.eliminarSolicitudesAnulacionParaDocumento(cab.getTipo(), cab.getLetra(), cab.getPtovta(), cab.getNumero());
        }

        String refDoc;
        String compAnuladorStr = fam.getComprobanteAnulador();
        if (nuevaAnulada && compAnuladorStr != null && !compAnuladorStr.isBlank()) {
            refDoc = String.format("%s (Anulada por %s)",
                    cab.getComprobante() != null ? cab.getComprobante() : (cab.getTipo() + " " + cab.getNumero()),
                    compAnuladorStr);
        } else {
            refDoc = String.format("%s %s %04d-%08d (ID: %d)",
                    cab.getTipo(), cab.getLetra(),
                    cab.getPtovta() != null ? cab.getPtovta() : 0,
                    cab.getNumero() != null ? cab.getNumero() : 0,
                    cab.getId());
        }

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

        return construirFacturaAnuladaDTO(
                cab,
                nuevaAnulada,
                nuevaAnulada ? "MANUAL" : null,
                fam.getIdCabeceraAnulador(),
                fam.getComprobanteAnulador(),
                fam.getCabeceraAnulador(),
                fam.getFechaAnulacion(),
                fam.getUsuario());
    }

    // =========================================================================
    // 6. Consulta de Historial de Ajustes
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<HistorialAjusteDTO> obtenerHistorial(String referencia, int page, int size, String sortBy, String sortDir) {
        Pageable pageable = construirPageable(
                page, size, sortBy, sortDir, ORDEN_HISTORIAL,
                Sort.by(Sort.Direction.DESC, "fechaHora").and(Sort.by(Sort.Direction.DESC, "id")),
                Sort.Order.desc("id"));
        return obtenerHistorial(referencia, pageable);
    }

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

    /**
     * Determina el importe representativo del comprobante contable:
     * - Para Notas de Crédito (NC, NCE, NCA, etc.), el importe está en la columna 'haber'.
     * - Para Facturas (FC, FAC, FCE, FCA, etc.) y Notas de Débito (ND, NDE, NDA, etc.), el importe está en 'debe'.
     * Aplica fallback cruzado en caso de que la columna esperada sea 0 o null y la otra contenga un valor.
     */
    private BigDecimal resolverImporteDocumento(Cabecera cab) {
        if (cab == null) {
            return BigDecimal.ZERO;
        }
        String tipo = cab.getTipo() != null ? cab.getTipo().trim().toUpperCase() : "";
        if (tipo.startsWith("NC")) {
            if (cab.getHaber() != null && cab.getHaber().compareTo(BigDecimal.ZERO) != 0) {
                return cab.getHaber();
            }
            if (cab.getDebe() != null && cab.getDebe().compareTo(BigDecimal.ZERO) != 0) {
                return cab.getDebe();
            }
            return cab.getHaber() != null ? cab.getHaber() : BigDecimal.ZERO;
        }
        if (tipo.startsWith("ND") || tipo.startsWith("FC") || tipo.startsWith("FAC")) {
            if (cab.getDebe() != null && cab.getDebe().compareTo(BigDecimal.ZERO) != 0) {
                return cab.getDebe();
            }
            if (cab.getHaber() != null && cab.getHaber().compareTo(BigDecimal.ZERO) != 0) {
                return cab.getHaber();
            }
            return cab.getDebe() != null ? cab.getDebe() : BigDecimal.ZERO;
        }
        // Fallback genérico para otros tipos o registros sin prefijo conocido
        if (cab.getDebe() != null && cab.getDebe().compareTo(BigDecimal.ZERO) != 0) {
            return cab.getDebe();
        }
        if (cab.getHaber() != null && cab.getHaber().compareTo(BigDecimal.ZERO) != 0) {
            return cab.getHaber();
        }
        return cab.getDebe() != null ? cab.getDebe() : (cab.getHaber() != null ? cab.getHaber() : BigDecimal.ZERO);
    }

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

    private String formatearComprobanteCabecera(Cabecera cab) {
        if (cab == null) {
            return null;
        }
        String comp = cab.getComprobante();
        if (comp == null || comp.isBlank()) {
            if (cab.getTipo() != null && cab.getLetra() != null && cab.getPtovta() != null && cab.getNumero() != null) {
                comp = String.format("%s %s%04d-%08d", cab.getTipo().trim(), cab.getLetra().trim(), cab.getPtovta(), cab.getNumero());
            }
        }
        return comp;
    }

    private FacturaAnuladaDTO construirFacturaAnuladaDTO(
            Cabecera cab,
            boolean anulada,
            String origenAnulacion,
            Long idCabeceraAnulador,
            String comprobanteAnulador) {
        return construirFacturaAnuladaDTO(cab, anulada, origenAnulacion, idCabeceraAnulador, comprobanteAnulador, null, null, null);
    }

    private FacturaAnuladaDTO construirFacturaAnuladaDTO(
            Cabecera cab,
            boolean anulada,
            String origenAnulacion,
            Long idCabeceraAnulador,
            String comprobanteAnulador,
            Cabecera cabAnulador,
            LocalDateTime fechaAnulacion,
            String usuarioAnulacion) {
        FacturaAnuladaDTO dto = new FacturaAnuladaDTO();
        dto.setIdCabecera(cab.getId());
        dto.setAsociadogrupo(cab.getAsociadogrupo());
        String comp = formatearComprobanteCabecera(cab);
        dto.setComprobante(comp);
        dto.setTipo(cab.getTipo());
        dto.setLetra(cab.getLetra());
        dto.setPtovta(cab.getPtovta() != null ? cab.getPtovta().intValue() : null);
        dto.setNumero(cab.getNumero() != null ? cab.getNumero().intValue() : null);
        dto.setFecha(cab.getFecha());
        dto.setPeriodo(cab.getPeriodo());
        dto.setCodigoCobertura(cab.getCodigoCobertura());
        dto.setCobertura(cab.getCobertura());
        dto.setImporte(resolverImporteDocumento(cab));
        dto.setTipoRegistro(cab.getTiporegistro());
        dto.setComprobanteAsociado(cab.getComprobanteAsociado());
        dto.setAnulada(anulada);
        dto.setOrigenAnulacion(origenAnulacion);
        dto.setFechaAnulacion(fechaAnulacion);
        dto.setUsuarioAnulacion(usuarioAnulacion);
        dto.setIdCabeceraAnulador(idCabeceraAnulador != null ? idCabeceraAnulador : (cabAnulador != null ? cabAnulador.getId() : null));
        String compAnulEfectivo = (comprobanteAnulador != null && !comprobanteAnulador.isBlank())
                ? comprobanteAnulador
                : formatearComprobanteCabecera(cabAnulador);
        dto.setComprobanteAnulador(compAnulEfectivo);
        if (cabAnulador != null) {
            dto.setTipoAnulador(cabAnulador.getTipo());
            dto.setLetraAnulador(cabAnulador.getLetra());
            dto.setPtovtaAnulador(cabAnulador.getPtovta() != null ? cabAnulador.getPtovta().intValue() : null);
            dto.setNumeroAnulador(cabAnulador.getNumero() != null ? cabAnulador.getNumero().intValue() : null);
            dto.setFechaAnulador(cabAnulador.getFecha());
            dto.setPeriodoAnulador(cabAnulador.getPeriodo());
            dto.setCodigoCoberturaAnulador(cabAnulador.getCodigoCobertura());
            dto.setCoberturaAnulador(cabAnulador.getCobertura());
            dto.setImporteAnulador(resolverImporteDocumento(cabAnulador));
            dto.setAsociadogrupoAnulador(cabAnulador.getAsociadogrupo());
            dto.setTipoRegistroAnulador(cabAnulador.getTiporegistro());
        }
        return dto;
    }

    private boolean esTipoReciboOOrdenPago(Cabecera cab) {
        if (cab == null || cab.getTipo() == null) {
            return false;
        }
        return TIPOS_RECIBO_OP.contains(cab.getTipo().trim().toUpperCase());
    }

    private boolean estaDocumentoAnulado(Long idCabecera) {
        if (idCabecera == null) {
            return false;
        }
        Optional<FacturaAnuladaManual> manualOpt = facturaAnuladaManualRepository.findByIdCabecera(idCabecera);
        if (manualOpt.isPresent() && Boolean.TRUE.equals(manualOpt.get().getAnulada())) {
            return true;
        }
        return estaEnComprobantesAnulados(idCabecera);
    }

    private boolean estaDocumentoAnuladoOAnulador(Long idCabecera, Cabecera origen) {
        if (idCabecera == null) {
            return false;
        }
        if (estaDocumentoAnulado(idCabecera)) {
            return true;
        }
        List<Long> anuladores = facturaAnuladaManualRepository.findIdsCabeceraAnuladoresManual();
        if (anuladores != null && anuladores.contains(idCabecera)) {
            return true;
        }
        if (auditoriaService != null && origen != null) {
            try {
                List<FilaHistorialDTO> historial = auditoriaService.obtenerHistorialComprobantes(
                        origen.getTipo(), origen.getLetra(), origen.getPtovta(), origen.getNumero()
                );
                if (historial != null) {
                    return historial.stream().anyMatch(f ->
                            Objects.equals(f.getIdCabecera(), idCabecera) && (f.isAnulado() || f.isAnulador()));
                }
            } catch (Exception ignored) {}
        }
        return false;
    }

    private Set<Long> obtenerIdsEnComprobantesAnulados(Collection<Long> ids) {
        if (entityManager == null || ids == null || ids.isEmpty()) {
            return Collections.emptySet();
        }
        try {
            Query q = entityManager.createNativeQuery(
                    "SELECT DISTINCT idcabecera FROM comprobantes_anulados WHERE idcabecera IN (:ids)"
            );
            q.setParameter("ids", ids);
            List<?> rows = q.getResultList();
            Set<Long> result = new HashSet<>();
            for (Object row : rows) {
                if (row instanceof Number num) {
                    result.add(num.longValue());
                }
            }
            return result;
        } catch (Exception e) {
            return Collections.emptySet();
        }
    }

    private boolean estaEnComprobantesAnulados(Long idCabecera) {
        if (entityManager == null || idCabecera == null) {
            return false;
        }
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

    private static Pageable construirPageable(
            int page,
            int size,
            String sortBy,
            String sortDir,
            Map<String, List<String>> camposPermitidos,
            Sort ordenPorDefecto,
            Sort.Order desempate) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);

        if (sortBy == null || sortBy.isBlank()) {
            return PageRequest.of(safePage, safeSize, ordenPorDefecto);
        }

        List<String> propiedades = camposPermitidos.get(sortBy.trim().toLowerCase());
        if (propiedades == null || propiedades.isEmpty()) {
            return PageRequest.of(safePage, safeSize, ordenPorDefecto);
        }

        Sort.Direction dir = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        List<Sort.Order> orders = new ArrayList<>();
        for (String prop : propiedades) {
            orders.add(new Sort.Order(dir, prop));
        }
        if (desempate != null && !propiedades.contains(desempate.getProperty())) {
            orders.add(desempate);
        }
        return PageRequest.of(safePage, safeSize, Sort.by(orders));
    }

    private LocalDate parsearFecha(String fechaStr) {
        if (fechaStr == null || fechaStr.isBlank()) {
            return null;
        }
        String clean = fechaStr.trim();
        try {
            if (clean.matches("^\\d{4}-\\d{2}$")) {
                return java.time.YearMonth.parse(clean).atDay(1);
            } else if (clean.contains("/")) {
                return LocalDate.parse(clean, FORMATO_FECHA_ARG).withDayOfMonth(1);
            } else {
                return LocalDate.parse(clean, DateTimeFormatter.ISO_LOCAL_DATE).withDayOfMonth(1);
            }
        } catch (Exception e) {
            log.warn("No se pudo parsear la fecha: {}", fechaStr);
            return null;
        }
    }
}
