package com.debitos.backend.repository;

import com.debitos.backend.model.FacturaAnuladaManual;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FacturaAnuladaManualRepository extends JpaRepository<FacturaAnuladaManual, Long> {
    Optional<FacturaAnuladaManual> findByIdCabecera(Long idCabecera);

    @Query("SELECT fam FROM FacturaAnuladaManual fam JOIN FETCH fam.cabecera c WHERE fam.anulada = true ORDER BY c.fecha DESC")
    Page<FacturaAnuladaManual> findFacturasAnuladasConCabecera(Pageable pageable);
}
