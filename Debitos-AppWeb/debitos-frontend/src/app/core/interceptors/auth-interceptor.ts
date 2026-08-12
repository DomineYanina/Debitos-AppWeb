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

  // CAMINO DE IDA: Si tenemos token, lo inyectamos (salvo en peticiones de autenticación/login)
  if (token && !req.url.includes('/login') && !req.url.includes('/auth')) {
    peticionClonada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // CAMINO DE VUELTA: Interceptamos la respuesta para vigilar si hay error 401 (excepto en peticiones de login/auth)
  return next(peticionClonada).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/login') && !req.url.includes('/auth')) {
        // Si el token expiró o es inválido, limpiamos la casa y lo mandamos al login
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );

};
