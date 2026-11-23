package com.debitos.backend.service;

import com.debitos.backend.dto.NotificacionDTO;
import com.debitos.backend.model.Notificacion;
import com.debitos.backend.repository.NotificacionLecturaRepository;
import com.debitos.backend.repository.NotificacionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {

    @Mock
    private NotificacionRepository notificacionRepository;

    @Mock
    private NotificacionLecturaRepository notificacionLecturaRepository;

    @InjectMocks
    private NotificacionService notificacionService;

    @Test
    @DisplayName("Obtener notificaciones para un rol - Mapea a DTO correctamente")
    void testObtenerNotificacionesParaRol() {
        Notificacion notif = new Notificacion(
                "INGRESO_MANUAL_NC",
                "Título Prueba",
                "Mensaje Prueba",
                "ADMIN",
                "operador1",
                "NC",
                "A",
                1,
                100
        );
        notif.setId(10L);
        notif.setFechaCreacion(ZonedDateTime.now());
        notif.setLeida(false);

        when(notificacionRepository.findTop50ByRolDestinoIn(List.of("ADMIN", "OPERADOR_CONTADURIA", "TODOS")))
                .thenReturn(List.of(notif));

        List<NotificacionDTO> dtos = notificacionService.obtenerNotificacionesParaRol("ADMIN");

        assertEquals(1, dtos.size());
        NotificacionDTO dto = dtos.get(0);
        assertEquals(10L, dto.getId());
        assertEquals("Título Prueba", dto.getTitulo());
        assertEquals("NC A-0001-00000100", dto.getDocumentoReferencia());
        assertEquals(Boolean.FALSE, dto.getLeida());
    }

    @Test
    @DisplayName("Registrar notificación de ingreso manual")
    void testRegistrarNotificacionIngresoManual() {
        notificacionService.registrarNotificacionIngresoManual("user1", "NC", "B", 2, 45, "Detalle");

        ArgumentCaptor<Notificacion> captor = ArgumentCaptor.forClass(Notificacion.class);
        verify(notificacionRepository, times(1)).save(captor.capture());

        Notificacion guardada = captor.getValue();
        assertEquals("INGRESO_MANUAL_NC", guardada.getTipoNotificacion());
        assertEquals("user1", guardada.getUsuarioOrigen());
        assertEquals("NC", guardada.getTipoDoc());
        assertEquals("B", guardada.getLetraDoc());
        assertEquals(2, guardada.getPtoVta());
        assertEquals(45, guardada.getNumero());
    }

    @Test
    @DisplayName("Registrar notificación de documento no encontrado")
    void testRegistrarNotificacionDocumentoNoEncontrado() {
        notificacionService.registrarNotificacionDocumentoNoEncontrado("user2", "FC", "A", 1, 999, "No está en DB");

        ArgumentCaptor<Notificacion> captor = ArgumentCaptor.forClass(Notificacion.class);
        verify(notificacionRepository, times(1)).save(captor.capture());

        Notificacion guardada = captor.getValue();
        assertEquals("DOC_NO_ENCONTRADO", guardada.getTipoNotificacion());
        assertEquals("user2", guardada.getUsuarioOrigen());
        assertEquals("FC", guardada.getTipoDoc());
        assertEquals("A", guardada.getLetraDoc());
        assertEquals(1, guardada.getPtoVta());
        assertEquals(999, guardada.getNumero());
    }

    @Test
    @DisplayName("Registrar notificación de solicitud de anulación")
    void testRegistrarSolicitudAnulacion() {
        notificacionService.registrarSolicitudAnulacion("user3", "FC", "A", 31, 1865, "Factura duplicada");

        ArgumentCaptor<Notificacion> captor = ArgumentCaptor.forClass(Notificacion.class);
        verify(notificacionRepository, times(1)).save(captor.capture());

        Notificacion guardada = captor.getValue();
        assertEquals("SOLICITUD_ANULACION_DOCUMENTO", guardada.getTipoNotificacion());
        assertEquals("OPERADOR_CONTADURIA", guardada.getRolDestino());
        assertEquals("user3", guardada.getUsuarioOrigen());
        assertEquals("FC", guardada.getTipoDoc());
        assertEquals("A", guardada.getLetraDoc());
        assertEquals(31, guardada.getPtoVta());
        assertEquals(1865, guardada.getNumero());
        assertTrue(guardada.getMensaje().contains("Factura duplicada"));
    }

    @Test
    @DisplayName("Marcar como leída con ID no nulo")
    void testMarcarComoLeida() {
        notificacionService.marcarComoLeida(5L);
        verify(notificacionRepository, times(1)).marcarComoLeida(eq(5L), any(ZonedDateTime.class));
    }

    @Test
    @DisplayName("Marcar como leída con ID nulo no interactúa con repositorio")
    void testMarcarComoLeidaIdNulo() {
        notificacionService.marcarComoLeida(null);
        verify(notificacionRepository, never()).marcarComoLeida(any(), any());
    }

    @Test
    @DisplayName("Marcar todas como leídas para un rol")
    void testMarcarTodasComoLeidas() {
        notificacionService.marcarTodasComoLeidas("AUDITORIA");
        verify(notificacionRepository, times(1)).marcarTodasComoLeidas(eq(List.of("AUDITORIA", "TODOS")), any(ZonedDateTime.class));
    }

    @Test
    @DisplayName("Obtener notificaciones por usuario - Lectura independiente por usuario")
    void testObtenerNotificacionesPorUsuarioIndependiente() {
        Notificacion notif = new Notificacion(
                "SOLICITUD_ANULACION_DOCUMENTO",
                "Solicitud de Anulación",
                "Mensaje",
                "OPERADOR_CONTADURIA",
                "PaolaBurniego",
                "FC",
                "A",
                32,
                1137
        );
        notif.setId(16L);
        notif.setFechaCreacion(ZonedDateTime.now());
        notif.setLeida(true); // Globalmente leída por Admin

        when(notificacionRepository.findTop50ByRolDestinoIn(List.of("OPERADOR_CONTADURIA", "TODOS")))
                .thenReturn(List.of(notif));

        // Para Yanina (Admin), sí está en notificacion_lecturas
        when(notificacionLecturaRepository.findLeidasIdsByUsuarioAndNotificacionIdIn(eq("Yanina"), eq(List.of(16L))))
                .thenReturn(Set.of(16L));
        // Para ErnestoDiaz (Operador Contaduría), NO está en notificacion_lecturas
        when(notificacionLecturaRepository.findLeidasIdsByUsuarioAndNotificacionIdIn(eq("ErnestoDiaz"), eq(List.of(16L))))
                .thenReturn(Set.of());

        List<NotificacionDTO> dtosAdmin = notificacionService.obtenerNotificacionesParaRol("OPERADOR_CONTADURIA", "Yanina");
        assertEquals(1, dtosAdmin.size());
        assertTrue(dtosAdmin.get(0).getLeida(), "Para Yanina debe figurar como leída");

        List<NotificacionDTO> dtosOperador = notificacionService.obtenerNotificacionesParaRol("OPERADOR_CONTADURIA", "ErnestoDiaz");
        assertEquals(1, dtosOperador.size());
        assertFalse(dtosOperador.get(0).getLeida(), "Para ErnestoDiaz debe figurar como no leída (nueva)");
    }

    @Test
    @DisplayName("Marcar como leída con usuario - Registra en NotificacionLecturaRepository")
    void testMarcarComoLeidaConUsuario() {
        notificacionService.marcarComoLeida(16L, "ErnestoDiaz");
        verify(notificacionLecturaRepository, times(1)).registrarLectura(16L, "ErnestoDiaz");
        verify(notificacionRepository, never()).marcarComoLeida(any(), any());
    }

    @Test
    @DisplayName("Marcar todas como leídas con usuario - Registra masivo en NotificacionLecturaRepository")
    void testMarcarTodasComoLeidasConUsuario() {
        notificacionService.marcarTodasComoLeidas("OPERADOR_CONTADURIA", "ErnestoDiaz");
        verify(notificacionLecturaRepository, times(1)).registrarLecturaMasiva(
                eq(List.of("OPERADOR_CONTADURIA", "TODOS")), eq("ErnestoDiaz")
        );
        verify(notificacionRepository, never()).marcarTodasComoLeidas(any(), any());
    }
}
