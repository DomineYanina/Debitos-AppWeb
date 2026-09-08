package com.debitos.backend.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TestControllerTest {

    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new TestController()).build();

    @Test
    @DisplayName("GET /api/test/ping - Retorna status OK y mensaje de confirmación")
    void testPingEndpoint() throws Exception {
        mockMvc.perform(get("/api/test/ping"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OK"))
                .andExpect(jsonPath("$.mensaje").value("El backend de Débitos está online y respondiendo correctamente."));
    }
}
