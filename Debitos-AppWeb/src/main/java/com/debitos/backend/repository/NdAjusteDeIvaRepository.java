package com.debitos.backend.repository;

import com.debitos.backend.model.NdAjusteDeIva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NdAjusteDeIvaRepository extends JpaRepository<NdAjusteDeIva, Integer> {

    @Query("SELECT COUNT(n) > 0 FROM NdAjusteDeIva n JOIN n.cabecera c WHERE c.tipo = :tipoNd AND c.letra = :letraNd AND c.ptovta = :ptovtaNd AND c.numero = :numeroNd")
    boolean existsByTipoNdAndLetraNdAndPtovtaNdAndNumeroNd(
            @Param("tipoNd") String tipoNd,
            @Param("letraNd") String letraNd,
            @Param("ptovtaNd") Integer ptovtaNd,
            @Param("numeroNd") Integer numeroNd
    );

    @Query("SELECT n FROM NdAjusteDeIva n WHERE UPPER(n.letraNc) = UPPER(:letraNc) AND n.ptovtaNc = :ptovtaNc AND n.numeroNc = :numeroNc")
    Optional<NdAjusteDeIva> findByLetraNcAndPtovtaNcAndNumeroNc(
            @Param("letraNc") String letraNc,
            @Param("ptovtaNc") Integer ptovtaNc,
            @Param("numeroNc") Integer numeroNc
    );

    @Query("SELECT n FROM NdAjusteDeIva n JOIN n.cabecera c WHERE UPPER(c.letra) = UPPER(:letraNd) AND c.ptovta = :ptovtaNd AND c.numero = :numeroNd")
    Optional<NdAjusteDeIva> findByLetraNdAndPtovtaNdAndNumeroNd(
            @Param("letraNd") String letraNd,
            @Param("ptovtaNd") Integer ptovtaNd,
            @Param("numeroNd") Integer numeroNd
    );

    Optional<NdAjusteDeIva> findByCabecera_Id(Long idCabecera);
}
