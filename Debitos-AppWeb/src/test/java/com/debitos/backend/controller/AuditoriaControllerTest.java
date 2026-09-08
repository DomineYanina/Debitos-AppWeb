package com.debitos.backend.controller;

import com.debitos.backend.dto.*;
import com.debitos.backend.model.RegistroUsabilidad;
import com.debitos.backend.repository.RegistroUsabilidadRepository;
import com.debitos.backend.service.AuditoriaService;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuditoriaControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuditoriaService auditoriaService;

    @Mock
    private RegistroUsabilidadRepository registroUsabilidadRepository;

    @InjectMocks
    private AuditoriaController auditoriaController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(auditoriaController).build();
    }

    @Test
    @DisplayName("GET /api/auditoria/tiene-nc - Retorna 200 OK con lista")
    void testTieneNotaDeCredito() throws Exception {
        when(auditoriaService.obtenerNotasDeCreditoCreadasParaFC("A", 1, 1000)).thenReturn(List.of());

        mockMvc.perform(get("/api/auditoria/tiene-nc")
                        .param("letra", "A")
                        .param("puntoVenta", "1")
                        .param("numero", "1000"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/auditoria/tiene-nc-ajuste-iva - Retorna 200 OK")
    void testTieneNcAjusteIva() throws Exception {
        when(auditoriaService.tieneNcAjusteIva("FC", "A", 1, 1000)).thenReturn(true);

        mockMvc.perform(get("/api/auditoria/tiene-nc-ajuste-iva")
                        .param("tipo", "FC")
                        .param("letra", "A")
                        .param("puntoVenta", "1")
                        .param("numero", "1000"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    @DisplayName("GET /api/auditoria/tiene-nd - Retorna 200 OK")
    void testTieneNotaDeDebito() throws Exception {
        when(auditoriaService.obtenerNotasDeDebitoCreadasParaNC("A", 1, 2000)).thenReturn(List.of());

        mockMvc.perform(get("/api/auditoria/tiene-nd")
                        .param("letra", "A")
                        .param("puntoVenta", "1")
                        .param("numero", "2000"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/auditoria/tiene-nc-para-nd - Retorna 200 OK")
    void testTieneNotaDeCreditoParaND() throws Exception {
        when(auditoriaService.obtenerNotaDeCreditoCreadaParaND("A", 1, 3000)).thenReturn(null);

        mockMvc.perform(get("/api/auditoria/tiene-nc-para-nd")
                        .param("letra", "A")
                        .param("puntoVenta", "1")
                        .param("numero", "3000"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/auditoria/documento-asociado-nc - Retorna 200 OK")
    void testObtenerDocumentoAsociadoParaNC() throws Exception {
        when(auditoriaService.obtenerDocumentoAsociadoParaNC("A", 1, 2000)).thenReturn(null);

        mockMvc.perform(get("/api/auditoria/documento-asociado-nc")
                        .param("letra", "A")
                        .param("puntoVenta", "1")
                        .param("numero", "2000"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/auditoria/cabeceras-disponibles - Retorna 200 OK")
    void testObtenerCabecerasDisponibles() throws Exception {
        when(auditoriaService.obtenerCabecerasDisponibles("NC", "FC", "A", 1, 1000)).thenReturn(List.of());

        mockMvc.perform(get("/api/auditoria/cabeceras-disponibles")
                        .param("tipo", "NC")
                        .param("origen", "FC")
                        .param("letra", "A")
                        .param("puntoVenta", "1")
                        .param("numero", "1000"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/auditoria/buscar - Retorna 200 OK con resultado unificado")
    void testBuscarUnificado() throws Exception {
        ResultadoBusquedaDTO resultado = new ResultadoBusquedaDTO();
        when(auditoriaService.buscarUnificado("FC", "A", 1, 1000)).thenReturn(resultado);

        mockMvc.perform(get("/api/auditoria/buscar")
                        .param("tipo", "FC")
                        .param("letra", "A")
                        .param("puntoVenta", "1")
                        .param("numero", "1000"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/auditoria/buscar - Retorna 404 Not Found cuando resultado es nulo")
    void testBuscarUnificadoNotFound() throws Exception {
        when(auditoriaService.buscarUnificado("FC", "A", 1, 9999)).thenReturn(null);

        mockMvc.perform(get("/api/auditoria/buscar")
                        .param("tipo", "FC")
                        .param("letra", "A")
                        .param("puntoVenta", "1")
                        .param("numero", "9999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/auditoria/guardar-parcialmente - Retorna 200 OK")
    void testGuardarParcialmente() throws Exception {
        GuardarParcialRequest request = new GuardarParcialRequest();
        request.setDocumentoOrigen("FC");
        request.setLetra("A");
        request.setPtovta(1);
        request.setNumero(1000);

        mockMvc.perform(post("/api/auditoria/guardar-parcialmente")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Guardado exitoso"));

        verify(auditoriaService, times(1)).procesarGuardadoParcial(any(GuardarParcialRequest.class));
    }

    @Test
    @DisplayName("POST /api/auditoria/nueva-nota-credito - Retorna 200 OK")
    void testGuardarNuevaNotaCredito() throws Exception {
        NuevaNotaCreditoRequest request = new NuevaNotaCreditoRequest();

        mockMvc.perform(post("/api/auditoria/nueva-nota-credito")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Nota de Crédito generada exitosamente"));

        verify(auditoriaService, times(1)).procesarNuevaNotaCredito(any(NuevaNotaCreditoRequest.class));
    }

    @Test
    @DisplayName("PUT /api/auditoria/editar-nc-ajuste-iva - Retorna 200 OK")
    void testEditarNcAjusteDeIva() throws Exception {
        NuevaNotaCreditoRequest request = new NuevaNotaCreditoRequest();

        mockMvc.perform(put("/api/auditoria/editar-nc-ajuste-iva")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Nota de Crédito por Ajuste de IVA actualizada exitosamente"));

        verify(auditoriaService, times(1)).editarNcAjusteDeIva(any(NuevaNotaCreditoRequest.class));
    }

    @Test
    @DisplayName("POST /api/auditoria/nueva-nota-debito - Retorna 200 OK")
    void testGuardarNuevaNotaDebito() throws Exception {
        NuevaNotaDebitoRequest request = new NuevaNotaDebitoRequest();

        mockMvc.perform(post("/api/auditoria/nueva-nota-debito")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Nota de Débito generada exitosamente"));

        verify(auditoriaService, times(1)).procesarNuevaNotaDebito(any(NuevaNotaDebitoRequest.class));
    }

    @Test
    @DisplayName("POST /api/auditoria/nueva-nota-debito-ajuste-iva - Retorna 200 OK")
    void testGuardarNuevaNotaDebitoAjusteIva() throws Exception {
        NuevaNotaDebitoAjusteIvaRequest request = new NuevaNotaDebitoAjusteIvaRequest();

        mockMvc.perform(post("/api/auditoria/nueva-nota-debito-ajuste-iva")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Nota de Débito por Ajuste de IVA generada exitosamente"));

        verify(auditoriaService, times(1)).procesarNuevaNotaDebitoAjusteIva(any(NuevaNotaDebitoAjusteIvaRequest.class));
    }

    @Test
    @DisplayName("PUT /api/auditoria/grupo/{idGrupo}/estado/{nuevoEstado} - Retorna CambioEstadoResponse")
    void testCambiarEstadoGrupo() throws Exception {
        CambioEstadoResponse response = new CambioEstadoResponse(false, "Estado actualizado", true);
        when(auditoriaService.cambiarEstadoGrupo(50L, 2, false)).thenReturn(response);

        mockMvc.perform(put("/api/auditoria/grupo/50/estado/2")
                        .param("forzarCierre", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exito").value(true))
                .andExpect(jsonPath("$.requiereConfirmacion").value(false));

        verify(auditoriaService, times(1)).cambiarEstadoGrupo(50L, 2, false);
    }

    @Test
    @DisplayName("POST /api/auditoria/telemetria/usabilidad - Retorna 200 OK")
    void testRegistrarUsabilidad() throws Exception {
        RegistroUsabilidad metrica = new RegistroUsabilidad();
        metrica.setUsuario("auditor");
        metrica.setEvento("CLICK_SEARCH");

        mockMvc.perform(post("/api/auditoria/telemetria/usabilidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(metrica)))
                .andExpect(status().isOk());

        verify(registroUsabilidadRepository, times(1)).save(any(RegistroUsabilidad.class));
    }

    @Test
    @DisplayName("POST /api/auditoria/telemetria/usabilidad/lote - Retorna 200 OK")
    void testRegistrarUsabilidadLote() throws Exception {
        RegistroUsabilidad metrica = new RegistroUsabilidad();

        mockMvc.perform(post("/api/auditoria/telemetria/usabilidad/lote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(metrica))))
                .andExpect(status().isOk());

        verify(registroUsabilidadRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("GET /api/auditoria/historial-comprobantes - Retorna lista")
    void testObtenerHistorialComprobantes() throws Exception {
        when(auditoriaService.obtenerHistorialComprobantes("FC", "A", 1, 1000))
                .thenReturn(List.of(new FilaHistorialDTO()));

        mockMvc.perform(get("/api/auditoria/historial-comprobantes")
                        .param("tipo", "FC")
                        .param("letra", "A")
                        .param("puntoVenta", "1")
                        .param("numero", "1000"))
                .andExpect(status().isOk());
    }
}
