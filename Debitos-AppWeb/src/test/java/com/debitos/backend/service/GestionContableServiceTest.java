package com.debitos.backend.service;

import com.debitos.backend.dto.contable.CambiarAnulacionRequest;
import com.debitos.backend.dto.contable.CambiarEstadoPrestacionRequest;
import com.debitos.backend.dto.contable.CorregirPeriodoRequest;
import com.debitos.backend.dto.contable.FacturaAnuladaDTO;
import com.debitos.backend.dto.contable.FacturaPeriodoDTO;
import com.debitos.backend.dto.contable.PrestacionConsideracionDTO;
import com.debitos.backend.model.Cabecera;
import com.debitos.backend.model.CoberturaAlias;
import com.debitos.backend.model.FacturaAnuladaManual;
import com.debitos.backend.model.HistorialAjustesContabilidad;
import com.debitos.backend.model.PrestacionConsideracion;
import com.debitos.backend.repository.CabeceraRepository;
import com.debitos.backend.repository.CoberturaAliasRepository;
import com.debitos.backend.repository.FacturaAnuladaManualRepository;
import com.debitos.backend.repository.FacturaPeriodoCorregidoRepository;
import com.debitos.backend.repository.HistorialAjustesContabilidadRepository;
import com.debitos.backend.repository.PrestacionConsideracionRepository;
import com.debitos.backend.repository.TipoOperacionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GestionContableServiceTest {

    @Mock private TipoOperacionRepository tipoOperacionRepository;
    @Mock private HistorialAjustesContabilidadRepository historialRepository;
    @Mock private CoberturaAliasRepository coberturaAliasRepository;
    @Mock private FacturaPeriodoCorregidoRepository facturaPeriodoCorregidoRepository;
    @Mock private PrestacionConsideracionRepository prestacionConsideracionRepository;
    @Mock private FacturaAnuladaManualRepository facturaAnuladaManualRepository;
    @Mock private CabeceraRepository cabeceraRepository;
    @Mock private MaterializedViewRefreshService materializedViewRefreshService;

    @InjectMocks
    private GestionContableService service;

    @Test
    @DisplayName("Coberturas: ordena por nombreMostrar descendente con desempate por codigoCobertura")
    void testOrdenCoberturasValido() {
        Page<CoberturaAlias> emptyPage = new PageImpl<>(List.of());
        when(coberturaAliasRepository.findAll(any(Pageable.class))).thenReturn(emptyPage);

        service.buscarCoberturasPaginadas(null, 0, 20, "nombreMostrar", "desc");

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(coberturaAliasRepository).findAll(captor.capture());

        Sort sort = captor.getValue().getSort();
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("nombreMostrar").getDirection());
        assertEquals(Sort.Direction.ASC, sort.getOrderFor("codigoCobertura").getDirection());
    }

    @Test
    @DisplayName("Coberturas: columna inválida vuelve de forma segura al orden natural")
    void testOrdenCoberturasInvalidoFallback() {
        Page<CoberturaAlias> emptyPage = new PageImpl<>(List.of());
        when(coberturaAliasRepository.findAll(any(Pageable.class))).thenReturn(emptyPage);

        service.buscarCoberturasPaginadas("", 0, 20, "columnaInexistente", "desc");

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(coberturaAliasRepository).findAll(captor.capture());

        Sort sort = captor.getValue().getSort();
        assertNotNull(sort.getOrderFor("codigoCobertura"));
        assertEquals(Sort.Direction.ASC, sort.getOrderFor("codigoCobertura").getDirection());
    }

    @Test
    @DisplayName("Prestaciones: ordena por estado ascendente con desempate por codigo y filtra por estado")
    void testOrdenPrestaciones() {
        Page<PrestacionConsideracion> emptyPage = new PageImpl<>(List.of());
        when(prestacionConsideracionRepository.buscarConFiltro(anyString(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(emptyPage);

        service.buscarPrestaciones("cons", "No considerar", 0, 20, "estadoAmbulatorio", "asc");

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(prestacionConsideracionRepository).buscarConFiltro(eq("cons"), eq("No considerar"), eq(""), captor.capture());

        Sort sort = captor.getValue().getSort();
        assertEquals(Sort.Direction.ASC, sort.getOrderFor("estadoAmbulatorio").getDirection());
        assertEquals(Sort.Direction.ASC, sort.getOrderFor("codigo").getDirection());
    }

    @Test
    @DisplayName("Prestaciones: valor TODOS o vacío en estado normaliza a cadena vacía")
    void testEstadoTodosPrestaciones() {
        Page<PrestacionConsideracion> emptyPage = new PageImpl<>(List.of());
        when(prestacionConsideracionRepository.buscarConFiltro(anyString(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(emptyPage);

        service.buscarPrestaciones(null, "TODOS", 0, 20, null, null);

        verify(prestacionConsideracionRepository).buscarConFiltro(eq(""), eq(""), eq(""), any(Pageable.class));
    }

    @Test
    @DisplayName("Prestaciones: cambiar estado ambulatorio e internado actualiza y registra historial")
    void testCambiarEstadoPrestacionAmbulatorioInternado() {
        PrestacionConsideracion pc = new PrestacionConsideracion("420101", "CONSULTA", "Considerar", "Considerar");
        when(prestacionConsideracionRepository.findById("420101")).thenReturn(Optional.of(pc));

        CambiarEstadoPrestacionRequest req = new CambiarEstadoPrestacionRequest();
        req.setCodigo("420101");
        req.setEstadoAmbulatorio("No considerar");
        req.setEstadoInternado("Considerar");

        PrestacionConsideracionDTO resultado = service.cambiarEstadoPrestacion(req, "admin");

        assertNotNull(resultado);
        assertEquals("No considerar", resultado.getEstadoAmbulatorio());
        assertEquals("Considerar", resultado.getEstadoInternado());
        verify(prestacionConsideracionRepository).save(pc);
        verify(historialRepository).save(any(HistorialAjustesContabilidad.class));
    }

    @Test
    @DisplayName("Facturas Anuladas: comprobante ordena por tipo, letra, ptovta, numero")
    void testOrdenFacturasAnuladasComprobante() {
        Page<FacturaAnuladaManual> emptyPage = new PageImpl<>(List.of());
        when(facturaAnuladaManualRepository.findFacturasAnuladasConCabecera(eq(GestionContableService.PTO_VTA_PERMITIDOS), any(Pageable.class))).thenReturn(emptyPage);

        service.listarFacturasAnuladas(0, 20, "comprobante", "asc");

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(facturaAnuladaManualRepository).findFacturasAnuladasConCabecera(eq(GestionContableService.PTO_VTA_PERMITIDOS), captor.capture());

        Sort sort = captor.getValue().getSort();
        assertEquals(Sort.Direction.ASC, sort.getOrderFor("cabecera.tipo").getDirection());
        assertEquals(Sort.Direction.ASC, sort.getOrderFor("cabecera.letra").getDirection());
        assertEquals(Sort.Direction.ASC, sort.getOrderFor("cabecera.ptovta").getDirection());
        assertEquals(Sort.Direction.ASC, sort.getOrderFor("cabecera.numero").getDirection());
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("idCabecera").getDirection());
    }

    @Test
    @DisplayName("Historial: operacion ordena por tipoOperacion.descripcion con desempate por id")
    void testOrdenHistorialOperacion() {
        Page<HistorialAjustesContabilidad> emptyPage = new PageImpl<>(List.of());
        when(historialRepository.findAll(any(Pageable.class))).thenReturn(emptyPage);

        service.obtenerHistorial(null, 1, 20, "operacion", "asc");

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(historialRepository).findAll(captor.capture());

        assertEquals(1, captor.getValue().getPageNumber());
        Sort sort = captor.getValue().getSort();
        assertEquals(Sort.Direction.ASC, sort.getOrderFor("tipoOperacion.descripcion").getDirection());
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("id").getDirection());
    }

    @Test
    @DisplayName("cambiarEstadoAnulacionManual con documento anulador debe persistir idCabeceraAnulador y comprobanteAnulador")
    void testCambiarEstadoAnulacionConDocumentoAnulador() {
        Cabecera cab = new Cabecera();
        cab.setId(100L);
        cab.setAsociadogrupo(220587L);
        cab.setTipo("FC");
        cab.setLetra("A");
        cab.setPtovta(30);
        cab.setNumero(1001);
        cab.setComprobante("FC A 0030-00001001");

        Cabecera anulador = new Cabecera();
        anulador.setId(200L);
        anulador.setAsociadogrupo(220587L);
        anulador.setTipo("NCE");
        anulador.setLetra("A");
        anulador.setPtovta(31);
        anulador.setNumero(494);
        anulador.setComprobante("NCE A 0031-00000494");

        when(cabeceraRepository.findById(100L)).thenReturn(Optional.of(cab));
        when(cabeceraRepository.findById(200L)).thenReturn(Optional.of(anulador));
        when(facturaAnuladaManualRepository.findByIdCabecera(100L)).thenReturn(Optional.empty());
        when(facturaAnuladaManualRepository.findByIdCabecera(200L)).thenReturn(Optional.empty());

        CambiarAnulacionRequest req = new CambiarAnulacionRequest();
        req.setIdCabecera(100L);
        req.setAnulada(true);
        req.setIdCabeceraAnulador(200L);
        req.setComprobanteAnulador("NCE A 0031-00000494");

        FacturaAnuladaDTO dto = service.cambiarEstadoAnulacionManual(req, "testUser");

        ArgumentCaptor<FacturaAnuladaManual> captor = ArgumentCaptor.forClass(FacturaAnuladaManual.class);
        verify(facturaAnuladaManualRepository).save(captor.capture());

        FacturaAnuladaManual saved = captor.getValue();
        assertTrue(saved.getAnulada());
        assertEquals(200L, saved.getIdCabeceraAnulador());
        assertEquals("NCE A 0031-00000494", saved.getComprobanteAnulador());
        assertEquals("testUser", saved.getUsuario());

        assertEquals(200L, dto.getIdCabeceraAnulador());
        assertEquals("NCE A 0031-00000494", dto.getComprobanteAnulador());
        assertEquals(220587L, dto.getAsociadogrupo());
    }

    @Test
    @DisplayName("buscarFacturaParaAnulacion: Facturas (FAC, FC) obtienen su importe de la columna debe")
    void testBuscarFacturaParaAnulacion_Factura_UsaDebe() {
        Cabecera fac = new Cabecera();
        fac.setId(500L);
        fac.setTipo("FAC");
        fac.setLetra("A");
        fac.setPtovta(31);
        fac.setNumero(8983);
        fac.setComprobante("FAC A 0031-00008983");
        fac.setDebe(new BigDecimal("32147603.49"));
        fac.setHaber(BigDecimal.ZERO);

        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("FAC", "A", 31, 8983))
                .thenReturn(Optional.of(fac));
        when(facturaAnuladaManualRepository.findByIdCabecera(500L)).thenReturn(Optional.empty());

        FacturaAnuladaDTO dto = service.buscarFacturaParaAnulacion("FAC", "A", 31, 8983);

        assertNotNull(dto);
        assertEquals(new BigDecimal("32147603.49"), dto.getImporte());
    }

    @Test
    @DisplayName("buscarFacturaParaAnulacion: Notas de Crédito (NC, NCE) obtienen su importe de la columna haber")
    void testBuscarFacturaParaAnulacion_NotaCredito_UsaHaber() {
        Cabecera nc = new Cabecera();
        nc.setId(600L);
        nc.setTipo("NC");
        nc.setLetra("A");
        nc.setPtovta(31);
        nc.setNumero(1775);
        nc.setComprobante("NC A 0031-00001775");
        nc.setDebe(BigDecimal.ZERO);
        nc.setHaber(new BigDecimal("2624625.56"));

        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("NC", "A", 31, 1775))
                .thenReturn(Optional.of(nc));
        when(facturaAnuladaManualRepository.findByIdCabecera(600L)).thenReturn(Optional.empty());

        FacturaAnuladaDTO dto = service.buscarFacturaParaAnulacion("NC", "A", 31, 1775);

        assertNotNull(dto);
        assertEquals(new BigDecimal("2624625.56"), dto.getImporte());
    }

    @Test
    @DisplayName("buscarFacturaParaAnulacion: Notas de Débito (ND, NDE) obtienen su importe de la columna debe")
    void testBuscarFacturaParaAnulacion_NotaDebito_UsaDebe() {
        Cabecera nd = new Cabecera();
        nd.setId(700L);
        nd.setTipo("ND");
        nd.setLetra("A");
        nd.setPtovta(31);
        nd.setNumero(50);
        nd.setComprobante("ND A 0031-00000050");
        nd.setDebe(new BigDecimal("150000.00"));
        nd.setHaber(BigDecimal.ZERO);

        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("ND", "A", 31, 50))
                .thenReturn(Optional.of(nd));
        when(facturaAnuladaManualRepository.findByIdCabecera(700L)).thenReturn(Optional.empty());

        FacturaAnuladaDTO dto = service.buscarFacturaParaAnulacion("ND", "A", 31, 50);

        assertNotNull(dto);
        assertEquals(new BigDecimal("150000.00"), dto.getImporte());
    }

    @Test
    @DisplayName("buscarCandidatosAnuladorPorGrupo excluye origen, recibos/OP y ya anulados")
    void testBuscarCandidatosAnuladorPorGrupo_FiltraCorrectamente() {
        Cabecera origen = new Cabecera();
        origen.setId(8542L);
        origen.setAsociadogrupo(220587L);
        origen.setTipo("FAC");

        Cabecera ncValida = new Cabecera();
        ncValida.setId(8544L);
        ncValida.setAsociadogrupo(220587L);
        ncValida.setTipo("NC");
        ncValida.setLetra("A");
        ncValida.setPtovta(31);
        ncValida.setNumero(1775);
        ncValida.setComprobante("NC A0031-00001775");
        ncValida.setDebe(BigDecimal.ZERO);
        ncValida.setHaber(new BigDecimal("2624625.56"));

        Cabecera recibo = new Cabecera();
        recibo.setId(130947L);
        recibo.setAsociadogrupo(220587L);
        recibo.setTipo("RC");

        Cabecera ndYaAnulada = new Cabecera();
        ndYaAnulada.setId(8672L);
        ndYaAnulada.setAsociadogrupo(220587L);
        ndYaAnulada.setTipo("ND");

        when(cabeceraRepository.findById(8542L)).thenReturn(Optional.of(origen));
        when(cabeceraRepository.findByAsociadogrupoOrderByFechaDescIdDesc(220587L))
                .thenReturn(List.of(origen, ncValida, recibo, ndYaAnulada));
        when(facturaAnuladaManualRepository.findIdsCabeceraAnuladasEn(anyCollection()))
                .thenReturn(List.of(8672L));

        List<FacturaAnuladaDTO> candidatos = service.buscarCandidatosAnuladorPorGrupo(8542L);

        assertEquals(1, candidatos.size());
        assertEquals(8544L, candidatos.get(0).getIdCabecera());
        assertEquals(220587L, candidatos.get(0).getAsociadogrupo());
        assertEquals(new BigDecimal("2624625.56"), candidatos.get(0).getImporte());
    }

    @Test
    @DisplayName("buscarCandidatosAnuladorPorGrupo retorna lista vacía si origen no tiene asociadogrupo")
    void testBuscarCandidatosAnuladorPorGrupo_SinGrupo() {
        Cabecera origen = new Cabecera();
        origen.setId(100L);
        origen.setAsociadogrupo(null);

        when(cabeceraRepository.findById(100L)).thenReturn(Optional.of(origen));

        List<FacturaAnuladaDTO> candidatos = service.buscarCandidatosAnuladorPorGrupo(100L);
        assertTrue(candidatos.isEmpty());
    }

    @Test
    @DisplayName("cambiarEstadoAnulacionManual unifica asociadogrupo cuando el anulador tiene grupo distinto")
    void testCambiarEstadoAnulacionManual_UnificaDistintoGrupo() {
        Cabecera origen = new Cabecera();
        origen.setId(100L);
        origen.setAsociadogrupo(220587L);
        origen.setTipo("FAC");
        origen.setPtovta(30);

        Cabecera otroGrupo = new Cabecera();
        otroGrupo.setId(200L);
        otroGrupo.setAsociadogrupo(999999L);
        otroGrupo.setTipo("NC");
        otroGrupo.setPtovta(31);

        when(cabeceraRepository.findById(100L)).thenReturn(Optional.of(origen));
        when(cabeceraRepository.findById(200L)).thenReturn(Optional.of(otroGrupo));
        when(facturaAnuladaManualRepository.findByIdCabecera(100L)).thenReturn(Optional.empty());

        CambiarAnulacionRequest req = new CambiarAnulacionRequest();
        req.setIdCabecera(100L);
        req.setAnulada(true);
        req.setIdCabeceraAnulador(200L);

        FacturaAnuladaDTO res = service.cambiarEstadoAnulacionManual(req, "testUser");

        assertNotNull(res);
        assertEquals(220587L, otroGrupo.getAsociadogrupo());
        assertEquals(100L, otroGrupo.getAsociado());
        verify(cabeceraRepository).save(otroGrupo);
        verify(facturaAnuladaManualRepository).save(any(FacturaAnuladaManual.class));
    }

    @Test
    @DisplayName("cambiarEstadoAnulacionManual rechaza origen sin asociadogrupo, recibos o anulador ya anulado")
    void testCambiarEstadoAnulacionManual_ValidacionesAdicionales() {
        Cabecera sinGrupo = new Cabecera();
        sinGrupo.setId(100L);
        sinGrupo.setAsociadogrupo(null);
        sinGrupo.setPtovta(30);
        when(cabeceraRepository.findById(100L)).thenReturn(Optional.of(sinGrupo));
        when(facturaAnuladaManualRepository.findByIdCabecera(100L)).thenReturn(Optional.empty());

        CambiarAnulacionRequest reqSinGrupo = new CambiarAnulacionRequest();
        reqSinGrupo.setIdCabecera(100L);
        reqSinGrupo.setAnulada(true);
        reqSinGrupo.setIdCabeceraAnulador(200L);
        assertThrows(IllegalArgumentException.class, () -> service.cambiarEstadoAnulacionManual(reqSinGrupo, "testUser"));

        Cabecera origen = new Cabecera();
        origen.setId(100L);
        origen.setAsociadogrupo(220587L);
        origen.setPtovta(30);
        Cabecera recibo = new Cabecera();
        recibo.setId(300L);
        recibo.setAsociadogrupo(220587L);
        recibo.setTipo("RC");
        recibo.setPtovta(30);
        when(cabeceraRepository.findById(100L)).thenReturn(Optional.of(origen));
        when(cabeceraRepository.findById(300L)).thenReturn(Optional.of(recibo));

        CambiarAnulacionRequest reqRecibo = new CambiarAnulacionRequest();
        reqRecibo.setIdCabecera(100L);
        reqRecibo.setAnulada(true);
        reqRecibo.setIdCabeceraAnulador(300L);
        assertThrows(IllegalArgumentException.class, () -> service.cambiarEstadoAnulacionManual(reqRecibo, "testUser"));

        Cabecera ncAnulada = new Cabecera();
        ncAnulada.setId(400L);
        ncAnulada.setAsociadogrupo(220587L);
        ncAnulada.setTipo("NC");
        ncAnulada.setPtovta(31);
        FacturaAnuladaManual famAnulada = new FacturaAnuladaManual(ncAnulada, true);
        when(cabeceraRepository.findById(400L)).thenReturn(Optional.of(ncAnulada));
        when(facturaAnuladaManualRepository.findByIdCabecera(400L)).thenReturn(Optional.of(famAnulada));

        CambiarAnulacionRequest reqYaAnulada = new CambiarAnulacionRequest();
        reqYaAnulada.setIdCabecera(100L);
        reqYaAnulada.setAnulada(true);
        reqYaAnulada.setIdCabeceraAnulador(400L);
        assertThrows(IllegalArgumentException.class, () -> service.cambiarEstadoAnulacionManual(reqYaAnulada, "testUser"));
    }

    @Test
    @DisplayName("buscarFacturaParaAnulacion: rechaza puntos de venta no permitidos (ej: 1 o 56)")
    void testBuscarFacturaParaAnulacion_PuntoVentaNoPermitido() {
        assertNull(service.buscarFacturaParaAnulacion("FC", "A", 1, 100));
        assertNull(service.buscarFacturaParaAnulacion("FC", "A", 56, 100));
    }

    @Test
    @DisplayName("cambiarEstadoAnulacionManual: rechaza documento si punto de venta no es 30, 31, 32, 36 o 53")
    void testCambiarEstadoAnulacionManual_PtoVtaInvalido() {
        Cabecera cab = new Cabecera();
        cab.setId(800L);
        cab.setPtovta(1);

        when(cabeceraRepository.findById(800L)).thenReturn(Optional.of(cab));

        CambiarAnulacionRequest req = new CambiarAnulacionRequest();
        req.setIdCabecera(800L);
        req.setAnulada(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.cambiarEstadoAnulacionManual(req, "testUser"));
        assertTrue(ex.getMessage().contains("no pertenezca a los permitidos"));
    }

    @Test
    @DisplayName("guardarPeriodoCorregido: fuerza siempre el primer día del mes para YYYY-MM, YYYY-MM-DD y DD/MM/YYYY")
    void testGuardarPeriodoCorregido_FuerzaPrimerDiaDelMes() {
        Cabecera cab = new Cabecera();
        cab.setId(900L);
        cab.setPtovta(30);
        cab.setTipo("FC");
        cab.setLetra("A");
        cab.setNumero(1234);
        cab.setPeriodo(LocalDate.of(2026, 3, 1));

        when(cabeceraRepository.findById(900L)).thenReturn(Optional.of(cab));
        when(facturaPeriodoCorregidoRepository.findByIdCabecera(900L)).thenReturn(Optional.empty());

        // Caso 1: YYYY-MM
        CorregirPeriodoRequest reqYM = new CorregirPeriodoRequest();
        reqYM.setIdCabecera(900L);
        reqYM.setPeriodoCorregido("2026-04");

        FacturaPeriodoDTO dtoYM = service.guardarPeriodoCorregido(reqYM, "testUser");
        assertEquals(LocalDate.of(2026, 4, 1), dtoYM.getPeriodoCorregido());

        // Caso 2: YYYY-MM-DD con día distinto de 1
        CorregirPeriodoRequest reqYMD = new CorregirPeriodoRequest();
        reqYMD.setIdCabecera(900L);
        reqYMD.setPeriodoCorregido("2026-05-18");

        FacturaPeriodoDTO dtoYMD = service.guardarPeriodoCorregido(reqYMD, "testUser");
        assertEquals(LocalDate.of(2026, 5, 1), dtoYMD.getPeriodoCorregido());

        // Caso 3: DD/MM/YYYY con día distinto de 1
        CorregirPeriodoRequest reqDMY = new CorregirPeriodoRequest();
        reqDMY.setIdCabecera(900L);
        reqDMY.setPeriodoCorregido("25/06/2026");

        FacturaPeriodoDTO dtoDMY = service.guardarPeriodoCorregido(reqDMY, "testUser");
        assertEquals(LocalDate.of(2026, 6, 1), dtoDMY.getPeriodoCorregido());
    }
}
