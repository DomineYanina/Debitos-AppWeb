package com.debitos.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private final String testSecret = "SuperSecretKeyForTestingJwtServiceMustBeAtLeast256BitsLong!";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", testSecret);
    }

    @Test
    @DisplayName("Debería generar un token válido y extraer el username y rol correctamente")
    void testGenerarYExtraerClaims() {
        String token = jwtService.generateToken("adminUser", "ADMIN");

        assertNotNull(token);
        assertFalse(token.isEmpty());

        String username = jwtService.extractUsername(token);
        String rol = jwtService.extractRol(token);

        assertEquals("adminUser", username);
        assertEquals("ADMIN", rol);
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    @DisplayName("Debería asignar rol OPERADOR por defecto si el rol suministrado es nulo")
    void testGenerarTokenConRolNulo() {
        String token = jwtService.generateToken("operadorUser", null);

        assertNotNull(token);
        assertEquals("OPERADOR", jwtService.extractRol(token));
        assertEquals("operadorUser", jwtService.extractUsername(token));
    }

    @Test
    @DisplayName("Debería retornar false cuando el token es inválido o malformado")
    void testTokenInvalido() {
        assertFalse(jwtService.isTokenValid("token.invalido.123"));
        assertFalse(jwtService.isTokenValid(""));
        assertFalse(jwtService.isTokenValid(null));
    }

    @Test
    @DisplayName("Debería retornar false si el token está firmado con otra clave secreta")
    void testTokenFirmadoConOtraClave() {
        JwtService otroService = new JwtService();
        ReflectionTestUtils.setField(otroService, "secretKey", "OtraClaveDiferenteCompletamenteDistinta1234567890!");
        String tokenOtro = otroService.generateToken("usuario", "ADMIN");

        assertFalse(jwtService.isTokenValid(tokenOtro));
    }
}
