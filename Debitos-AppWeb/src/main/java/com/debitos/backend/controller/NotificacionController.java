package com.debitos.backend.controller;

import com.debitos.backend.dto.NotificacionDTO;
import com.debitos.backend.service.NotificacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<NotificacionDTO>> obtenerNotificacionesRecientes(@RequestParam(required = false, defaultValue = "ADMIN") String rol) {
        List<NotificacionDTO> notificaciones = notificacionService.obtenerNotificacionesParaRol(rol);
        return ResponseEntity.ok(notificaciones);
    }

    @PutMapping("/{id}/leer")
    public ResponseEntity<Map<String, String>> marcarComoLeida(@PathVariable Long id) {
        notificacionService.marcarComoLeida(id);
        return ResponseEntity.ok(Map.of("mensaje", "Notificación marcada como leída"));
    }

    @PutMapping("/leer-todas")
    public ResponseEntity<Map<String, String>> marcarTodasComoLeidas(@RequestParam(required = false, defaultValue = "ADMIN") String rol) {
        notificacionService.marcarTodasComoLeidas(rol);
        return ResponseEntity.ok(Map.of("mensaje", "Todas las notificaciones fueron marcadas como leídas"));
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
}
