package com.debitos.backend.controller;

import com.debitos.backend.dto.directorio.*;
import com.debitos.backend.service.DirectorioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/directorio")
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("hasAnyRole('DIRECTORIO', 'ADMIN')")
public class DirectorioController {

    @Autowired
    private DirectorioService directorioService;

    @GetMapping("/coberturas")
    public ResponseEntity<List<DirectorioCoberturaDTO>> obtenerCoberturas() {
        List<DirectorioCoberturaDTO> lista = directorioService.obtenerCoberturasDisponibles();
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/tipos-documento")
    public ResponseEntity<List<String>> obtenerTiposDocumento() {
        List<String> lista = directorioService.obtenerTiposDocumentoDisponibles();
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/totales")
    public ResponseEntity<DirectorioTotalesDTO> obtenerTotales(
            @RequestParam(required = false) String codigoCobertura,
            @RequestParam(required = false) String tipoDoc,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta) {
        DirectorioTotalesDTO totales = directorioService.obtenerTotalesMacro(codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        return ResponseEntity.ok(totales);
    }

    @GetMapping("/grupos")
    public ResponseEntity<List<DirectorioGrupoFacturaDTO>> obtenerGrupos(
            @RequestParam(required = false) String codigoCobertura,
            @RequestParam(required = false) String tipoDoc,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta) {
        List<DirectorioGrupoFacturaDTO> grupos = directorioService.obtenerGruposFacturas(codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        return ResponseEntity.ok(grupos);
    }

    @GetMapping("/motivos")
    public ResponseEntity<List<DirectorioMotivoDebitoDTO>> obtenerMotivos(
            @RequestParam(required = false) String codigoCobertura,
            @RequestParam(required = false) String tipoDoc,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta) {
        List<DirectorioMotivoDebitoDTO> motivos = directorioService.obtenerDistribucionMotivos(codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        return ResponseEntity.ok(motivos);
    }

    @GetMapping("/motivo-detalle")
    public ResponseEntity<List<DirectorioPrestacionDetalleDTO>> obtenerPrestacionesPorMotivo(
            @RequestParam String motivo,
            @RequestParam(required = false) String codigoCobertura,
            @RequestParam(required = false) String tipoDoc,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta) {
        List<DirectorioPrestacionDetalleDTO> lista = directorioService.obtenerPrestacionesPorMotivo(motivo, codigoCobertura, tipoDoc, fechaDesde, fechaHasta);
        return ResponseEntity.ok(lista);
    }
}
