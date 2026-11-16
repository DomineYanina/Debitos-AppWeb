package com.debitos.backend.controller;

import com.debitos.backend.dto.contable.*;
import com.debitos.backend.service.GestionContableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/contable")
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("hasAnyRole('OPERADOR_CONTADURIA', 'ADMIN')")
public class GestionContableController {

    @Autowired
    private GestionContableService gestionContableService;

    // =========================================================================
    // 1. Mapeo de Nombres de Coberturas
    // =========================================================================

    @GetMapping("/coberturas/buscar")
    public ResponseEntity<CoberturaAliasDTO> buscarCobertura(@RequestParam String codigo) {
        CoberturaAliasDTO dto = gestionContableService.obtenerCobertura(codigo);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/coberturas/guardar-alias")
    public ResponseEntity<CoberturaAliasDTO> guardarAliasCobertura(
            @RequestBody GuardarAliasRequest req,
            Principal principal) {
        String usuario = obtenerUsuario(principal);
        CoberturaAliasDTO dto = gestionContableService.guardarAliasCobertura(req, usuario);
        return ResponseEntity.ok(dto);
    }

    // =========================================================================
    // 2. Corrección de Períodos de Facturas
    // =========================================================================

    @GetMapping("/periodos/buscar-factura")
    public ResponseEntity<FacturaPeriodoDTO> buscarFacturaPeriodo(
            @RequestParam String tipo,
            @RequestParam String letra,
            @RequestParam Integer ptovta,
            @RequestParam Integer numero) {
        FacturaPeriodoDTO dto = gestionContableService.buscarFacturaParaPeriodo(tipo, letra, ptovta, numero);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/periodos/corregir")
    public ResponseEntity<FacturaPeriodoDTO> corregirPeriodo(
            @RequestBody CorregirPeriodoRequest req,
            Principal principal) {
        String usuario = obtenerUsuario(principal);
        FacturaPeriodoDTO dto = gestionContableService.guardarPeriodoCorregido(req, usuario);
        return ResponseEntity.ok(dto);
    }

    // =========================================================================
    // 3. Prestaciones a No Considerar
    // =========================================================================

    @GetMapping("/prestaciones")
    public ResponseEntity<Page<PrestacionConsideracionDTO>> listarPrestaciones(
            @RequestParam(required = false) String filtro,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("codigo").ascending());
        Page<PrestacionConsideracionDTO> resultado = gestionContableService.buscarPrestaciones(filtro, pageable);
        return ResponseEntity.ok(resultado);
    }

    @PutMapping("/prestaciones/estado")
    public ResponseEntity<PrestacionConsideracionDTO> cambiarEstadoPrestacion(
            @RequestBody CambiarEstadoPrestacionRequest req,
            Principal principal) {
        String usuario = obtenerUsuario(principal);
        PrestacionConsideracionDTO dto = gestionContableService.cambiarEstadoPrestacion(req, usuario);
        return ResponseEntity.ok(dto);
    }

    // =========================================================================
    // 4. Facturas Anuladas Manualmente
    // =========================================================================

    @GetMapping("/facturas-anuladas/buscar")
    public ResponseEntity<FacturaAnuladaDTO> buscarFacturaParaAnulacion(
            @RequestParam String tipo,
            @RequestParam String letra,
            @RequestParam Integer ptovta,
            @RequestParam Integer numero) {
        FacturaAnuladaDTO dto = gestionContableService.buscarFacturaParaAnulacion(tipo, letra, ptovta, numero);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/facturas-anuladas")
    public ResponseEntity<Page<FacturaAnuladaDTO>> listarFacturasAnuladas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<FacturaAnuladaDTO> resultado = gestionContableService.listarFacturasAnuladas(pageable);
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/facturas-anuladas/cambiar-estado")
    public ResponseEntity<FacturaAnuladaDTO> cambiarEstadoAnulacion(
            @RequestBody CambiarAnulacionRequest req,
            Principal principal) {
        String usuario = obtenerUsuario(principal);
        FacturaAnuladaDTO dto = gestionContableService.cambiarEstadoAnulacionManual(req, usuario);
        return ResponseEntity.ok(dto);
    }

    // =========================================================================
    // 5. Historial de Ajustes
    // =========================================================================

    @GetMapping("/historial")
    public ResponseEntity<Page<HistorialAjusteDTO>> obtenerHistorial(
            @RequestParam(required = false) String referencia,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("fechaHora").descending());
        Page<HistorialAjusteDTO> historial = gestionContableService.obtenerHistorial(referencia, pageable);
        return ResponseEntity.ok(historial);
    }

    // =========================================================================
    // Helper
    // =========================================================================

    private String obtenerUsuario(Principal principal) {
        if (principal != null && principal.getName() != null && !principal.getName().isBlank()) {
            return principal.getName();
        }
        return "OPERADOR_CONTADURIA";
    }
}
