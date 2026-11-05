package com.debitos.backend.controller;

import com.debitos.backend.dto.EstadoSincronizacionPrestacionesDTO;
import com.debitos.backend.dto.PrevisualizacionPrestacionesDTO;
import com.debitos.backend.dto.ResultadoReconciliacionDTO;
import com.debitos.backend.dto.ResumenSincronizacionPrestacionesDTO;
import com.debitos.backend.service.SincronizacionPrestacionesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/prestaciones")
@CrossOrigin(origins = {"http://localhost:4200", "http://172.16.14.210"})
@PreAuthorize("hasRole('ADMIN')")
public class AdminPrestacionesController {

    @Autowired
    private SincronizacionPrestacionesService prestacionesService;

    @GetMapping("/estado")
    public ResponseEntity<EstadoSincronizacionPrestacionesDTO> obtenerEstado(
            @RequestParam(required = false) Integer anio) {
        EstadoSincronizacionPrestacionesDTO estado = prestacionesService.obtenerEstado(anio);
        return ResponseEntity.ok(estado);
    }

    @GetMapping("/previsualizar")
    public ResponseEntity<PrevisualizacionPrestacionesDTO> previsualizar(
            @RequestParam(required = false) Integer anio,
            @RequestParam(defaultValue = "300") int limite,
            @RequestParam(required = false) String tipo) {
        PrevisualizacionPrestacionesDTO prev = prestacionesService.previsualizar(anio, limite, tipo);
        return ResponseEntity.ok(prev);
    }

    @PostMapping("/sincronizar")
    public ResponseEntity<ResumenSincronizacionPrestacionesDTO> sincronizar(
            @RequestParam(required = false) Integer anio,
            Principal principal) {
        String usuario = (principal != null && principal.getName() != null) ? principal.getName() : "ADMIN";
        ResumenSincronizacionPrestacionesDTO resumen = prestacionesService.sincronizar(usuario, anio);
        return ResponseEntity.ok(resumen);
    }

    @PostMapping("/reconciliar-cabecera")
    public ResponseEntity<Map<String, Object>> reconciliarCabecera(
            @RequestParam(required = false) Integer anio) {
        ResultadoReconciliacionDTO resultado = prestacionesService.reconciliarHuerfanasConCabecera(anio);
        return ResponseEntity.ok(Map.of(
            "exito", resultado.isExito(),
            "reconciliadas", resultado.getTotalReconciliadas(),
            "ambulatorias", resultado.getAmbulatoriosReconciliados(),
            "internaciones", resultado.getInternadosReconciliados(),
            "mensaje", resultado.getMensaje() != null ? resultado.getMensaje() : ""
        ));
    }
}
