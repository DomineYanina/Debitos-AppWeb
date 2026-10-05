package com.debitos.backend.service;

import com.debitos.backend.dto.directorio.*;
import com.debitos.backend.dto.reportes.*;
import com.debitos.backend.model.AmbLiquidado;
import com.debitos.backend.model.Cabecera;
import com.debitos.backend.model.NotaDeCredito;
import com.debitos.backend.model.NotaDeDebito;
import com.debitos.backend.repository.AmbLiquidadoRepository;
import com.debitos.backend.repository.CabeceraRepository;
import com.debitos.backend.repository.ComprobanteAnuladoRepository;
import com.debitos.backend.repository.NotaDeCreditoRepository;
import com.debitos.backend.repository.NotaDeDebitoRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DirectorioServiceTest {

    @Mock
    private EntityManager entityManager;

    @Mock
    private CabeceraRepository cabeceraRepository;

    @Mock
    private NotaDeCreditoRepository notaDeCreditoRepository;

    @Mock
    private NotaDeDebitoRepository notaDeDebitoRepository;

    @Mock
    private AmbLiquidadoRepository ambLiquidadoRepository;

    @Mock
    private ComprobanteAnuladoRepository comprobanteAnuladoRepository;

    @Mock
    private Query mockQuery;

    @InjectMocks
    private DirectorioService directorioService;

    @BeforeEach
    void setUp() {
        lenient().when(entityManager.createNativeQuery(anyString())).thenReturn(mockQuery);
        lenient().when(comprobanteAnuladoRepository.findIdsCabeceraAnulados()).thenReturn(Collections.emptyList());
    }

    @Test
    @DisplayName("obtenerCoberturasDisponibles retorna lista mapeada correctamente")
    void testObtenerCoberturasDisponibles() {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{"OSDE", "OSDE BINARIO"});
        rows.add(new Object[]{"SWISS", "SWISS MEDICAL"});

        when(mockQuery.getResultList()).thenReturn(rows);

        List<DirectorioCoberturaDTO> result = directorioService.obtenerCoberturasDisponibles();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("OSDE", result.get(0).getCodigo());
        assertEquals("OSDE BINARIO", result.get(0).getNombre());
    }

    @Test
    @DisplayName("obtenerTotalesMacro calcula correctamente los 4 totales financieros")
    void testObtenerTotalesMacro() {
        // fc=100000, cant=10, incNd=5000, debNc=10000, refNd=4000, cobRc=60000, dso=429
        when(mockQuery.getSingleResult())
                .thenReturn(new Object[]{
                        new BigDecimal("100000.00"), 10L, new BigDecimal("5000.00"),
                        new BigDecimal("10000.00"), new BigDecimal("4000.00"),
                        new BigDecimal("60000.00"), 429
                });

        DirectorioTotalesDTO totales = directorioService.obtenerTotalesMacro("OSDE", null, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31));

        assertNotNull(totales);
        assertEquals(new BigDecimal("100000.00"), totales.getTotalFacturado());
        assertEquals(new BigDecimal("60000.00"), totales.getCobranzaEfectiva());
        assertEquals(new BigDecimal("6000.00"), totales.getPerdidaAsumida());
        // Saldo Real = 100000 + 5000 + 4000 - 10000 - 60000 = 39000
        assertEquals(new BigDecimal("39000.00"), totales.getDeudaNeta());
        assertEquals(10L, totales.getCantidadFacturas());
        assertEquals(10L, totales.getCantidadComprobantes());
    }

    @Test
    @DisplayName("obtenerTiposDocumentoDisponibles retorna lista de tipos de comprobante")
    void testObtenerTiposDocumentoDisponibles() {
        when(mockQuery.getResultList()).thenReturn(List.of("FAC", "FC", "FCA", "FCE"));

        List<String> tipos = directorioService.obtenerTiposDocumentoDisponibles();

        assertNotNull(tipos);
        assertEquals(4, tipos.size());
        assertTrue(tipos.contains("FCE"));
    }

    @Test
    @DisplayName("obtenerDistribucionMotivos calcula montos y porcentajes agrupados")
    void testObtenerDistribucionMotivos() {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{"Falta de autorización", new BigDecimal("75000.00"), 15L});
        rows.add(new Object[]{"Falta firma", new BigDecimal("25000.00"), 5L});

        when(mockQuery.getResultList()).thenReturn(rows);

        List<DirectorioMotivoDebitoDTO> motivos = directorioService.obtenerDistribucionMotivos(null, null, null, null);

        assertNotNull(motivos);
        assertEquals(2, motivos.size());
        assertEquals("Falta de autorización", motivos.get(0).getMotivo());
        assertEquals(new BigDecimal("75000.00"), motivos.get(0).getMontoTotal());
        assertEquals(new BigDecimal("75.00"), motivos.get(0).getPorcentaje());
        assertEquals(15L, motivos.get(0).getCantidadCasos());

        assertEquals("Falta firma", motivos.get(1).getMotivo());
        assertEquals(new BigDecimal("25.00"), motivos.get(1).getPorcentaje());
    }

    @Test
    @DisplayName("obtenerGruposFacturas agrupa correctamente facturas y sus comprobantes derivados")
    void testObtenerGruposFacturas() {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{
                1L, "FC", "A", 1, 1001, java.sql.Date.valueOf(LocalDate.of(2026, 8, 1)),
                java.sql.Date.valueOf(LocalDate.of(2026, 8, 1)), "OSDE", "OSDE BINARIO",
                100L, new BigDecimal("50000.00"), 1
        });

        when(mockQuery.getResultList()).thenReturn(rows);

        Cabecera fcMadre = new Cabecera();
        fcMadre.setId(1L);
        fcMadre.setAsociadogrupo(100L);
        fcMadre.setTipo("FC");

        Cabecera ncHija = new Cabecera();
        ncHija.setId(2L);
        ncHija.setAsociadogrupo(100L);
        ncHija.setTipo("NC");
        ncHija.setLetra("A");
        ncHija.setPtovta(1);
        ncHija.setNumero(2001);
        ncHija.setFecha(LocalDate.of(2026, 8, 10));

        Cabecera ndHija = new Cabecera();
        ndHija.setId(3L);
        ndHija.setAsociadogrupo(100L);
        ndHija.setTipo("ND");
        ndHija.setLetra("A");
        ndHija.setPtovta(1);
        ndHija.setNumero(3001);
        ndHija.setFecha(LocalDate.of(2026, 8, 15));
        ndHija.setDebe(new BigDecimal("3000.00"));

        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrIdIn(any())).thenReturn(List.of(fcMadre, ncHija, ndHija));

        NotaDeCredito ncItem = new NotaDeCredito();
        ncItem.setCabecera(ncHija);
        ncItem.setDebitoaceptado(true);
        ncItem.setImporteDebitado(new BigDecimal("4000.00"));
        when(notaDeCreditoRepository.findByCabecera_IdIn(any())).thenReturn(List.of(ncItem));

        NotaDeDebito ndItem = new NotaDeDebito();
        ndItem.setCabecera(ndHija);
        ndItem.setImporterefactura(new BigDecimal("3000.00"));
        when(notaDeDebitoRepository.findByCabecera_IdIn(any())).thenReturn(List.of(ndItem));

        List<DirectorioGrupoFacturaDTO> grupos = directorioService.obtenerGruposFacturas("OSDE", null, null, null);

        assertNotNull(grupos);
        assertEquals(1, grupos.size());
        DirectorioGrupoFacturaDTO grupo = grupos.get(0);
        assertEquals(1001, grupo.getNumero());
        assertEquals(new BigDecimal("50000.00"), grupo.getTotalFacturado());
        assertEquals(new BigDecimal("4000.00"), grupo.getTotalDebitadoAceptado());
        assertEquals(1, grupo.getCantidadRefacturaciones());
        assertEquals(2, grupo.getComprobantesDerivados().size());
    }

    @Test
    @DisplayName("obtenerPrestacionesPorMotivo mapea correctamente las prestaciones para drill-down")
    void testObtenerPrestacionesPorMotivo() {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{
                10, "PEREZ JUAN", "998877", "PLAN 310", "HOSPITAL", "DR LOPEZ",
                java.sql.Date.valueOf(LocalDate.of(2026, 8, 5)), "420101", "CONSULTA",
                "NC", "A", 1, 501, java.sql.Date.valueOf(LocalDate.of(2026, 8, 20)),
                "Falta de autorización", "No autorizada en línea",
                new BigDecimal("3500.00"), true
        });

        when(mockQuery.getResultList()).thenReturn(rows);

        List<DirectorioPrestacionDetalleDTO> prestaciones = directorioService.obtenerPrestacionesPorMotivo(
                "Falta de autorización", "OSDE", null, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31)
        );

        assertNotNull(prestaciones);
        assertEquals(1, prestaciones.size());
        DirectorioPrestacionDetalleDTO p = prestaciones.get(0);
        assertEquals("PEREZ JUAN", p.getPaciente());
        assertEquals("Falta de autorización", p.getMotivoDebito());
        assertEquals("No autorizada en línea", p.getComentariosDebito());
        assertEquals(new BigDecimal("3500.00"), p.getImporteDebitado());
        assertTrue(p.getDebitoAceptado());
    }

    @Test
    @DisplayName("obtenerGruposFacturasPaginado retorna PaginatedResponseDTO con totalElements y paginación")
    void testObtenerGruposFacturasPaginado() {
        when(mockQuery.getSingleResult()).thenReturn(100L);
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{
                1L, "FC", "A", 1, 1001, java.sql.Date.valueOf(LocalDate.of(2026, 8, 1)),
                java.sql.Date.valueOf(LocalDate.of(2026, 8, 1)), "OSDE", "OSDE BINARIO",
                100L, new BigDecimal("50000.00"), 1
        });
        when(mockQuery.getResultList()).thenReturn(rows);
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrIdIn(any())).thenReturn(Collections.emptyList());

        PaginatedResponseDTO<DirectorioGrupoFacturaDTO> res = directorioService.obtenerGruposFacturasPaginado("OSDE", null, null, null, 1, 10);

        assertNotNull(res);
        assertEquals(100L, res.getTotalElements());
        assertEquals(1, res.getPage());
        assertEquals(10, res.getSize());
        assertEquals(10, res.getTotalPages());
        assertFalse(res.isFirst());
        assertFalse(res.isLast());
        assertEquals(1, res.getContent().size());
    }

    @Test
    @DisplayName("obtenerDistribucionMotivosPaginado retorna PaginatedResponseDTO con cálculo de porcentaje global")
    void testObtenerDistribucionMotivosPaginado() {
        when(mockQuery.getSingleResult()).thenReturn(new Object[]{50L, new BigDecimal("100000.00")});
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{"Falta de autorización", new BigDecimal("75000.00"), 15L});
        when(mockQuery.getResultList()).thenReturn(rows);

        PaginatedResponseDTO<DirectorioMotivoDebitoDTO> res = directorioService.obtenerDistribucionMotivosPaginado(null, null, null, null, 0, 10);

        assertNotNull(res);
        assertEquals(50L, res.getTotalElements());
        assertEquals(0, res.getPage());
        assertEquals(10, res.getSize());
        assertEquals(5, res.getTotalPages());
        assertTrue(res.isFirst());
        assertEquals(1, res.getContent().size());
        assertEquals(new BigDecimal("75.00"), res.getContent().get(0).getPorcentaje());
    }

    @Test
    @DisplayName("obtenerPrestacionesPorMotivoPaginado retorna PaginatedResponseDTO estructurado")
    void testObtenerPrestacionesPorMotivoPaginado() {
        when(mockQuery.getSingleResult()).thenReturn(75L);
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{
                10, "PEREZ JUAN", "998877", "PLAN 310", "HOSPITAL", "DR LOPEZ",
                java.sql.Date.valueOf(LocalDate.of(2026, 8, 5)), "420101", "CONSULTA",
                "NC", "A", 1, 501, java.sql.Date.valueOf(LocalDate.of(2026, 8, 20)),
                "Falta de autorización", "No autorizada en línea",
                new BigDecimal("3500.00"), true
        });
        when(mockQuery.getResultList()).thenReturn(rows);

        PaginatedResponseDTO<DirectorioPrestacionDetalleDTO> res = directorioService.obtenerPrestacionesPorMotivoPaginado(
                "Falta de autorización", "OSDE", null, null, null, 2, 25);

        assertNotNull(res);
        assertEquals(75L, res.getTotalElements());
        assertEquals(2, res.getPage());
        assertEquals(25, res.getSize());
        assertEquals(3, res.getTotalPages());
        assertTrue(res.isLast());
        assertEquals(1, res.getContent().size());
    }

    @Test
    @DisplayName("getCuentaCorrienteTresNiveles agrupa correctamente Financiador -> Periodo -> Factura Madre -> Hijos")
    void testCuentaCorrienteTresNiveles() {
        Cabecera fc = new Cabecera("FC", "A", 1, 1001, LocalDate.of(2025, 10, 10), LocalDate.of(2025, 10, 1), "FAC", "OSDE");
        fc.setId(1L);
        fc.setCobertura("OSDE");
        fc.setDebe(new BigDecimal("10000.00"));
        fc.setHaber(BigDecimal.ZERO);
        fc.setAsociadogrupo(100L);
        fc.setAsociado(1L);

        Cabecera nc = new Cabecera("NC", "A", 1, 2001, LocalDate.of(2025, 10, 15), LocalDate.of(2025, 10, 1), "NCR", "OSDE");
        nc.setId(2L);
        nc.setCobertura("OSDE");
        nc.setDebe(BigDecimal.ZERO);
        nc.setHaber(new BigDecimal("2000.00"));
        nc.setAsociadogrupo(100L);
        nc.setAsociado(1L);

        Cabecera ndRef = new Cabecera("ND", "A", 1, 3001, LocalDate.of(2025, 10, 20), LocalDate.of(2025, 10, 1), "NDB", "OSDE");
        ndRef.setId(3L);
        ndRef.setCobertura("OSDE");
        ndRef.setDebe(new BigDecimal("1500.00"));
        ndRef.setHaber(BigDecimal.ZERO);
        ndRef.setAsociadogrupo(100L);
        ndRef.setAsociado(2L);

        Cabecera rc = new Cabecera("RC", "A", 1, 4001, LocalDate.of(2025, 10, 25), LocalDate.of(2025, 10, 1), "REC", "OSDE");
        rc.setId(4L);
        rc.setCobertura("OSDE");
        rc.setDebe(BigDecimal.ZERO);
        rc.setHaber(new BigDecimal("5000.00"));
        rc.setAsociadogrupo(100L);
        rc.setAsociado(1L);

        when(cabeceraRepository.findCabecerasParaCuentaCorriente()).thenReturn(List.of(fc, nc, ndRef, rc));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(null, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());

        CcFinanciadorDTO fin = resultado.get(0);
        assertEquals("OSDE", fin.getFinanciador());
        assertEquals(new BigDecimal("10000.00"), fin.getFacturacionFc());
        assertEquals(new BigDecimal("2000.00"), fin.getDebitosNc());
        assertEquals(new BigDecimal("1500.00"), fin.getRefacturacionNd());
        assertEquals(new BigDecimal("0.00"), fin.getIncrementosNd());
        assertEquals(new BigDecimal("5000.00"), fin.getCobranzasRc());
        // Saldo = 10000 + 1500 - 2000 - 5000 = 4500.00
        assertEquals(new BigDecimal("4500.00"), fin.getSaldo());

        assertEquals(1, fin.getPeriodos().size());
        CcPeriodoDTO per = fin.getPeriodos().get(0);
        assertEquals("2025-10", per.getPeriodo());
        assertEquals(1, per.getComprobantes().size());
        assertEquals(new BigDecimal("4500.00"), per.getSaldo());

        CcComprobanteDTO fcDto = per.getComprobantes().get(0);
        assertEquals("FC", fcDto.getTipo());
        assertEquals(0, fcDto.getNivel());
        assertEquals(new BigDecimal("4500.00"), fcDto.getSaldo());
        assertNotNull(fcDto.getHijos());
        assertEquals(4, fcDto.getHijos().size());

        // Test con filtro de rango que coincide con 2025-10
        List<CcFinanciadorDTO> resCoincide = directorioService.getCuentaCorrienteTresNiveles(null, null, "2025-10-01", "2025-10-31");
        assertEquals(1, resCoincide.size());

        // Test con filtro de rango que NO coincide con 2025-10 (ej. 2025-11)
        List<CcFinanciadorDTO> resNoCoincide = directorioService.getCuentaCorrienteTresNiveles(null, null, "2025-11-01", "2025-11-30");
        assertTrue(resNoCoincide.isEmpty());
    }

    @Test
    @DisplayName("getMetricasAnalistas agrupa y mapea correctamente analistas desde notadecredito y notadedebito")
    void testGetMetricasAnalistas() {
        List<Object[]> rows = new ArrayList<>();
        // analista, motivo, financiador, monto_debitado, aceptado, refacturado, tipo_registro
        rows.add(new Object[]{"FernandaCortes", "Falta de autorización", "OSDE", new BigDecimal("10000.00"), new BigDecimal("8000.00"), new BigDecimal("2000.00"), "Ambulatorios"});
        rows.add(new Object[]{"NataliaMartinez", "Sin motivo especificado", "SWISS MEDICAL", new BigDecimal("5000.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, "Internados"});

        when(mockQuery.getResultList()).thenReturn(rows);

        List<MetricaAnalistaDTO> analistas = directorioService.getMetricasAnalistas(null);

        assertNotNull(analistas);
        assertEquals(2, analistas.size());
        assertEquals("FernandaCortes", analistas.get(0).getAnalista());
        assertEquals(1, analistas.get(0).getCantidadRegistros());
        assertEquals(new BigDecimal("8000.00"), analistas.get(0).getDebitosAceptados());
        assertEquals(new BigDecimal("2000.00"), analistas.get(0).getDebitosRefacturados());
        assertEquals(new BigDecimal("10000.00"), analistas.get(0).getTotalTramitado());
        assertEquals(1, analistas.get(0).getCantidadAmb());
        assertEquals(0, analistas.get(0).getCantidadInt());
        assertEquals("100% Amb / 0% Int", analistas.get(0).getDistribucionAtencion());
    }

    @Test
    @DisplayName("obtenerBalanceFinanciero mapea correctamente las columnas y aplica filtros")
    void testObtenerBalanceFinancieroConFiltros() {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{
            "443 - OSDE",
            new BigDecimal("500000.00"),
            new BigDecimal("10000.00"),
            new BigDecimal("20000.00"),
            new BigDecimal("15000.00"),
            new BigDecimal("300000.00"),
            new BigDecimal("190000.00")
        });

        when(mockQuery.getResultList()).thenReturn(rows);

        List<BalanceFinanciadorDTO> result = directorioService.obtenerBalanceFinanciero(
            "443", "FC", LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31)
        );

        assertNotNull(result);
        assertEquals(1, result.size());
        BalanceFinanciadorDTO dto = result.get(0);
        assertEquals("443 - OSDE", dto.getFinanciador());
        assertEquals(new BigDecimal("500000.00"), dto.getFacturacionFc());
        assertEquals(new BigDecimal("10000.00"), dto.getIncrementosNd());
        assertEquals(new BigDecimal("20000.00"), dto.getDebitosNc());
        assertEquals(new BigDecimal("15000.00"), dto.getRefacturadoNd());
        assertEquals(new BigDecimal("300000.00"), dto.getCobradoRc());
        assertEquals(new BigDecimal("190000.00"), dto.getSaldoPendiente());
    }

    @Test
    @DisplayName("obtenerDistribucionCarteraDonut mapea financiador y saldo pendiente positivo con filtros")
    void testObtenerDistribucionCarteraDonutConFiltros() {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{"443 - OSDE", new BigDecimal("150000.00")});
        rows.add(new Object[]{"502 - PAMI", new BigDecimal("250000.00")});

        when(mockQuery.getResultList()).thenReturn(rows);

        List<PuntoDonutDTO> result = directorioService.obtenerDistribucionCarteraDonut(
            null, null, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31)
        );

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("443 - OSDE", result.get(0).getEtiqueta());
        assertEquals(new BigDecimal("150000.00"), result.get(0).getSaldo());
    }

    @Test
    @DisplayName("getEvolucionMensual retorna los 3 datasets (Facturación, Débitos, Cobranzas) con filtros")
    void testGetEvolucionMensualConFiltros() {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{
            "2026-05",
            new BigDecimal("1000000.00"),
            new BigDecimal("50000.00"),
            new BigDecimal("600000.00")
        });

        when(mockQuery.getResultList()).thenReturn(rows);

        List<DatasetGraficoDTO> datasets = directorioService.getEvolucionMensual(
            "443", null, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31)
        );

        assertNotNull(datasets);
        assertEquals(3, datasets.size());
        assertEquals("Facturación", datasets.get(0).getTituloDataset());
        assertEquals(12, datasets.get(0).getPuntos().size());
        assertEquals("2026-05", datasets.get(0).getPuntos().get(11).getEtiqueta());
        assertEquals(new BigDecimal("1000000.00"), datasets.get(0).getPuntos().get(11).getValor());

        assertEquals("Débitos", datasets.get(1).getTituloDataset());
        assertEquals(new BigDecimal("50000.00"), datasets.get(1).getPuntos().get(11).getValor());

        assertEquals("Cobranzas", datasets.get(2).getTituloDataset());
        assertEquals(new BigDecimal("600000.00"), datasets.get(2).getPuntos().get(11).getValor());
    }

    @Test
    @DisplayName("getTiemposCobranza calcula métricas diferenciando cobrados por tramo y aún no cobrados")
    void testGetTiemposCobranzaConFiltros() {
        List<Object[]> rows = new ArrayList<>();
        // Caso del usuario: factura de $10000, cobro $1000 a los 15 días, cobro $7000 a los 185 días, pendiente $2000 a los 200 días
        rows.add(new Object[]{"COBRADO", 15, new BigDecimal("1000.00")});
        rows.add(new Object[]{"COBRADO", 185, new BigDecimal("7000.00")});
        rows.add(new Object[]{"PENDIENTE", 200, new BigDecimal("2000.00")});

        when(mockQuery.getResultList()).thenReturn(rows);

        TiemposCobranzaDTO dto = directorioService.getTiemposCobranza("OSDE", "FC", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 8, 31));

        assertNotNull(dto);
        // Saldo total mora = 2000.00
        assertEquals(new BigDecimal("2000.00"), dto.getSaldoTotalMora());
        // DSO = 200 días
        assertEquals(200, dto.getDsoGlobal());
        // Cobro Real Promedio = (15*1000 + 185*7000)/8000 = 1310000 / 8000 = 164
        assertEquals(164, dto.getCobroRealPromedio());

        // Verificar los 6 rangos
        List<RangoAntiguedadDTO> detalles = dto.getDetalles();
        assertEquals(6, detalles.size());

        // 0 a 30 días
        assertEquals("De 0 a 30 días", detalles.get(0).getRango());
        assertEquals(1, detalles.get(0).getCantidadComprobantes());
        assertEquals(new BigDecimal("1000.00"), detalles.get(0).getSaldoEnMora());
        assertEquals(new BigDecimal("10.0"), detalles.get(0).getPorcentajeCartera());

        // 31 a 60 días
        assertEquals("De 31 a 60 días", detalles.get(1).getRango());
        assertEquals(0, detalles.get(1).getCantidadComprobantes());
        assertEquals(BigDecimal.ZERO, detalles.get(1).getSaldoEnMora());
        assertEquals(0, BigDecimal.ZERO.compareTo(detalles.get(1).getPorcentajeCartera()));

        // 61 a 90 días
        assertEquals("De 61 a 90 días", detalles.get(2).getRango());
        assertEquals(0, detalles.get(2).getCantidadComprobantes());
        assertEquals(BigDecimal.ZERO, detalles.get(2).getSaldoEnMora());

        // 91 a 180 días
        assertEquals("De 91 a 180 días", detalles.get(3).getRango());
        assertEquals(0, detalles.get(3).getCantidadComprobantes());

        // Más de 180 días
        assertEquals("Más de 180 días", detalles.get(4).getRango());
        assertEquals(1, detalles.get(4).getCantidadComprobantes());
        assertEquals(new BigDecimal("7000.00"), detalles.get(4).getSaldoEnMora());
        assertEquals(new BigDecimal("70.0"), detalles.get(4).getPorcentajeCartera());

        // Aún no cobrados
        assertEquals("Aún no cobrados", detalles.get(5).getRango());
        assertEquals(1, detalles.get(5).getCantidadComprobantes());
        assertEquals(new BigDecimal("2000.00"), detalles.get(5).getSaldoEnMora());
        assertEquals(new BigDecimal("20.0"), detalles.get(5).getPorcentajeCartera());
    }

    @Test
    @DisplayName("getCuentaCorrienteTresNiveles clasifica como Incremento una ND asociada a una Factura")
    void testCuentaCorrienteTresNiveles_conNdIncrementoAsociadaAFactura() {
        Cabecera fc = new Cabecera("FC", "A", 1, 1001, LocalDate.of(2025, 10, 10), LocalDate.of(2025, 10, 1), "FAC", "SWISS MEDICAL");
        fc.setId(10L);
        fc.setCobertura("SWISS MEDICAL");
        fc.setDebe(new BigDecimal("20000.00"));
        fc.setHaber(BigDecimal.ZERO);
        fc.setAsociadogrupo(200L);
        fc.setAsociado(10L);

        // ND con asociado = 10L (apunta a FC). No está en findIdsNdHijosDeNc().
        Cabecera ndInc = new Cabecera("ND", "A", 1, 3002, LocalDate.of(2025, 10, 22), LocalDate.of(2025, 10, 1), "NDB", "SWISS MEDICAL");
        ndInc.setId(30L);
        ndInc.setCobertura("SWISS MEDICAL");
        ndInc.setDebe(new BigDecimal("3000.00"));
        ndInc.setHaber(BigDecimal.ZERO);
        ndInc.setAsociadogrupo(200L);
        ndInc.setAsociado(10L);

        when(cabeceraRepository.findCabecerasParaCuentaCorriente()).thenReturn(List.of(fc, ndInc));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(null, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        CcFinanciadorDTO fin = resultado.get(0);
        assertEquals("SWISS MEDICAL", fin.getFinanciador());
        assertEquals(new BigDecimal("20000.00"), fin.getFacturacionFc());
        assertEquals(new BigDecimal("3000.00"), fin.getIncrementosNd());
        assertEquals(new BigDecimal("0.00"), fin.getRefacturacionNd());
        // Saldo = 20000 + 3000 = 23000.00
        assertEquals(new BigDecimal("23000.00"), fin.getSaldo());
    }

    @Test
    @DisplayName("getCuentaCorrienteTresNiveles descarta comprobantes que no tienen Factura Madre (FC)")
    void testCuentaCorrienteTresNiveles_descartaComprobantesSinFacturaMadre() {
        // Familia 1: Solo un Recibo RC sin factura madre
        Cabecera rcHuerfano = new Cabecera("RC", "A", 1, 9001, LocalDate.of(2025, 11, 15), LocalDate.of(2025, 11, 1), "REC", "IOMA");
        rcHuerfano.setId(99L);
        rcHuerfano.setCobertura("IOMA");
        rcHuerfano.setDebe(BigDecimal.ZERO);
        rcHuerfano.setHaber(new BigDecimal("50000.00"));
        rcHuerfano.setAsociadogrupo(999L);

        // Familia 2: Una NC y ND sin FC raíz
        Cabecera ncHuerfana = new Cabecera("NC", "A", 1, 9002, LocalDate.of(2025, 11, 16), LocalDate.of(2025, 11, 1), "NCA", "IOMA");
        ncHuerfana.setId(101L);
        ncHuerfana.setCobertura("IOMA");
        ncHuerfana.setDebe(BigDecimal.ZERO);
        ncHuerfana.setHaber(new BigDecimal("10000.00"));
        ncHuerfana.setAsociadogrupo(888L);

        Cabecera ndHuerfana = new Cabecera("ND", "A", 1, 9003, LocalDate.of(2025, 11, 17), LocalDate.of(2025, 11, 1), "NDA", "IOMA");
        ndHuerfana.setId(102L);
        ndHuerfana.setCobertura("IOMA");
        ndHuerfana.setDebe(new BigDecimal("10000.00"));
        ndHuerfana.setHaber(BigDecimal.ZERO);
        ndHuerfana.setAsociadogrupo(888L);
        ndHuerfana.setAsociado(101L);

        when(cabeceraRepository.findCabecerasParaCuentaCorriente()).thenReturn(List.of(rcHuerfano, ncHuerfana, ndHuerfana));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(null, null);

        assertNotNull(resultado);
        // Ambas familias deben ser descartadas por no tener Factura Madre (FC)
        assertTrue(resultado.isEmpty());
    }

    @Test
    @DisplayName("getCuentaCorrienteTresNiveles clasifica correctamente Refactura cuando el asociado contiene N")
    void testCuentaCorrienteTresNiveles_clasificaNdPorRefacturaCuandoApuntaANc() {
        Cabecera fc = new Cabecera("FC", "A", 1, 1001, LocalDate.of(2025, 11, 10), LocalDate.of(2025, 11, 1), "FAC", "MEDIFE");
        fc.setId(50L);
        fc.setCobertura("MEDIFE");
        fc.setDebe(new BigDecimal("50000.00"));
        fc.setHaber(BigDecimal.ZERO);
        fc.setAsociadogrupo(500L);
        fc.setAsociado(50L);

        Cabecera nc = new Cabecera("NC", "A", 1, 2001, LocalDate.of(2025, 11, 12), LocalDate.of(2025, 11, 1), "NCE", "MEDIFE");
        nc.setId(51L);
        nc.setCobertura("MEDIFE");
        nc.setDebe(BigDecimal.ZERO);
        nc.setHaber(new BigDecimal("8000.00"));
        nc.setAsociadogrupo(500L);
        nc.setAsociado(50L);

        Cabecera ndRef = new Cabecera("ND", "A", 1, 3001, LocalDate.of(2025, 11, 14), LocalDate.of(2025, 11, 1), "NDE", "MEDIFE");
        ndRef.setId(52L);
        ndRef.setCobertura("MEDIFE");
        ndRef.setDebe(new BigDecimal("8000.00"));
        ndRef.setHaber(BigDecimal.ZERO);
        ndRef.setAsociadogrupo(500L);
        ndRef.setAsociado(51L); // Apunta a NC (tipo NCE contiene 'N')

        when(cabeceraRepository.findCabecerasParaCuentaCorriente()).thenReturn(List.of(fc, nc, ndRef));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(null, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        CcFinanciadorDTO fin = resultado.get(0);
        assertEquals(new BigDecimal("50000.00"), fin.getFacturacionFc());
        assertEquals(new BigDecimal("8000.00"), fin.getDebitosNc());
        assertEquals(new BigDecimal("8000.00"), fin.getRefacturacionNd());
        assertEquals(new BigDecimal("0.00"), fin.getIncrementosNd());
    }

    @Test
    @DisplayName("getCuentaCorrienteTresNiveles no contabiliza FC y NC cuando ambos tienen el mismo monto y diferencia <= 15 días")
    void testCuentaCorrienteTresNiveles_descartaFcYNcCuandoMismoMontoYMenorIgual15Dias() {
        // Caso A: Anulación directa (FC y NC por $100.000 con 5 días de diferencia) -> DEBEN DESCARTARSE AMBAS
        Cabecera fcAnulada = new Cabecera("FC", "A", 1, 1001, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 1), "FAC", "OSDE");
        fcAnulada.setId(101L);
        fcAnulada.setCobertura("OSDE");
        fcAnulada.setDebe(new BigDecimal("100000.00"));
        fcAnulada.setHaber(BigDecimal.ZERO);
        fcAnulada.setAsociadogrupo(101L);
        fcAnulada.setAsociado(101L);

        Cabecera ncAnuladora = new Cabecera("NC", "A", 1, 2001, LocalDate.of(2026, 8, 6), LocalDate.of(2026, 8, 1), "NCR", "OSDE");
        ncAnuladora.setId(102L);
        ncAnuladora.setCobertura("OSDE");
        ncAnuladora.setDebe(BigDecimal.ZERO);
        ncAnuladora.setHaber(new BigDecimal("100000.00")); // Mismo monto
        ncAnuladora.setAsociadogrupo(101L);
        ncAnuladora.setAsociado(101L); // Apunta a fcAnulada, diferencia: 5 días (<= 15)

        // Caso B: FC normal con NC parcial o con más de 15 días -> DEBE CONTABILIZARSE
        Cabecera fcValida = new Cabecera("FC", "A", 1, 1002, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 1), "FAC", "SWISS");
        fcValida.setId(201L);
        fcValida.setCobertura("SWISS");
        fcValida.setDebe(new BigDecimal("50000.00"));
        fcValida.setHaber(BigDecimal.ZERO);
        fcValida.setAsociadogrupo(201L);
        fcValida.setAsociado(201L);

        Cabecera ncValida = new Cabecera("NC", "A", 1, 2002, LocalDate.of(2026, 8, 25), LocalDate.of(2026, 8, 1), "NCR", "SWISS");
        ncValida.setId(202L);
        ncValida.setCobertura("SWISS");
        ncValida.setDebe(BigDecimal.ZERO);
        ncValida.setHaber(new BigDecimal("50000.00")); // Mismo monto pero 24 días de diferencia (> 15 días)
        ncValida.setAsociadogrupo(201L);
        ncValida.setAsociado(201L);

        when(cabeceraRepository.findCabecerasParaCuentaCorriente()).thenReturn(List.of(fcAnulada, ncAnuladora, fcValida, ncValida));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(null, null);

        assertNotNull(resultado);
        // OSDE no debe aparecer porque su FC y NC fueron anuladas al 100% en <= 15 días
        assertEquals(1, resultado.size());
        CcFinanciadorDTO swiss = resultado.get(0);
        assertEquals("SWISS", swiss.getFinanciador());
        assertEquals(new BigDecimal("50000.00"), swiss.getFacturacionFc());
        assertEquals(new BigDecimal("50000.00"), swiss.getDebitosNc());
    }

    @Test
    @DisplayName("Caso 1: FC en comprobantes_anulados y NC anuladora con <= 15 días y mismo monto son descartadas")
    void testCuentaCorrienteTresNiveles_caso1_fcEnComprobantesAnuladosYNcAnuladora() {
        Cabecera fcAnulada = new Cabecera("FC", "A", 1, 1001, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 1), "FAC", "OSDE");
        fcAnulada.setId(101L);
        fcAnulada.setCobertura("OSDE");
        fcAnulada.setDebe(new BigDecimal("100000.00"));
        fcAnulada.setHaber(BigDecimal.ZERO);
        fcAnulada.setAsociadogrupo(101L);
        fcAnulada.setAsociado(101L);

        Cabecera ncAnuladora = new Cabecera("NC", "A", 1, 2001, LocalDate.of(2026, 8, 6), LocalDate.of(2026, 8, 1), "NCR", "OSDE");
        ncAnuladora.setId(102L);
        ncAnuladora.setCobertura("OSDE");
        ncAnuladora.setDebe(BigDecimal.ZERO);
        ncAnuladora.setHaber(new BigDecimal("100000.00"));
        ncAnuladora.setAsociadogrupo(101L);
        ncAnuladora.setAsociado(101L);

        when(comprobanteAnuladoRepository.findIdsCabeceraAnulados()).thenReturn(List.of(101L));
        when(cabeceraRepository.findCabecerasParaCuentaCorriente()).thenReturn(List.of(fcAnulada, ncAnuladora));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(null, null);

        assertNotNull(resultado);
        assertTrue(resultado.isEmpty(), "Ambos comprobantes deben ser descartados del tablero");
    }

    @Test
    @DisplayName("Caso 2: NC en comprobantes_anulados y ND anuladora con <= 15 días y mismo monto son descartadas")
    void testCuentaCorrienteTresNiveles_caso2_ncEnComprobantesAnuladosYNdAnuladora() {
        Cabecera fcRaiz = new Cabecera("FC", "A", 1, 1001, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 1), "FAC", "SWISS");
        fcRaiz.setId(201L);
        fcRaiz.setCobertura("SWISS");
        fcRaiz.setDebe(new BigDecimal("100000.00"));
        fcRaiz.setHaber(BigDecimal.ZERO);
        fcRaiz.setAsociadogrupo(201L);
        fcRaiz.setAsociado(201L);

        Cabecera ncAnulada = new Cabecera("NC", "A", 1, 2001, LocalDate.of(2026, 8, 5), LocalDate.of(2026, 8, 1), "NCE", "SWISS");
        ncAnulada.setId(202L);
        ncAnulada.setCobertura("SWISS");
        ncAnulada.setDebe(BigDecimal.ZERO);
        ncAnulada.setHaber(new BigDecimal("25000.00"));
        ncAnulada.setAsociadogrupo(201L);
        ncAnulada.setAsociado(201L);

        Cabecera ndAnuladora = new Cabecera("ND", "A", 1, 3001, LocalDate.of(2026, 8, 8), LocalDate.of(2026, 8, 1), "NDE", "SWISS");
        ndAnuladora.setId(203L);
        ndAnuladora.setCobertura("SWISS");
        ndAnuladora.setDebe(new BigDecimal("25000.00"));
        ndAnuladora.setHaber(BigDecimal.ZERO);
        ndAnuladora.setAsociadogrupo(201L);
        ndAnuladora.setAsociado(202L); // Apunta a NC anulada, diff = 3 días (<= 15), monto coincide

        when(comprobanteAnuladoRepository.findIdsCabeceraAnulados()).thenReturn(List.of(202L));
        when(cabeceraRepository.findCabecerasParaCuentaCorriente()).thenReturn(List.of(fcRaiz, ncAnulada, ndAnuladora));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(null, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        CcFinanciadorDTO swiss = resultado.get(0);
        assertEquals("SWISS", swiss.getFinanciador());
        assertEquals(new BigDecimal("100000.00"), swiss.getFacturacionFc());
        assertEquals(new BigDecimal("0.00"), swiss.getDebitosNc(), "NC anulada debe ser excluida");
        assertEquals(new BigDecimal("0.00"), swiss.getRefacturacionNd(), "ND anuladora debe ser excluida");
    }

    @Test
    @DisplayName("Caso 3: ND en comprobantes_anulados y NC anuladora con <= 15 días y mismo monto son descartadas")
    void testCuentaCorrienteTresNiveles_caso3_ndEnComprobantesAnuladosYNcAnuladora() {
        Cabecera fcRaiz = new Cabecera("FC", "A", 1, 1001, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 1), "FAC", "OSDE");
        fcRaiz.setId(301L);
        fcRaiz.setCobertura("OSDE");
        fcRaiz.setDebe(new BigDecimal("100000.00"));
        fcRaiz.setHaber(BigDecimal.ZERO);
        fcRaiz.setAsociadogrupo(301L);
        fcRaiz.setAsociado(301L);

        Cabecera ndAnulada = new Cabecera("ND", "A", 1, 3001, LocalDate.of(2026, 8, 4), LocalDate.of(2026, 8, 1), "NDA", "OSDE");
        ndAnulada.setId(302L);
        ndAnulada.setCobertura("OSDE");
        ndAnulada.setDebe(new BigDecimal("15000.00"));
        ndAnulada.setHaber(BigDecimal.ZERO);
        ndAnulada.setAsociadogrupo(301L);
        ndAnulada.setAsociado(301L);

        Cabecera ncAnuladora = new Cabecera("NC", "A", 1, 2001, LocalDate.of(2026, 8, 9), LocalDate.of(2026, 8, 1), "NCA", "OSDE");
        ncAnuladora.setId(303L);
        ncAnuladora.setCobertura("OSDE");
        ncAnuladora.setDebe(BigDecimal.ZERO);
        ncAnuladora.setHaber(new BigDecimal("15000.00"));
        ncAnuladora.setAsociadogrupo(301L);
        ncAnuladora.setAsociado(302L); // Apunta a ND anulada, diff = 5 días (<= 15), monto coincide

        when(comprobanteAnuladoRepository.findIdsCabeceraAnulados()).thenReturn(List.of(302L));
        when(cabeceraRepository.findCabecerasParaCuentaCorriente()).thenReturn(List.of(fcRaiz, ndAnulada, ncAnuladora));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(null, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        CcFinanciadorDTO osde = resultado.get(0);
        assertEquals("OSDE", osde.getFinanciador());
        assertEquals(new BigDecimal("100000.00"), osde.getFacturacionFc());
        assertEquals(new BigDecimal("0.00"), osde.getIncrementosNd(), "ND anulada debe ser excluida");
    }

    @Test
    @DisplayName("getCuentaCorrienteTresNiveles filtra exclusivamente por columna Periodo y nunca por Fecha")
    void testCuentaCorrienteFiltroPorPeriodoExcluyeUsoDeFecha() {
        // Factura con Período = 2024-01-01, pero Fecha de emisión = 2024-11-15 (diferente mes)
        Cabecera fc = new Cabecera("FC", "A", 1, 5001, LocalDate.of(2024, 11, 15), LocalDate.of(2024, 1, 1), "FAC", "SWISS MEDICAL");
        fc.setId(50L);
        fc.setCobertura("SWISS MEDICAL");
        fc.setDebe(new BigDecimal("25000.00"));
        fc.setHaber(BigDecimal.ZERO);
        fc.setAsociadogrupo(50L);
        fc.setAsociado(50L);

        // NC vinculada emitida meses después
        Cabecera nc = new Cabecera("NC", "A", 1, 6001, LocalDate.of(2024, 6, 10), LocalDate.of(2024, 6, 1), "NCR", "SWISS MEDICAL");
        nc.setId(51L);
        nc.setCobertura("SWISS MEDICAL");
        nc.setDebe(BigDecimal.ZERO);
        nc.setHaber(new BigDecimal("5000.00"));
        nc.setAsociadogrupo(50L);
        nc.setAsociado(50L);

        when(cabeceraRepository.findCabecerasParaCuentaCorriente()).thenReturn(List.of(fc, nc));

        // 1. Filtrando por el período 2024-01-01 a 2024-03-01: DEBE incluirse porque su período es 2024-01-01
        List<CcFinanciadorDTO> resPeriodoCoincide = directorioService.getCuentaCorrienteTresNiveles(
                null, null, "2024-01-01", "2024-03-01"
        );
        assertEquals(1, resPeriodoCoincide.size());
        assertEquals("SWISS MEDICAL", resPeriodoCoincide.get(0).getFinanciador());
        assertEquals("2024-01", resPeriodoCoincide.get(0).getPeriodos().get(0).getPeriodo());
        // La NC emitida en junio debe acompañar a la factura madre en su período 2024-01
        assertEquals(new BigDecimal("25000.00"), resPeriodoCoincide.get(0).getFacturacionFc());
        assertEquals(new BigDecimal("5000.00"), resPeriodoCoincide.get(0).getDebitosNc());

        // 2. Filtrando por el mes de la fecha de emisión (2024-11-01 a 2024-11-30): NO debe incluirse porque su período es enero
        List<CcFinanciadorDTO> resPorFecha = directorioService.getCuentaCorrienteTresNiveles(
                null, null, "2024-11-01", "2024-11-30"
        );
        assertTrue(resPorFecha.isEmpty(), "No debe incluirse por fecha de emisión; solo por columna período");

        // 3. Si la factura tiene periodo nulo, no debe tomar la fecha de emisión y debe quedar descartada
        fc.setPeriodo(null);
        List<CcFinanciadorDTO> resSinPeriodo = directorioService.getCuentaCorrienteTresNiveles(
                null, null, "2024-11-01", "2024-11-30"
        );
        assertTrue(resSinPeriodo.isEmpty(), "Factura sin columna período no debe usar columna fecha como fallback");
    }

    @Test
    @DisplayName("getBuclesInsistencia desglosa correctamente las prestaciones y muestra los montos individuales de cada prestación")
    void testBuclesInsistencia_desglosaPorPrestacionConMontosIndividuales() {
        Cabecera fcRaiz = new Cabecera("FC", "A", 30, 5081, LocalDate.of(2025, 8, 8), LocalDate.of(2025, 8, 1), "FAC", "OSDE");
        fcRaiz.setId(100L);
        fcRaiz.setDebe(new BigDecimal("50000000.00"));
        fcRaiz.setAsociadogrupo(100L);

        Cabecera nc1 = new Cabecera("NC", "A", 30, 1442, LocalDate.of(2025, 9, 30), LocalDate.of(2025, 8, 1), "NCA", "OSDE");
        nc1.setId(101L);
        nc1.setHaber(new BigDecimal("6000000.00"));
        nc1.setAsociadogrupo(100L);

        Cabecera nd1 = new Cabecera("ND", "A", 32, 2052, LocalDate.of(2025, 12, 2), LocalDate.of(2025, 8, 1), "NDA", "OSDE");
        nd1.setId(102L);
        nd1.setDebe(new BigDecimal("5000000.00"));
        nd1.setAsociadogrupo(100L);

        Cabecera nc2 = new Cabecera("NC", "A", 32, 7513, LocalDate.of(2026, 1, 28), LocalDate.of(2025, 8, 1), "NCA", "OSDE");
        nc2.setId(103L);
        nc2.setHaber(new BigDecimal("4000000.00"));
        nc2.setAsociadogrupo(100L);

        Cabecera nd2 = new Cabecera("ND", "A", 32, 2053, LocalDate.of(2026, 2, 1), LocalDate.of(2025, 8, 1), "NDA", "OSDE");
        nd2.setId(104L);
        nd2.setDebe(new BigDecimal("5000000.00"));
        nd2.setAsociadogrupo(100L);

        AmbLiquidado prestacion = new AmbLiquidado();
        prestacion.setId(777);
        prestacion.setCodigo("420101");
        prestacion.setDescripcion("CONSULTA MEDICA");
        prestacion.setPaciente("PEREZ JUAN");
        prestacion.setCarnet("123456");
        prestacion.setMedico("DR LOPEZ");
        prestacion.setTotal(new BigDecimal("12500.00"));
        prestacion.setCabecera(fcRaiz);

        NotaDeCredito ncItem1 = new NotaDeCredito();
        ncItem1.setId(1);
        ncItem1.setCabecera(nc1);
        ncItem1.setPrestacion(prestacion);
        ncItem1.setImporteDebitado(new BigDecimal("12500.00"));
        ncItem1.setMotivoDebito("Falta justificación");

        NotaDeDebito ndItem1 = new NotaDeDebito();
        ndItem1.setId(2);
        ndItem1.setCabecera(nd1);
        ndItem1.setPrestacion(prestacion);
        ndItem1.setNotaDeCreditoPadre(ncItem1);
        ndItem1.setImporterefactura(new BigDecimal("12500.00"));
        ndItem1.setMotivorefactura("Se adjunta informe");

        NotaDeCredito ncItem2 = new NotaDeCredito();
        ncItem2.setId(3);
        ncItem2.setCabecera(nc2);
        ncItem2.setPrestacion(prestacion);
        ncItem2.setNotaDeDebitoPadre(ndItem1);
        ncItem2.setImporteDebitado(new BigDecimal("12500.00"));
        ncItem2.setMotivoDebito("Rechazo definitivo");

        NotaDeDebito ndItem2 = new NotaDeDebito();
        ndItem2.setId(5);
        ndItem2.setCabecera(nd2);
        ndItem2.setPrestacion(prestacion);
        ndItem2.setNotaDeCreditoPadre(ncItem2);
        ndItem2.setImporterefactura(new BigDecimal("12500.00"));
        ndItem2.setMotivorefactura("Reinsistencia con historia clínica");

        AmbLiquidado prestacion2Solo1Nc = new AmbLiquidado();
        prestacion2Solo1Nc.setId(888);
        prestacion2Solo1Nc.setCodigo("1003");
        prestacion2Solo1Nc.setDescripcion("FRUCTOSAMINA");
        prestacion2Solo1Nc.setPaciente("VILLALBA ALEJANDRO");
        prestacion2Solo1Nc.setTotal(new BigDecimal("9097.27"));
        prestacion2Solo1Nc.setCabecera(fcRaiz);

        NotaDeCredito ncItemSolo1Nc = new NotaDeCredito();
        ncItemSolo1Nc.setId(4);
        ncItemSolo1Nc.setCabecera(nc1);
        ncItemSolo1Nc.setPrestacion(prestacion2Solo1Nc);
        ncItemSolo1Nc.setImporteDebitado(new BigDecimal("9097.27"));

        when(cabeceraRepository.findIdsGruposConMultiplesNc(any(), any())).thenReturn(List.of(100L));
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrIdIn(any())).thenReturn(List.of(fcRaiz, nc1, nd1, nc2, nd2));
        when(ambLiquidadoRepository.findByCabecera_IdIn(any())).thenReturn(List.of(prestacion, prestacion2Solo1Nc));
        when(notaDeCreditoRepository.findByCabecera_IdIn(any())).thenReturn(List.of(ncItem1, ncItem2, ncItemSolo1Nc));
        when(notaDeDebitoRepository.findByCabecera_IdIn(any())).thenReturn(List.of(ndItem1, ndItem2));

        List<CadenaTrazabilidadDTO> resultado = directorioService.getBuclesInsistencia(null, null, null, "2025-08-01", "2026-02-01");

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        CadenaTrazabilidadDTO facturaCadena = resultado.get(0);
        assertNotNull(facturaCadena.getPrestaciones());
        // Solo debe incluir la prestación 777 (2 ND y 2 NC), excluyendo la 888 (1 sola NC y 0 ND)
        assertEquals(1, facturaCadena.getPrestaciones().size(), "Solo deben incluirse prestaciones con >= 2 NDs y >= 1 NC");

        BuclePrestacionDTO buclePresta = facturaCadena.getPrestaciones().get(0);
        assertEquals("420101", buclePresta.getCodigo());
        assertEquals("CONSULTA MEDICA", buclePresta.getDescripcion());
        assertEquals("PEREZ JUAN", buclePresta.getPaciente());
        assertEquals(new BigDecimal("12500.00"), buclePresta.getMontoFacturadoOriginal(), "Debe mostrar el monto de la prestación, no de la factura");
        assertEquals(new BigDecimal("25000.00"), buclePresta.getTotalDebitado());
        assertEquals(2, buclePresta.getCantidadRefacturaciones());
        assertEquals(2, buclePresta.getCantidadDebitos());
        assertEquals(5, buclePresta.getHistorialEventos().size(), "FC + NC1 + ND1 + NC2 + ND2");
        assertEquals(new BigDecimal("12500.00"), buclePresta.getHistorialEventos().get(0).getMonto());
    }

    @Test
    @DisplayName("Bucles de insistencia no debe fallar cuando existe un registro huérfano con ObjectNotFoundException")
    void testBuclesInsistencia_toleraPrestacionHuerfanaSinLanzarExcepcion() {
        Cabecera fcRaiz = new Cabecera();
        fcRaiz.setId(200L);
        fcRaiz.setTipo("FC");
        fcRaiz.setLetra("A");
        fcRaiz.setPtovta(1);
        fcRaiz.setNumero(2001);
        fcRaiz.setGrupo(200L);
        fcRaiz.setFecha(LocalDate.of(2025, 9, 1));
        fcRaiz.setPeriodo(LocalDate.of(2025, 9, 1));
        fcRaiz.setCobertura("OSDE");
        fcRaiz.setDebe(new BigDecimal("50000.00"));

        Cabecera nc1 = new Cabecera();
        nc1.setId(201L);
        nc1.setTipo("NC");
        nc1.setLetra("A");
        nc1.setPtovta(1);
        nc1.setNumero(3001);
        nc1.setGrupo(200L);
        nc1.setAsociadogrupo(200L);
        nc1.setFecha(LocalDate.of(2025, 10, 1));
        nc1.setHaber(new BigDecimal("10000.00"));

        Cabecera nd1 = new Cabecera();
        nd1.setId(202L);
        nd1.setTipo("ND");
        nd1.setLetra("A");
        nd1.setPtovta(1);
        nd1.setNumero(4001);
        nd1.setGrupo(200L);
        nd1.setAsociadogrupo(200L);
        nd1.setFecha(LocalDate.of(2025, 11, 1));
        nd1.setDebe(new BigDecimal("10000.00"));

        Cabecera nc2 = new Cabecera();
        nc2.setId(203L);
        nc2.setTipo("NC");
        nc2.setLetra("A");
        nc2.setPtovta(1);
        nc2.setNumero(3002);
        nc2.setGrupo(200L);
        nc2.setAsociadogrupo(200L);
        nc2.setFecha(LocalDate.of(2025, 12, 1));
        nc2.setHaber(new BigDecimal("10000.00"));

        // Mock de prestación huérfana que simula el error de Hibernate
        AmbLiquidado prestacionHuerfana = mock(AmbLiquidado.class);
        when(prestacionHuerfana.getCodigo()).thenThrow(new org.hibernate.ObjectNotFoundException(
                11698928, "com.debitos.backend.model.AmbLiquidado"));

        NotaDeCredito ncItemHuerfano = new NotaDeCredito();
        ncItemHuerfano.setId(99);
        ncItemHuerfano.setCabecera(nc1);
        ncItemHuerfano.setPrestacion(prestacionHuerfana);
        ncItemHuerfano.setImporteDebitado(new BigDecimal("10000.00"));

        when(cabeceraRepository.findIdsGruposConMultiplesNc(any(), any())).thenReturn(List.of(200L));
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrIdIn(any())).thenReturn(List.of(fcRaiz, nc1, nd1, nc2));
        when(ambLiquidadoRepository.findByCabecera_IdIn(any())).thenReturn(Collections.emptyList());
        when(notaDeCreditoRepository.findByCabecera_IdIn(any())).thenReturn(List.of(ncItemHuerfano));
        when(notaDeDebitoRepository.findByCabecera_IdIn(any())).thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> {
            List<CadenaTrazabilidadDTO> resultado = directorioService.getBuclesInsistencia(
                    null, null, null, "2024-01-01", "2026-01-31");
            assertNotNull(resultado);
            // La prestación huérfana debe ser descartada sin provocar un error 500
            assertTrue(resultado.isEmpty() || resultado.get(0).getPrestaciones().isEmpty());
        });
    }
}
