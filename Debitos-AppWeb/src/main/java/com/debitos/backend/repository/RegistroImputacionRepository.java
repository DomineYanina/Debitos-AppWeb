package com.debitos.backend.repository;

import com.debitos.backend.model.RegistroImputacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistroImputacionRepository extends JpaRepository<RegistroImputacion, Long> {

    List<RegistroImputacion> findByIdCabeceraOrigen(Long idCabeceraOrigen);

    List<RegistroImputacion> findByIdCabeceraDestino(Long idCabeceraDestino);

    List<RegistroImputacion> findByUsuario(String usuario);
}
