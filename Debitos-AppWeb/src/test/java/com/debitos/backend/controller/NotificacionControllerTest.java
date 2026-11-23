package com.debitos.backend.controller;

import com.debitos.backend.dto.NotificacionDTO;
import com.debitos.backend.service.NotificacionService;
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

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class NotificacionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private NotificacionService notificacionService;

    @InjectMocks
    private NotificacionController notificacionController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificacionController).build();
    }

    @Test
    @DisplayName("Obtener notificaciones recientes - Retorna 200 OK con lista")
    void testObtenerNotificacionesRecientes() throws Exception {
        NotificacionDTO dto = new NotificacionDTO(
                1L, "INGRESO_MANUAL_NC", "Título", "Mensaje", "operador",
                ZonedDateTime.now(), "NC B-0001-00000001", "NC", "B", 1, 1, "INGRESO_MANUAL_NC", false
        );

        when(notificacionService.obtenerNotificacionesParaRol(eq("ADMIN"), nullable(String.class))).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/notificaciones/recientes").param("rol", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].titulo").value("Título"));
    }

    @Test
    @DisplayName("Obtener notificaciones recientes con usuario - Pasa usuario al servicio")
    void testObtenerNotificacionesRecientesConUsuario() throws Exception {
        NotificacionDTO dto = new NotificacionDTO(
                16L, "SOLICITUD_ANULACION_DOCUMENTO", "Título", "Mensaje", "Paola",
                ZonedDateTime.now(), "FC A-0032-00001137", "FC", "A", 32, 1137, "SOLICITUD_ANULACION_DOCUMENTO", false
        );

        when(notificacionService.obtenerNotificacionesParaRol("OPERADOR_CONTADURIA", "ErnestoDiaz")).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/notificaciones/recientes")
                        .param("rol", "OPERADOR_CONTADURIA")
                        .param("usuario", "ErnestoDiaz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(16))
                .andExpect(jsonPath("$[0].leida").value(false));
    }

    @Test
    @DisplayName("Marcar notificación como leída - Retorna 200 OK")
    void testMarcarComoLeida() throws Exception {
        mockMvc.perform(put("/api/notificaciones/12/leer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Notificación marcada como leída"));

        verify(notificacionService, times(1)).marcarComoLeida(12L, null);
    }

    @Test
    @DisplayName("Marcar notificación como leída con usuario - Pasa usuario al servicio")
    void testMarcarComoLeidaConUsuario() throws Exception {
        mockMvc.perform(put("/api/notificaciones/16/leer").param("usuario", "ErnestoDiaz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Notificación marcada como leída"));

        verify(notificacionService, times(1)).marcarComoLeida(16L, "ErnestoDiaz");
    }

    @Test
    @DisplayName("Marcar todas como leídas - Retorna 200 OK")
    void testMarcarTodasComoLeidas() throws Exception {
        mockMvc.perform(put("/api/notificaciones/leer-todas").param("rol", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Todas las notificaciones fueron marcadas como leídas"));

        verify(notificacionService, times(1)).marcarTodasComoLeidas("ADMIN", null);
    }

    @Test
    @DisplayName("Marcar todas como leídas con usuario - Pasa usuario al servicio")
    void testMarcarTodasComoLeidasConUsuario() throws Exception {
        mockMvc.perform(put("/api/notificaciones/leer-todas")
                        .param("rol", "OPERADOR_CONTADURIA")
                        .param("usuario", "ErnestoDiaz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Todas las notificaciones fueron marcadas como leídas"));

        verify(notificacionService, times(1)).marcarTodasComoLeidas("OPERADOR_CONTADURIA", "ErnestoDiaz");
    }

    @Test
    @DisplayName("Registrar ingreso manual - Retorna 200 OK")
    void testRegistrarManual() throws Exception {
        Map<String, Object> body = Map.of(
                "usuario", "yanina",
                "tipoDoc", "NC",
                "letraDoc", "B",
                "puntoVenta", 2,
                "numero", 55,
                "detalle", "Cargada a mano"
        );

        mockMvc.perform(post("/api/notificaciones/registrar-manual")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Notificación registrada exitosamente"));

        verify(notificacionService, times(1)).registrarNotificacionIngresoManual(
                "yanina", "NC", "B", 2, 55, "Cargada a mano"
        );
    }

    @Test
    @DisplayName("Reportar documento no encontrado - Retorna 200 OK")
    void testReportarDocumentoNoEncontrado() throws Exception {
        Map<String, Object> body = Map.of(
                "usuario", "yanina",
                "tipoDoc", "FC",
                "letraDoc", "A",
                "puntoVenta", 1,
                "numero", 9999,
                "detalle", "Falta comprobante"
        );

        mockMvc.perform(post("/api/notificaciones/reportar-no-encontrado")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Notificación enviada a los administradores exitosamente"));

        verify(notificacionService, times(1)).registrarNotificacionDocumentoNoEncontrado(
                "yanina", "FC", "A", 1, 9999, "Falta comprobante"
        );
    }

    @Test
    @DisplayName("Solicitar anulación de documento - Retorna 200 OK")
    void testSolicitarAnulacion() throws Exception {
        Map<String, Object> body = Map.of(
                "usuario", "yanina",
                "tipoDoc", "FC",
                "letraDoc", "A",
                "puntoVenta", 31,
                "numero", 1865,
                "motivo", "Factura duplicada"
        );

        mockMvc.perform(post("/api/notificaciones/solicitar-anulacion")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Solicitud de anulación registrada y notificada con éxito"));

        verify(notificacionService, times(1)).registrarSolicitudAnulacion(
                "yanina", "FC", "A", 31, 1865, "Factura duplicada"
        );
    }
}
