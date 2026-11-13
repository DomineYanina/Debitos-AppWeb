package com.debitos.backend.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CoberturaNombreEquivalenciaTest {

    @ParameterizedTest(name = "[{index}] \"{0}\" vs \"{1}\" -> {2}")
    @DisplayName("Equivalencia tolerante de nombres de cobertura")
    @CsvSource(delimiter = '|', value = {
            "W. HOPE | WILLIAM HOPE | true",
            "ALTA MEDICA S B | ALTA MEDICA S/B | true",
            "alta medica s/b | ALTA MÉDICA S B | true",
            "CONTRATO PP | SISTEMAS PP | false",
            "OMINT ART | SERENA ART SAU | false",
            "B. ACHER ARGENTINA SRL | EDCO GRAINS SA | false",
            "FRAVEGA S.A.C.I. E I.. | FRESENIUS MEDICAL CARE ARGENTINA | false",
            "EMSA S.A. | OSPIL O.S. PERS. DE LA INDUSTRIA LECHERA | false",
            "CRONOS S.A.I.C.. | DIAZ MAURICIO JOSE | false",
            "FARMACIA COLON S.R.L. | OSPETELCO | false"
    })
    void comparaNombresDeCobertura(String a, String b, boolean esperado) {
        assertEquals(esperado, DirectorioService.sonNombresCoberturaEquivalentes(a.trim(), b.trim()));
        assertEquals(esperado, DirectorioService.sonNombresCoberturaEquivalentes(b.trim(), a.trim()));
    }
}
