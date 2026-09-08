package com.debitos.backend.controller;

import com.debitos.backend.dto.CambiarClaveRequest;
import com.debitos.backend.dto.LoginRequest;
import com.debitos.backend.model.Usuario;
import com.debitos.backend.repository.UsuarioRepository;
import com.debitos.backend.service.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    private LoginRequest createLoginRequest(String usuario, String password) {
        LoginRequest req = new LoginRequest();
        req.setUsuario(usuario);
        req.setPassword(password);
        return req;
    }

    // ==========================================
    // LOGIN
    // ==========================================
    @Test
    @DisplayName("Login exitoso - Retorna 200 OK con token, usuario y rol")
    void testLoginExitoso() throws Exception {
        LoginRequest request = createLoginRequest("admin", "1234");
        Usuario usuario = new Usuario();
        usuario.setUsuario("admin");
        usuario.setClave("1234");
        usuario.setRol("ADMIN");

        when(usuarioRepository.findByUsuario("admin")).thenReturn(Optional.of(usuario));
        when(jwtService.generateToken("admin", "ADMIN")).thenReturn("mocked.jwt.token");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mocked.jwt.token"))
                .andExpect(jsonPath("$.usuario").value("admin"))
                .andExpect(jsonPath("$.rol").value("ADMIN"));
    }

    @Test
    @DisplayName("Login con contraseña incorrecta - Retorna 401 Unauthorized")
    void testLoginPasswordIncorrecta() throws Exception {
        LoginRequest request = createLoginRequest("admin", "wrongPassword");
        Usuario usuario = new Usuario();
        usuario.setUsuario("admin");
        usuario.setClave("1234");
        usuario.setRol("ADMIN");

        when(usuarioRepository.findByUsuario("admin")).thenReturn(Optional.of(usuario));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Usuario o contraseña incorrectos"));
    }

    @Test
    @DisplayName("Login con usuario inexistente - Retorna 401 Unauthorized")
    void testLoginUsuarioInexistente() throws Exception {
        LoginRequest request = createLoginRequest("noExiste", "1234");
        when(usuarioRepository.findByUsuario("noExiste")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Usuario o contraseña incorrectos"));
    }

    @Test
    @DisplayName("Login con campos nulos - Retorna 400 Bad Request")
    void testLoginCamposNulos() throws Exception {
        LoginRequest request = createLoginRequest(null, null);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ==========================================
    // VERIFICAR USUARIO
    // ==========================================
    @Test
    @DisplayName("Verificar usuario existente - Retorna 200 OK con existe: true")
    void testVerificarUsuarioExistente() throws Exception {
        Usuario usuario = new Usuario();
        usuario.setUsuario("yanina");
        when(usuarioRepository.findByUsuario("yanina")).thenReturn(Optional.of(usuario));

        mockMvc.perform(get("/api/auth/verificar-usuario/yanina"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.existe").value(true))
                .andExpect(jsonPath("$.usuario").value("yanina"));
    }

    @Test
    @DisplayName("Verificar usuario inexistente - Retorna 404 Not Found")
    void testVerificarUsuarioInexistente() throws Exception {
        when(usuarioRepository.findByUsuario("noExiste")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/auth/verificar-usuario/noExiste"))
                .andExpect(status().isNotFound())
                .andExpect(content().string("El usuario ingresado no existe en el sistema."));
    }

    // ==========================================
    // CAMBIAR CLAVE
    // ==========================================
    @Test
    @DisplayName("Cambiar clave exitoso - Retorna 200 OK")
    void testCambiarClaveExitoso() throws Exception {
        CambiarClaveRequest request = new CambiarClaveRequest("yanina", "nuevaClave123");
        Usuario usuario = new Usuario();
        usuario.setUsuario("yanina");
        usuario.setClave("claveVieja");

        when(usuarioRepository.findByUsuario("yanina")).thenReturn(Optional.of(usuario));

        mockMvc.perform(post("/api/auth/cambiar-clave")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Contraseña modificada exitosamente"));

        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Cambiar clave con usuario no existente - Retorna 404 Not Found")
    void testCambiarClaveUsuarioInexistente() throws Exception {
        CambiarClaveRequest request = new CambiarClaveRequest("desconocido", "nuevaClave123");
        when(usuarioRepository.findByUsuario("desconocido")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/cambiar-clave")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Cambiar clave con campos vacíos - Retorna 400 Bad Request")
    void testCambiarClaveCamposVacios() throws Exception {
        CambiarClaveRequest request = new CambiarClaveRequest("", "");

        mockMvc.perform(post("/api/auth/cambiar-clave")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ==========================================
    // OBTENER ROLES
    // ==========================================
    @Test
    @DisplayName("Obtener roles - Retorna lista de roles excluyendo ADMIN")
    void testObtenerRoles() throws Exception {
        when(usuarioRepository.findDistinctRolesNoAdmin()).thenReturn(List.of("OPERADOR", "AUDITORIA", "DIRECTORIO"));

        mockMvc.perform(get("/api/auth/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("OPERADOR"))
                .andExpect(jsonPath("$[1]").value("AUDITORIA"))
                .andExpect(jsonPath("$[2]").value("DIRECTORIO"));
    }

    // ==========================================
    // MANEJO DE EXCEPCIONES (500 INTERNAL SERVER ERROR)
    // ==========================================
    @Test
    @DisplayName("Login con error inesperado - Retorna 500")
    void testLoginException() throws Exception {
        LoginRequest request = createLoginRequest("admin", "1234");
        when(usuarioRepository.findByUsuario("admin")).thenThrow(new RuntimeException("DB Connection failed"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("Verificar usuario con error inesperado - Retorna 500")
    void testVerificarUsuarioException() throws Exception {
        when(usuarioRepository.findByUsuario("admin")).thenThrow(new RuntimeException("DB error"));

        mockMvc.perform(get("/api/auth/verificar-usuario/admin"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("Cambiar clave con error inesperado - Retorna 500")
    void testCambiarClaveException() throws Exception {
        CambiarClaveRequest request = new CambiarClaveRequest("admin", "newPass");
        when(usuarioRepository.findByUsuario("admin")).thenThrow(new RuntimeException("DB error"));

        mockMvc.perform(post("/api/auth/cambiar-clave")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("Obtener roles con error inesperado - Retorna 500")
    void testObtenerRolesException() throws Exception {
        when(usuarioRepository.findDistinctRolesNoAdmin()).thenThrow(new RuntimeException("DB error"));

        mockMvc.perform(get("/api/auth/roles"))
                .andExpect(status().isInternalServerError());
    }
}
