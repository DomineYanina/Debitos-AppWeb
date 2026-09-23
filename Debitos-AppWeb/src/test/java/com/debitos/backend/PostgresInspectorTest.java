package com.debitos.backend;

import com.debitos.backend.model.Cabecera;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

public class PostgresInspectorTest {

    @Test
    void testReciboAsignaPeriodoSegunFechaEnConstructor() {
        LocalDate fecha = LocalDate.of(2026, 5, 15);
        Cabecera rc = new Cabecera("RC", "A", 1, 100, fecha, null, "AUDITADA", "OSDE");

        assertNotNull(rc.getPeriodo());
        assertEquals(LocalDate.of(2026, 5, 1), rc.getPeriodo());
    }

    @Test
    void testReciboAsignaPeriodoAlModificarFecha() {
        Cabecera rc = new Cabecera();
        rc.setTipo("RC");
        rc.setFecha(LocalDate.of(2026, 5, 15));

        assertEquals(LocalDate.of(2026, 5, 1), rc.getPeriodo());
    }

    @Test
    void testReciboAsignaPeriodoAlModificarTipo() {
        Cabecera c = new Cabecera();
        c.setFecha(LocalDate.of(2026, 5, 15));
        assertNull(c.getPeriodo());

        c.setTipo("REC");
        assertEquals(LocalDate.of(2026, 5, 1), c.getPeriodo());
    }

    @Test
    void testReciboPrePersistAsignaPeriodo() {
        Cabecera rc = new Cabecera();
        rc.setTipo("RCB");
        rc.setFecha(LocalDate.of(2026, 5, 15));
        rc.setPeriodo(null);

        rc.prePersist();
        assertEquals(LocalDate.of(2026, 5, 1), rc.getPeriodo());
    }

    @Test
    void testFacturaConservaPeriodoDistintoDeFecha() {
        LocalDate fechaEmision = LocalDate.of(2026, 6, 10);
        LocalDate periodoPrestacion = LocalDate.of(2026, 5, 1);

        Cabecera fc = new Cabecera("FC", "A", 1, 200, fechaEmision, periodoPrestacion, "AUDITADA", "OSDE");
        assertEquals(periodoPrestacion, fc.getPeriodo());
        assertEquals(fechaEmision, fc.getFecha());
    }

    @Test
    void testEsReciboHelper() {
        assertTrue(Cabecera.esRecibo("RC"));
        assertTrue(Cabecera.esRecibo("RCA"));
        assertTrue(Cabecera.esRecibo("RCB"));
        assertTrue(Cabecera.esRecibo("REC"));
        assertTrue(Cabecera.esRecibo("OP"));
        assertFalse(Cabecera.esRecibo("FC"));
        assertFalse(Cabecera.esRecibo("NC"));
        assertFalse(Cabecera.esRecibo("ND"));
        assertFalse(Cabecera.esRecibo(null));
    }
}
