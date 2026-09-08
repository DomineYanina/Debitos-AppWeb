package com.debitos.backend.repository;

import com.debitos.backend.model.RegistroUsabilidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface RegistroUsabilidadRepository extends JpaRepository<RegistroUsabilidad, Long> {
    List<RegistroUsabilidad> findTop50ByOrderByFechaHoraDesc();
    List<RegistroUsabilidad> findTop50ByEventoInOrderByFechaHoraDesc(Collection<String> eventos);
}