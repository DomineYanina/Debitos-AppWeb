package com.debitos.backend.service;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.ArrayList;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        // LOG 1: ¿Entra al filtro?
        System.out.println("DEBUG: Petición recibida en el filtro para: " + request.getRequestURI());
        System.out.println("DEBUG: Header Authorization: " + authHeader);
        final String jwt;
        final String username;

        // Si no viene el Header o no empieza con Bearer, seguimos de largo
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("DEBUG: No hay Bearer token, se ignora autenticación.");
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7); // Quitamos el "Bearer "

        try {
            username = jwtService.extractUsername(jwt);
            System.out.println("DEBUG: Username extraído: " + username);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtService.isTokenValid(jwt)) {
                    System.out.println("TOKEN VÁLIDO PARA: " + username);
                    // Creamos la autenticación para Spring
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            username,
                            null,
                            new ArrayList<>() // Aquí irían los roles/permisos
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // ESTO ES LO QUE ABRE LA PUERTA:
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Si el token es inválido o expiró, simplemente no autenticamos
            System.out.println("Error al procesar el token: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}