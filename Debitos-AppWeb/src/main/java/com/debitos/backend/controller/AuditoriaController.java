package com.debitos.backend.controller;

import com.debitos.backend.dto.DocumentoAsociadoDTO;
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

    // Regla 3: si el motivo de la ND es "Por ajuste de IVA", el servicio lanza
    // IllegalArgumentException que se traduce en HTTP 400 Bad Request.
    @PostMapping("/nueva-nota-credito")
    public ResponseEntity<?> guardarNuevaNotaCredito(@RequestBody Map<String, Object> payload) {
        try {
            auditoriaService.procesarNuevaNotaCredito(payload);
            return ResponseEntity.ok(Map.of("mensaje", "Nota de Crédito generada exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/nueva-nota-debito")
    public ResponseEntity<Map<String, String>> guardarNuevaNotaDebito(@RequestBody Map<String, Object> payload) {
        auditoriaService.procesarNuevaNotaDebito(payload);
        return ResponseEntity.ok(Map.of("mensaje", "Nota de Débito generada exitosamente"));
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