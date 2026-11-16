package com.debitos.backend.repository;

import com.debitos.backend.model.PrestacionConsideracion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PrestacionConsideracionRepository extends JpaRepository<PrestacionConsideracion, String> {

    @Query("SELECT p FROM PrestacionConsideracion p " +
           "WHERE (:filtro IS NULL OR :filtro = '' OR " +
           "LOWER(p.codigo) LIKE LOWER(CONCAT('%', :filtro, '%')) OR " +
           "LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :filtro, '%')))")
    Page<PrestacionConsideracion> buscarConFiltro(@Param("filtro") String filtro, Pageable pageable);
}
