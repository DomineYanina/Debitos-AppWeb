package com.debitos.backend.controller;

import com.debitos.backend.dto.directorio.*;
import com.debitos.backend.service.DirectorioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class DirectorioControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DirectorioService directorioService;

    @InjectMocks
    private DirectorioController directorioController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(directorioController).build();
    }

    @Test
    @DisplayName("GET /api/directorio/coberturas debe retornar lista de coberturas")
    void testObtenerCoberturas() throws Exception {
        when(directorioService.obtenerCoberturasDisponibles()).thenReturn(List.of(
                new DirectorioCoberturaDTO("OSDE", "OSDE BINARIO"),
                new DirectorioCoberturaDTO("SWISS", "SWISS MEDICAL")
        ));

        mockMvc.perform(get("/api/directorio/coberturas")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].codigo").value("OSDE"))
                .andExpect(jsonPath("$[0].nombre").value("OSDE BINARIO"));
    }

    @Test
    @DisplayName("GET /api/directorio/tipos-documento debe retornar lista de tipos de comprobantes")
    void testObtenerTiposDocumento() throws Exception {
        when(directorioService.obtenerTiposDocumentoDisponibles()).thenReturn(List.of("FAC", "FC", "FCA", "FCE"));

        mockMvc.perform(get("/api/directorio/tipos-documento")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[0]").value("FAC"))
                .andExpect(jsonPath("$[3]").value("FCE"));
    }

    @Test
    @DisplayName("GET /api/directorio/totales debe retornar los 4 totales del panel macro")
    void testObtenerTotales() throws Exception {
        DirectorioTotalesDTO totales = new DirectorioTotalesDTO(
                new BigDecimal("1500000.00"),
                new BigDecimal("900000.00"),
                new BigDecimal("100000.00"),
                new BigDecimal("500000.00"),
                15,
                42
        );

        when(directorioService.obtenerTotalesMacro(any(), any(), any(), any())).thenReturn(totales);

        mockMvc.perform(get("/api/directorio/totales")
                        .param("codigoCobertura", "OSDE")
                        .param("tipoDoc", "FCE")
                        .param("fechaDesde", "2026-08-01")
                        .param("fechaHasta", "2026-08-31")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalFacturado").value(1500000.00))
                .andExpect(jsonPath("$.cobranzaEfectiva").value(900000.00))
                .andExpect(jsonPath("$.perdidaAsumida").value(100000.00))
                .andExpect(jsonPath("$.deudaNeta").value(500000.00))
                .andExpect(jsonPath("$.cantidadFacturas").value(15))
                .andExpect(jsonPath("$.cantidadComprobantes").value(42));
    }

    @Test
    @DisplayName("GET /api/directorio/grupos debe retornar lista de facturas con sub-comprobantes")
    void testObtenerGrupos() throws Exception {
        DirectorioGrupoFacturaDTO grupo = new DirectorioGrupoFacturaDTO();
        grupo.setId(101L);
        grupo.setTipo("FC");
        grupo.setLetra("A");
        grupo.setPtovta(1);
        grupo.setNumero(1001);
        grupo.setFecha(LocalDate.of(2026, 8, 15));
        grupo.setTotalFacturado(new BigDecimal("50000.00"));
        grupo.setCantidadRefacturaciones(2);

        DirectorioComprobanteDTO derivado = new DirectorioComprobanteDTO(
                201L, "NC", "A", 1, 501, LocalDate.of(2026, 8, 20),
                new BigDecimal("5000.00"), BigDecimal.ZERO, new BigDecimal("5000.00"),
                new BigDecimal("5000.00"), BigDecimal.ZERO, BigDecimal.ZERO,
                "DEB", 1
        );
        grupo.setComprobantesDerivados(List.of(derivado));

        when(directorioService.obtenerGruposFacturas(any(), any(), any(), any())).thenReturn(List.of(grupo));

        mockMvc.perform(get("/api/directorio/grupos")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].numero").value(1001))
                .andExpect(jsonPath("$[0].cantidadRefacturaciones").value(2))
                .andExpect(jsonPath("$[0].comprobantesDerivados.length()").value(1))
                .andExpect(jsonPath("$[0].comprobantesDerivados[0].tipo").value("NC"));
    }

    @Test
    @DisplayName("GET /api/directorio/motivos debe retornar lista de motivos agrupados")
    void testObtenerMotivos() throws Exception {
        when(directorioService.obtenerDistribucionMotivos(any(), any(), any(), any())).thenReturn(List.of(
                new DirectorioMotivoDebitoDTO("Falta de autorización", new BigDecimal("45000.00"), new BigDecimal("60.00"), 12),
                new DirectorioMotivoDebitoDTO("Falta firma profesional", new BigDecimal("30000.00"), new BigDecimal("40.00"), 8)
        ));

        mockMvc.perform(get("/api/directorio/motivos")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].motivo").value("Falta de autorización"))
                .andExpect(jsonPath("$[0].porcentaje").value(60.00));
    }

    @Test
    @DisplayName("GET /api/directorio/motivo-detalle debe retornar prestaciones por motivo")
    void testObtenerPrestacionesPorMotivo() throws Exception {
        DirectorioPrestacionDetalleDTO prestacion = new DirectorioPrestacionDetalleDTO(
                501, "GOMEZ JUAN", "12345678", "PLAN 210", "SANATORIO", "DR PEREZ",
                LocalDate.of(2026, 8, 10), "420101", "CONSULTA MEDICA",
                "NC", "A", 1, 301, LocalDate.of(2026, 8, 20),
                "Falta de autorización", "No adjunta autorización previa",
                new BigDecimal("4500.00"), true
        );

        when(directorioService.obtenerPrestacionesPorMotivo(eq("Falta de autorización"), any(), any(), any(), any()))
                .thenReturn(List.of(prestacion));

        mockMvc.perform(get("/api/directorio/motivo-detalle")
                        .param("motivo", "Falta de autorización")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].paciente").value("GOMEZ JUAN"))
                .andExpect(jsonPath("$[0].motivoDebito").value("Falta de autorización"))
                .andExpect(jsonPath("$[0].comentariosDebito").value("No adjunta autorización previa"));
    }
}
