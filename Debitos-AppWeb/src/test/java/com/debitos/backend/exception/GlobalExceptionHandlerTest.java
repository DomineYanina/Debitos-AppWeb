package com.debitos.backend.exception;

import com.debitos.backend.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("Captura IllegalArgumentException y retorna 400 Bad Request")
    void testHandleIllegalArgumentException() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/test");

        IllegalArgumentException ex = new IllegalArgumentException("Parámetro inválido");

        ResponseEntity<ApiErrorResponse> response = handler.handleIllegalArgumentException(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Parámetro inválido", response.getBody().getMessage());
        assertEquals("/api/test", response.getBody().getPath());
    }

    @Test
    @DisplayName("Captura MethodArgumentNotValidException y retorna 400 Bad Request")
    void testHandleValidationException() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/validar");

        org.springframework.validation.BindingResult bindingResult = mock(org.springframework.validation.BindingResult.class);
        org.springframework.validation.FieldError fieldError = new org.springframework.validation.FieldError("objeto", "usuario", "No puede estar vacío");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        org.springframework.web.bind.MethodArgumentNotValidException ex = mock(org.springframework.web.bind.MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);

        ResponseEntity<ApiErrorResponse> response = handler.handleValidationException(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Error de validación en la solicitud", response.getBody().getMessage());
        assertEquals(1, response.getBody().getErrors().size());
        assertEquals("usuario: No puede estar vacío", response.getBody().getErrors().get(0));
    }

    @Test
    @DisplayName("Captura Exception genérica y retorna 500 Internal Server Error")
    void testHandleGenericException() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/error");

        Exception ex = new NullPointerException("Null reference");

        ResponseEntity<ApiErrorResponse> response = handler.handleGenericException(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().getStatus());
        assertTrue(response.getBody().getMessage().contains("Null reference"));
    }

    @Test
    @DisplayName("Captura AsyncRequestNotUsableException y ClientAbortException sin lanzar 500 ni ensuciar logs")
    void testHandleClientAbort() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/graficos/balance");

        org.apache.catalina.connector.ClientAbortException clientAbort = new org.apache.catalina.connector.ClientAbortException("Client abort");
        assertDoesNotThrow(() -> handler.handleClientAbort(clientAbort, request));

        org.springframework.web.context.request.async.AsyncRequestNotUsableException asyncEx =
                new org.springframework.web.context.request.async.AsyncRequestNotUsableException("Async response not usable");
        assertDoesNotThrow(() -> handler.handleClientAbort(asyncEx, request));

        // Prueba cuando viene anidada en una Exception genérica
        Exception wrapped = new RuntimeException("Error en stream", new java.io.IOException("Se ha anulado una conexión establecida por el software en su equipo host."));
        ResponseEntity<ApiErrorResponse> response = handler.handleGenericException(wrapped, request);
        assertNull(response, "Debe retornar null sin enviar respuesta porque el cliente ya canceló la conexión");
    }
}
