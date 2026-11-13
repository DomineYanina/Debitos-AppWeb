import { TestBed } from '@angular/core/testing';
import { ThemeService, THEME_STORAGE_KEY } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debería inicializar con tema auto por defecto si no hay nada guardado', () => {
    expect(service.getTheme()).toBe('auto');
  });

  it('setTheme(dark) debería persistir en localStorage y aplicar data-theme="dark" al DOM', () => {
    service.setTheme('dark');
    expect(service.getTheme()).toBe('dark');
    expect(service.getResolvedTheme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('setTheme(light) debería remover data-theme del DOM', () => {
    service.setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    service.setTheme('light');
    expect(service.getTheme()).toBe('light');
    expect(service.getResolvedTheme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('toggleTheme() debería ciclar entre light -> dark -> auto -> light', () => {
    service.setTheme('light');
    expect(service.getTheme()).toBe('light');

    service.toggleTheme();
    expect(service.getTheme()).toBe('dark');

    service.toggleTheme();
    expect(service.getTheme()).toBe('auto');

    service.toggleTheme();
    expect(service.getTheme()).toBe('light');
  });

  it('getLabel() y getIcon() deberían devolver textos e iconos adecuados', () => {
    service.setTheme('light');
    expect(service.getLabel()).toBe('Claro');
    expect(service.getIcon()).toBe('☀️');

    service.setTheme('dark');
    expect(service.getLabel()).toBe('Oscuro');
    expect(service.getIcon()).toBe('🌙');

    service.setTheme('auto');
    expect(service.getLabel()).toBe('Automático (Sistema)');
    expect(service.getIcon()).toBe('💻');
  });
});
