import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { of, throwError, Subject } from 'rxjs';
import { DirectorioDashboardComponent } from './directorio-dashboard.component';
import { DirectorioService } from '../../core/services/directorio.service';
import { ExcelExportService } from '../../core/services/excel-export';
import { DirectorioPrestacionesResponse } from '../../core/models/directorio.model';
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
    { motivo: 'Falta de autorización/Token', montoTotal: 60000, porcentaje: 60, cantidadCasos: 12 },
    { motivo: 'Falta firma médico', montoTotal: 40000, porcentaje: 40, cantidadCasos: 8 }
  ];

  beforeEach(async () => {
    directorioServiceSpy = {
      obtenerCoberturas: vi.fn().mockReturnValue(of(mockCoberturas)),
      obtenerTiposDocumento: vi.fn().mockReturnValue(of(['FAC', 'FC', 'FCA', 'FCE'])),
      obtenerFechaMinimaFiltro: vi.fn().mockReturnValue(of({ fechaMinima: '2024-07-01' })),
      obtenerTotales: vi.fn().mockReturnValue(of(mockTotales)),
      obtenerGrupos: vi.fn().mockReturnValue(of(mockGrupos)),
      obtenerMotivos: vi.fn().mockReturnValue(of(mockMotivos)),
      getPrestacionesFacturadas: vi.fn().mockReturnValue(of({ totalRegistros: 0, totalMontoFacturado: 0, cantidadMedicos: 0, cantidadPacientes: 0, paginaActual: 1, totalPaginas: 1, tamanioPagina: 50, items: [] })),
      getSugerenciasMedicos: vi.fn().mockReturnValue(of([])),
      getSugerenciasPrestaciones: vi.fn().mockReturnValue(of([])),
      getTiemposCobranza: vi.fn().mockReturnValue(of({ dsoGlobal: 150, cobroRealPromedio: 0, saldoTotalMora: 10000, detalles: [] })),
      getRecibosNoImputados: vi.fn().mockReturnValue(of([]))
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
    // Verificar que los motivos se cargan bajo demanda en la solapa motivos
    component.cargarDatosSolapa('motivos', true);
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
    component.cargarGrupos();
    const grupo = component.gruposFacturas[0];
    expect(grupo.expandido).toBe(false);

    component.toggleGrupo(grupo);
    expect(grupo.expandido).toBe(true);

    component.expandirTodos(false);
    expect(component.gruposFacturas[0].expandido).toBe(false);

    component.expandirTodos(true);
    expect(component.gruposFacturas[0].expandido).toBe(true);
  });

  it('navegarADetalleMotivo debería redirigir a la ruta drill-down con queryParams incluyendo solapa', () => {
    component.solapaActiva = 'motivos';
    component.codigoCoberturaSeleccionada = 'OSDE';
    component.tipoDocSeleccionado = 'FCE';
    component.navegarADetalleMotivo('Falta de autorización/Token');

    expect(router.navigate).toHaveBeenCalledWith(
      ['/directorio/motivo', encodeURIComponent('Falta de autorización/Token')],
      {
        queryParams: {
          codigoCobertura: 'OSDE',
          tipoDoc: 'FCE',
          fechaDesde: component.fechaDesde,
          fechaHasta: component.fechaHasta,
          criterioFecha: 'periodo',
          solapa: 'motivos'
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

  it('irAlMesSiguiente debería avanzar un mes en las fechas sin resetear los filtros de cobertura y tipoDoc', () => {
    component.codigoCoberturaSeleccionada = 'OSDE';
    component.tipoDocSeleccionado = 'FCE';
    component.fechaDesde = '2026-08-01';
    component.fechaHasta = '2026-08-31';

    component.irAlMesSiguiente();

    expect(component.codigoCoberturaSeleccionada).toBe('OSDE');
    expect(component.tipoDocSeleccionado).toBe('FCE');
    expect(component.fechaDesde).toBe('2026-09-01');
    expect(component.fechaHasta).toBe('2026-09-30');
    expect(directorioServiceSpy.obtenerTotales).toHaveBeenCalledWith('OSDE', 'FCE', '2026-09-01', '2026-09-30');
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

  it('obtenerClaseTamanoMonto debería retornar clase adecuada según la longitud del monto', () => {
    // Monto corto (< 17 caracteres) -> sin clase adicional
    expect(component.obtenerClaseTamanoMonto(113885944.40)).toBe('');
    // Monto mediano (17-18 caracteres) -> kpi-value--md
    expect(component.obtenerClaseTamanoMonto(8647329638.08)).toBe('kpi-value--md');
    // Monto largo (19-21 caracteres) -> kpi-value--sm
    expect(component.obtenerClaseTamanoMonto(122557944384.38)).toBe('kpi-value--sm');
    // Monto muy largo (>= 22 caracteres) -> kpi-value--xs
    expect(component.obtenerClaseTamanoMonto(1225579443841.38)).toBe('kpi-value--xs');
  });

  it('debería manejar errores de servicios graciosamente', () => {
    directorioServiceSpy.obtenerTotales.mockReturnValue(throwError(() => new Error('error')));
    directorioServiceSpy.obtenerGrupos.mockReturnValue(throwError(() => new Error('error')));
    directorioServiceSpy.obtenerMotivos.mockReturnValue(throwError(() => new Error('error')));

    component.cargarDashboard();
    component.cargarGrupos();
    component.cargarMotivos();

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

  it('validarRangoFechas y aplicarFiltros no deberían permitir filtrar si fechaHasta es menor a fechaDesde', () => {
    const spyCargar = vi.spyOn(component, 'cargarDashboard');
    component.fechaDesde = '2026-08-01';
    component.fechaHasta = '2026-06-01';

    component.aplicarFiltros();

    expect(component.fechaHasta).toBe('2026-06-01');
    expect(component.errorRangoFechas).toBe('La Fecha Desde no puede ser posterior a la Fecha Hasta');
    expect(component.esRangoFechasValido).toBe(false);
    expect(spyCargar).not.toHaveBeenCalled();
  });

  it('validarRangoFechas debería mantener fechaHasta si es mayor o igual a fechaDesde', () => {
    component.fechaDesde = '2026-08-01';
    component.fechaHasta = '2026-08-31';

    component.validarRangoFechas();

    expect(component.fechaHasta).toBe('2026-08-31');
    expect(component.esRangoFechasValido).toBe(true);
  });

  it('onFechaDesdeChange no debería sobrescribir fechaDesde si es mayor a fechaHasta sino marcar error en rango', () => {
    component.fechaHasta = '2026-06-30';
    component.fechaDesde = '2026-08-01';

    component.onFechaDesdeChange();

    expect(component.fechaDesde).toBe('2026-08-01');
    expect(component.errorRangoFechas).toBe('La Fecha Desde no puede ser posterior a la Fecha Hasta');
    expect(component.esRangoFechasValido).toBe(false);
  });

  it('onFechaHastaChange no debería sobrescribir fechaHasta si es menor a fechaDesde sino marcar error en rango', () => {
    component.fechaDesde = '2026-08-01';
    component.fechaHasta = '2026-06-01';

    component.onFechaHastaChange();

    expect(component.fechaHasta).toBe('2026-06-01');
    expect(component.errorRangoFechas).toBe('La Fecha Desde no puede ser posterior a la Fecha Hasta');
    expect(component.esRangoFechasValido).toBe(false);
  });

  it('validarFormatoFecha debería rechazar años de menos de 4 dígitos o anteriores a 2000', () => {
    expect(component.validarFormatoFecha('0024-01-01')).toContain('anterior a 2000');
    expect(component.validarFormatoFecha('24-01-01')).toContain('4 dígitos');
    expect(component.validarFormatoFecha('2024-02-31')).toContain('Día inválido');
    expect(component.validarFormatoFecha('2024-01-15')).toBeNull();
  });

  it('superaBrechaMaxima48Meses debería detectar si el rango excede los 48 meses', () => {
    // 2 años (24 meses) -> válido
    expect(component.superaBrechaMaxima48Meses('2024-01-01', '2026-01-01')).toBe(false);
    // Exactamente 4 años (48 meses) -> válido
    expect(component.superaBrechaMaxima48Meses('2022-01-01', '2026-01-01')).toBe(false);
    // 48 meses y 1 mes más (49 meses) -> supera
    expect(component.superaBrechaMaxima48Meses('2022-01-01', '2026-02-05')).toBe(true);
    // 6 años -> supera
    expect(component.superaBrechaMaxima48Meses('2020-01-01', '2026-09-30')).toBe(true);
  });

  it('validarFechas debería marcar errorRangoFechas si supera los 48 meses y deshabilitar esRangoFechasValido', () => {
    component.fechaDesde = '2020-01-01';
    component.fechaHasta = '2026-09-30';

    const valido = component.validarFechas();

    expect(valido).toBe(false);
    expect(component.errorRangoFechas).toContain('48 meses');
    expect(component.esRangoFechasValido).toBe(false);
  });

  it('aplicarFiltros no debería llamar a cargarDashboard si las fechas son inválidas', () => {
    const spyCargar = vi.spyOn(component, 'cargarDashboard');
    component.fechaDesde = '2020-01-01';
    component.fechaHasta = '2026-09-30'; // Supera 48 meses

    component.aplicarFiltros();

    expect(spyCargar).not.toHaveBeenCalled();
  });

  it('onFechaBlur con badInput debería marcar error de fecha incompleta o inválida', () => {
    const mockEvent = {
      target: {
        validity: { badInput: true },
        value: ''
      }
    } as any;

    component.onFechaBlur(mockEvent, 'desde');
    expect(component.errorFechaDesde).toBe('Fecha incompleta o inválida');
    expect(component.esRangoFechasValido).toBe(false);
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
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    directorioServiceSpy.obtenerTiposDocumento.mockReturnValue(throwError(() => new Error('err')));
    directorioServiceSpy.obtenerCoberturas.mockReturnValue(throwError(() => new Error('err')));

    component.cargarTiposDocumento();
    component.cargarCoberturas();

    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('cargarCoberturas debería pasar fechas/criterio y resetear selección si la cobertura ya no tiene débitos trabajados', () => {
    component.fechaDesde = '2026-08-01';
    component.fechaHasta = '2026-10-31';
    component.criterioFechaCc = 'periodo';
    component.codigoCoberturaSeleccionada = 'ABAC'; // Supongamos que estaba seleccionada ABAC

    // El backend devuelve solo las coberturas con débitos trabajados (OSDE)
    directorioServiceSpy.obtenerCoberturas.mockReturnValue(of([
      { codigo: 'OSDE', nombre: 'OSDE BINARIO' }
    ]));

    component.cargarCoberturas();

    expect(directorioServiceSpy.obtenerCoberturas).toHaveBeenCalledWith('2026-08-01', '2026-10-31', 'periodo');
    expect(component.coberturas.length).toBe(1);
    expect(component.coberturas[0].codigo).toBe('OSDE');
    // Como ABAC no está entre las trabajadas, debe resetearse a 'TODAS'
    expect(component.codigoCoberturaSeleccionada).toBe('TODAS');

    // Ahora supongamos que el usuario selecciona OSDE y se vuelve a cargar
    component.codigoCoberturaSeleccionada = 'OSDE';
    component.cargarCoberturas();
    expect(component.codigoCoberturaSeleccionada).toBe('OSDE');
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
    f3.componentInstance.cargarDatosSolapa('motivos', true);
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

      // Ordenar por monto (descendente inicial)
      component.ordenarAnalistas('monto');
      expect(component.columnaOrdenAnalista).toBe('monto');
      expect(component.direccionOrdenAnalista).toBe('desc');
      expect(component.analistasDatos[0].analista).toBe('FernandaCortes'); // 40000 vs 7000
      expect(component.analistasDatos[0].motivos[0].motivo).toBe('B-Motivo'); // 35000 vs 5000
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

      expect(directorioServiceSpy.getDesempenoGlobal).toHaveBeenCalledWith('2026-08', '2026-08-01', '2026-08-15', 'periodo');
    });

    it('cargarOperadores debería llamar a getDesempenoOperadores con rango de fechas y poblar operadoresDatos', () => {
      const mockOps = [
        {
          operador: 'Operador Test',
          cantidadRegistros: 10,
          debitosAceptados: 5000,
          debitosRefacturados: 2000,
          totalTramitado: 7000,
          ticketPromedio: 700,
          tasaRecupero: 28.5,
          motivos: []
        }
      ];
      directorioServiceSpy.getDesempenoOperadores = vi.fn().mockReturnValue(of(mockOps));
      component.fechaDesde = '2026-08-01';
      component.fechaHasta = '2026-08-15';

      component.cargarOperadores();

      expect(directorioServiceSpy.getDesempenoOperadores).toHaveBeenCalledWith('2026-08', '2026-08-01', '2026-08-15', 'periodo', 'Ambulatorios');
      expect(component.operadoresDatos.length).toBe(1);
      expect(component.operadoresDatos[0].operador).toBe('Operador Test');
      expect(component.cargandoOperadores).toBe(false);
    });

    it('cambiarTipoRegistroOperador debería actualizar tipoRegistroOperador y recargar operadores filtrando por Internados', () => {
      const mockOpsInt = [
        {
          operador: 'NAGYP',
          cantidadRegistros: 25,
          debitosAceptados: 182995,
          debitosRefacturados: 27324245,
          totalTramitado: 27507240,
          ticketPromedio: 1100290,
          tasaRecupero: 99.3,
          motivos: []
        }
      ];
      directorioServiceSpy.getDesempenoOperadores = vi.fn().mockReturnValue(of(mockOpsInt));
      component.fechaDesde = '2026-08-01';
      component.fechaHasta = '2026-08-31';

      component.cambiarTipoRegistroOperador('Internados');

      expect(component.tipoRegistroOperador).toBe('Internados');
      expect(directorioServiceSpy.getDesempenoOperadores).toHaveBeenCalledWith('2026-08', '2026-08-01', '2026-08-31', 'periodo', 'Internados');
      expect(component.operadoresDatos.length).toBe(1);
      expect(component.operadoresDatos[0].operador).toBe('NAGYP');
    });

    it('debería calcular correctamente los totales consolidados de operadores', () => {
      component.operadoresDatos = [
        {
          operador: 'Operador 1',
          cantidadRegistros: 10,
          debitosAceptados: 3000,
          debitosRefacturados: 7000,
          totalTramitado: 10000,
          ticketPromedio: 1000,
          tasaRecupero: 70,
          motivos: []
        },
        {
          operador: 'Operador 2',
          cantidadRegistros: 5,
          debitosAceptados: 2000,
          debitosRefacturados: 3000,
          totalTramitado: 5000,
          ticketPromedio: 1000,
          tasaRecupero: 60,
          motivos: []
        }
      ];

      expect(component.totalCasosOperadores).toBe(15);
      expect(component.totalMontoDebitadoOperadores).toBe(15000);
      expect(component.totalAceptadosOperadores).toBe(5000);
      expect(component.totalRefacturadosOperadores).toBe(10000);
      expect(component.ticketPromedioGlobalOperadores).toBe(1000);
      expect(component.tasaRecuperoGlobalOperadores).toBeCloseTo(66.666, 2);
    });

    it('debería manejar casos de borde (cero casos / montos) en totales consolidados de operadores sin error', () => {
      component.operadoresDatos = [];
      expect(component.totalCasosOperadores).toBe(0);
      expect(component.totalMontoDebitadoOperadores).toBe(0);
      expect(component.totalAceptadosOperadores).toBe(0);
      expect(component.totalRefacturadosOperadores).toBe(0);
      expect(component.ticketPromedioGlobalOperadores).toBe(0);
      expect(component.tasaRecuperoGlobalOperadores).toBe(0);
    });

    it('debería filtrar por busquedaTextoOperador y actualizar tieneFiltroOperadorActivo', () => {
      component.operadoresDatos = [
        { operador: 'Carlos Perez', cantidadRegistros: 10, totalTramitado: 1000, debitosAceptados: 0, debitosRefacturados: 1000, diferencia: 0, ticketPromedio: 100, tasaRecupero: 100, motivos: [] },
        { operador: 'Ana Lopez', cantidadRegistros: 5, totalTramitado: 500, debitosAceptados: 0, debitosRefacturados: 500, diferencia: 0, ticketPromedio: 100, tasaRecupero: 100, motivos: [] }
      ];
      component.filtroOperadorSeleccionado = 'TODOS';
      component.codigoCoberturaSeleccionada = 'TODAS';
      component.busquedaTextoOperador = '';

      expect(component.tieneFiltroOperadorActivo).toBe(false);
      expect(component.operadoresFiltrados.length).toBe(2);

      component.busquedaTextoOperador = 'Carlos';
      expect(component.tieneFiltroOperadorActivo).toBe(true);
      expect(component.operadoresFiltrados.length).toBe(1);
      expect(component.operadoresFiltrados[0].operador).toBe('Carlos Perez');

      component.busquedaTextoOperador = '';
      expect(component.tieneFiltroOperadorActivo).toBe(false);
      expect(component.operadoresFiltrados.length).toBe(2);
    });

    it('debería calcular correctamente la suma de financiadores de analistas (4 + 11 = 15)', () => {
      component.analistasDatos = [
        {
          analista: 'FernandaCortes',
          cantidadFinanciadores: 11,
          cantidadRegistros: 447,
          debitosAceptados: 27260585,
          debitosRefacturados: 72137469,
          totalTramitado: 107859656,
          ticketPromedio: 241297,
          tasaRecupero: 66.8,
          diferencia: 8461603,
          motivos: []
        },
        {
          analista: 'PaolaBurniego',
          cantidadFinanciadores: 4,
          cantidadRegistros: 81,
          debitosAceptados: 2489699,
          debitosRefacturados: 20420919,
          totalTramitado: 23121790,
          ticketPromedio: 285454,
          tasaRecupero: 88.3,
          diferencia: 211172,
          motivos: []
        }
      ];

      expect(component.totalFinanciadoresAnalistas).toBe(15);
      expect(component.totalCasosAnalistas).toBe(528);
      expect(component.totalMontoDebitadoAnalistas).toBe(130981446);
    });

    it('debería calcular correctamente los totales consolidados de médicos', () => {
      component.medicosDatos = [
        {
          medico: 'ROSSINI GUILLERMO JULIAN',
          cantidadRegistros: 26,
          debitosAceptados: 6683109.29,
          debitosRefacturados: 0,
          totalTramitado: 6683109.29,
          ticketPromedio: 257042.67,
          tasaRecupero: 0,
          motivos: [
            { motivo: 'Falta documentación', casos: 10, montoDebitado: 2000000, aceptado: 2000000, refacturado: 0, financiadores: [] },
            { motivo: 'Fuera de término', casos: 16, montoDebitado: 4683109.29, aceptado: 4683109.29, refacturado: 0, financiadores: [] }
          ]
        },
        {
          medico: 'REILLY JORGE ALBERTO',
          cantidadRegistros: 4,
          debitosAceptados: 108577.93,
          debitosRefacturados: 5737707.87,
          totalTramitado: 5846285.80,
          ticketPromedio: 1461571.45,
          tasaRecupero: 98.1,
          motivos: [
            { motivo: 'Falta documentación', casos: 2, montoDebitado: 3000000, aceptado: 0, refacturado: 3000000, financiadores: [] },
            { motivo: 'Falta autorización', casos: 2, montoDebitado: 2846285.80, aceptado: 108577.93, refacturado: 2737707.87, financiadores: [] }
          ]
        }
      ];

      expect(component.totalMotivosMedicos).toBe(4); // 2 motivos + 2 motivos = 4 asignaciones en total
      expect(component.totalCasosMedicos).toBe(30);
      expect(component.totalMontoDebitadoMedicos).toBeCloseTo(12529395.09, 2);
      expect(component.totalAceptadosMedicos).toBeCloseTo(6791687.22, 2);
      expect(component.totalRefacturadosMedicos).toBeCloseTo(5737707.87, 2);
      expect(component.ticketPromedioGlobalMedicos).toBeCloseTo(12529395.09 / 30, 2);
      expect(component.tasaRecuperoGlobalMedicos).toBeCloseTo((5737707.87 * 100) / 12529395.09, 2);
    });

    it('debería manejar casos de borde (cero casos / montos) en totales consolidados de médicos sin error', () => {
      component.medicosDatos = [];
      expect(component.totalMotivosMedicos).toBe(0);
      expect(component.totalCasosMedicos).toBe(0);
      expect(component.totalMontoDebitadoMedicos).toBe(0);
      expect(component.totalAceptadosMedicos).toBe(0);
      expect(component.totalRefacturadosMedicos).toBe(0);
      expect(component.ticketPromedioGlobalMedicos).toBe(0);
      expect(component.tasaRecuperoGlobalMedicos).toBe(0);
    });

    it('los selectores de cobertura y tipo de comprobante deben estar deshabilitados en la solapa analistas', () => {
      component.solapaActiva = 'analistas';
      (component as any).cdr.detectChanges();

      const selectCobertura = fixture.nativeElement.querySelector('#select-cobertura');
      const selectTipoDoc = fixture.nativeElement.querySelector('#select-tipo-doc');

      expect(selectCobertura.disabled).toBe(true);
      expect(selectTipoDoc.disabled).toBe(true);

      // En otra solapa deben estar habilitados
      component.solapaActiva = 'tablero';
      (component as any).cdr.detectChanges();
      expect(selectCobertura.disabled).toBe(false);
      expect(selectTipoDoc.disabled).toBe(false);
    });

    it('el selector de cobertura debe estar habilitado y el de tipo de comprobante deshabilitado en la solapa medicos', () => {
      component.solapaActiva = 'medicos';
      fixture.detectChanges();

      const selectCobertura = fixture.nativeElement.querySelector('#select-cobertura');
      const selectTipoDoc = fixture.nativeElement.querySelector('#select-tipo-doc');

      expect(selectCobertura.disabled).toBe(false);
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

    it('ordenarMedicos por motivos debe ordenar por cantidad de motivos', () => {
      component.ordenarMedicos('motivos');
      expect(component.columnaOrdenMedico).toBe('motivos');
      expect(component.direccionOrdenMedico).toBe('desc');
      expect(component.medicosDatos[0].medico).toBe('Dr. Perez'); // 2 motivos vs 1 motivo

      component.ordenarMedicos('motivos');
      expect(component.direccionOrdenMedico).toBe('asc');
      expect(component.medicosDatos[0].medico).toBe('Dr. Alvarez'); // 1 motivo vs 2 motivos
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

    it('ordenarMedicos por diferencia debe ordenar de mayor a menor y alternar a menor a mayor', () => {
      component.medicosDatos[0].diferencia = 15000;
      component.medicosDatos[1].diferencia = 5000;

      component.ordenarMedicos('diferencia');
      expect(component.columnaOrdenMedico).toBe('diferencia');
      expect(component.direccionOrdenMedico).toBe('desc');
      expect(component.medicosDatos[0].medico).toBe('Dr. Perez');
      expect(component.medicosDatos[1].medico).toBe('Dr. Alvarez');

      component.ordenarMedicos('diferencia');
      expect(component.direccionOrdenMedico).toBe('asc');
      expect(component.medicosDatos[0].medico).toBe('Dr. Alvarez');
      expect(component.medicosDatos[1].medico).toBe('Dr. Perez');
    });

    it('debe calcular correctamente totalDiferenciaMedicos', () => {
      component.medicosDatos = [
        {
          medico: 'Dr. Uno',
          cantidadRegistros: 10,
          totalTramitado: 100000,
          debitosAceptados: 30000,
          debitosRefacturados: 50000,
          ticketPromedio: 10000,
          tasaRecupero: 50,
          motivos: []
        }
      ];
      component.filtroMedicoSeleccionado = 'TODOS';
      expect(component.totalDiferenciaMedicos).toBe(20000);
    });

    it('cuando un médico está desplegado, ordenar por diferencia debe ordenar sus motivos por diferencia', () => {
      component.medicosDatos[0].expanded = true;
      component.medicosDatos[0].motivos[0].diferencia = 5000;
      component.medicosDatos[0].motivos[1].diferencia = 15000;

      component.ordenarMedicos('diferencia');
      expect(component.medicosDatos[0].motivos[0].motivo).toBe('Autorización'); // 15000 desc
      expect(component.medicosDatos[0].motivos[1].motivo).toBe('Falta firma');   // 5000
    });

    it('cuando dentro de un médico y motivo desplegado, ordenar por diferencia debe ordenar financiadores por diferencia', () => {
      component.medicosDatos[0].expanded = true;
      component.medicosDatos[0].motivos[0].expanded = true;
      component.medicosDatos[0].motivos[0].financiadores = [
        { financiador: 'OSDE', casos: 10, monto: 15000, montoDebitado: 15000, aceptado: 10000, refacturado: 2000, diferencia: 3000 } as any,
        { financiador: 'SWISS', casos: 20, monto: 25000, montoDebitado: 25000, aceptado: 10000, refacturado: 5000, diferencia: 10000 } as any
      ];

      component.ordenarMedicos('diferencia');
      expect(component.medicosDatos[0].motivos[0].financiadores[0].financiador).toBe('SWISS'); // 10000 desc
      expect(component.medicosDatos[0].motivos[0].financiadores[1].financiador).toBe('OSDE');  // 3000
    });

    it('cuando un médico está desplegado, ordenar debe ordenar los motivos del médico sin mover la lista de médicos', () => {
      component.medicosDatos[0].expanded = true;
      component.ordenarMedicos('casos');
      expect(component.medicosDatos[0].medico).toBe('Dr. Perez');
      expect(component.medicosDatos[1].medico).toBe('Dr. Alvarez');
      expect(component.medicosDatos[0].motivos[0].motivo).toBe('Falta firma');
      expect(component.medicosDatos[0].motivos[1].motivo).toBe('Autorización');

      component.ordenarMedicos('casos');
      expect(component.medicosDatos[0].medico).toBe('Dr. Perez');
      expect(component.medicosDatos[0].motivos[0].motivo).toBe('Autorización');
      expect(component.medicosDatos[0].motivos[1].motivo).toBe('Falta firma');
    });

    it('cuando dentro de un médico desplegado hay un motivo desplegado, debe ordenar el tercer nivel (financiadores)', () => {
      component.medicosDatos[0].expanded = true;
      component.medicosDatos[0].motivos[0].expanded = true;
      component.medicosDatos[0].motivos[0].financiadores = [
        { financiador: 'OSDE', casos: 10, monto: 15000, montoDebitado: 15000, aceptado: 10000, refacturado: 5000 } as any,
        { financiador: 'SWISS', casos: 20, monto: 25000, montoDebitado: 25000, aceptado: 20000, refacturado: 5000 } as any
      ];

      component.ordenarMedicos('casos');
      expect(component.medicosDatos[0].medico).toBe('Dr. Perez');
      expect(component.medicosDatos[0].motivos[0].financiadores[0].financiador).toBe('SWISS');
      expect(component.medicosDatos[0].motivos[0].financiadores[1].financiador).toBe('OSDE');
    });
  });

  describe('Filtros en Solapa Médicos', () => {
    const mockMedicos = [
      {
        medico: 'Dr. Perez',
        cantidadRegistros: 50,
        debitosAceptados: 50000,
        debitosRefacturados: 20000,
        totalTramitado: 70000,
        ticketPromedio: 1400,
        tasaRecupero: 28.5,
        motivos: [
          {
            motivo: 'Falta firma',
            casos: 30,
            montoDebitado: 40000,
            aceptado: 30000,
            refacturado: 10000,
            financiadores: [
              { financiador: 'OSDE', casos: 20, monto: 25000, aceptado: 20000, refacturado: 5000 },
              { financiador: 'SWISS', casos: 10, monto: 15000, aceptado: 10000, refacturado: 5000 }
            ]
          },
          {
            motivo: 'Autorización',
            casos: 20,
            montoDebitado: 30000,
            aceptado: 20000,
            refacturado: 10000,
            financiadores: [
              { financiador: 'OSDE', casos: 20, monto: 30000, aceptado: 20000, refacturado: 10000 }
            ]
          }
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
          {
            motivo: 'Prescripción vencida',
            casos: 120,
            montoDebitado: 200000,
            aceptado: 120000,
            refacturado: 80000,
            financiadores: [
              { financiador: 'SWISS', casos: 120, monto: 200000, aceptado: 120000, refacturado: 80000 }
            ]
          }
        ]
      }
    ];

    beforeEach(() => {
      component.medicosDatos = [...mockMedicos];
      component.filtroMedicoSeleccionado = 'TODOS';
      component.codigoCoberturaSeleccionada = 'TODAS';
      component.coberturas = [
        { codigo: 'OSDE', nombre: 'OSDE' },
        { codigo: 'SWISS', nombre: 'SWISS MEDICAL' }
      ];
    });

    it('debería retornar nombres únicos y ordenados en listaNombresMedicos', () => {
      expect(component.listaNombresMedicos).toEqual(['Dr. Alvarez', 'Dr. Perez']);
    });

    it('debería retornar todos los médicos cuando los filtros son TODOS y TODAS', () => {
      expect(component.medicosFiltrados.length).toBe(2);
    });

    it('debería filtrar específicamente por médico seleccionado', () => {
      component.filtroMedicoSeleccionado = 'Dr. Perez';
      expect(component.medicosFiltrados.length).toBe(1);
      expect(component.medicosFiltrados[0].medico).toBe('Dr. Perez');
    });

    it('debería filtrar por Institución / Cobertura y recalcular los desgloses', () => {
      component.codigoCoberturaSeleccionada = 'OSDE';
      expect(component.medicosFiltrados.length).toBe(1);
      const drPerezFiltrado = component.medicosFiltrados[0];
      expect(drPerezFiltrado.medico).toBe('Dr. Perez');
      expect(drPerezFiltrado.cantidadRegistros).toBe(40);
      expect(drPerezFiltrado.motivos.length).toBe(2);
      expect(drPerezFiltrado.motivos[0].financiadores.length).toBe(1);
      expect(drPerezFiltrado.motivos[0].financiadores[0].financiador).toBe('OSDE');
    });

    it('debería combinar ambos filtros (Médico e Institución)', () => {
      component.filtroMedicoSeleccionado = 'Dr. Alvarez';
      component.codigoCoberturaSeleccionada = 'SWISS';
      expect(component.medicosFiltrados.length).toBe(1);
      expect(component.medicosFiltrados[0].medico).toBe('Dr. Alvarez');

      component.codigoCoberturaSeleccionada = 'OSDE';
      expect(component.medicosFiltrados.length).toBe(0);
    });

    it('debería limpiar el filtro con limpiarFiltroMedico', () => {
      component.filtroMedicoSeleccionado = 'Dr. Alvarez';
      component.limpiarFiltroMedico();
      expect(component.filtroMedicoSeleccionado).toBe('TODOS');
      expect(component.medicosFiltrados.length).toBe(2);
    });

    it('debería restablecer todos los filtros con restablecerFiltrosMedicos', () => {
      component.filtroMedicoSeleccionado = 'Dr. Alvarez';
      component.codigoCoberturaSeleccionada = 'SWISS';
      component.restablecerFiltrosMedicos();
      expect(component.filtroMedicoSeleccionado).toBe('TODOS');
      expect(component.codigoCoberturaSeleccionada).toBe('TODAS');
      expect(component.medicosFiltrados.length).toBe(2);
    });

    it('debería restablecer el filtro a TODOS si el médico seleccionado no existe en nuevos datos', () => {
      directorioServiceSpy.getDesempenoGlobal = vi.fn().mockReturnValue(of({
        analistas: [],
        medicos: [mockMedicos[0]],
        operadores: []
      }));

      component.filtroMedicoSeleccionado = 'Dr. Alvarez';
      component.cargarDesempenoOperativo();

      expect(component.filtroMedicoSeleccionado).toBe('TODOS');
    });

    it('debería filtrar por busquedaTextoMedico y actualizar tieneFiltroMedicoActivo', () => {
      expect(component.tieneFiltroMedicoActivo).toBe(false);
      component.busquedaTextoMedico = 'Perez';
      expect(component.tieneFiltroMedicoActivo).toBe(true);
      expect(component.medicosFiltrados.length).toBe(1);
      expect(component.medicosFiltrados[0].medico).toBe('Dr. Perez');

      component.busquedaTextoMedico = '';
      expect(component.tieneFiltroMedicoActivo).toBe(false);
      expect(component.medicosFiltrados.length).toBe(2);
    });
  });

  describe('Filtro por Categorías de Motivos de Débito', () => {
    it('obtenerCategoriaDeMotivo debería categorizar correctamente motivos conocidos y variantes', () => {
      expect(component.obtenerCategoriaDeMotivo('Facturación duplicada')).toBe('1. ADMINISTRATIVOS');
      expect(component.obtenerCategoriaDeMotivo('Falta de autorización')).toBe('1. ADMINISTRATIVOS');
      expect(component.obtenerCategoriaDeMotivo('Demora en resolución quirúrgica')).toBe('2. MÉDICOS / AUDITORÍA');
      expect(component.obtenerCategoriaDeMotivo('Diferencia de criterio medico/prestaciones no ju')).toBe('2. MÉDICOS / AUDITORÍA');
      expect(component.obtenerCategoriaDeMotivo('Diferencia de aranceles')).toBe('3. CONTRACTUALES / NOMENCLADOR');
      expect(component.obtenerCategoriaDeMotivo('Debito por normas operativas')).toBe('3. CONTRACTUALES / NOMENCLADOR');
      expect(component.obtenerCategoriaDeMotivo('Falta firma paciente')).toBe('4. OPERATIVOS Y DOCUMENTALES (administrativo)');
      expect(component.obtenerCategoriaDeMotivo('Falta firma profesional')).toBe('4. OPERATIVOS Y DOCUMENTALES (administrativo)');
      expect(component.obtenerCategoriaDeMotivo('El costo de los impuestos en el proceso de la refactura superan el importe posible de cobro de la misma')).toBe('5. AJUSTES Y GESTIÓN COMERCIAL');
      expect(component.obtenerCategoriaDeMotivo('Borrar')).toBe('6. OTROS / SIN CLASIFICAR');
      expect(component.obtenerCategoriaDeMotivo('')).toBe('6. OTROS / SIN CLASIFICAR');
    });

    it('calcularCategoriasMotivosDisponibles y aplicarFiltroCategoriaMotivos deben filtrar y recalcular KPIs', () => {
      component.motivosDebitoOriginal = [
        { motivo: 'Facturación duplicada', montoTotal: 1000, cantidadCasos: 2, montoAceptado: 400, montoRefacturado: 600, porcentaje: 50 },
        { motivo: 'Demora en resolución quirúrgica', montoTotal: 1000, cantidadCasos: 1, montoAceptado: 1000, montoRefacturado: 0, porcentaje: 50 }
      ];
      component.totalElementsMotivos = 2;
      component.totalDebitadoGeneralCalculado = 2000;
      component.categoriaMotivoSeleccionada = 'TODAS';

      component.calcularCategoriasMotivosDisponibles();
      expect(component.categoriasMotivoDisponibles.length).toBe(2);
      expect(component.categoriasMotivoDisponibles.some(c => c.categoria === '1. ADMINISTRATIVOS' && c.cantidad === 1)).toBe(true);
      expect(component.categoriasMotivoDisponibles.some(c => c.categoria === '2. MÉDICOS / AUDITORÍA' && c.cantidad === 1)).toBe(true);

      // Con TODAS
      component.aplicarFiltroCategoriaMotivos();
      expect(component.motivosDebito.length).toBe(2);
      expect(component.totalDebitadoMotivos).toBe(2000);
      expect(component.totalCasosAfectadosMotivos).toBe(3);
      expect(component.debitoAceptadoPerdidaMotivos).toBe(1400);
      expect(component.totalRefacturadoMotivos).toBe(600);
      expect(component.motivosIdentificadosCount).toBe(2);

      // Filtrar por 2. MÉDICOS / AUDITORÍA
      component.categoriaMotivoSeleccionada = '2. MÉDICOS / AUDITORÍA';
      component.aplicarFiltroCategoriaMotivos();
      expect(component.motivosDebito.length).toBe(1);
      expect(component.motivosDebito[0].motivo).toBe('Demora en resolución quirúrgica');
      expect(component.motivosDebito[0].porcentaje).toBe(100);
      expect(component.totalDebitadoMotivos).toBe(1000);
      expect(component.totalCasosAfectadosMotivos).toBe(1);
      expect(component.debitoAceptadoPerdidaMotivos).toBe(1000);
      expect(component.totalRefacturadoMotivos).toBe(0);
      expect(component.motivosIdentificadosCount).toBe(1);

      // Limpiar filtro
      component.limpiarFiltroCategoriaMotivo();
      expect(component.categoriaMotivoSeleccionada).toBe('TODAS');
      expect(component.motivosDebito.length).toBe(2);
      expect(component.totalDebitadoMotivos).toBe(2000);
    });

    it('renderizarParetoMotivos debe actualizar motivosChartData según la categoría seleccionada', () => {
      component.motivosDebitoOriginal = [
        { motivo: 'Facturación duplicada', montoTotal: 1000, cantidadCasos: 2, montoAceptado: 400, montoRefacturado: 600, porcentaje: 50 },
        { motivo: 'Demora en resolución quirúrgica', montoTotal: 1000, cantidadCasos: 1, montoAceptado: 1000, montoRefacturado: 0, porcentaje: 50 }
      ];
      component.motivosDebito = [...component.motivosDebitoOriginal];
      component.rawDatasetsPareto = [
        { tituloDataset: 'Refacturado', puntos: [{ etiqueta: 'Facturación duplicada', valor: 600 }] },
        { tituloDataset: 'Pérdida', puntos: [{ etiqueta: 'Facturación duplicada', valor: 400 }] },
        { tituloDataset: 'Diferencia', puntos: [{ etiqueta: 'Facturación duplicada', valor: 0 }] }
      ];

      component.categoriaMotivoSeleccionada = 'TODAS';
      component.renderizarParetoMotivos();
      expect(component.motivosChartData.labels?.length).toBe(1);

      component.categoriaMotivoSeleccionada = '2. MÉDICOS / AUDITORÍA';
      component.aplicarFiltroCategoriaMotivos();
      component.renderizarParetoMotivos();
      expect(component.motivosChartData.labels?.length).toBe(1);
      expect(component.motivosChartData.labels?.[0]).toBe('Demora en resolución quirúrgica');
      expect(component.motivosChartData.datasets[1].data[0]).toBe(1000); // Pérdida
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

    it('debería filtrar trazabilidad por Letra, Punto de Venta y Número (ignorando ceros a la izquierda) y consultar al backend', () => {
      component.trazabilidadDatos = [
        {
          idPrestacion: 'FAC A0030-00005364',
          descripcion: 'Factura 5364',
          financiador: 'OSAP',
          medico: 'No especificado',
          montoFacturadoOriginal: 2463499.05,
          totalDebitado: 0,
          historialEventos: [],
          expanded: false
        },
        {
          idPrestacion: 'FAC B0031-00004320',
          descripcion: 'Factura 4320',
          financiador: 'SPF',
          medico: 'Dra. Gianninoto',
          montoFacturadoOriginal: 4919257.91,
          totalDebitado: 0,
          historialEventos: [],
          expanded: false
        }
      ];

      // Filtrar por Letra A
      component.filtroTrazabilidadLetra = 'a';
      expect(component.trazabilidadFiltrada.length).toBe(1);
      expect(component.trazabilidadFiltrada[0].idPrestacion).toBe('FAC A0030-00005364');
      expect(component.trazabilidadFiltrada[0].expanded).toBe(true);

      // Filtrar por Punto de Venta 31 y Letra B
      component.filtroTrazabilidadLetra = 'B';
      component.filtroTrazabilidadPtoVta = '31';
      expect(component.trazabilidadFiltrada.length).toBe(1);
      expect(component.trazabilidadFiltrada[0].idPrestacion).toBe('FAC B0031-00004320');

      // Filtrar por Número sin ceros a la izquierda
      component.filtroTrazabilidadLetra = '';
      component.filtroTrazabilidadPtoVta = 'TODOS';
      component.filtroTrazabilidadNumero = '5364';
      expect(component.trazabilidadFiltrada.length).toBe(1);
      expect(component.trazabilidadFiltrada[0].idPrestacion).toBe('FAC A0030-00005364');

      // Búsqueda explícita en backend respetando fechas y financiador
      component.codigoCoberturaSeleccionada = '431';
      component.fechaDesde = '2026-06-01';
      component.fechaHasta = '2026-10-31';
      component.filtroTrazabilidadLetra = 'A';
      component.filtroTrazabilidadPtoVta = '30';
      component.filtroTrazabilidadNumero = '00005364';
      directorioServiceSpy.getTrazabilidad = vi.fn().mockReturnValue(of([component.trazabilidadDatos[0]]));

      component.buscarTrazabilidadFactura();
      expect(directorioServiceSpy.getTrazabilidad).toHaveBeenCalledWith(
        '431', undefined, undefined, '2026-06-01', '2026-10-31', 30, 'A', 5364
      );
    });

    it('paginación de trazabilidad debe paginar y navegar correctamente', () => {
      component.trazabilidadDatos = Array.from({ length: 55 }, (_, i) => ({
        idPrestacion: `FAC-${i + 1}`,
        descripcion: `Detalle ${i + 1}`,
        financiador: 'OSDE',
        medico: 'Dr. Test',
        montoFacturadoOriginal: 1000,
        totalDebitado: 0,
        historialEventos: []
      }));
      component.trazabilidadItemsPorPagina = 25;
      component.trazabilidadPaginaActual = 1;

      expect(component.totalPaginasTrazabilidad).toBe(3);
      expect(component.trazabilidadDatosPaginados.length).toBe(25);
      expect(component.trazabilidadDatosPaginados[0].idPrestacion).toBe('FAC-1');

      component.cambiarPaginaTrazabilidad(2);
      expect(component.trazabilidadPaginaActual).toBe(2);
      expect(component.trazabilidadDatosPaginados.length).toBe(25);
      expect(component.trazabilidadDatosPaginados[0].idPrestacion).toBe('FAC-26');

      component.cambiarPaginaTrazabilidad(3);
      expect(component.trazabilidadPaginaActual).toBe(3);
      expect(component.trazabilidadDatosPaginados.length).toBe(5);

      // Fuera de rango
      component.cambiarPaginaTrazabilidad(99);
      expect(component.trazabilidadPaginaActual).toBe(3);

      component.onTrazabilidadItemsPorPaginaChange(50);
      expect(component.trazabilidadItemsPorPagina).toBe(50);
      expect(component.trazabilidadPaginaActual).toBe(1);
      expect(component.totalPaginasTrazabilidad).toBe(2);
      expect(component.trazabilidadDatosPaginados.length).toBe(50);
    });
  });

  describe('Filtros de Fecha Dinámicos (Opción D)', () => {
    it('debería mostrar "Período Desde" y "Período Hasta" en tablero, motivos y cuenta-corriente', () => {
      component.solapaActiva = 'tablero';
      expect(component.etiquetaFechaDesde).toBe('Período Desde');
      expect(component.etiquetaFechaHasta).toBe('Período Hasta');

      component.solapaActiva = 'motivos';
      expect(component.etiquetaFechaDesde).toBe('Período Desde');
      expect(component.etiquetaFechaHasta).toBe('Período Hasta');

      component.solapaActiva = 'cuenta-corriente';
      expect(component.etiquetaFechaDesde).toBe('Período Desde');
      expect(component.etiquetaFechaHasta).toBe('Período Hasta');
    });

    it('debería mostrar "Fecha Desde" y "Fecha Hasta" en solapas de fecha de emisión o gestión', () => {
      component.solapaActiva = 'trazabilidad';
      expect(component.etiquetaFechaDesde).toBe('Fecha Desde');
      expect(component.etiquetaFechaHasta).toBe('Fecha Hasta');

      component.solapaActiva = 'analistas';
      expect(component.etiquetaFechaDesde).toBe('Fecha Desde');
      expect(component.etiquetaFechaHasta).toBe('Fecha Hasta');

      component.solapaActiva = 'bucles';
      expect(component.etiquetaFechaDesde).toBe('Fecha Desde');
      expect(component.etiquetaFechaHasta).toBe('Fecha Hasta');
    });

    it('debería identificar correctamente las solapas donde el filtro de fecha está deshabilitado', () => {
      component.solapaActiva = 'cuenta-corriente';
      expect(component.esFiltroFechaDeshabilitado).toBe(false);

      component.solapaActiva = 'tiempos-cobranza';
      expect(component.esFiltroFechaDeshabilitado).toBe(false);

      component.solapaActiva = 'matriz-cobranzas';
      expect(component.esFiltroFechaDeshabilitado).toBe(true);

      component.solapaActiva = 'tablero';
      expect(component.esFiltroFechaDeshabilitado).toBe(false);

      component.solapaActiva = 'motivos';
      expect(component.esFiltroFechaDeshabilitado).toBe(false);

      component.solapaActiva = 'trazabilidad';
      expect(component.esFiltroFechaDeshabilitado).toBe(false);
    });

    it('debería deshabilitar el filtro de Tipo de Comprobante en analistas, bucles, medicos, matriz-cobranzas y tiempos-cobranza', () => {
      component.solapaActiva = 'tablero';
      expect(component.esFiltroTipoDocDeshabilitado).toBe(false);

      component.solapaActiva = 'cuenta-corriente';
      expect(component.esFiltroTipoDocDeshabilitado).toBe(false);

      component.solapaActiva = 'matriz-cobranzas';
      expect(component.esFiltroTipoDocDeshabilitado).toBe(true);

      component.solapaActiva = 'analistas';
      expect(component.esFiltroTipoDocDeshabilitado).toBe(true);

      component.solapaActiva = 'bucles';
      expect(component.esFiltroTipoDocDeshabilitado).toBe(true);

      component.solapaActiva = 'medicos';
      expect(component.esFiltroTipoDocDeshabilitado).toBe(true);

      component.solapaActiva = 'tiempos-cobranza';
      expect(component.esFiltroTipoDocDeshabilitado).toBe(true);
    });

    it('debería proveer la descripción contextual adecuada para cada solapa en el tooltip', () => {
      component.solapaActiva = 'tablero';
      expect(component.tooltipFiltroFecha).toContain('período prestacional');

      component.solapaActiva = 'motivos';
      expect(component.tooltipFiltroFecha).toContain('período prestacional');

      component.solapaActiva = 'cuenta-corriente';
      expect(component.tooltipFiltroFecha).toContain('períodos prestacionales visualizados');

      component.solapaActiva = 'analistas';
      expect(component.tooltipFiltroFecha).toContain('auditoría o gestión');

      component.solapaActiva = 'bucles';
      expect(component.tooltipFiltroFecha).toContain('fecha de emisión cronológica');

      component.solapaActiva = 'tiempos-cobranza';
      expect(component.tooltipFiltroFecha).toContain('período prestacional o fecha de emisión');
    });

    it('debería invocar getTiemposCobranza con la cobertura seleccionada y sin filtro de tipoDoc al estar deshabilitado en tiempos-cobranza', () => {
      component.solapaActiva = 'tiempos-cobranza';
      component.codigoCoberturaSeleccionada = 'OSDE';
      component.tipoDocSeleccionado = 'FC';
      component.fechaDesde = '2026-01-01';
      component.fechaHasta = '2026-06-30';

      component.aplicarFiltros();

      expect(directorioServiceSpy.getTiemposCobranza).toHaveBeenCalledWith(
        'OSDE',
        undefined,
        '2026-01-01',
        '2026-06-30'
      );
      expect(component.tiemposCobranzaDatos?.dsoGlobal).toBe(150);
      expect(component.tiemposCobranzaDatos?.saldoTotalMora).toBe(10000);
    });

    it('debería invocar getTiemposCobranza respetando las fechas seleccionadas en el dashboard con piso en 2025-01-01', () => {
      component.solapaActiva = 'tablero';
      component.codigoCoberturaSeleccionada = 'TODAS';
      component.tipoDocSeleccionado = 'FCA';
      component.fechaDesde = '2026-09-01';
      component.fechaHasta = '2026-09-30';

      component.seleccionarSolapa('tiempos-cobranza');

      expect(directorioServiceSpy.getTiemposCobranza).toHaveBeenCalledWith(
        undefined,
        undefined,
        '2026-09-01',
        '2026-09-30'
      );
    });
  });

  describe('Selección de institución desde gráfico Donut de Distribución de Cartera', () => {
    beforeEach(() => {
      component.coberturas = [
        { codigo: 'OSDE', nombre: 'OSDE BINARIO' },
        { codigo: 'SWISS', nombre: 'SWISS MEDICAL' },
        { codigo: '446', nombre: 'O.S.SERVICIO PENITENCIARIO FEDERAL' }
      ];
      directorioServiceSpy.obtenerCoberturas.mockReturnValue(of(component.coberturas));
      component.puntosDonut = [
        { etiqueta: '446 - O.S.SERVICIO PENITENCIARIO FEDERAL', saldo: 500000 },
        { etiqueta: 'OSDE - OSDE BINARIO', saldo: 300000 }
      ];
      component.distribucionChartData.labels = [
        '446 - O.S.SERVICIO PENITENCIARIO FEDERAL',
        'OSDE - OSDE BINARIO'
      ];
    });

    it('resolverCodigoCobertura debería resolver códigos por coincidencia directa, etiqueta con guión o nombre', () => {
      expect(component.resolverCodigoCobertura('OSDE')).toBe('OSDE');
      expect(component.resolverCodigoCobertura('446 - O.S.SERVICIO PENITENCIARIO FEDERAL')).toBe('446');
      expect(component.resolverCodigoCobertura('SWISS MEDICAL')).toBe('SWISS');
      expect(component.resolverCodigoCobertura('810 - GRUPO DDM S.A.')).toBe('810');
      expect(component.resolverCodigoCobertura('')).toBeNull();
      expect(component.resolverCodigoCobertura('S/C - Sin cobertura')).toBeNull();
    });

    it('seleccionarInstitucionDesdeGrafico debería actualizar codigoCoberturaSeleccionada y disparar aplicarFiltros', () => {
      const aplicarFiltrosSpy = vi.spyOn(component, 'aplicarFiltros');
      component.codigoCoberturaSeleccionada = 'TODAS';

      component.seleccionarInstitucionDesdeGrafico('446 - O.S.SERVICIO PENITENCIARIO FEDERAL');

      expect(component.codigoCoberturaSeleccionada).toBe('446');
      expect(aplicarFiltrosSpy).toHaveBeenCalled();
    });

    it('seleccionarInstitucionDesdeGrafico con índice debería usar el puntoDonut correspondiente', () => {
      const aplicarFiltrosSpy = vi.spyOn(component, 'aplicarFiltros');
      component.codigoCoberturaSeleccionada = 'TODAS';

      component.seleccionarInstitucionDesdeGrafico('', 1);

      expect(component.codigoCoberturaSeleccionada).toBe('OSDE');
      expect(aplicarFiltrosSpy).toHaveBeenCalled();
    });

    it('seleccionarInstitucionDesdeGrafico no debería reaplicar filtros si la institución ya está seleccionada', () => {
      const aplicarFiltrosSpy = vi.spyOn(component, 'aplicarFiltros');
      component.codigoCoberturaSeleccionada = '446';

      component.seleccionarInstitucionDesdeGrafico('446 - O.S.SERVICIO PENITENCIARIO FEDERAL');

      expect(aplicarFiltrosSpy).not.toHaveBeenCalled();
    });

    it('onDistribucionChartClick debería procesar el elemento activo y seleccionar la institución', () => {
      const seleccionarSpy = vi.spyOn(component, 'seleccionarInstitucionDesdeGrafico');

      component.onDistribucionChartClick({
        active: [{ index: 0 }]
      });

      expect(seleccionarSpy).toHaveBeenCalledWith('446 - O.S.SERVICIO PENITENCIARIO FEDERAL', 0);
    });
  });

  describe('Ordenamiento de Resumen de Cartera y Balance Financiero', () => {
    beforeEach(() => {
      component.balanceFinanciadores = [
        {
          financiador: '782 - MEDICINA PREPAGA HOMINIS S.A.',
          facturacionFc: 2857091,
          incrementosNd: 0,
          debitosNc: 162788,
          refacturadoNd: 56638,
          cobradoRc: 1537297,
          saldoPendiente: 1213643,
          _originalIndex: 0
        },
        {
          financiador: '446 - O.S.SERVICIO PENITENCIARIO FEDERAL',
          facturacionFc: 3771950,
          incrementosNd: 27041,
          debitosNc: 330438,
          refacturadoNd: 27652,
          cobradoRc: 2105443,
          saldoPendiente: 1390763,
          _originalIndex: 1
        },
        {
          financiador: '810 - GRUPO DDM S.A. (PREMEDIC)',
          facturacionFc: 3166751,
          incrementosNd: 2150,
          debitosNc: 419330,
          refacturadoNd: 61775,
          cobradoRc: 1746347,
          saldoPendiente: 1064998,
          _originalIndex: 2
        }
      ];
    });

    it('debería ordenar por financiador (alfabético)', () => {
      // 1er click: asc
      component.ordenarBalance('financiador');
      expect(component.columnaOrdenBalance).toBe('financiador');
      expect(component.direccionOrdenBalance).toBe('asc');
      expect(component.balanceFinanciadores[0].financiador).toContain('446');

      // 2do click: desc
      component.ordenarBalance('financiador');
      expect(component.direccionOrdenBalance).toBe('desc');
      expect(component.balanceFinanciadores[0].financiador).toContain('810');

      // 3er click: restablecer orden original
      component.ordenarBalance('financiador');
      expect(component.columnaOrdenBalance).toBe('');
      expect(component.balanceFinanciadores[0].financiador).toContain('782');
    });

    it('debería ordenar por saldoPendiente (numérico)', () => {
      // 1er click: desc por defecto en montos
      component.ordenarBalance('saldo');
      expect(component.columnaOrdenBalance).toBe('saldo');
      expect(component.direccionOrdenBalance).toBe('desc');
      expect(component.balanceFinanciadores[0].saldoPendiente).toBe(1390763);

      // 2do click: asc
      component.ordenarBalance('saldo');
      expect(component.direccionOrdenBalance).toBe('asc');
      expect(component.balanceFinanciadores[0].saldoPendiente).toBe(1064998);

      // 3er click: restablecer
      component.ordenarBalance('saldo');
      expect(component.columnaOrdenBalance).toBe('');
      expect(component.balanceFinanciadores[0].financiador).toContain('782');
    });

    it('debería ordenar por facturacionFc (numérico desc)', () => {
      component.ordenarBalance('facturacion');
      expect(component.balanceFinanciadores[0].facturacionFc).toBe(3771950);
      expect(component.balanceFinanciadores[2].facturacionFc).toBe(2857091);
    });
  });

  describe('Restauración de solapa y filtros desde queryParams en ngOnInit', () => {
    it('esSolapaValida debería validar únicamente solapas reconocidas del sistema', () => {
      expect(component.esSolapaValida('motivos')).toBe(true);
      expect(component.esSolapaValida('tablero')).toBe(true);
      expect(component.esSolapaValida('cuenta-corriente')).toBe(true);
      expect(component.esSolapaValida('invalida')).toBe(false);
      expect(component.esSolapaValida('')).toBe(false);
    });
  });

  describe('Permisos y Solapas para rol GERENTE_DEBITOS', () => {
    it('debería identificar si el usuario es GERENTE_DEBITOS', () => {
      vi.spyOn(component.authService, 'hasRole').mockImplementation((r) => r === 'GERENTE_DEBITOS');
      expect(component.esGerenteDebitos).toBe(true);
    });

    it('debería restringir exactamente tablero, cuenta-corriente, tiempos-cobranza, matriz-cobranzas y trazabilidad para GERENTE_DEBITOS', () => {
      vi.spyOn(component.authService, 'hasRole').mockImplementation((r) => r === 'GERENTE_DEBITOS');

      // Solapas excluidas
      expect(component.esSolapaPermitida('tablero')).toBe(false);
      expect(component.esSolapaPermitida('cuenta-corriente')).toBe(false);
      expect(component.esSolapaPermitida('tiempos-cobranza')).toBe(false);
      expect(component.esSolapaPermitida('matriz-cobranzas')).toBe(false);
      expect(component.esSolapaPermitida('trazabilidad')).toBe(false);

      // Solapas permitidas
      expect(component.esSolapaPermitida('motivos')).toBe(true);
      expect(component.esSolapaPermitida('analistas')).toBe(true);
      expect(component.esSolapaPermitida('bucles')).toBe(true);
      expect(component.esSolapaPermitida('usuarios-carga')).toBe(true);
      expect(component.esSolapaPermitida('medicos')).toBe(true);
      expect(component.esSolapaPermitida('prestaciones')).toBe(false);
    });

    it('debería permitir todas las solapas si el usuario no es GERENTE_DEBITOS', () => {
      vi.spyOn(component.authService, 'hasRole').mockReturnValue(false);

      expect(component.esSolapaPermitida('tablero')).toBe(true);
      expect(component.esSolapaPermitida('cuenta-corriente')).toBe(true);
      expect(component.esSolapaPermitida('tiempos-cobranza')).toBe(true);
      expect(component.esSolapaPermitida('matriz-cobranzas')).toBe(true);
      expect(component.esSolapaPermitida('motivos')).toBe(true);
      expect(component.esSolapaPermitida('trazabilidad')).toBe(true);
    });

    it('seleccionarSolapa debería cambiar a motivos si se intenta seleccionar una solapa prohibida siendo GERENTE_DEBITOS', () => {
      vi.spyOn(component.authService, 'hasRole').mockImplementation((r) => r === 'GERENTE_DEBITOS');
      component.solapaActiva = 'motivos';

      component.seleccionarSolapa('tablero');
      expect(component.solapaActiva).toBe('motivos');

      component.seleccionarSolapa('cuenta-corriente');
      expect(component.solapaActiva).toBe('motivos');

      component.seleccionarSolapa('tiempos-cobranza');
      expect(component.solapaActiva).toBe('motivos');

      component.seleccionarSolapa('matriz-cobranzas');
      expect(component.solapaActiva).toBe('motivos');

      component.seleccionarSolapa('trazabilidad');
      expect(component.solapaActiva).toBe('motivos');

      component.seleccionarSolapa('analistas');
      expect(component.solapaActiva).toBe('analistas');
    });
  });

  describe('Permisos y Solapas para rol TESORERIA', () => {
    it('debería identificar si el usuario es TESORERIA', () => {
      vi.spyOn(component.authService, 'hasRole').mockImplementation((r) => r === 'TESORERIA');
      expect(component.esTesoreria).toBe(true);
    });

    it('debería permitir exactamente tablero, cuenta-corriente, tiempos-cobranza, matriz-cobranzas y trazabilidad para TESORERIA', () => {
      vi.spyOn(component.authService, 'hasRole').mockImplementation((r) => r === 'TESORERIA');

      // Solapas permitidas
      expect(component.esSolapaPermitida('tablero')).toBe(true);
      expect(component.esSolapaPermitida('cuenta-corriente')).toBe(true);
      expect(component.esSolapaPermitida('tiempos-cobranza')).toBe(true);
      expect(component.esSolapaPermitida('matriz-cobranzas')).toBe(true);
      expect(component.esSolapaPermitida('trazabilidad')).toBe(true);

      // Solapas excluidas
      expect(component.esSolapaPermitida('motivos')).toBe(false);
      expect(component.esSolapaPermitida('analistas')).toBe(false);
      expect(component.esSolapaPermitida('bucles')).toBe(false);
      expect(component.esSolapaPermitida('usuarios-carga')).toBe(false);
      expect(component.esSolapaPermitida('medicos')).toBe(false);
      expect(component.esSolapaPermitida('prestaciones')).toBe(false);
    });

    it('seleccionarSolapa debería cambiar a tablero si se intenta seleccionar una solapa no permitida siendo TESORERIA', () => {
      vi.spyOn(component.authService, 'hasRole').mockImplementation((r) => r === 'TESORERIA');
      component.solapaActiva = 'tablero';

      component.seleccionarSolapa('motivos');
      expect(component.solapaActiva).toBe('tablero');

      component.seleccionarSolapa('analistas');
      expect(component.solapaActiva).toBe('tablero');

      component.seleccionarSolapa('cuenta-corriente');
      expect(component.solapaActiva).toBe('cuenta-corriente');

      component.seleccionarSolapa('trazabilidad');
      expect(component.solapaActiva).toBe('trazabilidad');
    });
  });

  describe('Selector unificado de Período / Fecha en todas las solapas', () => {
    it('debería sincronizar las fechas globales al cambiar entre criterios', () => {
      component.ccPeriodoDesde = '2026-08-01';
      component.ccPeriodoHasta = '2026-08-31';
      component.ccFechaDesde = '2026-07-01';
      component.ccFechaHasta = '2026-07-31';

      component.seleccionarCriterioCc('fecha');
      expect(component.criterioFechaCc).toBe('fecha');
      expect(component.fechaDesde).toBe('2026-07-01');
      expect(component.fechaHasta).toBe('2026-07-31');

      component.seleccionarCriterioCc('periodo');
      expect(component.criterioFechaCc).toBe('periodo');
      expect(component.fechaDesde).toBe('2026-08-01');
      expect(component.fechaHasta).toBe('2026-08-31');
    });

    it('irAlMesAnterior debería decrementar el mes del criterio activo y sincronizar fechaDesde/fechaHasta', () => {
      component.criterioFechaCc = 'periodo';
      component.ccPeriodoDesde = '2026-08-01';
      component.ccPeriodoHasta = '2026-08-31';

      component.irAlMesAnterior();

      expect(component.ccPeriodoDesde).toBe('2026-07-01');
      expect(component.ccPeriodoHasta).toBe('2026-07-31');
      expect(component.fechaDesde).toBe('2026-07-01');
      expect(component.fechaHasta).toBe('2026-07-31');
    });

    it('irAlMesSiguiente debería incrementar el mes del criterio activo y sincronizar fechaDesde/fechaHasta', () => {
      component.criterioFechaCc = 'fecha';
      component.ccFechaDesde = '2026-07-01';
      component.ccFechaHasta = '2026-07-31';

      component.irAlMesSiguiente();

      expect(component.ccFechaDesde).toBe('2026-08-01');
      expect(component.ccFechaHasta).toBe('2026-08-31');
      expect(component.fechaDesde).toBe('2026-08-01');
      expect(component.fechaHasta).toBe('2026-08-31');
    });

    it('aplicarFiltros debería usar las fechas del criterio activo y recargar el dashboard', () => {
      const spyDashboard = vi.spyOn(component, 'cargarDashboard');
      component.criterioFechaCc = 'fecha';
      component.ccFechaDesde = '2026-05-01';
      component.ccFechaHasta = '2026-05-31';

      component.aplicarFiltros();

      expect(component.fechaDesde).toBe('2026-05-01');
      expect(component.fechaHasta).toBe('2026-05-31');
      expect(spyDashboard).toHaveBeenCalled();
    });

    it('debería identificar solapas con filtro de fecha deshabilitado', () => {
      component.solapaActiva = 'tiempos-cobranza';
      expect(component.esFiltroFechaDeshabilitado).toBe(false);

      component.solapaActiva = 'matriz-cobranzas';
      expect(component.esFiltroFechaDeshabilitado).toBe(true);

      component.solapaActiva = 'tablero';
      expect(component.esFiltroFechaDeshabilitado).toBe(false);

      component.solapaActiva = 'motivos';
      expect(component.esFiltroFechaDeshabilitado).toBe(false);

      component.solapaActiva = 'analistas';
      expect(component.esFiltroFechaDeshabilitado).toBe(false);

      component.solapaActiva = 'cuenta-corriente';
      expect(component.esFiltroFechaDeshabilitado).toBe(false);
    });

    it('cargarCuentaCorriente debería excluir comprobantes de tipo OP y conservar FC, NC, ND y RC', () => {
      directorioServiceSpy.getCuentaCorrienteTresNiveles = vi.fn().mockReturnValue(of([
        {
          financiador: 'OSDE',
          facturacionFc: 10000,
          incrementosNd: 0,
          debitosNc: 2000,
          refacturacionNd: 1500,
          cobranzasRc: 5000,
          saldo: 4500,
          periodos: [
            {
              periodo: '2026-05',
              facturacionFc: 10000,
              incrementosNd: 0,
              debitosNc: 2000,
              refacturacionNd: 1500,
              cobranzasRc: 5000,
              saldo: 4500,
              comprobantes: [
                {
                  tipo: 'FC',
                  comprobante: 'FC A0030-00001001',
                  fecha: '2026-05-10',
                  facturacionFc: 10000,
                  incrementosNd: 0,
                  debitosNc: 2000,
                  refacturacionNd: 1500,
                  cobranzasRc: 5000,
                  saldo: 4500,
                  hijos: [
                    { tipo: 'FC', comprobante: 'FC A0030-00001001', fecha: '2026-05-10', facturacionFc: 10000, incrementosNd: 0, debitosNc: 0, refacturacionNd: 0, cobranzasRc: 0, saldo: 10000 },
                    { tipo: 'NC', comprobante: 'NC A0001-00002001', fecha: '2026-05-15', facturacionFc: 0, incrementosNd: 0, debitosNc: 2000, refacturacionNd: 0, cobranzasRc: 0, saldo: -2000 },
                    { tipo: 'ND', comprobante: 'ND A0001-00003001', fecha: '2026-05-20', facturacionFc: 0, incrementosNd: 0, debitosNc: 0, refacturacionNd: 1500, cobranzasRc: 0, saldo: 1500 },
                    { tipo: 'RC', comprobante: '4001', fecha: '2026-05-25', facturacionFc: 0, incrementosNd: 0, debitosNc: 0, refacturacionNd: 0, cobranzasRc: 5000, saldo: -5000 },
                    { tipo: 'OP', comprobante: 'OP A0001-00005001', fecha: '2026-05-26', facturacionFc: 0, incrementosNd: 0, debitosNc: 0, refacturacionNd: 0, cobranzasRc: 3000, saldo: -3000 }
                  ]
                }
              ]
            }
          ]
        }
      ]));

      component.cargarCuentaCorriente();

      const hijos = component.cuentaCorrienteDatos[0].periodos[0].comprobantes[0].hijos || [];
      expect(hijos.length).toBe(4);
      expect(hijos.some(h => h.tipo === 'OP')).toBe(false);
      expect(hijos.map(h => h.tipo)).toEqual(['FC', 'NC', 'ND', 'RC']);
    });

    it('el footer de paginación de Cuenta Corriente debe renderizarse fuera de .table-responsive y mantenerse siempre visible', () => {
      directorioServiceSpy.getCuentaCorrienteTresNiveles = vi.fn().mockReturnValue(of([
        {
          financiador: 'OSDE',
          facturacionFc: 10000,
          incrementosNd: 0,
          debitosNc: 0,
          refacturacionNd: 0,
          cobranzasRc: 0,
          saldo: 10000,
          periodos: []
        }
      ]));

      component.solapaActiva = 'cuenta-corriente';
      component.subSolapaCc = 'imputados';
      component.cargarCuentaCorriente();
      fixture.detectChanges();

      const tableResponsive = fixture.nativeElement.querySelector('.table-responsive');
      const paginationBar = fixture.nativeElement.querySelector('.trazabilidad-pagination-bar');

      expect(tableResponsive).toBeTruthy();
      expect(paginationBar).toBeTruthy();
      expect(tableResponsive.contains(paginationBar)).toBe(false);
    });

    it('cargarMedicos debería enviar criterioFechaCc a getDesempenoMedicos', () => {
      directorioServiceSpy.getDesempenoMedicos = vi.fn().mockReturnValue(of([]));
      component.fechaDesde = '2026-06-01';
      component.fechaHasta = '2026-06-30';
      component.criterioFechaCc = 'periodo';

      component.cargarMedicos();

      expect(directorioServiceSpy.getDesempenoMedicos).toHaveBeenCalledWith(
        '2026-06',
        '2026-06-01',
        '2026-06-30',
        'periodo'
      );

      component.criterioFechaCc = 'fecha';
      component.cargarMedicos();

      expect(directorioServiceSpy.getDesempenoMedicos).toHaveBeenCalledWith(
        '2026-06',
        '2026-06-01',
        '2026-06-30',
        'fecha'
      );
    });

    it('getters de totales consolidados de Cuenta Corriente deben retornar 0 cuando la lista está vacía', () => {
      component.cuentaCorrienteDatos = [];
      expect(component.totalFacturacionCc).toBe(0);
      expect(component.totalIncrementosCc).toBe(0);
      expect(component.totalDebitosCc).toBe(0);
      expect(component.totalRefacturacionCc).toBe(0);
      expect(component.totalCobranzasCc).toBe(0);
      expect(component.totalSaldoCc).toBe(0);
    });

    it('getters de totales consolidados de Cuenta Corriente deben sumar con precisión todos los financiadores', () => {
      component.cuentaCorrienteDatos = [
        {
          financiador: 'OSDE',
          facturacionFc: 100000,
          incrementosNd: 5000,
          debitosNc: 20000,
          refacturacionNd: 15000,
          cobranzasRc: 80000,
          saldo: 20000,
          periodos: []
        },
        {
          financiador: 'SWISS MEDICAL',
          facturacionFc: 200000,
          incrementosNd: 10000,
          debitosNc: 30000,
          refacturacionNd: 25000,
          cobranzasRc: 150000,
          saldo: 55000,
          periodos: []
        }
      ];

      expect(component.totalFacturacionCc).toBe(300000);
      expect(component.totalIncrementosCc).toBe(15000);
      expect(component.totalDebitosCc).toBe(50000);
      expect(component.totalRefacturacionCc).toBe(40000);
      expect(component.totalCobranzasCc).toBe(230000);
      expect(component.totalSaldoCc).toBe(75000);
    });
  });

  describe('Exportación a Excel de las 10 Solapas del Tablero', () => {
    let excelService: ExcelExportService;

    beforeEach(() => {
      excelService = TestBed.inject(ExcelExportService);
    });

    it('debería invocar exportarTableroControl, exportarCuentaCorrienteImputados y exportarCuentaCorrienteNoImputados', async () => {
      const spyTablero = vi.spyOn(excelService, 'exportarTableroControl').mockResolvedValue();
      const spyCcImp = vi.spyOn(excelService, 'exportarCuentaCorrienteImputados').mockResolvedValue();
      const spyCcNoImp = vi.spyOn(excelService, 'exportarCuentaCorrienteNoImputados').mockResolvedValue();

      component.balanceFinanciadores = [
        {
          financiador: '750 - OMINT',
          facturacionFc: 100,
          incrementosNd: 0,
          debitosNc: 10,
          refacturadoNd: 5,
          cobradoRc: 80,
          saldoPendiente: 15
        }
      ];
      await component.exportarExcelTablero();
      expect(spyTablero).toHaveBeenCalled();

      component.cuentaCorrienteDatos = [
        {
          financiador: '750 - OMINT',
          facturacionFc: 100,
          incrementosNd: 0,
          debitosNc: 10,
          refacturacionNd: 5,
          cobranzasRc: 80,
          saldo: 15,
          periodos: []
        }
      ];
      await component.exportarExcelCuentaCorrienteImputados();
      expect(spyCcImp).toHaveBeenCalled();

      component.recibosNoImputados = [
        {
          id: 1,
          tipo: 'RC',
          letra: 'X',
          ptovta: 1,
          numero: 10,
          comprobante: 'RC X0001-00000010',
          debe: 0,
          haber: 500,
          importe: 500
        }
      ];
      await component.exportarExcelNoImputados();
      expect(spyCcNoImp).toHaveBeenCalled();
    });

    it('debería invocar los métodos de exportación para las solapas 3 a 10', async () => {
      const spyTiempos = vi.spyOn(excelService, 'exportarTiemposCobranza').mockResolvedValue();
      const spyMatriz = vi.spyOn(excelService, 'exportarMatrizCobranzas').mockResolvedValue();
      const spyMotivos = vi.spyOn(excelService, 'exportarMotivosDebito').mockResolvedValue();
      const spyAnalistas = vi.spyOn(excelService, 'exportarAnalistasDebito').mockResolvedValue();
      const spyBucles = vi.spyOn(excelService, 'exportarBuclesInsistencia').mockResolvedValue();
      const spyOperadores = vi.spyOn(excelService, 'exportarUsuariosCarga').mockResolvedValue();
      const spyMedicos = vi.spyOn(excelService, 'exportarPrestadoresMedicos').mockResolvedValue();
      const spyTrazabilidad = vi.spyOn(excelService, 'exportarTrazabilidad').mockResolvedValue();

      component.tiemposCobranzaDatos = {
        dsoGlobal: 30,
        cobroRealPromedio: 25,
        saldoTotalMora: 1000,
        detalles: [{ rango: 'De 0 a 45 días', cantidadComprobantes: 2, saldoEnMora: 1000, porcentajeCartera: 100 }]
      };
      await component.exportarExcelTiemposCobranza();
      expect(spyTiempos).toHaveBeenCalled();

      component.matrizRecaudacion = {
        anioSeleccionado: 2026,
        aniosDisponibles: [2026],
        filas: [{ financiador: 'OSDE', meses: new Array(12).fill(100), totalAnual: 1200 }],
        totalesMes: new Array(12).fill(100),
        granTotal: 1200
      };
      await component.exportarExcelMatriz();
      expect(spyMatriz).toHaveBeenCalled();

      component.motivosDebito = [
        { motivo: 'Falta orden', cantidadCasos: 3, montoTotal: 3000, porcentaje: 100 }
      ];
      await component.exportarExcelMotivos();
      expect(spyMotivos).toHaveBeenCalled();

      component.analistasDatos = [
        {
          analista: 'FernandaCortes',
          cantidadRegistros: 2,
          debitosAceptados: 500,
          debitosRefacturados: 1500,
          totalTramitado: 2000,
          ticketPromedio: 1000,
          tasaRecupero: 75,
          motivos: []
        }
      ];
      await component.exportarExcelAnalistas();
      expect(spyAnalistas).toHaveBeenCalled();

      component.buclesDatos = [
        {
          idPrestacion: 'FAC A0030-00001000',
          descripcion: 'Factura',
          financiador: 'OSDE',
          medico: 'Dr. Test',
          montoFacturadoOriginal: 5000,
          totalDebitado: 1000,
          historialEventos: []
        }
      ];
      await component.exportarExcelBucles();
      expect(spyBucles).toHaveBeenCalled();

      component.operadoresDatos = [
        {
          operador: 'BALBELLASAN',
          cantidadRegistros: 5,
          debitosAceptados: 1000,
          debitosRefacturados: 4000,
          totalTramitado: 5000,
          ticketPromedio: 1000,
          tasaRecupero: 80,
          motivos: []
        }
      ];
      await component.exportarExcelOperadores();
      expect(spyOperadores).toHaveBeenCalled();

      component.medicosDatos = [
        {
          medico: 'ROSSINI GUILLERMO',
          cantidadRegistros: 4,
          debitosAceptados: 1000,
          debitosRefacturados: 3000,
          totalTramitado: 4000,
          ticketPromedio: 1000,
          tasaRecupero: 75,
          motivos: []
        }
      ];
      await component.exportarExcelMedicos();
      expect(spyMedicos).toHaveBeenCalled();

      component.trazabilidadDatos = [
        {
          idPrestacion: 'FAC A0030-00005364',
          descripcion: 'Factura',
          financiador: 'OSDE',
          medico: 'Dr. Test',
          montoFacturadoOriginal: 10000,
          totalDebitado: 2000,
          historialEventos: []
        }
      ];
      await component.exportarExcelTrazabilidad();
      expect(spyTrazabilidad).toHaveBeenCalled();
    });
  });

  describe('Filtro desplegable Por Período de Factura Madre', () => {
    it('debería generar opciones de períodos dinámicas en orden descendente desde fechaMinimaPermitida', () => {
      component.fechaMinimaPermitida = '2024-07-01';
      component.generarOpcionesPeriodos();

      expect(component.opcionesPeriodos.length).toBeGreaterThan(0);
      const primero = component.opcionesPeriodos[0];
      expect(primero.value).toContain('-12');
      expect(primero.label).toContain('Diciembre');

      const ultimo = component.opcionesPeriodos[component.opcionesPeriodos.length - 1];
      expect(ultimo.value).toBe('2024-07');
      expect(ultimo.label).toBe('Julio 2024');
      expect(ultimo.primerDiaIso).toBe('2024-07-01');
      expect(ultimo.ultimoDiaIso).toBe('2024-07-31');
    });

    it('debería mapear correctamente periodoMesDesde al primer día y periodoMesHasta al último día del mes', () => {
      component.criterioFechaCc = 'periodo';
      component.periodoMesDesde = '2026-01';
      component.periodoMesHasta = '2026-03';

      expect(component.periodoMesDesde).toBe('2026-01');
      expect(component.periodoMesHasta).toBe('2026-03');
      expect(component.fechaDesde).toBe('2026-01-01');
      expect(component.fechaHasta).toBe('2026-03-31');
    });

    it('debería cubrir el mes completo cuando se selecciona el mismo mes en Desde y Hasta', () => {
      component.criterioFechaCc = 'periodo';
      component.periodoMesDesde = '2026-02';
      component.periodoMesHasta = '2026-02';

      expect(component.fechaDesde).toBe('2026-02-01');
      expect(component.fechaHasta).toBe('2026-02-28');
    });

    it('debería auto-ajustar Hasta cuando Desde es posterior a Hasta en onPeriodoDesdeChange', () => {
      component.criterioFechaCc = 'periodo';
      component.periodoMesDesde = '2026-02';
      component.periodoMesHasta = '2026-02';

      component.periodoMesDesde = '2026-05';
      component.onPeriodoDesdeChange();

      expect(component.periodoMesHasta).toBe('2026-05');
      expect(component.fechaHasta).toBe('2026-05-31');
    });

    it('debería auto-ajustar Desde cuando Hasta es anterior a Desde en onPeriodoHastaChange', () => {
      component.criterioFechaCc = 'periodo';
      component.periodoMesDesde = '2026-08';
      component.periodoMesHasta = '2026-08';

      component.periodoMesHasta = '2026-04';
      component.onPeriodoHastaChange();

      expect(component.periodoMesDesde).toBe('2026-04');
      expect(component.fechaDesde).toBe('2026-04-01');
    });

    it('irAlMesAnterior e irAlMesSiguiente deberían mantener sincronizados periodoMesDesde y periodoMesHasta', () => {
      component.criterioFechaCc = 'periodo';
      component.periodoMesDesde = '2026-08';
      component.periodoMesHasta = '2026-08';

      component.irAlMesAnterior();
      expect(component.periodoMesDesde).toBe('2026-07');
      expect(component.periodoMesHasta).toBe('2026-07');

      component.irAlMesSiguiente();
      expect(component.periodoMesDesde).toBe('2026-08');
      expect(component.periodoMesHasta).toBe('2026-08');
    });
  });

  describe('Solapa Prestaciones Facturadas', () => {
    it('debería permitir acceder a la solapa prestaciones solo si el usuario es ADMIN', () => {
      vi.spyOn(component.authService, 'isAdmin').mockReturnValue(true);
      component.seleccionarSolapa('prestaciones');
      expect(component.solapaActiva).toBe('prestaciones');
      expect(component.esSolapaPermitida('prestaciones')).toBe(true);
    });

    it('no debería permitir acceder a la solapa prestaciones si el usuario no es ADMIN', () => {
      vi.spyOn(component.authService, 'isAdmin').mockReturnValue(false);
      component.solapaActiva = 'tablero';
      component.seleccionarSolapa('prestaciones');
      expect(component.solapaActiva).toBe('tablero');
      expect(component.esSolapaPermitida('prestaciones')).toBe(false);
    });

    it('cargarPrestaciones debería invocar getPrestacionesFacturadas y poblar métricas y datos', () => {
      const mockPrestacionesRes: DirectorioPrestacionesResponse = {
        totalRegistros: 2,
        totalMontoFacturado: 15000,
        cantidadMedicos: 1,
        cantidadPacientes: 2,
        paginaActual: 1,
        totalPaginas: 1,
        tamanioPagina: 50,
        items: [
          {
            id: 1,
            tipoDoc: 'FC',
            letraDoc: 'A',
            ptovtaDoc: 30,
            numeroDoc: 12345,
            fechaPrestacion: '2026-08-10',
            fechaDoc: '2026-08-15',
            paciente: 'Perez Juan',
            carnet: '123456/01',
            plan: '210',
            codigoPrestacion: '420101',
            descripcionPrestacion: 'CONSULTA MEDICA',
            especialidad: 'CLINICA',
            cantidad: 1,
            importeTotal: 10000,
            medico: 'Dr. Lopez',
            cobertura: 'OSDE',
            tipoRegistro: 'Ambulatorios'
          },
          {
            id: 2,
            tipoDoc: 'FC',
            letraDoc: 'A',
            ptovtaDoc: 30,
            numeroDoc: 12345,
            fechaPrestacion: '2026-08-11',
            fechaDoc: '2026-08-15',
            paciente: 'Gomez Maria',
            carnet: '654321/01',
            plan: '310',
            codigoPrestacion: '420102',
            descripcionPrestacion: 'CONSULTA ESPECIALISTA',
            especialidad: 'CARDIOLOGIA',
            cantidad: 1,
            importeTotal: 5000,
            medico: 'Dr. Lopez',
            cobertura: 'OSDE',
            tipoRegistro: 'Internados'
          }
        ]
      };

      directorioServiceSpy.getPrestacionesFacturadas = vi.fn().mockReturnValue(of(mockPrestacionesRes));

      component.cargarPrestaciones(1);

      expect(component.cargandoPrestaciones).toBe(false);
      expect(component.prestacionesDatos.length).toBe(2);
      expect(component.prestacionesTotalRegistros).toBe(2);
      expect(component.prestacionesTotalMonto).toBe(15000);
      expect(component.prestacionesTotalMedicos).toBe(1);
      expect(component.prestacionesTotalPacientes).toBe(2);
    });

    it('formatearComprobante debería formatear correctamente el comprobante con ceros a la izquierda', () => {
      const item: any = {
        tipoDoc: 'FC',
        letraDoc: 'A',
        ptovtaDoc: 30,
        numeroDoc: 1234
      };
      expect(component.formatearComprobanteItem(item)).toBe('FC A 0030-00001234');
    });

    it('cambiarPaginaPrestaciones y cambiarTamanioPaginaPrestaciones deberían recargar las prestaciones', () => {
      const spyCargar = vi.spyOn(component, 'cargarPrestaciones');
      component.prestacionesTotalPaginas = 5;
      component.prestacionesPaginaActual = 1;

      component.cambiarPaginaPrestaciones(2);
      expect(spyCargar).toHaveBeenCalledWith(2);

      component.cambiarTamanioPaginaPrestaciones(100);
      expect(component.prestacionesTamanioPagina).toBe(100);
      expect(spyCargar).toHaveBeenCalledWith(1);
    });

    it('filtros locales y autocompletar deberían actualizar filtros y cargar prestaciones', () => {
      const spyCargar = vi.spyOn(component, 'cargarPrestaciones');

      component.seleccionarSugerenciaMedico('Dr. Test Autocomplete');
      expect(component.filtroPrestacionMedico).toBe('Dr. Test Autocomplete');
      expect(spyCargar).toHaveBeenCalledWith(1);

      component.seleccionarSugerenciaPrestacion({ codigo: '420101', descripcion: 'Consulta' });
      expect(component.filtroPrestacionCodigo).toBe('420101');
      expect(spyCargar).toHaveBeenCalledWith(1);

      component.limpiarTodosFiltrosPrestaciones();
      expect(component.filtroPrestacionMedico).toBe('');
      expect(component.filtroPrestacionCodigo).toBe('');
      expect(component.filtroPrestacionTipoRegistro).toBe('TODOS');
    });

    describe('Filtros Médico y Prestación por selección', () => {
      const eventoInput = (valor: string): Event => ({ target: { value: valor } } as unknown as Event);

      afterEach(() => {
        vi.useRealTimers();
      });

      it('escribir en Médico NO debe filtrar la tabla; solo muestra sugerencias', () => {
        vi.useFakeTimers();
        directorioServiceSpy.getSugerenciasMedicos = vi.fn().mockReturnValue(of(['Dr. Lopez', 'Dra. Lopez']));
        const spyCargar = vi.spyOn(component, 'cargarPrestaciones');

        component.onInputPrestacionMedico(eventoInput('Lop'));
        vi.advanceTimersByTime(350);

        expect(spyCargar).not.toHaveBeenCalled();
        expect(component.filtroPrestacionMedico).toBe('');
        expect(component.textoMedicoInput).toBe('Lop');
        expect(component.sugerenciasMedicosPrestaciones).toEqual(['Dr. Lopez', 'Dra. Lopez']);
        expect(component.mostrarSugerenciasMedicos).toBe(true);
      });

      it('escribir en Prestación NO debe filtrar la tabla; solo muestra sugerencias', () => {
        vi.useFakeTimers();
        directorioServiceSpy.getSugerenciasPrestaciones = vi.fn()
          .mockReturnValue(of([{ codigo: '420101', descripcion: 'Consulta' }]));
        const spyCargar = vi.spyOn(component, 'cargarPrestaciones');

        component.onInputPrestacionCodigo(eventoInput('4201'));
        vi.advanceTimersByTime(350);

        expect(spyCargar).not.toHaveBeenCalled();
        expect(component.filtroPrestacionCodigo).toBe('');
        expect(component.sugerenciasCodigosPrestaciones.length).toBe(1);
        expect(component.mostrarSugerenciasPrestaciones).toBe(true);
      });

      it('con menos de 2 caracteres no busca sugerencias ni filtra', () => {
        vi.useFakeTimers();
        const spyCargar = vi.spyOn(component, 'cargarPrestaciones');
        directorioServiceSpy.getSugerenciasMedicos.mockClear();

        component.onInputPrestacionMedico(eventoInput('L'));
        vi.advanceTimersByTime(350);

        expect(directorioServiceSpy.getSugerenciasMedicos).not.toHaveBeenCalled();
        expect(spyCargar).not.toHaveBeenCalled();
        expect(component.mostrarSugerenciasMedicos).toBe(false);
      });

      it('al seleccionar una sugerencia se aplica el filtro y se recarga una sola vez', () => {
        const spyCargar = vi.spyOn(component, 'cargarPrestaciones');

        component.seleccionarSugerenciaMedico('Dr. Lopez');
        expect(component.filtroPrestacionMedico).toBe('Dr. Lopez');
        expect(component.textoMedicoInput).toBe('Dr. Lopez');
        expect(component.mostrarSugerenciasMedicos).toBe(false);
        expect(spyCargar).toHaveBeenCalledTimes(1);
        expect(spyCargar).toHaveBeenCalledWith(1);

        component.seleccionarSugerenciaPrestacion({ codigo: '420101', descripcion: 'Consulta' });
        expect(component.filtroPrestacionCodigo).toBe('420101');
        expect(component.textoPrestacionInput).toBe('420101 - Consulta');
        expect(component.mostrarSugerenciasPrestaciones).toBe(false);
        expect(spyCargar).toHaveBeenCalledTimes(2);
      });

      it('editar el texto con un filtro aplicado mantiene el filtro hasta elegir otra opción', () => {
        vi.useFakeTimers();
        component.seleccionarSugerenciaMedico('Dr. Lopez');
        const spyCargar = vi.spyOn(component, 'cargarPrestaciones');

        component.onInputPrestacionMedico(eventoInput('Dr. Lopezz'));
        vi.advanceTimersByTime(350);

        expect(component.filtroPrestacionMedico).toBe('Dr. Lopez');
        expect(spyCargar).not.toHaveBeenCalled();
      });

      it('borrar todo el texto quita el filtro aplicado y recarga la tabla', () => {
        component.seleccionarSugerenciaMedico('Dr. Lopez');
        component.seleccionarSugerenciaPrestacion({ codigo: '420101', descripcion: 'Consulta' });
        const spyCargar = vi.spyOn(component, 'cargarPrestaciones');

        component.onInputPrestacionMedico(eventoInput(''));
        expect(component.filtroPrestacionMedico).toBe('');
        expect(spyCargar).toHaveBeenCalledTimes(1);

        component.onInputPrestacionCodigo(eventoInput('   '));
        expect(component.filtroPrestacionCodigo).toBe('');
        expect(component.textoPrestacionAplicado).toBe('');
        expect(spyCargar).toHaveBeenCalledTimes(2);
      });

      it('borrar el texto sin filtro aplicado no recarga la tabla', () => {
        const spyCargar = vi.spyOn(component, 'cargarPrestaciones');
        component.onInputPrestacionMedico(eventoInput(''));
        component.onInputPrestacionCodigo(eventoInput(''));
        expect(spyCargar).not.toHaveBeenCalled();
      });

      it('al salir del campo sin elegir (blur) el texto vuelve al último filtro aplicado', () => {
        component.seleccionarSugerenciaMedico('Dr. Lopez');
        component.seleccionarSugerenciaPrestacion({ codigo: '420101', descripcion: 'Consulta' });

        component.onInputPrestacionMedico(eventoInput('otra cosa'));
        component.onBlurMedico();
        expect(component.textoMedicoInput).toBe('Dr. Lopez');

        component.onInputPrestacionCodigo(eventoInput('xyz'));
        component.onBlurPrestacion();
        expect(component.textoPrestacionInput).toBe('420101 - Consulta');

        component.limpiarTodosFiltrosPrestaciones();
        component.onInputPrestacionMedico(eventoInput('sin elegir'));
        component.onBlurMedico();
        expect(component.textoMedicoInput).toBe('');
      });

      it('el botón ✕ limpia texto y filtro; recarga solo si había filtro aplicado', () => {
        const spyCargar = vi.spyOn(component, 'cargarPrestaciones');

        component.limpiarFiltroPrestacionMedico();
        expect(spyCargar).not.toHaveBeenCalled();

        component.seleccionarSugerenciaMedico('Dr. Lopez');
        spyCargar.mockClear();
        component.limpiarFiltroPrestacionMedico();
        expect(component.filtroPrestacionMedico).toBe('');
        expect(component.textoMedicoInput).toBe('');
        expect(spyCargar).toHaveBeenCalledTimes(1);

        component.seleccionarSugerenciaPrestacion({ codigo: '420101', descripcion: 'Consulta' });
        spyCargar.mockClear();
        component.limpiarFiltroPrestacionCodigo();
        expect(component.filtroPrestacionCodigo).toBe('');
        expect(component.textoPrestacionInput).toBe('');
        expect(spyCargar).toHaveBeenCalledTimes(1);
      });

      it('una respuesta de sugerencias vieja no pisa a la más reciente', () => {
        vi.useFakeTimers();
        const respuestaVieja = new Subject<string[]>();
        const respuestaNueva = new Subject<string[]>();
        directorioServiceSpy.getSugerenciasMedicos = vi.fn()
          .mockReturnValueOnce(respuestaVieja.asObservable())
          .mockReturnValueOnce(respuestaNueva.asObservable());

        component.onInputPrestacionMedico(eventoInput('Lo'));
        vi.advanceTimersByTime(350);
        component.onInputPrestacionMedico(eventoInput('Lop'));
        vi.advanceTimersByTime(350);

        respuestaNueva.next(['Dr. Lopez']);
        respuestaVieja.next(['Dr. Lopez', 'Dr. Lozano']);

        expect(component.sugerenciasMedicosPrestaciones).toEqual(['Dr. Lopez']);
      });

      it('navegación por teclado: flechas, Enter selecciona y Escape cierra', () => {
        const spyCargar = vi.spyOn(component, 'cargarPrestaciones');
        component.sugerenciasMedicosPrestaciones = ['Dr. A', 'Dr. B'];
        component.mostrarSugerenciasMedicos = true;
        const tecla = (key: string) => ({ key, preventDefault: vi.fn() } as unknown as KeyboardEvent);

        component.onKeydownMedico(tecla('ArrowDown'));
        expect(component.sugerenciaMedicoActiva).toBe(0);
        component.onKeydownMedico(tecla('ArrowDown'));
        expect(component.sugerenciaMedicoActiva).toBe(1);
        component.onKeydownMedico(tecla('ArrowUp'));
        expect(component.sugerenciaMedicoActiva).toBe(0);

        component.onKeydownMedico(tecla('Enter'));
        expect(component.filtroPrestacionMedico).toBe('Dr. A');
        expect(spyCargar).toHaveBeenCalledTimes(1);

        component.sugerenciasCodigosPrestaciones = [{ codigo: '1', descripcion: 'X' }];
        component.mostrarSugerenciasPrestaciones = true;
        component.onKeydownPrestacion(tecla('Escape'));
        expect(component.mostrarSugerenciasPrestaciones).toBe(false);
      });

      it('si el backend devuelve el tope de sugerencias se expone el límite para mostrar el aviso', () => {
        expect(component.limiteSugerencias).toBe(15);
      });

      it('exportar usa el filtro aplicado y no el texto en edición', async () => {
        component.seleccionarSugerenciaMedico('Dr. Lopez');
        component.onInputPrestacionMedico(eventoInput('borrador'));
        component.prestacionesTotalRegistros = 1;
        component.prestacionesDatos = [{ id: 1 } as any];
        const spyExcel = vi.spyOn(TestBed.inject(ExcelExportService), 'exportarPrestacionesFacturadas').mockResolvedValue();

        await component.exportarExcelPrestaciones();

        const contexto = JSON.stringify(spyExcel.mock.calls[0]);
        expect(contexto).toContain('Dr. Lopez');
        expect(contexto).not.toContain('borrador');
      });
    });

    it('exportarExcelPrestaciones debería invocar excelExportService.exportarPrestacionesFacturadas', async () => {
      component.filtroPrestacionTipoRegistro = 'Ambulatorios';
      component.periodoMesDesde = '2026-08';
      component.periodoMesHasta = '2026-08';
      component.prestacionesDatos = [
        {
          id: 1,
          tipoDoc: 'FC',
          letraDoc: 'A',
          ptovtaDoc: 30,
          numeroDoc: 12345,
          fechaPrestacion: '2026-08-10',
          fechaDoc: '2026-08-15',
          paciente: 'Perez Juan',
          carnet: '123456/01',
          plan: '210',
          codigoPrestacion: '420101',
          descripcionPrestacion: 'CONSULTA MEDICA',
          especialidad: 'CLINICA',
          cantidad: 1,
          importeTotal: 10000,
          medico: 'Dr. Lopez',
          cobertura: 'OSDE',
          tipoRegistro: 'Ambulatorios'
        }
      ];
      component.prestacionesTotalRegistros = 1;

      const excelExportSpy = TestBed.inject(ExcelExportService);
      const spyExcel = vi.spyOn(excelExportSpy, 'exportarPrestacionesFacturadas').mockResolvedValue();

      await component.exportarExcelPrestaciones();

      expect(spyExcel).toHaveBeenCalled();
    });

    describe('Restricción y Modal de Exportación a Excel en Prestaciones (Regla de 3 meses y filtros requeridos)', () => {
      it('tieneFiltroLocalPrestaciones debería retornar false si no hay filtros y true si hay médico, prestación o atención', () => {
        component.filtroPrestacionMedico = '';
        component.filtroPrestacionCodigo = '';
        component.filtroPrestacionTipoRegistro = 'TODOS';
        expect(component.tieneFiltroLocalPrestaciones).toBe(false);

        component.filtroPrestacionMedico = 'Dr. House';
        expect(component.tieneFiltroLocalPrestaciones).toBe(true);

        component.filtroPrestacionMedico = '';
        component.filtroPrestacionCodigo = '420101';
        expect(component.tieneFiltroLocalPrestaciones).toBe(true);

        component.filtroPrestacionCodigo = '';
        component.filtroPrestacionTipoRegistro = 'Internados';
        expect(component.tieneFiltroLocalPrestaciones).toBe(true);
      });

      it('exportarExcelPrestaciones no debería exportar si tieneFiltroLocalPrestaciones es false', async () => {
        component.filtroPrestacionMedico = '';
        component.filtroPrestacionCodigo = '';
        component.filtroPrestacionTipoRegistro = 'TODOS';
        component.prestacionesTotalRegistros = 5;
        const spyExcel = vi.spyOn(TestBed.inject(ExcelExportService), 'exportarPrestacionesFacturadas').mockResolvedValue();

        await component.exportarExcelPrestaciones();

        expect(spyExcel).not.toHaveBeenCalled();
        expect(component.modalExportPrestacionesVisible).toBe(false);
      });

      it('superaTresMesesPrestaciones debería detectar correctamente rangos mayores a 3 meses en período y fecha', () => {
        component.criterioFechaCc = 'periodo';
        component.periodoMesDesde = '2026-05';
        component.periodoMesHasta = '2026-07'; // 3 meses exactos (Mayo, Junio, Julio)
        expect(component.superaTresMesesPrestaciones()).toBe(false);

        component.periodoMesHasta = '2026-08'; // 4 meses
        expect(component.superaTresMesesPrestaciones()).toBe(true);

        component.criterioFechaCc = 'fecha';
        component.ccFechaDesde = '2026-05-01';
        component.ccFechaHasta = '2026-07-31'; // <= 3 meses
        expect(component.superaTresMesesPrestaciones()).toBe(false);

        component.ccFechaHasta = '2026-09-01'; // > 3 meses
        expect(component.superaTresMesesPrestaciones()).toBe(true);
      });

      it('exportarExcelPrestaciones debería abrir el modal si supera 3 meses y hay filtro aplicado', async () => {
        component.filtroPrestacionMedico = 'Dr. Favaloro';
        component.criterioFechaCc = 'periodo';
        component.periodoMesDesde = '2025-05';
        component.periodoMesHasta = '2026-10'; // 18 meses
        component.prestacionesTotalRegistros = 10;
        component.prestacionesDatos = [{ id: 1 } as any];

        const spyExcel = vi.spyOn(TestBed.inject(ExcelExportService), 'exportarPrestacionesFacturadas').mockResolvedValue();

        await component.exportarExcelPrestaciones();

        expect(spyExcel).not.toHaveBeenCalled();
        expect(component.modalExportPrestacionesVisible).toBe(true);
        expect(component.modalExportCriterio).toBe('periodo');
        expect(component.modalExportPeriodoDesde).toBe('2026-08');
        expect(component.modalExportPeriodoHasta).toBe('2026-10');
      });

      it('onModalPeriodoDesdeChange debería limitar modalExportOpcionesHasta a máximo 3 meses posteriores', () => {
        component.periodoMesDesde = '2025-01';
        component.periodoMesHasta = '2026-12';
        component.abrirModalExportarPrestaciones();

        component.modalExportPeriodoDesde = '2026-01';
        component.onModalPeriodoDesdeChange();

        // Todas las opciones en modalExportOpcionesHasta deben ser >= 2026-01 y <= 2026-03
        expect(component.modalExportOpcionesHasta.every(opt => opt.value >= '2026-01' && opt.value <= '2026-03')).toBe(true);
      });

      it('confirmarExportacionModalPrestaciones no debería cerrar el modal ni exportar si el rango seleccionado no tiene prestaciones', async () => {
        component.filtroPrestacionMedico = 'Dra. Gomez';
        component.criterioFechaCc = 'periodo';
        component.periodoMesDesde = '2025-05';
        component.periodoMesHasta = '2026-10';
        component.abrirModalExportarPrestaciones();

        component.modalExportPeriodoDesde = '2025-05';
        component.modalExportPeriodoHasta = '2025-07';

        const mockService = TestBed.inject(DirectorioService);
        const spyGet = vi.spyOn(mockService, 'getPrestacionesFacturadas').mockReturnValue(of({
          items: [],
          totalRegistros: 0,
          totalMontoFacturado: 0,
          cantidadMedicos: 0,
          cantidadPacientes: 0,
          totalPaginas: 0
        } as any));

        const spyExcel = vi.spyOn(TestBed.inject(ExcelExportService), 'exportarPrestacionesFacturadas').mockResolvedValue();

        await component.confirmarExportacionModalPrestaciones();

        expect(spyGet).toHaveBeenCalled();
        expect(spyExcel).not.toHaveBeenCalled();
        expect(component.modalExportPrestacionesVisible).toBe(true);
        expect(component.errorModalExport).toContain('No se encontraron prestaciones facturadas');
      });

      it('confirmarExportacionModalPrestaciones debería descargar el Excel acotado y cerrar modal sin alterar filtros de pantalla', async () => {
        component.filtroPrestacionMedico = 'Dra. Gomez';
        component.criterioFechaCc = 'periodo';
        component.periodoMesDesde = '2025-05';
        component.periodoMesHasta = '2026-10';
        component.abrirModalExportarPrestaciones();

        component.modalExportPeriodoDesde = '2026-08';
        component.modalExportPeriodoHasta = '2026-10';

        const mockService = TestBed.inject(DirectorioService);
        const spyGet = vi.spyOn(mockService, 'getPrestacionesFacturadas').mockReturnValue(of({
          items: [{ id: 99 } as any],
          totalRegistros: 1,
          totalMontoFacturado: 5000,
          cantidadMedicos: 1,
          cantidadPacientes: 1,
          totalPaginas: 1
        } as any));

        const spyExcel = vi.spyOn(TestBed.inject(ExcelExportService), 'exportarPrestacionesFacturadas').mockResolvedValue();

        await component.confirmarExportacionModalPrestaciones();

        expect(spyGet).toHaveBeenCalled();
        expect(spyExcel).toHaveBeenCalled();
        expect(component.modalExportPrestacionesVisible).toBe(false);

        // Los filtros de la pantalla principal no se modificaron (permanecen 2025-05 a 2026-10)
        expect(component.periodoMesDesde).toBe('2025-05');
        expect(component.periodoMesHasta).toBe('2026-10');
      });
    });

    it('ordenarPrestaciones debería alternar entre desc, asc y restablecer el orden en 3 clics', () => {
      const spyCargar = vi.spyOn(component, 'cargarPrestaciones');

      // 1er click en columna numérica/monto -> desc por defecto
      component.ordenarPrestaciones('importe');
      expect(component.columnaOrdenPrestaciones).toBe('importe');
      expect(component.direccionOrdenPrestaciones).toBe('desc');
      expect(component.pasoOrdenPrestaciones).toBe(1);
      expect(spyCargar).toHaveBeenCalledWith(1);

      // 2do click -> invierte a asc
      component.ordenarPrestaciones('importe');
      expect(component.columnaOrdenPrestaciones).toBe('importe');
      expect(component.direccionOrdenPrestaciones).toBe('asc');
      expect(component.pasoOrdenPrestaciones).toBe(2);

      // 3er click -> restablece orden por defecto
      component.ordenarPrestaciones('importe');
      expect(component.columnaOrdenPrestaciones).toBe('');
      expect(component.pasoOrdenPrestaciones).toBe(0);

      // 1er click en columna alfabética -> asc por defecto
      component.ordenarPrestaciones('paciente');
      expect(component.columnaOrdenPrestaciones).toBe('paciente');
      expect(component.direccionOrdenPrestaciones).toBe('asc');
      expect(component.pasoOrdenPrestaciones).toBe(1);

      // 1er click en cobertura -> asc por defecto
      component.ordenarPrestaciones('cobertura');
      expect(component.columnaOrdenPrestaciones).toBe('cobertura');
      expect(component.direccionOrdenPrestaciones).toBe('asc');
      expect(component.pasoOrdenPrestaciones).toBe(1);

      // limpiarTodosFiltrosPrestaciones restablece el ordenamiento
      component.limpiarTodosFiltrosPrestaciones();
      expect(component.columnaOrdenPrestaciones).toBe('');
      expect(component.pasoOrdenPrestaciones).toBe(0);
    });
  });
});


