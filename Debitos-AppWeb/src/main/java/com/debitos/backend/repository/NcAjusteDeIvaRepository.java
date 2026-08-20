package com.debitos.backend.repository;

import com.debitos.backend.model.NcAjusteDeIva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NcAjusteDeIvaRepository extends JpaRepository<NcAjusteDeIva, Integer> {
    @Query("SELECT COUNT(n) > 0 FROM NcAjusteDeIva n WHERE n.tipoNc = :tipoNc AND n.letraNc = :letraNc AND n.ptovtaNc = :ptovtaNc AND n.numeroNc = :numeroNc")
    boolean existsByTipoNcAndLetraNcAndPtovtaNcAndNumeroNc(@Param("tipoNc") String tipoNc, @Param("letraNc") String letraNc, @Param("ptovtaNc") Integer ptovtaNc, @Param("numeroNc") Integer numeroNc);

    @Query("SELECT COUNT(n) > 0 FROM NcAjusteDeIva n WHERE UPPER(n.tipoFc) = UPPER(:tipoFc) AND UPPER(n.letraFc) = UPPER(:letraFc) AND n.ptovtaFc = :ptovtaFc AND n.numeroFc = :numeroFc")
    boolean existsByTipoFcAndLetraFcAndPtovtaFcAndNumeroFc(@Param("tipoFc") String tipoFc, @Param("letraFc") String letraFc, @Param("ptovtaFc") Integer ptovtaFc, @Param("numeroFc") Integer numeroFc);

    @Query("SELECT n FROM NcAjusteDeIva n WHERE UPPER(n.letraNc) = UPPER(:letraNc) AND n.ptovtaNc = :ptovtaNc AND n.numeroNc = :numeroNc")
    java.util.Optional<NcAjusteDeIva> findByLetraNcAndPtovtaNcAndNumeroNc(@Param("letraNc") String letraNc, @Param("ptovtaNc") Integer ptovtaNc, @Param("numeroNc") Integer numeroNc);

    @Query("SELECT n FROM NcAjusteDeIva n WHERE UPPER(n.letraFc) = UPPER(:letraFc) AND n.ptovtaFc = :ptovtaFc AND n.numeroFc = :numeroFc")
    java.util.Optional<NcAjusteDeIva> findByLetraFcAndPtovtaFcAndNumeroFc(@Param("letraFc") String letraFc, @Param("ptovtaFc") Integer ptovtaFc, @Param("numeroFc") Integer numeroFc);
}
