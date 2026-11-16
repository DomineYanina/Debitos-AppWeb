package com.debitos.backend.repository;

import com.debitos.backend.model.FacturaPeriodoCorregido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FacturaPeriodoCorregidoRepository extends JpaRepository<FacturaPeriodoCorregido, Long> {
    Optional<FacturaPeriodoCorregido> findByIdCabecera(Long idCabecera);
}
