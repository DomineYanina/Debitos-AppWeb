package com.debitos.backend.exception;

import com.debitos.backend.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.catalina.connector.ClientAbortException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

import java.io.IOException;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Maneja desconexiones normales del cliente (navegador cancela la petición al recargar,
     * cambiar de solapa o aplicar nuevos filtros mientras el servidor enviaba la respuesta).
     * Evita llenar los logs de la terminal con errores no controlados y trazas de 100 líneas.
     */
    @ExceptionHandler({AsyncRequestNotUsableException.class, ClientAbortException.class})
    public void handleClientAbort(Exception ex, HttpServletRequest request) {
        log.debug("Conexión interrumpida por el cliente antes de completar la respuesta - URI: {}", request.getRequestURI());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex, HttpServletRequest request) {
        log.warn("Solicitud inválida (400 Bad Request): {} - URI: {}", ex.getMessage(), request.getRequestURI());
        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<String> details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .toList();

        log.warn("Error de validación en los parámetros de entrada - URI: {}", request.getRequestURI());
        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Error de validación en la solicitud",
                request.getRequestURI(),
                details
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(
            Exception ex, HttpServletRequest request) {
        // Protección adicional: si ClientAbortException o desconexión por socket viene anidada dentro de otra excepción
        if (isClientAbortException(ex)) {
            log.debug("Conexión anulada por el cliente detectada en causa raíz - URI: {}", request.getRequestURI());
            return null;
        }

        log.error("Error no controlado capturado en GlobalExceptionHandler - URI: {}", request.getRequestURI(), ex);
        Throwable root = ex;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        String mensaje = "Ocurrió un error interno en el servidor: " + ex.getMessage();
        if (root != ex && root.getMessage() != null && !root.getMessage().trim().isEmpty()) {
            mensaje += " [Causa raíz: " + root.getMessage() + "]";
        }
        ApiErrorResponse error = new ApiErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                mensaje,
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private boolean isClientAbortException(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            if (current instanceof ClientAbortException || current instanceof AsyncRequestNotUsableException) {
                return true;
            }
            if (current instanceof IOException) {
                String msg = current.getMessage();
                if (msg != null) {
                    String lower = msg.toLowerCase();
                    if (lower.contains("broken pipe")
                            || lower.contains("connection reset")
                            || lower.contains("conexión establecida por el software")
                            || lower.contains("an established connection was aborted")) {
                        return true;
                    }
                }
            }
            if (current.getCause() == current) {
                break;
            }
            current = current.getCause();
        }
        return false;
    }
}