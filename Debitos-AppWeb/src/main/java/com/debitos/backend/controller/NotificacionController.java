package com.debitos.backend.controller;

import com.debitos.backend.dto.NotificacionDTO;
import com.debitos.backend.service.NotificacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
@CrossOrigin(origins = "http://localhost:4200")
public class NotificacionController {

    @Autowired
    private NotificacionService notificacionService;

    @GetMapping("/recientes")
    public ResponseEntity<List<NotificacionDTO>> obtenerNotificacionesRecientes(
            @RequestParam(required = false, defaultValue = "ADMIN") String rol,
            @RequestParam(required = false) String usuario,
            Authentication authentication) {
        String usuarioEfectivo = resolverUsuario(usuario, authentication);
        List<NotificacionDTO> notificaciones = notificacionService.obtenerNotificacionesParaRol(rol, usuarioEfectivo);
        return ResponseEntity.ok(notificaciones);
    }

    @PutMapping("/{id}/leer")
    public ResponseEntity<Map<String, String>> marcarComoLeida(
            @PathVariable Long id,
            @RequestParam(required = false) String usuario,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        String usuarioFromBody = (body != null && body.get("usuario") != null) ? body.get("usuario").toString() : null;
        String usuarioEfectivo = resolverUsuario(usuario != null ? usuario : usuarioFromBody, authentication);
        notificacionService.marcarComoLeida(id, usuarioEfectivo);
        return ResponseEntity.ok(Map.of("mensaje", "Notificación marcada como leída"));
    }

    @PutMapping("/leer-todas")
    public ResponseEntity<Map<String, String>> marcarTodasComoLeidas(
            @RequestParam(required = false, defaultValue = "ADMIN") String rol,
            @RequestParam(required = false) String usuario,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        String usuarioFromBody = (body != null && body.get("usuario") != null) ? body.get("usuario").toString() : null;
        String rolFromBody = (body != null && body.get("rol") != null) ? body.get("rol").toString() : null;
        String rolEfectivo = (rolFromBody != null && !rolFromBody.isBlank()) ? rolFromBody : rol;
        String usuarioEfectivo = resolverUsuario(usuario != null ? usuario : usuarioFromBody, authentication);
        notificacionService.marcarTodasComoLeidas(rolEfectivo, usuarioEfectivo);
        return ResponseEntity.ok(Map.of("mensaje", "Todas las notificaciones fueron marcadas como leídas"));
    }

    private String resolverUsuario(String usuarioParam, Authentication authentication) {
        if (usuarioParam != null && !usuarioParam.trim().isEmpty()) {
            return usuarioParam.trim();
        }
        if (authentication != null && authentication.getName() != null && !authentication.getName().trim().isEmpty()) {
            return authentication.getName().trim();
        }
        return null;
    }

    @PostMapping("/registrar-manual")
    public ResponseEntity<Map<String, String>> registrarManual(@RequestBody Map<String, Object> body) {
        String usuario = (String) body.getOrDefault("usuario", "Operador");
        String tipoDoc = (String) body.getOrDefault("tipoDoc", "NC");
        String letraDoc = (String) body.getOrDefault("letraDoc", "B");
        Integer ptovta = body.get("puntoVenta") != null ? Integer.parseInt(body.get("puntoVenta").toString()) : 0;
        Integer numero = body.get("numero") != null ? Integer.parseInt(body.get("numero").toString()) : 0;
        String detalle = (String) body.getOrDefault("detalle", "");

        notificacionService.registrarNotificacionIngresoManual(usuario, tipoDoc, letraDoc, ptovta, numero, detalle);
        return ResponseEntity.ok(Map.of("mensaje", "Notificación registrada exitosamente"));
    }

    @PostMapping("/reportar-no-encontrado")
    public ResponseEntity<Map<String, String>> reportarDocumentoNoEncontrado(@RequestBody Map<String, Object> body) {
        String usuario = (String) body.getOrDefault("usuario", "Operador");
        String tipoDoc = (String) body.getOrDefault("tipoDoc", "FC");
        String letraDoc = (String) body.getOrDefault("letraDoc", "A");
        Integer ptovta = body.get("puntoVenta") != null ? Integer.parseInt(body.get("puntoVenta").toString()) : 0;
        Integer numero = body.get("numero") != null ? Integer.parseInt(body.get("numero").toString()) : 0;
        String detalle = (String) body.getOrDefault("detalle", "");

        notificacionService.registrarNotificacionDocumentoNoEncontrado(usuario, tipoDoc, letraDoc, ptovta, numero, detalle);
        return ResponseEntity.ok(Map.of("mensaje", "Notificación enviada a los administradores exitosamente"));
    }

    @PostMapping("/solicitar-anulacion")
    public ResponseEntity<Map<String, String>> solicitarAnulacion(@RequestBody Map<String, Object> body) {
        String usuario = (String) body.getOrDefault("usuario", "Operador");
        String tipoDoc = (String) body.getOrDefault("tipoDoc", "FC");
        String letraDoc = (String) body.getOrDefault("letraDoc", "A");
        Integer ptovta = body.get("puntoVenta") != null ? Integer.parseInt(body.get("puntoVenta").toString()) : 0;
        Integer numero = body.get("numero") != null ? Integer.parseInt(body.get("numero").toString()) : 0;
        String motivo = (String) body.getOrDefault("motivo", "");

        notificacionService.registrarSolicitudAnulacion(usuario, tipoDoc, letraDoc, ptovta, numero, motivo);
        return ResponseEntity.ok(Map.of("mensaje", "Solicitud de anulación registrada y notificada con éxito"));
    }

    @PostMapping("/cancelar-solicitud-anulacion")
    public ResponseEntity<Map<String, String>> cancelarSolicitudAnulacion(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        String usuario = resolverUsuario((String) body.get("usuario"), authentication);
        String tipoDoc = (String) body.getOrDefault("tipoDoc", "FC");
        String letraDoc = (String) body.getOrDefault("letraDoc", "A");
        Integer ptovta = body.get("puntoVenta") != null ? Integer.parseInt(body.get("puntoVenta").toString()) : 0;
        Integer numero = body.get("numero") != null ? Integer.parseInt(body.get("numero").toString()) : 0;

        notificacionService.cancelarSolicitudAnulacion(tipoDoc, letraDoc, ptovta, numero, usuario);
        return ResponseEntity.ok(Map.of("mensaje", "Solicitud de anulación cancelada con éxito"));
    }

    @PostMapping("/rechazar-solicitud-anulacion")
    public ResponseEntity<Map<String, String>> rechazarSolicitudAnulacion(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        String usuario = resolverUsuario((String) body.get("usuario"), authentication);
        Long idNotificacion = body.get("idNotificacion") != null ? Long.parseLong(body.get("idNotificacion").toString()) : null;
        String tipoDoc = (String) body.getOrDefault("tipoDoc", "FC");
        String letraDoc = (String) body.getOrDefault("letraDoc", "A");
        Integer ptovta = body.get("puntoVenta") != null ? Integer.parseInt(body.get("puntoVenta").toString()) : 0;
        Integer numero = body.get("numero") != null ? Integer.parseInt(body.get("numero").toString()) : 0;
        String motivoRechazo = (String) body.getOrDefault("motivoRechazo", "");

        notificacionService.rechazarSolicitudAnulacion(idNotificacion, tipoDoc, letraDoc, ptovta, numero, motivoRechazo, usuario);
        return ResponseEntity.ok(Map.of("mensaje", "Solicitud de anulación rechazada con éxito"));
    }
}
