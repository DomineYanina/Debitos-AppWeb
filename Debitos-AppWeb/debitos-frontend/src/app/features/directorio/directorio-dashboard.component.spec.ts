import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { of, throwError, Subject } from 'rxjs';
import { DirectorioDashboardComponent } from './directorio-dashboard.component';
import { DirectorioService } from '../../core/services/directorio.service';
import { vi } from 'vitest';

registerLocaleData(localeEsAr, 'es-AR');

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

  it('seleccionarSolapa debería cambiar la solapa activa y cargar los datos on-demand', () => {
    const spyCargarSolapa = vi.spyOn(component, 'cargarDatosSolapa');
    component.solapasCargadas.clear();

    component.seleccionarSolapa('matriz-cobranzas');

    expect(component.solapaActiva).toBe('matriz-cobranzas');
    expect(spyCargarSolapa).toHaveBeenCalledWith('matriz-cobranzas');
    expect(component.solapasCargadas.has('matriz-cobranzas')).toBe(true);

    // Si se selecciona de nuevo la misma solapa ya cargada, no debe recargar datos
    const spyCargarMatriz = vi.spyOn(component, 'cargarMatrizRecaudacion');
    component.seleccionarSolapa('matriz-cobranzas');
    expect(spyCargarMatriz).not.toHaveBeenCalled();
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

  describe('Filtro por Analista en Solapa Analistas', () => {
    const mockAnalistas = [
      {
        analista: 'NataliaMartinez',
        cantidadRegistros: 1829,
        debitosAceptados: 4317981,
        debitosRefacturados: 27929277,
        totalTramitado: 32247258,
        ticketPromedio: 19102,
        tasaRecupero: 79.9,
        motivos: []
      },
      {
        analista: 'FernandaCortes',
        cantidadRegistros: 1388,
        debitosAceptados: 132105714,
        debitosRefacturados: 95279456,
        totalTramitado: 227385170,
        ticketPromedio: 163822,
        tasaRecupero: 41.9,
        motivos: []
      }
    ];

    beforeEach(() => {
      component.analistasDatos = [...mockAnalistas];
      component.filtroAnalistaSeleccionado = 'TODOS';
    });

    it('debería retornar los nombres únicos y ordenados en listaNombresAnalistas', () => {
      expect(component.listaNombresAnalistas).toEqual(['FernandaCortes', 'NataliaMartinez']);
    });

    it('debería retornar todos los analistas cuando filtroAnalistaSeleccionado es TODOS', () => {
      component.filtroAnalistaSeleccionado = 'TODOS';
      expect(component.analistasFiltrados.length).toBe(2);
    });

    it('debería filtrar únicamente el analista seleccionado', () => {
      component.filtroAnalistaSeleccionado = 'FernandaCortes';
      expect(component.analistasFiltrados.length).toBe(1);
      expect(component.analistasFiltrados[0].analista).toBe('FernandaCortes');
    });

    it('debería limpiar el filtro con limpiarFiltroAnalista', () => {
      component.filtroAnalistaSeleccionado = 'NataliaMartinez';
      component.limpiarFiltroAnalista();
      expect(component.filtroAnalistaSeleccionado).toBe('TODOS');
      expect(component.analistasFiltrados.length).toBe(2);
    });

    it('debería restablecer el filtro a TODOS si el analista seleccionado no existe en nuevos datos', () => {
      directorioServiceSpy.getDesempenoGlobal = vi.fn().mockReturnValue(of({
        analistas: [mockAnalistas[0]], // solo NataliaMartinez
        medicos: [],
        operadores: []
      }));

      component.filtroAnalistaSeleccionado = 'FernandaCortes';
      component.cargarDesempenoOperativo();

      expect(component.filtroAnalistaSeleccionado).toBe('TODOS');
      expect(component.analistasFiltrados.length).toBe(1);
      expect(component.analistasFiltrados[0].analista).toBe('NataliaMartinez');
    });

    it('ordenarAnalistas debería ordenar analistas y sus motivos en cascada', () => {
      component.analistasDatos = [
        {
          analista: 'NataliaMartinez',
          cantidadRegistros: 100,
          debitosAceptados: 5000,
          debitosRefacturados: 2000,
          totalTramitado: 7000,
          ticketPromedio: 50,
          tasaRecupero: 40,
          motivos: [
            { motivo: 'Z-Motivo', casos: 10, montoDebitado: 1000, aceptado: 100, refacturado: 900, financiadores: [] },
            { motivo: 'A-Motivo', casos: 90, montoDebitado: 6000, aceptado: 4900, refacturado: 1100, financiadores: [] }
          ]
        },
        {
          analista: 'FernandaCortes',
          cantidadRegistros: 500,
          debitosAceptados: 25000,
          debitosRefacturados: 15000,
          totalTramitado: 40000,
          ticketPromedio: 80,
          tasaRecupero: 60,
          motivos: [
            { motivo: 'X-Motivo', casos: 50, montoDebitado: 5000, aceptado: 2000, refacturado: 3000, financiadores: [] },
            { motivo: 'B-Motivo', casos: 450, montoDebitado: 35000, aceptado: 23000, refacturado: 12000, financiadores: [] }
          ]
        }
      ];

      // Ordenar por documentos (descendente inicial)
      component.ordenarAnalistas('documentos');
      expect(component.columnaOrdenAnalista).toBe('documentos');
      expect(component.direccionOrdenAnalista).toBe('desc');
      expect(component.analistasDatos[0].analista).toBe('FernandaCortes'); // 500 vs 100
      expect(component.analistasDatos[0].motivos[0].motivo).toBe('B-Motivo'); // 450 vs 50 casos

      // Alternar a ascendente
      component.ordenarAnalistas('documentos');
      expect(component.direccionOrdenAnalista).toBe('asc');
      expect(component.analistasDatos[0].analista).toBe('NataliaMartinez'); // 100 vs 500
      expect(component.analistasDatos[0].motivos[0].motivo).toBe('Z-Motivo'); // 10 vs 90 casos

      // Ordenar alfabéticamente por analista y motivo
      component.ordenarAnalistas('analista');
      expect(component.direccionOrdenAnalista).toBe('asc');
      expect(component.analistasDatos[0].analista).toBe('FernandaCortes');
      expect(component.analistasDatos[0].motivos[0].motivo).toBe('B-Motivo'); // B antes que X
    });

    it('ordenarMotivosAnalistas debe ordenar los motivos de forma independiente sin alterar la cabecera principal', () => {
      component.analistasDatos = [
        {
          _originalIndex: 0,
          analista: 'FernandaCortes',
          cantidadRegistros: 500,
          debitosAceptados: 25000,
          debitosRefacturados: 15000,
          totalTramitado: 40000,
          ticketPromedio: 80,
          tasaRecupero: 60,
          motivos: [
            { _originalIndex: 0, motivo: 'X-Motivo', casos: 50, montoDebitado: 5000, aceptado: 2000, refacturado: 3000, financiadores: [] },
            { _originalIndex: 1, motivo: 'B-Motivo', casos: 450, montoDebitado: 35000, aceptado: 23000, refacturado: 12000, financiadores: [] }
          ]
        }
      ];

      // 1er click en refacturado: desc
      component.ordenarMotivosAnalistas('refacturado');
      expect(component.columnaOrdenMotivoAnalista).toBe('refacturado');
      expect(component.direccionOrdenMotivoAnalista).toBe('desc');
      // La cabecera principal permanece intacta
      expect(component.columnaOrdenAnalista).toBe('');
      expect(component.analistasDatos[0].motivos[0].motivo).toBe('B-Motivo'); // 12000 vs 3000

      // 2do click en refacturado: asc
      component.ordenarMotivosAnalistas('refacturado');
      expect(component.direccionOrdenMotivoAnalista).toBe('asc');
      expect(component.columnaOrdenAnalista).toBe('');
      expect(component.analistasDatos[0].motivos[0].motivo).toBe('X-Motivo'); // 3000 vs 12000

      // 3er click en refacturado: deshacer orden
      component.ordenarMotivosAnalistas('refacturado');
      expect(component.columnaOrdenMotivoAnalista).toBe('');
      expect(component.pasoOrdenMotivoAnalista).toBe(0);
      expect(component.analistasDatos[0].motivos[0].motivo).toBe('X-Motivo'); // orden original _originalIndex 0

      // 1er click en aceptado: desc
      component.ordenarMotivosAnalistas('aceptado');
      expect(component.columnaOrdenMotivoAnalista).toBe('aceptado');
      expect(component.columnaOrdenAnalista).toBe('');
      expect(component.analistasDatos[0].motivos[0].motivo).toBe('B-Motivo'); // 23000 vs 2000
    });

    it('cargarDesempenoOperativo debería enviar fechaDesde y fechaHasta al servicio', () => {
      directorioServiceSpy.getDesempenoGlobal = vi.fn().mockReturnValue(of({ analistas: [], medicos: [], operadores: [] }));
      component.fechaDesde = '2026-08-01';
      component.fechaHasta = '2026-08-15';

      component.cargarDesempenoOperativo();

      expect(directorioServiceSpy.getDesempenoGlobal).toHaveBeenCalledWith('2026-08', '2026-08-01', '2026-08-15');
    });

    it('los selectores de cobertura y tipo de comprobante deben estar deshabilitados en la solapa analistas', () => {
      component.solapaActiva = 'analistas';
      fixture.detectChanges();

      const selectCobertura = fixture.nativeElement.querySelector('#select-cobertura');
      const selectTipoDoc = fixture.nativeElement.querySelector('#select-tipo-doc');

      expect(selectCobertura.disabled).toBe(true);
      expect(selectTipoDoc.disabled).toBe(true);

      // En otra solapa deben estar habilitados
      component.solapaActiva = 'tablero';
      fixture.detectChanges();
      expect(selectCobertura.disabled).toBe(false);
      expect(selectTipoDoc.disabled).toBe(false);
    });

    it('los selectores de cobertura y tipo de comprobante deben estar deshabilitados en la solapa medicos', () => {
      component.solapaActiva = 'medicos';
      fixture.detectChanges();

      const selectCobertura = fixture.nativeElement.querySelector('#select-cobertura');
      const selectTipoDoc = fixture.nativeElement.querySelector('#select-tipo-doc');

      expect(selectCobertura.disabled).toBe(true);
      expect(selectTipoDoc.disabled).toBe(true);
    });
  });

  describe('Ordenamiento en Solapa Médicos', () => {
    beforeEach(() => {
      component.medicosDatos = [
        {
          medico: 'Dr. Perez',
          cantidadRegistros: 50,
          debitosAceptados: 50000,
          debitosRefacturados: 20000,
          totalTramitado: 70000,
          ticketPromedio: 1400,
          tasaRecupero: 28.5,
          motivos: [
            { motivo: 'Falta firma', casos: 30, montoDebitado: 40000, aceptado: 30000, refacturado: 10000, financiadores: [] },
            { motivo: 'Autorización', casos: 20, montoDebitado: 30000, aceptado: 20000, refacturado: 10000, financiadores: [] }
          ]
        },
        {
          medico: 'Dr. Alvarez',
          cantidadRegistros: 120,
          debitosAceptados: 120000,
          debitosRefacturados: 80000,
          totalTramitado: 200000,
          ticketPromedio: 1666,
          tasaRecupero: 40,
          motivos: [
            { motivo: 'Prescripción vencida', casos: 120, montoDebitado: 200000, aceptado: 120000, refacturado: 80000, financiadores: [] }
          ]
        }
      ];
    });

    it('ordenarMedicos por médico debe ordenar alfabéticamente ascendente y alternar a descendente', () => {
      component.ordenarMedicos('medico');
      expect(component.columnaOrdenMedico).toBe('medico');
      expect(component.direccionOrdenMedico).toBe('asc');
      expect(component.medicosDatos[0].medico).toBe('Dr. Alvarez');
      expect(component.medicosDatos[1].medico).toBe('Dr. Perez');

      // Alternar
      component.ordenarMedicos('medico');
      expect(component.direccionOrdenMedico).toBe('desc');
      expect(component.medicosDatos[0].medico).toBe('Dr. Perez');
      expect(component.medicosDatos[1].medico).toBe('Dr. Alvarez');
    });

    it('ordenarMedicos por documentos debe ordenar por cantidadRegistros', () => {
      component.ordenarMedicos('documentos');
      expect(component.columnaOrdenMedico).toBe('documentos');
      expect(component.direccionOrdenMedico).toBe('desc');
      expect(component.medicosDatos[0].medico).toBe('Dr. Alvarez'); // 120 vs 50

      component.ordenarMedicos('documentos');
      expect(component.direccionOrdenMedico).toBe('asc');
      expect(component.medicosDatos[0].medico).toBe('Dr. Perez'); // 50 vs 120
    });

    it('ordenarMedicos por aceptados, refacturados, ticket y recupero debe funcionar correctamente', () => {
      component.ordenarMedicos('aceptados');
      expect(component.medicosDatos[0].medico).toBe('Dr. Alvarez'); // 120000 vs 50000

      component.ordenarMedicos('refacturados');
      expect(component.medicosDatos[0].medico).toBe('Dr. Alvarez'); // 80000 vs 20000

      component.ordenarMedicos('ticket');
      expect(component.medicosDatos[0].medico).toBe('Dr. Alvarez'); // 1666 vs 1400

      component.ordenarMedicos('recupero');
      expect(component.medicosDatos[0].medico).toBe('Dr. Alvarez'); // 40 vs 28.5
    });
  });

  describe('Pruebas de Ordenamiento en Tablas Solicitadas', () => {
    it('ordenarCuentaCorriente debe ordenar por financiador, saldo y alternar dirección y deshacer al 3er click', () => {
      component.cuentaCorrienteDatos = [
        {
          _originalIndex: 0,
          financiador: 'OSDE',
          facturacionFc: 500,
          incrementosNd: 0,
          debitosNc: 100,
          refacturacionNd: 50,
          cobranzasRc: 300,
          saldo: 150,
          periodos: [
            {
              _originalIndex: 0,
              periodo: '2026-05',
              facturacionFc: 500,
              incrementosNd: 0,
              debitosNc: 100,
              refacturacionNd: 50,
              cobranzasRc: 300,
              saldo: 150,
              comprobantes: []
            }
          ]
        },
        {
          _originalIndex: 1,
          financiador: 'SWISS',
          facturacionFc: 800,
          incrementosNd: 0,
          debitosNc: 200,
          refacturacionNd: 100,
          cobranzasRc: 400,
          saldo: 300,
          periodos: [
            {
              _originalIndex: 0,
              periodo: '2026-04',
              facturacionFc: 800,
              incrementosNd: 0,
              debitosNc: 200,
              refacturacionNd: 100,
              cobranzasRc: 400,
              saldo: 300,
              comprobantes: []
            }
          ]
        }
      ];

      // 1er click: Ordenar por entidad asc
      component.ordenarCuentaCorriente('entidad');
      expect(component.columnaOrdenCc).toBe('entidad');
      expect(component.direccionOrdenCc).toBe('asc');
      expect(component.cuentaCorrienteDatos[0].financiador).toBe('OSDE');

      // 2do click: Alternar entidad desc
      component.ordenarCuentaCorriente('entidad');
      expect(component.direccionOrdenCc).toBe('desc');
      expect(component.cuentaCorrienteDatos[0].financiador).toBe('SWISS');

      // 3er click: Deshacer ordenamiento
      component.ordenarCuentaCorriente('entidad');
      expect(component.columnaOrdenCc).toBe('');
      expect(component.cuentaCorrienteDatos[0].financiador).toBe('OSDE');

      // 1er click: Ordenar por saldo desc
      component.ordenarCuentaCorriente('saldo');
      expect(component.columnaOrdenCc).toBe('saldo');
      expect(component.direccionOrdenCc).toBe('desc');
      expect(component.cuentaCorrienteDatos[0].financiador).toBe('SWISS'); // 300 vs 150

      // 2do click: Alternar saldo asc
      component.ordenarCuentaCorriente('saldo');
      expect(component.direccionOrdenCc).toBe('asc');
      expect(component.cuentaCorrienteDatos[0].financiador).toBe('OSDE'); // 150 vs 300

      // 3er click: Deshacer ordenamiento
      component.ordenarCuentaCorriente('saldo');
      expect(component.columnaOrdenCc).toBe('');
      expect(component.cuentaCorrienteDatos[0].financiador).toBe('OSDE');
    });

    it('ordenarMatriz debe ordenar por financiador y totalAnual y deshacer al 3er click', () => {
      component.matrizRecaudacion = {
        anioSeleccionado: 2026,
        aniosDisponibles: [2026],
        filas: [
          { _originalIndex: 0, financiador: 'SANCOR', meses: [], totalAnual: 1000 },
          { _originalIndex: 1, financiador: 'IOMA', meses: [], totalAnual: 5000 }
        ],
        totalesMes: [],
        granTotal: 6000
      };

      // 1er click: asc
      component.ordenarMatriz('financiador');
      expect(component.columnaOrdenMatriz).toBe('financiador');
      expect(component.direccionOrdenMatriz).toBe('asc');
      expect(component.matrizRecaudacion.filas[0].financiador).toBe('IOMA');

      // 2do click: desc
      component.ordenarMatriz('financiador');
      expect(component.direccionOrdenMatriz).toBe('desc');
      expect(component.matrizRecaudacion.filas[0].financiador).toBe('SANCOR');

      // 3er click: deshacer
      component.ordenarMatriz('financiador');
      expect(component.columnaOrdenMatriz).toBe('');
      expect(component.matrizRecaudacion.filas[0].financiador).toBe('SANCOR');

      // 1er click totalAnual: desc
      component.ordenarMatriz('totalAnual');
      expect(component.columnaOrdenMatriz).toBe('totalAnual');
      expect(component.direccionOrdenMatriz).toBe('desc');
      expect(component.matrizRecaudacion.filas[0].financiador).toBe('IOMA'); // 5000 vs 1000

      // 2do click totalAnual: asc
      component.ordenarMatriz('totalAnual');
      expect(component.direccionOrdenMatriz).toBe('asc');
      expect(component.matrizRecaudacion.filas[0].financiador).toBe('SANCOR'); // 1000 vs 5000

      // 3er click totalAnual: deshacer
      component.ordenarMatriz('totalAnual');
      expect(component.columnaOrdenMatriz).toBe('');
      expect(component.matrizRecaudacion.filas[0].financiador).toBe('SANCOR');
    });

    it('ordenarBucles debe ordenar por prestacion y débitos y deshacer al 3er click', () => {
      component.buclesDatos = [
        {
          _originalIndex: 0,
          idPrestacion: 'FAC 002',
          descripcion: 'Consulta',
          financiador: 'OSDE',
          medico: 'Dr. B',
          montoFacturadoOriginal: 1000,
          totalDebitado: 500,
          historialEventos: []
        },
        {
          _originalIndex: 1,
          idPrestacion: 'FAC 001',
          descripcion: 'Cirugía',
          financiador: 'SWISS',
          medico: 'Dr. A',
          montoFacturadoOriginal: 2000,
          totalDebitado: 800,
          historialEventos: []
        }
      ];

      // 1er click: asc
      component.ordenarBucles('prestacion');
      expect(component.columnaOrdenBucles).toBe('prestacion');
      expect(component.direccionOrdenBucles).toBe('asc');
      expect(component.buclesDatos[0].idPrestacion).toBe('FAC 001');

      // 2do click: desc
      component.ordenarBucles('prestacion');
      expect(component.direccionOrdenBucles).toBe('desc');
      expect(component.buclesDatos[0].idPrestacion).toBe('FAC 002');

      // 3er click: deshacer
      component.ordenarBucles('prestacion');
      expect(component.columnaOrdenBucles).toBe('');
      expect(component.buclesDatos[0].idPrestacion).toBe('FAC 002');

      // 1er click debitos: desc
      component.ordenarBucles('debitos');
      expect(component.columnaOrdenBucles).toBe('debitos');
      expect(component.direccionOrdenBucles).toBe('desc');
      expect(component.buclesDatos[0].idPrestacion).toBe('FAC 001'); // 800 vs 500

      // 2do click debitos: asc
      component.ordenarBucles('debitos');
      expect(component.direccionOrdenBucles).toBe('asc');
      expect(component.buclesDatos[0].idPrestacion).toBe('FAC 002'); // 500 vs 800

      // 3er click debitos: deshacer
      component.ordenarBucles('debitos');
      expect(component.columnaOrdenBucles).toBe('');
      expect(component.buclesDatos[0].idPrestacion).toBe('FAC 002');
    });

    it('ordenarOperadores debe ordenar por operador y documentos y deshacer al 3er click', () => {
      component.operadoresDatos = [
        {
          _originalIndex: 0,
          operador: 'Carlos',
          cantidadRegistros: 25,
          debitosAceptados: 10000,
          debitosRefacturados: 5000,
          totalTramitado: 15000,
          ticketPromedio: 600,
          tasaRecupero: 33.3,
          motivos: []
        },
        {
          _originalIndex: 1,
          operador: 'Ana',
          cantidadRegistros: 80,
          debitosAceptados: 20000,
          debitosRefacturados: 15000,
          totalTramitado: 35000,
          ticketPromedio: 437.5,
          tasaRecupero: 42.8,
          motivos: []
        }
      ];

      // 1er click: asc
      component.ordenarOperadores('operador');
      expect(component.columnaOrdenOperador).toBe('operador');
      expect(component.direccionOrdenOperador).toBe('asc');
      expect(component.operadoresDatos[0].operador).toBe('Ana');

      // 2do click: desc
      component.ordenarOperadores('operador');
      expect(component.direccionOrdenOperador).toBe('desc');
      expect(component.operadoresDatos[0].operador).toBe('Carlos');

      // 3er click: deshacer
      component.ordenarOperadores('operador');
      expect(component.columnaOrdenOperador).toBe('');
      expect(component.operadoresDatos[0].operador).toBe('Carlos');

      // 1er click documentos: desc
      component.ordenarOperadores('documentos');
      expect(component.columnaOrdenOperador).toBe('documentos');
      expect(component.direccionOrdenOperador).toBe('desc');
      expect(component.operadoresDatos[0].operador).toBe('Ana'); // 80 vs 25

      // 2do click documentos: asc
      component.ordenarOperadores('documentos');
      expect(component.direccionOrdenOperador).toBe('asc');
      expect(component.operadoresDatos[0].operador).toBe('Carlos'); // 25 vs 80

      // 3er click documentos: deshacer
      component.ordenarOperadores('documentos');
      expect(component.columnaOrdenOperador).toBe('');
      expect(component.operadoresDatos[0].operador).toBe('Carlos');
    });

    it('ordenarTrazabilidad debe ordenar por facturado y médico y deshacer al 3er click', () => {
      component.trazabilidadDatos = [
        {
          _originalIndex: 0,
          idPrestacion: 'FAC 100',
          descripcion: 'Guardia',
          financiador: 'OSDE',
          medico: 'Dr. Z',
          montoFacturadoOriginal: 5000,
          totalDebitado: 200,
          historialEventos: []
        },
        {
          _originalIndex: 1,
          idPrestacion: 'FAC 200',
          descripcion: 'Internación',
          financiador: 'SWISS',
          medico: 'Dr. M',
          montoFacturadoOriginal: 15000,
          totalDebitado: 300,
          historialEventos: []
        }
      ];

      // 1er click: asc
      component.ordenarTrazabilidad('medico');
      expect(component.columnaOrdenTrazabilidad).toBe('medico');
      expect(component.direccionOrdenTrazabilidad).toBe('asc');
      expect(component.trazabilidadDatos[0].medico).toBe('Dr. M');

      // 2do click: desc
      component.ordenarTrazabilidad('medico');
      expect(component.direccionOrdenTrazabilidad).toBe('desc');
      expect(component.trazabilidadDatos[0].medico).toBe('Dr. Z');

      // 3er click: deshacer
      component.ordenarTrazabilidad('medico');
      expect(component.columnaOrdenTrazabilidad).toBe('');
      expect(component.trazabilidadDatos[0].medico).toBe('Dr. Z');

      // 1er click facturado: desc
      component.ordenarTrazabilidad('facturado');
      expect(component.columnaOrdenTrazabilidad).toBe('facturado');
      expect(component.direccionOrdenTrazabilidad).toBe('desc');
      expect(component.trazabilidadDatos[0].montoFacturadoOriginal).toBe(15000);

      // 2do click facturado: asc
      component.ordenarTrazabilidad('facturado');
      expect(component.direccionOrdenTrazabilidad).toBe('asc');
      expect(component.trazabilidadDatos[0].montoFacturadoOriginal).toBe(5000);

      // 3er click facturado: deshacer
      component.ordenarTrazabilidad('facturado');
      expect(component.columnaOrdenTrazabilidad).toBe('');
      expect(component.trazabilidadDatos[0].montoFacturadoOriginal).toBe(5000);
    });
  });
});

