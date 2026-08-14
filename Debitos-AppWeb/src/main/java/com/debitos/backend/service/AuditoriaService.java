package com.debitos.backend.service;

import com.debitos.backend.dto.DocumentoAsociadoDTO;
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

    public List<PrestacionAuditoriaDTO> obtenerPrestaciones(String facturaTipo, String tipoRegistro, String letra,
            int ptovta, int numero) {
        return switch (facturaTipo) {
            case "FC" -> ambLiquidadoRepository.findPrestacionesPorFactura(letra, ptovta, numero);
            case "NC" -> notaDeCreditoRepository.findPrestacionesPorNotaCredito(letra, ptovta, numero);
            case "ND" -> notaDeDebitoRepository.findPrestacionesPorNotaDebito(letra, ptovta, numero);
            default -> throw new IllegalArgumentException("Tipo de documento desconocido: " + facturaTipo);
        };
    }

    /**
     * Verifica si todas las prestaciones de una FC ya tienen una NC formalmente creada
     * (con tipo, fecha, letra, numero y ptovta no nulos en la tabla notadecredito).
     */
    public boolean tieneNotaDeCreditoCreada(String letra, int ptovta, int numero) {
        return notaDeCreditoRepository.existeNcCompletaParaFactura(letra, ptovta, numero);
    }

    /**
     * Regla 1: Una FC puede tener múltiples NC → devuelve la lista completa de NC creadas.
     * El controller expone esta lista; el frontend la muestra como badges individuales.
     */
    public List<DocumentoAsociadoDTO> obtenerNotasDeCreditoCreadasParaFC(String letra, int ptovta, int numero) {
        return notaDeCreditoRepository.findNcCompletaParaFactura(letra, ptovta, numero);
    }

    /**
     * Regla 2: Una NC hija de FC puede tener múltiples ND → devuelve la lista completa.
     */
    public boolean tieneNotaDeDebitoCreada(String letra, int ptovta, int numero) {
        return notaDeDebitoRepository.existeNdCompletaParaNotaCredito(letra, ptovta, numero);
    }

    public List<DocumentoAsociadoDTO> obtenerNotasDeDebitoCreadasParaNC(String letra, int ptovta, int numero) {
        List<Object[]> rows = notaDeDebitoRepository.findNdCompletaParaNotaCreditoRaw(letra, ptovta, numero);
        if (rows == null || rows.isEmpty()) {
            return new ArrayList<>();
        }
        List<DocumentoAsociadoDTO> lista = new ArrayList<>();
        for (Object[] row : rows) {
            String tipo = row[0] != null ? row[0].toString() : "";
            String l = row[1] != null ? row[1].toString() : "";
            Integer p = row[2] != null ? ((Number) row[2]).intValue() : 0;
            Integer n = row[3] != null ? ((Number) row[3]).intValue() : 0;
            java.time.LocalDate f = null;
            if (row[4] != null) {
                if (row[4] instanceof java.sql.Date sqlDate) f = sqlDate.toLocalDate();
                else if (row[4] instanceof java.time.LocalDate localDate) f = localDate;
                else try { f = java.time.LocalDate.parse(row[4].toString()); } catch (Exception ignored) {}
            }
            String tipoNd = row[5] != null ? row[5].toString() : null;
            lista.add(new DocumentoAsociadoDTO(tipo, l, p, n, f, tipoNd));
        }
        return lista;
    }

    /**
     * Relación ND→NC sigue siendo 1:1 (una ND genera a lo sumo una NC hija).
     */
    public boolean tieneNotaDeCreditoCreadaParaND(String letra, int ptovta, int numero) {
        return notaDeCreditoRepository.existeNcCompletaParaNotaDebito(letra, ptovta, numero);
    }

    public DocumentoAsociadoDTO obtenerNotaDeCreditoCreadaParaND(String letra, int ptovta, int numero) {
        if (notaDeCreditoRepository.existeNcCompletaParaNotaDebito(letra, ptovta, numero)) {
            return notaDeCreditoRepository.findNcCompletaParaNotaDebito(letra, ptovta, numero)
                    .stream().findFirst().orElse(null);
        }
        return null;
    }

    private NotaDeCredito obtenerOCrearNotaCreditoPrimaria(Integer idPrestacion) {
        return notaDeCreditoRepository.findByPrestacionIdAndNotaDeDebitoPadreIsNull(idPrestacion)
                .orElse(new NotaDeCredito());
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

        if (registros == null || registros.isEmpty())
            return;

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
            String prestacionEnglobante = p.get("prestacionEnglobante") != null ? (String) p.get("prestacionEnglobante")
                    : "";

            if ("FC".equals(documentoOrigen)) {
                NotaDeCredito nc = obtenerOCrearNotaCreditoPrimaria(idPrestacion);

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

                if (nc.getId() == null)
                    nc.setCargadocompletamente(false);

                notasCreditoAGuardar.add(nc); // ACUMULAMOS
            } else if ("NC".equals(documentoOrigen)) {
                notaDeCreditoRepository
                        .findByLetraAndPtovtaAndNumeroAndPrestacionId(letra, ptovta, numero, idPrestacion)
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
            } else if ("ND".equals(documentoOrigen)) {
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

                            if (nc.getId() == null)
                                nc.setCargadocompletamente(false);

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
                Integer.valueOf(payload.get("ptovtaOriginal").toString()),
                Integer.valueOf(payload.get("numeroOriginal").toString()));

        Integer puntoVenta = Integer.valueOf(datosNota.get("puntoVenta").toString());
        Integer numero = Integer.valueOf(datosNota.get("numero").toString());
        java.time.LocalDate fechaDoc = java.sql.Date.valueOf(datosNota.get("fecha").toString()).toLocalDate();
        String tipoDoc = (String) datosNota.get("tipo");
        String letraDoc = (String) datosNota.get("letra");
        String tipoNd = (String) datosNota.get("tipoNd");

        if ("Por ajuste de IVA".equals(tipoNd)) {
            BigDecimal importeRefactura = parsearMonto(datosNota.get("importeRefactura"));
            if (importeRefactura == null || importeRefactura.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Debe ingresar un importe válido para la Nota de Débito por ajuste de IVA.");
            }
            if (notaDeDebitoRepository.existsByTiporegistroAndTipoNd(tipoRegistro, "Por ajuste de IVA")) {
                throw new IllegalArgumentException("Ya existe una Nota de Débito por ajuste de IVA para este comprobante.");
            }

            NotaDeDebito nd = new NotaDeDebito();
            nd.setTipo(tipoDoc);
            nd.setLetra(letraDoc);
            nd.setPtovta(puntoVenta);
            nd.setNumero(numero);
            nd.setFecha(fechaDoc);
            nd.setTipoNd("Por ajuste de IVA");
            nd.setImporterefactura(importeRefactura);
            nd.setUsuario(usuario);
            nd.setTiporegistro(tipoRegistro);
            nd.setCargadocompletamente(true);
            nd.setCargarcompletamente(true);

            notaDeDebitoRepository.save(nd);
            return;
        }

        if (registros == null || registros.isEmpty())
            return;

        List<Integer> idsPrestaciones = registros.stream().map(p -> ((Number) p.get("id")).intValue()).toList();
        Map<Integer, AmbLiquidado> prestacionesMap = ambLiquidadoRepository.findAllById(idsPrestaciones)
                .stream().collect(Collectors.toMap(AmbLiquidado::getId, p -> p));

        List<NotaDeDebito> notasDebitoAGuardar = new ArrayList<>();

        for (Map<String, Object> p : registros) {
            Integer idPrestacion = ((Number) p.get("id")).intValue();
            AmbLiquidado prestacion = prestacionesMap.get(idPrestacion);
            if (prestacion == null)
                continue;

            BigDecimal importeRefactura = parsearMonto(p.get("importeRefactura"));
            Integer diasFacturados = parsearEntero(p.get("diasFacturados"));

            // Buscamos la NC padre correspondiente a esta prestación.
            // Usamos findByLetraAndPtovtaAndNumeroAndPrestacionId sin el filtro de debitoaceptado,
            // porque el frontend ya valida que el usuario solo envíe prestaciones con debitoAceptado='NO'.
            notaDeCreditoRepository.findByLetraAndPtovtaAndNumeroAndPrestacionId(
                    (String) payload.get("letraOriginal"),
                    Integer.valueOf(payload.get("ptovtaOriginal").toString()),
                    Integer.valueOf(payload.get("numeroOriginal").toString()),
                    idPrestacion).ifPresent(ncPadre -> {

                        // Regla 2: Si la NC es hija directa de una FC (notaDeDebitoPadre == null),
                        // se permite generar MÚLTIPLES ND independientes → siempre new NotaDeDebito().
                        // Si la NC es hija de una ND (notaDeDebitoPadre != null), la relación es 1:1
                        // → upsert sobre la ND existente para no duplicar.
                        final NotaDeDebito nd;
                        if (ncPadre.getNotaDeDebitoPadre() == null) {
                            if (tipoNd == null || tipoNd.trim().isEmpty()) {
                                throw new IllegalArgumentException("Debe especificar el tipo de Nota de Débito (Por ajuste de IVA o Por Refactura).");
                            }
                            if (notaDeDebitoRepository.existsByNotaDeCreditoPadreIdAndTipoNd(ncPadre.getId(), tipoNd)) {
                                throw new IllegalArgumentException("Ya existe una Nota de Débito de tipo '" + tipoNd + "' para la Nota de Crédito seleccionada.");
                            }
                            nd = new NotaDeDebito(); // Regla 2: nueva ND independiente
                        } else {
                            nd = notaDeDebitoRepository.findByNotaDeCreditoPadreId(ncPadre.getId())
                                    .orElse(new NotaDeDebito()); // Relación 1:1 mantenida
                        }

                        nd.setPrestacion(prestacion);
                        nd.setNotaDeCreditoPadre(ncPadre);
                        nd.setTipo(tipoDoc);
                        nd.setLetra(letraDoc);
                        nd.setPtovta(puntoVenta);
                        nd.setNumero(numero);
                        nd.setFecha(fechaDoc);
                        nd.setTipoNd(tipoNd);
                        nd.setMotivorefactura((String) p.get("motivoRefactura"));
                        nd.setImporterefactura(importeRefactura);
                        nd.setComentarios((String) p.get("comentarios"));
                        nd.setComentariosDebito((String) p.get("comentariosDebito"));
                        nd.setDiasfacturados(diasFacturados);
                        nd.setUsuario(usuario);
                        nd.setTiporegistro(tipoRegistro);
                        nd.setCodigo((String) p.get("codigo"));
                        nd.setCargadocompletamente(true);

                        if (nd.getId() == null)
                            nd.setCargarcompletamente(true);

                        notasDebitoAGuardar.add(nd);
                    });
        }

        if (!notasDebitoAGuardar.isEmpty()) {
            notaDeDebitoRepository.saveAll(notasDebitoAGuardar);
        }
    }

    @Transactional
    public void procesarNuevaNotaCredito(Map<String, Object> payload) {
        String origen = (String) payload.get("origen");
        String usuario = (String) payload.get("usuario");
        Map<String, Object> datosNota = (Map<String, Object>) payload.get("datosNota");
        List<Map<String, Object>> registros = (List<Map<String, Object>>) payload.get("registros");

        String tipoRegistro = obtenerTipoRegistro(origen, (String) payload.get("letraOriginal"),
                Integer.valueOf(payload.get("ptovtaOriginal").toString()),
                Integer.valueOf(payload.get("numeroOriginal").toString()));

        if (registros == null || registros.isEmpty())
            return;

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
            if (prestacion == null)
                continue;

            BigDecimal importeDebitado = parsearMonto(p.get("importeDebitado"));
            BigDecimal importeRefactura = parsearMonto(p.get("importeRefactura"));
            Boolean debitoAceptadoBool = parsearBooleano(p.get("debitoAceptado"));
            Integer diasFacturados = parsearEntero(p.get("diasFacturados"));
            String prestacionEnglobante = p.get("prestacionEnglobante") != null ? (String) p.get("prestacionEnglobante")
                    : "";

            if ("FC".equals(origen)) {
                // Buscamos si la prestación ya posee un registro de NC previo (priorizando formal sobre borrador)
                NotaDeCredito nc = obtenerOCrearNotaCreditoPrimaria(idPrestacion);

                nc.setPrestacion(prestacion);
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

                // EXCLUSIVIDAD DE MEMBRESÍA:
                // Solo si la prestación aún NO pertenece a una NC formal (nc.getNumero() == null),
                // le asignamos los datos de la NUEVA NC que se está generando.
                // Si la prestación ya pertenecía a una NC previa (nc.getNumero() != null),
                // se conservan sus datos de cabecera de la NC previa (no se reasigna a la nueva NC).
                if (nc.getNumero() == null) {
                    nc.setTipo(tipoDoc);
                    nc.setLetra(letraDoc);
                    nc.setPtovta(puntoVenta);
                    nc.setNumero(numero);
                    nc.setFecha(fechaDoc);
                }

                notasCreditoAGuardar.add(nc);

            } else if ("ND".equals(origen)) {
                notaDeDebitoRepository.findByLetraAndPtovtaAndNumeroAndPrestacionId(
                        (String) payload.get("letraOriginal"),
                        Integer.valueOf(payload.get("ptovtaOriginal").toString()),
                        Integer.valueOf(payload.get("numeroOriginal").toString()),
                        idPrestacion).ifPresent(ndPadre -> {

                            // Regla 3: No se puede crear una NC a partir de una ND cuyo motivo sea
                            // "Por ajuste de IVA". La validación se hace en el servicio para
                            // garantizar integridad aunque el frontend ya lo bloquea en la UI.
                            String motivoNd = ndPadre.getMotivorefactura();
                            if ("Por ajuste de IVA".equals(motivoNd)) {
                                throw new IllegalArgumentException(
                                        "No se puede generar una NC a partir de un ajuste de IVA");
                            }

                            // Relación ND→NC sigue siendo 1:1: upsert sobre la NC hija.
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

                            notasCreditoAGuardar.add(nc);
                        });
            }
        }

        if (!notasCreditoAGuardar.isEmpty()) {
            notaDeCreditoRepository.saveAll(notasCreditoAGuardar);
        }
    }

    private BigDecimal parsearMonto(Object valor) {
        if (valor == null || valor.toString().trim().isEmpty()) {
            return null;
        }
        return new BigDecimal(valor.toString());
    }

    private Boolean parsearBooleano(Object valor) {
        if ("SI".equals(valor))
            return true;
        if ("NO".equals(valor))
            return false;
        return null;
    }

    private Integer parsearEntero(Object valor) {
        if (valor == null || valor.toString().trim().isEmpty()) {
            return null;
        }
        return Integer.valueOf(valor.toString());
    }

    public DocumentoAsociadoDTO obtenerDocumentoAsociadoParaNC(String letra, int ptovta, int numero) {
        List<Object[]> rows = notaDeCreditoRepository.findDocumentoAsociadoPadreRaw(letra, ptovta, numero);
        if (rows != null && !rows.isEmpty()) {
            Object[] row = rows.get(0);
            String tipo = row[0] != null ? row[0].toString() : "FC";
            String l = row[1] != null ? row[1].toString() : "";
            Integer p = row[2] != null ? ((Number) row[2]).intValue() : 0;
            Integer n = row[3] != null ? ((Number) row[3]).intValue() : 0;
            java.time.LocalDate f = null;
            if (row[4] != null) {
                if (row[4] instanceof java.sql.Date sqlDate) {
                    f = sqlDate.toLocalDate();
                } else if (row[4] instanceof java.time.LocalDate localDate) {
                    f = localDate;
                } else {
                    try {
                        f = java.time.LocalDate.parse(row[4].toString());
                    } catch (Exception e) {
                        f = null;
                    }
                }
            }
            return new DocumentoAsociadoDTO(tipo, l, p, n, f);
        }
        return null;
    }
}