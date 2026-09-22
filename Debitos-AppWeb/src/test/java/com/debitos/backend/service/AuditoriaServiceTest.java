package com.debitos.backend.service;

import com.debitos.backend.dto.*;
import com.debitos.backend.model.*;
import com.debitos.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditoriaServiceTest {

    @Mock
    private CabeceraRepository cabeceraRepository;

    @Mock
    private AmbLiquidadoRepository ambLiquidadoRepository;

    @Mock
    private NotaDeCreditoRepository notaDeCreditoRepository;

    @Mock
    private NotaDeDebitoRepository notaDeDebitoRepository;

    @Mock
    private NcAjusteDeIvaRepository ncAjusteDeIvaRepository;

    @Mock
    private NdAjusteDeIvaRepository ndAjusteDeIvaRepository;

    @Mock
    private RegistroUsabilidadRepository registroUsabilidadRepository;

    @Mock
    private RegistroImputacionRepository registroImputacionRepository;

    @Mock
    private NotificacionService notificacionService;

    @InjectMocks
    private AuditoriaService auditoriaService;

    private Cabecera cabeceraFC;
    private Cabecera cabeceraNC;
    private Cabecera cabeceraND;

    @BeforeEach
    void setUp() {
        cabeceraFC = new Cabecera();
        cabeceraFC.setId(100L);
        cabeceraFC.setTipo("FC");
        cabeceraFC.setLetra("A");
        cabeceraFC.setPtovta(1);
        cabeceraFC.setNumero(1000);
        cabeceraFC.setGrupo(50L);
        cabeceraFC.setAsociadogrupo(50L);
        cabeceraFC.setIdEstado(1);
        cabeceraFC.setFecha(LocalDate.of(2026, 1, 15));
        cabeceraFC.setTiporegistro("AUDITADA");

        cabeceraNC = new Cabecera();
        cabeceraNC.setId(101L);
        cabeceraNC.setTipo("NC");
        cabeceraNC.setLetra("A");
        cabeceraNC.setPtovta(1);
        cabeceraNC.setNumero(2000);
        cabeceraNC.setGrupo(50L);
        cabeceraNC.setAsociadogrupo(50L);
        cabeceraNC.setAsociado(100L);
        cabeceraNC.setIdEstado(1);
        cabeceraNC.setFecha(LocalDate.of(2026, 2, 10));

        cabeceraND = new Cabecera();
        cabeceraND.setId(102L);
        cabeceraND.setTipo("ND");
        cabeceraND.setLetra("A");
        cabeceraND.setPtovta(1);
        cabeceraND.setNumero(3000);
        cabeceraND.setGrupo(50L);
        cabeceraND.setAsociadogrupo(50L);
        cabeceraND.setAsociado(101L);
        cabeceraND.setIdEstado(1);
        cabeceraND.setFecha(LocalDate.of(2026, 3, 5));
    }

    // ==========================================
    // 1. RESOLVER TIPOS EQUIVALENTES Y TIPO REGISTRO
    // ==========================================
    @Test
    @DisplayName("Resolver tipos equivalentes")
    void testResolverTiposEquivalentes() {
        assertTrue(AuditoriaService.resolverTiposEquivalentes(null).isEmpty());
        assertTrue(AuditoriaService.resolverTiposEquivalentes("").isEmpty());
        assertEquals(List.of("FC", "FAC", "FCE", "FCA", "FCB"), AuditoriaService.resolverTiposEquivalentes("FC"));
        assertEquals(List.of("FC", "FAC", "FCE", "FCA", "FCB"), AuditoriaService.resolverTiposEquivalentes("FCE"));
        assertEquals(List.of("NC", "NCE"), AuditoriaService.resolverTiposEquivalentes("NC"));
        assertEquals(List.of("NC", "NCE"), AuditoriaService.resolverTiposEquivalentes("NCE"));
        assertEquals(List.of("ND", "NDE"), AuditoriaService.resolverTiposEquivalentes("ND"));
        assertEquals(List.of("ND", "NDE"), AuditoriaService.resolverTiposEquivalentes("NDE"));
        assertEquals(List.of("RC", "REC"), AuditoriaService.resolverTiposEquivalentes("RC"));
    }

    @Test
    @DisplayName("Obtener tipo de registro")
    void testObtenerTipoRegistro() {
        assertNull(auditoriaService.obtenerTipoRegistro(null, "A", 1, 1000));
        assertNull(auditoriaService.obtenerTipoRegistro("", "A", 1, 1000));

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyCollection(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFC));

        String tipoReg = auditoriaService.obtenerTipoRegistro("FC", "A", 1, 1000);
        assertEquals("AUDITADA", tipoReg);
    }

    @Test
    @DisplayName("Obtener prestaciones según tipo de comprobante")
    void testObtenerPrestacionesSegunTipo() {
        when(ambLiquidadoRepository.findPrestacionesPorFactura(any(), eq("A"), eq(1), eq(1000))).thenReturn(List.of(mock(PrestacionAuditoriaDTO.class)));
        when(notaDeCreditoRepository.findPrestacionesPorNotaCredito(any(), eq("A"), eq(1), eq(2000))).thenReturn(List.of(mock(PrestacionAuditoriaDTO.class)));
        when(notaDeDebitoRepository.findPrestacionesPorNotaDebito(any(), eq("A"), eq(1), eq(3000))).thenReturn(List.of(mock(PrestacionAuditoriaDTO.class)));

        assertEquals(1, auditoriaService.obtenerPrestaciones("FC", "A", 1, 1000).size());
        assertEquals(1, auditoriaService.obtenerPrestaciones("NC", "A", 1, 2000).size());
        assertEquals(1, auditoriaService.obtenerPrestaciones("ND", "A", 1, 3000).size());
        assertThrows(IllegalArgumentException.class, () -> auditoriaService.obtenerPrestaciones("INVALIDO", "A", 1, 100));
    }

    // ==========================================
    // 2. BÚSQUEDA UNIFICADA (RC, NC, ND, FC, Ajuste IVA)
    // ==========================================
    @Test
    @DisplayName("Búsqueda unificada - Recibo RC existente")
    void testBuscarUnificadoRcExistente() {
        Cabecera rc = new Cabecera();
        rc.setTipo("RC");
        rc.setNumero(555);
        when(cabeceraRepository.findByTipoRcAndNumero(555)).thenReturn(List.of(rc));

        ResultadoBusquedaDTO resultado = auditoriaService.buscarUnificado("RC", null, null, 555);

        assertNotNull(resultado);
        assertEquals("ESTANDAR", resultado.getTipoVista());
        assertTrue(resultado.getPrestaciones().isEmpty());
    }

    @Test
    @DisplayName("Búsqueda unificada - Recibo RC inexistente retorna null")
    void testBuscarUnificadoRcInexistente() {
        when(cabeceraRepository.findByTipoRcAndNumero(999)).thenReturn(List.of());

        ResultadoBusquedaDTO resultado = auditoriaService.buscarUnificado("RC", null, null, 999);
        assertNull(resultado);
    }

    @Test
    @DisplayName("Búsqueda unificada - NC encontrada en nc_ajustedeiva")
    void testBuscarUnificadoNcAjusteIva() {
        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyCollection(), eq("A"), eq(1), eq(2000)))
                .thenReturn(List.of());

        NcAjusteDeIva ncIva = new NcAjusteDeIva();
        ncIva.setTipoFc("FC");
        ncIva.setLetraFc("A");
        ncIva.setPtovtaFc(1);
        ncIva.setNumeroFc(1000);
        ncIva.setNeto(new BigDecimal("1000"));
        ncIva.setPorcIva(new BigDecimal("21"));
        ncIva.setIva(new BigDecimal("210"));
        ncIva.setCabecera(cabeceraNC);

        when(ncAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc("A", 1, 2000))
                .thenReturn(Optional.of(ncIva));

        Object[] row = new Object[]{"2026-01", "1000.00", "210.00"};
        when(ambLiquidadoRepository.findTotalesFacturaMadre("A", 1, 1000))
                .thenReturn(new Object[][]{row});

        when(ndAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc("A", 1, 2000))
                .thenReturn(Optional.empty());

        ResultadoBusquedaDTO resultado = auditoriaService.buscarUnificado("NC", "A", 1, 2000);

        assertNotNull(resultado);
        assertEquals("TABLA_AJUSTE_IVA", resultado.getTipoVista());
        assertNotNull(resultado.getResumenAjusteIva());
        assertEquals(3, resultado.getResumenAjusteIva().size());
    }

    @Test
    @DisplayName("Búsqueda unificada - NC encontrada en notadecredito")
    void testBuscarUnificadoNcEnNotaDeCredito() {
        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyCollection(), eq("A"), eq(1), eq(2000)))
                .thenReturn(List.of(cabeceraNC));

        PrestacionAuditoriaDTO dto = mock(PrestacionAuditoriaDTO.class);
        when(notaDeCreditoRepository.findPrestacionesPorNotaCredito(any(), eq("A"), eq(1), eq(2000))).thenReturn(List.of(dto));

        ResultadoBusquedaDTO resultado = auditoriaService.buscarUnificado("NC", "A", 1, 2000);
        assertNotNull(resultado);
        assertEquals("ESTANDAR", resultado.getTipoVista());
        assertEquals(1, resultado.getPrestaciones().size());
    }

    @Test
    @DisplayName("Búsqueda unificada - ND encontrada en notadedebito")
    void testBuscarUnificadoNdEnNotaDeDebito() {
        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyCollection(), eq("A"), eq(1), eq(3000)))
                .thenReturn(List.of(cabeceraND));

        PrestacionAuditoriaDTO dto = mock(PrestacionAuditoriaDTO.class);
        when(notaDeDebitoRepository.findPrestacionesPorNotaDebito(any(), eq("A"), eq(1), eq(3000))).thenReturn(List.of(dto));

        ResultadoBusquedaDTO resultado = auditoriaService.buscarUnificado("ND", "A", 1, 3000);
        assertNotNull(resultado);
        assertEquals("ESTANDAR", resultado.getTipoVista());
        assertEquals(1, resultado.getPrestaciones().size());
    }

    @Test
    @DisplayName("Búsqueda unificada - ND encontrada en nd_ajustedeiva con NC padre")
    void testBuscarUnificadoNdEnNdAjusteIvaConNcPadre() {
        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyCollection(), eq("A"), eq(1), eq(3000)))
                .thenReturn(List.of());

        NdAjusteDeIva ndIva = new NdAjusteDeIva();
        ndIva.setTipoNc("NC");
        ndIva.setLetraNc("A");
        ndIva.setPtovtaNc(1);
        ndIva.setNumeroNc(2000);
        ndIva.setNeto(new BigDecimal("800"));
        ndIva.setPorcIva(new BigDecimal("21"));
        ndIva.setIva(new BigDecimal("168"));
        ndIva.setCabecera(cabeceraND);

        NcAjusteDeIva ncIva = new NcAjusteDeIva();
        ncIva.setTipoFc("FC");
        ncIva.setLetraFc("A");
        ncIva.setPtovtaFc(1);
        ncIva.setNumeroFc(1000);
        ncIva.setNeto(new BigDecimal("1000"));
        ncIva.setPorcIva(new BigDecimal("21"));
        ncIva.setIva(new BigDecimal("210"));
        ncIva.setCabecera(cabeceraNC);

        when(ndAjusteDeIvaRepository.findByLetraNdAndPtovtaNdAndNumeroNd("A", 1, 3000))
                .thenReturn(Optional.of(ndIva));
        when(ncAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc("A", 1, 2000))
                .thenReturn(Optional.of(ncIva));
        when(ambLiquidadoRepository.findTotalesFacturaMadre("A", 1, 1000))
                .thenReturn(new Object[][]{new Object[]{"2026-01", "1000.00", "210.00"}});
        when(ndAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc("A", 1, 2000))
                .thenReturn(Optional.of(ndIva));

        ResultadoBusquedaDTO resultado = auditoriaService.buscarUnificado("ND", "A", 1, 3000);
        assertNotNull(resultado);
        assertEquals("TABLA_AJUSTE_IVA", resultado.getTipoVista());
        assertEquals(3, resultado.getResumenAjusteIva().size());
    }

    @Test
    @DisplayName("Búsqueda unificada - ND en nd_ajustedeiva sin NC padre")
    void testBuscarUnificadoNdEnNdAjusteIvaSinNcPadre() {
        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyCollection(), eq("A"), eq(1), eq(3000)))
                .thenReturn(List.of());

        NdAjusteDeIva ndIva = new NdAjusteDeIva();
        ndIva.setTipoNc("NC");
        ndIva.setLetraNc("A");
        ndIva.setPtovtaNc(1);
        ndIva.setNumeroNc(2000);
        ndIva.setNeto(new BigDecimal("800"));
        ndIva.setPorcIva(new BigDecimal("21"));
        ndIva.setIva(new BigDecimal("168"));
        ndIva.setCabecera(cabeceraND);

        when(ndAjusteDeIvaRepository.findByLetraNdAndPtovtaNdAndNumeroNd("A", 1, 3000))
                .thenReturn(Optional.of(ndIva));
        when(ncAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc("A", 1, 2000))
                .thenReturn(Optional.empty());

        ResultadoBusquedaDTO resultado = auditoriaService.buscarUnificado("ND", "A", 1, 3000);
        assertNotNull(resultado);
        assertEquals("TABLA_AJUSTE_IVA", resultado.getTipoVista());
        assertEquals(3, resultado.getResumenAjusteIva().size());
    }

    @Test
    @DisplayName("Búsqueda unificada - Factura FC existente")
    void testBuscarUnificadoFacturaExistente() {
        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyCollection(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFC));

        PrestacionAuditoriaDTO p1 = mock(PrestacionAuditoriaDTO.class);
        when(ambLiquidadoRepository.findPrestacionesPorFactura(any(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(p1));

        ResultadoBusquedaDTO resultado = auditoriaService.buscarUnificado("FC", "A", 1, 1000);

        assertNotNull(resultado);
        assertEquals("ESTANDAR", resultado.getTipoVista());
        assertEquals(1, resultado.getPrestaciones().size());
    }

    @Test
    @DisplayName("Búsqueda unificada - Factura FC inexistente retorna null")
    void testBuscarUnificadoFacturaInexistente() {
        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyCollection(), eq("A"), eq(1), eq(9999)))
                .thenReturn(List.of());

        ResultadoBusquedaDTO resultado = auditoriaService.buscarUnificado("FC", "A", 1, 9999);
        assertNull(resultado);
    }

    // ==========================================
    // 3. GUARDADO PARCIAL (FC, NC, ND)
    // ==========================================
    @Test
    @DisplayName("Guardado Parcial - Documento origen nulo o registros vacíos")
    void testProcesarGuardadoParcialNuloOVacio() {
        auditoriaService.procesarGuardadoParcial(null);

        GuardarParcialRequest req = new GuardarParcialRequest();
        req.setRegistros(List.of());
        auditoriaService.procesarGuardadoParcial(req);

        verify(notaDeCreditoRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("Guardado Parcial - Documento origen FC")
    void testProcesarGuardadoParcialOrigenFC() {
        AmbLiquidado amb = new AmbLiquidado();
        amb.setId(1);
        amb.setCabecera(cabeceraFC);

        when(ambLiquidadoRepository.findAllById(List.of(1))).thenReturn(List.of(amb));
        when(notaDeCreditoRepository.findByPrestacionIdAndNotaDeDebitoPadreIsNull(1)).thenReturn(Optional.empty());

        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(1);
        reg.setMotivoDebito("Documentación faltante");
        reg.setImporteDebitado(new BigDecimal("150.00"));
        reg.setDebitoAceptado("SI");
        reg.setDiasFacturados(2);
        reg.setPrestacionEnglobante("ENG1");

        GuardarParcialRequest request = new GuardarParcialRequest();
        request.setDocumentoOrigen("FC");
        request.setLetra("A");
        request.setPtovta(1);
        request.setNumero(1000);
        request.setUsuario("auditorFC");
        request.setRegistros(List.of(reg));

        auditoriaService.procesarGuardadoParcial(request);

        verify(notaDeCreditoRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("Guardado Parcial - Documento origen NC con NC padre")
    void testProcesarGuardadoParcialOrigenNC() {
        AmbLiquidado amb = new AmbLiquidado();
        amb.setId(2);
        amb.setCabecera(cabeceraFC);

        when(ambLiquidadoRepository.findAllById(List.of(2))).thenReturn(List.of(amb));

        NotaDeCredito ncPadre = new NotaDeCredito();
        ncPadre.setId(50);
        when(notaDeCreditoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionId("A", 1, 2000, 2))
                .thenReturn(Optional.of(ncPadre));
        when(notaDeDebitoRepository.findByNotaDeCreditoPadreId(50)).thenReturn(Optional.empty());

        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(2);
        reg.setMotivoRefactura("Reclamado");
        reg.setImporteRefactura(new BigDecimal("500.00"));
        reg.setComentarios("Comentario ND");
        reg.setDiasFacturados(5);

        GuardarParcialRequest request = new GuardarParcialRequest();
        request.setDocumentoOrigen("NC");
        request.setLetra("A");
        request.setPtovta(1);
        request.setNumero(2000);
        request.setUsuario("auditorNC");
        request.setRegistros(List.of(reg));

        auditoriaService.procesarGuardadoParcial(request);

        verify(notaDeDebitoRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("Guardado Parcial - Documento origen ND con ND padre")
    void testProcesarGuardadoParcialOrigenND() {
        AmbLiquidado amb = new AmbLiquidado();
        amb.setId(3);
        amb.setCabecera(cabeceraFC);

        when(ambLiquidadoRepository.findAllById(List.of(3))).thenReturn(List.of(amb));

        NotaDeDebito ndPadre = new NotaDeDebito();
        ndPadre.setId(60);
        when(notaDeDebitoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionId("A", 1, 3000, 3))
                .thenReturn(Optional.of(ndPadre));
        when(notaDeCreditoRepository.findByNotaDeDebitoPadreId(60)).thenReturn(Optional.empty());

        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(3);
        reg.setMotivoDebito("Débito final");
        reg.setImporteDebitado(new BigDecimal("300.00"));
        reg.setDebitoAceptado(true);

        GuardarParcialRequest request = new GuardarParcialRequest();
        request.setDocumentoOrigen("ND");
        request.setLetra("A");
        request.setPtovta(1);
        request.setNumero(3000);
        request.setUsuario("auditorND");
        request.setRegistros(List.of(reg));

        auditoriaService.procesarGuardadoParcial(request);

        verify(notaDeCreditoRepository, times(1)).saveAll(anyList());
    }

    // ==========================================
    // 4. NUEVA NOTA DE CRÉDITO Y AJUSTE DE IVA
    // ==========================================
    @Test
    @DisplayName("Nueva Nota de Crédito - Por ajuste de IVA no prestacional")
    void testProcesarNuevaNotaCreditoAjusteIva() {
        NuevaNotaCreditoRequest req = new NuevaNotaCreditoRequest();
        req.setOrigen("FC");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(1000);
        req.setUsuario("auditor");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("NC");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(2000);
        datos.setFecha("2026-02-15");
        datos.setTipoNc("Por ajuste de IVA");
        datos.setSubtipoIva("No prestacional");
        datos.setNeto(new BigDecimal("1000.00"));
        datos.setPorcIva(new BigDecimal("21.00"));
        datos.setIva(new BigDecimal("210.00"));
        req.setDatosNota(datos);

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFC));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("NC", "A", 1, 2000))
                .thenReturn(Optional.empty());

        auditoriaService.procesarNuevaNotaCredito(req);

        verify(cabeceraRepository, times(1)).save(any(Cabecera.class));
        verify(ncAjusteDeIvaRepository, times(1)).save(any(NcAjusteDeIva.class));
    }

    @Test
    @DisplayName("Nueva Nota de Crédito - Por ajuste de IVA con valores nulos lanza excepción")
    void testProcesarNuevaNotaCreditoAjusteIvaValoresNulos() {
        NuevaNotaCreditoRequest req = new NuevaNotaCreditoRequest();
        req.setOrigen("FC");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(1000);
        req.setUsuario("auditor");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("NC");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(2000);
        datos.setTipoNc("Por ajuste de IVA");
        datos.setSubtipoIva("No prestacional");
        req.setDatosNota(datos);

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFC));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("NC", "A", 1, 2000))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> auditoriaService.procesarNuevaNotaCredito(req));
    }

    @Test
    @DisplayName("Nueva Nota de Crédito - Refactura con prestaciones")
    void testProcesarNuevaNotaCreditoRefactura() {
        NuevaNotaCreditoRequest req = new NuevaNotaCreditoRequest();
        req.setOrigen("FC");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(1000);
        req.setUsuario("auditor");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("NC");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(2000);
        datos.setFecha("2026-02-15");
        datos.setTipoNc("Refactura");
        req.setDatosNota(datos);

        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(10);
        reg.setMotivoDebito("Falta firma");
        reg.setImporteDebitado(new BigDecimal("200.00"));
        reg.setDebitoAceptado("SI");
        req.setRegistros(List.of(reg));

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFC));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("NC", "A", 1, 2000))
                .thenReturn(Optional.empty());

        AmbLiquidado amb = new AmbLiquidado();
        amb.setId(10);
        amb.setCabecera(cabeceraFC);
        amb.setTotalNeto(new BigDecimal("1000.00"));
        amb.setIva(new BigDecimal("210.00"));
        when(ambLiquidadoRepository.findAllById(List.of(10))).thenReturn(List.of(amb));
        when(notaDeCreditoRepository.findByPrestacionIdAndNotaDeDebitoPadreIsNull(10)).thenReturn(Optional.empty());

        auditoriaService.procesarNuevaNotaCredito(req);

        verify(cabeceraRepository, times(1)).save(any(Cabecera.class));
        verify(notaDeCreditoRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("Nueva Nota de Crédito - A partir de ND con ND padre por ajuste de IVA lanza excepción")
    void testProcesarNuevaNotaCreditoOrigenNdErrorSiAjusteIva() {
        NuevaNotaCreditoRequest req = new NuevaNotaCreditoRequest();
        req.setOrigen("ND");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(3000);
        req.setUsuario("auditor");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("NC");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(2000);
        datos.setTipoNc("Refactura");
        req.setDatosNota(datos);

        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(15);
        reg.setMotivoDebito("Falta firma");
        reg.setImporteDebitado(new BigDecimal("200.00"));
        req.setRegistros(List.of(reg));

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(3000)))
                .thenReturn(List.of(cabeceraND));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("NC", "A", 1, 2000))
                .thenReturn(Optional.empty());

        AmbLiquidado amb = new AmbLiquidado();
        amb.setId(15);
        when(ambLiquidadoRepository.findAllById(List.of(15))).thenReturn(List.of(amb));

        NotaDeDebito ndPadre = new NotaDeDebito();
        ndPadre.setId(77);
        ndPadre.setMotivorefactura("Por ajuste de IVA");
        when(notaDeDebitoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionId("A", 1, 3000, 15))
                .thenReturn(Optional.of(ndPadre));

        assertThrows(IllegalArgumentException.class, () -> auditoriaService.procesarNuevaNotaCredito(req));
    }

    @Test
    @DisplayName("Editar NC por Ajuste de IVA exitosa")
    void testEditarNcAjusteDeIvaExitoso() {
        NuevaNotaCreditoRequest req = new NuevaNotaCreditoRequest();
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(2000);

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("NC");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(2000);
        datos.setNeto(new BigDecimal("1500.00"));
        datos.setPorcIva(new BigDecimal("21.00"));
        datos.setIva(new BigDecimal("315.00"));
        req.setDatosNota(datos);

        NcAjusteDeIva ncIva = new NcAjusteDeIva();
        ncIva.setNeto(new BigDecimal("1000.00"));
        when(ncAjusteDeIvaRepository.findByLetraFcAndPtovtaFcAndNumeroFc("A", 1, 2000))
                .thenReturn(Optional.of(ncIva));

        auditoriaService.editarNcAjusteDeIva(req);

        assertEquals(new BigDecimal("1500.00"), ncIva.getNeto());
        assertEquals(new BigDecimal("315.00"), ncIva.getIva());
        verify(ncAjusteDeIvaRepository, times(1)).save(ncIva);
    }

    @Test
    @DisplayName("Editar NC por Ajuste de IVA no encontrada lanza excepción")
    void testEditarNcAjusteDeIvaNoEncontrada() {
        NuevaNotaCreditoRequest req = new NuevaNotaCreditoRequest();
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(9999);
        req.setDatosNota(new DatosNotaDTO());

        when(ncAjusteDeIvaRepository.findByLetraFcAndPtovtaFcAndNumeroFc("A", 1, 9999))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> auditoriaService.editarNcAjusteDeIva(req));
    }

    @Test
    @DisplayName("Editar NC por Ajuste de IVA con colisión lanza excepción")
    void testEditarNcAjusteDeIvaColision() {
        NuevaNotaCreditoRequest req = new NuevaNotaCreditoRequest();
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(2000);

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("NC");
        datos.setLetra("B");
        datos.setPuntoVenta(2);
        datos.setNumero(2005);
        req.setDatosNota(datos);

        NcAjusteDeIva ncIva = new NcAjusteDeIva();
        ncIva.setCabecera(cabeceraNC);
        when(ncAjusteDeIvaRepository.findByLetraFcAndPtovtaFcAndNumeroFc("A", 1, 2000))
                .thenReturn(Optional.of(ncIva));
        when(cabeceraRepository.existsByTipoAndLetraAndPtovtaAndNumero("NC", "B", 2, 2005))
                .thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> auditoriaService.editarNcAjusteDeIva(req));
    }

    // ==========================================
    // 5. NUEVA NOTA DE DÉBITO Y AJUSTE DE IVA
    // ==========================================
    @Test
    @DisplayName("Nueva Nota de Débito - Refactura exitosa")
    void testProcesarNuevaNotaDebitoRefactura() {
        NuevaNotaDebitoRequest req = new NuevaNotaDebitoRequest();
        req.setOrigen("NC");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(2000);
        req.setUsuario("auditor");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("ND");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(3000);
        datos.setFecha("2026-03-01");
        datos.setTipoNd("Por Refactura");
        req.setDatosNota(datos);

        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(5);
        reg.setMotivoRefactura("Refactura autorizada");
        reg.setImporteRefactura(new BigDecimal("800.00"));
        req.setRegistros(List.of(reg));

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(2000)))
                .thenReturn(List.of(cabeceraNC));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("ND", "A", 1, 3000))
                .thenReturn(Optional.empty());

        AmbLiquidado amb = new AmbLiquidado();
        amb.setId(5);
        amb.setCabecera(cabeceraFC);
        amb.setTotalNeto(new BigDecimal("1000.00"));
        amb.setIva(new BigDecimal("210.00"));
        when(ambLiquidadoRepository.findAllById(List.of(5))).thenReturn(List.of(amb));

        NotaDeCredito ncPadre = new NotaDeCredito();
        ncPadre.setId(88);
        when(notaDeCreditoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionId("A", 1, 2000, 5))
                .thenReturn(Optional.of(ncPadre));
        when(notaDeDebitoRepository.existsByNotaDeCreditoPadreIdAndTipoNd(88, "Por Refactura")).thenReturn(false);

        auditoriaService.procesarNuevaNotaDebito(req);

        verify(cabeceraRepository, times(1)).save(any(Cabecera.class));
        verify(notaDeDebitoRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("Nueva Nota de Débito - Por ajuste de IVA importe inválido lanza excepción")
    void testProcesarNuevaNotaDebitoPorAjusteIvaImporteInvalido() {
        NuevaNotaDebitoRequest req = new NuevaNotaDebitoRequest();
        req.setOrigen("NC");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(2000);
        req.setUsuario("auditor");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("ND");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(3000);
        datos.setTipoNd("Por ajuste de IVA");
        datos.setImporteRefactura(BigDecimal.ZERO);
        req.setDatosNota(datos);

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(2000)))
                .thenReturn(List.of(cabeceraNC));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("ND", "A", 1, 3000))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> auditoriaService.procesarNuevaNotaDebito(req));
    }

    @Test
    @DisplayName("Nueva Nota de Débito - Por ajuste de IVA duplicada lanza excepción")
    void testProcesarNuevaNotaDebitoPorAjusteIvaDuplicada() {
        NuevaNotaDebitoRequest req = new NuevaNotaDebitoRequest();
        req.setOrigen("NC");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(2000);
        req.setUsuario("auditor");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("ND");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(3000);
        datos.setTipoNd("Por ajuste de IVA");
        datos.setImporteRefactura(new BigDecimal("500.00"));
        req.setDatosNota(datos);

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(2000)))
                .thenReturn(List.of(cabeceraNC));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("ND", "A", 1, 3000))
                .thenReturn(Optional.empty());
        when(notaDeDebitoRepository.existsByTiporegistroAndTipoNd(any(), eq("Por ajuste de IVA"))).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> auditoriaService.procesarNuevaNotaDebito(req));
    }

    @Test
    @DisplayName("Nueva Nota de Débito - Por Ajuste de IVA exitosa")
    void testProcesarNuevaNotaDebitoAjusteIva() {
        NuevaNotaDebitoAjusteIvaRequest req = new NuevaNotaDebitoAjusteIvaRequest();
        req.setTipoNd("ND");
        req.setLetraNd("A");
        req.setPtovtaNd(1);
        req.setNumeroNd(3000);
        req.setFecha("2026-03-01");
        req.setTipoNc("NC");
        req.setLetraNc("A");
        req.setPtovtaNc(1);
        req.setNumeroNc(2000);
        req.setNeto(new BigDecimal("1000.00"));
        req.setPorcIva(new BigDecimal("21.00"));
        req.setIva(new BigDecimal("210.00"));
        req.setUsuario("auditor");

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(2000)))
                .thenReturn(List.of(cabeceraNC));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("ND", "A", 1, 3000))
                .thenReturn(Optional.empty());

        auditoriaService.procesarNuevaNotaDebitoAjusteIva(req);

        verify(cabeceraRepository, times(1)).save(any(Cabecera.class));
        verify(ndAjusteDeIvaRepository, times(1)).save(any(NdAjusteDeIva.class));
    }

    @Test
    @DisplayName("Nueva Nota de Débito - Por Ajuste de IVA valores nulos lanza excepción")
    void testProcesarNuevaNotaDebitoAjusteIvaValoresNulos() {
        NuevaNotaDebitoAjusteIvaRequest req = new NuevaNotaDebitoAjusteIvaRequest();
        req.setTipoNd("ND");
        req.setLetraNd("A");
        req.setPtovtaNd(1);
        req.setNumeroNd(3000);

        assertThrows(IllegalArgumentException.class, () -> auditoriaService.procesarNuevaNotaDebitoAjusteIva(req));
    }

    // ==========================================
    // 6. CABECERAS DISPONIBLES Y DOCUMENTOS ASOCIADOS
    // ==========================================
    @Test
    @DisplayName("Obtener cabeceras disponibles - Varios filtros")
    void testObtenerCabecerasDisponibles() {
        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFC));
        when(cabeceraRepository.findCandidatosPorTipoYGrupos(anyCollection(), anyCollection()))
                .thenReturn(List.of(cabeceraNC));

        List<CabeceraCandidataDTO> candidatos = auditoriaService.obtenerCabecerasDisponibles("NC", "FC", "A", 1, 1000);

        assertNotNull(candidatos);
        assertEquals(1, candidatos.size());
        assertEquals("NC", candidatos.get(0).getTipo());
    }

    @Test
    @DisplayName("Obtener cabeceras disponibles - Sin parámetros busca Top 50")
    void testObtenerCabecerasDisponiblesSinParametros() {
        when(cabeceraRepository.findTop50ByTipoInOrderByFechaDescNumeroDesc(anyList()))
                .thenReturn(List.of(cabeceraNC));

        List<CabeceraCandidataDTO> candidatos = auditoriaService.obtenerCabecerasDisponibles("NC", null, null, null, null);

        assertNotNull(candidatos);
        assertEquals(1, candidatos.size());
    }

    @Test
    @DisplayName("Obtener documento asociado para NC")
    void testObtenerDocumentoAsociadoParaNC() {
        when(notaDeCreditoRepository.findDocumentoAsociadoPadreRaw("A", 1, 2000))
                .thenReturn(List.<Object[]>of(new Object[]{"FC", "A", 1, 1000, java.sql.Date.valueOf("2026-01-10")}));

        DocumentoAsociadoDTO dto = auditoriaService.obtenerDocumentoAsociadoParaNC("A", 1, 2000);

        assertNotNull(dto);
        assertEquals("FC", dto.getTipo());
        assertEquals("A", dto.getLetra());
    }

    @Test
    @DisplayName("Obtener documento asociado para NC nulo si no existe")
    void testObtenerDocumentoAsociadoParaNCNull() {
        when(notaDeCreditoRepository.findDocumentoAsociadoPadreRaw("A", 1, 2000))
                .thenReturn(List.of());

        DocumentoAsociadoDTO dto = auditoriaService.obtenerDocumentoAsociadoParaNC("A", 1, 2000);
        assertNull(dto);
    }

    // ==========================================
    // 7. VERIFICACIONES Y TELEMETRÍA
    // ==========================================
    @Test
    @DisplayName("Verificar si tiene ND asociada a NC")
    void testTieneNotaDeDebito() {
        when(notaDeDebitoRepository.findNdCompletaParaNotaCreditoRaw("A", 1, 2000))
                .thenReturn(List.of());

        List<DocumentoAsociadoDTO> lista = auditoriaService.obtenerNotasDeDebitoCreadasParaNC("A", 1, 2000);
        assertNotNull(lista);
        assertTrue(lista.isEmpty());
    }

    @Test
    @DisplayName("Verificar si tiene NC asociada a FC")
    void testTieneNotaDeCredito() {
        when(notaDeCreditoRepository.findNcCompletaParaFactura("A", 1, 1000))
                .thenReturn(List.of());

        List<DocumentoAsociadoDTO> lista = auditoriaService.obtenerNotasDeCreditoCreadasParaFC("A", 1, 1000);
        assertNotNull(lista);
        assertTrue(lista.isEmpty());
    }

    @Test
    @DisplayName("Verificar si tiene NC para ND")
    void testTieneNotaDeCreditoParaND() {
        when(notaDeCreditoRepository.existeNcCompletaParaNotaDebito("A", 1, 3000)).thenReturn(true);
        DocumentoAsociadoDTO doc = new DocumentoAsociadoDTO("NC", "A", 1, 2000, LocalDate.now());
        when(notaDeCreditoRepository.findNcCompletaParaNotaDebito("A", 1, 3000)).thenReturn(List.of(doc));

        DocumentoAsociadoDTO resultado = auditoriaService.obtenerNotaDeCreditoCreadaParaND("A", 1, 3000);
        assertNotNull(resultado);
        assertEquals("NC", resultado.getTipo());
    }

    @Test
    @DisplayName("Verificar tieneNcAjusteIva")
    void testTieneNcAjusteIva() {
        assertFalse(auditoriaService.tieneNcAjusteIva("FC", null, 1, 1000));
        assertFalse(auditoriaService.tieneNcAjusteIva("FC", "", 1, 1000));

        when(ncAjusteDeIvaRepository.existsByTipoFcAndLetraFcAndPtovtaFcAndNumeroFc("FC", "A", 1, 1000)).thenReturn(true);
        assertTrue(auditoriaService.tieneNcAjusteIva("FC", "A", 1, 1000));
    }

    // ==========================================
    // 8. HISTORIAL DE COMPROBANTES
    // ==========================================
    @Test
    @DisplayName("Obtener historial de comprobantes completo")
    void testObtenerHistorialComprobantesCompleto() {
        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFC));
        when(cabeceraRepository.findByAsociadogrupo(50L))
                .thenReturn(List.of(cabeceraFC, cabeceraNC, cabeceraND));

        Object[] row = new Object[]{"2026-01", "1000.00", "210.00"};
        when(ambLiquidadoRepository.findTotalesFacturaMadre("A", 1, 1000))
                .thenReturn(new Object[][]{row});
        when(ambLiquidadoRepository.findByCabecera_Id(100L)).thenReturn(List.of(new AmbLiquidado()));

        List<FilaHistorialDTO> historial = auditoriaService.obtenerHistorialComprobantes("FC", "A", 1, 1000);

        assertNotNull(historial);
        assertFalse(historial.isEmpty());
        assertEquals("FC", historial.get(0).getTipoDocumento());
        assertEquals(0, historial.get(0).getNivel());
    }

    @Test
    @DisplayName("Obtener historial de comprobantes inexistente retorna lista vacía")
    void testObtenerHistorialComprobantesInexistente() {
        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(9999)))
                .thenReturn(List.of());

        List<FilaHistorialDTO> historial = auditoriaService.obtenerHistorialComprobantes("FC", "A", 1, 9999);
        assertNotNull(historial);
        assertTrue(historial.isEmpty());
    }

    // ==========================================
    // 9. CAMBIAR ESTADO DE GRUPO (REABRIR / FINALIZAR)
    // ==========================================
    @Test
    @DisplayName("Cambiar estado de grupo - ID nulo lanza excepción")
    void testCambiarEstadoGrupoIdNulo() {
        assertThrows(IllegalArgumentException.class, () -> auditoriaService.cambiarEstadoGrupo(null, 1, false));
    }

    @Test
    @DisplayName("Cambiar estado de grupo - Reabrir (Estado 1) exitoso")
    void testCambiarEstadoGrupoReabrir() {
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrId(50L)).thenReturn(List.of(cabeceraFC, cabeceraNC));

        CambioEstadoResponse resp = auditoriaService.cambiarEstadoGrupo(50L, 1, false);

        assertTrue(resp.isExito());
        assertFalse(resp.isRequiereConfirmacion());
        assertNull(resp.getMensajeAlerta());
        assertEquals(1, cabeceraFC.getIdEstado());
        verify(cabeceraRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("Cambiar estado de grupo - Finalizar (Estado 2) cuando montos cuadran")
    void testCambiarEstadoGrupoFinalizarMontosCuadran() {
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrId(50L)).thenReturn(List.of(cabeceraFC, cabeceraNC));

        NotaDeCredito nc = new NotaDeCredito();
        nc.setDebitoaceptado(null);
        nc.setImporteDebitado(new BigDecimal("500.00"));
        when(notaDeCreditoRepository.findByCabecera_IdIn(anyList())).thenReturn(List.of(nc));

        NotaDeDebito nd = new NotaDeDebito();
        nd.setImporterefactura(new BigDecimal("500.00"));
        when(notaDeDebitoRepository.findByCabecera_IdIn(anyList())).thenReturn(List.of(nd));

        CambioEstadoResponse resp = auditoriaService.cambiarEstadoGrupo(50L, 2, false);

        assertTrue(resp.isExito());
        assertFalse(resp.isRequiereConfirmacion());
        assertEquals(2, cabeceraFC.getIdEstado());
        verify(cabeceraRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("Cambiar estado de grupo - Finalizar (Estado 2) con discrepancia sin forzar")
    void testCambiarEstadoGrupoFinalizarDiscrepanciaSinForzar() {
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrId(50L)).thenReturn(List.of(cabeceraFC, cabeceraNC));

        NotaDeCredito nc = new NotaDeCredito();
        nc.setDebitoaceptado(null);
        nc.setImporteDebitado(new BigDecimal("500.00"));
        when(notaDeCreditoRepository.findByCabecera_IdIn(anyList())).thenReturn(List.of(nc));

        NotaDeDebito nd = new NotaDeDebito();
        nd.setImporterefactura(new BigDecimal("300.00"));
        when(notaDeDebitoRepository.findByCabecera_IdIn(anyList())).thenReturn(List.of(nd));

        CambioEstadoResponse resp = auditoriaService.cambiarEstadoGrupo(50L, 2, false);

        assertFalse(resp.isExito());
        assertTrue(resp.isRequiereConfirmacion());
        assertNotNull(resp.getMensajeAlerta());
        assertTrue(resp.getMensajeAlerta().contains("Diferencia de saldo: $ 200,00") || resp.getMensajeAlerta().contains("200.00"));
        verify(cabeceraRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("Cambiar estado de grupo - Finalizar (Estado 2) con discrepancia forzando cierre")
    void testCambiarEstadoGrupoFinalizarDiscrepanciaConForzar() {
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrId(50L)).thenReturn(List.of(cabeceraFC, cabeceraNC));

        NotaDeCredito nc = new NotaDeCredito();
        nc.setDebitoaceptado(null);
        nc.setImporteDebitado(new BigDecimal("500.00"));
        when(notaDeCreditoRepository.findByCabecera_IdIn(anyList())).thenReturn(List.of(nc));

        NotaDeDebito nd = new NotaDeDebito();
        nd.setImporterefactura(new BigDecimal("300.00"));
        when(notaDeDebitoRepository.findByCabecera_IdIn(anyList())).thenReturn(List.of(nd));

        CambioEstadoResponse resp = auditoriaService.cambiarEstadoGrupo(50L, 2, true);

        assertTrue(resp.isExito());
        assertFalse(resp.isRequiereConfirmacion());
        assertEquals(2, cabeceraFC.getIdEstado());
        verify(cabeceraRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("Cambiar estado de grupo - Estado desconocido lanza excepción")
    void testCambiarEstadoGrupoEstadoInvalido() {
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrId(50L)).thenReturn(List.of(cabeceraFC));

        assertThrows(IllegalArgumentException.class, () -> auditoriaService.cambiarEstadoGrupo(50L, 99, false));
    }

    // ==========================================
    // 10. PRUEBAS EXHAUSTIVAS DE RAMAS Y ENRUTAMIENTOS
    // ==========================================
    @Test
    @DisplayName("Resolver o crear Cabecera existente manual - Enriquece datos")
    void testResolverOCrearCabeceraExistenteEnriquecida() {
        Cabecera cabManual = new Cabecera();
        cabManual.setId(300L);
        cabManual.setTipo("ND");
        cabManual.setLetra("A");
        cabManual.setPtovta(1);
        cabManual.setNumero(3000);
        cabManual.setOrigen("APP_MANUAL");
        cabManual.setDebe(BigDecimal.ZERO);
        cabManual.setHaber(BigDecimal.ZERO);

        when(cabeceraRepository.findById(300L)).thenReturn(Optional.of(cabManual));
        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(2000)))
                .thenReturn(List.of(cabeceraNC));

        NuevaNotaDebitoRequest req = new NuevaNotaDebitoRequest();
        req.setOrigen("NC");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(2000);
        req.setUsuario("auditor");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setIdCabeceraSeleccionada(300L);
        datos.setTipo("ND");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(3000);
        datos.setTipoNd("Por Refactura");
        req.setDatosNota(datos);

        auditoriaService.procesarNuevaNotaDebito(req);

        verify(cabeceraRepository, atLeastOnce()).save(cabManual);
        assertEquals(50L, cabManual.getGrupo());
        assertEquals(101L, cabManual.getAsociado());
    }

    @Test
    @DisplayName("Nueva Nota de Débito - Cuando ncPadre ya tiene ND previa actualiza la ND existente")
    void testProcesarNuevaNotaDebitoConNdExistenteActualiza() {
        NuevaNotaDebitoRequest req = new NuevaNotaDebitoRequest();
        req.setOrigen("NC");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(2000);
        req.setUsuario("auditor");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("ND");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(3000);
        datos.setTipoNd("Por Refactura");
        req.setDatosNota(datos);

        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(5);
        reg.setMotivoRefactura("Refactura corregida");
        reg.setImporteRefactura(new BigDecimal("900.00"));
        req.setRegistros(List.of(reg));

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(2000)))
                .thenReturn(List.of(cabeceraNC));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("ND", "A", 1, 3000))
                .thenReturn(Optional.of(cabeceraND));

        AmbLiquidado amb = new AmbLiquidado();
        amb.setId(5);
        amb.setTotalNeto(new BigDecimal("1000.00"));
        amb.setIva(new BigDecimal("210.00"));
        when(ambLiquidadoRepository.findAllById(List.of(5))).thenReturn(List.of(amb));

        NotaDeDebito ndPrevia = new NotaDeDebito();
        ndPrevia.setId(99);

        NotaDeCredito ncPadre = new NotaDeCredito();
        ncPadre.setId(88);
        ncPadre.setNotaDeDebitoPadre(ndPrevia);

        when(notaDeCreditoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionId("A", 1, 2000, 5))
                .thenReturn(Optional.of(ncPadre));
        when(notaDeDebitoRepository.findByNotaDeCreditoPadreId(88)).thenReturn(Optional.of(ndPrevia));

        auditoriaService.procesarNuevaNotaDebito(req);

        verify(notaDeDebitoRepository, times(1)).saveAll(anyList());
        assertEquals("Refactura corregida", ndPrevia.getMotivorefactura());
    }

    @Test
    @DisplayName("Nueva Nota de Crédito - Origen ND exitoso con débito no aceptado")
    void testProcesarNuevaNotaCreditoOrigenNDExitoso() {
        NuevaNotaCreditoRequest req = new NuevaNotaCreditoRequest();
        req.setOrigen("ND");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(3000);
        req.setUsuario("auditor");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("NC");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(2000);
        datos.setTipoNc("Refactura");
        req.setDatosNota(datos);

        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(20);
        reg.setMotivoDebito("Débito mantenido");
        reg.setImporteDebitado(new BigDecimal("400.00"));
        reg.setDebitoAceptado("NO");
        reg.setDiasFacturados(1);
        req.setRegistros(List.of(reg));

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(3000)))
                .thenReturn(List.of(cabeceraND));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("NC", "A", 1, 2000))
                .thenReturn(Optional.empty());

        AmbLiquidado amb = new AmbLiquidado();
        amb.setId(20);
        amb.setTotalNeto(new BigDecimal("1000.00"));
        amb.setIva(new BigDecimal("210.00"));
        when(ambLiquidadoRepository.findAllById(List.of(20))).thenReturn(List.of(amb));

        NotaDeDebito ndPadre = new NotaDeDebito();
        ndPadre.setId(55);
        ndPadre.setMotivorefactura("Refactura");

        when(notaDeDebitoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionId("A", 1, 3000, 20))
                .thenReturn(Optional.of(ndPadre));
        when(notaDeCreditoRepository.findByNotaDeDebitoPadreId(55)).thenReturn(Optional.empty());

        auditoriaService.procesarNuevaNotaCredito(req);

        verify(cabeceraRepository, times(1)).save(any(Cabecera.class));
        verify(notaDeCreditoRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("Historial - NC IVA sin ND hija genera placeholder de ND")
    void testHistorialPlaceholderNdIva() {
        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFC));
        when(cabeceraRepository.findByAsociadogrupo(50L))
                .thenReturn(List.of(cabeceraFC, cabeceraNC));

        NcAjusteDeIva ncIva = new NcAjusteDeIva();
        ncIva.setCabecera(cabeceraNC);
        ncIva.setNeto(new BigDecimal("1000.00"));
        ncIva.setIva(new BigDecimal("210.00"));
        ncIva.setPorcIva(new BigDecimal("21.00"));

        when(ncAjusteDeIvaRepository.findByCabecera_Id(101L)).thenReturn(Optional.of(ncIva));
        when(ambLiquidadoRepository.findTotalesFacturaMadre("A", 1, 1000))
                .thenReturn(new Object[][]{new Object[]{"2026-01", "1000.00", "210.00"}});

        List<FilaHistorialDTO> historial = auditoriaService.obtenerHistorialComprobantes("FC", "A", 1, 1000);

        assertNotNull(historial);
        assertTrue(historial.stream().anyMatch(FilaHistorialDTO::isPlaceholderNdAjusteIva));
    }

    @Test
    @DisplayName("Historial - Comprobante de búsqueda tipo RC")
    void testHistorialBusquedaRc() {
        Cabecera rc = new Cabecera();
        rc.setId(105L);
        rc.setTipo("RC");
        rc.setNumero(777);
        rc.setGrupo(50L);
        rc.setAsociadogrupo(50L);

        when(cabeceraRepository.findByTipoRcAndNumero(777)).thenReturn(List.of(rc));
        when(cabeceraRepository.findByAsociadogrupo(50L)).thenReturn(List.of(cabeceraFC, rc));
        when(ambLiquidadoRepository.findTotalesFacturaMadre("A", 1, 1000))
                .thenReturn(new Object[][]{new Object[]{"2026-01", "1000.00", "210.00"}});

        List<FilaHistorialDTO> historial = auditoriaService.obtenerHistorialComprobantes("RC", null, null, 777);
        assertNotNull(historial);
        assertFalse(historial.isEmpty());
    }

    @Test
    @DisplayName("Obtener cabeceras disponibles - ND con prestaciones ya imputadas se marca con flag")
    void testObtenerCabecerasDisponiblesFiltroNd() {
        Cabecera cand1 = new Cabecera();
        cand1.setId(501L);
        cand1.setTipo("ND");
        cand1.setLetra("A");
        cand1.setPtovta(1);
        cand1.setNumero(5001);

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(2000)))
                .thenReturn(List.of(cabeceraNC));
        when(cabeceraRepository.findCandidatosPorTipoYGrupos(anyCollection(), anyCollection()))
                .thenReturn(List.of(cand1));
        when(notaDeDebitoRepository.findByCabecera_Id(501L)).thenReturn(List.of(new NotaDeDebito()));

        List<CabeceraCandidataDTO> lista = auditoriaService.obtenerCabecerasDisponibles("ND", "NC", "A", 1, 2000);
        assertNotNull(lista);
        assertEquals(1, lista.size());
        assertTrue(lista.get(0).isTienePrestacionesImputadas());
    }

    @Test
    @DisplayName("Cambiar estado de grupo - Fallback a findById con grupo asociado")
    void testCambiarEstadoGrupoFallbackIdGrupo() {
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrId(999L)).thenReturn(List.of());

        Cabecera individual = new Cabecera();
        individual.setId(999L);
        individual.setAsociadogrupo(50L);

        when(cabeceraRepository.findById(999L)).thenReturn(Optional.of(individual));
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrId(50L)).thenReturn(List.of(cabeceraFC));

        CambioEstadoResponse resp = auditoriaService.cambiarEstadoGrupo(999L, 1, false);
        assertTrue(resp.isExito());
        verify(cabeceraRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("tieneNotaDeCreditoCreada y tieneNotaDeDebitoCreada - Verificación booleana")
    void testTieneNotaDeCreditoYDebitoCreada() {
        when(notaDeCreditoRepository.existeNcCompletaParaFactura("A", 1, 1000)).thenReturn(true);
        when(notaDeDebitoRepository.existeNdCompletaParaNotaCredito("A", 1, 2000)).thenReturn(true);
        when(notaDeCreditoRepository.existeNcCompletaParaNotaDebito("A", 1, 3000)).thenReturn(true);

        assertTrue(auditoriaService.tieneNotaDeCreditoCreada("A", 1, 1000));
        assertTrue(auditoriaService.tieneNotaDeDebitoCreada("A", 1, 2000));
        assertTrue(auditoriaService.tieneNotaDeCreditoCreadaParaND("A", 1, 3000));
    }

    @Test
    @DisplayName("obtenerNotasDeDebitoCreadasParaNC - Manejo de filas con diferentes tipos de fecha y nulos")
    void testObtenerNotasDeDebitoCreadasParaNC() {
        // Caso 1: rows es null o vacio
        when(notaDeDebitoRepository.findNdCompletaParaNotaCreditoRaw("A", 1, 100)).thenReturn(null);
        List<DocumentoAsociadoDTO> resNull = auditoriaService.obtenerNotasDeDebitoCreadasParaNC("A", 1, 100);
        assertNotNull(resNull);
        assertTrue(resNull.isEmpty());

        when(notaDeDebitoRepository.findNdCompletaParaNotaCreditoRaw("A", 1, 101)).thenReturn(Collections.emptyList());
        List<DocumentoAsociadoDTO> resEmpty = auditoriaService.obtenerNotasDeDebitoCreadasParaNC("A", 1, 101);
        assertNotNull(resEmpty);
        assertTrue(resEmpty.isEmpty());

        // Caso 2: rows con java.sql.Date, LocalDate, String parseable, String inválida y null
        Object[] row1 = new Object[]{"ND", "A", 1, 3001, java.sql.Date.valueOf(LocalDate.of(2025, 1, 10)), "ND_REFACTURA"};
        Object[] row2 = new Object[]{"ND", "B", 2, 3002, LocalDate.of(2025, 2, 15), "ND_AJUSTE_IVA"};
        Object[] row3 = new Object[]{"ND", "A", 1, 3003, "2025-03-20", null};
        Object[] row4 = new Object[]{null, null, null, null, "fecha-invalida", null};

        when(notaDeDebitoRepository.findNdCompletaParaNotaCreditoRaw("A", 1, 2000))
                .thenReturn(List.of(row1, row2, row3, row4));

        List<DocumentoAsociadoDTO> lista = auditoriaService.obtenerNotasDeDebitoCreadasParaNC("A", 1, 2000);
        assertEquals(4, lista.size());
        assertEquals("ND", lista.get(0).getTipo());
        assertEquals(LocalDate.of(2025, 1, 10), lista.get(0).getFecha());
        assertEquals(LocalDate.of(2025, 2, 15), lista.get(1).getFecha());
        assertEquals(LocalDate.of(2025, 3, 20), lista.get(2).getFecha());
        assertNull(lista.get(3).getFecha());
        assertEquals(0, lista.get(3).getPtovta());
        assertEquals(0, lista.get(3).getNumero());
    }

    @Test
    @DisplayName("Historial jerárquico - FC con NC vinculada por prestacion.cabecera, NcAjusteDeIva y RC por asociado")
    void testHistorialJerarquicoFcConHijosMultiples() {
        Cabecera fc = new Cabecera();
        fc.setId(100L);
        fc.setTipo("FC");
        fc.setLetra("A");
        fc.setPtovta(1);
        fc.setNumero(1000);
        fc.setGrupo(50L);
        fc.setAsociadogrupo(50L);
        fc.setFecha(LocalDate.of(2025, 1, 1));
        fc.setDebe(new BigDecimal("10000.00"));
        fc.setHaber(BigDecimal.ZERO);

        Cabecera rc = new Cabecera();
        rc.setId(101L);
        rc.setTipo("RC");
        rc.setLetra("X");
        rc.setPtovta(1);
        rc.setNumero(1);
        rc.setGrupo(50L);
        rc.setAsociadogrupo(50L);
        rc.setFecha(LocalDate.of(2025, 1, 2));

        Cabecera ncPrest = new Cabecera();
        ncPrest.setId(102L);
        ncPrest.setTipo("NC");
        ncPrest.setLetra("A");
        ncPrest.setPtovta(1);
        ncPrest.setNumero(2001);
        ncPrest.setGrupo(50L);
        ncPrest.setAsociadogrupo(50L);
        ncPrest.setFecha(LocalDate.of(2025, 1, 3));

        AmbLiquidado ambPadre = new AmbLiquidado();
        ambPadre.setCabecera(fc);
        NotaDeCredito ncItem = new NotaDeCredito();
        ncItem.setPrestacion(ambPadre);

        Cabecera ncIva = new Cabecera();
        ncIva.setId(103L);
        ncIva.setTipo("NC");
        ncIva.setLetra("A");
        ncIva.setPtovta(1);
        ncIva.setNumero(2002);
        ncIva.setGrupo(50L);
        ncIva.setAsociadogrupo(50L);
        ncIva.setFecha(LocalDate.of(2025, 1, 4));

        NcAjusteDeIva ajusteIva = new NcAjusteDeIva();
        ajusteIva.setLetraFc("A");
        ajusteIva.setPtovtaFc(1);
        ajusteIva.setNumeroFc(1000);

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(fc));
        when(cabeceraRepository.findByAsociadogrupo(50L))
                .thenReturn(List.of(fc, rc, ncPrest, ncIva));

        when(notaDeCreditoRepository.findByCabecera_Id(102L)).thenReturn(List.of(ncItem));
        when(ncAjusteDeIvaRepository.findByCabecera_Id(102L)).thenReturn(Optional.empty());
        when(ncAjusteDeIvaRepository.findByCabecera_Id(103L)).thenReturn(Optional.of(ajusteIva));

        List<FilaHistorialDTO> historial = auditoriaService.obtenerHistorialComprobantes("FC", "A", 1, 1000);
        assertNotNull(historial);
        assertTrue(historial.size() >= 3);
    }

    @Test
    @DisplayName("Historial jerárquico - NC con ND vinculada por notaDeCreditoPadre y NdAjusteDeIva")
    void testHistorialJerarquicoNcConHijosNd() {
        Cabecera nc = new Cabecera();
        nc.setId(200L);
        nc.setTipo("NC");
        nc.setLetra("A");
        nc.setPtovta(1);
        nc.setNumero(2000);
        nc.setGrupo(60L);
        nc.setAsociadogrupo(60L);
        nc.setFecha(LocalDate.of(2025, 2, 1));
        nc.setHaber(new BigDecimal("2000.00"));

        Cabecera ndRefactura = new Cabecera();
        ndRefactura.setId(201L);
        ndRefactura.setTipo("ND");
        ndRefactura.setLetra("A");
        ndRefactura.setPtovta(1);
        ndRefactura.setNumero(3001);
        ndRefactura.setGrupo(60L);
        ndRefactura.setAsociadogrupo(60L);
        ndRefactura.setFecha(LocalDate.of(2025, 2, 5));

        NotaDeCredito ncPadreItem = new NotaDeCredito();
        ncPadreItem.setCabecera(nc);
        NotaDeDebito ndItem = new NotaDeDebito();
        ndItem.setNotaDeCreditoPadre(ncPadreItem);

        Cabecera ndIva = new Cabecera();
        ndIva.setId(202L);
        ndIva.setTipo("ND");
        ndIva.setLetra("A");
        ndIva.setPtovta(1);
        ndIva.setNumero(3002);
        ndIva.setGrupo(60L);
        ndIva.setAsociadogrupo(60L);
        ndIva.setFecha(LocalDate.of(2025, 2, 6));

        NdAjusteDeIva ndAjuste = new NdAjusteDeIva();
        ndAjuste.setLetraNc("A");
        ndAjuste.setPtovtaNc(1);
        ndAjuste.setNumeroNc(2000);

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(2000)))
                .thenReturn(List.of(nc));
        when(cabeceraRepository.findByAsociadogrupo(60L))
                .thenReturn(List.of(nc, ndRefactura, ndIva));

        when(notaDeDebitoRepository.findByCabecera_Id(201L)).thenReturn(List.of(ndItem));
        when(notaDeDebitoRepository.findByCabecera_Id(202L)).thenReturn(Collections.emptyList());
        when(ndAjusteDeIvaRepository.findByCabecera_Id(201L)).thenReturn(Optional.empty());
        when(ndAjusteDeIvaRepository.findByCabecera_Id(202L)).thenReturn(Optional.of(ndAjuste));

        List<FilaHistorialDTO> historial = auditoriaService.obtenerHistorialComprobantes("NC", "A", 1, 2000);
        assertNotNull(historial);
        assertTrue(historial.size() >= 3);
    }

    @Test
    @DisplayName("Historial jerárquico - ND con NC vinculada por notaDeDebitoPadre y RC por grupo")
    void testHistorialJerarquicoNdConHijosNcYRc() {
        Cabecera nd = new Cabecera();
        nd.setId(300L);
        nd.setTipo("ND");
        nd.setLetra("A");
        nd.setPtovta(1);
        nd.setNumero(3000);
        nd.setGrupo(70L);
        nd.setAsociadogrupo(70L);
        nd.setFecha(LocalDate.of(2025, 3, 1));
        nd.setDebe(new BigDecimal("1500.00"));

        Cabecera rc = new Cabecera();
        rc.setId(301L);
        rc.setTipo("RC");
        rc.setLetra("X");
        rc.setPtovta(1);
        rc.setNumero(10);
        rc.setGrupo(70L);
        rc.setAsociadogrupo(70L);

        Cabecera ncNd = new Cabecera();
        ncNd.setId(302L);
        ncNd.setTipo("NC");
        ncNd.setLetra("A");
        ncNd.setPtovta(1);
        ncNd.setNumero(2005);
        ncNd.setGrupo(70L);
        ncNd.setAsociadogrupo(70L);

        NotaDeDebito ndPadre = new NotaDeDebito();
        ndPadre.setCabecera(nd);
        NotaDeCredito ncChild = new NotaDeCredito();
        ncChild.setNotaDeDebitoPadre(ndPadre);

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(3000)))
                .thenReturn(List.of(nd));
        when(cabeceraRepository.findByAsociadogrupo(70L))
                .thenReturn(List.of(nd, rc, ncNd));
        when(notaDeCreditoRepository.findByCabecera_Id(302L)).thenReturn(List.of(ncChild));

        List<FilaHistorialDTO> historial = auditoriaService.obtenerHistorialComprobantes("ND", "A", 1, 3000);
        assertNotNull(historial);
        assertTrue(historial.size() >= 3);
    }

    @Test
    @DisplayName("Historial jerárquico - FC -> NC -> ND con RC no debe duplicar el RC")
    void testHistorialJerarquicoFcConNcNdYRcSinDuplicarRc() {
        Cabecera fc = new Cabecera();
        fc.setId(8510L);
        fc.setTipo("FAC");
        fc.setLetra("B");
        fc.setPtovta(30);
        fc.setNumero(4332);
        fc.setGrupo(227712L);
        fc.setAsociadogrupo(227712L);
        fc.setFecha(LocalDate.of(2026, 5, 1));
        fc.setDebe(new BigDecimal("83888973.91"));

        Cabecera nc = new Cabecera();
        nc.setId(11727L);
        nc.setTipo("NC");
        nc.setLetra("B");
        nc.setPtovta(30);
        nc.setNumero(1014);
        nc.setAsociado(8510L);
        nc.setGrupo(227712L);
        nc.setAsociadogrupo(227712L);
        nc.setFecha(LocalDate.of(2026, 6, 30));
        nc.setHaber(new BigDecimal("9426935.86"));

        Cabecera nd = new Cabecera();
        nd.setId(30607L);
        nd.setTipo("NDE");
        nd.setLetra("A");
        nd.setPtovta(31);
        nd.setNumero(3131);
        nd.setAsociado(11727L);
        nd.setGrupo(227712L);
        nd.setAsociadogrupo(227712L);
        nd.setFecha(LocalDate.of(2026, 9, 17));
        nd.setDebe(new BigDecimal("8443344.09"));

        Cabecera rc = new Cabecera();
        rc.setId(11726L);
        rc.setTipo("RC");
        rc.setGrupo(227712L);
        rc.setAsociadogrupo(227712L);
        rc.setFecha(LocalDate.of(2026, 7, 3));
        rc.setHaber(new BigDecimal("83270380.31"));

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("B"), eq(30), eq(4332)))
                .thenReturn(List.of(fc));
        when(cabeceraRepository.findByAsociadogrupo(227712L))
                .thenReturn(List.of(nd, fc, rc, nc));
        when(ambLiquidadoRepository.findTotalesFacturaMadre("B", 30, 4332))
                .thenReturn(new Object[][]{new Object[]{"2026-05", "83888973.91", "8808342.33"}});

        List<FilaHistorialDTO> historial = auditoriaService.obtenerHistorialComprobantes("FC", "B", 30, 4332);

        assertNotNull(historial);
        assertEquals(4, historial.size(), "El historial debe contener exactamente 4 documentos (FC, NC, NDE, RC)");

        long rcCount = historial.stream()
                .filter(f -> "RC".equalsIgnoreCase(f.getTipoDocumento()))
                .count();
        assertEquals(1, rcCount, "El comprobante RC debe aparecer exactamente una vez");

        // Validar jerarquía y niveles:
        // 0: FC
        // 1: NC
        // 2: NDE (hija de NC)
        // 1: RC (hijo de FC)
        assertEquals("FAC", historial.get(0).getTipoDocumento());
        assertEquals(0, historial.get(0).getNivel());

        assertEquals("NC", historial.get(1).getTipoDocumento());
        assertEquals(1, historial.get(1).getNivel());

        assertEquals("NDE", historial.get(2).getTipoDocumento());
        assertEquals(2, historial.get(2).getNivel());

        assertEquals("RC", historial.get(3).getTipoDocumento());
        assertEquals(1, historial.get(3).getNivel());
    }

    // ==========================================
    // 25. REGISTRO Y AUDITORÍA DE IMPUTACIONES
    // ==========================================
    @Test
    @DisplayName("procesarNuevaNotaCredito - Registra auditoría de imputación correctamente")
    void testProcesarNuevaNotaCreditoRegistraImputacion() {
        NuevaNotaCreditoRequest req = new NuevaNotaCreditoRequest();
        req.setOrigen("FC");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(1000);
        req.setUsuario("usuario.auditor");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("NC");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(2000);
        datos.setFecha("2026-02-15");
        datos.setTipoNc("Refactura");
        req.setDatosNota(datos);

        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(10);
        reg.setMotivoDebito("Falta firma");
        reg.setImporteDebitado(new BigDecimal("200.00"));
        reg.setDebitoAceptado("SI");
        req.setRegistros(List.of(reg));

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFC));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("NC", "A", 1, 2000))
                .thenReturn(Optional.of(cabeceraNC));

        AmbLiquidado amb = new AmbLiquidado();
        amb.setId(10);
        amb.setCabecera(cabeceraFC);
        amb.setTotalNeto(new BigDecimal("1000.00"));
        amb.setIva(new BigDecimal("210.00"));
        when(ambLiquidadoRepository.findAllById(List.of(10))).thenReturn(List.of(amb));
        when(notaDeCreditoRepository.findByPrestacionIdAndNotaDeDebitoPadreIsNull(10)).thenReturn(Optional.empty());

        auditoriaService.procesarNuevaNotaCredito(req);

        ArgumentCaptor<RegistroImputacion> captor = ArgumentCaptor.forClass(RegistroImputacion.class);
        verify(registroImputacionRepository, times(1)).save(captor.capture());

        RegistroImputacion imp = captor.getValue();
        assertNotNull(imp);
        assertEquals("usuario.auditor", imp.getUsuario());
        assertEquals(100L, imp.getIdCabeceraOrigen());
        assertEquals(101L, imp.getIdCabeceraDestino());
        assertEquals("NC", imp.getTipoImputacion());
        assertNotNull(imp.getFechaHora());
        assertTrue(imp.getComprobanteOrigen().contains("FC"));
        assertTrue(imp.getComprobanteDestino().contains("NC"));
    }

    @Test
    @DisplayName("procesarNuevaNotaCredito - Origen FCE guarda prestaciones en notadecredito y registra imputación")
    void testProcesarNuevaNotaCreditoOrigenFceGuardaPrestacionesYRegistraImputacion() {
        NuevaNotaCreditoRequest req = new NuevaNotaCreditoRequest();
        req.setOrigen("FCE");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(30);
        req.setNumeroOriginal(2081);
        req.setUsuario("usuario.auditor");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("NC");
        datos.setLetra("A");
        datos.setPuntoVenta(555);
        datos.setNumero(5555);
        datos.setFecha("2026-09-19");
        datos.setTipoNc("Refactura");
        req.setDatosNota(datos);

        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(50);
        reg.setMotivoDebito("Débito prestacional");
        reg.setImporteDebitado(new BigDecimal("100.00"));
        reg.setDebitoAceptado("SI");
        req.setRegistros(List.of(reg));

        Cabecera cabFCE = new Cabecera("FCE", "A", 30, 2081, LocalDate.of(2026, 5, 8), null, "BDD", "OS", "Obra Social");
        cabFCE.setId(2L);
        cabFCE.setGrupo(226181L);

        Cabecera cabNC = new Cabecera("NC", "A", 555, 5555, LocalDate.of(2026, 9, 19), null, "APP_MANUAL", "OS", "Obra Social");
        cabNC.setId(19789L);
        cabNC.setGrupo(226181L);

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(30), eq(2081)))
                .thenReturn(List.of(cabFCE));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("NC", "A", 555, 5555))
                .thenReturn(Optional.of(cabNC));

        AmbLiquidado amb = new AmbLiquidado();
        amb.setId(50);
        amb.setCabecera(cabFCE);
        amb.setTotalNeto(new BigDecimal("500.00"));
        amb.setIva(new BigDecimal("105.00"));
        when(ambLiquidadoRepository.findAllById(List.of(50))).thenReturn(List.of(amb));
        when(notaDeCreditoRepository.findByPrestacionIdAndNotaDeDebitoPadreIsNull(50)).thenReturn(Optional.empty());

        auditoriaService.procesarNuevaNotaCredito(req);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<NotaDeCredito>> captorNcList = ArgumentCaptor.forClass(List.class);
        verify(notaDeCreditoRepository, times(1)).saveAll(captorNcList.capture());
        List<NotaDeCredito> guardadas = captorNcList.getValue();
        assertEquals(1, guardadas.size());
        assertEquals(19789L, guardadas.get(0).getCabecera().getId());
        assertEquals(50, guardadas.get(0).getPrestacion().getId());

        ArgumentCaptor<RegistroImputacion> captorImp = ArgumentCaptor.forClass(RegistroImputacion.class);
        verify(registroImputacionRepository, times(1)).save(captorImp.capture());
        RegistroImputacion imp = captorImp.getValue();
        assertNotNull(imp);
        assertEquals(2L, imp.getIdCabeceraOrigen());
        assertEquals(19789L, imp.getIdCabeceraDestino());
    }

    @Test
    @DisplayName("procesarNuevaNotaDebito - Registra auditoría de imputación correctamente")
    void testProcesarNuevaNotaDebitoRegistraImputacion() {
        NuevaNotaDebitoRequest req = new NuevaNotaDebitoRequest();
        req.setOrigen("NC");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(2000);
        req.setUsuario("usuario.auditor2");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("ND");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(3000);
        datos.setFecha("2026-03-10");
        datos.setTipoNd("Por Refactura");
        req.setDatosNota(datos);

        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(10);
        reg.setMotivoRefactura("Rechazo");
        reg.setImporteRefactura(new BigDecimal("150.00"));
        req.setRegistros(List.of(reg));

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(2000)))
                .thenReturn(List.of(cabeceraNC));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("ND", "A", 1, 3000))
                .thenReturn(Optional.of(cabeceraND));

        AmbLiquidado amb = new AmbLiquidado();
        amb.setId(10);
        when(ambLiquidadoRepository.findAllById(List.of(10))).thenReturn(List.of(amb));

        NotaDeCredito ncPadre = new NotaDeCredito();
        ncPadre.setId(88);
        when(notaDeCreditoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionId("A", 1, 2000, 10))
                .thenReturn(Optional.of(ncPadre));
        when(notaDeDebitoRepository.existsByNotaDeCreditoPadreIdAndTipoNd(88, "Por Refactura")).thenReturn(false);

        auditoriaService.procesarNuevaNotaDebito(req);

        ArgumentCaptor<RegistroImputacion> captor = ArgumentCaptor.forClass(RegistroImputacion.class);
        verify(registroImputacionRepository, times(1)).save(captor.capture());

        RegistroImputacion imp = captor.getValue();
        assertNotNull(imp);
        assertEquals("usuario.auditor2", imp.getUsuario());
        assertEquals(101L, imp.getIdCabeceraOrigen());
        assertEquals(102L, imp.getIdCabeceraDestino());
        assertEquals("ND", imp.getTipoImputacion());
        assertNotNull(imp.getFechaHora());
    }

    @Test
    @DisplayName("procesarNuevaNotaDebitoAjusteIva - Registra auditoría de imputación correctamente")
    void testProcesarNuevaNotaDebitoAjusteIvaRegistraImputacion() {
        NuevaNotaDebitoAjusteIvaRequest req = new NuevaNotaDebitoAjusteIvaRequest();
        req.setTipoNc("NC");
        req.setLetraNc("A");
        req.setPtovtaNc(1);
        req.setNumeroNc(2000);
        req.setTipoNd("ND");
        req.setLetraNd("A");
        req.setPtovtaNd(1);
        req.setNumeroNd(3000);
        req.setNeto("500.00");
        req.setIva("105.00");
        req.setPorcIva("21.00");
        req.setUsuario("auditor.iva");

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(2000)))
                .thenReturn(List.of(cabeceraNC));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("ND", "A", 1, 3000))
                .thenReturn(Optional.of(cabeceraND));

        auditoriaService.procesarNuevaNotaDebitoAjusteIva(req);

        ArgumentCaptor<RegistroImputacion> captor = ArgumentCaptor.forClass(RegistroImputacion.class);
        verify(registroImputacionRepository, times(1)).save(captor.capture());

        RegistroImputacion imp = captor.getValue();
        assertNotNull(imp);
        assertEquals("auditor.iva", imp.getUsuario());
        assertEquals(101L, imp.getIdCabeceraOrigen());
        assertEquals(102L, imp.getIdCabeceraDestino());
        assertEquals("ND_AJUSTE_IVA", imp.getTipoImputacion());
    }

    @Test
    @DisplayName("procesarNuevaNotaCredito - Ajuste de IVA no prestacional registra auditoría de imputación")
    void testProcesarNuevaNotaCreditoAjusteIvaRegistraImputacion() {
        NuevaNotaCreditoRequest req = new NuevaNotaCreditoRequest();
        req.setOrigen("FC");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(1000);
        req.setUsuario("auditor.nciva");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("NC");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(2000);
        datos.setFecha("2026-02-15");
        datos.setTipoNc("Por ajuste de IVA");
        datos.setSubtipoIva("No prestacional");
        datos.setNeto(new BigDecimal("1000.00"));
        datos.setPorcIva(new BigDecimal("21.00"));
        datos.setIva(new BigDecimal("210.00"));
        req.setDatosNota(datos);

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFC));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("NC", "A", 1, 2000))
                .thenReturn(Optional.of(cabeceraNC));

        auditoriaService.procesarNuevaNotaCredito(req);

        ArgumentCaptor<RegistroImputacion> captor = ArgumentCaptor.forClass(RegistroImputacion.class);
        verify(registroImputacionRepository, times(1)).save(captor.capture());

        RegistroImputacion imp = captor.getValue();
        assertNotNull(imp);
        assertEquals("auditor.nciva", imp.getUsuario());
        assertEquals(100L, imp.getIdCabeceraOrigen());
        assertEquals(101L, imp.getIdCabeceraDestino());
        assertEquals("NC_AJUSTE_IVA", imp.getTipoImputacion());
    }

    @Test
    @DisplayName("obtenerCabecerasDisponibles - Retorna todas las cabeceras marcando tienePrestacionesImputadas")
    void testObtenerCabecerasDisponiblesConYsinPrestacionesImputadas() {
        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFC));

        Cabecera cab1 = new Cabecera("NC", "A", 1, 2001, LocalDate.now(), null, "REG1", "OSDE", "OSDE 210");
        cab1.setId(101L);
        Cabecera cab2 = new Cabecera("NC", "A", 1, 2002, LocalDate.now(), null, "REG1", "OSDE", "OSDE 210");
        cab2.setId(102L);

        when(cabeceraRepository.findCandidatosPorTipoYGrupos(anyList(), anySet()))
                .thenReturn(List.of(cab1, cab2));

        when(notaDeCreditoRepository.findByCabecera_Id(101L)).thenReturn(List.of(new NotaDeCredito()));
        when(notaDeCreditoRepository.findByCabecera_Id(102L)).thenReturn(Collections.emptyList());
        when(ncAjusteDeIvaRepository.findByCabecera_Id(anyLong())).thenReturn(Optional.empty());

        List<CabeceraCandidataDTO> candidatos = auditoriaService.obtenerCabecerasDisponibles("NC", "FC", "A", 1, 1000);

        assertNotNull(candidatos);
        assertEquals(2, candidatos.size());
        assertTrue(candidatos.get(0).isTienePrestacionesImputadas());
        assertFalse(candidatos.get(1).isTienePrestacionesImputadas());
    }

    @Test
    @DisplayName("procesarNuevaNotaCredito - Agregado de prestaciones a imputación existente")
    void testProcesarNuevaNotaCreditoAgregadoDePrestaciones() {
        NuevaNotaCreditoRequest req = new NuevaNotaCreditoRequest();
        req.setOrigen("FC");
        req.setLetraOriginal("A");
        req.setPtovtaOriginal(1);
        req.setNumeroOriginal(1000);
        req.setUsuario("auditor.agregado");

        DatosNotaDTO datos = new DatosNotaDTO();
        datos.setTipo("NC");
        datos.setLetra("A");
        datos.setPuntoVenta(1);
        datos.setNumero(2000);
        datos.setFecha("2026-02-15");
        datos.setTipoNc("Refactura");
        req.setDatosNota(datos);

        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(501);
        reg.setMotivoDebito("DOCUMENTACION_INCOMPLETA");
        reg.setImporteDebitado(new BigDecimal("150.00"));
        reg.setDebitoAceptado("SI");
        req.setRegistros(List.of(reg));

        AmbLiquidado amb = new AmbLiquidado();
        amb.setId(501);
        amb.setTotalNeto(new BigDecimal("150.00"));
        amb.setIva(new BigDecimal("31.50"));

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFC));
        when(cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero("NC", "A", 1, 2000))
                .thenReturn(Optional.of(cabeceraNC));
        when(ambLiquidadoRepository.findAllById(anyList())).thenReturn(List.of(amb));
        when(notaDeCreditoRepository.findByCabecera_Id(101L)).thenReturn(List.of(new NotaDeCredito()));

        auditoriaService.procesarNuevaNotaCredito(req);

        ArgumentCaptor<RegistroImputacion> captor = ArgumentCaptor.forClass(RegistroImputacion.class);
        verify(registroImputacionRepository, times(1)).save(captor.capture());

        RegistroImputacion imp = captor.getValue();
        assertNotNull(imp);
        assertEquals("auditor.agregado", imp.getUsuario());
        assertEquals("Agregado de prestaciones a imputación", imp.getTipoImputacion());
    }

    @Test
    @DisplayName("procesarGuardadoParcial - Modificación de prestaciones ya imputadas registra auditoría")
    void testProcesarGuardadoParcialModificacionDePrestacionesYaImputadas() {
        GuardarParcialRequest req = new GuardarParcialRequest();
        req.setDocumentoOrigen("FC");
        req.setLetra("A");
        req.setPtovta(1);
        req.setNumero(1000);
        req.setUsuario("auditor.modifica");

        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(502);
        reg.setMotivoDebito("ERROR_FACTURACION");
        reg.setImporteDebitado(new BigDecimal("200.00"));
        reg.setDebitoAceptado("SI");
        req.setRegistros(List.of(reg));

        AmbLiquidado amb = new AmbLiquidado();
        amb.setId(502);

        NotaDeCredito ncExistente = new NotaDeCredito();
        ncExistente.setId(10);
        ncExistente.setCabecera(cabeceraNC);

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFC));
        when(ambLiquidadoRepository.findAllById(anyList())).thenReturn(List.of(amb));
        when(notaDeCreditoRepository.findByPrestacionIdAndNotaDeDebitoPadreIsNull(502))
                .thenReturn(Optional.of(ncExistente));

        auditoriaService.procesarGuardadoParcial(req);

        ArgumentCaptor<RegistroImputacion> captor = ArgumentCaptor.forClass(RegistroImputacion.class);
        verify(registroImputacionRepository, times(1)).save(captor.capture());

        RegistroImputacion imp = captor.getValue();
        assertNotNull(imp);
        assertEquals("auditor.modifica", imp.getUsuario());
        assertEquals("Modificación de prestaciones ya imputadas", imp.getTipoImputacion());
    }

    @Test
    @DisplayName("Operaciones bloqueadas si trámite está finalizado (idEstado == 2)")
    void testOperacionesBloqueadasSiTramiteFinalizado() {
        Cabecera cabeceraFinalizada = new Cabecera("FC", "A", 1, 1000, LocalDate.now(), null, "REG1", "OSDE", "OSDE 210");
        cabeceraFinalizada.setId(100L);
        cabeceraFinalizada.setIdEstado(2);

        when(cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(anyList(), eq("A"), eq(1), eq(1000)))
                .thenReturn(List.of(cabeceraFinalizada));

        // 1. Guardar parcial debe lanzar excepción
        GuardarParcialRequest reqGuardar = new GuardarParcialRequest();
        reqGuardar.setDocumentoOrigen("FC");
        reqGuardar.setLetra("A");
        reqGuardar.setPtovta(1);
        reqGuardar.setNumero(1000);
        RegistroAuditoriaDTO reg = new RegistroAuditoriaDTO();
        reg.setId(503);
        reqGuardar.setRegistros(List.of(reg));

        IllegalStateException ex1 = assertThrows(IllegalStateException.class, () ->
                auditoriaService.procesarGuardadoParcial(reqGuardar)
        );
        assertTrue(ex1.getMessage().contains("El trámite se encuentra finalizado"));

        // 2. Nueva Nota de Crédito debe lanzar excepción
        NuevaNotaCreditoRequest reqNc = new NuevaNotaCreditoRequest();
        reqNc.setOrigen("FC");
        reqNc.setLetraOriginal("A");
        reqNc.setPtovtaOriginal(1);
        reqNc.setNumeroOriginal(1000);
        reqNc.setDatosNota(new DatosNotaDTO());

        IllegalStateException ex2 = assertThrows(IllegalStateException.class, () ->
                auditoriaService.procesarNuevaNotaCredito(reqNc)
        );
        assertTrue(ex2.getMessage().contains("El trámite se encuentra finalizado"));
    }
}

