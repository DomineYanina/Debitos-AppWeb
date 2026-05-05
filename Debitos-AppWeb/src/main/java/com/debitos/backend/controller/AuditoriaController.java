package com.debitos.backend.controller;

import com.debitos.backend.dto.PrestacionAuditoriaDTO;
import com.debitos.backend.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auditoria")
@CrossOrigin(origins = "http://localhost:4200")
public class AuditoriaController {

    @Autowired
    private AuditoriaService auditoriaService;

    @GetMapping("/buscar")
    public ResponseEntity<?> buscar(
            @RequestParam String tipo,
            @RequestParam String letra,
            @RequestParam(name = "puntoVenta") int ptovta,
            @RequestParam int numero) {

        String tipoRegistro = auditoriaService.obtenerTipoRegistro(tipo, letra, ptovta, numero);

        if (tipoRegistro == null) {
            // Esto también se podría manejar tirando una excepción, pero devolver un 404 limpio está perfecto
            return ResponseEntity.notFound().build();
        }

        List<PrestacionAuditoriaDTO> resultados = auditoriaService.obtenerPrestaciones(tipo, tipoRegistro, letra, ptovta, numero);
        return ResponseEntity.ok(resultados);
    }

    // FIJATE QUÉ LIMPIOS QUEDAN LOS POST AHORA: SIN TRY-CATCH

    @PostMapping("/guardar-parcialmente")
    public ResponseEntity<Map<String, String>> guardarParcialmente(@RequestBody Map<String, Object> payload) {
        auditoriaService.procesarGuardadoParcial(payload);
        return ResponseEntity.ok(Map.of("mensaje", "Guardado exitoso"));
    }

    @PostMapping("/nueva-nota-credito")
    public ResponseEntity<Map<String, String>> guardarNuevaNotaCredito(@RequestBody Map<String, Object> payload) {
        auditoriaService.procesarNuevaNotaCredito(payload);
        return ResponseEntity.ok(Map.of("mensaje", "Nota de Crédito generada exitosamente"));
    }

    @PostMapping("/nueva-nota-debito")
    public ResponseEntity<Map<String, String>> guardarNuevaNotaDebito(@RequestBody Map<String, Object> payload) {
        auditoriaService.procesarNuevaNotaDebito(payload);
        return ResponseEntity.ok(Map.of("mensaje", "Nota de Débito generada exitosamente"));
    }
}