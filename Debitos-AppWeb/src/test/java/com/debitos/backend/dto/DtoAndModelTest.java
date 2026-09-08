package com.debitos.backend.dto;

import com.debitos.backend.model.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DtoAndModelTest {

    @Test
    @DisplayName("Test Usuario Model")
    void testUsuarioModel() {
        Usuario u = new Usuario();
        u.setId(1L);
        u.setUsuario("admin");
        u.setClave("pass123");
        u.setRol("ADMIN");

        assertEquals(1L, u.getId());
        assertEquals("admin", u.getUsuario());
        assertEquals("pass123", u.getClave());
        assertEquals("ADMIN", u.getRol());
    }

    @Test
    @DisplayName("Test Cabecera Model")
    void testCabeceraModel() {
        LocalDate fecha = LocalDate.of(2026, 1, 1);
        LocalDate periodo = LocalDate.of(2026, 1, 1);
        Cabecera c = new Cabecera("FC", "A", 1, 1000, fecha, periodo, "AUDITADA", "OSDE", "OSDE BINARIO");
        c.setId(10L);
        c.setDebe(new BigDecimal("100.00"));
        c.setHaber(new BigDecimal("50.00"));
        c.setGrupo(10L);
        c.setAsociado(10L);
        c.setAsociadogrupo(10L);
        c.setIdEstado(1);
        c.setOrigen("APP_MANUAL");
        c.setPeriodo(periodo);

        assertEquals(10L, c.getId());
        assertEquals("FC", c.getTipo());
        assertEquals("A", c.getLetra());
        assertEquals(1, c.getPtovta());
        assertEquals(1000, c.getNumero());
        assertEquals(fecha, c.getFecha());
        assertEquals(periodo, c.getPeriodo());
        assertEquals("AUDITADA", c.getTiporegistro());
        assertEquals("OSDE", c.getCodigoCobertura());
        assertEquals("OSDE BINARIO", c.getCobertura());
        assertEquals(new BigDecimal("100.00"), c.getDebe());
        assertEquals(new BigDecimal("50.00"), c.getHaber());
        assertEquals(10L, c.getGrupo());
        assertEquals(10L, c.getAsociado());
        assertEquals(10L, c.getAsociadogrupo());
        assertEquals(1, c.getIdEstado());
        assertEquals("APP_MANUAL", c.getOrigen());

        Cabecera c2 = new Cabecera("FC", "A", 1, 1000, fecha, periodo, "AUDITADA", "OSDE");
        assertNotNull(c2);
    }

    @Test
    @DisplayName("Test AmbLiquidado Model")
    void testAmbLiquidadoModel() {
        AmbLiquidado a = new AmbLiquidado();
        a.setId(100);
        a.setCodigo("420101");
        a.setDescripcion("Consulta médica");
        a.setTotalNeto(new BigDecimal("500.00"));
        a.setIva(new BigDecimal("105.00"));
        a.setCarnet("123456");
        a.setPaciente("Juan Perez");
        a.setPlan("Plata");
        a.setEfector("Clinica Central");
        a.setMedico("Dr. Garcia");
        a.setFecha(LocalDate.now());
        a.setModulo("MOD1");
        a.setGrupomodulo("GMOD1");
        a.setCantidad(2);
        a.setCoseguro(new BigDecimal("50.00"));
        a.setTotal(new BigDecimal("655.00"));
        a.setCabecera(new Cabecera());

        assertEquals(100, a.getId());
        assertEquals("420101", a.getCodigo());
        assertEquals("Consulta médica", a.getDescripcion());
        assertEquals(new BigDecimal("500.00"), a.getTotalNeto());
        assertEquals(new BigDecimal("105.00"), a.getIva());
        assertEquals("123456", a.getCarnet());
        assertEquals("Juan Perez", a.getPaciente());
        assertEquals("Plata", a.getPlan());
        assertEquals("Clinica Central", a.getEfector());
        assertEquals("Dr. Garcia", a.getMedico());
        assertNotNull(a.getFecha());
        assertEquals("MOD1", a.getModulo());
        assertEquals("GMOD1", a.getGrupomodulo());
        assertEquals(2, a.getCantidad());
        assertEquals(new BigDecimal("50.00"), a.getCoseguro());
        assertEquals(new BigDecimal("655.00"), a.getTotal());
        assertNotNull(a.getCabecera());
    }

    @Test
    @DisplayName("Test NotaDeCredito Model")
    void testNotaDeCreditoModel() {
        NotaDeCredito nc = new NotaDeCredito();
        nc.setId(1);
        nc.setCabecera(new Cabecera());
        nc.setPrestacion(new AmbLiquidado());
        nc.setNotaDeDebitoPadre(new NotaDeDebito());
        nc.setDebitoaceptado(true);
        nc.setMotivoDebito("Falta firma");
        nc.setImporteDebitado(new BigDecimal("100.00"));
        nc.setMotivoderefactura("Aceptado");
        nc.setImportederefactura(new BigDecimal("80.00"));
        nc.setComentarios("Nota interna");
        nc.setDiasfacturados(3);
        nc.setPrestacionenglobante("P1");
        nc.setUsuario("auditor");
        nc.setCargadocompletamente(true);
        nc.setComentariosDebito("Comentario debito");

        assertEquals(1, nc.getId());
        assertNotNull(nc.getCabecera());
        assertNotNull(nc.getPrestacion());
        assertNotNull(nc.getNotaDeDebitoPadre());
        assertTrue(nc.getDebitoaceptado());
        assertEquals("Falta firma", nc.getMotivoDebito());
        assertEquals(new BigDecimal("100.00"), nc.getImporteDebitado());
        assertEquals("Aceptado", nc.getMotivoderefactura());
        assertEquals(new BigDecimal("80.00"), nc.getImportederefactura());
        assertEquals("Nota interna", nc.getComentarios());
        assertEquals(3, nc.getDiasfacturados());
        assertEquals("P1", nc.getPrestacionenglobante());
        assertEquals("auditor", nc.getUsuario());
        assertTrue(nc.getCargadocompletamente());
        assertEquals("Comentario debito", nc.getComentariosDebito());
    }

    @Test
    @DisplayName("Test NotaDeDebito Model")
    void testNotaDeDebitoModel() {
        NotaDeDebito nd = new NotaDeDebito();
        nd.setId(2);
        nd.setCabecera(new Cabecera());
        nd.setPrestacion(new AmbLiquidado());
        nd.setNotaDeCreditoPadre(new NotaDeCredito());
        nd.setTipoNd("Por Refactura");
        nd.setMotivorefactura("Refactura aprobada");
        nd.setImporterefactura(new BigDecimal("200.00"));
        nd.setComentarios("Comentario ND");
        nd.setComentariosDebito("Comentario deb ND");
        nd.setDiasfacturados(4);
        nd.setUsuario("auditor2");
        nd.setCodigo("420101");
        nd.setCargadocompletamente(true);
        nd.setCargarcompletamente(true);

        assertEquals(2, nd.getId());
        assertNotNull(nd.getCabecera());
        assertNotNull(nd.getPrestacion());
        assertNotNull(nd.getNotaDeCreditoPadre());
        assertEquals("Por Refactura", nd.getTipoNd());
        assertEquals("Refactura aprobada", nd.getMotivorefactura());
        assertEquals(new BigDecimal("200.00"), nd.getImporterefactura());
        assertEquals("Comentario ND", nd.getComentarios());
        assertEquals("Comentario deb ND", nd.getComentariosDebito());
        assertEquals(4, nd.getDiasfacturados());
        assertEquals("auditor2", nd.getUsuario());
        assertEquals("420101", nd.getCodigo());
        assertTrue(nd.getCargadocompletamente());
        assertTrue(nd.getCargarcompletamente());
    }

    @Test
    @DisplayName("Test NcAjusteDeIva y NdAjusteDeIva Models")
    void testAjusteDeIvaModels() {
        NcAjusteDeIva ncIva = new NcAjusteDeIva();
        ncIva.setId(10);
        ncIva.setCabecera(new Cabecera());
        ncIva.setTipoFc("FC");
        ncIva.setLetraFc("A");
        ncIva.setPtovtaFc(1);
        ncIva.setNumeroFc(1000);
        ncIva.setNeto(new BigDecimal("1000.00"));
        ncIva.setPorcIva(new BigDecimal("21.00"));
        ncIva.setIva(new BigDecimal("210.00"));
        ncIva.setFechaRegistro(ZonedDateTime.now());

        assertEquals(10, ncIva.getId());
        assertNotNull(ncIva.getCabecera());
        assertEquals("FC", ncIva.getTipoFc());
        assertEquals("A", ncIva.getLetraFc());
        assertEquals(1, ncIva.getPtovtaFc());
        assertEquals(1000, ncIva.getNumeroFc());
        assertEquals(new BigDecimal("1000.00"), ncIva.getNeto());
        assertEquals(new BigDecimal("21.00"), ncIva.getPorcIva());
        assertEquals(new BigDecimal("210.00"), ncIva.getIva());
        assertNotNull(ncIva.getFechaRegistro());

        NdAjusteDeIva ndIva = new NdAjusteDeIva();
        ndIva.setId(20);
        ndIva.setCabecera(new Cabecera());
        ndIva.setTipoNc("NC");
        ndIva.setLetraNc("A");
        ndIva.setPtovtaNc(1);
        ndIva.setNumeroNc(2000);
        ndIva.setNeto(new BigDecimal("1000.00"));
        ndIva.setPorcIva(new BigDecimal("21.00"));
        ndIva.setIva(new BigDecimal("210.00"));
        ndIva.setFechaRegistro(LocalDateTime.now());
        ndIva.prePersist();

        assertEquals(20, ndIva.getId());
        assertNotNull(ndIva.getCabecera());
        assertEquals("NC", ndIva.getTipoNc());
        assertEquals("A", ndIva.getLetraNc());
        assertEquals(1, ndIva.getPtovtaNc());
        assertEquals(2000, ndIva.getNumeroNc());
        assertEquals(new BigDecimal("1000.00"), ndIva.getNeto());
        assertEquals(new BigDecimal("21.00"), ndIva.getPorcIva());
        assertEquals(new BigDecimal("210.00"), ndIva.getIva());
        assertNotNull(ndIva.getFechaRegistro());
    }

    @Test
    @DisplayName("Test Notificacion Model y NotificacionDTO")
    void testNotificacionModelAndDTO() {
        ZonedDateTime now = ZonedDateTime.now();
        Notificacion n = new Notificacion("ALERTA", "Titulo alerta", "Mensaje test", "ADMIN", "admin", "FC", "A", 1, 1000);
        n.setId(1L);
        n.setLeida(false);
        n.setRolDestino("ADMIN");
        n.setUsuarioOrigen("admin");
        n.setTipoDoc("FC");
        n.setLetraDoc("A");
        n.setPtoVta(1);
        n.setNumero(1000);
        n.setFechaCreacion(now);
        n.setFechaLectura(now);

        assertEquals(1L, n.getId());
        assertEquals("admin", n.getUsuarioOrigen());
        assertEquals("ALERTA", n.getTipoNotificacion());
        assertEquals("Titulo alerta", n.getTitulo());
        assertEquals("Mensaje test", n.getMensaje());
        assertEquals("ADMIN", n.getRolDestino());
        assertEquals("FC", n.getTipoDoc());
        assertEquals("A", n.getLetraDoc());
        assertEquals(1, n.getPtoVta());
        assertEquals(1000, n.getNumero());
        assertEquals(now, n.getFechaCreacion());
        assertEquals(now, n.getFechaLectura());
        assertFalse(n.getLeida());

        NotificacionDTO dto = new NotificacionDTO(1L, "ALERTA", "Titulo", "Mensaje test", "admin", now, "FC A-0001-00001000", "FC", "A", 1, 1000, "EVENTO", false);
        dto.setId(2L);
        dto.setUsuario("user");
        dto.setTipoNotificacion("INFO");
        dto.setTitulo("Nuevo titulo");
        dto.setMensaje("Nuevo mensaje");
        dto.setDocumentoReferencia("ND A-0001-00003000");
        dto.setTipoDoc("ND");
        dto.setLetra("A");
        dto.setPuntoVenta(1);
        dto.setNumero(3000);
        dto.setEvento("EVENTO2");
        dto.setFechaHora(now);
        dto.setLeida(true);

        assertEquals(2L, dto.getId());
        assertEquals("user", dto.getUsuario());
        assertEquals("INFO", dto.getTipoNotificacion());
        assertEquals("Nuevo titulo", dto.getTitulo());
        assertEquals("Nuevo mensaje", dto.getMensaje());
        assertEquals("ND A-0001-00003000", dto.getDocumentoReferencia());
        assertEquals("ND", dto.getTipoDoc());
        assertEquals("A", dto.getLetra());
        assertEquals(1, dto.getPuntoVenta());
        assertEquals(3000, dto.getNumero());
        assertEquals("EVENTO2", dto.getEvento());
        assertEquals(now, dto.getFechaHora());
        assertTrue(dto.getLeida());
    }

    @Test
    @DisplayName("Test DTOs: ApiErrorResponse, CabeceraCandidataDTO, FilaHistorialDTO, etc.")
    void testVariousDTOs() {
        ApiErrorResponse err = new ApiErrorResponse(404, "Elemento no encontrado", "/api/auditoria", List.of("Detalle error"));
        err.setStatus(400);
        err.setMessage("Datos inválidos");
        err.setPath("/api/test");
        err.setTimestamp(LocalDateTime.now());
        err.setErrors(List.of("Error 1", "Error 2"));

        assertEquals(400, err.getStatus());
        assertEquals("Datos inválidos", err.getMessage());
        assertEquals("/api/test", err.getPath());
        assertNotNull(err.getTimestamp());
        assertEquals(2, err.getErrors().size());

        ApiErrorResponse err2 = new ApiErrorResponse(500, "Error servidor", "/api/error");
        assertEquals(500, err2.getStatus());

        CabeceraCandidataDTO cand = new CabeceraCandidataDTO(1L, "FC", "A", 1, 1000, LocalDate.now(), BigDecimal.TEN, BigDecimal.ZERO, 5L, 5L, "OSDE", "001");
        cand.setId(2L);
        cand.setTipo("NC");
        cand.setLetra("B");
        cand.setPtovta(2);
        cand.setNumero(2000);
        cand.setFecha(LocalDate.now());
        cand.setDebe(BigDecimal.ZERO);
        cand.setHaber(BigDecimal.TEN);
        cand.setGrupo(6L);
        cand.setAsociadogrupo(6L);
        cand.setCobertura("SWISS");
        cand.setCodigoCobertura("002");

        assertEquals(2L, cand.getId());
        assertEquals("NC", cand.getTipo());
        assertEquals("B", cand.getLetra());
        assertEquals(2, cand.getPtovta());
        assertEquals(2000, cand.getNumero());
        assertEquals(BigDecimal.ZERO, cand.getDebe());
        assertEquals(BigDecimal.TEN, cand.getHaber());
        assertEquals(6L, cand.getGrupo());
        assertEquals(6L, cand.getAsociadogrupo());
        assertEquals("SWISS", cand.getCobertura());
        assertEquals("002", cand.getCodigoCobertura());
        assertEquals("NC B-0002-00002000", cand.getLabel());

        FilaHistorialDTO fh = new FilaHistorialDTO("FC", "A", 1, 1000, "2026-01", new BigDecimal("1000.00"));
        fh.setTipoDocumento("NC");
        fh.setNivel(1);
        fh.setOrigenTipo("IVA");
        fh.setPorcentajeIva(new BigDecimal("21.00"));
        fh.setMontoIva(new BigDecimal("210.00"));
        fh.setTienePrestaciones(true);
        fh.setPlaceholderNdAjusteIva(true);
        fh.setIdGrupo(50L);
        fh.setIdEstado(1);

        assertEquals("NC", fh.getTipoDocumento());
        assertEquals(1, fh.getNivel());
        assertEquals("IVA", fh.getOrigenTipo());
        assertEquals(new BigDecimal("21.00"), fh.getPorcentajeIva());
        assertEquals(new BigDecimal("210.00"), fh.getMontoIva());
        assertTrue(fh.isTienePrestaciones());
        assertTrue(fh.isPlaceholderNdAjusteIva());
        assertEquals(50L, fh.getIdGrupo());
        assertEquals(1, fh.getIdEstado());

        FilaAjusteIvaResumenDTO fa = new FilaAjusteIvaResumenDTO("FC", "A", 1, 1000, "2026-01", new BigDecimal("1000.00"), new BigDecimal("21.00"), new BigDecimal("210.00"));
        fa.setTipoDocumento("NC");
        fa.setLetra("A");
        fa.setPuntoVenta(1);
        fa.setNumero(2000);
        fa.setFechaDocumento("2026-02-01");
        fa.setMontoNeto(new BigDecimal("500.00"));
        fa.setPorcentajeIva(new BigDecimal("21.00"));
        fa.setMontoIva(new BigDecimal("105.00"));

        assertEquals("NC", fa.getTipoDocumento());
        assertEquals("A", fa.getLetra());
        assertEquals(1, fa.getPuntoVenta());
        assertEquals(2000, fa.getNumero());
        assertEquals("2026-02-01", fa.getFechaDocumento());
        assertEquals(new BigDecimal("500.00"), fa.getMontoNeto());
        assertEquals(new BigDecimal("21.00"), fa.getPorcentajeIva());
        assertEquals(new BigDecimal("105.00"), fa.getMontoIva());
    }

    @Test
    @DisplayName("Test DocumentoAsociadoDTO")
    void testDocumentoAsociadoDTO() {
        LocalDate fecha = LocalDate.of(2026, 1, 1);
        DocumentoAsociadoDTO d1 = new DocumentoAsociadoDTO("ND", "A", 1, 3000, fecha, "Por Refactura");
        assertEquals("ND", d1.getTipo());
        assertEquals("A", d1.getLetra());
        assertEquals(1, d1.getPtovta());
        assertEquals(3000, d1.getNumero());
        assertEquals(fecha, d1.getFecha());
        assertEquals("Por Refactura", d1.getTipoNd());

        DocumentoAsociadoDTO d2 = new DocumentoAsociadoDTO("FC", "B", 2, 2000, fecha);
        d2.setTipo("NC");
        d2.setLetra("C");
        d2.setPtovta(3);
        d2.setNumero(4000);
        d2.setFecha(fecha.plusDays(1));
        d2.setTipoNd("Ajuste");

        assertEquals("NC", d2.getTipo());
        assertEquals("C", d2.getLetra());
        assertEquals(3, d2.getPtovta());
        assertEquals(4000, d2.getNumero());
        assertEquals(fecha.plusDays(1), d2.getFecha());
        assertEquals("Ajuste", d2.getTipoNd());
    }

    @Test
    @DisplayName("Test ResultadoBusquedaDTO")
    void testResultadoBusquedaDTO() {
        ResultadoBusquedaDTO r1 = new ResultadoBusquedaDTO("ESTANDAR", List.of(), List.of());
        assertEquals("ESTANDAR", r1.getTipoVista());
        assertNotNull(r1.getPrestaciones());
        assertNotNull(r1.getResumenAjusteIva());

        ResultadoBusquedaDTO r2 = new ResultadoBusquedaDTO("ESTANDAR", List.of(), List.of(), List.of(), new DocumentoAsociadoDTO(), List.of());
        assertNotNull(r2.getDocumentosCreadosInfo());
        assertNotNull(r2.getDocumentoCreadoInfo());
        assertNotNull(r2.getHistorialComprobantes());

        r2.setDocumentosCreadosInfo(List.of());
        r2.setDocumentoCreadoInfo(new DocumentoAsociadoDTO());
        r2.setHistorialComprobantes(List.of());
        r2.setTipoVista("CUSTOM");
        r2.setPrestaciones(List.of());
        r2.setResumenAjusteIva(List.of());

        assertEquals("CUSTOM", r2.getTipoVista());
    }

    @Test
    @DisplayName("Test CambioEstadoResponse, LoginResponse, CambiarClaveRequest")
    void testAuthAndEstadoDTOs() {
        CambioEstadoResponse c = new CambioEstadoResponse(true, "Alerta", false);
        assertTrue(c.isRequiereConfirmacion());
        assertEquals("Alerta", c.getMensajeAlerta());
        assertFalse(c.isExito());

        c.setRequiereConfirmacion(false);
        c.setMensajeAlerta(null);
        c.setExito(true);
        assertFalse(c.isRequiereConfirmacion());
        assertTrue(c.isExito());

        LoginResponse lr = new LoginResponse("tok123", "admin", "ADMIN");
        lr.setToken("tok456");
        lr.setUsuario("user");
        lr.setRol("OPERADOR");
        assertEquals("tok456", lr.getToken());
        assertEquals("user", lr.getUsuario());
        assertEquals("OPERADOR", lr.getRol());

        LoginRequest req = new LoginRequest();
        req.setUsuario("admin");
        req.setPassword("pass");
        assertEquals("admin", req.getUsuario());
        assertEquals("pass", req.getPassword());

        CambiarClaveRequest cr = new CambiarClaveRequest("admin", "nueva123");
        cr.setUsuario("user2");
        cr.setNuevaClave("clave999");
        assertEquals("user2", cr.getUsuario());
        assertEquals("clave999", cr.getNuevaClave());
    }

    @Test
    @DisplayName("Test DatosNotaDTO y RegistroAuditoriaDTO")
    void testDatosNotaAndRegistroAuditoria() {
        DatosNotaDTO dn = new DatosNotaDTO();
        dn.setPuntoVenta(1);
        dn.setNumero(100);
        dn.setFecha("2026-01-01");
        dn.setTipo("FC");
        dn.setLetra("A");
        dn.setTipoNd("Por Refactura");
        dn.setImporteRefactura(new BigDecimal("500.00"));
        dn.setTipoNc("Refactura");
        dn.setSubtipoIva("No prestacional");
        dn.setNeto(new BigDecimal("1000.00"));
        dn.setIva(new BigDecimal("210.00"));
        dn.setPorcIva(new BigDecimal("21.00"));
        dn.setNetoNc(new BigDecimal("1000.00"));
        dn.setIvaNc(new BigDecimal("210.00"));
        dn.setIdCabeceraSeleccionada(55L);
        dn.setCreadoManualmente(true);

        assertEquals(1, dn.getPuntoVenta());
        assertEquals(100, dn.getNumero());
        assertEquals("2026-01-01", dn.getFecha());
        assertEquals("FC", dn.getTipo());
        assertEquals("A", dn.getLetra());
        assertEquals("Por Refactura", dn.getTipoNd());
        assertEquals(new BigDecimal("500.00"), dn.getImporteRefactura());
        assertEquals("Refactura", dn.getTipoNc());
        assertEquals("No prestacional", dn.getSubtipoIva());
        assertEquals(new BigDecimal("1000.00"), dn.getNeto());
        assertEquals(new BigDecimal("210.00"), dn.getIva());
        assertEquals(new BigDecimal("21.00"), dn.getPorcIva());
        assertEquals(new BigDecimal("1000.00"), dn.getNetoNc());
        assertEquals(new BigDecimal("210.00"), dn.getIvaNc());
        assertEquals(55L, dn.getIdCabeceraSeleccionada());
        assertTrue(dn.isCreadoManualmente());

        RegistroAuditoriaDTO ra = new RegistroAuditoriaDTO();
        ra.setId(1);
        ra.setCodigo("420101");
        ra.setMotivoDebito("Falta firma");
        ra.setImporteDebitado(new BigDecimal("100.00"));
        ra.setDebitoAceptado("SI");
        ra.setMotivoRefactura("Reclamado");
        ra.setImporteRefactura(new BigDecimal("80.00"));
        ra.setComentarios("Nota");
        ra.setComentariosDebito("Nota deb");
        ra.setDiasFacturados(3);
        ra.setPrestacionEnglobante("P1");

        assertEquals(1, ra.getId());
        assertEquals("420101", ra.getCodigo());
        assertEquals("Falta firma", ra.getMotivoDebito());
        assertEquals(new BigDecimal("100.00"), ra.getImporteDebitado());
        assertEquals("SI", ra.getDebitoAceptado());
        assertEquals("Reclamado", ra.getMotivoRefactura());
        assertEquals(new BigDecimal("80.00"), ra.getImporteRefactura());
        assertEquals("Nota", ra.getComentarios());
        assertEquals("Nota deb", ra.getComentariosDebito());
        assertEquals(3, ra.getDiasFacturados());
        assertEquals("P1", ra.getPrestacionEnglobante());
    }

    @Test
    @DisplayName("Test RegistroUsabilidad Model")
    void testRegistroUsabilidadModel() {
        ZonedDateTime now = ZonedDateTime.now();
        RegistroUsabilidad ru = new RegistroUsabilidad();
        ru.setId(1L);
        ru.setUsuario("admin");
        ru.setFechaHora(now);
        ru.setDocumentoReferencia("FC A-0001-00001000");
        ru.setEvento("LOGIN");
        ru.setCantidadRegistrosPendientes(5);

        assertEquals(1L, ru.getId());
        assertEquals("admin", ru.getUsuario());
        assertEquals(now, ru.getFechaHora());
        assertEquals("FC A-0001-00001000", ru.getDocumentoReferencia());
        assertEquals("LOGIN", ru.getEvento());
        assertEquals(5, ru.getCantidadRegistrosPendientes());
    }
}
