package com.debitos.backend;

import com.debitos.backend.model.CabeceraBase;
import com.debitos.backend.repository.AmbLiquidadoRepository;
import com.debitos.backend.repository.CabeceraRepository;
import com.debitos.backend.repository.NotaDeCreditoRepository;
import com.debitos.backend.repository.NotaDeDebitoRepository;
import com.debitos.backend.service.DirectorioService;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.*;

@Disabled("Test de diagnóstico manual local contra PostgreSQL (localhost:5432)")
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5432/Debitos?reWriteBatchedInserts=true",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.datasource.username=postgres",
    "spring.datasource.password=postgres",
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect"
})
public class DiagnosticoBuclesTest {

    @Autowired
    private CabeceraRepository cabeceraRepository;

    @Autowired
    private NotaDeCreditoRepository notaDeCreditoRepository;

    @Autowired
    private NotaDeDebitoRepository notaDeDebitoRepository;

    @Autowired
    private AmbLiquidadoRepository ambLiquidadoRepository;

    @Autowired
    private DirectorioService directorioService;

    @Test
    public void testPasoAPaso() {
        LocalDate fDesde = LocalDate.of(2025, 1, 1);
        LocalDate fHasta = LocalDate.of(2026, 7, 31);

        System.out.println("=== PASO 1: findIdsGruposConMultiplesNc ===");
        List<Long> ids = cabeceraRepository.findIdsGruposConMultiplesNc(fDesde, fHasta);
        System.out.println("Encontrados " + (ids != null ? ids.size() : 0) + " ids de grupo");
        if (ids == null || ids.isEmpty()) return;

        System.out.println("Primeros 10 IDs: " + ids.subList(0, Math.min(10, ids.size())));

        System.out.println("=== PASO 2: findLigeraByGrupoOrAsociadogrupoOrIdIn ===");
        List<CabeceraBase> comprobantes = new ArrayList<>();
        int batchSize = 500;
        for (int i = 0; i < ids.size(); i += batchSize) {
            List<Long> batch = ids.subList(i, Math.min(i + batchSize, ids.size()));
            try {
                var ligeros = cabeceraRepository.findLigeraByGrupoOrAsociadogrupoOrIdIn(batch);
                System.out.println("Batch " + i + ": obtenidos " + ligeros.size() + " ligeros");
                comprobantes.addAll(ligeros);
            } catch (Exception e) {
                System.err.println("ERROR en findLigera batch " + i + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        System.out.println("Total comprobantes ligeros: " + comprobantes.size());

        System.out.println("=== PASO 2b: Probando findByGrupoOrAsociadogrupoOrIdIn (Entidades Cabecera) ===");
        for (int i = 0; i < ids.size(); i += batchSize) {
            List<Long> batch = ids.subList(i, Math.min(i + batchSize, ids.size()));
            try {
                var entidades = cabeceraRepository.findByGrupoOrAsociadogrupoOrIdIn(batch);
                System.out.println("Batch entidades " + i + ": obtenidas " + entidades.size());
            } catch (Exception e) {
                System.err.println("ERROR en findByGrupoOrAsociadogrupoOrIdIn batch " + i + ": " + e.getMessage());
                e.printStackTrace();
            }
        }

        System.out.println("=== PASO 3: Probando Notas de Credito y Debito ===");
        Set<Long> ncIds = new HashSet<>();
        Set<Long> ndIds = new HashSet<>();
        for (CabeceraBase c : comprobantes) {
            if (c.getTipo() != null) {
                String t = c.getTipo().trim().toUpperCase();
                if (t.startsWith("NC")) ncIds.add(c.getId());
                else if (t.startsWith("ND")) ndIds.add(c.getId());
            }
        }
        System.out.println("ncIds: " + ncIds.size() + ", ndIds: " + ndIds.size());

        List<Integer> prestacionIds = new ArrayList<>();
        if (!ncIds.isEmpty()) {
            List<Long> list = new ArrayList<>(ncIds);
            for (int i = 0; i < list.size(); i += batchSize) {
                List<Long> batch = list.subList(i, Math.min(i + batchSize, list.size()));
                try {
                    var ncs = notaDeCreditoRepository.findByCabecera_IdIn(batch);
                    for (var nc : ncs) {
                        if (nc.getPrestacion() != null && nc.getPrestacion().getId() != null) {
                            prestacionIds.add(nc.getPrestacion().getId());
                        }
                    }
                } catch (Exception e) {
                    System.err.println("ERROR en findByCabecera_IdIn NC batch " + i + ": " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }

        if (!ndIds.isEmpty()) {
            List<Long> list = new ArrayList<>(ndIds);
            for (int i = 0; i < list.size(); i += batchSize) {
                List<Long> batch = list.subList(i, Math.min(i + batchSize, list.size()));
                try {
                    var nds = notaDeDebitoRepository.findByCabecera_IdIn(batch);
                    for (var nd : nds) {
                        if (nd.getPrestacion() != null && nd.getPrestacion().getId() != null) {
                            prestacionIds.add(nd.getPrestacion().getId());
                        }
                    }
                } catch (Exception e) {
                    System.err.println("ERROR en findByCabecera_IdIn ND batch " + i + ": " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }
        System.out.println("prestacionIds a cargar de amb_liquidado: " + prestacionIds.size());

        System.out.println("=== PASO 4: Probando ambLiquidadoRepository.findAllById ===");
        for (int i = 0; i < prestacionIds.size(); i += batchSize) {
            List<Integer> batch = prestacionIds.subList(i, Math.min(i + batchSize, prestacionIds.size()));
            try {
                var ambs = ambLiquidadoRepository.findAllById(batch);
                System.out.println("Batch amb_liquidado " + i + ": cargados " + ambs.size());
            } catch (Exception e) {
                System.err.println("ERROR en ambLiquidadoRepository.findAllById batch " + i + ": " + e.getMessage());
                e.printStackTrace();
            }
        }

        System.out.println("=== PASO 5: Invocando getBuclesInsistencia completo ===");
        try {
            var bucles = directorioService.getBuclesInsistencia(null, null, null, "2025-01-01", "2026-07-31");
            System.out.println("Total bucles obtenidos: " + (bucles != null ? bucles.size() : 0));
        } catch (Exception e) {
            System.err.println("ERROR en directorioService.getBuclesInsistencia: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
