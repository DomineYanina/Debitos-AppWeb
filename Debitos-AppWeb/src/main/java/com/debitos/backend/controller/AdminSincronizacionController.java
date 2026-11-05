package com.debitos.backend.controller;

import com.debitos.backend.dto.ComprobanteCandidatoDTO;
import com.debitos.backend.dto.ComprobanteSinAsociarDTO;
import com.debitos.backend.dto.EstadoSincronizacionDTO;
import com.debitos.backend.dto.PrevisualizacionSincronizacionDTO;
import com.debitos.backend.dto.ResumenSincronizacionDTO;
import com.debitos.backend.service.SincronizacionCtaCteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/sincronizacion")
@CrossOrigin(origins = {"http://localhost:4200", "http://172.16.14.210"})
@PreAuthorize("hasRole('ADMIN')")
public class AdminSincronizacionController {

    @Autowired
    private SincronizacionCtaCteService sincronizacionService;

    @GetMapping("/estado")
    public ResponseEntity<EstadoSincronizacionDTO> obtenerEstado(
            @RequestParam(required = false) Integer anio) {
        EstadoSincronizacionDTO estado = sincronizacionService.obtenerEstado(anio);
        return ResponseEntity.ok(estado);
    }

    @GetMapping("/previsualizar")
    public ResponseEntity<PrevisualizacionSincronizacionDTO> previsualizar(
            @RequestParam(required = false) Integer anio,
            @RequestParam(defaultValue = "300") int limite,
            @RequestParam(required = false) String tipo) {
        PrevisualizacionSincronizacionDTO prev = sincronizacionService.previsualizar(anio, limite, tipo);
        return ResponseEntity.ok(prev);
    }

    @GetMapping("/candidatos-exportar")
    public ResponseEntity<List<ComprobanteCandidatoDTO>> obtenerCandidatosAExportar(
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) String tipo) {
        List<ComprobanteCandidatoDTO> lista = sincronizacionService.obtenerTodosCandidatos(anio, tipo);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/sin-asociar")
    public ResponseEntity<List<ComprobanteSinAsociarDTO>> obtenerSinAsociar(
            @RequestParam(required = false) String tipo) {
        List<ComprobanteSinAsociarDTO> lista = sincronizacionService.obtenerComprobantesSinAsociar(tipo);
        return ResponseEntity.ok(lista);
    }

    @PostMapping("/ejecutar")
    public ResponseEntity<ResumenSincronizacionDTO> ejecutar(
            @RequestParam(required = false) Integer anio,
            Principal principal) {
        String usuario = (principal != null && principal.getName() != null) ? principal.getName() : "ADMIN";
        ResumenSincronizacionDTO resumen = sincronizacionService.ejecutarSincronizacion(usuario, anio);
        return ResponseEntity.ok(resumen);
    }
}
