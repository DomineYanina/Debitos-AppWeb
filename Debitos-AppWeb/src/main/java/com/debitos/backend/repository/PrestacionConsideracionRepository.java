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
           "LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :filtro, '%'))) " +
           "AND (:estadoAmb IS NULL OR :estadoAmb = '' OR LOWER(p.estadoAmbulatorio) = LOWER(:estadoAmb)) " +
           "AND (:estadoInt IS NULL OR :estadoInt = '' OR LOWER(p.estadoInternado) = LOWER(:estadoInt))")
    Page<PrestacionConsideracion> buscarConFiltro(
            @Param("filtro") String filtro,
            @Param("estadoAmb") String estadoAmb,
            @Param("estadoInt") String estadoInt,
            Pageable pageable);

    default Page<PrestacionConsideracion> buscarConFiltro(
            String filtro,
            String estado,
            Pageable pageable) {
        return buscarConFiltro(filtro, estado, null, pageable);
    }
}
