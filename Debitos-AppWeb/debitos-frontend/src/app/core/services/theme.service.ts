import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AppTheme = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'debitos_theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  private mediaQuery: MediaQueryList | null = null;
  private mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

  private themeSubject: BehaviorSubject<AppTheme>;
  public theme$: Observable<AppTheme>;

  private resolvedThemeSubject: BehaviorSubject<ResolvedTheme>;
  public resolvedTheme$: Observable<ResolvedTheme>;

  constructor() {
    const saved = this.obtenerTemaGuardado();
    const initialTheme: AppTheme = saved || 'auto';

    this.themeSubject = new BehaviorSubject<AppTheme>(initialTheme);
    this.theme$ = this.themeSubject.asObservable();

    const initialResolved = this.resolverTema(initialTheme);
    this.resolvedThemeSubject = new BehaviorSubject<ResolvedTheme>(initialResolved);
    this.resolvedTheme$ = this.resolvedThemeSubject.asObservable();

    this.iniciarEscuchaSistema();
    this.aplicarAlDom(initialResolved);
  }

  ngOnDestroy(): void {
    if (this.mediaQuery && this.mediaListener) {
      if (typeof this.mediaQuery.removeEventListener === 'function') {
        this.mediaQuery.removeEventListener('change', this.mediaListener);
      } else if (typeof (this.mediaQuery as any).removeListener === 'function') {
        (this.mediaQuery as any).removeListener(this.mediaListener);
      }
    }
  }

  public getTheme(): AppTheme {
    return this.themeSubject.value;
  }

  public getResolvedTheme(): ResolvedTheme {
    return this.resolvedThemeSubject.value;
  }

  public setTheme(theme: AppTheme): void {
    if (theme !== 'light' && theme !== 'dark' && theme !== 'auto') {
      theme = 'auto';
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('No se pudo persistir la preferencia de tema en localStorage:', e);
    }

    this.themeSubject.next(theme);
    const resolved = this.resolverTema(theme);
    this.resolvedThemeSubject.next(resolved);
    this.aplicarAlDom(resolved);
  }

  public toggleTheme(): void {
    const actual = this.getTheme();
    let siguiente: AppTheme = 'light';
    if (actual === 'light') {
      siguiente = 'dark';
    } else if (actual === 'dark') {
      siguiente = 'auto';
    } else {
      siguiente = 'light';
    }
    this.setTheme(siguiente);
  }

  public getLabel(theme?: AppTheme): string {
    const t = theme || this.getTheme();
    switch (t) {
      case 'light': return 'Claro';
      case 'dark': return 'Oscuro';
      case 'auto': return 'Automático (Sistema)';
      default: return 'Automático';
    }
  }

  public getIcon(theme?: AppTheme): string {
    const t = theme || this.getTheme();
    switch (t) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'auto': return '💻';
      default: return '💻';
    }
  }

  private obtenerTemaGuardado(): AppTheme | null {
    try {
      const valor = localStorage.getItem(THEME_STORAGE_KEY);
      if (valor === 'light' || valor === 'dark' || valor === 'auto') {
        return valor;
      }
    } catch {
      // Ignorar fallos de acceso a localStorage
    }
    return null;
  }

  private resolverTema(theme: AppTheme): ResolvedTheme {
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return 'light';

    // Modo auto: consultar preferencia de Windows / Sistema operativo
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        const matchesDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return matchesDark ? 'dark' : 'light';
      } catch {
        return 'light';
      }
    }
    return 'light';
  }

  private iniciarEscuchaSistema(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.mediaListener = (e: MediaQueryListEvent) => {
          if (this.themeSubject.value === 'auto') {
            const nuevoResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
            this.resolvedThemeSubject.next(nuevoResolved);
            this.aplicarAlDom(nuevoResolved);
          }
        };

        if (typeof this.mediaQuery.addEventListener === 'function') {
          this.mediaQuery.addEventListener('change', this.mediaListener);
        } else if (typeof (this.mediaQuery as any).addListener === 'function') {
          (this.mediaQuery as any).addListener(this.mediaListener);
        }
      } catch (e) {
        console.warn('No se pudo suscribir a cambios de prefers-color-scheme:', e);
      }
    }
  }

  private aplicarAlDom(resolved: ResolvedTheme): void {
    if (typeof document === 'undefined' || !document.documentElement) return;
    if (resolved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
}
