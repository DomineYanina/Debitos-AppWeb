package com.debitos.backend.service;

import com.debitos.backend.dto.CabeceraCandidataDTO;
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
import com.debitos.backend.model.Cabecera;
import com.debitos.backend.model.NcAjusteDeIva;
import com.debitos.backend.model.NdAjusteDeIva;
import com.debitos.backend.model.NotaDeCredito;
import com.debitos.backend.model.NotaDeDebito;
import com.debitos.backend.model.RegistroUsabilidad;
import com.debitos.backend.repository.AmbLiquidadoRepository;
import com.debitos.backend.repository.CabeceraRepository;
import com.debitos.backend.repository.NcAjusteDeIvaRepository;
import com.debitos.backend.repository.NdAjusteDeIvaRepository;
import com.debitos.backend.repository.NotaDeCreditoRepository;
import com.debitos.backend.repository.NotaDeDebitoRepository;
import com.debitos.backend.repository.RegistroUsabilidadRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuditoriaService {

    @Autowired
    private CabeceraRepository cabeceraRepository;

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

    @Autowired
    private RegistroUsabilidadRepository registroUsabilidadRepository;

    public static List<String> resolverTiposEquivalentes(String tipo) {
        if (tipo == null || tipo.trim().isEmpty()) return List.of();
        String t = tipo.trim().toUpperCase();
        return switch (t) {
            case "FC", "FAC", "FCE" -> List.of("FC", "FAC", "FCE");
            case "NC", "NCE" -> List.of("NC", "NCE");
            case "ND", "NDE" -> List.of("ND", "NDE");
            default -> List.of(t);
        };
    }

    public String obtenerTipoRegistro(String tipoFactura, String letra, int ptovta, int numero) {
        if (tipoFactura == null || tipoFactura.trim().isEmpty()) {
            return null;
        }
        List<String> tipos = resolverTiposEquivalentes(tipoFactura);
        return cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(tipos, letra, ptovta, numero)
                .stream()
                .findFirst()
                .map(Cabecera::getTiporegistro)
                .orElse(null);
    }

    public List<PrestacionAuditoriaDTO> obtenerPrestaciones(String facturaTipo, String letra, int ptovta, int numero) {
        String tipoUpper = facturaTipo != null ? facturaTipo.trim().toUpperCase() : "";
        return switch (tipoUpper) {
            case "FC", "FAC", "FCE" -> ambLiquidadoRepository.findPrestacionesPorFactura(letra, ptovta, numero);
            case "NC", "NCE" -> notaDeCreditoRepository.findPrestacionesPorNotaCredito(letra, ptovta, numero);
            case "ND", "NDE" -> notaDeDebitoRepository.findPrestacionesPorNotaDebito(letra, ptovta, numero);
            default -> throw new IllegalArgumentException("Tipo de documento desconocido: " + facturaTipo);
        };
    }

    public ResultadoBusquedaDTO buscarUnificado(String tipo, String letra, int ptovta, int numero) {
        ResultadoBusquedaDTO resultado = null;
        String tipoUpper = tipo != null ? tipo.trim().toUpperCase() : "";
        List<String> tiposEquivalentes = resolverTiposEquivalentes(tipoUpper);

        if ("NC".equals(tipoUpper) || "NCE".equals(tipoUpper)) {
            // 1. Primero busca en notadecredito
            try {
                Optional<Cabecera> cabOpt = cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(tiposEquivalentes, letra, ptovta, numero).stream().findFirst();
                if (cabOpt.isPresent()) {
                    List<PrestacionAuditoriaDTO> resultadosNc = obtenerPrestaciones(tipoUpper, letra, ptovta, numero);
                    if (resultadosNc != null && !resultadosNc.isEmpty()) {
                        resultado = ResultadoBusquedaDTO.dePrestaciones(resultadosNc);
                    }
                }
            } catch (Exception ignored) {}

            // 2. Si no se encontró en notadecredito, busca en nc_ajustedeiva
            if (resultado == null) {
                Optional<NcAjusteDeIva> ncIvaOpt = ncAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc(letra, ptovta, numero);
                if (ncIvaOpt.isPresent()) {
                    NcAjusteDeIva ncIva = ncIvaOpt.get();
                    List<FilaAjusteIvaResumenDTO> filas = construirTablaResumenAjusteIva(ncIva);
                    resultado = ResultadoBusquedaDTO.deAjusteIva(filas);
                }
            }
        } else if ("ND".equals(tipoUpper) || "NDE".equals(tipoUpper)) {
            // 1. Primero busca en notadedebito
            try {
                Optional<Cabecera> cabOpt = cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(tiposEquivalentes, letra, ptovta, numero).stream().findFirst();
                if (cabOpt.isPresent()) {
                    List<PrestacionAuditoriaDTO> resultadosNd = obtenerPrestaciones(tipoUpper, letra, ptovta, numero);
                    if (resultadosNd != null && !resultadosNd.isEmpty()) {
                        resultado = ResultadoBusquedaDTO.dePrestaciones(resultadosNd);
                    }
                }
            } catch (Exception ignored) {}

            // 2. Si no se encontró en notadedebito, busca en nd_ajustedeiva
            if (resultado == null) {
                Optional<NdAjusteDeIva> ndIvaOpt = ndAjusteDeIvaRepository.findByLetraNdAndPtovtaNdAndNumeroNd(letra, ptovta, numero);
                if (ndIvaOpt.isPresent()) {
                    NdAjusteDeIva ndIva = ndIvaOpt.get();
                    Optional<NcAjusteDeIva> ncIvaOpt = ncAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc(
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

        // Búsqueda para FC (FAC, FCE) u otros comprobantes
        if (resultado == null) {
            Optional<Cabecera> cabOpt = cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(tiposEquivalentes, letra, ptovta, numero).stream().findFirst();
            if (cabOpt.isPresent()) {
                List<PrestacionAuditoriaDTO> resultados = obtenerPrestaciones(tipoUpper, letra, ptovta, numero);
                if (resultados != null && !resultados.isEmpty()) {
                    resultado = ResultadoBusquedaDTO.dePrestaciones(resultados);
                }
            }
        }

        return adjuntarVerificacionesEHistorial(resultado, tipoUpper, letra, ptovta, numero);
    }

    private ResultadoBusquedaDTO adjuntarVerificacionesEHistorial(ResultadoBusquedaDTO dto, String tipo, String letra, int ptovta, int numero) {
        if (dto == null) return null;

        try {
            if ("FC".equalsIgnoreCase(tipo) || "FAC".equalsIgnoreCase(tipo) || "FCE".equalsIgnoreCase(tipo)) {
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

        // 2. Fila NC (Nota de Crédito) - obtenida de su Cabecera
        Cabecera cabNc = ncIva.getCabecera();
        String tipoNc = cabNc != null ? cabNc.getTipo() : "NC";
        String letraNc = cabNc != null ? cabNc.getLetra() : "";
        Integer ptovtaNc = cabNc != null ? cabNc.getPtovta() : null;
        Integer numeroNc = cabNc != null ? cabNc.getNumero() : null;
        String fechaNcStr = (cabNc != null && cabNc.getFecha() != null)
                ? cabNc.getFecha().toString()
                : (ncIva.getFechaRegistro() != null ? ncIva.getFechaRegistro().toString().split("T")[0] : "");

        FilaAjusteIvaResumenDTO filaNc = new FilaAjusteIvaResumenDTO(
                tipoNc,
                letraNc,
                ptovtaNc,
                numeroNc,
                fechaNcStr,
                ncIva.getNeto(),
                ncIva.getPorcIva(),
                ncIva.getIva()
        );
        filas.add(filaNc);

        // 3. Fila ND (Nota de Débito)
        Optional<NdAjusteDeIva> ndOpt = (letraNc != null && ptovtaNc != null && numeroNc != null)
                ? ndAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc(letraNc, ptovtaNc, numeroNc)
                : Optional.empty();

        if (ndOpt.isPresent()) {
            NdAjusteDeIva ndIva = ndOpt.get();
            Cabecera cabNd = ndIva.getCabecera();
            String tipoNd = cabNd != null ? cabNd.getTipo() : "ND";
            String letraNd = cabNd != null ? cabNd.getLetra() : "";
            Integer ptovtaNd = cabNd != null ? cabNd.getPtovta() : null;
            Integer numeroNd = cabNd != null ? cabNd.getNumero() : null;
            String fechaNdStr = (cabNd != null && cabNd.getFecha() != null)
                    ? cabNd.getFecha().toString()
                    : (ndIva.getFechaRegistro() != null ? ndIva.getFechaRegistro().toString().split("T")[0] : "");

            FilaAjusteIvaResumenDTO filaNd = new FilaAjusteIvaResumenDTO(
                    tipoNd,
                    letraNd,
                    ptovtaNd,
                    numeroNd,
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
        Cabecera cabNd = ndIva.getCabecera();
        String tipoNd = cabNd != null ? cabNd.getTipo() : "ND";
        String letraNd = cabNd != null ? cabNd.getLetra() : "";
        Integer ptovtaNd = cabNd != null ? cabNd.getPtovta() : null;
        Integer numeroNd = cabNd != null ? cabNd.getNumero() : null;
        String fechaNdStr = (cabNd != null && cabNd.getFecha() != null)
                ? cabNd.getFecha().toString()
                : (ndIva.getFechaRegistro() != null ? ndIva.getFechaRegistro().toString().split("T")[0] : "");

        filas.add(new FilaAjusteIvaResumenDTO(
                tipoNd,
                letraNd,
                ptovtaNd,
                numeroNd,
                fechaNdStr,
                ndIva.getNeto(),
                ndIva.getPorcIva(),
                ndIva.getIva()
        ));

        return filas;
    }

    public List<FilaHistorialDTO> obtenerHistorialComprobantes(String tipo, String letra, int ptovta, int numero) {
        List<FilaHistorialDTO> historial = new ArrayList<>();

        List<String> tiposEquivalentes = resolverTiposEquivalentes(tipo);
        Optional<Cabecera> cabeceraActualOpt = cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(tiposEquivalentes, letra, ptovta, numero)
                .stream().findFirst();

        if (cabeceraActualOpt.isEmpty()) {
            return historial;
        }

        Cabecera cabeceraActual = cabeceraActualOpt.get();
        Long grupoId = cabeceraActual.getAsociadogrupo();
        if (grupoId == null || grupoId == 0L) {
            grupoId = cabeceraActual.getGrupo();
        }

        List<Cabecera> familia = (grupoId != null && grupoId != 0L)
                ? cabeceraRepository.findByAsociadogrupo(grupoId)
                : new ArrayList<>();

        if (familia.isEmpty()) {
            familia = List.of(cabeceraActual);
        }

        // Buscar la Cabecera Raíz (Factura Madre Nivel 0): FC / FAC / FCE
        Cabecera raiz = familia.stream()
                .filter(c -> "FC".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                .min((c1, c2) -> {
                    boolean c1Self = c1.getAsociado() != null && c1.getAsociado().equals(c1.getId());
                    boolean c2Self = c2.getAsociado() != null && c2.getAsociado().equals(c2.getId());
                    if (c1Self != c2Self) return c1Self ? -1 : 1;
                    if (c1.getFecha() != null && c2.getFecha() != null) {
                        int comp = c1.getFecha().compareTo(c2.getFecha());
                        if (comp != 0) return comp;
                    }
                    return c1.getId().compareTo(c2.getId());
                })
                .orElse(null);

        if (raiz == null) {
            raiz = "FC".equalsIgnoreCase(resolverTipoBase(cabeceraActual.getTipo())) ? cabeceraActual :
                    familia.stream()
                            .filter(c -> !"RC".equalsIgnoreCase(resolverTipoBase(c.getTipo())))
                            .min((c1, c2) -> {
                                if (c1.getFecha() != null && c2.getFecha() != null) {
                                    int comp = c1.getFecha().compareTo(c2.getFecha());
                                    if (comp != 0) return comp;
                                }
                                return c1.getId().compareTo(c2.getId());
                            })
                            .orElse(cabeceraActual);
        }

        // 1. Fila FC (Factura madre) — Nivel 0
        Object[] totalesFcObj = ambLiquidadoRepository.findTotalesFacturaMadre(raiz.getLetra(), raiz.getPtovta(), raiz.getNumero());
        String periodoFcStr = raiz.getPeriodo() != null ? raiz.getPeriodo().toString() : "";
        BigDecimal netoFc = BigDecimal.ZERO;
        BigDecimal ivaFc = BigDecimal.ZERO;
        if (totalesFcObj != null && totalesFcObj.length > 0) {
            Object rowObj = totalesFcObj[0];
            if (rowObj instanceof Object[] row) {
                if (row[0] != null && periodoFcStr.isEmpty()) periodoFcStr = row[0].toString();
                if (row[1] != null) netoFc = new BigDecimal(row[1].toString());
                if (row.length > 2 && row[2] != null) ivaFc = new BigDecimal(row[2].toString());
            } else {
                if (totalesFcObj[0] != null && periodoFcStr.isEmpty()) periodoFcStr = totalesFcObj[0].toString();
                if (totalesFcObj.length > 1 && totalesFcObj[1] != null) netoFc = new BigDecimal(totalesFcObj[1].toString());
                if (totalesFcObj.length > 2 && totalesFcObj[2] != null) ivaFc = new BigDecimal(totalesFcObj[2].toString());
            }
        }
        if (netoFc.compareTo(BigDecimal.ZERO) == 0 && raiz.getDebe() != null && raiz.getDebe().compareTo(BigDecimal.ZERO) > 0) {
            netoFc = raiz.getDebe();
        }

        FilaHistorialDTO filaFc = new FilaHistorialDTO(
                raiz.getTipo() != null ? raiz.getTipo() : "FC",
                raiz.getLetra(),
                raiz.getPtovta(),
                raiz.getNumero(),
                periodoFcStr,
                netoFc
        );
        filaFc.setNivel(0);
        filaFc.setMontoIva(ivaFc);
        boolean tienePrestacionesFc = raiz.getId() != null && !ambLiquidadoRepository.findByCabecera_Id(raiz.getId()).isEmpty();
        if (!tienePrestacionesFc && raiz.getLetra() != null && raiz.getPtovta() != null && raiz.getNumero() != null) {
            tienePrestacionesFc = !ambLiquidadoRepository.findPrestacionesPorFactura(raiz.getLetra(), raiz.getPtovta(), raiz.getNumero()).isEmpty();
        }
        filaFc.setTienePrestaciones(tienePrestacionesFc);
        historial.add(filaFc);

        // 2. Construir nodos hijos en memoria recursivamente a partir de la raíz
        Set<Long> visitados = new HashSet<>();
        visitados.add(raiz.getId());
        construirNodosHijosEnMemoria(historial, familia, raiz, 1, visitados);

        return historial;
    }

    private void construirNodosHijosEnMemoria(List<FilaHistorialDTO> historial, List<Cabecera> familia, Cabecera padre, int nivel, Set<Long> visitados) {
        if (padre == null || padre.getId() == null) return;

        String tipoPadre = resolverTipoBase(padre.getTipo());
        List<Cabecera> hijos = new ArrayList<>();

        if ("FC".equalsIgnoreCase(tipoPadre)) {
            // Hijos de FC son NCs y RCs del mismo grupo/asociado
            for (Cabecera c : familia) {
                if (visitados.contains(c.getId())) continue;
                String t = resolverTipoBase(c.getTipo());

                if ("RC".equalsIgnoreCase(t)) {
                    if ((c.getGrupo() != null && Objects.equals(c.getGrupo(), padre.getGrupo()))
                            || (c.getAsociado() != null && Objects.equals(c.getAsociado(), padre.getId()))
                            || (c.getGrupo() == null && Objects.equals(c.getAsociadogrupo(), padre.getAsociadogrupo()))) {
                        hijos.add(c);
                    }
                    continue;
                }

                if (!"NC".equalsIgnoreCase(t)) continue;

                // 1. Vinculación directa por asociado en Cabecera
                if (c.getAsociado() != null && c.getAsociado().equals(padre.getId()) && !c.getId().equals(padre.getId())) {
                    hijos.add(c);
                    continue;
                }
                // 2. Vinculación por prestacion en notadecredito
                boolean vinculadoPorNc = notaDeCreditoRepository.findByCabecera_Id(c.getId()).stream()
                        .anyMatch(nc -> nc.getPrestacion() != null && nc.getPrestacion().getCabecera() != null && nc.getPrestacion().getCabecera().getId().equals(padre.getId()));
                if (vinculadoPorNc) {
                    hijos.add(c);
                    continue;
                }
                // 3. Vinculación por nc_ajustedeiva
                Optional<NcAjusteDeIva> ncIvaOpt = ncAjusteDeIvaRepository.findByCabecera_Id(c.getId());
                if (ncIvaOpt.isPresent()) {
                    NcAjusteDeIva ncIva = ncIvaOpt.get();
                    if (Objects.equals(ncIva.getLetraFc(), padre.getLetra())
                            && Objects.equals(ncIva.getPtovtaFc(), padre.getPtovta())
                            && Objects.equals(ncIva.getNumeroFc(), padre.getNumero())) {
                        hijos.add(c);
                        continue;
                    }
                }
                // 4. Si pertenece al mismo asociadogrupo
                if (Objects.equals(c.getAsociadogrupo(), padre.getAsociadogrupo())) {
                    hijos.add(c);
                }
            }
        } else if ("NC".equalsIgnoreCase(tipoPadre)) {
            // Hijos de NC son NDs
            for (Cabecera c : familia) {
                if (visitados.contains(c.getId())) continue;
                String t = resolverTipoBase(c.getTipo());
                if (!"ND".equalsIgnoreCase(t)) continue;

                // 1. Vinculación directa por asociado en Cabecera
                if (c.getAsociado() != null && c.getAsociado().equals(padre.getId()) && !c.getId().equals(padre.getId())) {
                    hijos.add(c);
                    continue;
                }
                // 2. Vinculación por notadedebito -> notaDeCreditoPadre -> cabecera == padre.getId()
                boolean vinculadoPorNd = notaDeDebitoRepository.findByCabecera_Id(c.getId()).stream()
                        .anyMatch(nd -> nd.getNotaDeCreditoPadre() != null && nd.getNotaDeCreditoPadre().getCabecera() != null && nd.getNotaDeCreditoPadre().getCabecera().getId().equals(padre.getId()));
                if (vinculadoPorNd) {
                    hijos.add(c);
                    continue;
                }
                // 3. Vinculación por nd_ajustedeiva
                Optional<NdAjusteDeIva> ndIvaOpt = ndAjusteDeIvaRepository.findByCabecera_Id(c.getId());
                if (ndIvaOpt.isPresent()) {
                    NdAjusteDeIva ndIva = ndIvaOpt.get();
                    if (Objects.equals(ndIva.getLetraNc(), padre.getLetra())
                            && Objects.equals(ndIva.getPtovtaNc(), padre.getPtovta())
                            && Objects.equals(ndIva.getNumeroNc(), padre.getNumero())) {
                        hijos.add(c);
                        continue;
                    }
                }
                // 4. Si pertenece al mismo asociadogrupo
                if (Objects.equals(c.getAsociadogrupo(), padre.getAsociadogrupo())) {
                    hijos.add(c);
                }
            }
        } else if ("ND".equalsIgnoreCase(tipoPadre)) {
            // Hijos de ND son NCs creadas a partir de ND y RCs del grupo de la ND
            for (Cabecera c : familia) {
                if (visitados.contains(c.getId())) continue;
                String t = resolverTipoBase(c.getTipo());

                if ("RC".equalsIgnoreCase(t)) {
                    if ((c.getGrupo() != null && Objects.equals(c.getGrupo(), padre.getGrupo()))
                            || (c.getAsociado() != null && Objects.equals(c.getAsociado(), padre.getId()))) {
                        hijos.add(c);
                    }
                    continue;
                }

                if (!"NC".equalsIgnoreCase(t)) continue;

                if (c.getAsociado() != null && c.getAsociado().equals(padre.getId()) && !c.getId().equals(padre.getId())) {
                    hijos.add(c);
                    continue;
                }
                boolean vinculadoPorNcNd = notaDeCreditoRepository.findByCabecera_Id(c.getId()).stream()
                        .anyMatch(nc -> nc.getNotaDeDebitoPadre() != null && nc.getNotaDeDebitoPadre().getCabecera() != null && nc.getNotaDeDebitoPadre().getCabecera().getId().equals(padre.getId()));
                if (vinculadoPorNcNd) {
                    hijos.add(c);
                }
            }
        }

        // Ordenar hijos por fecha, número, id
        hijos.sort((c1, c2) -> {
            if (c1.getFecha() != null && c2.getFecha() != null) {
                int comp = c1.getFecha().compareTo(c2.getFecha());
                if (comp != 0) return comp;
            }
            if (c1.getNumero() != null && c2.getNumero() != null) {
                int comp = c1.getNumero().compareTo(c2.getNumero());
                if (comp != 0) return comp;
            }
            return c1.getId().compareTo(c2.getId());
        });

        for (Cabecera hijo : hijos) {
            visitados.add(hijo.getId());
            FilaHistorialDTO fila = mapearCabeceraAFilaHistorial(hijo, nivel);
            historial.add(fila);

            // Si es una NC de IVA (nivel 1), verificar si tiene ND hija en memoria
            boolean esNcIva = "IVA".equalsIgnoreCase(fila.getOrigenTipo()) && "NC".equalsIgnoreCase(resolverTipoBase(hijo.getTipo()));
            if (esNcIva) {
                boolean tieneNdHija = familia.stream()
                        .anyMatch(c -> c.getAsociado() != null && c.getAsociado().equals(hijo.getId()));

                if (!tieneNdHija) {
                    // Agregar placeholder de ND de ajuste IVA pendiente
                    FilaHistorialDTO placeholderNd = new FilaHistorialDTO("ND", "", null, null, "", null);
                    placeholderNd.setNivel(nivel + 1);
                    placeholderNd.setOrigenTipo("IVA");
                    placeholderNd.setPlaceholderNdAjusteIva(true);
                    placeholderNd.setPorcentajeIva(fila.getPorcentajeIva());
                    placeholderNd.setMontoIva(fila.getMontoIva());
                    historial.add(placeholderNd);
                }
            }

            // Continuar navegando los hijos de este comprobante
            construirNodosHijosEnMemoria(historial, familia, hijo, nivel + 1, visitados);
        }
    }

    private FilaHistorialDTO mapearCabeceraAFilaHistorial(Cabecera cab, int nivel) {
        String tipoBase = resolverTipoBase(cab.getTipo());
        String fechaStr = cab.getFecha() != null ? cab.getFecha().toString() : "";
        String origenTipo = "REF";
        BigDecimal montoNeto = BigDecimal.ZERO;
        BigDecimal montoIva = BigDecimal.ZERO;
        BigDecimal porcIva = null;

        if ("RC".equalsIgnoreCase(tipoBase)) {
            origenTipo = "COB";
            if (cab.getHaber() != null && cab.getHaber().compareTo(BigDecimal.ZERO) > 0) {
                montoNeto = cab.getHaber();
            } else if (cab.getDebe() != null && cab.getDebe().compareTo(BigDecimal.ZERO) > 0) {
                montoNeto = cab.getDebe();
            }
        } else if ("NC".equalsIgnoreCase(tipoBase)) {
            Optional<NcAjusteDeIva> ncIvaOpt = ncAjusteDeIvaRepository.findByCabecera_Id(cab.getId());
            if (ncIvaOpt.isEmpty() && cab.getLetra() != null && cab.getPtovta() != null && cab.getNumero() != null) {
                ncIvaOpt = ncAjusteDeIvaRepository.findByLetraNcAndPtovtaNcAndNumeroNc(cab.getLetra(), cab.getPtovta(), cab.getNumero());
            }

            if (ncIvaOpt.isPresent()) {
                NcAjusteDeIva ncIva = ncIvaOpt.get();
                origenTipo = "IVA";
                montoNeto = ncIva.getNeto() != null ? ncIva.getNeto() : BigDecimal.ZERO;
                montoIva = ncIva.getIva() != null ? ncIva.getIva() : BigDecimal.ZERO;
                porcIva = ncIva.getPorcIva();
            } else {
                origenTipo = "DEB";
                List<NotaDeCredito> ncs = notaDeCreditoRepository.findByCabecera_Id(cab.getId());
                if (ncs.isEmpty() && cab.getLetra() != null && cab.getPtovta() != null && cab.getNumero() != null) {
                    ncs = notaDeCreditoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_Numero(cab.getLetra(), cab.getPtovta(), cab.getNumero());
                }
                montoNeto = ncs.stream()
                        .map(NotaDeCredito::getImporteDebitado)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                if (montoNeto.compareTo(BigDecimal.ZERO) == 0 && cab.getHaber() != null && cab.getHaber().compareTo(BigDecimal.ZERO) > 0) {
                    montoNeto = cab.getHaber();
                }
            }
        } else if ("ND".equalsIgnoreCase(tipoBase)) {
            Optional<NdAjusteDeIva> ndIvaOpt = ndAjusteDeIvaRepository.findByCabecera_Id(cab.getId());
            if (ndIvaOpt.isEmpty() && cab.getLetra() != null && cab.getPtovta() != null && cab.getNumero() != null) {
                ndIvaOpt = ndAjusteDeIvaRepository.findByLetraNdAndPtovtaNdAndNumeroNd(cab.getLetra(), cab.getPtovta(), cab.getNumero());
            }

            if (ndIvaOpt.isPresent()) {
                NdAjusteDeIva ndIva = ndIvaOpt.get();
                origenTipo = "IVA";
                montoNeto = ndIva.getNeto() != null ? ndIva.getNeto() : BigDecimal.ZERO;
                montoIva = ndIva.getIva() != null ? ndIva.getIva() : BigDecimal.ZERO;
                porcIva = ndIva.getPorcIva();
            } else {
                origenTipo = "REF";
                List<NotaDeDebito> nds = notaDeDebitoRepository.findByCabecera_Id(cab.getId());
                if (nds.isEmpty() && cab.getLetra() != null && cab.getPtovta() != null && cab.getNumero() != null) {
                    nds = notaDeDebitoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_Numero(cab.getLetra(), cab.getPtovta(), cab.getNumero());
                }
                montoNeto = nds.stream()
                        .map(NotaDeDebito::getImporterefactura)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                if (montoNeto.compareTo(BigDecimal.ZERO) == 0 && cab.getDebe() != null && cab.getDebe().compareTo(BigDecimal.ZERO) > 0) {
                    montoNeto = cab.getDebe();
                }
            }
        }

        boolean tienePrestaciones = false;
        if ("NC".equalsIgnoreCase(tipoBase)) {
            boolean enNcIva = cab.getId() != null && ncAjusteDeIvaRepository.findByCabecera_Id(cab.getId()).isPresent();
            boolean enNc = cab.getId() != null && !notaDeCreditoRepository.findByCabecera_Id(cab.getId()).isEmpty();
            if (!enNc && cab.getLetra() != null && cab.getPtovta() != null && cab.getNumero() != null) {
                enNc = !notaDeCreditoRepository.findPrestacionesPorNotaCredito(cab.getLetra(), cab.getPtovta(), cab.getNumero()).isEmpty();
            }
            tienePrestaciones = enNcIva || enNc;
        } else if ("ND".equalsIgnoreCase(tipoBase)) {
            boolean enNdIva = cab.getId() != null && ndAjusteDeIvaRepository.findByCabecera_Id(cab.getId()).isPresent();
            boolean enNd = cab.getId() != null && !notaDeDebitoRepository.findByCabecera_Id(cab.getId()).isEmpty();
            if (!enNd && cab.getLetra() != null && cab.getPtovta() != null && cab.getNumero() != null) {
                enNd = !notaDeDebitoRepository.findPrestacionesPorNotaDebito(cab.getLetra(), cab.getPtovta(), cab.getNumero()).isEmpty();
            }
            tienePrestaciones = enNdIva || enNd;
        } else if ("FC".equalsIgnoreCase(tipoBase)) {
            tienePrestaciones = cab.getId() != null && !ambLiquidadoRepository.findByCabecera_Id(cab.getId()).isEmpty();
            if (!tienePrestaciones && cab.getLetra() != null && cab.getPtovta() != null && cab.getNumero() != null) {
                tienePrestaciones = !ambLiquidadoRepository.findPrestacionesPorFactura(cab.getLetra(), cab.getPtovta(), cab.getNumero()).isEmpty();
            }
        }

        FilaHistorialDTO fila = new FilaHistorialDTO(
                cab.getTipo() != null ? cab.getTipo() : tipoBase,
                cab.getLetra(),
                cab.getPtovta(),
                cab.getNumero(),
                fechaStr,
                montoNeto
        );
        fila.setNivel(nivel);
        fila.setOrigenTipo(origenTipo);
        fila.setPorcentajeIva(porcIva);
        fila.setMontoIva(montoIva);
        fila.setTienePrestaciones(tienePrestaciones);
        return fila;
    }

    private String resolverTipoBase(String tipo) {
        if (tipo == null || tipo.trim().isEmpty()) return "";
        String t = tipo.trim().toUpperCase();
        if ("NC".equals(t) || "NCE".equals(t)) return "NC";
        if ("ND".equals(t) || "NDE".equals(t)) return "ND";
        if ("FC".equals(t) || "FAC".equals(t) || "FCE".equals(t)) return "FC";
        return t;
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
            LocalDate f = null;
            if (row[4] != null) {
                if (row[4] instanceof java.sql.Date sqlDate) f = sqlDate.toLocalDate();
                else if (row[4] instanceof LocalDate localDate) f = localDate;
                else try { f = LocalDate.parse(row[4].toString()); } catch (Exception ignored) {}
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

                if (nc.getId() == null)
                    nc.setCargadocompletamente(false);

                notasCreditoAGuardar.add(nc);
            } else if ("NC".equals(documentoOrigen)) {
                notaDeCreditoRepository
                        .findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionId(letra, ptovta, numero, idPrestacion)
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

                            if (nd.getId() == null) {
                                nd.setCargadocompletamente(false);
                                nd.setCargarcompletamente(false);
                            }

                            notasDebitoAGuardar.add(nd);
                        });
            } else if ("ND".equals(documentoOrigen)) {
                notaDeDebitoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionId(letra, ptovta, numero, idPrestacion)
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

        Integer puntoVenta = Integer.valueOf(datosNota.getPuntoVenta().toString());
        Integer numero = Integer.valueOf(datosNota.getNumero().toString());
        LocalDate fechaDoc = (datosNota.getFecha() != null && !datosNota.getFecha().toString().trim().isEmpty())
                ? java.sql.Date.valueOf(datosNota.getFecha().toString().trim()).toLocalDate()
                : LocalDate.now();
        String tipoDoc = datosNota.getTipo();
        String letraDoc = datosNota.getLetra();
        String tipoNd = datosNota.getTipoNd();

        String tipoRegistro = obtenerTipoRegistro(request.getOrigen(), request.getLetraOriginal(),
                Integer.valueOf(request.getPtovtaOriginal().toString()),
                Integer.valueOf(request.getNumeroOriginal().toString()));

        // Obtener código y nombre de cobertura del comprobante origen
        Optional<Cabecera> cabeceraOrigenOpt = cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(
                resolverTiposEquivalentes(request.getOrigen()), request.getLetraOriginal(),
                Integer.valueOf(request.getPtovtaOriginal().toString()),
                Integer.valueOf(request.getNumeroOriginal().toString()))
                .stream()
                .findFirst();

        String codigoCobertura = cabeceraOrigenOpt.map(Cabecera::getCodigoCobertura).orElse(null);
        String cobertura = cabeceraOrigenOpt.map(Cabecera::getCobertura).orElse(null);

        // 1. Calcular el Debe en caso de creación manual de Cabecera (ND)
        BigDecimal totalDebeCalculado = null;
        if (!"Por ajuste de IVA".equals(tipoNd) && registros != null && !registros.isEmpty()) {
            List<Integer> idsPrestaciones = registros.stream().filter(p -> p.getId() != null).map(RegistroAuditoriaDTO::getId).toList();
            Map<Integer, AmbLiquidado> prestacionesMap = ambLiquidadoRepository.findAllById(idsPrestaciones)
                    .stream().collect(Collectors.toMap(AmbLiquidado::getId, p -> p));

            BigDecimal sumaDebe = BigDecimal.ZERO;
            boolean huboPrestacionCalculada = false;

            for (RegistroAuditoriaDTO p : registros) {
                if (p.getId() == null) continue;
                BigDecimal importeRefactura = parsearMonto(p.getImporteRefactura());
                if (importeRefactura != null && importeRefactura.compareTo(BigDecimal.ZERO) > 0) {
                    AmbLiquidado prest = prestacionesMap.get(p.getId());
                    BigDecimal totalNeto = (prest != null && prest.getTotalNeto() != null) ? prest.getTotalNeto() : BigDecimal.ZERO;
                    BigDecimal iva = (prest != null && prest.getIva() != null) ? prest.getIva() : BigDecimal.ZERO;

                    BigDecimal ivaRefactura = BigDecimal.ZERO;
                    if (totalNeto.compareTo(BigDecimal.ZERO) > 0 && iva.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal porcIva = iva.multiply(new BigDecimal("100")).divide(totalNeto, 6, java.math.RoundingMode.HALF_UP);
                        ivaRefactura = importeRefactura.multiply(porcIva).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                    }

                    BigDecimal totalPrestacionConIva = importeRefactura.add(ivaRefactura).setScale(2, java.math.RoundingMode.HALF_UP);
                    sumaDebe = sumaDebe.add(totalPrestacionConIva);
                    huboPrestacionCalculada = true;
                }
            }
            if (huboPrestacionCalculada) {
                totalDebeCalculado = sumaDebe.setScale(2, java.math.RoundingMode.HALF_UP);
            }
        }

        // 2. Obtener o crear Cabecera
        Cabecera cabecera = resolverOCrearCabecera(datosNota, usuario, request.getOrigen(),
                request.getLetraOriginal(), request.getPtovtaOriginal(), request.getNumeroOriginal(),
                tipoRegistro, codigoCobertura, cobertura, cabeceraOrigenOpt,
                totalDebeCalculado != null ? totalDebeCalculado : BigDecimal.ZERO,
                BigDecimal.ZERO);

        if ("Por ajuste de IVA".equals(tipoNd)) {
            BigDecimal importeRefactura = parsearMonto(datosNota.getImporteRefactura());
            if (importeRefactura == null || importeRefactura.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Debe ingresar un importe válido para la Nota de Débito por ajuste de IVA.");
            }
            if (notaDeDebitoRepository.existsByTiporegistroAndTipoNd(tipoRegistro, "Por ajuste de IVA")) {
                throw new IllegalArgumentException("Ya existe una Nota de Débito por ajuste de IVA para este comprobante.");
            }

            // 2. Guardar NotaDeDebito vinculada a Cabecera
            NotaDeDebito nd = new NotaDeDebito();
            nd.setCabecera(cabecera);
            nd.setTipoNd("Por ajuste de IVA");
            nd.setImporterefactura(importeRefactura);
            nd.setUsuario(usuario);
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

            notaDeCreditoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionId(
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

                        nd.setCabecera(cabecera);
                        nd.setPrestacion(prestacion);
                        nd.setNotaDeCreditoPadre(ncPadre);
                        nd.setTipoNd(tipoNd);
                        nd.setMotivorefactura(p.getMotivoRefactura());
                        nd.setImporterefactura(importeRefactura);
                        nd.setComentarios(p.getComentarios());
                        nd.setComentariosDebito(p.getComentariosDebito());
                        nd.setDiasfacturados(diasFacturados);
                        nd.setUsuario(usuario);
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

        String tipoRegistro = obtenerTipoRegistro(origen, request.getLetraOriginal(),
                Integer.valueOf(request.getPtovtaOriginal().toString()),
                Integer.valueOf(request.getNumeroOriginal().toString()));

        // Obtener código y nombre de cobertura del comprobante origen
        Optional<Cabecera> cabeceraOrigenOpt = cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(
                resolverTiposEquivalentes(origen), request.getLetraOriginal(),
                Integer.valueOf(request.getPtovtaOriginal().toString()),
                Integer.valueOf(request.getNumeroOriginal().toString()))
                .stream()
                .findFirst();

        String codigoCobertura = cabeceraOrigenOpt.map(Cabecera::getCodigoCobertura).orElse(null);
        String cobertura = cabeceraOrigenOpt.map(Cabecera::getCobertura).orElse(null);

        // 1. Calcular el Haber en caso de creación manual de Cabecera (NC)
        BigDecimal totalHaberCalculado = null;
        if (!"Por ajuste de IVA".equals(datosNota.getTipoNc()) && registros != null && !registros.isEmpty()) {
            List<Integer> idsPrestaciones = registros.stream().filter(p -> p.getId() != null).map(RegistroAuditoriaDTO::getId).toList();
            Map<Integer, AmbLiquidado> prestacionesMap = ambLiquidadoRepository.findAllById(idsPrestaciones)
                    .stream().collect(Collectors.toMap(AmbLiquidado::getId, p -> p));

            BigDecimal sumaHaber = BigDecimal.ZERO;
            boolean huboPrestacionCalculada = false;

            for (RegistroAuditoriaDTO p : registros) {
                if (p.getId() == null) continue;
                String debitoAceptadoStr = p.getDebitoAceptado() != null ? p.getDebitoAceptado().toString().trim().toUpperCase() : "";
                if ("SI".equals(debitoAceptadoStr) || "NO".equals(debitoAceptadoStr) || "TRUE".equals(debitoAceptadoStr) || "FALSE".equals(debitoAceptadoStr)) {
                    BigDecimal importeDebitado = parsearMonto(p.getImporteDebitado());
                    if (importeDebitado != null && importeDebitado.compareTo(BigDecimal.ZERO) > 0) {
                        AmbLiquidado prest = prestacionesMap.get(p.getId());
                        BigDecimal totalNeto = (prest != null && prest.getTotalNeto() != null) ? prest.getTotalNeto() : BigDecimal.ZERO;
                        BigDecimal iva = (prest != null && prest.getIva() != null) ? prest.getIva() : BigDecimal.ZERO;

                        BigDecimal ivaDebitado = BigDecimal.ZERO;
                        if (totalNeto.compareTo(BigDecimal.ZERO) > 0 && iva.compareTo(BigDecimal.ZERO) > 0) {
                            BigDecimal porcIva = iva.multiply(new BigDecimal("100")).divide(totalNeto, 6, java.math.RoundingMode.HALF_UP);
                            ivaDebitado = importeDebitado.multiply(porcIva).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                        }

                        BigDecimal totalPrestacionConIva = importeDebitado.add(ivaDebitado).setScale(2, java.math.RoundingMode.HALF_UP);
                        sumaHaber = sumaHaber.add(totalPrestacionConIva);
                        huboPrestacionCalculada = true;
                    }
                }
            }
            if (huboPrestacionCalculada) {
                totalHaberCalculado = sumaHaber.setScale(2, java.math.RoundingMode.HALF_UP);
            }
        }

        // 2. Obtener o crear Cabecera
        Cabecera cabecera = resolverOCrearCabecera(datosNota, usuario, origen,
                request.getLetraOriginal(), request.getPtovtaOriginal(), request.getNumeroOriginal(),
                tipoRegistro, codigoCobertura, cobertura, cabeceraOrigenOpt,
                BigDecimal.ZERO,
                totalHaberCalculado != null ? totalHaberCalculado : BigDecimal.ZERO);

        // Manejo especial para NC por Ajuste de IVA No prestacional (por concepto)
        if ("Por ajuste de IVA".equals(datosNota.getTipoNc()) && "No prestacional".equals(datosNota.getSubtipoIva())) {
            BigDecimal neto = parsearMonto(datosNota.getNeto());
            BigDecimal iva = parsearMonto(datosNota.getIva());
            BigDecimal porcIva = parsearMonto(datosNota.getPorcIva());

            if (neto == null || iva == null || porcIva == null) {
                throw new IllegalArgumentException("Debe ingresar el neto, IVA y porcentaje de IVA válidos para la NC por Ajuste de IVA No prestacional.");
            }

            // 2. Guardar exclusivamente en NcAjusteDeIva vinculada a la Cabecera
            NcAjusteDeIva ncIva = new NcAjusteDeIva();
            ncIva.setCabecera(cabecera);
            ncIva.setLetraFc(request.getLetraOriginal());
            ncIva.setPtovtaFc(Integer.valueOf(request.getPtovtaOriginal().toString()));
            ncIva.setTipoFc(origen);
            ncIva.setNumeroFc(Integer.valueOf(request.getNumeroOriginal().toString()));
            ncIva.setNeto(neto);
            ncIva.setIva(iva);
            ncIva.setPorcIva(porcIva);

            ncAjusteDeIvaRepository.save(ncIva);
            return;
        }

        if (registros == null || registros.isEmpty())
            return;

        List<Integer> idsPrestaciones = registros.stream().filter(p -> p.getId() != null).map(RegistroAuditoriaDTO::getId).toList();
        Map<Integer, AmbLiquidado> prestacionesMap = ambLiquidadoRepository.findAllById(idsPrestaciones)
                .stream().collect(Collectors.toMap(AmbLiquidado::getId, p -> p));

        List<NotaDeCredito> notasCreditoAGuardar = new ArrayList<>();

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

                nc.setCabecera(cabecera);
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
                nc.setCargadocompletamente(true);

                notasCreditoAGuardar.add(nc);

            } else if ("ND".equals(origen)) {
                notaDeDebitoRepository.findByCabecera_LetraAndCabecera_PtovtaAndCabecera_NumeroAndPrestacionId(
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

                            nc.setCabecera(cabecera);
                            nc.setPrestacion(prestacion);
                            nc.setNotaDeDebitoPadre(ndPadre);
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
                            nc.setCargadocompletamente(true);

                            notasCreditoAGuardar.add(nc);
                        });
            }
        }

        if (!notasCreditoAGuardar.isEmpty()) {
            notaDeCreditoRepository.saveAll(notasCreditoAGuardar);
        }
    }

    @Transactional
    public void editarNcAjusteDeIva(NuevaNotaCreditoRequest request) {
        if (request == null || request.getDatosNota() == null) return;

        DatosNotaDTO datosNota = request.getDatosNota();
        String letraFc = request.getLetraOriginal();
        Integer ptovtaFc = Integer.valueOf(request.getPtovtaOriginal().toString());
        Integer numeroFc = Integer.valueOf(request.getNumeroOriginal().toString());

        Optional<NcAjusteDeIva> ncIvaOpt = ncAjusteDeIvaRepository.findByLetraFcAndPtovtaFcAndNumeroFc(letraFc, ptovtaFc, numeroFc);
        if (ncIvaOpt.isEmpty()) {
            throw new IllegalArgumentException("No se encontró la Nota de Crédito por Ajuste de IVA asociada a la Factura.");
        }

        NcAjusteDeIva ncIva = ncIvaOpt.get();
        Cabecera cabNc = ncIva.getCabecera();

        Integer nuevoPtovta = Integer.valueOf(datosNota.getPuntoVenta().toString());
        Integer nuevoNumero = Integer.valueOf(datosNota.getNumero().toString());
        String nuevoTipo = datosNota.getTipo();
        String nuevaLetra = datosNota.getLetra();

        // Validar si cambió identificador y si colisiona con otro comprobante
        if (cabNc != null) {
            boolean cambioIdentificador = !nuevoTipo.equalsIgnoreCase(cabNc.getTipo()) ||
                                          !nuevaLetra.equalsIgnoreCase(cabNc.getLetra()) ||
                                          !nuevoPtovta.equals(cabNc.getPtovta()) ||
                                          !nuevoNumero.equals(cabNc.getNumero());

            if (cambioIdentificador && cabeceraRepository.existsByTipoAndLetraAndPtovtaAndNumero(nuevoTipo, nuevaLetra, nuevoPtovta, nuevoNumero)) {
                throw new IllegalArgumentException(
                    String.format("Ya existe otra Nota de Crédito registrada con los datos especificados (%s %s-%04d-%08d).",
                        nuevoTipo, nuevaLetra, nuevoPtovta, nuevoNumero)
                );
            }

            cabNc.setTipo(nuevoTipo);
            cabNc.setLetra(nuevaLetra);
            cabNc.setPtovta(nuevoPtovta);
            cabNc.setNumero(nuevoNumero);

            if (datosNota.getFecha() != null && !datosNota.getFecha().toString().trim().isEmpty()) {
                try {
                    cabNc.setFecha(java.sql.Date.valueOf(datosNota.getFecha().toString()).toLocalDate());
                } catch (Exception ignored) {}
            }
            cabeceraRepository.save(cabNc);
        }

        BigDecimal neto = parsearMonto(datosNota.getNeto());
        BigDecimal iva = parsearMonto(datosNota.getIva());
        BigDecimal porcIva = parsearMonto(datosNota.getPorcIva());

        ncIva.setNeto(neto != null ? neto : BigDecimal.ZERO);
        ncIva.setIva(iva != null ? iva : BigDecimal.ZERO);
        ncIva.setPorcIva(porcIva != null ? porcIva : BigDecimal.ZERO);

        ncAjusteDeIvaRepository.save(ncIva);
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
            LocalDate f = null;
            if (row[4] != null) {
                if (row[4] instanceof java.sql.Date sqlDate) {
                    f = sqlDate.toLocalDate();
                } else if (row[4] instanceof LocalDate localDate) {
                    f = localDate;
                } else {
                    try {
                        f = LocalDate.parse(row[4].toString());
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
        String usuario = request.getUsuario();

        BigDecimal neto = parsearMonto(request.getNeto());
        BigDecimal iva = parsearMonto(request.getIva());
        BigDecimal porcIva = parsearMonto(request.getPorcIva());

        if (neto == null || iva == null || porcIva == null) {
            throw new IllegalArgumentException("Debe ingresar valores de Neto, IVA y Porcentaje de IVA válidos para la Nota de Débito por Ajuste de IVA.");
        }

        LocalDate fechaDoc = (request.getFecha() != null && !request.getFecha().toString().trim().isEmpty())
                ? java.sql.Date.valueOf(request.getFecha().toString().trim()).toLocalDate()
                : LocalDate.now();

        String tipoRegistro = obtenerTipoRegistro("NC", request.getLetraNc(),
                Integer.valueOf(request.getPtovtaNc().toString()),
                Integer.valueOf(request.getNumeroNc().toString()));

        // Obtener código y nombre de cobertura del comprobante origen (NC)
        Optional<Cabecera> cabeceraOrigenOpt = cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(
                resolverTiposEquivalentes("NC"), request.getLetraNc(),
                Integer.valueOf(request.getPtovtaNc().toString()),
                Integer.valueOf(request.getNumeroNc().toString()))
                .stream()
                .findFirst();

        String codigoCobertura = cabeceraOrigenOpt.map(Cabecera::getCodigoCobertura).orElse(null);
        String cobertura = cabeceraOrigenOpt.map(Cabecera::getCobertura).orElse(null);

        // 1. Obtener o crear Cabecera
        DatosNotaDTO mockDatos = new DatosNotaDTO();
        mockDatos.setTipo(tipoNd);
        mockDatos.setLetra(letraNd);
        mockDatos.setPuntoVenta(ptovtaNd);
        mockDatos.setNumero(numeroNd);
        mockDatos.setFecha(request.getFecha());
        mockDatos.setIdCabeceraSeleccionada(request.getIdCabeceraSeleccionada());
        mockDatos.setCreadoManualmente(request.isCreadoManualmente());

        Cabecera cabecera = resolverOCrearCabecera(mockDatos, usuario, "NC",
                request.getLetraNc(), request.getPtovtaNc(), request.getNumeroNc(),
                tipoRegistro, codigoCobertura, cobertura, cabeceraOrigenOpt, null, null);

        // 2. Guardar NdAjusteDeIva vinculada a Cabecera
        NdAjusteDeIva ndIva = new NdAjusteDeIva();
        ndIva.setCabecera(cabecera);
        ndIva.setTipoNc(request.getTipoNc());
        ndIva.setLetraNc(request.getLetraNc());
        ndIva.setPtovtaNc(Integer.valueOf(request.getPtovtaNc().toString()));
        ndIva.setNumeroNc(Integer.valueOf(request.getNumeroNc().toString()));
        ndIva.setNeto(neto);
        ndIva.setIva(iva);
        ndIva.setPorcIva(porcIva);

        ndAjusteDeIvaRepository.save(ndIva);
    }

    public List<CabeceraCandidataDTO> obtenerCabecerasDisponibles(String tipoRequerido, String origen, String letraOriginal, Integer ptovtaOriginal, Integer numeroOriginal) {
        List<String> tipos = resolverTiposEquivalentes(tipoRequerido);
        java.util.Set<Long> grupos = new java.util.HashSet<>();

        if (origen != null && letraOriginal != null && ptovtaOriginal != null && numeroOriginal != null) {
            String letraUpper = letraOriginal.trim().toUpperCase();
            Optional<Cabecera> cabOrigenOpt = cabeceraRepository.findByTipoInAndLetraAndPtovtaAndNumero(
                    resolverTiposEquivalentes(origen), letraUpper, ptovtaOriginal, numeroOriginal
            ).stream().findFirst();

            if (cabOrigenOpt.isEmpty()) {
                cabOrigenOpt = cabeceraRepository.findByLetraAndPtovtaAndNumero(letraUpper, ptovtaOriginal, numeroOriginal);
            }

            if (cabOrigenOpt.isPresent()) {
                Cabecera origenCab = cabOrigenOpt.get();
                if (origenCab.getId() != null) grupos.add(origenCab.getId());
                if (origenCab.getGrupo() != null) grupos.add(origenCab.getGrupo());
                if (origenCab.getAsociadogrupo() != null) grupos.add(origenCab.getAsociadogrupo());
                if (origenCab.getAsociado() != null) grupos.add(origenCab.getAsociado());
            }
        }

        List<Cabecera> candidatos;
        if (!grupos.isEmpty()) {
            candidatos = cabeceraRepository.findCandidatosPorTipoYGrupos(tipos, grupos);
            if (candidatos.isEmpty()) {
                candidatos = cabeceraRepository.findTop50ByTipoInOrderByFechaDescNumeroDesc(tipos);
            }
        } else {
            candidatos = cabeceraRepository.findTop50ByTipoInOrderByFechaDescNumeroDesc(tipos);
        }

        return candidatos.stream()
                .filter(c -> {
                    if (c.getId() == null) return false;
                    String tipoDoc = c.getTipo() != null ? c.getTipo().trim().toUpperCase() : "";
                    boolean esNc = "NC".equals(tipoDoc) || "NCE".equals(tipoDoc) || "NC".equalsIgnoreCase(tipoRequerido);
                    if (esNc) {
                        boolean enNotadecredito = !notaDeCreditoRepository.findByCabecera_Id(c.getId()).isEmpty();
                        boolean enNcIva = ncAjusteDeIvaRepository.findByCabecera_Id(c.getId()).isPresent();
                        return !enNotadecredito && !enNcIva;
                    } else {
                        boolean enNotadedebito = !notaDeDebitoRepository.findByCabecera_Id(c.getId()).isEmpty();
                        boolean enNdIva = ndAjusteDeIvaRepository.findByCabecera_Id(c.getId()).isPresent();
                        return !enNotadedebito && !enNdIva;
                    }
                })
                .map(c -> new CabeceraCandidataDTO(
                        c.getId(),
                        c.getTipo(),
                        c.getLetra(),
                        c.getPtovta(),
                        c.getNumero(),
                        c.getFecha(),
                        c.getDebe(),
                        c.getHaber(),
                        c.getGrupo(),
                        c.getAsociadogrupo(),
                        c.getCobertura(),
                        c.getCodigoCobertura()
                ))
                .toList();
    }

    private Cabecera resolverOCrearCabecera(DatosNotaDTO datosNota, String usuario, String origen,
                                           String letraOriginal, Object ptovtaOriginal, Object numeroOriginal,
                                           String tipoRegistro, String codigoCobertura, String cobertura,
                                           Optional<Cabecera> cabeceraOrigenOpt,
                                           BigDecimal debeCalculado, BigDecimal haberCalculado) {
        Integer puntoVenta = datosNota.getPuntoVenta() != null ? Integer.valueOf(datosNota.getPuntoVenta().toString()) : 0;
        Integer numero = datosNota.getNumero() != null ? Integer.valueOf(datosNota.getNumero().toString()) : 0;
        String tipoDoc = datosNota.getTipo();
        String letraDoc = datosNota.getLetra();
        LocalDate fechaDoc = (datosNota.getFecha() != null && !datosNota.getFecha().toString().trim().isEmpty())
                ? java.sql.Date.valueOf(datosNota.getFecha().toString().trim()).toLocalDate()
                : LocalDate.now();

        Cabecera cabecera = null;
        if (datosNota.getIdCabeceraSeleccionada() != null) {
            cabecera = cabeceraRepository.findById(datosNota.getIdCabeceraSeleccionada()).orElse(null);
        }
        if (cabecera == null && tipoDoc != null && letraDoc != null && puntoVenta > 0 && numero > 0) {
            cabecera = cabeceraRepository.findByTipoAndLetraAndPtovtaAndNumero(tipoDoc, letraDoc, puntoVenta, numero).orElse(null);
        }

        if (cabecera == null) {
            // Se crea una nueva Cabecera marcada como ingresada manualmente con debe/haber calculado
            cabecera = new Cabecera(tipoDoc, letraDoc, puntoVenta, numero, fechaDoc, null, tipoRegistro, codigoCobertura, cobertura);
            cabecera.setOrigen("APP_MANUAL");
            cabecera.setDebe(debeCalculado != null ? debeCalculado : BigDecimal.ZERO);
            cabecera.setHaber(haberCalculado != null ? haberCalculado : BigDecimal.ZERO);
            if (cabeceraOrigenOpt.isPresent()) {
                Cabecera origenCab = cabeceraOrigenOpt.get();
                cabecera.setAsociado(origenCab.getId());
                cabecera.setGrupo(origenCab.getGrupo());
                cabecera.setAsociadogrupo(origenCab.getAsociadogrupo() != null ? origenCab.getAsociadogrupo() : origenCab.getGrupo());
            }
            cabecera = cabeceraRepository.save(cabecera);

            // Registrar evento de telemetría/auditoría para notificar al Admin
            registrarEventoCreacionManual(usuario, origen, letraOriginal, ptovtaOriginal, numeroOriginal, tipoDoc, letraDoc, puntoVenta, numero);
        } else {
            // Si la cabecera ya existía en la base de datos:
            boolean modificado = false;
            if ("APP_MANUAL".equals(cabecera.getOrigen())) {
                if ((cabecera.getDebe() == null || cabecera.getDebe().compareTo(BigDecimal.ZERO) == 0) && debeCalculado != null) {
                    cabecera.setDebe(debeCalculado);
                    modificado = true;
                }
                if ((cabecera.getHaber() == null || cabecera.getHaber().compareTo(BigDecimal.ZERO) == 0) && haberCalculado != null) {
                    cabecera.setHaber(haberCalculado);
                    modificado = true;
                }
            }
            if (cabeceraOrigenOpt.isPresent()) {
                Cabecera origenCab = cabeceraOrigenOpt.get();
                if (cabecera.getAsociado() == null) {
                    cabecera.setAsociado(origenCab.getId());
                    modificado = true;
                }
                if (cabecera.getGrupo() == null && origenCab.getGrupo() != null) {
                    cabecera.setGrupo(origenCab.getGrupo());
                    modificado = true;
                }
                if (cabecera.getAsociadogrupo() == null && origenCab.getAsociadogrupo() != null) {
                    cabecera.setAsociadogrupo(origenCab.getAsociadogrupo());
                    modificado = true;
                }
                if (cabecera.getCodigoCobertura() == null && codigoCobertura != null) {
                    cabecera.setCodigoCobertura(codigoCobertura);
                    cabecera.setCobertura(cobertura);
                    modificado = true;
                }
            }
            if (modificado) {
                cabecera = cabeceraRepository.save(cabecera);
            }
        }

        return cabecera;
    }

    private void registrarEventoCreacionManual(String usuario, String origen, String letraOriginal, Object ptovtaOriginal, Object numeroOriginal,
                                              String tipoDoc, String letraDoc, Integer puntoVenta, Integer numero) {
        try {
            RegistroUsabilidad ru = new RegistroUsabilidad();
            ru.setUsuario(usuario != null ? usuario : "Sistema");
            ru.setFechaHora(ZonedDateTime.now());
            ru.setDocumentoReferencia(String.format("%s %s-%04d-%08d", tipoDoc, letraDoc, puntoVenta != null ? puntoVenta : 0, numero != null ? numero : 0));
            ru.setEvento("COMPROBANTE_CREADO_MANUALMENTE_FALTANTE_EN_CABECERA");
            ru.setCantidadRegistrosPendientes(0);
            registroUsabilidadRepository.save(ru);
        } catch (Exception ignored) {}
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