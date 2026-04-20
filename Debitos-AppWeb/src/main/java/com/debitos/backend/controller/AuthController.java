package com.debitos.backend.controller;

import com.debitos.backend.dto.LoginRequest;
import com.debitos.backend.dto.LoginResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        // Validación temporal para probar la conexión con Angular
        if ("admin".equals(request.getUsuario()) && "1234".equals(request.getPassword())) {
            // Simulamos un token JWT básico por ahora
            String tokenFalso = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tokenDePruebaSeguro";
            return ResponseEntity.ok(new LoginResponse(tokenFalso, request.getUsuario()));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales incorrectas");
        }
    }
}