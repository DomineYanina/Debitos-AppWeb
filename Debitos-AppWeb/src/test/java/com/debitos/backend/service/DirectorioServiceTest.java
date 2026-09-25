package com.debitos.backend.service;

import com.debitos.backend.dto.directorio.*;
import com.debitos.backend.dto.reportes.*;
import com.debitos.backend.model.Cabecera;
import com.debitos.backend.model.NotaDeCredito;
import com.debitos.backend.model.NotaDeDebito;
import com.debitos.backend.repository.CabeceraRepository;
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
    private Query mockQuery;

    @InjectMocks
    private DirectorioService directorioService;

    @BeforeEach
    void setUp() {
        lenient().when(entityManager.createNativeQuery(anyString())).thenReturn(mockQuery);
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
        assertEquals(new BigDecimal("10000.00"), totales.getPerdidaAsumida());
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
        when(cabeceraRepository.findIdsNdHijosDeNc()).thenReturn(List.of(3L));

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
        assertEquals(3, fcDto.getHijos().size());

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
        rows.add(new Object[]{"NataliaMartinez", "Débito recibido", "SWISS MEDICAL", new BigDecimal("5000.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, "Internados"});

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
    @DisplayName("getTiemposCobranza calcula métricas de aging y DSO con y sin filtros")
    void testGetTiemposCobranzaConFiltros() {
        List<Object[]> rows = new ArrayList<>();
        // Row 1: 15 dias atraso (0 a 30 dias), saldo 1000.00
        rows.add(new Object[]{15, new BigDecimal("1000.00")});
        // Row 2: 45 dias atraso (31 a 60 dias), saldo 2000.00
        rows.add(new Object[]{45, new BigDecimal("2000.00")});
        // Row 3: 200 dias atraso (Más de 180 dias), saldo 7000.00
        rows.add(new Object[]{200, new BigDecimal("7000.00")});

        when(mockQuery.getResultList()).thenReturn(rows);

        TiemposCobranzaDTO dto = directorioService.getTiemposCobranza("OSDE", "FC", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 8, 31));

        assertNotNull(dto);
        // Saldo total mora = 1000 + 2000 + 7000 = 10000.00
        assertEquals(new BigDecimal("10000.00"), dto.getSaldoTotalMora());
        // DSO = (15*1000 + 45*2000 + 200*7000) / 10000 = (15000 + 90000 + 1400000) / 10000 = 1505000 / 10000 = 151
        assertEquals(151, dto.getDsoGlobal());
        assertEquals(0, dto.getCobroRealPromedio());

        // Verificar los 5 rangos
        List<RangoAntiguedadDTO> detalles = dto.getDetalles();
        assertEquals(5, detalles.size());

        // 0 a 30 días
        assertEquals("0 a 30 días", detalles.get(0).getRango());
        assertEquals(1, detalles.get(0).getCantidadComprobantes());
        assertEquals(new BigDecimal("1000.00"), detalles.get(0).getSaldoEnMora());
        assertEquals(new BigDecimal("10.00"), detalles.get(0).getPorcentajeCartera());

        // 31 a 60 días
        assertEquals("31 a 60 días", detalles.get(1).getRango());
        assertEquals(1, detalles.get(1).getCantidadComprobantes());
        assertEquals(new BigDecimal("2000.00"), detalles.get(1).getSaldoEnMora());
        assertEquals(new BigDecimal("20.00"), detalles.get(1).getPorcentajeCartera());

        // 61 a 90 días
        assertEquals("61 a 90 días", detalles.get(2).getRango());
        assertEquals(0, detalles.get(2).getCantidadComprobantes());
        assertEquals(BigDecimal.ZERO, detalles.get(2).getSaldoEnMora());

        // 91 a 180 días
        assertEquals("91 a 180 días", detalles.get(3).getRango());
        assertEquals(0, detalles.get(3).getCantidadComprobantes());

        // Más de 180 días
        assertEquals("Más de 180 días", detalles.get(4).getRango());
        assertEquals(1, detalles.get(4).getCantidadComprobantes());
        assertEquals(new BigDecimal("7000.00"), detalles.get(4).getSaldoEnMora());
        assertEquals(new BigDecimal("70.00"), detalles.get(4).getPorcentajeCartera());
    }
}
