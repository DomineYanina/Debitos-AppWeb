package com.debitos.backend.service;

import com.debitos.backend.dto.*;
import com.debitos.backend.model.AmbLiquidado;
import com.debitos.backend.model.NcAjusteDeIva;
import com.debitos.backend.model.NdAjusteDeIva;
import com.debitos.backend.model.NotaDeCredito;
import com.debitos.backend.model.NotaDeDebito;
import com.debitos.backend.repository.AmbLiquidadoRepository;
import com.debitos.backend.repository.NcAjusteDeIvaRepository;
import com.debitos.backend.repository.NdAjusteDeIvaRepository;
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

    @Autowired
    private NcAjusteDeIvaRepository ncAjusteDeIvaRepository;

    @Autowired
    private NdAjusteDeIvaRepository ndAjusteDeIvaRepository;

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

    public boolean tieneNotaDeCreditoCreada(String letra, int ptovta, int numero) {
        return notaDeCreditoRepository.existeNcCompletaParaFactura(letra, ptovta, numero);
    }

    public List<DocumentoAsociadoDTO> obtenerNotasDeCreditoCreadasParaFC(String letra, int ptovta, int numero) {
        return notaDeCreditoRepository.findNcCompletaParaFactura(letra, ptovta, numero);
    }

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
    public void procesarGuardadoParcial(GuardarParcialRequest request) {
        if (request == null) return;
        String documentoOrigen = request.getDocumentoOrigen();
        String letra = request.getLetra();
        Integer ptovta = request.getPtovta() != null ? Integer.valueOf(request.getPtovta().toString()) : 0;
        Integer numero = request.getNumero() != null ? Integer.valueOf(request.getNumero().toString()) : 0;
        String usuario = request.getUsuario();

        String tipoRegistro = obtenerTipoRegistro(documentoOrigen, letra, ptovta, numero);
        List<RegistroAuditoriaDTO> registros = request.getRegistros();

        if (registros == null || registros.isEmpty()) return;

        List<Integer> idsPrestaciones = registros.stream()
                .filter(p -> p.getId() != null)
                .map(RegistroAuditoriaDTO::getId)
                .toList();

        Map<Integer, AmbLiquidado> prestacionesMap = ambLiquidadoRepository.findAllById(idsPrestaciones)
                .stream().collect(Collectors.toMap(AmbLiquidado::getId, p -> p));

        List<NotaDeCredito> notasCreditoAGuardar = new ArrayList<>();
        List<NotaDeDebito> notasDebitoAGuardar = new ArrayList<>();

        for (RegistroAuditoriaDTO p : registros) {
            Integer idPrestacion = p.getId();
            if (idPrestacion == null) continue;
            AmbLiquidado prestacion = prestacionesMap.get(idPrestacion);

            if (prestacion == null) {
                throw new RuntimeException("Prestación no encontrada: " + idPrestacion);
            }

            BigDecimal importeDebitado = parsearMonto(p.getImporteDebitado());
            BigDecimal importeRefactura = parsearMonto(p.getImporteRefactura());
            Boolean debitoAceptadoBool = parsearBooleano(p.getDebitoAceptado());
            Integer diasFacturados = parsearEntero(p.getDiasFacturados());
            String prestacionEnglobante = p.getPrestacionEnglobante() != null ? p.getPrestacionEnglobante() : "";

            if ("FC".equals(documentoOrigen)) {
                NotaDeCredito nc = obtenerOCrearNotaCreditoPrimaria(idPrestacion);

                nc.setPrestacion(prestacion);
                nc.setMotivoDebito(p.getMotivoDebito());
                nc.setImporteDebitado(importeDebitado);
                nc.setDebitoaceptado(debitoAceptadoBool);
                nc.setMotivoderefactura(p.getMotivoRefactura());
                nc.setImportederefactura(importeRefactura);
                nc.setComentarios(p.getComentarios());
                nc.setDiasfacturados(diasFacturados);
                nc.setPrestacionenglobante(prestacionEnglobante);
                nc.setUsuario(usuario);
                nc.setComentariosDebito(p.getComentariosDebito());
                nc.setTiporegistro(tipoRegistro);

                if (nc.getId() == null)
                    nc.setCargadocompletamente(false);

                notasCreditoAGuardar.add(nc);
            } else if ("NC".equals(documentoOrigen)) {
                notaDeCreditoRepository
                        .findByLetraAndPtovtaAndNumeroAndPrestacionId(letra, ptovta, numero, idPrestacion)
                        .ifPresent(ncPadre -> {
                            NotaDeDebito nd = notaDeDebitoRepository.findByNotaDeCreditoPadreId(ncPadre.getId())
                                    .orElse(new NotaDeDebito());

                            nd.setPrestacion(prestacion);
                            nd.setNotaDeCreditoPadre(ncPadre);
                            nd.setMotivorefactura(p.getMotivoRefactura());
                            nd.setImporterefactura(importeRefactura);
                            nd.setComentarios(p.getComentarios());
                            nd.setDiasfacturados(diasFacturados);
                            nd.setUsuario(usuario);
                            nd.setCodigo(p.getCodigo());
                            nd.setTiporegistro(tipoRegistro);

                            if (nd.getId() == null) {
                                nd.setCargadocompletamente(false);
                                nd.setCargarcompletamente(false);
                            }

                            notasDebitoAGuardar.add(nd);
                        });
            } else if ("ND".equals(documentoOrigen)) {
                notaDeDebitoRepository.findByLetraAndPtovtaAndNumeroAndPrestacionId(letra, ptovta, numero, idPrestacion)
                        .ifPresent(ndPadre -> {
                            NotaDeCredito nc = notaDeCreditoRepository.findByNotaDeDebitoPadreId(ndPadre.getId())
                                    .orElse(new NotaDeCredito());

                            nc.setPrestacion(prestacion);
                            nc.setNotaDeDebitoPadre(ndPadre);
                            nc.setMotivoDebito(p.getMotivoDebito());
                            nc.setImporteDebitado(importeDebitado);
                            nc.setDebitoaceptado(debitoAceptadoBool);
                            nc.setMotivoderefactura(p.getMotivoRefactura());
                            nc.setImportederefactura(importeRefactura);
                            nc.setComentarios(p.getComentarios());
                            nc.setDiasfacturados(diasFacturados);
                            nc.setPrestacionenglobante(prestacionEnglobante);
                            nc.setUsuario(usuario);
                            nc.setComentariosDebito(p.getComentariosDebito());
                            nc.setTiporegistro(tipoRegistro);

                            if (nc.getId() == null)
                                nc.setCargadocompletamente(false);

                            notasCreditoAGuardar.add(nc);
                        });
            }
        }

        if (!notasCreditoAGuardar.isEmpty()) {
            notaDeCreditoRepository.saveAll(notasCreditoAGuardar);
        }
        if (!notasDebitoAGuardar.isEmpty()) {
            notaDeDebitoRepository.saveAll(notasDebitoAGuardar);
        }
    }

    @Transactional
    public void procesarNuevaNotaDebito(NuevaNotaDebitoRequest request) {
        if (request == null) return;
        String usuario = request.getUsuario();
        DatosNotaDTO datosNota = request.getDatosNota();
        List<RegistroAuditoriaDTO> registros = request.getRegistros();

        String tipoRegistro = obtenerTipoRegistro(request.getOrigen(), request.getLetraOriginal(),
                Integer.valueOf(request.getPtovtaOriginal().toString()),
                Integer.valueOf(request.getNumeroOriginal().toString()));

        Integer puntoVenta = Integer.valueOf(datosNota.getPuntoVenta().toString());
        Integer numero = Integer.valueOf(datosNota.getNumero().toString());
        java.time.LocalDate fechaDoc = java.sql.Date.valueOf(datosNota.getFecha().toString()).toLocalDate();
        String tipoDoc = datosNota.getTipo();
        String letraDoc = datosNota.getLetra();
        String tipoNd = datosNota.getTipoNd();

        if ("Por ajuste de IVA".equals(tipoNd)) {
            BigDecimal importeRefactura = parsearMonto(datosNota.getImporteRefactura());
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

        List<Integer> idsPrestaciones = registros.stream().filter(p -> p.getId() != null).map(RegistroAuditoriaDTO::getId).toList();
        Map<Integer, AmbLiquidado> prestacionesMap = ambLiquidadoRepository.findAllById(idsPrestaciones)
                .stream().collect(Collectors.toMap(AmbLiquidado::getId, p -> p));

        List<NotaDeDebito> notasDebitoAGuardar = new ArrayList<>();

        for (RegistroAuditoriaDTO p : registros) {
            Integer idPrestacion = p.getId();
            if (idPrestacion == null) continue;
            AmbLiquidado prestacion = prestacionesMap.get(idPrestacion);
            if (prestacion == null)
                continue;

            BigDecimal importeRefactura = parsearMonto(p.getImporteRefactura());
            Integer diasFacturados = parsearEntero(p.getDiasFacturados());

            notaDeCreditoRepository.findByLetraAndPtovtaAndNumeroAndPrestacionId(
                    request.getLetraOriginal(),
                    Integer.valueOf(request.getPtovtaOriginal().toString()),
                    Integer.valueOf(request.getNumeroOriginal().toString()),
                    idPrestacion).ifPresent(ncPadre -> {
                        final NotaDeDebito nd;
                        if (ncPadre.getNotaDeDebitoPadre() == null) {
                            if (tipoNd == null || tipoNd.trim().isEmpty()) {
                                throw new IllegalArgumentException("Debe especificar el tipo de Nota de Débito (Por ajuste de IVA o Por Refactura).");
                            }
                            if (notaDeDebitoRepository.existsByNotaDeCreditoPadreIdAndTipoNd(ncPadre.getId(), tipoNd)) {
                                throw new IllegalArgumentException("Ya existe una Nota de Débito de tipo '" + tipoNd + "' para la Nota de Crédito seleccionada.");
                            }
                            nd = new NotaDeDebito();
                        } else {
                            nd = notaDeDebitoRepository.findByNotaDeCreditoPadreId(ncPadre.getId())
                                    .orElse(new NotaDeDebito());
                        }

                        nd.setPrestacion(prestacion);
                        nd.setNotaDeCreditoPadre(ncPadre);
                        nd.setTipo(tipoDoc);
                        nd.setLetra(letraDoc);
                        nd.setPtovta(puntoVenta);
                        nd.setNumero(numero);
                        nd.setFecha(fechaDoc);
                        nd.setTipoNd(tipoNd);
                        nd.setMotivorefactura(p.getMotivoRefactura());
                        nd.setImporterefactura(importeRefactura);
                        nd.setComentarios(p.getComentarios());
                        nd.setComentariosDebito(p.getComentariosDebito());
                        nd.setDiasfacturados(diasFacturados);
                        nd.setUsuario(usuario);
                        nd.setTiporegistro(tipoRegistro);
                        nd.setCodigo(p.getCodigo());
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
    public void procesarNuevaNotaCredito(NuevaNotaCreditoRequest request) {
        if (request == null) return;
        String origen = request.getOrigen();
        String usuario = request.getUsuario();
        DatosNotaDTO datosNota = request.getDatosNota();
        List<RegistroAuditoriaDTO> registros = request.getRegistros();

        if (datosNota == null) return;

        Integer puntoVenta = Integer.valueOf(datosNota.getPuntoVenta().toString());
        Integer numero = Integer.valueOf(datosNota.getNumero().toString());
        String tipoDoc = datosNota.getTipo();
        String letraDoc = datosNota.getLetra();

        // Verificación previa de existencia en ambas tablas (notadecredito y nc_ajustedeiva)
        boolean existeEnNc = notaDeCreditoRepository.existsByTipoAndLetraAndPtovtaAndNumero(tipoDoc, letraDoc, puntoVenta, numero);
        boolean existeEnNcIva = ncAjusteDeIvaRepository.existsByTipoNcAndLetraNcAndPtovtaNcAndNumeroNc(tipoDoc, letraDoc, puntoVenta, numero);

        if (existeEnNc || existeEnNcIva) {
            throw new IllegalArgumentException(
                String.format("Ya existe una Nota de Crédito registrada con los datos especificados (%s %s-%04d-%08d).",
                    tipoDoc, letraDoc, puntoVenta, numero)
            );
        }

        String tipoRegistro = obtenerTipoRegistro(origen, request.getLetraOriginal(),
                Integer.valueOf(request.getPtovtaOriginal().toString()),
                Integer.valueOf(request.getNumeroOriginal().toString()));

        // Manejo especial para NC por Ajuste de IVA
        if (datosNota != null && "Por ajuste de IVA".equals(datosNota.getTipoNc())) {
            BigDecimal neto = parsearMonto(datosNota.getNeto());
            BigDecimal iva = parsearMonto(datosNota.getIva());
            BigDecimal porcIva = parsearMonto(datosNota.getPorcIva());

            if ("No prestacional".equals(datosNota.getSubtipoIva()) && (neto == null || iva == null || porcIva == null)) {
                throw new IllegalArgumentException("Debe ingresar el neto, IVA y porcentaje de IVA válidos para la NC por Ajuste de IVA No prestacional.");
            }

            NcAjusteDeIva ncIva = new NcAjusteDeIva();
            ncIva.setLetraFc(request.getLetraOriginal());
            ncIva.setPtovtaFc(Integer.valueOf(request.getPtovtaOriginal().toString()));
            ncIva.setTipoFc(origen);
            ncIva.setNumeroFc(Integer.valueOf(request.getNumeroOriginal().toString()));

            ncIva.setLetraNc(datosNota.getLetra());
            ncIva.setPtovtaNc(Integer.valueOf(datosNota.getPuntoVenta().toString()));
            ncIva.setTipoNc(datosNota.getTipo());
            ncIva.setNumeroNc(Integer.valueOf(datosNota.getNumero().toString()));

            ncIva.setNeto(neto != null ? neto : BigDecimal.ZERO);
            ncIva.setIva(iva != null ? iva : BigDecimal.ZERO);
            ncIva.setPorcIva(porcIva != null ? porcIva : BigDecimal.ZERO);

            ncAjusteDeIvaRepository.save(ncIva);

            if ("No prestacional".equals(datosNota.getSubtipoIva())) {
                return;
            }
        }

        if (registros == null || registros.isEmpty())
            return;

        List<Integer> idsPrestaciones = registros.stream().filter(p -> p.getId() != null).map(RegistroAuditoriaDTO::getId).toList();
        Map<Integer, AmbLiquidado> prestacionesMap = ambLiquidadoRepository.findAllById(idsPrestaciones)
                .stream().collect(Collectors.toMap(AmbLiquidado::getId, p -> p));

        List<NotaDeCredito> notasCreditoAGuardar = new ArrayList<>();

        java.time.LocalDate fechaDoc = java.sql.Date.valueOf(datosNota.getFecha().toString()).toLocalDate();

        for (RegistroAuditoriaDTO p : registros) {
            Integer idPrestacion = p.getId();
            if (idPrestacion == null) continue;
            AmbLiquidado prestacion = prestacionesMap.get(idPrestacion);
            if (prestacion == null)
                continue;

            BigDecimal importeDebitado = parsearMonto(p.getImporteDebitado());
            BigDecimal importeRefactura = parsearMonto(p.getImporteRefactura());
            Boolean debitoAceptadoBool = parsearBooleano(p.getDebitoAceptado());
            Integer diasFacturados = parsearEntero(p.getDiasFacturados());
            String prestacionEnglobante = p.getPrestacionEnglobante() != null ? p.getPrestacionEnglobante() : "";

            if ("FC".equals(origen)) {
                NotaDeCredito nc = obtenerOCrearNotaCreditoPrimaria(idPrestacion);

                nc.setPrestacion(prestacion);
                nc.setMotivoDebito(p.getMotivoDebito());
                nc.setImporteDebitado(importeDebitado);
                nc.setDebitoaceptado(debitoAceptadoBool);
                nc.setMotivoderefactura(p.getMotivoRefactura());
                nc.setImportederefactura(importeRefactura);
                nc.setPrestacionenglobante(prestacionEnglobante);
                nc.setComentarios(p.getComentarios());
                nc.setComentariosDebito(p.getComentariosDebito());
                nc.setDiasfacturados(diasFacturados);
                nc.setUsuario(usuario);
                nc.setTiporegistro(tipoRegistro);
                nc.setCargadocompletamente(true);

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
                        request.getLetraOriginal(),
                        Integer.valueOf(request.getPtovtaOriginal().toString()),
                        Integer.valueOf(request.getNumeroOriginal().toString()),
                        idPrestacion).ifPresent(ndPadre -> {
                            String motivoNd = ndPadre.getMotivorefactura();
                            if ("Por ajuste de IVA".equals(motivoNd)) {
                                throw new IllegalArgumentException(
                                        "No se puede generar una NC a partir de un ajuste de IVA");
                            }

                            NotaDeCredito nc = notaDeCreditoRepository.findByNotaDeDebitoPadreId(ndPadre.getId())
                                    .orElse(new NotaDeCredito());

                            nc.setPrestacion(prestacion);
                            nc.setNotaDeDebitoPadre(ndPadre);
                            nc.setTipo(tipoDoc);
                            nc.setLetra(letraDoc);
                            nc.setPtovta(puntoVenta);
                            nc.setNumero(numero);
                            nc.setFecha(fechaDoc);
                            nc.setMotivoDebito(p.getMotivoDebito());
                            nc.setImporteDebitado(importeDebitado);
                            nc.setDebitoaceptado(debitoAceptadoBool);
                            nc.setMotivoderefactura(p.getMotivoRefactura());
                            nc.setImportederefactura(importeRefactura);
                            nc.setPrestacionenglobante(prestacionEnglobante);
                            nc.setComentarios(p.getComentarios());
                            nc.setComentariosDebito(p.getComentariosDebito());
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

    @Transactional
    public void procesarNuevaNotaDebitoAjusteIva(NuevaNotaDebitoAjusteIvaRequest request) {
        if (request == null) return;

        String tipoNd = request.getTipoNd();
        String letraNd = request.getLetraNd();
        Integer ptovtaNd = Integer.valueOf(request.getPtovtaNd().toString());
        Integer numeroNd = Integer.valueOf(request.getNumeroNd().toString());

        // Validar existencia previa en notadedebito y nd_ajustedeiva
        boolean existeEnNd = notaDeDebitoRepository.existsByTipoAndLetraAndPtovtaAndNumero(tipoNd, letraNd, ptovtaNd, numeroNd);
        boolean existeEnNdIva = ndAjusteDeIvaRepository.existsByTipoNdAndLetraNdAndPtovtaNdAndNumeroNd(tipoNd, letraNd, ptovtaNd, numeroNd);

        if (existeEnNd || existeEnNdIva) {
            throw new IllegalArgumentException(
                String.format("Ya existe una Nota de Débito registrada con los datos especificados (%s %s-%04d-%08d).",
                    tipoNd, letraNd, ptovtaNd, numeroNd)
            );
        }

        BigDecimal neto = parsearMonto(request.getNeto());
        BigDecimal iva = parsearMonto(request.getIva());
        BigDecimal porcIva = parsearMonto(request.getPorcIva());

        if (neto == null || iva == null || porcIva == null) {
            throw new IllegalArgumentException("Debe ingresar valores de Neto, IVA y Porcentaje de IVA válidos para la Nota de Débito por Ajuste de IVA.");
        }

        NdAjusteDeIva ndIva = new NdAjusteDeIva();
        ndIva.setTipoNc(request.getTipoNc());
        ndIva.setLetraNc(request.getLetraNc());
        ndIva.setPtovtaNc(Integer.valueOf(request.getPtovtaNc().toString()));
        ndIva.setNumeroNc(Integer.valueOf(request.getNumeroNc().toString()));

        ndIva.setTipoNd(tipoNd);
        ndIva.setLetraNd(letraNd);
        ndIva.setPtovtaNd(ptovtaNd);
        ndIva.setNumeroNd(numeroNd);

        ndIva.setNeto(neto);
        ndIva.setIva(iva);
        ndIva.setPorcIva(porcIva);

        ndAjusteDeIvaRepository.save(ndIva);
    }

    public boolean tieneNcAjusteIva(String tipoFc, String letraFc, int ptovtaFc, int numeroFc) {
        boolean existeEnNcAjusteIva = ncAjusteDeIvaRepository.existsByTipoFcAndLetraFcAndPtovtaFcAndNumeroFc(tipoFc, letraFc, ptovtaFc, numeroFc);
        boolean existeEnNotaCredito = notaDeCreditoRepository.existsByFacturaAndIvaMalFacturado(letraFc, ptovtaFc, numeroFc);
        return existeEnNcAjusteIva || existeEnNotaCredito;
    }
}