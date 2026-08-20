package com.debitos.backend.config;

import com.debitos.backend.service.JwtAuthenticationFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    // IPs/orígenes de producción siempre permitidos, sin importar variables de entorno
    private static final List<String> ALWAYS_ALLOWED_ORIGINS = List.of(
            "http://172.16.14.210",
            "http://localhost:4200",
            "http://localhost:8080"
    );

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;

    @Value("${cors.allowed.origins:}")
    private String allowedOriginsFromProperty;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Inyectamos CorsConfigurationSource de forma explícita para evitar
        // ambigüedad en el lookup de beans de Spring Security 6/7
        CorsConfigurationSource corsSource = corsConfigurationSource();

        http
                .cors(cors -> cors.configurationSource(corsSource)) // Inyección explícita
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/test/ping").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/", "/index.html", "/favicon.ico", "/*.js", "/*.css", "/assets/**", "/*.png", "/*.ico", "/*.svg", "/*.json", "/login", "/auditoria").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        // Evita que Spring Boot genere y loguee una contraseña aleatoria al arrancar
        return username -> {
            throw new UsernameNotFoundException("Autenticación gestionada por JWT/AuthController");
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Combina los orígenes de la propiedad con los siempre permitidos
        List<String> originsFromProp = (allowedOriginsFromProperty != null && !allowedOriginsFromProperty.isBlank())
                ? Arrays.stream(allowedOriginsFromProperty.split(",")).map(String::trim).filter(s -> !s.isBlank()).toList()
                : List.of();

        List<String> allOrigins = new ArrayList<>(ALWAYS_ALLOWED_ORIGINS);
        for (String o : originsFromProp) {
            if (!allOrigins.contains(o)) allOrigins.add(o);
        }

        log.info("=== CORS CONFIG === Orígenes permitidos al iniciar: {}", allOrigins);

        configuration.setAllowedOriginPatterns(allOrigins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public WebMvcConfigurer webMvcCorsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                List<String> allOrigins = new ArrayList<>(ALWAYS_ALLOWED_ORIGINS);
                if (allowedOriginsFromProperty != null && !allowedOriginsFromProperty.isBlank()) {
                    for (String o : allowedOriginsFromProperty.split(",")) {
                        String trimmed = o.trim();
                        if (!trimmed.isBlank() && !allOrigins.contains(trimmed)) allOrigins.add(trimmed);
                    }
                }

                registry.addMapping("/**")
                        .allowedOriginPatterns(allOrigins.toArray(new String[0]))
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH")
                        .allowedHeaders("*")
                        .exposedHeaders("Authorization")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }
}