package com.debitos.backend.repository;

import com.debitos.backend.model.FacturaPeriodoCorregido;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FacturaPeriodoCorregidoRepository extends JpaRepository<FacturaPeriodoCorregido, Long> {
    Optional<FacturaPeriodoCorregido> findByIdCabecera(Long idCabecera);

    @Query("SELECT fpc FROM FacturaPeriodoCorregido fpc JOIN FETCH fpc.cabecera c ORDER BY c.fecha DESC")
    Page<FacturaPeriodoCorregido> findFacturasPeriodoCorregidoConCabecera(Pageable pageable);
}
