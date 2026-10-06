package com.debitos.backend.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SpaControllerTest {

    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new SpaController()).build();

    @Test
    @DisplayName("Rutas frontend SPA redirigen a forward:/index.html")
    void testForwardSpa() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));

        mockMvc.perform(get("/login"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));

        mockMvc.perform(get("/auditoria"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }
}
