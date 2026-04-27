import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './../services/auth'; // Asegurate de que la ruta sea correcta

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const authService = inject(AuthService);
  const router = inject(Router);

  let peticionClonada = req;

  // CAMINO DE IDA: Si tenemos token, lo inyectamos
  if (token) {
    peticionClonada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // CAMINO DE VUELTA: Interceptamos la respuesta para vigilar si hay error 401
  return next(peticionClonada).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Si el token expiró o es inválido, limpiamos la casa y lo mandamos al login
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
