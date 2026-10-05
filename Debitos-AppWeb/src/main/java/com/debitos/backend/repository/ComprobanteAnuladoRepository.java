package com.debitos.backend.repository;

import com.debitos.backend.model.ComprobanteAnulado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComprobanteAnuladoRepository extends JpaRepository<ComprobanteAnulado, Long> {

    /**
     * Obtiene los IDs de Cabecera declarados formalmente en comprobantes_anulados.
     */
    @Query("SELECT DISTINCT ca.cabecera.id FROM ComprobanteAnulado ca WHERE ca.cabecera.id IS NOT NULL")
    List<Long> findIdsCabeceraAnulados();
}
