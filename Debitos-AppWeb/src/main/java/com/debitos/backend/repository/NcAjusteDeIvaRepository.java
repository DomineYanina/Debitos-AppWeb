package com.debitos.backend.repository;

import com.debitos.backend.model.NcAjusteDeIva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NcAjusteDeIvaRepository extends JpaRepository<NcAjusteDeIva, Integer> {

    @Query("SELECT COUNT(n) > 0 FROM NcAjusteDeIva n JOIN n.cabecera c WHERE c.tipo = :tipoNc AND c.letra = :letraNc AND c.ptovta = :ptovtaNc AND c.numero = :numeroNc")
    boolean existsByTipoNcAndLetraNcAndPtovtaNcAndNumeroNc(@Param("tipoNc") String tipoNc, @Param("letraNc") String letraNc, @Param("ptovtaNc") Integer ptovtaNc, @Param("numeroNc") Integer numeroNc);

    @Query("SELECT COUNT(n) > 0 FROM NcAjusteDeIva n WHERE UPPER(n.tipoFc) = UPPER(:tipoFc) AND UPPER(n.letraFc) = UPPER(:letraFc) AND n.ptovtaFc = :ptovtaFc AND n.numeroFc = :numeroFc")
    boolean existsByTipoFcAndLetraFcAndPtovtaFcAndNumeroFc(@Param("tipoFc") String tipoFc, @Param("letraFc") String letraFc, @Param("ptovtaFc") Integer ptovtaFc, @Param("numeroFc") Integer numeroFc);

    @Query("SELECT n FROM NcAjusteDeIva n JOIN n.cabecera c WHERE UPPER(c.letra) = UPPER(:letraNc) AND c.ptovta = :ptovtaNc AND c.numero = :numeroNc")
    Optional<NcAjusteDeIva> findByLetraNcAndPtovtaNcAndNumeroNc(@Param("letraNc") String letraNc, @Param("ptovtaNc") Integer ptovtaNc, @Param("numeroNc") Integer numeroNc);

    @Query("SELECT n FROM NcAjusteDeIva n WHERE UPPER(n.letraFc) = UPPER(:letraFc) AND n.ptovtaFc = :ptovtaFc AND n.numeroFc = :numeroFc")
    Optional<NcAjusteDeIva> findByLetraFcAndPtovtaFcAndNumeroFc(@Param("letraFc") String letraFc, @Param("ptovtaFc") Integer ptovtaFc, @Param("numeroFc") Integer numeroFc);

    Optional<NcAjusteDeIva> findByCabecera_Id(Long idCabecera);
}
