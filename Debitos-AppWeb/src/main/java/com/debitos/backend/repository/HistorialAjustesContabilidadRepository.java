package com.debitos.backend.repository;

import com.debitos.backend.model.HistorialAjustesContabilidad;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialAjustesContabilidadRepository extends JpaRepository<HistorialAjustesContabilidad, Long> {

    List<HistorialAjustesContabilidad> findTop50ByOrderByFechaHoraDesc();

    List<HistorialAjustesContabilidad> findByReferenciaOrderByFechaHoraDesc(String referencia);

    Page<HistorialAjustesContabilidad> findByReferenciaContainingIgnoreCase(String referencia, Pageable pageable);
}
