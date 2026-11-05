package com.debitos.backend;

import org.junit.jupiter.api.Test;
import java.sql.*;

public class DiagnosticoPostSanitizacionTest {

    @Test
    public void diagnosticar() throws Exception {
        String url = "jdbc:postgresql://localhost:5432/Debitos";
        try (Connection conn = DriverManager.getConnection(url, "postgres", "postgres")) {
            System.out.println("=== 1. EVOLUCION MENSUAL EXACTA RETORNADA POR LA CONSULTA ===");
            String sql = """
                WITH fc_madre AS (
                    SELECT DISTINCT ON (COALESCE(c_fc.asociadogrupo, c_fc.grupo))
                        COALESCE(c_fc.asociadogrupo, c_fc.grupo) AS gid,
                        c_fc.periodo,
                        c_fc.fecha
                    FROM cabecera c_fc
                    WHERE UPPER(TRIM(c_fc.tipo)) IN ('FC','FAC','FCE','FCA')
                      AND c_fc.ptovta IN (30, 31, 32, 53)
                      AND COALESCE(c_fc.asociadogrupo, c_fc.grupo) IS NOT NULL
                      AND c_fc.id NOT IN (SELECT id FROM mv_ids_anulados)
                    ORDER BY COALESCE(c_fc.asociadogrupo, c_fc.grupo), c_fc.fecha ASC, c_fc.id ASC
                )
                SELECT
                    TO_CHAR(
                        CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(c.periodo, c.fecha)
                             ELSE COALESCE(fc.periodo, fc.fecha)
                        END
                    , 'YYYY-MM') AS periodo,
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') AND c.ptovta IN (30, 31, 32, 53) THEN c.debe ELSE 0 END), 0) AS facturado,
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('NC','NCE','NCA','NCB') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS debitos,
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('ND','NDE','NDA','NDB') AND EXISTS (
                        SELECT 1 FROM cabecera c_nc WHERE c_nc.id = c.asociado AND UPPER(TRIM(c_nc.tipo)) LIKE '%N%'
                    ) THEN c.debe ELSE 0 END), 0) AS refacturado,
                    COALESCE(SUM(CASE WHEN UPPER(TRIM(c.tipo)) IN ('RC','RCA','RCB','REC') THEN COALESCE(c.haber, c.debe, 0) ELSE 0 END), 0) AS cobrado
                FROM cabecera c
                LEFT JOIN fc_madre fc ON COALESCE(c.asociadogrupo, c.grupo) = fc.gid
                WHERE (
                    CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(c.periodo, c.fecha)
                         ELSE COALESCE(fc.periodo, fc.fecha)
                    END
                ) IS NOT NULL
                  AND c.id NOT IN (SELECT id FROM mv_ids_anulados)
                  AND fc.gid IS NOT NULL
                  AND (UPPER(TRIM(c.tipo)) NOT IN ('FC','FAC','FCE','FCA') OR c.ptovta IN (30, 31, 32, 53))
                  AND (
                      c.asociado IS NULL 
                      OR NOT EXISTS (
                          SELECT 1 FROM cabecera c_asoc
                          WHERE (c_asoc.id = c.asociado OR c_asoc.id = (SELECT c_sub.asociado FROM cabecera c_sub WHERE c_sub.id = c.asociado))
                            AND UPPER(TRIM(c_asoc.tipo)) IN ('FC','FAC','FCE','FCA')
                            AND (c_asoc.ptovta IS NULL OR c_asoc.ptovta NOT IN (30, 31, 32, 53))
                      )
                  )
                  AND (
                    CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(c.periodo, c.fecha)
                         ELSE COALESCE(fc.periodo, fc.fecha)
                    END
                  ) >= DATE '2025-10-01'
                  AND (
                    CASE WHEN UPPER(TRIM(c.tipo)) IN ('FC','FAC','FCE','FCA') THEN COALESCE(c.periodo, c.fecha)
                         ELSE COALESCE(fc.periodo, fc.fecha)
                    END
                  ) <= DATE '2026-09-30'
                GROUP BY 1
                ORDER BY 1 ASC
            """;
            try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {
                while (rs.next()) {
                    System.out.println(String.format("Mes: %s | Fact: %.2f | Deb: %.2f | Refact: %.2f | Cobrado: %.2f",
                        rs.getString("periodo"), rs.getDouble("facturado"), rs.getDouble("debitos"),
                        rs.getDouble("refacturado"), rs.getDouble("cobrado")));
                }
            }

            System.out.println("\n=== 2. FECHAS Y PERIODOS DE LOS RECIBOS IMPORTADOS ===");
            String sqlFechasRc = """
                SELECT 
                    TO_CHAR(fecha, 'YYYY-MM') AS mes_fecha,
                    TO_CHAR(periodo, 'YYYY-MM') AS mes_periodo,
                    COUNT(*) AS cant,
                    SUM(COALESCE(NULLIF(haber,0), debe,0)) AS total
                FROM cabecera
                WHERE UPPER(TRIM(tipo)) IN ('RC', 'RCA', 'RCB', 'REC')
                GROUP BY 1, 2
                ORDER BY 1 ASC
            """;
            try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sqlFechasRc)) {
                while (rs.next()) {
                    System.out.println(String.format("Fecha RC: %s | Periodo RC: %s | Cant: %d | Total: %.2f",
                        rs.getString("mes_fecha"), rs.getString("mes_periodo"),
                        rs.getInt("cant"), rs.getDouble("total")));
                }
            }
        }
    }
}
