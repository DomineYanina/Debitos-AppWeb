package com.debitos.backend.repository;

import com.debitos.backend.model.RegistroUsabilidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegistroUsabilidadRepository extends JpaRepository<RegistroUsabilidad, Long> {
}