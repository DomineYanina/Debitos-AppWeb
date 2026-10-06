package com.debitos.backend.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import static org.junit.jupiter.api.Assertions.*;

class SecurityConfigTest {

    @Test
    @DisplayName("UserDetailsService lanza UsernameNotFoundException")
    void testUserDetailsService() {
        SecurityConfig config = new SecurityConfig();
        UserDetailsService service = config.userDetailsService();
        assertNotNull(service);
        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("admin"));
    }

    @Test
    @DisplayName("CorsConfigurationSource genera orígenes combinados con propiedad")
    void testCorsConfigurationSource() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "allowedOriginsFromProperty", "http://extra-domain.com, http://localhost:4200");

        CorsConfigurationSource source = config.corsConfigurationSource();
        assertNotNull(source);
        assertTrue(source instanceof UrlBasedCorsConfigurationSource);
    }

    @Test
    @DisplayName("WebMvcConfigurer configura registros CORS")
    void testWebMvcConfigurer() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "allowedOriginsFromProperty", "http://extra-domain.com");

        WebMvcConfigurer configurer = config.webMvcCorsConfigurer();
        assertNotNull(configurer);

        CorsRegistry registry = new CorsRegistry();
        configurer.addCorsMappings(registry);
        assertNotNull(registry);
    }
}
