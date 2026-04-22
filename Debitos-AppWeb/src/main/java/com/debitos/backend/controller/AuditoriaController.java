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
}