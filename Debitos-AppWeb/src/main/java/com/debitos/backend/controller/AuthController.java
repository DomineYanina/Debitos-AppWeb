package com.debitos.backend.controller;

import com.debitos.backend.dto.LoginRequest;
import com.debitos.backend.dto.LoginResponse;
import com.debitos.backend.model.Usuario;
import com.debitos.backend.repository.UsuarioRepository;
import com.debitos.backend.service.JwtService;
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

    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsuario(request.getUsuario());

        // Comparamos clave (Ojo: en el futuro deberías usar BCrypt para no tener claves en texto plano)
        if (usuarioOpt.isPresent() && usuarioOpt.get().getClave().equals(request.getPassword())) {

            // GENERACIÓN REAL DEL TOKEN
            String token = jwtService.generateToken(usuarioOpt.get().getUsuario());

            return ResponseEntity.ok(new LoginResponse(token, usuarioOpt.get().getUsuario()));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario o contraseña incorrectos");
        }
    }
}