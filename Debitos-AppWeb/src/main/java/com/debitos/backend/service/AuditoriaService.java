package com.debitos.backend.service;

import com.debitos.backend.dto.DatosNotaDTO;
import com.debitos.backend.dto.DocumentoAsociadoDTO;
import com.debitos.backend.dto.FilaAjusteIvaResumenDTO;
import com.debitos.backend.dto.FilaHistorialDTO;
import com.debitos.backend.dto.GuardarParcialRequest;
import com.debitos.backend.dto.NuevaNotaCreditoRequest;
import com.debitos.backend.dto.NuevaNotaDebitoAjusteIvaRequest;
import com.debitos.backend.dto.NuevaNotaDebitoRequest;
import com.debitos.backend.dto.PrestacionAuditoriaDTO;
import com.debitos.backend.dto.RegistroAuditoriaDTO;
import com.debitos.backend.dto.ResultadoBusquedaDTO;
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

    public ResultadoBusquedaDTO buscarUnificado(String tipo, String letra, int ptovta, int numero) {
        ResultadoBusquedaDTO resultado = null;

        if ("NC".equalsIgnoreCase(tipo)) {
            // 1. Primero busca en notadecredito
            try {
                String tipoRegistro = obtenerTipoRegistro("NC", letra, ptovta, numero);
                if (tipoRegistro != null) {
                    List<PrestacionAuditoriaDTO> resultadosNc = obtenerPrestaciones("NC", tipoRegistro, letra, ptovta, numero);
                    if (resultadosNc != null && !resultadosNc.isEmpty()) {
                        resultado = ResultadoBusquedaDTO.dePrestaciones(resultadosNc);
                    }
                }
            } catch (Exception ignored) {}

            // 2. Si no se encontró en notadecredito, busca en nc_ajustedeiva
            if (resultado == null) {
                java.util.Optional<NcAjusteDeIva> ncIvaOpt = ncAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc(letra, ptovta, numero);
                if (ncIvaOpt.isPresent()) {
                    NcAjusteDeIva ncIva = ncIvaOpt.get();
                    List<FilaAjusteIvaResumenDTO> filas = construirTablaResumenAjusteIva(ncIva);
                    resultado = ResultadoBusquedaDTO.deAjusteIva(filas);
                }
            }
        } else if ("ND".equalsIgnoreCase(tipo)) {
            // 1. Primero busca en notadedebito
            try {
                String tipoRegistro = obtenerTipoRegistro("ND", letra, ptovta, numero);
                if (tipoRegistro != null) {
                    List<PrestacionAuditoriaDTO> resultadosNd = obtenerPrestaciones("ND", tipoRegistro, letra, ptovta, numero);
                    if (resultadosNd != null && !resultadosNd.isEmpty()) {
                        resultado = ResultadoBusquedaDTO.dePrestaciones(resultadosNd);
                    }
                }
            } catch (Exception ignored) {}

            // 2. Si no se encontró en notadedebito, busca en nd_ajustedeiva
            if (resultado == null) {
                java.util.Optional<NdAjusteDeIva> ndIvaOpt = ndAjusteDeIvaRepository.findByLetraNdAndPtovtaNdAndNumeroNd(letra, ptovta, numero);
                if (ndIvaOpt.isPresent()) {
                    NdAjusteDeIva ndIva = ndIvaOpt.get();
                    java.util.Optional<NcAjusteDeIva> ncIvaOpt = ncAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc(
                            ndIva.getLetraNc(), ndIva.getPtovtaNc(), ndIva.getNumeroNc()
                    );
                    if (ncIvaOpt.isPresent()) {
                        List<FilaAjusteIvaResumenDTO> filas = construirTablaResumenAjusteIva(ncIvaOpt.get());
                        resultado = ResultadoBusquedaDTO.deAjusteIva(filas);
                    } else {
                        List<FilaAjusteIvaResumenDTO> filas = construirTablaResumenDesdeNdIva(ndIva);
                        resultado = ResultadoBusquedaDTO.deAjusteIva(filas);
                    }
                }
            }
        }

        if (resultado == null) {
            String tipoRegistro = obtenerTipoRegistro(tipo, letra, ptovta, numero);
            if (tipoRegistro != null) {
                List<PrestacionAuditoriaDTO> resultados = obtenerPrestaciones(tipo, tipoRegistro, letra, ptovta, numero);
                resultado = ResultadoBusquedaDTO.dePrestaciones(resultados);
            }
        }

        return adjuntarVerificacionesEHistorial(resultado, tipo, letra, ptovta, numero);
    }

    private ResultadoBusquedaDTO adjuntarVerificacionesEHistorial(ResultadoBusquedaDTO dto, String tipo, String letra, int ptovta, int numero) {
        if (dto == null) return null;

        try {
            if ("FC".equalsIgnoreCase(tipo)) {
                dto.setDocumentosCreadosInfo(obtenerNotasDeCreditoCreadasParaFC(letra, ptovta, numero));
            } else if ("NC".equalsIgnoreCase(tipo) || "NCE".equalsIgnoreCase(tipo)) {
                dto.setDocumentosCreadosInfo(obtenerNotasDeDebitoCreadasParaNC(letra, ptovta, numero));
            } else if ("ND".equalsIgnoreCase(tipo) || "NDE".equalsIgnoreCase(tipo)) {
                dto.setDocumentoCreadoInfo(obtenerNotaDeCreditoCreadaParaND(letra, ptovta, numero));
            }
        } catch (Exception ignored) {}

        try {
            dto.setHistorialComprobantes(obtenerHistorialComprobantes(tipo, letra, ptovta, numero));
        } catch (Exception ignored) {}

        return dto;
    }

    private List<FilaAjusteIvaResumenDTO> construirTablaResumenAjusteIva(NcAjusteDeIva ncIva) {
        List<FilaAjusteIvaResumenDTO> filas = new ArrayList<>();

        // 1. Fila FC (Factura madre)
        Object[] totalesFcObj = ambLiquidadoRepository.findTotalesFacturaMadre(ncIva.getLetraFc(), ncIva.getPtovtaFc(), ncIva.getNumeroFc());
        String periodoFcStr = "";
        BigDecimal netoFc = BigDecimal.ZERO;
        BigDecimal ivaFc = BigDecimal.ZERO;

        if (totalesFcObj != null && totalesFcObj.length > 0) {
            Object rowObj = totalesFcObj[0];
            if (rowObj instanceof Object[] row) {
                if (row[0] != null) periodoFcStr = row[0].toString();
                if (row[1] != null) netoFc = new BigDecimal(row[1].toString());
                if (row[2] != null) ivaFc = new BigDecimal(row[2].toString());
            }
        }

        FilaAjusteIvaResumenDTO filaFc = new FilaAjusteIvaResumenDTO(
                ncIva.getTipoFc(),
                ncIva.getLetraFc(),
                ncIva.getPtovtaFc(),
                ncIva.getNumeroFc(),
                periodoFcStr,
                netoFc,
                ncIva.getPorcIva(),
                ivaFc
        );
        filas.add(filaFc);

        // 2. Fila NC (Nota de Crédito)
        String fechaNcStr = ncIva.getFecha() != null ? ncIva.getFecha().toString() : (ncIva.getFechaRegistro() != null ? ncIva.getFechaRegistro().toString().split("T")[0] : "");
        FilaAjusteIvaResumenDTO filaNc = new FilaAjusteIvaResumenDTO(
                ncIva.getTipoNc(),
                ncIva.getLetraNc(),
                ncIva.getPtovtaNc(),
                ncIva.getNumeroNc(),
                fechaNcStr,
                ncIva.getNeto(),
                ncIva.getPorcIva(),
                ncIva.getIva()
        );
        filas.add(filaNc);

        // 3. Fila ND (Nota de Débito)
        java.util.Optional<NdAjusteDeIva> ndOpt = ndAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc(
                ncIva.getLetraNc(), ncIva.getPtovtaNc(), ncIva.getNumeroNc()
        );

        if (ndOpt.isPresent()) {
            NdAjusteDeIva ndIva = ndOpt.get();
            String fechaNdStr = ndIva.getFecha() != null ? ndIva.getFecha().toString() : (ndIva.getFechaRegistro() != null ? ndIva.getFechaRegistro().toString().split("T")[0] : "");
            FilaAjusteIvaResumenDTO filaNd = new FilaAjusteIvaResumenDTO(
                    ndIva.getTipoNd(),
                    ndIva.getLetraNd(),
                    ndIva.getPtovtaNd(),
                    ndIva.getNumeroNd(),
                    fechaNdStr,
                    ndIva.getNeto(),
                    ndIva.getPorcIva(),
                    ndIva.getIva()
            );
            filas.add(filaNd);
        } else {
            FilaAjusteIvaResumenDTO filaNd = new FilaAjusteIvaResumenDTO(
                    "ND", "", null, null, "", null, null, null
            );
            filas.add(filaNd);
        }

        return filas;
    }

    private List<FilaAjusteIvaResumenDTO> construirTablaResumenDesdeNdIva(NdAjusteDeIva ndIva) {
        List<FilaAjusteIvaResumenDTO> filas = new ArrayList<>();

        // 1. Fila FC vacía
        filas.add(new FilaAjusteIvaResumenDTO("FC", "", null, null, "", null, null, null));

        // 2. Fila NC con datos mínimos de la NC padre almacenados en ndIva
        filas.add(new FilaAjusteIvaResumenDTO(ndIva.getTipoNc(), ndIva.getLetraNc(), ndIva.getPtovtaNc(), ndIva.getNumeroNc(), "", null, null, null));

        // 3. Fila ND
        String fechaNdStr = ndIva.getFecha() != null ? ndIva.getFecha().toString() : (ndIva.getFechaRegistro() != null ? ndIva.getFechaRegistro().toString().split("T")[0] : "");
        filas.add(new FilaAjusteIvaResumenDTO(
                ndIva.getTipoNd(),
                ndIva.getLetraNd(),
                ndIva.getPtovtaNd(),
                ndIva.getNumeroNd(),
                fechaNdStr,
                ndIva.getNeto(),
                ndIva.getPorcIva(),
                ndIva.getIva()
        ));

        return filas;
    }

    public List<FilaHistorialDTO> obtenerHistorialComprobantes(String tipo, String letra, int ptovta, int numero) {
        List<FilaHistorialDTO> historial = new ArrayList<>();

        String letraFc = letra;
        Integer ptovtaFc = ptovta;
        Integer numeroFc = numero;

        if ("NC".equalsIgnoreCase(tipo) || "NCE".equalsIgnoreCase(tipo)) {
            List<Object[]> fcMadre = notaDeCreditoRepository.findFacturaMadreDeNc(letra, ptovta, numero);
            if (fcMadre != null && !fcMadre.isEmpty() && fcMadre.get(0) != null) {
                Object[] row = fcMadre.get(0);
                if (row[0] != null) letraFc = row[0].toString();
                if (row[1] != null) ptovtaFc = Integer.parseInt(row[1].toString());
                if (row[2] != null) numeroFc = Integer.parseInt(row[2].toString());
            } else {
                // Puede ser una NC de ajuste de IVA — buscar la FC madre por esa vía
                java.util.Optional<NcAjusteDeIva> ncIvaOpt = ncAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc(letra, ptovta, numero);
                if (ncIvaOpt.isPresent()) {
                    NcAjusteDeIva ncIva = ncIvaOpt.get();
                    letraFc = ncIva.getLetraFc();
                    ptovtaFc = ncIva.getPtovtaFc();
                    numeroFc = ncIva.getNumeroFc();
                }
            }
        } else if ("ND".equalsIgnoreCase(tipo) || "NDE".equalsIgnoreCase(tipo)) {
            List<Object[]> fcMadre = notaDeDebitoRepository.findFacturaMadreDeNd(letra, ptovta, numero);
            if (fcMadre != null && !fcMadre.isEmpty() && fcMadre.get(0) != null) {
                Object[] row = fcMadre.get(0);
                if (row[0] != null) letraFc = row[0].toString();
                if (row[1] != null) ptovtaFc = Integer.parseInt(row[1].toString());
                if (row[2] != null) numeroFc = Integer.parseInt(row[2].toString());
            } else {
                // Puede ser una ND de ajuste de IVA — buscar la NC de ajuste que la referencia
                java.util.Optional<NdAjusteDeIva> ndIvaOpt = ndAjusteDeIvaRepository.findByLetraNdAndPtovtaNdAndNumeroNd(letra, ptovta, numero);
                if (ndIvaOpt.isPresent()) {
                    NdAjusteDeIva ndIva = ndIvaOpt.get();
                    java.util.Optional<NcAjusteDeIva> ncIvaOpt = ncAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc(
                            ndIva.getLetraNc(), ndIva.getPtovtaNc(), ndIva.getNumeroNc());
                    if (ncIvaOpt.isPresent()) {
                        NcAjusteDeIva ncIva = ncIvaOpt.get();
                        letraFc = ncIva.getLetraFc();
                        ptovtaFc = ncIva.getPtovtaFc();
                        numeroFc = ncIva.getNumeroFc();
                    }
                }
            }
        }

        // 1. Fila FC (Factura madre) — nivel 0, sin badge
        Object[] totalesFcObj = ambLiquidadoRepository.findTotalesFacturaMadre(letraFc, ptovtaFc, numeroFc);
        String periodoFcStr = "";
        BigDecimal netoFc = BigDecimal.ZERO;
        BigDecimal ivaFc = BigDecimal.ZERO;
        if (totalesFcObj != null && totalesFcObj.length > 0) {
            Object rowObj = totalesFcObj[0];
            if (rowObj instanceof Object[] row) {
                if (row[0] != null) periodoFcStr = row[0].toString();
                if (row[1] != null) netoFc = new BigDecimal(row[1].toString());
                if (row.length > 2 && row[2] != null) ivaFc = new BigDecimal(row[2].toString());
            } else {
                if (totalesFcObj[0] != null) periodoFcStr = totalesFcObj[0].toString();
                if (totalesFcObj.length > 1 && totalesFcObj[1] != null) netoFc = new BigDecimal(totalesFcObj[1].toString());
                if (totalesFcObj.length > 2 && totalesFcObj[2] != null) ivaFc = new BigDecimal(totalesFcObj[2].toString());
            }
        }

        FilaHistorialDTO filaFc = new FilaHistorialDTO("FC", letraFc, ptovtaFc, numeroFc, periodoFcStr, netoFc);
        filaFc.setNivel(0);
        filaFc.setMontoIva(ivaFc);
        historial.add(filaFc);

        // 2. NCs primarias hijas de la Factura madre (refactura, nc.id_notadedebito IS NULL)
        List<Object[]> ncsPrimarias = notaDeCreditoRepository.findNcsResumenParaFacturaMadre(letraFc, ptovtaFc, numeroFc);
        if (ncsPrimarias != null) {
            for (Object[] rowNc : ncsPrimarias) {
                String tipoNcStr = rowNc[0] != null ? rowNc[0].toString() : "NC";
                String letraNcStr = rowNc[1] != null ? rowNc[1].toString() : "";
                Integer ptovtaNcInt = rowNc[2] != null ? Integer.parseInt(rowNc[2].toString()) : null;
                Integer numeroNcInt = rowNc[3] != null ? Integer.parseInt(rowNc[3].toString()) : null;
                String fechaNcStr = rowNc[4] != null ? rowNc[4].toString() : "";
                BigDecimal netoNc = rowNc[5] != null ? new BigDecimal(rowNc[5].toString()) : BigDecimal.ZERO;
                BigDecimal ivaNc = rowNc.length > 6 && rowNc[6] != null ? new BigDecimal(rowNc[6].toString()) : BigDecimal.ZERO;

                agregarArbolRefacturaDesdeNc(historial, tipoNcStr, letraNcStr, ptovtaNcInt, numeroNcInt, fechaNcStr, netoNc, ivaNc, 1);
            }
        }

        // 3. NC de ajuste de IVA vinculada a la FC madre — nivel 1, badge IVA
        try {
            java.util.Optional<NcAjusteDeIva> ncIvaOpt = ncAjusteDeIvaRepository.findByLetraFcAndPtovtaFcAndNumeroFc(letraFc, ptovtaFc, numeroFc);
            if (ncIvaOpt.isPresent()) {
                NcAjusteDeIva ncIva = ncIvaOpt.get();
                String fechaNcIvaStr = ncIva.getFecha() != null ? ncIva.getFecha().toString()
                        : (ncIva.getFechaRegistro() != null ? ncIva.getFechaRegistro().toString().split("T")[0] : "");

                FilaHistorialDTO filaNcIva = new FilaHistorialDTO(
                        ncIva.getTipoNc(), ncIva.getLetraNc(), ncIva.getPtovtaNc(), ncIva.getNumeroNc(),
                        fechaNcIvaStr, ncIva.getNeto());
                filaNcIva.setNivel(1);
                filaNcIva.setOrigenTipo("IVA");
                filaNcIva.setPorcentajeIva(ncIva.getPorcIva());
                filaNcIva.setMontoIva(ncIva.getIva());
                historial.add(filaNcIva);

                // 4. ND de ajuste de IVA vinculada a esta NC — nivel 2, badge IVA
                java.util.Optional<NdAjusteDeIva> ndIvaOpt = ndAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc(
                        ncIva.getLetraNc(), ncIva.getPtovtaNc(), ncIva.getNumeroNc());

                if (ndIvaOpt.isPresent()) {
                    NdAjusteDeIva ndIva = ndIvaOpt.get();
                    String fechaNdIvaStr = ndIva.getFecha() != null ? ndIva.getFecha().toString()
                            : (ndIva.getFechaRegistro() != null ? ndIva.getFechaRegistro().toString().split("T")[0] : "");

                    FilaHistorialDTO filaNdIva = new FilaHistorialDTO(
                            ndIva.getTipoNd(), ndIva.getLetraNd(), ndIva.getPtovtaNd(), ndIva.getNumeroNd(),
                            fechaNdIvaStr, ndIva.getNeto());
                    filaNdIva.setNivel(2);
                    filaNdIva.setOrigenTipo("IVA");
                    filaNdIva.setPorcentajeIva(ndIva.getPorcIva());
                    filaNdIva.setMontoIva(ndIva.getIva());
                    historial.add(filaNdIva);
                } else {
                    // Placeholder: la ND aún no fue creada → el frontend mostrará "Crear Nota de Débito"
                    FilaHistorialDTO placeholderNd = new FilaHistorialDTO("ND", "", null, null, "", null);
                    placeholderNd.setNivel(2);
                    placeholderNd.setOrigenTipo("IVA");
                    placeholderNd.setPlaceholderNdAjusteIva(true);
                    placeholderNd.setPorcentajeIva(ncIva.getPorcIva());
                    placeholderNd.setMontoIva(ncIva.getIva());
                    historial.add(placeholderNd);
                }
            }
        } catch (Exception ignored) {}

        return historial;
    }

    private void agregarArbolRefacturaDesdeNc(List<FilaHistorialDTO> historial, String tipoNc, String letraNc,
                                              Integer ptovtaNc, Integer numeroNc, String fechaNc, BigDecimal netoNc,
                                              BigDecimal ivaNc, int nivel) {
        FilaHistorialDTO filaNc = new FilaHistorialDTO(tipoNc, letraNc, ptovtaNc, numeroNc, fechaNc, netoNc);
        filaNc.setNivel(nivel);
        filaNc.setOrigenTipo("REF");
        filaNc.setMontoIva(ivaNc);
        historial.add(filaNc);

        if (letraNc != null && ptovtaNc != null && numeroNc != null) {
            List<Object[]> nds = notaDeDebitoRepository.findNdsResumenParaNcPadre(letraNc, ptovtaNc, numeroNc);
            if (nds != null) {
                for (Object[] rowNd : nds) {
                    String tipoNdStr = rowNd[0] != null ? rowNd[0].toString() : "ND";
                    String letraNdStr = rowNd[1] != null ? rowNd[1].toString() : "";
                    Integer ptovtaNdInt = rowNd[2] != null ? Integer.parseInt(rowNd[2].toString()) : null;
                    Integer numeroNdInt = rowNd[3] != null ? Integer.parseInt(rowNd[3].toString()) : null;
                    String fechaNdStr = rowNd[4] != null ? rowNd[4].toString() : "";
                    BigDecimal netoNd = rowNd[5] != null ? new BigDecimal(rowNd[5].toString()) : BigDecimal.ZERO;
                    BigDecimal ivaNd = rowNd.length > 6 && rowNd[6] != null ? new BigDecimal(rowNd[6].toString()) : BigDecimal.ZERO;

                    FilaHistorialDTO filaNd = new FilaHistorialDTO(tipoNdStr, letraNdStr, ptovtaNdInt, numeroNdInt, fechaNdStr, netoNd);
                    filaNd.setNivel(nivel + 1);
                    filaNd.setOrigenTipo("REF");
                    filaNd.setMontoIva(ivaNd);
                    historial.add(filaNd);

                    // Buscar NCs hijas de esta ND (recursión para nivel + 2)
                    if (letraNdStr != null && ptovtaNdInt != null && numeroNdInt != null) {
                        List<Object[]> ncsHijas = notaDeCreditoRepository.findNcsResumenParaNdPadre(letraNdStr, ptovtaNdInt, numeroNdInt);
                        if (ncsHijas != null) {
                            for (Object[] rowNcHija : ncsHijas) {
                                String tipoNcH = rowNcHija[0] != null ? rowNcHija[0].toString() : "NC";
                                String letraNcH = rowNcHija[1] != null ? rowNcHija[1].toString() : "";
                                Integer ptovtaNcH = rowNcHija[2] != null ? Integer.parseInt(rowNcHija[2].toString()) : null;
                                Integer numeroNcH = rowNcHija[3] != null ? Integer.parseInt(rowNcHija[3].toString()) : null;
                                String fechaNcH = rowNcHija[4] != null ? rowNcHija[4].toString() : "";
                                BigDecimal netoNcH = rowNcHija[5] != null ? new BigDecimal(rowNcHija[5].toString()) : BigDecimal.ZERO;
                                BigDecimal ivaNcH = rowNcHija.length > 6 && rowNcHija[6] != null ? new BigDecimal(rowNcHija[6].toString()) : BigDecimal.ZERO;

                                agregarArbolRefacturaDesdeNc(historial, tipoNcH, letraNcH, ptovtaNcH, numeroNcH, fechaNcH, netoNcH, ivaNcH, nivel + 2);
                            }
                        }
                    }
                }
            }
        }
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

            if (datosNota.getFecha() != null && !datosNota.getFecha().toString().trim().isEmpty()) {
                try {
                    ncIva.setFecha(java.sql.Date.valueOf(datosNota.getFecha().toString()).toLocalDate());
                } catch (Exception ignored) {}
            }

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

        if (request.getFecha() != null && !request.getFecha().toString().trim().isEmpty()) {
            try {
                ndIva.setFecha(java.sql.Date.valueOf(request.getFecha().toString()).toLocalDate());
            } catch (Exception ignored) {}
        }

        ndAjusteDeIvaRepository.save(ndIva);
    }

    public boolean tieneNcAjusteIva(String tipoFc, String letraFc, int ptovtaFc, int numeroFc) {
        if (letraFc == null || letraFc.trim().isEmpty()) {
            return false;
        }
        String tipoUpper = (tipoFc != null && !tipoFc.trim().isEmpty()) ? tipoFc.trim().toUpperCase() : "FC";
        String letraUpper = letraFc.trim().toUpperCase();

        boolean existeEnNcAjusteIva = ncAjusteDeIvaRepository.existsByTipoFcAndLetraFcAndPtovtaFcAndNumeroFc(tipoUpper, letraUpper, ptovtaFc, numeroFc);
        boolean existeEnNotaCredito = notaDeCreditoRepository.existsByFacturaAndIvaMalFacturado(letraUpper, ptovtaFc, numeroFc);
        return existeEnNcAjusteIva || existeEnNotaCredito;
    }
}