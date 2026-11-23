package com.debitos.backend.repository;

import com.debitos.backend.model.CoberturaAlias;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoberturaAliasRepository extends JpaRepository<CoberturaAlias, String> {
    List<CoberturaAlias> findAllByOrderByCodigoCoberturaAsc();

    @Query("SELECT c FROM CoberturaAlias c " +
           "WHERE (:filtro IS NULL OR :filtro = '' OR " +
           "LOWER(c.codigoCobertura) LIKE LOWER(CONCAT('%', :filtro, '%')) OR " +
           "LOWER(c.nombreOriginal) LIKE LOWER(CONCAT('%', :filtro, '%')) OR " +
           "LOWER(c.nombreMostrar) LIKE LOWER(CONCAT('%', :filtro, '%')))")
    Page<CoberturaAlias> buscarConFiltro(@Param("filtro") String filtro, Pageable pageable);
}
