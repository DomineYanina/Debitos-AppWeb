package com.debitos.backend.controller;

import com.debitos.backend.dto.CambiarClaveRequest;
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

import java.util.Map;
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
                Usuario usuario = usuarioOpt.get();
                String rol = usuario.getRol() != null ? usuario.getRol() : "OPERADOR";
                log.info("Autenticación exitosa para el usuario: {} con rol: {}", usuario.getUsuario(), rol);
                String token = jwtService.generateToken(usuario.getUsuario(), rol);
                return ResponseEntity.ok(new LoginResponse(token, usuario.getUsuario(), rol));
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

    @GetMapping("/verificar-usuario/{usuario}")
    public ResponseEntity<?> verificarUsuario(@PathVariable String usuario) {
        try {
            log.info("Petición de verificación de usuario recibida para: {}", usuario);
            if (usuario == null || usuario.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("El usuario no fue proporcionado");
            }

            Optional<Usuario> usuarioOpt = usuarioRepository.findByUsuario(usuario.trim());
            if (usuarioOpt.isPresent()) {
                log.info("Usuario '{}' existe en la base de datos", usuario);
                return ResponseEntity.ok(Map.of("existe", true, "usuario", usuarioOpt.get().getUsuario()));
            } else {
                log.warn("Usuario '{}' no existe en la base de datos", usuario);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("El usuario ingresado no existe en el sistema.");
            }
        } catch (Exception e) {
            log.error("Error al verificar la existencia del usuario '{}': ", usuario, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error interno al verificar el usuario: " + e.getMessage());
        }
    }

    @PostMapping("/cambiar-clave")
    public ResponseEntity<?> cambiarClave(@RequestBody CambiarClaveRequest request) {
        try {
            if (request == null || request.getUsuario() == null || request.getUsuario().trim().isEmpty()
                    || request.getNuevaClave() == null || request.getNuevaClave().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuario y nueva contraseña son obligatorios");
            }

            Optional<Usuario> usuarioOpt = usuarioRepository.findByUsuario(request.getUsuario().trim());
            if (usuarioOpt.isEmpty()) {
                log.warn("Intento de cambio de clave para usuario no existente: {}", request.getUsuario());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("El usuario no existe en la base de datos.");
            }

            Usuario usuario = usuarioOpt.get();
            usuario.setClave(request.getNuevaClave().trim());
            usuarioRepository.save(usuario);

            log.info("Contraseña actualizada exitosamente para el usuario: {}", usuario.getUsuario());
            return ResponseEntity.ok(Map.of("mensaje", "Contraseña modificada exitosamente"));
        } catch (Exception e) {
            log.error("Error al modificar la contraseña del usuario '{}': ", request != null ? request.getUsuario() : "NULL", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error interno al modificar la contraseña: " + e.getMessage());
        }
    }
}