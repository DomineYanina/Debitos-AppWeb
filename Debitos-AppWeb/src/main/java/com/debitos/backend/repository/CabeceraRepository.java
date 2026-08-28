package com.debitos.backend.repository;

import com.debitos.backend.model.Cabecera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CabeceraRepository extends JpaRepository<Cabecera, Long> {

    @Query("SELECT c FROM Cabecera c WHERE UPPER(c.tipo) = UPPER(:tipo) AND UPPER(c.letra) = UPPER(:letra) AND c.ptovta = :ptovta AND c.numero = :numero")
    Optional<Cabecera> findByTipoAndLetraAndPtovtaAndNumero(@Param("tipo") String tipo, @Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("SELECT c FROM Cabecera c WHERE c.tipo IN :tipos AND UPPER(c.letra) = UPPER(:letra) AND c.ptovta = :ptovta AND c.numero = :numero")
    List<Cabecera> findByTipoInAndLetraAndPtovtaAndNumero(@Param("tipos") Collection<String> tipos, @Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("SELECT COUNT(c) > 0 FROM Cabecera c WHERE UPPER(c.tipo) = UPPER(:tipo) AND UPPER(c.letra) = UPPER(:letra) AND c.ptovta = :ptovta AND c.numero = :numero")
    boolean existsByTipoAndLetraAndPtovtaAndNumero(@Param("tipo") String tipo, @Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("SELECT COUNT(c) > 0 FROM Cabecera c WHERE c.tipo IN :tipos AND UPPER(c.letra) = UPPER(:letra) AND c.ptovta = :ptovta AND c.numero = :numero")
    boolean existsByTipoInAndLetraAndPtovtaAndNumero(@Param("tipos") Collection<String> tipos, @Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);

    @Query("SELECT c FROM Cabecera c WHERE UPPER(c.letra) = UPPER(:letra) AND c.ptovta = :ptovta AND c.numero = :numero")
    Optional<Cabecera> findByLetraAndPtovtaAndNumero(@Param("letra") String letra, @Param("ptovta") Integer ptovta, @Param("numero") Integer numero);
}
