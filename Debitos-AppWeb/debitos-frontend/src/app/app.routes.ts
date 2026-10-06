import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'auditoria',
    loadComponent: () => import('./features/auditoria/auditoria').then(m => m.AuditoriaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'directorio',
    loadComponent: () => import('./features/directorio/directorio-dashboard.component').then(m => m.DirectorioDashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['DIRECTORIO', 'ADMIN'] }
  },
  {
    path: 'directorio/motivo/:motivoId',
    loadComponent: () => import('./features/directorio/directorio-motivo-detalle.component').then(m => m.DirectorioMotivoDetalleComponent),
    canActivate: [roleGuard],
    data: { roles: ['DIRECTORIO', 'ADMIN'] }
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
