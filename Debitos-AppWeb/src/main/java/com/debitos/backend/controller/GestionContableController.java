package com.debitos.backend.controller;

import com.debitos.backend.dto.contable.*;
import com.debitos.backend.service.GestionContableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

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

    @GetMapping("/coberturas")
    public ResponseEntity<Page<CoberturaAliasDTO>> listarCoberturas(
            @RequestParam(required = false) String filtro,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String sortDir) {
        Page<CoberturaAliasDTO> resultado = gestionContableService.buscarCoberturasPaginadas(filtro, page, size, sortBy, sortDir);
        return ResponseEntity.ok(resultado);
    }

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

    @GetMapping("/periodos")
    public ResponseEntity<Page<FacturaPeriodoDTO>> listarFacturasPeriodoCorregido(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        return ResponseEntity.ok(gestionContableService.listarFacturasPeriodoCorregido(pageable));
    }

    // =========================================================================
    // 3. Prestaciones a No Considerar
    // =========================================================================

    @GetMapping("/prestaciones")
    public ResponseEntity<Page<PrestacionConsideracionDTO>> listarPrestaciones(
            @RequestParam(required = false) String filtro,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String estadoAmbulatorio,
            @RequestParam(required = false) String estadoInternado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String sortDir) {
        String amb = (estadoAmbulatorio != null) ? estadoAmbulatorio : estado;
        String intn = estadoInternado;
        Page<PrestacionConsideracionDTO> resultado = gestionContableService.buscarPrestaciones(filtro, amb, intn, page, size, sortBy, sortDir);
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

    @GetMapping("/facturas-anuladas/candidatos-anulador")
    public ResponseEntity<List<FacturaAnuladaDTO>> buscarCandidatosAnuladorPorGrupo(
            @RequestParam Long idCabeceraOrigen) {
        List<FacturaAnuladaDTO> candidatos = gestionContableService.buscarCandidatosAnuladorPorGrupo(idCabeceraOrigen);
        return ResponseEntity.ok(candidatos);
    }

    @GetMapping("/facturas-anuladas")
    public ResponseEntity<Page<FacturaAnuladaDTO>> listarFacturasAnuladas(
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String filtro,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {
        Page<FacturaAnuladaDTO> resultado = (tipo == null && filtro == null)
                ? gestionContableService.listarFacturasAnuladas(page, size, sortBy, sortDir)
                : gestionContableService.listarFacturasAnuladas(tipo, filtro, page, size, sortBy, sortDir);
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
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {
        Page<HistorialAjusteDTO> historial = gestionContableService.obtenerHistorial(referencia, page, size, sortBy, sortDir);
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
