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

  it('debería generar opciones de filtros dinámicamente a partir de las prestaciones visualizadas', () => {
    expect(component.opcionesFechas.length).toBe(2);
    expect(component.opcionesFechas.map(f => f.iso)).toContain('2026-08-20');
    expect(component.opcionesFechas.map(f => f.iso)).toContain('2026-08-22');

    expect(component.opcionesPacientes.length).toBe(2);
    expect(component.opcionesPacientes.map(p => p.paciente)).toContain('GARCIA MARIA');
    expect(component.opcionesPacientes.map(p => p.paciente)).toContain('PEREZ JUAN');

    expect(component.opcionesPrestaciones.length).toBe(2);
    expect(component.opcionesImportes.length).toBe(2);
    expect(component.opcionesImportes.map(i => i.valor)).toContain(4500);
    expect(component.opcionesImportes.map(i => i.valor)).toContain(8000);

    expect(component.fechaMinimaDatos).toBe('2026-08-20');
    expect(component.fechaMaximaDatos).toBe('2026-08-22');

    expect(component.opcionesAceptado.length).toBe(2);
    expect(component.opcionesAceptado.map(a => a.key)).toContain('SI');
    expect(component.opcionesAceptado.map(a => a.key)).toContain('NO');
  });

  it('debería filtrar por paciente seleccionado', () => {
    component.filtroPacienteSeleccionado = 'GARCIA MARIA';
    expect(component.prestacionesFiltradas.length).toBe(1);
    expect(component.prestacionesFiltradas[0].paciente).toBe('GARCIA MARIA');
    expect(component.totalMontoFiltrado).toBe(4500);
    expect(component.hayFiltrosActivos).toBe(true);
  });

  it('debería filtrar por prestación médica seleccionada', () => {
    component.filtroPrestacionSeleccionada = '340101';
    expect(component.prestacionesFiltradas.length).toBe(1);
    expect(component.prestacionesFiltradas[0].codigo).toBe('340101');
    expect(component.totalMontoFiltrado).toBe(8000);
  });

  it('debería filtrar por débito aceptado o no aceptado', () => {
    component.filtroAceptadoSeleccionado = 'SI';
    expect(component.prestacionesFiltradas.length).toBe(1);
    expect(component.prestacionesFiltradas[0].debitoAceptado).toBe(true);

    component.filtroAceptadoSeleccionado = 'NO';
    expect(component.prestacionesFiltradas.length).toBe(1);
    expect(component.prestacionesFiltradas[0].debitoAceptado).toBe(false);
  });

  it('debería filtrar por rango de fecha Desde y Hasta', () => {
    component.filtroFechaDesde = '2026-08-21';
    expect(component.prestacionesFiltradas.length).toBe(1);
    expect(component.prestacionesFiltradas[0].id).toBe(2);

    component.filtroFechaDesde = '';
    component.filtroFechaHasta = '2026-08-20';
    expect(component.prestacionesFiltradas.length).toBe(1);
    expect(component.prestacionesFiltradas[0].id).toBe(1);

    component.filtroFechaDesde = '2026-08-20';
    component.filtroFechaHasta = '2026-08-22';
    expect(component.prestacionesFiltradas.length).toBe(2);
  });

  it('no debería permitir en Fecha Hasta fechas anteriores a Fecha Desde ni en Fecha Desde fechas posteriores a Fecha Hasta', () => {
    // Las fechas mock son '2026-08-20' y '2026-08-22'
    expect(component.fechaMinimaPermitida).toBe('2026-08-20');
    expect(component.fechaMaximaPermitida).toBe('2026-08-22');

    component.filtroFechaDesde = '2026-08-22';
    expect(component.fechaMinimaPermitidaHasta).toBe('2026-08-22');

    component.filtroFechaDesde = '';
    component.filtroFechaHasta = '2026-08-20';
    expect(component.fechaMaximaPermitidaDesde).toBe('2026-08-20');

    // Handler onFechaDesdeChange si se intenta forzar una fecha posterior
    component.filtroFechaDesde = '2026-08-22';
    component.filtroFechaHasta = '2026-08-20';
    component.onFechaDesdeChange();
    expect(component.filtroFechaHasta).toBe('2026-08-22');

    // Handler onFechaHastaChange si se intenta forzar una fecha anterior
    component.filtroFechaDesde = '2026-08-22';
    component.filtroFechaHasta = '2026-08-20';
    component.onFechaHastaChange();
    expect(component.filtroFechaDesde).toBe('2026-08-20');

    // Clamping si se intenta seleccionar fecha fuera de los datos de la tabla
    component.filtroFechaDesde = '2026-01-01'; // muy anterior
    component.onFechaDesdeChange();
    expect(component.filtroFechaDesde).toBe('2026-08-20');

    component.filtroFechaHasta = '2026-09-28'; // muy posterior (como en la captura del usuario)
    component.onFechaHastaChange();
    expect(component.filtroFechaHasta).toBe('2026-08-22');
  });

  it('debería filtrar por Importe Desde e Importe Hasta numéricos', () => {
    component.filtroImporteDesde = '5000';
    expect(component.prestacionesFiltradas.length).toBe(1);
    expect(component.prestacionesFiltradas[0].importeDebitado).toBe(8000);

    component.filtroImporteDesde = '';
    component.filtroImporteHasta = '5000';
    expect(component.prestacionesFiltradas.length).toBe(1);
    expect(component.prestacionesFiltradas[0].importeDebitado).toBe(4500);

    component.filtroImporteDesde = '4000';
    component.filtroImporteHasta = '9000';
    expect(component.prestacionesFiltradas.length).toBe(2);
  });

  it('validarSoloNumeros solo debería permitir dígitos y punto/coma', () => {
    const eventDigito = { which: 53, preventDefault: vi.fn() } as unknown as KeyboardEvent; // '5'
    expect(component.validarSoloNumeros(eventDigito)).toBe(true);
    expect(eventDigito.preventDefault).not.toHaveBeenCalled();

    const eventPunto = { which: 46, preventDefault: vi.fn() } as unknown as KeyboardEvent; // '.'
    expect(component.validarSoloNumeros(eventPunto)).toBe(true);

    const eventLetra = { which: 65, preventDefault: vi.fn() } as unknown as KeyboardEvent; // 'A'
    expect(component.validarSoloNumeros(eventLetra)).toBe(false);
    expect(eventLetra.preventDefault).toHaveBeenCalled();

    const eventMenos = { which: 45, preventDefault: vi.fn() } as unknown as KeyboardEvent; // '-'
    expect(component.validarSoloNumeros(eventMenos)).toBe(false);
    expect(eventMenos.preventDefault).toHaveBeenCalled();
  });

  it('ordenar debería alternar ciclo de 3 estados: desc -> asc -> deshacer ordenamiento', () => {
    // Orden original mock: [id 1: 4500, id 2: 8000]
    expect(component.prestacionesFiltradas[0].id).toBe(1);
    expect(component.prestacionesFiltradas[1].id).toBe(2);

    // Clic 1: Ordenar por importe -> 'desc'
    component.ordenar('importe');
    expect(component.columnaOrden).toBe('importe');
    expect(component.direccionOrden).toBe('desc');
    expect(component.prestacionesFiltradas[0].importeDebitado).toBe(8000);
    expect(component.prestacionesFiltradas[1].importeDebitado).toBe(4500);

    // Clic 2: Mismo encabezado -> 'asc'
    component.ordenar('importe');
    expect(component.columnaOrden).toBe('importe');
    expect(component.direccionOrden).toBe('asc');
    expect(component.prestacionesFiltradas[0].importeDebitado).toBe(4500);
    expect(component.prestacionesFiltradas[1].importeDebitado).toBe(8000);

    // Clic 3: Mismo encabezado -> deshacer ordenamiento (original)
    component.ordenar('importe');
    expect(component.columnaOrden).toBe('');
    expect(component.prestacionesFiltradas[0].id).toBe(1);
    expect(component.prestacionesFiltradas[1].id).toBe(2);

    // Probar lo mismo en texto (paciente)
    component.ordenar('paciente'); // Clic 1: desc
    expect(component.columnaOrden).toBe('paciente');
    expect(component.direccionOrden).toBe('desc');
    expect(component.prestacionesFiltradas[0].paciente).toBe('PEREZ JUAN');

    component.ordenar('paciente'); // Clic 2: asc
    expect(component.direccionOrden).toBe('asc');
    expect(component.prestacionesFiltradas[0].paciente).toBe('GARCIA MARIA');

    component.ordenar('paciente'); // Clic 3: deshecho
    expect(component.columnaOrden).toBe('');
    expect(component.prestacionesFiltradas[0].paciente).toBe('GARCIA MARIA');
    expect(component.prestacionesFiltradas[1].paciente).toBe('PEREZ JUAN');
  });

  it('limpiarFiltros debería restablecer todos los filtros aplicados', () => {
    component.filtroBusqueda = 'test';
    component.filtroFechaDesde = '2026-08-01';
    component.filtroFechaHasta = '2026-08-31';
    component.filtroPacienteSeleccionado = 'GARCIA MARIA';
    component.filtroPrestacionSeleccionada = '340101';
    component.filtroImporteDesde = '1000';
    component.filtroImporteHasta = '5000';
    component.filtroAceptadoSeleccionado = 'SI';

    expect(component.hayFiltrosActivos).toBe(true);

    component.limpiarFiltros();

    expect(component.filtroBusqueda).toBe('');
    expect(component.filtroFechaDesde).toBe('');
    expect(component.filtroFechaHasta).toBe('');
    expect(component.filtroPacienteSeleccionado).toBe('TODOS');
    expect(component.filtroPrestacionSeleccionada).toBe('TODAS');
    expect(component.filtroImporteDesde).toBe('');
    expect(component.filtroImporteHasta).toBe('');
    expect(component.filtroAceptadoSeleccionado).toBe('TODOS');
    expect(component.hayFiltrosActivos).toBe(false);
  });

  it('volverAlTablero debería navegar a /directorio preservando la solapa y los filtros aplicados', () => {
    component.solapaOrigen = 'motivos';
    component.codigoCobertura = '446';
    component.tipoDoc = 'FC';
    component.fechaDesde = '2026-07-01';
    component.fechaHasta = '2026-07-31';

    component.volverAlTablero();

    expect(router.navigate).toHaveBeenCalledWith(['/directorio'], {
      queryParams: {
        solapa: 'motivos',
        codigoCobertura: '446',
        tipoDoc: 'FC',
        fechaDesde: '2026-07-01',
        fechaHasta: '2026-07-31'
      }
    });
  });

  it('debería manejar error en obtenerMotivoDetalle', () => {
    directorioServiceSpy.obtenerMotivoDetalle.mockReturnValue(throwError(() => new Error('err')));
    component.cargarDetalle();
    expect(component.cargando).toBe(false);
  });
});
