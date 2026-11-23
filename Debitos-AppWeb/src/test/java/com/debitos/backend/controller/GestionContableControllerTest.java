package com.debitos.backend.controller;

import com.debitos.backend.dto.contable.CoberturaAliasDTO;
import com.debitos.backend.dto.contable.FacturaAnuladaDTO;
import com.debitos.backend.dto.contable.GuardarAliasRequest;
import com.debitos.backend.dto.contable.HistorialAjusteDTO;
import com.debitos.backend.dto.contable.PrestacionConsideracionDTO;
import com.debitos.backend.service.GestionContableService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class GestionContableControllerTest {

    private MockMvc mockMvc;

    @Mock
    private GestionContableService gestionContableService;

    @InjectMocks
    private GestionContableController gestionContableController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(gestionContableController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    @DisplayName("GET /api/contable/coberturas debe retornar página ordenada de coberturas")
    void testListarCoberturas() throws Exception {
        List<CoberturaAliasDTO> dtos = List.of(
                new CoberturaAliasDTO("443", "OSDE", "OSDE BINARIO"),
                new CoberturaAliasDTO("679", "SWISS MEDICAL GROUP", "SWISS MEDICAL")
        );
        Page<CoberturaAliasDTO> page = new PageImpl<>(dtos, PageRequest.of(0, 20), 2);

        when(gestionContableService.buscarCoberturasPaginadas(isNull(), eq(0), eq(20), eq("nombreMostrar"), eq("desc")))
                .thenReturn(page);

        mockMvc.perform(get("/api/contable/coberturas")
                .param("page", "0")
                .param("size", "20")
                .param("sortBy", "nombreMostrar")
                .param("sortDir", "desc")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].codigoCobertura").value("443"))
                .andExpect(jsonPath("$.content[0].nombreMostrar").value("OSDE BINARIO"))
                .andExpect(jsonPath("$.content[1].codigoCobertura").value("679"));

        verify(gestionContableService).buscarCoberturasPaginadas(null, 0, 20, "nombreMostrar", "desc");
    }

    @Test
    @DisplayName("GET /api/contable/prestaciones debe aceptar filtro, estado, sortBy y sortDir")
    void testListarPrestacionesConOrden() throws Exception {
        List<PrestacionConsideracionDTO> dtos = List.of(
                new PrestacionConsideracionDTO("420101", "CONSULTA", "No considerar", "No considerar", "Considerar")
        );
        Page<PrestacionConsideracionDTO> page = new PageImpl<>(dtos, PageRequest.of(0, 20), 1);

        when(gestionContableService.buscarPrestaciones(eq("420"), eq("No considerar"), isNull(), eq(0), eq(20), eq("descripcion"), eq("asc")))
                .thenReturn(page);

        mockMvc.perform(get("/api/contable/prestaciones")
                .param("filtro", "420")
                .param("estado", "No considerar")
                .param("page", "0")
                .param("size", "20")
                .param("sortBy", "descripcion")
                .param("sortDir", "asc")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].codigo").value("420101"))
                .andExpect(jsonPath("$.content[0].estado").value("No considerar"))
                .andExpect(jsonPath("$.content[0].estadoAmbulatorio").value("No considerar"))
                .andExpect(jsonPath("$.content[0].estadoInternado").value("Considerar"));

        verify(gestionContableService).buscarPrestaciones("420", "No considerar", null, 0, 20, "descripcion", "asc");
    }

    @Test
    @DisplayName("GET /api/contable/prestaciones debe aceptar estadoAmbulatorio y estadoInternado")
    void testListarPrestacionesAmbulatorioInternado() throws Exception {
        List<PrestacionConsideracionDTO> dtos = List.of(
                new PrestacionConsideracionDTO("420101", "CONSULTA", "Considerar", "Considerar", "No considerar")
        );
        Page<PrestacionConsideracionDTO> page = new PageImpl<>(dtos, PageRequest.of(0, 20), 1);

        when(gestionContableService.buscarPrestaciones(isNull(), eq("Considerar"), eq("No considerar"), eq(0), eq(20), eq("codigo"), eq("desc")))
                .thenReturn(page);

        mockMvc.perform(get("/api/contable/prestaciones")
                .param("estadoAmbulatorio", "Considerar")
                .param("estadoInternado", "No considerar")
                .param("page", "0")
                .param("size", "20")
                .param("sortBy", "codigo")
                .param("sortDir", "desc")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].codigo").value("420101"))
                .andExpect(jsonPath("$.content[0].estadoAmbulatorio").value("Considerar"))
                .andExpect(jsonPath("$.content[0].estadoInternado").value("No considerar"));

        verify(gestionContableService).buscarPrestaciones(null, "Considerar", "No considerar", 0, 20, "codigo", "desc");
    }

    @Test
    @DisplayName("GET /api/contable/facturas-anuladas debe aceptar sortBy y sortDir")
    void testListarFacturasAnuladasConOrden() throws Exception {
        FacturaAnuladaDTO dto = new FacturaAnuladaDTO();
        dto.setIdCabecera(1L);
        dto.setComprobante("FC A 0030-00000123");
        Page<FacturaAnuladaDTO> page = new PageImpl<>(List.of(dto), PageRequest.of(0, 20), 1);

        when(gestionContableService.listarFacturasAnuladas(0, 20, "importe", "desc")).thenReturn(page);

        mockMvc.perform(get("/api/contable/facturas-anuladas")
                .param("page", "0")
                .param("size", "20")
                .param("sortBy", "importe")
                .param("sortDir", "desc")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].idCabecera").value(1));

        verify(gestionContableService).listarFacturasAnuladas(0, 20, "importe", "desc");
    }

    @Test
    @DisplayName("GET /api/contable/historial debe aceptar sortBy y sortDir")
    void testObtenerHistorialConOrden() throws Exception {
        HistorialAjusteDTO dto = new HistorialAjusteDTO();
        dto.setId(10L);
        dto.setReferencia("443");
        Page<HistorialAjusteDTO> page = new PageImpl<>(List.of(dto), PageRequest.of(0, 20), 1);

        when(gestionContableService.obtenerHistorial("443", 0, 20, "operacion", "asc")).thenReturn(page);

        mockMvc.perform(get("/api/contable/historial")
                .param("referencia", "443")
                .param("page", "0")
                .param("size", "20")
                .param("sortBy", "operacion")
                .param("sortDir", "asc")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].referencia").value("443"));

        verify(gestionContableService).obtenerHistorial("443", 0, 20, "operacion", "asc");
    }

    @Test
    @DisplayName("GET /api/contable/coberturas/buscar debe retornar cobertura por código")
    void testBuscarCobertura() throws Exception {
        CoberturaAliasDTO dto = new CoberturaAliasDTO("443", "OSDE", "OSDE");
        when(gestionContableService.obtenerCobertura("443")).thenReturn(dto);

        mockMvc.perform(get("/api/contable/coberturas/buscar")
                .param("codigo", "443")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigoCobertura").value("443"))
                .andExpect(jsonPath("$.nombreOriginal").value("OSDE"));
    }

    @Test
    @DisplayName("POST /api/contable/coberturas/guardar-alias debe actualizar el alias")
    void testGuardarAliasCobertura() throws Exception {
        CoberturaAliasDTO dto = new CoberturaAliasDTO("443", "OSDE", "OSDE BINARIO");
        when(gestionContableService.guardarAliasCobertura(any(GuardarAliasRequest.class), any())).thenReturn(dto);

        mockMvc.perform(post("/api/contable/coberturas/guardar-alias")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"codigoCobertura\":\"443\",\"nombreOriginal\":\"OSDE\",\"nombreMostrar\":\"OSDE BINARIO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreMostrar").value("OSDE BINARIO"));
    }

    @Test
    @DisplayName("GET /api/contable/periodos debe retornar página de facturas con período corregido")
    void testListarFacturasPeriodoCorregido() throws Exception {
        com.debitos.backend.dto.contable.FacturaPeriodoDTO dto = new com.debitos.backend.dto.contable.FacturaPeriodoDTO();
        dto.setIdCabecera(100L);
        dto.setTipo("FC");
        dto.setLetra("A");
        dto.setPtovta(30);
        dto.setNumero(1001);
        dto.setCobertura("OSDE");

        Page<com.debitos.backend.dto.contable.FacturaPeriodoDTO> page = new PageImpl<>(List.of(dto), PageRequest.of(0, 20), 1);
        when(gestionContableService.listarFacturasPeriodoCorregido(any())).thenReturn(page);

        mockMvc.perform(get("/api/contable/periodos")
                .param("page", "0")
                .param("size", "20")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].numero").value(1001))
                .andExpect(jsonPath("$.content[0].cobertura").value("OSDE"));
    }

    @Test
    @DisplayName("GET /api/contable/facturas-anuladas/candidatos-anulador debe retornar candidatos del mismo grupo")
    void testListarCandidatosAnulador() throws Exception {
        FacturaAnuladaDTO cand = new FacturaAnuladaDTO();
        cand.setIdCabecera(8544L);
        cand.setAsociadogrupo(220587L);
        cand.setComprobante("NC A0031-00001775");
        cand.setTipo("NC");

        when(gestionContableService.buscarCandidatosAnuladorPorGrupo(8542L)).thenReturn(List.of(cand));

        mockMvc.perform(get("/api/contable/facturas-anuladas/candidatos-anulador")
                .param("idCabeceraOrigen", "8542")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].idCabecera").value(8544))
                .andExpect(jsonPath("$[0].asociadogrupo").value(220587))
                .andExpect(jsonPath("$[0].comprobante").value("NC A0031-00001775"));

        verify(gestionContableService).buscarCandidatosAnuladorPorGrupo(8542L);
    }
}
