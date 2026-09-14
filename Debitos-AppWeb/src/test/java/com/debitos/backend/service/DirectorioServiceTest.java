package com.debitos.backend.service;

import com.debitos.backend.dto.directorio.*;
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
        when(entityManager.createNativeQuery(anyString())).thenReturn(mockQuery);
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
        // Mock query responses:
        // 1. FC: totalFacturado=100000, cant=10
        // 2. RC: cobranzaEfectiva=60000
        // 3. Pérdida: perdidaAsumida=10000
        // 4. ND: totalNd=5000
        // 5. TotalComp: cant=25
        when(mockQuery.getSingleResult())
                .thenReturn(new Object[]{new BigDecimal("100000.00"), 10L})
                .thenReturn(new BigDecimal("60000.00"))
                .thenReturn(new BigDecimal("10000.00"))
                .thenReturn(new BigDecimal("5000.00"))
                .thenReturn(25L);

        DirectorioTotalesDTO totales = directorioService.obtenerTotalesMacro("OSDE", null, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31));

        assertNotNull(totales);
        assertEquals(new BigDecimal("100000.00"), totales.getTotalFacturado());
        assertEquals(new BigDecimal("60000.00"), totales.getCobranzaEfectiva());
        assertEquals(new BigDecimal("10000.00"), totales.getPerdidaAsumida());
        // Deuda Neta = 100000 + 5000 - 60000 - 10000 = 35000
        assertEquals(new BigDecimal("35000.00"), totales.getDeudaNeta());
        assertEquals(10L, totales.getCantidadFacturas());
        assertEquals(25L, totales.getCantidadComprobantes());
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
        fcMadre.setTipo("FC");

        Cabecera ncHija = new Cabecera();
        ncHija.setId(2L);
        ncHija.setTipo("NC");
        ncHija.setLetra("A");
        ncHija.setPtovta(1);
        ncHija.setNumero(2001);
        ncHija.setFecha(LocalDate.of(2026, 8, 10));

        Cabecera ndHija = new Cabecera();
        ndHija.setId(3L);
        ndHija.setTipo("ND");
        ndHija.setLetra("A");
        ndHija.setPtovta(1);
        ndHija.setNumero(3001);
        ndHija.setFecha(LocalDate.of(2026, 8, 15));
        ndHija.setDebe(new BigDecimal("3000.00"));

        when(cabeceraRepository.findByGrupoOrAsociadogrupoOrId(100L)).thenReturn(List.of(fcMadre, ncHija, ndHija));

        NotaDeCredito ncItem = new NotaDeCredito();
        ncItem.setDebitoaceptado(true);
        ncItem.setImporteDebitado(new BigDecimal("4000.00"));
        when(notaDeCreditoRepository.findByCabecera_Id(2L)).thenReturn(List.of(ncItem));

        NotaDeDebito ndItem = new NotaDeDebito();
        ndItem.setImporterefactura(new BigDecimal("3000.00"));
        when(notaDeDebitoRepository.findByCabecera_Id(3L)).thenReturn(List.of(ndItem));

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
}
