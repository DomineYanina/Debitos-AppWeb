import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const expectedRoles: string[] = route.data?.['roles'] || [];

  // Si la ruta no especifica roles restringidos, dejamos pasar a cualquier usuario logueado
  if (expectedRoles.length === 0) {
    return true;
  }

  // Verificamos si el usuario tiene alguno de los roles permitidos
  if (authService.hasAnyRole(expectedRoles)) {
    return true;
  }

  // Si no tiene el rol necesario, redirigimos a la pantalla principal por defecto
  router.navigate(['/auditoria']);
  return false;
};
