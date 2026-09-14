import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { DirectorioDashboardComponent } from './directorio-dashboard.component';
import { DirectorioService } from '../../core/services/directorio.service';
import { vi } from 'vitest';

describe('DirectorioDashboardComponent', () => {
  let component: DirectorioDashboardComponent;
  let fixture: ComponentFixture<DirectorioDashboardComponent>;
  let directorioServiceSpy: any;
  let router: Router;

  const mockTotales = {
    totalFacturado: 1500000,
    cobranzaEfectiva: 900000,
    perdidaAsumida: 100000,
    deudaNeta: 500000,
    cantidadFacturas: 15,
    cantidadComprobantes: 42
  };

  const mockCoberturas = [
    { codigo: 'OSDE', nombre: 'OSDE BINARIO' },
    { codigo: 'SWISS', nombre: 'SWISS MEDICAL' }
  ];

  const mockGrupos = [
    {
      id: 101,
      tipo: 'FC',
      letra: 'A',
      ptovta: 1,
      numero: 1001,
      fecha: '2026-08-15',
      codigoCobertura: 'OSDE',
      cobertura: 'OSDE BINARIO',
      asociadogrupo: 101,
      totalFacturado: 50000,
      totalDebitadoAceptado: 5000,
      totalDebitadoNoAceptado: 2000,
      totalCobranza: 40000,
      cantidadRefacturaciones: 1,
      idEstado: 1,
      comprobantesDerivados: [
        {
          id: 201,
          tipo: 'NC',
          letra: 'A',
          ptovta: 1,
          numero: 501,
          fecha: '2026-08-20',
          montoNeto: 5000,
          montoIva: 0,
          total: 5000,
          debitoAceptado: 5000,
          debitoNoAceptado: 0,
          refacturado: 0,
          origenTipo: 'DEB',
          nivel: 1
        }
      ]
    }
  ];

  const mockMotivos = [
    { motivo: 'Falta de autorización', montoTotal: 60000, porcentaje: 60, cantidadCasos: 12 },
    { motivo: 'Falta firma médico', montoTotal: 40000, porcentaje: 40, cantidadCasos: 8 }
  ];

  beforeEach(async () => {
    directorioServiceSpy = {
      obtenerCoberturas: vi.fn().mockReturnValue(of(mockCoberturas)),
      obtenerTiposDocumento: vi.fn().mockReturnValue(of(['FAC', 'FC', 'FCA', 'FCE'])),
      obtenerTotales: vi.fn().mockReturnValue(of(mockTotales)),
      obtenerGrupos: vi.fn().mockReturnValue(of(mockGrupos)),
      obtenerMotivos: vi.fn().mockReturnValue(of(mockMotivos))
    };

    await TestBed.configureTestingModule({
      imports: [DirectorioDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: DirectorioService, useValue: directorioServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(DirectorioDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse e inicializar fechas del mes anterior y datos del dashboard', () => {
    expect(component).toBeTruthy();
    expect(component.coberturas.length).toBe(2);
    expect(component.tiposDocumento.length).toBe(4);
    expect(component.totales.totalFacturado).toBe(1500000);
    expect(component.gruposFacturas.length).toBe(1);
    expect(component.motivosDebito.length).toBe(2);
    expect(component.slicesDonut.length).toBe(2);
  });

  it('inicializarFechasMesAnterior debería setear fechaDesde y fechaHasta del mes previo', () => {
    const ahora = new Date();
    const mesPrev = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const mesPrevFin = new Date(ahora.getFullYear(), ahora.getMonth(), 0);

    const isoDesde = component.formatearFechaIso(mesPrev);
    const isoHasta = component.formatearFechaIso(mesPrevFin);

    expect(component.fechaDesde).toBe(isoDesde);
    expect(component.fechaHasta).toBe(isoHasta);
  });

  it('toggleGrupo y expandirTodos deberían alternar la visibilidad de comprobantes derivados', () => {
    const grupo = component.gruposFacturas[0];
    expect(grupo.expandido).toBe(false);

    component.toggleGrupo(grupo);
    expect(grupo.expandido).toBe(true);

    component.expandirTodos(false);
    expect(component.gruposFacturas[0].expandido).toBe(false);

    component.expandirTodos(true);
    expect(component.gruposFacturas[0].expandido).toBe(true);
  });

  it('navegarADetalleMotivo debería redirigir a la ruta drill-down con queryParams', () => {
    component.codigoCoberturaSeleccionada = 'OSDE';
    component.tipoDocSeleccionado = 'FCE';
    component.navegarADetalleMotivo('Falta de autorización');

    expect(router.navigate).toHaveBeenCalledWith(
      ['/directorio/motivo', encodeURIComponent('Falta de autorización')],
      {
        queryParams: {
          codigoCobertura: 'OSDE',
          tipoDoc: 'FCE',
          fechaDesde: component.fechaDesde,
          fechaHasta: component.fechaHasta
        }
      }
    );
  });

  it('irAlMesAnterior debería retroceder un mes en las fechas sin resetear los filtros de cobertura y tipoDoc', () => {
    component.codigoCoberturaSeleccionada = 'OSDE';
    component.tipoDocSeleccionado = 'FCE';
    component.fechaDesde = '2026-08-01';
    component.fechaHasta = '2026-08-31';

    component.irAlMesAnterior();

    expect(component.codigoCoberturaSeleccionada).toBe('OSDE');
    expect(component.tipoDocSeleccionado).toBe('FCE');
    expect(component.fechaDesde).toBe('2026-07-01');
    expect(component.fechaHasta).toBe('2026-07-31');
    expect(directorioServiceSpy.obtenerTotales).toHaveBeenCalledWith('OSDE', 'FCE', '2026-07-01', '2026-07-31');
  });

  it('formatearComprobante debería formatear correctamente con 4 y 8 dígitos con padding de ceros', () => {
    expect(component.formatearComprobante('A', 31, 1919)).toBe('A 0031-00001919');
    expect(component.formatearComprobante('B', 1, 5)).toBe('B 0001-00000005');
    expect(component.formatearComprobante('', 12, 345)).toBe('0012-00000345');
  });

  it('formatearMoneda debería formatear números a formato moneda argentina', () => {
    expect(component.formatearMoneda(1500)).toContain('1.500,00');
    expect(component.formatearMoneda(0)).toContain('0,00');
    expect(component.formatearMoneda(null as any)).toBe('$ 0,00');
  });

  it('debería manejar errores de servicios graciosamente', () => {
    directorioServiceSpy.obtenerTotales.mockReturnValue(throwError(() => new Error('error')));
    directorioServiceSpy.obtenerGrupos.mockReturnValue(throwError(() => new Error('error')));
    directorioServiceSpy.obtenerMotivos.mockReturnValue(throwError(() => new Error('error')));

    component.cargarDashboard();

    expect(component.cargandoTotales).toBe(false);
    expect(component.cargandoGrupos).toBe(false);
    expect(component.cargandoMotivos).toBe(false);
  });

  it('aplicarFiltros y restablecerFiltros deberían recargar el dashboard', () => {
    const spyCargar = vi.spyOn(component, 'cargarDashboard');
    component.aplicarFiltros();
    expect(spyCargar).toHaveBeenCalled();

    const spyIrMes = vi.spyOn(component, 'irAlMesAnterior');
    component.restablecerFiltros();
    expect(spyIrMes).toHaveBeenCalled();
  });

  it('onHoverSector debería actualizar el sector en hover', () => {
    const slice = { motivo: 'Test', porcentaje: 50 } as any;
    component.onHoverSector(slice);
    expect(component.sectorHover).toBe(slice);

    component.onHoverSector(null);
    expect(component.sectorHover).toBeNull();
  });

  it('navegarADetalleMotivo debería salir si el motivo está vacío', () => {
    component.navegarADetalleMotivo('');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('cargarTiposDocumento y cargarCoberturas deberían capturar errores', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    directorioServiceSpy.obtenerTiposDocumento.mockReturnValue(throwError(() => new Error('err')));
    directorioServiceSpy.obtenerCoberturas.mockReturnValue(throwError(() => new Error('err')));

    component.cargarTiposDocumento();
    component.cargarCoberturas();

    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('debería renderizar todos los estados visuales del template directorio-dashboard', () => {
    // 1. Estado de carga activo
    directorioServiceSpy.obtenerTotales.mockReturnValue(new Subject());
    directorioServiceSpy.obtenerGrupos.mockReturnValue(new Subject());
    directorioServiceSpy.obtenerMotivos.mockReturnValue(new Subject());
    const f1 = TestBed.createComponent(DirectorioDashboardComponent);
    f1.detectChanges();
    expect(f1.nativeElement).toBeTruthy();

    // 2. Estado vacío (sin motivos, sin grupos)
    directorioServiceSpy.obtenerTotales.mockReturnValue(of(mockTotales));
    directorioServiceSpy.obtenerGrupos.mockReturnValue(of([]));
    directorioServiceSpy.obtenerMotivos.mockReturnValue(of([]));
    const f2 = TestBed.createComponent(DirectorioDashboardComponent);
    f2.detectChanges();
    expect(f2.nativeElement).toBeTruthy();

    // 3. Estado con motivos y grupos derivados expandidos
    const gruposExpandidos = [
      {
        id: 1, tipo: 'FC', letra: 'A', ptovta: 1, numero: 10, fecha: '2026-08-01',
        codigoCobertura: 'OSDE', cobertura: '', asociadogrupo: 1, totalFacturado: 100,
        totalDebitadoAceptado: 10, totalDebitadoNoAceptado: 5, totalCobranza: 85,
        cantidadRefacturaciones: 0, idEstado: 1, expandido: true, comprobantesDerivados: []
      },
      {
        id: 2, tipo: 'FC', letra: 'B', ptovta: 2, numero: 20, fecha: '2026-08-02',
        codigoCobertura: 'SWISS', cobertura: 'Swiss Medical', asociadogrupo: 2, totalFacturado: 500,
        totalDebitadoAceptado: 50, totalDebitadoNoAceptado: 20, totalCobranza: 430,
        cantidadRefacturaciones: 2, idEstado: 2, expandido: true,
        comprobantesDerivados: [
          { id: 21, tipo: 'NC', letra: 'B', ptovta: 2, numero: 21, fecha: '2026-08-03', montoNeto: 50, montoIva: 0, total: 50, debitoAceptado: 50, debitoNoAceptado: 0, refacturado: 0, origenTipo: 'DEB', nivel: 1 },
          { id: 22, tipo: 'ND', letra: 'B', ptovta: 2, numero: 22, fecha: '2026-08-04', montoNeto: 20, montoIva: 0, total: 20, debitoAceptado: 0, debitoNoAceptado: 20, refacturado: 20, origenTipo: 'REF', nivel: 1 },
          { id: 23, tipo: 'RC', letra: 'B', ptovta: 2, numero: 23, fecha: '2026-08-05', montoNeto: 430, montoIva: 0, total: 430, debitoAceptado: 0, debitoNoAceptado: 0, refacturado: 0, origenTipo: 'COB', nivel: 1 },
          { id: 24, tipo: 'NC', letra: 'B', ptovta: 2, numero: 24, fecha: '2026-08-06', montoNeto: 10, montoIva: 2.1, total: 12.1, debitoAceptado: 0, debitoNoAceptado: 0, refacturado: 0, origenTipo: 'IVA', nivel: 1 },
          { id: 25, tipo: 'OTRO', letra: 'B', ptovta: 2, numero: 25, fecha: '2026-08-07', montoNeto: 5, montoIva: 0, total: 5, debitoAceptado: 0, debitoNoAceptado: 0, refacturado: 0, origenTipo: 'OTRO', nivel: 1 }
        ]
      }
    ];
    directorioServiceSpy.obtenerGrupos.mockReturnValue(of(gruposExpandidos));
    directorioServiceSpy.obtenerMotivos.mockReturnValue(of(mockMotivos));
    const f3 = TestBed.createComponent(DirectorioDashboardComponent);
    f3.detectChanges();
    (f3.componentInstance as any).cdr.detectChanges();
    f3.componentInstance.onHoverSector(f3.componentInstance.slicesDonut[0]);
    (f3.componentInstance as any).cdr.detectChanges();
    expect(f3.nativeElement).toBeTruthy();
  });
});
