import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Evitamos interceptar errores de login o de verificación para permitir mensajes específicos en pantalla
      if (!req.url.includes('/api/auth/login') && !req.url.includes('/api/auth/verificar-usuario')) {
        if (error.status === 0) {
          notificationService.error('Servidor no disponible. Por favor, intente más tarde.', 'Error de Conexión');
        } else if (error.status >= 500) {
          const mensajeServer = error.error?.message || 'Ocurrió un error inesperado en el servidor.';
          notificationService.error(mensajeServer, 'Error del Servidor (500)');
        }
      }
      return throwError(() => error);
    })
  );
};
