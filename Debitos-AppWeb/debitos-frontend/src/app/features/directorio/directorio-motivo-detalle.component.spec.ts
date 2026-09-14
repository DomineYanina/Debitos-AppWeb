import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DirectorioMotivoDetalleComponent } from './directorio-motivo-detalle.component';
import { DirectorioService } from '../../core/services/directorio.service';
import { vi } from 'vitest';

describe('DirectorioMotivoDetalleComponent', () => {
  let component: DirectorioMotivoDetalleComponent;
  let fixture: ComponentFixture<DirectorioMotivoDetalleComponent>;
  let directorioServiceSpy: any;
  let router: Router;

  const mockPrestaciones = [
    {
      id: 1,
      paciente: 'GARCIA MARIA',
      carnet: '123456',
      plan: 'PLAN 210',
      efector: 'SANATORIO CENTRAL',
      medico: 'DR LOPEZ',
      fechaPrestacion: '2026-08-10',
      codigo: '420101',
      descripcion: 'CONSULTA MEDICA',
      tipoDoc: 'NC',
      letraDoc: 'A',
      ptovtaDoc: 1,
      numeroDoc: 301,
      fechaDoc: '2026-08-20',
      motivoDebito: 'Falta de autorización',
      comentariosDebito: 'Sin orden adjunta en el expediente',
      importeDebitado: 4500,
      debitoAceptado: true
    },
    {
      id: 2,
      paciente: 'PEREZ JUAN',
      carnet: '654321',
      plan: 'PLAN 310',
      efector: 'CLINICA NORTE',
      medico: 'DRA GOMEZ',
      fechaPrestacion: '2026-08-12',
      codigo: '340101',
      descripcion: 'ECOGRAFIA',
      tipoDoc: 'NC',
      letraDoc: 'A',
      ptovtaDoc: 1,
      numeroDoc: 302,
      fechaDoc: '2026-08-22',
      motivoDebito: 'Falta de autorización',
      comentariosDebito: '',
      importeDebitado: 8000,
      debitoAceptado: false
    }
  ];

  beforeEach(async () => {
    directorioServiceSpy = {
      obtenerMotivoDetalle: vi.fn().mockReturnValue(of(mockPrestaciones))
    };

    await TestBed.configureTestingModule({
      imports: [DirectorioMotivoDetalleComponent],
      providers: [
        provideRouter([]),
        { provide: DirectorioService, useValue: directorioServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ motivoId: encodeURIComponent('Falta de autorización') })),
            queryParamMap: of(convertToParamMap({
              codigoCobertura: 'OSDE',
              tipoDoc: 'FCE',
              fechaDesde: '2026-08-01',
              fechaHasta: '2026-08-31'
            }))
          }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(DirectorioMotivoDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse y cargar prestaciones para el motivo indicado', () => {
    expect(component).toBeTruthy();
    expect(component.motivo).toBe('Falta de autorización');
    expect(component.codigoCobertura).toBe('OSDE');
    expect(component.tipoDoc).toBe('FCE');
    expect(directorioServiceSpy.obtenerMotivoDetalle).toHaveBeenCalledWith('Falta de autorización', 'OSDE', 'FCE', '2026-08-01', '2026-08-31');
    expect(component.prestaciones.length).toBe(2);
    expect(component.totalMontoDebitado).toBe(12500);
    expect(component.totalCasos).toBe(2);
  });

  it('prestacionesFiltradas debería filtrar por texto libre de paciente, comentario o código', () => {
    component.filtroBusqueda = 'GARCIA';
    expect(component.prestacionesFiltradas.length).toBe(1);
    expect(component.prestacionesFiltradas[0].paciente).toBe('GARCIA MARIA');

    component.filtroBusqueda = 'expediente'; // comentario
    expect(component.prestacionesFiltradas.length).toBe(1);

    component.filtroBusqueda = 'ECOGRAFIA'; // descripción
    expect(component.prestacionesFiltradas.length).toBe(1);

    component.filtroBusqueda = 'NO_EXISTE';
    expect(component.prestacionesFiltradas.length).toBe(0);

    component.filtroBusqueda = '';
    expect(component.prestacionesFiltradas.length).toBe(2);
  });

  it('volverAlTablero debería navegar a /directorio', () => {
    component.volverAlTablero();
    expect(router.navigate).toHaveBeenCalledWith(['/directorio']);
  });

  it('debería manejar error en obtenerMotivoDetalle', () => {
    directorioServiceSpy.obtenerMotivoDetalle.mockReturnValue(throwError(() => new Error('err')));
    component.cargarDetalle();
    expect(component.cargando).toBe(false);
  });
});
