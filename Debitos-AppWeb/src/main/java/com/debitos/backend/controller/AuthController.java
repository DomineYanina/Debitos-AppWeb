package com.debitos.backend.controller;

import com.debitos.backend.dto.LoginRequest;
import com.debitos.backend.dto.LoginResponse;
import com.debitos.backend.model.Usuario;
import com.debitos.backend.repository.UsuarioRepository;
import com.debitos.backend.service.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            log.info("Petición de login recibida para el usuario: {}", request != null ? request.getUsuario() : "NULL");

            if (request == null || request.getUsuario() == null || request.getPassword() == null) {
                log.warn("LoginRequest o alguno de sus campos llegó nulo. Usuario: {}, Password presente: {}", 
                        request != null ? request.getUsuario() : null, 
                        request != null && request.getPassword() != null);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Datos de usuario o contraseña no proporcionados");
            }

            Optional<Usuario> usuarioOpt = usuarioRepository.findByUsuario(request.getUsuario());

            if (usuarioOpt.isPresent()) {
                log.info("Usuario '{}' encontrado en la base de datos", request.getUsuario());
            } else {
                log.warn("Usuario '{}' NO fue encontrado en la base de datos", request.getUsuario());
            }

            // Comparamos clave en texto plano
            if (usuarioOpt.isPresent() && usuarioOpt.get().getClave().equals(request.getPassword())) {
                log.info("Autenticación exitosa para el usuario: {}", request.getUsuario());
                String token = jwtService.generateToken(usuarioOpt.get().getUsuario());
                return ResponseEntity.ok(new LoginResponse(token, usuarioOpt.get().getUsuario()));
            } else {
                log.warn("Fallo de autenticación para el usuario '{}': contraseña incorrecta o usuario no encontrado", request.getUsuario());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario o contraseña incorrectos");
            }

        } catch (Exception e) {
            log.error("Error crítico e inesperado durante el proceso de login para el usuario '{}': ", 
                    request != null ? request.getUsuario() : "DESCONOCIDO", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error interno en el servidor durante la autenticación: " + e.getMessage());
        }
    }
}