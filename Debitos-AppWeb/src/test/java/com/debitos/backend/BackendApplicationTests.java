package com.debitos.backend;

import com.debitos.backend.dto.contable.CambiarAnulacionRequest;
import com.debitos.backend.dto.contable.CoberturaAliasDTO;
import com.debitos.backend.model.Cabecera;
import com.debitos.backend.repository.CabeceraRepository;
import com.debitos.backend.repository.CoberturaAliasRepository;
import com.debitos.backend.service.GestionContableService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private CoberturaAliasRepository coberturaAliasRepository;

    @Autowired
    private CabeceraRepository cabeceraRepository;

    @Autowired
    private GestionContableService gestionContableService;

    @Autowired
    private com.debitos.backend.repository.FacturaPeriodoCorregidoRepository facturaPeriodoCorregidoRepository;

    @Autowired
    private com.debitos.backend.repository.HistorialAjustesContabilidadRepository historialRepository;

    @Test
    void contextLoads() {
    }

    @Test
    void testPagingCoberturas() {
        Page<CoberturaAliasDTO> page = gestionContableService.buscarCoberturasPaginadas(null, PageRequest.of(0, 20));
        assertNotNull(page);

        Page<CoberturaAliasDTO> pageFiltro = gestionContableService.buscarCoberturasPaginadas("OSDE", PageRequest.of(0, 20));
        assertNotNull(pageFiltro);
    }

    @Test
    void testCambiarEstadoAnulacionManualLifecycle() {
        Cabecera origen = new Cabecera();
        origen.setTipo("FAC");
        origen.setLetra("A");
        origen.setPtovta(31);
        origen.setNumero(8983);
        origen.setFecha(LocalDate.now());
        origen.setAsociadogrupo(220587L);
        origen.setComprobante("FAC A 31-8983");
        origen = cabeceraRepository.save(origen);

        Cabecera anulador = new Cabecera();
        anulador.setTipo("NC");
        anulador.setLetra("A");
        anulador.setPtovta(31);
        anulador.setNumero(1775);
        anulador.setFecha(LocalDate.now());
        anulador.setAsociadogrupo(220587L);
        anulador.setComprobante("NC A 31-1775");
        anulador = cabeceraRepository.save(anulador);

        // 1. Anular por primera vez (Creación / INSERT)
        CambiarAnulacionRequest reqAnular = new CambiarAnulacionRequest();
        reqAnular.setIdCabecera(origen.getId());
        reqAnular.setAnulada(true);
        reqAnular.setIdCabeceraAnulador(anulador.getId());
        reqAnular.setComprobanteAnulador(anulador.getComprobante());

        var dto1 = gestionContableService.cambiarEstadoAnulacionManual(reqAnular, "testUser");
        assertNotNull(dto1);
        org.junit.jupiter.api.Assertions.assertTrue(dto1.isAnulada());
        org.junit.jupiter.api.Assertions.assertEquals(anulador.getId(), dto1.getIdCabeceraAnulador());

        // 2. Desanular (Reactivar / UPDATE)
        CambiarAnulacionRequest reqReactivar = new CambiarAnulacionRequest();
        reqReactivar.setIdCabecera(origen.getId());
        reqReactivar.setAnulada(false);

        var dto2 = gestionContableService.cambiarEstadoAnulacionManual(reqReactivar, "testUser");
        assertNotNull(dto2);
        org.junit.jupiter.api.Assertions.assertFalse(dto2.isAnulada());
        org.junit.jupiter.api.Assertions.assertNull(dto2.getIdCabeceraAnulador());

        // 3. Volver a anular (UPDATE)
        var dto3 = gestionContableService.cambiarEstadoAnulacionManual(reqAnular, "testUser");
        assertNotNull(dto3);
        org.junit.jupiter.api.Assertions.assertTrue(dto3.isAnulada());
        org.junit.jupiter.api.Assertions.assertEquals(anulador.getId(), dto3.getIdCabeceraAnulador());
    }

    @Test
    void testCorregirPeriodoFactura() {
        Cabecera cab = new Cabecera();
        cab.setTipo("FAC");
        cab.setLetra("A");
        cab.setPtovta(31);
        cab.setNumero(9999);
        cab.setFecha(LocalDate.of(2026, 1, 15));
        cab.setPeriodo(LocalDate.of(2026, 1, 1));
        cab.setComprobante("FAC A 31-9999");
        cab = cabeceraRepository.save(cab);

        com.debitos.backend.dto.contable.CorregirPeriodoRequest req = new com.debitos.backend.dto.contable.CorregirPeriodoRequest();
        req.setIdCabecera(cab.getId());
        req.setPeriodoCorregido("2026-02-01");

        var dto = gestionContableService.guardarPeriodoCorregido(req, "testUser");
        assertNotNull(dto);
        org.junit.jupiter.api.Assertions.assertEquals(LocalDate.of(2026, 2, 1), dto.getPeriodoCorregido());

        // Verificación de persistencia real (consulta independiente a la respuesta del servicio)
        var persistido = facturaPeriodoCorregidoRepository.findByIdCabecera(cab.getId());
        org.junit.jupiter.api.Assertions.assertTrue(persistido.isPresent(),
                "El período corregido debe quedar almacenado en facturas_periodos_corregidos");
        org.junit.jupiter.api.Assertions.assertEquals(LocalDate.of(2026, 2, 1), persistido.get().getPeriodoCorregido());
        org.junit.jupiter.api.Assertions.assertEquals(LocalDate.of(2026, 1, 1), persistido.get().getPeriodoOriginal());

        final Long idCab = cab.getId();
        boolean historialRegistrado = historialRepository.findAll().stream()
                .anyMatch(h -> h.getReferencia() != null && h.getReferencia().contains("(ID: " + idCab + ")")
                        && "2026-02-01".equals(h.getValorNuevo()));
        org.junit.jupiter.api.Assertions.assertTrue(historialRegistrado,
                "La corrección de período debe registrarse en historial_ajustes_contabilidad");

        // Segunda corrección sobre la misma factura (UPDATE)
        req.setPeriodoCorregido("2026-04-01");
        var dto2 = gestionContableService.guardarPeriodoCorregido(req, "testUser");
        assertNotNull(dto2);
        org.junit.jupiter.api.Assertions.assertEquals(LocalDate.of(2026, 4, 1),
                facturaPeriodoCorregidoRepository.findByIdCabecera(cab.getId()).orElseThrow().getPeriodoCorregido());
    }
}


