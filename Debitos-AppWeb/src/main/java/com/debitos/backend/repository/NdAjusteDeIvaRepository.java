package com.debitos.backend.repository;

import com.debitos.backend.model.NdAjusteDeIva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NdAjusteDeIvaRepository extends JpaRepository<NdAjusteDeIva, Integer> {

    @Query("SELECT COUNT(n) > 0 FROM NdAjusteDeIva n WHERE n.tipoNd = :tipoNd AND n.letraNd = :letraNd AND n.ptovtaNd = :ptovtaNd AND n.numeroNd = :numeroNd")
    boolean existsByTipoNdAndLetraNdAndPtovtaNdAndNumeroNd(
            @Param("tipoNd") String tipoNd,
            @Param("letraNd") String letraNd,
            @Param("ptovtaNd") Integer ptovtaNd,
            @Param("numeroNd") Integer numeroNd
    );
}
