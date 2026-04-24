package com.debitos.backend.controller;

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

        // 1. Obtener tipo de registro (Ambulatorio/Internado)
        String tipoRegistro = auditoriaService.obtenerTipoRegistro(tipo, letra, ptovta, numero);

        if (tipoRegistro == null) {
            return ResponseEntity.notFound().build();
        }

        // 2. Obtener las prestaciones
        List<Map<String, Object>> resultados = auditoriaService.obtenerPrestaciones(tipo, tipoRegistro, letra, ptovta, numero);
        System.out.println(resultados.size());

        return ResponseEntity.ok(resultados);
    }

    @PostMapping("/guardar-parcialmente")
    public ResponseEntity<?> guardarParcialmente(@RequestBody Map<String, Object> payload) {
        try {
            // Llamamos al método que creamos antes en el servicio
            auditoriaService.procesarGuardadoParcial(payload);
            return ResponseEntity.ok().body("{\"mensaje\": \"Guardado exitoso\"}");
        } catch (Exception e) {
            e.printStackTrace(); // Para que veas el error exacto en la consola de Java si algo falla
            return ResponseEntity.internalServerError().body("{\"error\": \"Error al guardar en la base de datos\"}");
        }
    }

    @PostMapping("/nueva-nota-credito")
    public ResponseEntity<?> guardarNuevaNotaCredito(@RequestBody Map<String, Object> payload) {
        try {
            auditoriaService.procesarNuevaNotaCredito(payload);
            return ResponseEntity.ok().body("{\"mensaje\": \"Nota de Crédito generada exitosamente\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("{\"error\": \"Error al procesar la Nota de Crédito\"}");
        }
    }
}