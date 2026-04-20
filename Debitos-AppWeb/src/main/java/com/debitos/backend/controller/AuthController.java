package com.debitos.backend.controller;

import com.debitos.backend.dto.LoginRequest;
import com.debitos.backend.dto.LoginResponse;
import com.debitos.backend.model.Usuario;
import com.debitos.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // 1. Buscamos al usuario por su nombre en la DB
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsuario(request.getUsuario());

        // 2. Validamos si existe y si la clave coincide
        if (usuarioOpt.isPresent() && usuarioOpt.get().getClave().equals(request.getPassword())) {

            // Generamos un token (por ahora simulado, pero el flujo ya es real)
            String token = "JWT_" + usuarioOpt.get().getUsuario() + "_SESSION";

            return ResponseEntity.ok(new LoginResponse(token, usuarioOpt.get().getUsuario()));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario o contraseña incorrectos");
        }
    }
}