package com.debitos.backend.service;

import com.debitos.backend.dto.CabeceraLigeraDTO;
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
        rows.add(new Object[] { "OSDE", "OSDE BINARIO" });
        rows.add(new Object[] { "SWISS", "SWISS MEDICAL" });

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
                .thenReturn(new Object[] {
                        new BigDecimal("100000.00"), 10L, new BigDecimal("5000.00"),
                        new BigDecimal("10000.00"), new BigDecimal("4000.00"),
                        new BigDecimal("60000.00"), 429
                });

        DirectorioTotalesDTO totales = directorioService.obtenerTotalesMacro("OSDE", null, LocalDate.of(2026, 8, 1),
                LocalDate.of(2026, 8, 31));

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
        List<String> tipos = directorioService.obtenerTiposDocumentoDisponibles();

        assertNotNull(tipos);
        assertEquals(4, tipos.size());
        assertTrue(tipos.contains("Facturas"));
        assertTrue(tipos.contains("Notas de Crédito"));
        assertTrue(tipos.contains("Notas de Débito"));
        assertTrue(tipos.contains("Recibos (RC)"));
    }

    @Test
    @DisplayName("obtenerDistribucionMotivos calcula montos y porcentajes agrupados")
    void testObtenerDistribucionMotivos() {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[] { "Falta de autorización/Token", new BigDecimal("75000.00"), 15L,
                new BigDecimal("30000.00"), new BigDecimal("45000.00") });
        rows.add(new Object[] { "Falta firma", new BigDecimal("25000.00"), 5L, new BigDecimal("25000.00"),
                BigDecimal.ZERO });

        when(mockQuery.getResultList()).thenReturn(rows);

        List<DirectorioMotivoDebitoDTO> motivos = directorioService.obtenerDistribucionMotivos(null, null, null, null);

        assertNotNull(motivos);
        assertEquals(2, motivos.size());
        assertEquals("Falta de autorización/Token", motivos.get(0).getMotivo());
        assertEquals(new BigDecimal("75000.00"), motivos.get(0).getMontoTotal());
        assertEquals(new BigDecimal("75.00"), motivos.get(0).getPorcentaje());
        assertEquals(15L, motivos.get(0).getCantidadCasos());
        assertEquals(new BigDecimal("40.00"), motivos.get(0).getPorcentajeAceptados());
        assertEquals(new BigDecimal("60.00"), motivos.get(0).getPorcentajeRefacturados());

        assertEquals("Falta firma", motivos.get(1).getMotivo());
        assertEquals(new BigDecimal("25.00"), motivos.get(1).getPorcentaje());
        assertEquals(new BigDecimal("100.00"), motivos.get(1).getPorcentajeAceptados());
        assertEquals(new BigDecimal("0.00"), motivos.get(1).getPorcentajeRefacturados());
    }

    @Test
    @DisplayName("obtenerGruposFacturas agrupa correctamente facturas y sus comprobantes derivados")
    void testObtenerGruposFacturas() {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[] {
                1L, "FC", "A", 1, 1001, java.sql.Date.valueOf(LocalDate.of(2026, 8, 1)),
                java.sql.Date.valueOf(LocalDate.of(2026, 8, 1)), "OSDE", "OSDE BINARIO",
                100L, new BigDecimal("50000.00"), 1
        });

        when(mockQuery.getResultList()).thenReturn(rows);

        Cabecera fcMadre = new Cabecera();
        fcMadre.setId(1L);
        fcMadre.setAsociadogrupo(100L);
        fcMadre.setTipo("FC");
        fcMadre.setPtovta(30);

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
        rows.add(new Object[] {
                10, "PEREZ JUAN", "998877", "PLAN 310", "HOSPITAL", "DR LOPEZ",
                java.sql.Date.valueOf(LocalDate.of(2026, 8, 5)), "420101", "CONSULTA",
                "NC", "A", 1, 501, java.sql.Date.valueOf(LocalDate.of(2026, 8, 20)),
                "Falta de autorización/Token", "No autorizada en línea",
                new BigDecimal("3500.00"), true
        });

        when(mockQuery.getResultList()).thenReturn(rows);

        List<DirectorioPrestacionDetalleDTO> prestaciones = directorioService.obtenerPrestacionesPorMotivo(
                "Falta de autorización/Token", "OSDE", null, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31));

        assertNotNull(prestaciones);
        assertEquals(1, prestaciones.size());
        DirectorioPrestacionDetalleDTO p = prestaciones.get(0);
        assertEquals("PEREZ JUAN", p.getPaciente());
        assertEquals("Falta de autorización/Token", p.getMotivoDebito());
        assertEquals("No autorizada en línea", p.getComentariosDebito());
        assertEquals(new BigDecimal("3500.00"), p.getImporteDebitado());
        assertTrue(p.getDebitoAceptado());
    }

    @Test
    @DisplayName("obtenerGruposFacturasPaginado retorna PaginatedResponseDTO con totalElements y paginación")
    void testObtenerGruposFacturasPaginado() {
        when(mockQuery.getSingleResult()).thenReturn(100L);
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[] {
                1L, "FC", "A", 1, 1001, java.sql.Date.valueOf(LocalDate.of(2026, 8, 1)),
                java.sql.Date.valueOf(LocalDate.of(2026, 8, 1)), "OSDE", "OSDE BINARIO",
                100L, new BigDecimal("50000.00"), 1
        });
        when(mockQuery.getResultList()).thenReturn(rows);
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrIdIn(any())).thenReturn(Collections.emptyList());

        PaginatedResponseDTO<DirectorioGrupoFacturaDTO> res = directorioService.obtenerGruposFacturasPaginado("OSDE",
                null, null, null, 1, 10);

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
        when(mockQuery.getSingleResult()).thenReturn(new Object[] { 50L, new BigDecimal("100000.00") });
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[] { "Falta de autorización/Token", new BigDecimal("75000.00"), 15L });
        when(mockQuery.getResultList()).thenReturn(rows);

        PaginatedResponseDTO<DirectorioMotivoDebitoDTO> res = directorioService.obtenerDistribucionMotivosPaginado(null,
                null, null, null, 0, 10);

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
        rows.add(new Object[] {
                10, "PEREZ JUAN", "998877", "PLAN 310", "HOSPITAL", "DR LOPEZ",
                java.sql.Date.valueOf(LocalDate.of(2026, 8, 5)), "420101", "CONSULTA",
                "NC", "A", 1, 501, java.sql.Date.valueOf(LocalDate.of(2026, 8, 20)),
                "Falta de autorización/Token", "No autorizada en línea",
                new BigDecimal("3500.00"), true
        });
        when(mockQuery.getResultList()).thenReturn(rows);

        PaginatedResponseDTO<DirectorioPrestacionDetalleDTO> res = directorioService
                .obtenerPrestacionesPorMotivoPaginado(
                        "Falta de autorización/Token", "OSDE", null, null, null, 2, 25);

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
        Cabecera fc = new Cabecera("FC", "A", 30, 1001, LocalDate.of(2025, 10, 10), LocalDate.of(2025, 10, 1), "FAC",
                "OSDE");
        fc.setId(1L);
        fc.setCobertura("OSDE");
        fc.setDebe(new BigDecimal("10000.00"));
        fc.setHaber(BigDecimal.ZERO);
        fc.setAsociadogrupo(100L);
        fc.setAsociado(1L);

        Cabecera nc = new Cabecera("NC", "A", 1, 2001, LocalDate.of(2025, 10, 15), LocalDate.of(2025, 10, 1), "NCR",
                "OSDE");
        nc.setId(2L);
        nc.setCobertura("OSDE");
        nc.setDebe(BigDecimal.ZERO);
        nc.setHaber(new BigDecimal("2000.00"));
        nc.setAsociadogrupo(100L);
        nc.setAsociado(1L);

        Cabecera ndRef = new Cabecera("ND", "A", 1, 3001, LocalDate.of(2025, 10, 20), LocalDate.of(2025, 10, 1), "NDB",
                "OSDE");
        ndRef.setId(3L);
        ndRef.setCobertura("OSDE");
        ndRef.setDebe(new BigDecimal("1500.00"));
        ndRef.setHaber(BigDecimal.ZERO);
        ndRef.setAsociadogrupo(100L);
        ndRef.setAsociado(2L);

        Cabecera rc = new Cabecera("RC", "A", 1, 4001, LocalDate.of(2025, 10, 25), LocalDate.of(2025, 10, 1), "REC",
                "OSDE");
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
        List<CcFinanciadorDTO> resCoincide = directorioService.getCuentaCorrienteTresNiveles(null, null, "2025-10-01",
                "2025-10-31");
        assertEquals(1, resCoincide.size());

        // Test con filtro de rango que NO coincide con 2025-10 (ej. 2025-11)
        List<CcFinanciadorDTO> resNoCoincide = directorioService.getCuentaCorrienteTresNiveles(null, null, "2025-11-01",
                "2025-11-30");
        assertTrue(resNoCoincide.isEmpty());
    }

    @Test
    @DisplayName("getCuentaCorrienteTresNiveles excluye comprobantes tipo OP y conserva FC, NC, ND y RC")
    void testCuentaCorrienteTresNiveles_excluyeComprobantesOp() {
        Cabecera fc = new Cabecera("FC", "A", 30, 1001, LocalDate.of(2025, 10, 10), LocalDate.of(2025, 10, 1), "FAC", "OSDE");
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

        Cabecera op = new Cabecera("OP", "A", 1, 5001, LocalDate.of(2025, 10, 26), LocalDate.of(2025, 10, 1), "OP", "OSDE");
        op.setId(5L);
        op.setCobertura("OSDE");
        op.setDebe(BigDecimal.ZERO);
        op.setHaber(new BigDecimal("3000.00"));
        op.setAsociadogrupo(100L);
        op.setAsociado(1L);

        when(cabeceraRepository.findCabecerasParaCuentaCorriente()).thenReturn(List.of(fc, nc, ndRef, rc, op));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(null, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        CcFinanciadorDTO fin = resultado.get(0);
        // Cobranzas RC debe ser exclusivamente 5000.00 (el RC) y NO sumar los 3000.00 de la OP
        assertEquals(new BigDecimal("5000.00"), fin.getCobranzasRc());
        // Saldo debe ser 10000 + 1500 - 2000 - 5000 = 4500.00 (la OP no resta)
        assertEquals(new BigDecimal("4500.00"), fin.getSaldo());

        CcComprobanteDTO fcDto = fin.getPeriodos().get(0).getComprobantes().get(0);
        // Debe haber 4 hijos: FC origen inyectada, NC, ND, RC. Ninguno de tipo OP.
        assertEquals(4, fcDto.getHijos().size());
        boolean tieneOp = fcDto.getHijos().stream().anyMatch(h -> "OP".equalsIgnoreCase(h.getTipo()));
        assertFalse(tieneOp, "La jerarquía de Cuenta Corriente no debe contener comprobantes de tipo OP");
    }

    @Test
    @DisplayName("getMetricasAnalistas agrupa y mapea correctamente analistas desde notadecredito y notadedebito")
    void testGetMetricasAnalistas() {
        List<Object[]> rows = new ArrayList<>();
        // analista, motivo, financiador, monto_debitado, aceptado, refacturado,
        // tipo_registro
        rows.add(new Object[] { "FernandaCortes", "Falta de autorización/Token", "OSDE", new BigDecimal("10000.00"),
                new BigDecimal("8000.00"), new BigDecimal("2000.00"), "Ambulatorios" });
        rows.add(new Object[] { "NataliaMartinez", "Sin motivo especificado", "SWISS MEDICAL",
                new BigDecimal("5000.00"), new BigDecimal("5000.00"), BigDecimal.ZERO, "Internados" });

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
        rows.add(new Object[] {
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
                "443", "FC", LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31));

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
        rows.add(new Object[] { "443 - OSDE", new BigDecimal("150000.00") });
        rows.add(new Object[] { "502 - PAMI", new BigDecimal("250000.00") });

        when(mockQuery.getResultList()).thenReturn(rows);

        List<PuntoDonutDTO> result = directorioService.obtenerDistribucionCarteraDonut(
                null, null, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31));

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("443 - OSDE", result.get(0).getEtiqueta());
        assertEquals(new BigDecimal("150000.00"), result.get(0).getSaldo());
    }

    @Test
    @DisplayName("getEvolucionMensual retorna los 5 datasets (Facturación, Débitos, Refacturación ND, Cobranzas, Deudas) con filtros")
    void testGetEvolucionMensualConFiltros() {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[] {
                "2026-05",
                new BigDecimal("1000000.00"),
                new BigDecimal("50000.00"),
                new BigDecimal("20000.00"),
                new BigDecimal("600000.00")
        });

        when(mockQuery.getResultList()).thenReturn(rows);

        List<DatasetGraficoDTO> datasets = directorioService.getEvolucionMensual(
                "443", null, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31));

        assertNotNull(datasets);
        assertEquals(5, datasets.size());
        assertEquals("Facturación", datasets.get(0).getTituloDataset());
        assertEquals(12, datasets.get(0).getPuntos().size());
        assertEquals("2026-05", datasets.get(0).getPuntos().get(11).getEtiqueta());
        assertEquals(new BigDecimal("1000000.00"), datasets.get(0).getPuntos().get(11).getValor());

        assertEquals("Débitos", datasets.get(1).getTituloDataset());
        assertEquals(new BigDecimal("50000.00"), datasets.get(1).getPuntos().get(11).getValor());

        assertEquals("Refacturación (ND)", datasets.get(2).getTituloDataset());
        assertEquals(new BigDecimal("20000.00"), datasets.get(2).getPuntos().get(11).getValor());

        assertEquals("Cobranzas", datasets.get(3).getTituloDataset());
        assertEquals(new BigDecimal("600000.00"), datasets.get(3).getPuntos().get(11).getValor());

        // Deudas = 1.000.000 + 20.000 - 50.000 - 600.000 = 370.000
        assertEquals("Deudas", datasets.get(4).getTituloDataset());
        assertEquals(new BigDecimal("370000.00"), datasets.get(4).getPuntos().get(11).getValor());
    }

    @Test
    @DisplayName("getEvolucionMensual retorna 12 meses con 5 datasets aunque se filtre un rango menor a 12 meses (ej. 2 meses)")
    void testGetEvolucionMensualConFiltrosRangoMenorA12Meses() {
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[] {
                "2026-08",
                new BigDecimal("1500000.00"),
                new BigDecimal("70000.00"),
                new BigDecimal("35000.00"),
                new BigDecimal("800000.00")
        });

        when(mockQuery.getResultList()).thenReturn(rows);

        // Se filtran 2 meses (julio y agosto 2026)
        List<DatasetGraficoDTO> datasets = directorioService.getEvolucionMensual(
                "443", null, LocalDate.of(2026, 7, 1), LocalDate.of(2026, 8, 31));

        assertNotNull(datasets);
        assertEquals(5, datasets.size());
        assertEquals("Facturación", datasets.get(0).getTituloDataset());
        assertEquals(12, datasets.get(0).getPuntos().size(), "Debe retornar siempre 12 meses");
        assertEquals("2025-09", datasets.get(0).getPuntos().get(0).getEtiqueta(),
                "El primer mes debe ser 11 meses antes de fechaHasta");
        assertEquals("2026-08", datasets.get(0).getPuntos().get(11).getEtiqueta(),
                "El último mes debe ser el mes de fechaHasta");
        assertEquals(new BigDecimal("1500000.00"), datasets.get(0).getPuntos().get(11).getValor());

        assertEquals("Débitos", datasets.get(1).getTituloDataset());
        assertEquals(new BigDecimal("70000.00"), datasets.get(1).getPuntos().get(11).getValor());

        assertEquals("Refacturación (ND)", datasets.get(2).getTituloDataset());
        assertEquals(new BigDecimal("35000.00"), datasets.get(2).getPuntos().get(11).getValor());

        assertEquals("Cobranzas", datasets.get(3).getTituloDataset());
        assertEquals(new BigDecimal("800000.00"), datasets.get(3).getPuntos().get(11).getValor());

        // Deudas = 1.500.000 + 35.000 - 70.000 - 800.000 = 665.000
        assertEquals("Deudas", datasets.get(4).getTituloDataset());
        assertEquals(new BigDecimal("665000.00"), datasets.get(4).getPuntos().get(11).getValor());
    }

    @Test
    @DisplayName("getTiemposCobranza calcula métricas diferenciando cobrados por tramo y aún no cobrados")
    void testGetTiemposCobranzaConFiltros() {
        List<Object[]> rows = new ArrayList<>();
        // Caso del usuario: factura de $10000, cobro $1000 a los 15 días, cobro $7000 a
        // los 185 días, pendiente $2000 a los 200 días
        rows.add(new Object[] { "COBRADO", 15, new BigDecimal("1000.00") });
        rows.add(new Object[] { "COBRADO", 185, new BigDecimal("7000.00") });
        rows.add(new Object[] { "PENDIENTE", 200, new BigDecimal("2000.00") });

        when(mockQuery.getResultList()).thenReturn(rows);

        TiemposCobranzaDTO dto = directorioService.getTiemposCobranza("OSDE", "FC", LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 8, 31));

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

        // 0 a 45 días
        assertEquals("De 0 a 45 días", detalles.get(0).getRango());
        assertEquals(1, detalles.get(0).getCantidadComprobantes());
        assertEquals(new BigDecimal("1000.00"), detalles.get(0).getSaldoEnMora());
        assertEquals(new BigDecimal("10.0"), detalles.get(0).getPorcentajeCartera());

        // 46 a 75 días
        assertEquals("De 46 a 75 días", detalles.get(1).getRango());
        assertEquals(0, detalles.get(1).getCantidadComprobantes());
        assertEquals(BigDecimal.ZERO, detalles.get(1).getSaldoEnMora());
        assertEquals(0, BigDecimal.ZERO.compareTo(detalles.get(1).getPorcentajeCartera()));

        // 76 a 105 días
        assertEquals("De 76 a 105 días", detalles.get(2).getRango());
        assertEquals(0, detalles.get(2).getCantidadComprobantes());
        assertEquals(BigDecimal.ZERO, detalles.get(2).getSaldoEnMora());

        // 106 a 135 días
        assertEquals("De 106 a 135 días", detalles.get(3).getRango());
        assertEquals(0, detalles.get(3).getCantidadComprobantes());

        // Más de 135 días
        assertEquals("Más de 135 días", detalles.get(4).getRango());
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
        Cabecera fc = new Cabecera("FC", "A", 30, 1001, LocalDate.of(2025, 10, 10), LocalDate.of(2025, 10, 1), "FAC",
                "SWISS MEDICAL");
        fc.setId(10L);
        fc.setCobertura("SWISS MEDICAL");
        fc.setDebe(new BigDecimal("20000.00"));
        fc.setHaber(BigDecimal.ZERO);
        fc.setAsociadogrupo(200L);
        fc.setAsociado(10L);

        // ND con asociado = 10L (apunta a FC). No está en findIdsNdHijosDeNc().
        Cabecera ndInc = new Cabecera("ND", "A", 1, 3002, LocalDate.of(2025, 10, 22), LocalDate.of(2025, 10, 1), "NDB",
                "SWISS MEDICAL");
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
        Cabecera rcHuerfano = new Cabecera("RC", "A", 1, 9001, LocalDate.of(2025, 11, 15), LocalDate.of(2025, 11, 1),
                "REC", "IOMA");
        rcHuerfano.setId(99L);
        rcHuerfano.setCobertura("IOMA");
        rcHuerfano.setDebe(BigDecimal.ZERO);
        rcHuerfano.setHaber(new BigDecimal("50000.00"));
        rcHuerfano.setAsociadogrupo(999L);

        // Familia 2: Una NC y ND sin FC raíz
        Cabecera ncHuerfana = new Cabecera("NC", "A", 1, 9002, LocalDate.of(2025, 11, 16), LocalDate.of(2025, 11, 1),
                "NCA", "IOMA");
        ncHuerfana.setId(101L);
        ncHuerfana.setCobertura("IOMA");
        ncHuerfana.setDebe(BigDecimal.ZERO);
        ncHuerfana.setHaber(new BigDecimal("10000.00"));
        ncHuerfana.setAsociadogrupo(888L);

        Cabecera ndHuerfana = new Cabecera("ND", "A", 1, 9003, LocalDate.of(2025, 11, 17), LocalDate.of(2025, 11, 1),
                "NDA", "IOMA");
        ndHuerfana.setId(102L);
        ndHuerfana.setCobertura("IOMA");
        ndHuerfana.setDebe(new BigDecimal("10000.00"));
        ndHuerfana.setHaber(BigDecimal.ZERO);
        ndHuerfana.setAsociadogrupo(888L);
        ndHuerfana.setAsociado(101L);

        when(cabeceraRepository.findCabecerasParaCuentaCorriente())
                .thenReturn(List.of(rcHuerfano, ncHuerfana, ndHuerfana));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(null, null);

        assertNotNull(resultado);
        // Ambas familias deben ser descartadas por no tener Factura Madre (FC)
        assertTrue(resultado.isEmpty());
    }

    @Test
    @DisplayName("getCuentaCorrienteTresNiveles clasifica correctamente Refactura cuando el asociado contiene N")
    void testCuentaCorrienteTresNiveles_clasificaNdPorRefacturaCuandoApuntaANc() {
        Cabecera fc = new Cabecera("FC", "A", 30, 1001, LocalDate.of(2025, 11, 10), LocalDate.of(2025, 11, 1), "FAC",
                "MEDIFE");
        fc.setId(50L);
        fc.setCobertura("MEDIFE");
        fc.setDebe(new BigDecimal("50000.00"));
        fc.setHaber(BigDecimal.ZERO);
        fc.setAsociadogrupo(500L);
        fc.setAsociado(50L);

        Cabecera nc = new Cabecera("NC", "A", 1, 2001, LocalDate.of(2025, 11, 12), LocalDate.of(2025, 11, 1), "NCE",
                "MEDIFE");
        nc.setId(51L);
        nc.setCobertura("MEDIFE");
        nc.setDebe(BigDecimal.ZERO);
        nc.setHaber(new BigDecimal("8000.00"));
        nc.setAsociadogrupo(500L);
        nc.setAsociado(50L);

        Cabecera ndRef = new Cabecera("ND", "A", 1, 3001, LocalDate.of(2025, 11, 14), LocalDate.of(2025, 11, 1), "NDE",
                "MEDIFE");
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
        // Caso A: Anulación directa (FC y NC por $100.000 con 5 días de diferencia) ->
        // DEBEN DESCARTARSE AMBAS
        Cabecera fcAnulada = new Cabecera("FC", "A", 30, 1001, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 1),
                "FAC", "OSDE");
        fcAnulada.setId(101L);
        fcAnulada.setCobertura("OSDE");
        fcAnulada.setDebe(new BigDecimal("100000.00"));
        fcAnulada.setHaber(BigDecimal.ZERO);
        fcAnulada.setAsociadogrupo(101L);
        fcAnulada.setAsociado(101L);

        Cabecera ncAnuladora = new Cabecera("NC", "A", 1, 2001, LocalDate.of(2026, 8, 6), LocalDate.of(2026, 8, 1),
                "NCR", "OSDE");
        ncAnuladora.setId(102L);
        ncAnuladora.setCobertura("OSDE");
        ncAnuladora.setDebe(BigDecimal.ZERO);
        ncAnuladora.setHaber(new BigDecimal("100000.00")); // Mismo monto
        ncAnuladora.setAsociadogrupo(101L);
        ncAnuladora.setAsociado(101L); // Apunta a fcAnulada, diferencia: 5 días (<= 15)

        // Caso B: FC normal con NC parcial o con más de 15 días -> DEBE CONTABILIZARSE
        Cabecera fcValida = new Cabecera("FC", "A", 30, 1002, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 1), "FAC",
                "SWISS");
        fcValida.setId(201L);
        fcValida.setCobertura("SWISS");
        fcValida.setDebe(new BigDecimal("50000.00"));
        fcValida.setHaber(BigDecimal.ZERO);
        fcValida.setAsociadogrupo(201L);
        fcValida.setAsociado(201L);

        Cabecera ncValida = new Cabecera("NC", "A", 1, 2002, LocalDate.of(2026, 8, 25), LocalDate.of(2026, 8, 1), "NCR",
                "SWISS");
        ncValida.setId(202L);
        ncValida.setCobertura("SWISS");
        ncValida.setDebe(BigDecimal.ZERO);
        ncValida.setHaber(new BigDecimal("50000.00")); // Mismo monto pero 24 días de diferencia (> 15 días)
        ncValida.setAsociadogrupo(201L);
        ncValida.setAsociado(201L);

        when(cabeceraRepository.findCabecerasParaCuentaCorriente())
                .thenReturn(List.of(fcAnulada, ncAnuladora, fcValida, ncValida));

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
        Cabecera fcAnulada = new Cabecera("FC", "A", 30, 1001, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 1),
                "FAC", "OSDE");
        fcAnulada.setId(101L);
        fcAnulada.setCobertura("OSDE");
        fcAnulada.setDebe(new BigDecimal("100000.00"));
        fcAnulada.setHaber(BigDecimal.ZERO);
        fcAnulada.setAsociadogrupo(101L);
        fcAnulada.setAsociado(101L);

        Cabecera ncAnuladora = new Cabecera("NC", "A", 1, 2001, LocalDate.of(2026, 8, 6), LocalDate.of(2026, 8, 1),
                "NCR", "OSDE");
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
        Cabecera fcRaiz = new Cabecera("FC", "A", 30, 1001, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 1), "FAC",
                "SWISS");
        fcRaiz.setId(201L);
        fcRaiz.setCobertura("SWISS");
        fcRaiz.setDebe(new BigDecimal("100000.00"));
        fcRaiz.setHaber(BigDecimal.ZERO);
        fcRaiz.setAsociadogrupo(201L);
        fcRaiz.setAsociado(201L);

        Cabecera ncAnulada = new Cabecera("NC", "A", 1, 2001, LocalDate.of(2026, 8, 5), LocalDate.of(2026, 8, 1), "NCE",
                "SWISS");
        ncAnulada.setId(202L);
        ncAnulada.setCobertura("SWISS");
        ncAnulada.setDebe(BigDecimal.ZERO);
        ncAnulada.setHaber(new BigDecimal("25000.00"));
        ncAnulada.setAsociadogrupo(201L);
        ncAnulada.setAsociado(201L);

        Cabecera ndAnuladora = new Cabecera("ND", "A", 1, 3001, LocalDate.of(2026, 8, 8), LocalDate.of(2026, 8, 1),
                "NDE", "SWISS");
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
        Cabecera fcRaiz = new Cabecera("FC", "A", 30, 1001, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 1), "FAC",
                "OSDE");
        fcRaiz.setId(301L);
        fcRaiz.setCobertura("OSDE");
        fcRaiz.setDebe(new BigDecimal("100000.00"));
        fcRaiz.setHaber(BigDecimal.ZERO);
        fcRaiz.setAsociadogrupo(301L);
        fcRaiz.setAsociado(301L);

        Cabecera ndAnulada = new Cabecera("ND", "A", 1, 3001, LocalDate.of(2026, 8, 4), LocalDate.of(2026, 8, 1), "NDA",
                "OSDE");
        ndAnulada.setId(302L);
        ndAnulada.setCobertura("OSDE");
        ndAnulada.setDebe(new BigDecimal("15000.00"));
        ndAnulada.setHaber(BigDecimal.ZERO);
        ndAnulada.setAsociadogrupo(301L);
        ndAnulada.setAsociado(301L);

        Cabecera ncAnuladora = new Cabecera("NC", "A", 1, 2001, LocalDate.of(2026, 8, 9), LocalDate.of(2026, 8, 1),
                "NCA", "OSDE");
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
        // Factura con Período = 2024-01-01, pero Fecha de emisión = 2024-11-15
        // (diferente mes)
        Cabecera fc = new Cabecera("FC", "A", 30, 5001, LocalDate.of(2024, 11, 15), LocalDate.of(2024, 1, 1), "FAC",
                "SWISS MEDICAL");
        fc.setId(50L);
        fc.setCobertura("SWISS MEDICAL");
        fc.setDebe(new BigDecimal("25000.00"));
        fc.setHaber(BigDecimal.ZERO);
        fc.setAsociadogrupo(50L);
        fc.setAsociado(50L);

        // NC vinculada emitida meses después
        Cabecera nc = new Cabecera("NC", "A", 1, 6001, LocalDate.of(2024, 6, 10), LocalDate.of(2024, 6, 1), "NCR",
                "SWISS MEDICAL");
        nc.setId(51L);
        nc.setCobertura("SWISS MEDICAL");
        nc.setDebe(BigDecimal.ZERO);
        nc.setHaber(new BigDecimal("5000.00"));
        nc.setAsociadogrupo(50L);
        nc.setAsociado(50L);

        when(cabeceraRepository.findCabecerasParaCuentaCorriente()).thenReturn(List.of(fc, nc));

        // 1. Filtrando por el período 2024-01-01 a 2024-03-01: DEBE incluirse porque su
        // período es 2024-01-01
        List<CcFinanciadorDTO> resPeriodoCoincide = directorioService.getCuentaCorrienteTresNiveles(
                null, null, "2024-01-01", "2024-03-01");
        assertEquals(1, resPeriodoCoincide.size());
        assertEquals("SWISS MEDICAL", resPeriodoCoincide.get(0).getFinanciador());
        assertEquals("2024-01", resPeriodoCoincide.get(0).getPeriodos().get(0).getPeriodo());
        // La NC emitida en junio debe acompañar a la factura madre en su período
        // 2024-01
        assertEquals(new BigDecimal("25000.00"), resPeriodoCoincide.get(0).getFacturacionFc());
        assertEquals(new BigDecimal("5000.00"), resPeriodoCoincide.get(0).getDebitosNc());

        // 2. Filtrando por el mes de la fecha de emisión (2024-11-01 a 2024-11-30): NO
        // debe incluirse porque su período es enero
        List<CcFinanciadorDTO> resPorFecha = directorioService.getCuentaCorrienteTresNiveles(
                null, null, "2024-11-01", "2024-11-30");
        assertTrue(resPorFecha.isEmpty(), "No debe incluirse por fecha de emisión; solo por columna período");

        // 3. Si la factura tiene periodo nulo, no debe tomar la fecha de emisión y debe
        // quedar descartada
        fc.setPeriodo(null);
        List<CcFinanciadorDTO> resSinPeriodo = directorioService.getCuentaCorrienteTresNiveles(
                null, null, "2024-11-01", "2024-11-30");
        assertTrue(resSinPeriodo.isEmpty(), "Factura sin columna período no debe usar columna fecha como fallback");
    }

    @Test
    @DisplayName("getBuclesInsistencia desglosa correctamente las prestaciones y muestra los montos individuales de cada prestación")
    void testBuclesInsistencia_desglosaPorPrestacionConMontosIndividuales() {
        Cabecera fcRaiz = new Cabecera("FC", "A", 30, 5081, LocalDate.of(2025, 8, 8), LocalDate.of(2025, 8, 1), "FAC",
                "OSDE");
        fcRaiz.setId(100L);
        fcRaiz.setDebe(new BigDecimal("50000000.00"));
        fcRaiz.setAsociadogrupo(100L);

        Cabecera nc1 = new Cabecera("NC", "A", 30, 1442, LocalDate.of(2025, 9, 30), LocalDate.of(2025, 8, 1), "NCA",
                "OSDE");
        nc1.setId(101L);
        nc1.setHaber(new BigDecimal("6000000.00"));
        nc1.setAsociadogrupo(100L);

        Cabecera nd1 = new Cabecera("ND", "A", 32, 2052, LocalDate.of(2025, 12, 2), LocalDate.of(2025, 8, 1), "NDA",
                "OSDE");
        nd1.setId(102L);
        nd1.setDebe(new BigDecimal("5000000.00"));
        nd1.setAsociadogrupo(100L);

        Cabecera nc2 = new Cabecera("NC", "A", 32, 7513, LocalDate.of(2026, 1, 28), LocalDate.of(2025, 8, 1), "NCA",
                "OSDE");
        nc2.setId(103L);
        nc2.setHaber(new BigDecimal("4000000.00"));
        nc2.setAsociadogrupo(100L);

        Cabecera nd2 = new Cabecera("ND", "A", 32, 2053, LocalDate.of(2026, 2, 1), LocalDate.of(2025, 8, 1), "NDA",
                "OSDE");
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
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrIdIn(any()))
                .thenReturn(List.of(fcRaiz, nc1, nd1, nc2, nd2));
        lenient().when(ambLiquidadoRepository.findByCabecera_IdIn(any()))
                .thenReturn(List.of(prestacion, prestacion2Solo1Nc));
        when(notaDeCreditoRepository.findByCabecera_IdIn(any())).thenReturn(List.of(ncItem1, ncItem2, ncItemSolo1Nc));
        when(notaDeDebitoRepository.findByCabecera_IdIn(any())).thenReturn(List.of(ndItem1, ndItem2));

        List<CadenaTrazabilidadDTO> resultado = directorioService.getBuclesInsistencia(null, null, null, "2025-08-01",
                "2026-02-01");

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        CadenaTrazabilidadDTO facturaCadena = resultado.get(0);
        assertNotNull(facturaCadena.getPrestaciones());
        // Solo debe incluir la prestación 777 (2 ND y 2 NC), excluyendo la 888 (1 sola
        // NC y 0 ND)
        assertEquals(1, facturaCadena.getPrestaciones().size(),
                "Solo deben incluirse prestaciones con >= 2 NDs y >= 1 NC");

        BuclePrestacionDTO buclePresta = facturaCadena.getPrestaciones().get(0);
        assertEquals("420101", buclePresta.getCodigo());
        assertEquals("CONSULTA MEDICA", buclePresta.getDescripcion());
        assertEquals("PEREZ JUAN", buclePresta.getPaciente());
        assertEquals(new BigDecimal("12500.00"), buclePresta.getMontoFacturadoOriginal(),
                "Debe mostrar el monto de la prestación, no de la factura");
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
        fcRaiz.setPtovta(30);
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
        lenient().when(prestacionHuerfana.getCodigo()).thenThrow(new org.hibernate.ObjectNotFoundException(
                11698928, "com.debitos.backend.model.AmbLiquidado"));

        NotaDeCredito ncItemHuerfano = new NotaDeCredito();
        ncItemHuerfano.setId(99);
        ncItemHuerfano.setCabecera(nc1);
        ncItemHuerfano.setPrestacion(prestacionHuerfana);
        ncItemHuerfano.setImporteDebitado(new BigDecimal("10000.00"));

        when(cabeceraRepository.findIdsGruposConMultiplesNc(any(), any())).thenReturn(List.of(200L));
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrIdIn(any())).thenReturn(List.of(fcRaiz, nc1, nd1, nc2));
        lenient().when(ambLiquidadoRepository.findByCabecera_IdIn(any())).thenReturn(Collections.emptyList());
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

    @Test
    @DisplayName("getBuclesInsistencia no considera bucle si sólo existe una ND de refacturación aunque tenga múltiples ítems o filas")
    void testBuclesInsistencia_noConsideraBucleSiSoloExisteUnaNdAunqueTengaMultiplesItems() {
        Cabecera fcRaiz = new Cabecera("FC", "A", 30, 5299, LocalDate.of(2026, 1, 2), LocalDate.of(2026, 1, 1), "FAC",
                "ACTIVA");
        fcRaiz.setId(706L);
        fcRaiz.setDebe(new BigDecimal("33000000.00"));
        fcRaiz.setAsociadogrupo(222619L);

        Cabecera nc1 = new Cabecera("NC", "A", 333, 333, LocalDate.of(2026, 9, 9), LocalDate.of(2026, 1, 1), "NCA",
                "ACTIVA");
        nc1.setId(19783L);
        nc1.setHaber(new BigDecimal("50000.00"));
        nc1.setAsociadogrupo(222619L);

        // Solo 1 ND de refacturación
        Cabecera nd1 = new Cabecera("ND", "A", 33, 33, LocalDate.of(2026, 9, 12), LocalDate.of(2026, 1, 1), "NDA",
                "ACTIVA");
        nd1.setId(19788L);
        nd1.setDebe(new BigDecimal("50000.00"));
        nd1.setAsociadogrupo(222619L);

        AmbLiquidado prestacion = new AmbLiquidado();
        prestacion.setId(26077449);
        prestacion.setCodigo("M052935");
        prestacion.setDescripcion("NAPRUX");
        prestacion.setPaciente("RODRIGUEZ ROSA");
        prestacion.setTotal(new BigDecimal("25000.00"));
        prestacion.setCabecera(fcRaiz);

        NotaDeCredito ncItem = new NotaDeCredito();
        ncItem.setId(6269);
        ncItem.setCabecera(nc1);
        ncItem.setPrestacion(prestacion);
        ncItem.setImporteDebitado(new BigDecimal("25000.00"));
        ncItem.setMotivoDebito("Alta demorada");

        // 2 ítems en la MISMA ND (o fila duplicada)
        NotaDeDebito ndItem1 = new NotaDeDebito();
        ndItem1.setId(138);
        ndItem1.setCabecera(nd1);
        ndItem1.setCodigo("M052935");
        ndItem1.setNotaDeCreditoPadre(ncItem);
        ndItem1.setImporterefactura(new BigDecimal("12500.00"));

        NotaDeDebito ndItem2 = new NotaDeDebito();
        ndItem2.setId(139);
        ndItem2.setCabecera(nd1);
        ndItem2.setCodigo("M052935");
        ndItem2.setNotaDeCreditoPadre(ncItem);
        ndItem2.setImporterefactura(new BigDecimal("12500.00"));

        when(cabeceraRepository.findIdsGruposConMultiplesNc(any(), any())).thenReturn(List.of(222619L));
        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrIdIn(any())).thenReturn(List.of(fcRaiz, nc1, nd1));
        lenient().when(ambLiquidadoRepository.findByCabecera_IdIn(any())).thenReturn(List.of(prestacion));
        when(notaDeCreditoRepository.findByCabecera_IdIn(any())).thenReturn(List.of(ncItem));
        when(notaDeDebitoRepository.findByCabecera_IdIn(any())).thenReturn(List.of(ndItem1, ndItem2));

        List<CadenaTrazabilidadDTO> resultado = directorioService.getBuclesInsistencia(null, null, null, "2026-01-01",
                "2026-12-31");

        // Al haber solo 1 comprobante ND de refacturación, NO es bucle de insistencia
        assertTrue(resultado.isEmpty(), "No debe clasificar como bucle si solo existe 1 ND de refacturación distinta");
    }

    @Test
    @DisplayName("getTrazabilidad utiliza findIdsGruposFacturasPorRangoFechasYFinanciador y retorna las cadenas correctamente")
    void testGetTrazabilidad_optimizadaPorFinanciadorYLimite() {
        when(cabeceraRepository.findIdsGruposFacturasPorRangoFechasYFinanciador(any(), any(), eq("OSDE"), eq(500)))
                .thenReturn(List.of(10L));
        when(cabeceraRepository.findLigeraByGrupoOrAsociadogrupoOrIdIn(any()))
                .thenReturn(List.of(
                        new CabeceraLigeraDTO(10L, "FC", "A", 30, 1001, LocalDate.of(2026, 9, 15),
                                LocalDate.of(2026, 9, 1), "AMB", "OSDE", "OSDE BINARIO", "SISTEMA", 10L, null, null,
                                new BigDecimal("50000.00"), BigDecimal.ZERO, 1, "FC A 0030-00001001"),
                        new CabeceraLigeraDTO(11L, "NC", "A", 1, 2001, LocalDate.of(2026, 9, 20),
                                LocalDate.of(2026, 9, 1), "AMB", "OSDE", "OSDE BINARIO", "AUDITORIA", 10L, 10L, 10L,
                                BigDecimal.ZERO, new BigDecimal("10000.00"), 1, "NC A 0001-00002001")));

        List<CadenaTrazabilidadDTO> resultado = directorioService.getTrazabilidad("OSDE", null, null, "2026-09-01",
                "2026-09-30");

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        CadenaTrazabilidadDTO cadena = resultado.get(0);
        assertEquals(new BigDecimal("50000.00"), cadena.getMontoFacturadoOriginal());
        assertEquals(new BigDecimal("10000.00"), cadena.getTotalDebitado());
        assertEquals(2, cadena.getHistorialEventos().size());
    }

    @Test
    @DisplayName("getCuentaCorrienteTresNiveles - Documento suelto con distinto asociadogrupo pero asociado a NC de la familia se vincula correctamente")
    void testGetCuentaCorrienteTresNiveles_documentoSueltoSeVinculaPorAsociado() {
        when(cabeceraRepository.findIdsGruposFacturasPorRangoPeriodos(any(), any()))
                .thenReturn(List.of(100L));

        CabeceraLigeraDTO fc = new CabeceraLigeraDTO(100L, "FC", "A", 30, 1000,
                LocalDate.of(2026, 9, 15), LocalDate.of(2026, 9, 1), "AMB", "OSDE", "OSDE BINARIO", "SISTEMA",
                100L, 100L, null, new BigDecimal("10000.00"), BigDecimal.ZERO, 1, "FC A 0001-00001000");

        CabeceraLigeraDTO nc = new CabeceraLigeraDTO(101L, "NC", "A", 1, 2000,
                LocalDate.of(2026, 9, 20), LocalDate.of(2026, 9, 1), "AMB", "OSDE", "OSDE BINARIO", "AUDITORIA",
                100L, 100L, 100L, BigDecimal.ZERO, new BigDecimal("2000.00"), 1, "NC A 0001-00002000");

        // Documento suelto: grupo/asociadogrupo 999L (distinto a 100L), pero asociado =
        // 101L (apunta a la NC)
        CabeceraLigeraDTO ndSuelto = new CabeceraLigeraDTO(102L, "ND", "A", 1, 3000,
                LocalDate.of(2026, 9, 25), LocalDate.of(2026, 9, 1), "AMB", "OSDE", "OSDE BINARIO", "AUDITORIA",
                999L, 101L, 999L, new BigDecimal("500.00"), BigDecimal.ZERO, 1, "ND A 0001-00003000");

        // Primera consulta por grupo devuelve FC y NC
        when(cabeceraRepository.findLigeraByGrupoOrAsociadogrupoOrIdIn(List.of(100L)))
                .thenReturn(new ArrayList<>(List.of(fc, nc)));

        // Consulta transitiva por asociado encuentra la ND suelta
        when(cabeceraRepository.findLigeraByAsociadoIn(anyCollection()))
                .thenReturn(List.of(ndSuelto))
                .thenReturn(Collections.emptyList());

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles("OSDE", null, "2026-09-01",
                "2026-09-30");

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        CcFinanciadorDTO finDto = resultado.get(0);
        assertEquals("OSDE BINARIO", finDto.getFinanciador());

        assertEquals(1, finDto.getPeriodos().size());
        CcPeriodoDTO perDto = finDto.getPeriodos().get(0);

        assertEquals(1, perDto.getComprobantes().size());
        CcComprobanteDTO fcDto = perDto.getComprobantes().get(0);
        assertEquals("FC A 0001-00001000", fcDto.getComprobante());

        // Verificar que la ND suelta quedó incluida en el árbol de descendientes de la
        // FC
        assertNotNull(fcDto.getHijos());
        assertEquals(3, fcDto.getHijos().size(), "El árbol debe contener la FC de origen, la NC y la ND suelta");

        CcComprobanteDTO ncEnArbol = fcDto.getHijos().stream()
                .filter(h -> "NC A 0001-00002000".equals(h.getComprobante()))
                .findFirst().orElse(null);
        assertNotNull(ncEnArbol);
        assertEquals(1, ncEnArbol.getNivel());

        CcComprobanteDTO ndEnArbol = fcDto.getHijos().stream()
                .filter(h -> "ND A 0001-00003000".equals(h.getComprobante()))
                .findFirst().orElse(null);
        assertNotNull(ndEnArbol, "La ND suelta debe estar vinculada en los hijos");
        assertEquals(2, ndEnArbol.getNivel(), "La ND asociada a la NC debe tener nivel 2");
        assertEquals("NC A 0001-00002000", ndEnArbol.getComprobanteAsociado(),
                "Debe apuntar a la NC como comprobanteAsociado");
    }

    @Test
    @DisplayName("getCuentaCorrienteTresNiveles descarta facturas con punto de venta distinto de 30, 31, 32 o 53")
    void testCuentaCorriente_descartaFacturasCuyoPuntoDeVentaNoSea30Ni31Ni32Ni53() {
        // Factura con ptovta = 1 (debe descartarse)
        Cabecera fcPto1 = new Cabecera("FC", "A", 1, 1001, LocalDate.of(2025, 10, 10), LocalDate.of(2025, 10, 1), "FAC",
                "OSDE");
        fcPto1.setId(1L);
        fcPto1.setCobertura("OSDE");
        fcPto1.setDebe(new BigDecimal("10000.00"));
        fcPto1.setAsociadogrupo(100L);

        // Factura con ptovta = 5 (debe descartarse)
        Cabecera fcPto5 = new Cabecera("FC", "A", 5, 1002, LocalDate.of(2025, 10, 10), LocalDate.of(2025, 10, 1), "FAC",
                "OSDE");
        fcPto5.setId(2L);
        fcPto5.setCobertura("OSDE");
        fcPto5.setDebe(new BigDecimal("15000.00"));
        fcPto5.setAsociadogrupo(200L);

        // Factura con ptovta = 32 (debe incluirse)
        Cabecera fcPto32 = new Cabecera("FC", "A", 32, 1003, LocalDate.of(2025, 10, 10), LocalDate.of(2025, 10, 1),
                "FAC", "OSDE");
        fcPto32.setId(3L);
        fcPto32.setCobertura("OSDE");
        fcPto32.setDebe(new BigDecimal("20000.00"));
        fcPto32.setAsociadogrupo(300L);

        when(cabeceraRepository.findCabecerasParaCuentaCorriente()).thenReturn(List.of(fcPto1, fcPto5, fcPto32));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(null, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        CcFinanciadorDTO fin = resultado.get(0);
        assertEquals(1, fin.getPeriodos().size());
        CcPeriodoDTO per = fin.getPeriodos().get(0);
        assertEquals(1, per.getComprobantes().size(), "Solo debe incluir la factura con ptovta 32");
        assertEquals(3L, per.getComprobantes().get(0).getId());
    }

    @Test
    @DisplayName("getCuentaCorrienteTresNiveles acepta y procesa facturas con punto de venta 30, 31, 32 y 53")
    void testCuentaCorriente_aceptaFacturasConPuntosDeVenta30_31_32_53() {
        Cabecera fc30 = new Cabecera("FC", "A", 30, 1001, LocalDate.of(2025, 10, 10), LocalDate.of(2025, 10, 1), "FAC",
                "SWISS");
        fc30.setId(10L);
        fc30.setCobertura("SWISS");
        fc30.setDebe(new BigDecimal("30000.00"));
        fc30.setAsociadogrupo(100L);

        Cabecera fc31 = new Cabecera("FC", "A", 31, 1002, LocalDate.of(2025, 10, 10), LocalDate.of(2025, 10, 1), "FAC",
                "SWISS");
        fc31.setId(20L);
        fc31.setCobertura("SWISS");
        fc31.setDebe(new BigDecimal("40000.00"));
        fc31.setAsociadogrupo(200L);

        Cabecera fc32 = new Cabecera("FC", "A", 32, 1003, LocalDate.of(2025, 10, 10), LocalDate.of(2025, 10, 1), "FAC",
                "SWISS");
        fc32.setId(30L);
        fc32.setCobertura("SWISS");
        fc32.setDebe(new BigDecimal("50000.00"));
        fc32.setAsociadogrupo(300L);

        Cabecera fc53 = new Cabecera("FC", "A", 53, 1004, LocalDate.of(2025, 10, 10), LocalDate.of(2025, 10, 1), "FAC",
                "SWISS");
        fc53.setId(40L);
        fc53.setCobertura("SWISS");
        fc53.setDebe(new BigDecimal("60000.00"));
        fc53.setAsociadogrupo(400L);

        when(cabeceraRepository.findCabecerasParaCuentaCorriente()).thenReturn(List.of(fc30, fc31, fc32, fc53));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(null, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        CcPeriodoDTO per = resultado.get(0).getPeriodos().get(0);
        assertEquals(4, per.getComprobantes().size(), "Deben incluirse las 4 facturas (ptovta 30, 31, 32 y 53)");
    }

    @Test
    @DisplayName("getCuentaCorrienteTresNiveles distribuye correctamente un recibo con mismo tipo y número imputado a múltiples facturas")
    void testCuentaCorriente_reciboConMismoNumeroImputadoEnMultiplesGrupos() {
        // Factura 1 (Grupo 231551)
        Cabecera fc1 = new Cabecera("FCE", "A", 31, 1916, LocalDate.of(2026, 8, 3), LocalDate.of(2026, 7, 1), "FAC",
                "OSDE");
        fc1.setId(101L);
        fc1.setCobertura("OSDE");
        fc1.setDebe(new BigDecimal("72397439.01"));
        fc1.setAsociadogrupo(231551L);
        fc1.setAsociado(101L);

        // NC del grupo 231551
        Cabecera nc1 = new Cabecera("NCE", "A", 31, 910, LocalDate.of(2026, 9, 14), LocalDate.of(2026, 7, 1), "NC",
                "OSDE");
        nc1.setId(102L);
        nc1.setCobertura("OSDE");
        nc1.setHaber(new BigDecimal("7822013.50"));
        nc1.setAsociadogrupo(231551L);
        nc1.setAsociado(101L);

        // Porción del Recibo RC 07981536 en el grupo 231551
        Cabecera rc1Grp1 = new Cabecera("RC", "X", 0, 7981536, LocalDate.of(2026, 9, 16), LocalDate.of(2026, 7, 1),
                "REC", "OSDE");
        rc1Grp1.setId(103L);
        rc1Grp1.setCobertura("OSDE");
        rc1Grp1.setHaber(new BigDecimal("5005875.69"));
        rc1Grp1.setAsociadogrupo(231551L);
        rc1Grp1.setAsociado(101L);

        // Segundo recibo del grupo 231551
        Cabecera rc2Grp1 = new Cabecera("RC", "X", 0, 7981596, LocalDate.of(2026, 10, 2), LocalDate.of(2026, 7, 1),
                "REC", "OSDE");
        rc2Grp1.setId(104L);
        rc2Grp1.setCobertura("OSDE");
        rc2Grp1.setHaber(new BigDecimal("59569549.82"));
        rc2Grp1.setAsociadogrupo(231551L);
        rc2Grp1.setAsociado(101L);

        // Factura 2 (Grupo 231550)
        Cabecera fc2 = new Cabecera("FCE", "A", 31, 1915, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 7, 1), "FAC",
                "OSDE");
        fc2.setId(201L);
        fc2.setCobertura("OSDE");
        fc2.setDebe(new BigDecimal("20000000.00"));
        fc2.setAsociadogrupo(231550L);
        fc2.setAsociado(201L);

        // Misma porción del Recibo RC 07981536 pero en el grupo 231550
        Cabecera rc1Grp2 = new Cabecera("RC", "X", 0, 7981536, LocalDate.of(2026, 9, 16), LocalDate.of(2026, 7, 1),
                "REC", "OSDE");
        rc1Grp2.setId(202L);
        rc1Grp2.setCobertura("OSDE");
        rc1Grp2.setHaber(new BigDecimal("10961156.20"));
        rc1Grp2.setAsociadogrupo(231550L);
        rc1Grp2.setAsociado(201L);

        when(cabeceraRepository.findCabecerasParaCuentaCorriente())
                .thenReturn(List.of(fc1, nc1, rc1Grp1, rc2Grp1, fc2, rc1Grp2));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(null, null);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        CcFinanciadorDTO fin = resultado.get(0);

        // Verificar Factura 1 (Grupo 231551): debe quedar con saldo EXACTO 0.00
        CcPeriodoDTO per = fin.getPeriodos().get(0);
        CcComprobanteDTO fc1Dto = per.getComprobantes().stream()
                .filter(c -> c.getId().equals(101L))
                .findFirst().orElseThrow();
        assertEquals(new BigDecimal("0.00"), fc1Dto.getSaldo(), "El saldo de la Factura 1 debe ser exactamente 0.00");
        assertEquals(new BigDecimal("72397439.01"), fc1Dto.getFacturacionFc());
        assertEquals(new BigDecimal("7822013.50"), fc1Dto.getDebitosNc());
        assertEquals(new BigDecimal("64575425.51"), fc1Dto.getCobranzasRc()); // 5005875.69 + 59569549.82

        // Verificar Factura 2 (Grupo 231550): toma solo su porción del recibo RC
        // 07981536 ($10961156.20)
        CcComprobanteDTO fc2Dto = per.getComprobantes().stream()
                .filter(c -> c.getId().equals(201L))
                .findFirst().orElseThrow();
        assertEquals(new BigDecimal("10961156.20"), fc2Dto.getCobranzasRc());
        assertEquals(new BigDecimal("9038843.80"), fc2Dto.getSaldo()); // 20000000 - 10961156.20
    }

    @Test
    @DisplayName("getRecibosNoImputados ejecuta consulta dinámica correctamente con filtros")
    void testObtenerRecibosNoImputados() {
        jakarta.persistence.TypedQuery<com.debitos.backend.dto.ComprobanteSinAsociarDTO> typedQueryMock = mock(jakarta.persistence.TypedQuery.class);
        when(entityManager.createQuery(anyString(), eq(com.debitos.backend.dto.ComprobanteSinAsociarDTO.class))).thenReturn(typedQueryMock);
        when(typedQueryMock.getResultList()).thenReturn(Collections.emptyList());

        List<com.debitos.backend.dto.ComprobanteSinAsociarDTO> res = directorioService.getRecibosNoImputados("OSDE", "2026-09-01", "2026-09-30");

        assertNotNull(res);
        verify(typedQueryMock).setParameter("financiador", "OSDE");
        verify(typedQueryMock).setParameter("fechaDesde", LocalDate.of(2026, 9, 1));
        verify(typedQueryMock).setParameter("fechaHasta", LocalDate.of(2026, 9, 30));
        verify(typedQueryMock).getResultList();
    }

    @Test
    @DisplayName("getCuentaCorrienteTresNiveles no vincula un recibo (RC 181, asociadogrupo 84779) a una factura de otro expediente (FAC A0031-00009553, asociadogrupo 236992)")
    void testCuentaCorriente_noVinculaReciboDeOtroAsociadoGrupoPorColisionDeIdOAsociado() {
        when(cabeceraRepository.findIdsGruposFacturasPorRangoPeriodos(any(), any()))
                .thenReturn(List.of(236992L));

        // FAC A0031-00009553: id = 235480, asociadogrupo = 236992, fecha = 2026-11-02, periodo = 2026-10-01
        CabeceraLigeraDTO fac9553 = new CabeceraLigeraDTO(
                235480L, "FAC", "A", 31, 9553,
                LocalDate.of(2026, 11, 2), LocalDate.of(2026, 10, 1),
                "AMB", "770", "GALENO ARGENTINA S.A.", "APP_AUTO_ADMIN",
                null, 235480L, 236992L,
                new BigDecimal("4520962.38"), BigDecimal.ZERO, 1, "FAC A0031-00009553"
        );

        // RC 181: pertenece en realidad al asociadogrupo = 84779 (fecha 2024-08-09),
        // pero tiene asociado = 235480L (o id = 236992L) por colisión
        CabeceraLigeraDTO rc181 = new CabeceraLigeraDTO(
                236992L, "RC", "X", 0, 181,
                LocalDate.of(2024, 8, 9), LocalDate.of(2024, 8, 1),
                "REC", "770", "GALENO ARGENTINA S.A.", "APP_AUTO_ADMIN",
                236992L, 235480L, 84779L,
                BigDecimal.ZERO, new BigDecimal("4033970.55"), 1, "181"
        );

        when(cabeceraRepository.findLigeraByGrupoOrAsociadogrupoOrIdIn(List.of(236992L)))
                .thenReturn(new ArrayList<>(List.of(fac9553, rc181)));
        when(cabeceraRepository.findLigeraByAsociadoIn(anyCollection()))
                .thenReturn(List.of(rc181));

        List<CcFinanciadorDTO> resultado = directorioService.getCuentaCorrienteTresNiveles(
                null, null, "2026-10-01", "2026-10-31");

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        CcFinanciadorDTO fin = resultado.get(0);
        assertEquals(new BigDecimal("4520962.38"), fin.getFacturacionFc());
        assertEquals(new BigDecimal("0.00"), fin.getCobranzasRc(),
                "RC 181 (asociadogrupo 84779) no debe computar como cobranza de FAC 9553 (asociadogrupo 236992)");
        assertEquals(new BigDecimal("4520962.38"), fin.getSaldo(),
                "El saldo de FAC 9553 debe permanecer íntegro en $4.520.962,38");

        CcComprobanteDTO fcDto = fin.getPeriodos().get(0).getComprobantes().get(0);
        assertEquals(1, fcDto.getHijos().size(), "Solo debe tener el hijo de origen de la propia factura");
        assertFalse(fcDto.getHijos().stream().anyMatch(h -> "RC".equalsIgnoreCase(h.getTipo())),
                "No debe colgar el RC 181 bajo la FAC A0031-00009553");
    }

    @Test
    @DisplayName("getTrazabilidad no vincula una NC de otro asociadogrupo aunque su id coincida con el asociadogrupo de la FC")
    void testTrazabilidad_noVinculaNotaCreditoDeOtroAsociadoGrupoPorColisionDeIdOAsociado() {
        when(cabeceraRepository.findIdsGruposFacturasPorRangoFechasYFinanciador(any(), any(), any(), anyInt()))
                .thenReturn(List.of(235493L));

        // FAC A0031-00009508: id = 61995L, asociadogrupo = 235493L, ptovta = 31, numero = 9508, asociado = 235493L (colisión histórica en BD)
        CabeceraLigeraDTO fac9508 = new CabeceraLigeraDTO(
                61995L, "FAC", "A", 31, 9508,
                LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 1),
                "AMB", "461", "MEDICUS", "ARANDAF",
                null, 235493L, 235493L,
                new BigDecimal("625329.72"), BigDecimal.ZERO, 1, "FAC A0031-00009508"
        );

        // NC B0032-00004541: id = 235493L (coincide con el asociadogrupo de la FC), pero asociadogrupo = 210784L, asociado = 776L
        CabeceraLigeraDTO nc4541 = new CabeceraLigeraDTO(
                235493L, "NC", "B", 32, 4541,
                LocalDate.of(2026, 10, 30), LocalDate.of(2026, 10, 1),
                "AMB", "461", "MEDICUS", "APP_AUTO_ADMIN",
                null, 776L, 210784L,
                BigDecimal.ZERO, new BigDecimal("5499232.94"), 1, "NC B0032-00004541"
        );

        when(cabeceraRepository.findLigeraByGrupoOrAsociadogrupoOrIdIn(List.of(235493L)))
                .thenReturn(new ArrayList<>(List.of(fac9508, nc4541)));

        List<CadenaTrazabilidadDTO> cadenas = directorioService.getTrazabilidad(
                "461", null, "2026-10", "2026-10-01", "2026-10-31");

        assertNotNull(cadenas);
        CadenaTrazabilidadDTO cadenaFac = cadenas.stream()
                .filter(c -> c.getIdPrestacion() != null && c.getIdPrestacion().contains("9508"))
                .findFirst()
                .orElse(null);
        assertNotNull(cadenaFac, "Debe existir la cadena para FAC A0031-00009508");

        boolean tieneNcAjena = cadenaFac.getHistorialEventos().stream()
                .anyMatch(n -> "NC".equalsIgnoreCase(n.getTipo()) && n.getComprobante().contains("4541"));
        assertFalse(tieneNcAjena, "La cadena de trazabilidad de FAC 9508 no debe incluir la NC B0032-00004541 que pertenece al asociadogrupo 210784");
    }
}
