package com.debitos.backend.service;

import com.debitos.backend.dto.PrestacionAuditoriaDTO;
import com.debitos.backend.model.AmbLiquidado;
import com.debitos.backend.model.NotaDeCredito;
import com.debitos.backend.model.NotaDeDebito;
import com.debitos.backend.repository.AmbLiquidadoRepository;
import com.debitos.backend.repository.NotaDeCreditoRepository;
import com.debitos.backend.repository.NotaDeDebitoRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AuditoriaService {

    @Autowired
    private AmbLiquidadoRepository ambLiquidadoRepository;

    @Autowired
    private NotaDeCreditoRepository notaDeCreditoRepository;

    @Autowired
    private NotaDeDebitoRepository notaDeDebitoRepository;

    public String obtenerTipoRegistro(String tipoFactura, String letra, int ptovta, int numero) {
        return switch (tipoFactura) {
            case "FC" -> ambLiquidadoRepository.findDistinctTipoRegistro(letra, ptovta, numero);
            case "NC" -> notaDeCreditoRepository.findDistinctTipoRegistro(letra, ptovta, numero);
            case "ND" -> notaDeDebitoRepository.findDistinctTipoRegistro(letra, ptovta, numero);
            default -> throw new IllegalArgumentException("Tipo de factura desconocido: " + tipoFactura);
        };
    }

    public List<PrestacionAuditoriaDTO> obtenerPrestaciones(String facturaTipo, String tipoRegistro, String letra, int ptovta, int numero) {
        return switch (facturaTipo) {
            case "FC" -> ambLiquidadoRepository.findPrestacionesPorFactura(letra, ptovta, numero);
            case "NC" -> notaDeCreditoRepository.findPrestacionesPorNotaCredito(letra, ptovta, numero);
            case "ND" -> notaDeDebitoRepository.findPrestacionesPorNotaDebito(letra, ptovta, numero);
            default -> throw new IllegalArgumentException("Tipo de documento desconocido: " + facturaTipo);
        };
    }

    @Transactional
    public void procesarGuardadoParcial(Map<String, Object> payload) {
        String documentoOrigen = (String) payload.get("documentoOrigen");
        String letra = (String) payload.get("letra");
        Integer ptovta = Integer.valueOf(payload.get("ptovta").toString());
        Integer numero = Integer.valueOf(payload.get("numero").toString());
        String usuario = (String) payload.get("usuario");

        String tipoRegistro = obtenerTipoRegistro(documentoOrigen, letra, ptovta, numero);
        List<Map<String, Object>> registros = (List<Map<String, Object>>) payload.get("registros");

        if (registros == null || registros.isEmpty()) return;

        // 1. LECTURA EN LOTE: Extraemos todos los IDs y hacemos un solo SELECT
        List<Integer> idsPrestaciones = registros.stream()
                .map(p -> ((Number) p.get("id")).intValue())
                .toList();

        Map<Integer, AmbLiquidado> prestacionesMap = ambLiquidadoRepository.findAllById(idsPrestaciones)
                .stream().collect(Collectors.toMap(AmbLiquidado::getId, p -> p));

        // 2. LISTAS DE ACUMULACIÓN: Para evitar escribir de a uno
        List<NotaDeCredito> notasCreditoAGuardar = new ArrayList<>();
        List<NotaDeDebito> notasDebitoAGuardar = new ArrayList<>();

        for (Map<String, Object> p : registros) {
            Integer idPrestacion = ((Number) p.get("id")).intValue();
            AmbLiquidado prestacion = prestacionesMap.get(idPrestacion);

            if (prestacion == null) {
                throw new RuntimeException("Prestación no encontrada: " + idPrestacion);
            }

            BigDecimal importeDebitado = parsearMonto(p.get("importeDebitado"));
            BigDecimal importeRefactura = parsearMonto(p.get("importeRefactura"));
            Boolean debitoAceptadoBool = parsearBooleano(p.get("debitoAceptado"));
            Integer diasFacturados = parsearEntero(p.get("diasFacturados"));
            String prestacionEnglobante = p.get("prestacionEnglobante") != null ? (String) p.get("prestacionEnglobante") : "";

            if ("FC".equals(documentoOrigen)) {
                NotaDeCredito nc = notaDeCreditoRepository.findByPrestacionIdAndNotaDeDebitoPadreIsNull(idPrestacion)
                        .orElse(new NotaDeCredito());

                nc.setPrestacion(prestacion);
                nc.setMotivoDebito((String) p.get("motivoDebito"));
                nc.setImporteDebitado(importeDebitado);
                nc.setDebitoaceptado(debitoAceptadoBool);
                nc.setMotivoderefactura((String) p.get("motivoRefactura"));
                nc.setImportederefactura(importeRefactura);
                nc.setComentarios((String) p.get("comentarios"));
                nc.setDiasfacturados(diasFacturados);
                nc.setPrestacionenglobante(prestacionEnglobante);
                nc.setUsuario(usuario);
                nc.setComentariosDebito((String) p.get("comentariosDebito"));
                nc.setTiporegistro(tipoRegistro);

                if (nc.getId() == null) nc.setCargadocompletamente(false);

                notasCreditoAGuardar.add(nc); // ACUMULAMOS
            }
            else if ("NC".equals(documentoOrigen)) {
                notaDeCreditoRepository.findByLetraAndPtovtaAndNumeroAndPrestacionId(letra, ptovta, numero, idPrestacion)
                        .ifPresent(ncPadre -> {
                            NotaDeDebito nd = notaDeDebitoRepository.findByNotaDeCreditoPadreId(ncPadre.getId())
                                    .orElse(new NotaDeDebito());

                            nd.setPrestacion(prestacion);
                            nd.setNotaDeCreditoPadre(ncPadre);
                            nd.setMotivorefactura((String) p.get("motivoRefactura"));
                            nd.setImporterefactura(importeRefactura);
                            nd.setComentarios((String) p.get("comentarios"));
                            nd.setDiasfacturados(diasFacturados);
                            nd.setUsuario(usuario);
                            nd.setCodigo((String) p.get("codigo"));
                            nd.setTiporegistro(tipoRegistro);

                            if (nd.getId() == null) {
                                nd.setCargadocompletamente(false);
                                nd.setCargarcompletamente(false);
                            }

                            notasDebitoAGuardar.add(nd); // ACUMULAMOS
                        });
            }
            else if ("ND".equals(documentoOrigen)) {
                notaDeDebitoRepository.findByLetraAndPtovtaAndNumeroAndPrestacionId(letra, ptovta, numero, idPrestacion)
                        .ifPresent(ndPadre -> {
                            NotaDeCredito nc = notaDeCreditoRepository.findByNotaDeDebitoPadreId(ndPadre.getId())
                                    .orElse(new NotaDeCredito());

                            nc.setPrestacion(prestacion);
                            nc.setNotaDeDebitoPadre(ndPadre);
                            nc.setMotivoDebito((String) p.get("motivoDebito"));
                            nc.setImporteDebitado(importeDebitado);
                            nc.setDebitoaceptado(debitoAceptadoBool);
                            nc.setMotivoderefactura((String) p.get("motivoRefactura"));
                            nc.setImportederefactura(importeRefactura);
                            nc.setComentarios((String) p.get("comentarios"));
                            nc.setDiasfacturados(diasFacturados);
                            nc.setPrestacionenglobante(prestacionEnglobante);
                            nc.setUsuario(usuario);
                            nc.setComentariosDebito((String) p.get("comentariosDebito"));
                            nc.setTiporegistro(tipoRegistro);

                            if (nc.getId() == null) nc.setCargadocompletamente(false);

                            notasCreditoAGuardar.add(nc); // ACUMULAMOS
                        });
            }
        }

        // 3. ESCRITURA EN LOTE: Guardamos todo junto
        if (!notasCreditoAGuardar.isEmpty()) {
            notaDeCreditoRepository.saveAll(notasCreditoAGuardar);
        }
        if (!notasDebitoAGuardar.isEmpty()) {
            notaDeDebitoRepository.saveAll(notasDebitoAGuardar);
        }
    }

    @Transactional
    public void procesarNuevaNotaDebito(Map<String, Object> payload) {
        String usuario = (String) payload.get("usuario");
        Map<String, Object> datosNota = (Map<String, Object>) payload.get("datosNota");
        List<Map<String, Object>> registros = (List<Map<String, Object>>) payload.get("registros");

        String tipoRegistro = obtenerTipoRegistro((String) payload.get("origen"), (String) payload.get("letraOriginal"),
                Integer.valueOf(payload.get("ptovtaOriginal").toString()), Integer.valueOf(payload.get("numeroOriginal").toString()));

        if (registros == null || registros.isEmpty()) return;

        List<Integer> idsPrestaciones = registros.stream().map(p -> ((Number) p.get("id")).intValue()).toList();
        Map<Integer, AmbLiquidado> prestacionesMap = ambLiquidadoRepository.findAllById(idsPrestaciones)
                .stream().collect(Collectors.toMap(AmbLiquidado::getId, p -> p));

        List<NotaDeDebito> notasDebitoAGuardar = new ArrayList<>();

        Integer puntoVenta = Integer.valueOf(datosNota.get("puntoVenta").toString());
        Integer numero = Integer.valueOf(datosNota.get("numero").toString());
        java.time.LocalDate fechaDoc = java.sql.Date.valueOf(datosNota.get("fecha").toString()).toLocalDate();
        String tipoDoc = (String) datosNota.get("tipo");
        String letraDoc = (String) datosNota.get("letra");

        for (Map<String, Object> p : registros) {
            Integer idPrestacion = ((Number) p.get("id")).intValue();
            AmbLiquidado prestacion = prestacionesMap.get(idPrestacion);
            if (prestacion == null) continue;

            BigDecimal importeRefactura = parsearMonto(p.get("importeRefactura"));
            Integer diasFacturados = parsearEntero(p.get("diasFacturados"));

            notaDeCreditoRepository.findByLetraAndPtovtaAndNumeroAndPrestacionIdAndDebitoaceptadoFalse(
                    (String) payload.get("letraOriginal"),
                    Integer.valueOf(payload.get("ptovtaOriginal").toString()),
                    Integer.valueOf(payload.get("numeroOriginal").toString()),
                    idPrestacion
            ).ifPresent(ncPadre -> {
                NotaDeDebito nd = notaDeDebitoRepository.findByNotaDeCreditoPadreId(ncPadre.getId())
                        .orElse(new NotaDeDebito());

                nd.setPrestacion(prestacion);
                nd.setNotaDeCreditoPadre(ncPadre);
                nd.setTipo(tipoDoc);
                nd.setLetra(letraDoc);
                nd.setPtovta(puntoVenta);
                nd.setNumero(numero);
                nd.setFecha(fechaDoc);
                nd.setMotivorefactura((String) p.get("motivoRefactura"));
                nd.setImporterefactura(importeRefactura);
                nd.setComentarios((String) p.get("comentarios"));
                nd.setComentariosDebito((String) p.get("comentariosDebito"));
                nd.setDiasfacturados(diasFacturados);
                nd.setUsuario(usuario);
                nd.setTiporegistro(tipoRegistro);
                nd.setCodigo((String) p.get("codigo"));
                nd.setCargadocompletamente(true);

                if (nd.getId() == null) nd.setCargarcompletamente(true);

                notasDebitoAGuardar.add(nd); // ACUMULAMOS
            });
        }

        if (!notasDebitoAGuardar.isEmpty()) {
            notaDeDebitoRepository.saveAll(notasDebitoAGuardar); // GUARDAMOS EN LOTE
        }
    }

    @Transactional
    public void procesarNuevaNotaCredito(Map<String, Object> payload) {
        String origen = (String) payload.get("origen");
        String usuario = (String) payload.get("usuario");
        Map<String, Object> datosNota = (Map<String, Object>) payload.get("datosNota");
        List<Map<String, Object>> registros = (List<Map<String, Object>>) payload.get("registros");

        String tipoRegistro = obtenerTipoRegistro(origen, (String) payload.get("letraOriginal"),
                Integer.valueOf(payload.get("ptovtaOriginal").toString()), Integer.valueOf(payload.get("numeroOriginal").toString()));

        if (registros == null || registros.isEmpty()) return;

        List<Integer> idsPrestaciones = registros.stream().map(p -> ((Number) p.get("id")).intValue()).toList();
        Map<Integer, AmbLiquidado> prestacionesMap = ambLiquidadoRepository.findAllById(idsPrestaciones)
                .stream().collect(Collectors.toMap(AmbLiquidado::getId, p -> p));

        List<NotaDeCredito> notasCreditoAGuardar = new ArrayList<>();

        Integer puntoVenta = Integer.valueOf(datosNota.get("puntoVenta").toString());
        Integer numero = Integer.valueOf(datosNota.get("numero").toString());
        java.time.LocalDate fechaDoc = java.sql.Date.valueOf(datosNota.get("fecha").toString()).toLocalDate();
        String tipoDoc = (String) datosNota.get("tipo");
        String letraDoc = (String) datosNota.get("letra");

        for (Map<String, Object> p : registros) {
            Integer idPrestacion = ((Number) p.get("id")).intValue();
            AmbLiquidado prestacion = prestacionesMap.get(idPrestacion);
            if (prestacion == null) continue;

            BigDecimal importeDebitado = parsearMonto(p.get("importeDebitado"));
            BigDecimal importeRefactura = parsearMonto(p.get("importeRefactura"));
            Boolean debitoAceptadoBool = parsearBooleano(p.get("debitoAceptado"));
            Integer diasFacturados = parsearEntero(p.get("diasFacturados"));
            String prestacionEnglobante = p.get("prestacionEnglobante") != null ? (String) p.get("prestacionEnglobante") : "";

            if ("FC".equals(origen)) {
                NotaDeCredito nc = notaDeCreditoRepository.findByPrestacionIdAndNotaDeDebitoPadreIsNull(idPrestacion)
                        .orElse(new NotaDeCredito());

                nc.setPrestacion(prestacion);
                nc.setTipo(tipoDoc);
                nc.setLetra(letraDoc);
                nc.setPtovta(puntoVenta);
                nc.setNumero(numero);
                nc.setFecha(fechaDoc);
                nc.setMotivoDebito((String) p.get("motivoDebito"));
                nc.setImporteDebitado(importeDebitado);
                nc.setDebitoaceptado(debitoAceptadoBool);
                nc.setMotivoderefactura((String) p.get("motivoRefactura"));
                nc.setImportederefactura(importeRefactura);
                nc.setPrestacionenglobante(prestacionEnglobante);
                nc.setComentarios((String) p.get("comentarios"));
                nc.setComentariosDebito((String) p.get("comentariosDebito"));
                nc.setDiasfacturados(diasFacturados);
                nc.setUsuario(usuario);
                nc.setTiporegistro(tipoRegistro);
                nc.setCargadocompletamente(true);

                notasCreditoAGuardar.add(nc); // ACUMULAMOS

            } else if ("ND".equals(origen)) {
                notaDeDebitoRepository.findByLetraAndPtovtaAndNumeroAndPrestacionId(
                        (String) payload.get("letraOriginal"),
                        Integer.valueOf(payload.get("ptovtaOriginal").toString()),
                        Integer.valueOf(payload.get("numeroOriginal").toString()),
                        idPrestacion
                ).ifPresent(ndPadre -> {
                    NotaDeCredito nc = notaDeCreditoRepository.findByNotaDeDebitoPadreId(ndPadre.getId())
                            .orElse(new NotaDeCredito());

                    nc.setPrestacion(prestacion);
                    nc.setNotaDeDebitoPadre(ndPadre);
                    nc.setTipo(tipoDoc);
                    nc.setLetra(letraDoc);
                    nc.setPtovta(puntoVenta);
                    nc.setNumero(numero);
                    nc.setFecha(fechaDoc);
                    nc.setMotivoDebito((String) p.get("motivoDebito"));
                    nc.setImporteDebitado(importeDebitado);
                    nc.setDebitoaceptado(debitoAceptadoBool);
                    nc.setMotivoderefactura((String) p.get("motivoRefactura"));
                    nc.setImportederefactura(importeRefactura);
                    nc.setPrestacionenglobante(prestacionEnglobante);
                    nc.setComentarios((String) p.get("comentarios"));
                    nc.setComentariosDebito((String) p.get("comentariosDebito"));
                    nc.setDiasfacturados(diasFacturados);
                    nc.setUsuario(usuario);
                    nc.setTiporegistro(tipoRegistro);
                    nc.setCargadocompletamente(true);

                    notasCreditoAGuardar.add(nc); // ACUMULAMOS
                });
            }
        }

        if (!notasCreditoAGuardar.isEmpty()) {
            notaDeCreditoRepository.saveAll(notasCreditoAGuardar); // GUARDAMOS EN LOTE
        }
    }

    private BigDecimal parsearMonto(Object valor) {
        if (valor == null || valor.toString().trim().isEmpty()) {
            return null;
        }
        return new BigDecimal(valor.toString());
    }

    private Boolean parsearBooleano(Object valor) {
        if ("SI".equals(valor)) return true;
        if ("NO".equals(valor)) return false;
        return null;
    }

    private Integer parsearEntero(Object valor) {
        if (valor == null || valor.toString().trim().isEmpty()) {
            return null;
        }
        return Integer.valueOf(valor.toString());
    }

}