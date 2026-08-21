package com.debitos.backend.controller;

import com.debitos.backend.dto.DocumentoAsociadoDTO;
import com.debitos.backend.dto.GuardarParcialRequest;
import com.debitos.backend.dto.NuevaNotaCreditoRequest;
import com.debitos.backend.dto.NuevaNotaDebitoAjusteIvaRequest;
import com.debitos.backend.dto.NuevaNotaDebitoRequest;
import com.debitos.backend.dto.PrestacionAuditoriaDTO;
import com.debitos.backend.model.RegistroUsabilidad;
import com.debitos.backend.repository.RegistroUsabilidadRepository;
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

    @Autowired
    private RegistroUsabilidadRepository registroUsabilidadRepository;

    // Regla 1: devuelve la lista completa de NC creadas para una FC
    @GetMapping("/tiene-nc")
    public ResponseEntity<List<DocumentoAsociadoDTO>> tieneNotaDeCredito(
            @RequestParam String letra,
            @RequestParam(name = "puntoVenta") int ptovta,
            @RequestParam int numero) {
        List<DocumentoAsociadoDTO> lista = auditoriaService.obtenerNotasDeCreditoCreadasParaFC(letra, ptovta, numero);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/tiene-nc-ajuste-iva")
    public ResponseEntity<Boolean> tieneNcAjusteIva(
            @RequestParam String tipo,
            @RequestParam String letra,
            @RequestParam(name = "puntoVenta") int ptovta,
            @RequestParam int numero) {
        boolean existe = auditoriaService.tieneNcAjusteIva(tipo, letra, ptovta, numero);
        return ResponseEntity.ok(existe);
    }

    // Regla 2: devuelve la lista completa de ND creadas para una NC
    @GetMapping("/tiene-nd")
    public ResponseEntity<List<DocumentoAsociadoDTO>> tieneNotaDeDebito(
            @RequestParam String letra,
            @RequestParam(name = "puntoVenta") int ptovta,
            @RequestParam int numero) {
        List<DocumentoAsociadoDTO> lista = auditoriaService.obtenerNotasDeDebitoCreadasParaNC(letra, ptovta, numero);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/tiene-nc-para-nd")
    public ResponseEntity<DocumentoAsociadoDTO> tieneNotaDeCreditoParaND(
            @RequestParam String letra,
            @RequestParam(name = "puntoVenta") int ptovta,
            @RequestParam int numero) {
        DocumentoAsociadoDTO dto = auditoriaService.obtenerNotaDeCreditoCreadaParaND(letra, ptovta, numero);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/documento-asociado-nc")
    public ResponseEntity<DocumentoAsociadoDTO> obtenerDocumentoAsociadoParaNC(
            @RequestParam String letra,
            @RequestParam(name = "puntoVenta") int ptovta,
            @RequestParam int numero) {
        DocumentoAsociadoDTO dto = auditoriaService.obtenerDocumentoAsociadoParaNC(letra, ptovta, numero);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/historial-comprobantes")
    public ResponseEntity<List<com.debitos.backend.dto.FilaHistorialDTO>> obtenerHistorialComprobantes(
            @RequestParam String tipo,
            @RequestParam String letra,
            @RequestParam(name = "puntoVenta") int ptovta,
            @RequestParam int numero) {
        List<com.debitos.backend.dto.FilaHistorialDTO> historial = auditoriaService.obtenerHistorialComprobantes(tipo, letra, ptovta, numero);
        return ResponseEntity.ok(historial);
    }

    @GetMapping("/buscar")
    public ResponseEntity<?> buscar(
            @RequestParam String tipo,
            @RequestParam String letra,
            @RequestParam(name = "puntoVenta") int ptovta,
            @RequestParam int numero) {

        com.debitos.backend.dto.ResultadoBusquedaDTO resultado = auditoriaService.buscarUnificado(tipo, letra, ptovta, numero);

        if (resultado == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/guardar-parcialmente")
    public ResponseEntity<Map<String, String>> guardarParcialmente(@RequestBody GuardarParcialRequest payload) {
        auditoriaService.procesarGuardadoParcial(payload);
        return ResponseEntity.ok(Map.of("mensaje", "Guardado exitoso"));
    }

    @PostMapping("/nueva-nota-credito")
    public ResponseEntity<Map<String, String>> guardarNuevaNotaCredito(@RequestBody NuevaNotaCreditoRequest payload) {
        auditoriaService.procesarNuevaNotaCredito(payload);
        return ResponseEntity.ok(Map.of("mensaje", "Nota de Crédito generada exitosamente"));
    }

    @PutMapping("/editar-nc-ajuste-iva")
    public ResponseEntity<Map<String, String>> editarNcAjusteDeIva(@RequestBody NuevaNotaCreditoRequest payload) {
        auditoriaService.editarNcAjusteDeIva(payload);
        return ResponseEntity.ok(Map.of("mensaje", "Nota de Crédito por Ajuste de IVA actualizada exitosamente"));
    }

    @PostMapping("/nueva-nota-debito")
    public ResponseEntity<Map<String, String>> guardarNuevaNotaDebito(@RequestBody NuevaNotaDebitoRequest payload) {
        auditoriaService.procesarNuevaNotaDebito(payload);
        return ResponseEntity.ok(Map.of("mensaje", "Nota de Débito generada exitosamente"));
    }

    @PostMapping("/nueva-nota-debito-ajuste-iva")
    public ResponseEntity<Map<String, String>> guardarNuevaNotaDebitoAjusteIva(@RequestBody NuevaNotaDebitoAjusteIvaRequest payload) {
        auditoriaService.procesarNuevaNotaDebitoAjusteIva(payload);
        return ResponseEntity.ok(Map.of("mensaje", "Nota de Débito por Ajuste de IVA generada exitosamente"));
    }

    @PostMapping("/telemetria/usabilidad")
    public ResponseEntity<?> registrarUsabilidad(@RequestBody RegistroUsabilidad metrica) {
        registroUsabilidadRepository.save(metrica);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/telemetria/usabilidad/lote")
    public ResponseEntity<?> registrarUsabilidadLote(@RequestBody List<RegistroUsabilidad> metricas) {
        // saveAll es muchísimo más rápido y eficiente para guardar muchos registros a la vez
        registroUsabilidadRepository.saveAll(metricas);
        return ResponseEntity.ok().build();
    }
}