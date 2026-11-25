import { TestBed } from '@angular/core/testing';
import { AuditoriaGridConfigService } from './auditoria-grid-config';

describe('AuditoriaGridConfigService', () => {
  let service: AuditoriaGridConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuditoriaGridConfigService]
    });
    service = TestBed.inject(AuditoriaGridConfigService);
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debería generar columnas para tipo FC con todas las opciones activas', () => {
    const cols = service.getConfiguracionColumnas('FC', true, true, [], [], null);
    expect(cols.length).toBeGreaterThan(15);

    // Verificar formatter de fecha
    const fechaCol = cols.find(c => c.field === 'fecha');
    expect(fechaCol?.valueFormatter).toBeDefined();
    expect((fechaCol?.valueFormatter as any)({ value: '2025-05-18' })).toBe('18/05/2025');
    expect((fechaCol?.valueFormatter as any)({ value: null })).toBe('');

    // Verificar formatter de moneda
    const totalCol = cols.find(c => c.field === 'total');
    expect(totalCol?.valueFormatter).toBeDefined();
    expect((totalCol?.valueFormatter as any)({ value: 1500.5 })).toContain('1.500,50');
    expect((totalCol?.valueFormatter as any)({ value: null })).toBe('');

    // Verificar columna englobante
    const englobanteCol = cols.find(c => c.field === 'prestacionEnglobante');
    expect(englobanteCol).toBeDefined();
  });

  it('debería configurar columnas para tipo NC y ND', () => {
    // Para ND incluye comentarios previos
    const colsNd = service.getConfiguracionColumnas('ND', false, false, [], [], null);
    const prevNd = colsNd.find(c => c.field === 'comentarioPrevio');
    expect(prevNd).toBeDefined();
    expect((prevNd?.tooltipValueGetter as any)({ value: 'previo' })).toBe('previo');
    expect((prevNd?.tooltipValueGetter as any)({ value: null })).toBe('');

    // Para NC sin comentarios previos no incluye comentarioPrevio
    const colsNc = service.getConfiguracionColumnas('NC', false, false, [], [], null);
    const prevNc = colsNc.find(c => c.field === 'comentarioPrevio');
    expect(prevNc).toBeUndefined();

    // NC es de solo lectura
    const debitoCol = colsNc.find(c => c.field === 'debitoAceptado');
    expect(debitoCol?.editable).toBe(false);
  });

  it('debería evaluar reglas dinámicas de edición y cellClassRules', () => {
    const cols = service.getConfiguracionColumnas('FC', false, false, [], [], null);

    // Motivo Débito
    const motDebitoCol = cols.find(c => c.field === 'motivoDebito')!;
    expect(typeof motDebitoCol.editable).toBe('function');
    expect((motDebitoCol.editable as any)({ data: { debitoAceptado: 'SI' } })).toBe(true);
    expect((motDebitoCol.editable as any)({ data: { debitoAceptado: 'NO' } })).toBe(true);
    expect((motDebitoCol.editable as any)({ data: { debitoAceptado: '' } })).toBe(false);
    expect((motDebitoCol.editable as any)({ data: {} })).toBe(false);

    // Días Facturados
    const diasCol = cols.find(c => c.field === 'diasFacturados')!;
    expect((diasCol.editable as any)({ data: { debitoAceptado: 'SI' } })).toBe(true);
    expect((diasCol.editable as any)({ data: { debitoAceptado: '' } })).toBe(false);

    // Importe Debitado
    const impDebCol = cols.find(c => c.field === 'importeDebitado')!;
    expect((impDebCol.editable as any)({ data: { debitoAceptado: 'NO' } })).toBe(true);
    expect((impDebCol.editable as any)({ data: { debitoAceptado: '' } })).toBe(false);

    // Comentarios Débito
    const comDebitoCol = cols.find(c => c.field === 'comentariosDebito')!;
    expect(typeof comDebitoCol.editable).toBe('function');
    expect((comDebitoCol.editable as any)({ data: { motivoDebito: '01', debitoAceptado: 'SI' } })).toBe(true);
    expect((comDebitoCol.editable as any)({ data: { motivoDebito: '01', debitoAceptado: '' } })).toBe(false);
    expect((comDebitoCol.editable as any)({ data: { motivoDebito: '', debitoAceptado: 'SI' } })).toBe(false);

    const fnGris = comDebitoCol.cellClassRules?.['bg-gris'] as (params: any) => boolean;
    const fnNaranja = comDebitoCol.cellClassRules?.['bg-naranja'] as (params: any) => boolean;
    expect(fnGris({ data: { motivoDebito: '01', debitoAceptado: 'SI' } })).toBe(true);
    expect(fnNaranja({ data: { motivoDebito: '01', debitoAceptado: '' } })).toBe(true);
    expect((comDebitoCol.tooltipValueGetter as any)({ value: 'com' })).toBe('com');
    expect((comDebitoCol.tooltipValueGetter as any)({ value: null })).toBe('');

    // Motivo Refactura
    const motRefacturaCol = cols.find(c => c.field === 'motivoRefactura')!;
    expect(typeof motRefacturaCol.editable).toBe('function');
    expect((motRefacturaCol.editable as any)({ data: { debitoAceptado: 'NO' } })).toBe(true);
    expect((motRefacturaCol.editable as any)({ data: { debitoAceptado: 'SI' } })).toBe(false);
    expect((motRefacturaCol.editable as any)({ data: { debitoAceptado: '' } })).toBe(false);

    // Importe Refactura
    const impRefacturaCol = cols.find(c => c.field === 'importeRefactura')!;
    expect((impRefacturaCol.valueFormatter as any)({ value: 200 })).toContain('200,00');

    // Comentarios Refactura
    const comRefacturaCol = cols.find(c => c.field === 'comentarios')!;
    expect((comRefacturaCol.editable as any)({ data: { debitoAceptado: 'NO' } })).toBe(true);
    expect((comRefacturaCol.editable as any)({ data: { debitoAceptado: 'SI' } })).toBe(false);

    const fnGrisRef = comRefacturaCol.cellClassRules?.['bg-gris'] as (params: any) => boolean;
    const fnNaranjaRef = comRefacturaCol.cellClassRules?.['bg-naranja'] as (params: any) => boolean;
    expect(fnGrisRef({ data: { debitoAceptado: 'NO' } })).toBe(true);
    expect(fnNaranjaRef({ data: { debitoAceptado: 'SI' } })).toBe(true);
  });
});
