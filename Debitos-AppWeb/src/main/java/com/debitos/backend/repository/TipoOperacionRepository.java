package com.debitos.backend.repository;

import com.debitos.backend.model.TipoOperacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TipoOperacionRepository extends JpaRepository<TipoOperacion, Integer> {
    Optional<TipoOperacion> findByCodigo(String codigo);
}
