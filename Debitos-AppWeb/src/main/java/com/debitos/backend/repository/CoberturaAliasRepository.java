package com.debitos.backend.repository;

import com.debitos.backend.model.CoberturaAlias;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoberturaAliasRepository extends JpaRepository<CoberturaAlias, String> {
    List<CoberturaAlias> findAllByOrderByCodigoCoberturaAsc();
}
