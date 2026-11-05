package com.debitos.backend.repository;

import com.debitos.backend.model.AmbLiquidadoManual;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AmbLiquidadoManualRepository extends JpaRepository<AmbLiquidadoManual, Integer> {

    Optional<AmbLiquidadoManual> findByIdAmbLiquidado(Integer idAmbLiquidado);

    List<AmbLiquidadoManual> findByIdAmbLiquidadoIn(Collection<Integer> idsAmbLiquidado);

    boolean existsByIdAmbLiquidado(Integer idAmbLiquidado);

    void deleteByIdAmbLiquidado(Integer idAmbLiquidado);

    void deleteByIdAmbLiquidadoIn(Collection<Integer> idsAmbLiquidado);
}

