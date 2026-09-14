import { ComponentFixture, TestBed, DeferBlockState } from '@angular/core/testing';
import { AuditoriaComponent } from './auditoria';
import { AuditoriaService } from '../../core/services/auditoria';
import { AuthService } from '../../core/services/auth';
import { ExcelExportService } from '../../core/services/excel-export';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { Prestacion } from '../../core/models/prestacion';
import { vi } from 'vitest';

describe('AuditoriaComponent', () => {
  let component: AuditoriaComponent;
  let fixture: ComponentFixture<AuditoriaComponent>;

  // Usamos 'any' para hacer Mocks en JavaScript puro
  let auditoriaServiceSpy: any;
  let authServiceSpy: any;
  let notificacionServiceSpy: any;
  let excelServiceSpy: any;
  let routerSpy: any;

  beforeEach(async () => {
    // Mocks universales (Funcionan en Vitest, Jest y Jasmine sin importar la configuración)
    auditoriaServiceSpy = {
      buscarPrestaciones: () => of([]),
      guardarParcialmente: () => of({}),
      guardarNuevaNotaCredito: () => of({}),
      editarNcAjusteIva: () => of({}),
      guardarNuevaNotaDebito: () => of({}),
      registrarMetricaUsabilidad: () => of({}),
      registrarMetricasLote: () => of({}),
      verificarTieneNC: () => of([]),
      verificarTieneND: () => of([]),
      verificarTieneNCParaND: () => of(null),
      verificarTieneNcAjusteIva: () => of(null),
      verificarTieneNdAjusteIva: () => of(null),
      obtenerDocumentoAsociadoParaNC: () => of(null),
      obtenerHistorialComprobantes: () => of([]),
      obtenerCabecerasDisponibles: () => of([]),
      guardarNuevaNotaDebitoAjusteIva: () => of({}),
      cambiarEstadoGrupo: () => of({ requiereConfirmacion: false, exito: true })
    };
    authServiceSpy = {
      obtenerUsuario: () => 'tester',
      logout: vi.fn(),
      hasAnyRole: (roles: string[]) => true,
      hasRole: (rol: string) => true,
      isAdmin: () => false,
      isLoggedIn: () => false,
      esAdminReal: () => false,
      autenticado$: of(false)
    };
    notificacionServiceSpy = {
      notificacionSeleccionada$: new Subject(),
      notificaciones$: of([]),
      noLeidasCount$: of(0),
      reportarDocumentoNoEncontrado: () => of({}),
      cargarNotificaciones: () => {},
      iniciarPolling: () => {},
      detenerPolling: () => {}
    };
    excelServiceSpy = {
      exportarPrestaciones: vi.fn(),
      exportarHistorialComprobantes: vi.fn(),
    };
    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AuditoriaComponent, ReactiveFormsModule],
      providers: [
        { provide: AuditoriaService, useValue: auditoriaServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificacionService, useValue: notificacionServiceSpy },
        { provide: ExcelExportService, useValue: excelServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Validaciones de UI', () => {
    it('debería mostrar alerta y borrar el campo si se ingresa un número en la letra', () => {
      let alertaMostrada = '';

      // Secuestramos la función real del componente usando JS puro
      component.mostrarAlerta = (mensaje: string, callback?: any) => {
        alertaMostrada = mensaje;
        if (callback) callback(); // Simulamos que el usuario hace click en Aceptar
      };

      const mockEvent = { target: { value: 'A1' } } as unknown as Event;
      component.validarLetraInput(mockEvent, 'busqueda');

      expect(alertaMostrada).toContain('no puede contener números');
      expect(component.busquedaForm.value.letra).toBe('');
    });

    it('debería forzar la mayúscula si se ingresa una letra válida', () => {
      const mockEvent = { target: { value: 'b' } } as unknown as Event;
      component.validarLetraInput(mockEvent, 'busqueda');
      expect(component.busquedaForm.value.letra).toBe('B');
    });
  });

  describe('Lógica de Búsqueda', () => {
    it('debería llamar al servicio y procesar las prestaciones si el formulario es válido', () => {
      component.busquedaForm.setValue({ tipo: 'ND', letra: 'A', puntoVenta: '10', numero: '123' });

      const mockData = [
        { id: 1, paciente: 'Perez', total: 1000, debitoAceptado: 'SI' },
        { id: 2, paciente: 'Gomez', total: 2000, debitoAceptado: 'NO' }
      ] as unknown as Prestacion[];

      // Secuestramos la respuesta y atrapamos los parámetros que Angular intenta enviar
      let parametrosEnviados: any = null;
      auditoriaServiceSpy.buscarPrestaciones = (filtros: any) => {
        parametrosEnviados = filtros;
        return of(mockData);
      };

      component.onBuscar();

      // Usamos toEqual para comparar objetos y toBe(false) en vez de funciones de Jasmine
      expect(parametrosEnviados).toEqual({ tipo: 'ND', letra: 'A', puntoVenta: '10', numero: '123' });
      expect(component.prestaciones.length).toBe(2);
      expect(component.prestaciones[0].debitoAceptado).toBe('SI');
      expect(component.prestaciones[1].debitoAceptado).toBe('NO');
      expect(component.cargando).toBe(false);
    });
  });

  describe('Lógica de Filtros y Cálculos', () => {
    beforeEach(() => {
      // PREPARACIÓN: Le damos al componente una lista falsa de prestaciones para jugar
      component.prestaciones = [
        { id: 1, paciente: 'Perez', medico: 'Dr. House', total: 1000, importeDebitado: 100, debitoAceptado: 'SI' },
        { id: 2, paciente: 'Gomez', medico: 'Dr. Strange', total: 2000, importeDebitado: 0, debitoAceptado: 'NO', importeRefactura: 500 },
        { id: 3, paciente: 'Perez', medico: 'Dr. Strange', total: 500, importeDebitado: 50, debitoAceptado: '' }
      ] as unknown as Prestacion[];
      component.prestacionesFiltradas = [...component.prestaciones];
    });

    it('debería calcular los totales correctamente (Camino Feliz)', () => {
      // ACCIÓN
      component.calcularTotales();

      // VERIFICACIÓN
      expect(component.totalFacturado).toBe(3500); // 1000 + 2000 + 500
      expect(component.totalDebitado).toBe(150);   // 100 + 0 + 50
      expect(component.cantAceptados).toBe(1);     // Solo Perez (id 1)
      expect(component.totalRefacturarRechazado).toBe(500); // Solo Gomez (id 2)
    });

    it('debería filtrar la grilla por paciente y recalcular (Camino Feliz)', () => {
      component.filtroPaciente = 'Perez';

      component.aplicarFiltros();

      expect(component.prestacionesFiltradas.length).toBe(2); // Deberían quedar el id 1 y 3
      expect(component.prestacionesFiltradas[0].paciente).toBe('Perez');
      // Verificamos que el total se recalculó solo para los filtrados
      expect(component.totalFacturado).toBe(1500);
    });

    it('debería manejar filtros combinados que no arrojan resultados (Camino de Error/Borde)', () => {
      // Simulamos que el usuario busca algo que no existe
      component.filtroPaciente = 'Batman';

      component.aplicarFiltros();

      // El sistema no debería crashear, solo devolver vacío y totales en cero
      expect(component.prestacionesFiltradas.length).toBe(0);
      expect(component.totalFacturado).toBe(0);
      expect(component.totalDebitado).toBe(0);
    });

    it('debería limpiar el filtro seleccionado correctamente', () => {
      component.filtroPaciente = 'Perez';
      component.filtroProfesional = 'Dr. House';

      // Simulamos darle click a la cruz del paciente
      component.limpiarFiltro('paciente');

      expect(component.filtroPaciente).toBe('');
      // El profesional tiene que seguir estando filtrado
      expect(component.filtroProfesional).toBe('Dr. House');
    });

    it('debería filtrar solo prestaciones con débito aceptado (SI o NO)', () => {
      component.soloConDebitoAceptado = true;
      component.aplicarFiltros();

      // Deberían quedar solo id 1 ('SI') e id 2 ('NO'), excluyendo id 3 ('')
      expect(component.prestacionesFiltradas.length).toBe(2);
      expect(component.prestacionesFiltradas.map(p => p.id)).toEqual([1, 2]);
    });

    it('debería resetear todos los filtros incluyendo soloConDebitoAceptado', () => {
      component.soloConDebitoAceptado = true;
      component.filtroPaciente = 'Perez';
      component.resetFiltros();

      expect(component.soloConDebitoAceptado).toBe(false);
      expect(component.filtroPaciente).toBe('');
      expect(component.prestacionesFiltradas.length).toBe(3);
    });
  });

  describe('Lógica de Acciones Masivas', () => {
    beforeEach(() => {
      // PREPARACIÓN: Tres filas, dos seleccionadas y una no.
      component.prestacionesFiltradas = [
        { id: 1, seleccionada: true, motivoDebito: '', debitoAceptado: '' },
        { id: 2, seleccionada: true, motivoDebito: 'Falta firma', debitoAceptado: 'NO' },
        { id: 3, seleccionada: false, motivoDebito: '', debitoAceptado: '' }
      ] as unknown as Prestacion[];

      // Forzamos al componente a que detecte cuáles están seleccionadas
      component.actualizarEstadoSeleccion();
    });

    it('debería aplicar motivo de débito masivo solo a las filas seleccionadas (Camino Feliz)', () => {
      // ACCIÓN: Simulamos que el usuario eligió un motivo y forzó sobreescribir
      component.motivoMasivoSeleccionado = 'Débito administrativo';
      component.ejecutarMasivoDebito('Débito administrativo', true);

      // VERIFICACIÓN
      expect(component.prestacionesFiltradas[0].motivoDebito).toBe('Débito administrativo');
      expect(component.prestacionesFiltradas[1].motivoDebito).toBe('Débito administrativo');
      expect(component.prestacionesFiltradas[2].motivoDebito).toBe(''); // La no seleccionada queda intacta
    });

    it('no debería hacer nada si se intenta aplicar masivo sin registros seleccionados (Camino de Error)', () => {
      // ACCIÓN: Vaciamos la selección a propósito
      component.registrosSeleccionados = [];
      component.motivoMasivoSeleccionado = 'Débito administrativo';

      component.aplicarMotivoMasivo();

      // VERIFICACIÓN: Nos aseguramos de que no mutó ningún dato
      expect(component.prestacionesFiltradas[0].motivoDebito).toBe('');
    });

    it('debería limpiar el contenido de las filas seleccionadas al confirmar el modal', () => {
      // Simulamos que el usuario hizo click en "Limpiar Filas"
      component.limpiarFilasSeleccionadas();

      // Simulamos que el usuario hizo click en "Confirmar" dentro del modal
      component.modalAceptarCb();

      // VERIFICACIÓN: El registro 2 que tenía datos debe haber quedado en blanco
      expect(component.prestacionesFiltradas[1].motivoDebito).toBe('');
      expect(component.prestacionesFiltradas[1].debitoAceptado).toBe('');
    });

    it('debería calcular el importeDebitado como el valor del IVA cuando el motivo sea "Iva mal facturado"', () => {
      const p = { id: 10, total: 121, totalNeto: 100, motivoDebito: '' } as Prestacion;
      component.ejecutarIndividualDebito(p, 'Iva mal facturado');
      expect(p.importeDebitado).toBe(21);

      const p2 = { id: 11, total: 500, totalNeto: 500, motivoDebito: '' } as Prestacion;
      component.ejecutarIndividualDebito(p2, 'Afiliado capitado');
      expect(p2.importeDebitado).toBe(500);
    });

    it('debería conservar el importeDebitado existente si se elige no sobreescribirlo', () => {
      const p = { id: 10, total: 1000, totalNeto: 1000, motivoDebito: '', importeDebitado: 350 } as Prestacion;
      component.ejecutarIndividualDebito(p, 'Falta firma', false);
      expect(p.motivoDebito).toBe('Falta firma');
      expect(p.importeDebitado).toBe(350); // Se conserva el valor previo
    });

    it('debería sobreescribir el importeDebitado si se confirma la sobreescritura', () => {
      const p = { id: 10, total: 1000, totalNeto: 1000, motivoDebito: '', importeDebitado: 350 } as Prestacion;
      component.ejecutarIndividualDebito(p, 'Falta firma', true);
      expect(p.motivoDebito).toBe('Falta firma');
      expect(p.importeDebitado).toBe(1000); // Se pisa con el total
    });

    it('debería abrir el modal de confirmación en onCellValueChanged si ya había un importeDebitado ingresado', () => {
      const p = { id: 10, total: 1000, totalNeto: 1000, motivoDebito: '', importeDebitado: 300 } as Prestacion;
      const eventMock: any = {
        data: p,
        colDef: { field: 'motivoDebito' },
        newValue: 'Falta firma',
        oldValue: '',
        api: { refreshCells: () => {} },
        node: { setDataValue: () => {} }
      };

      component.onCellValueChanged(eventMock);

      expect(component.modalVisible).toBe(true);
      expect(component.modalMensaje).toContain('ya tiene un importe debitado ingresado');

      // Si el usuario confirma, pisa el importe
      component.modalAceptarCb();
      expect(p.motivoDebito).toBe('Falta firma');
      expect(p.importeDebitado).toBe(1000);
    });

    it('debería conservar el importe ingresado si el usuario cancela en el modal de onCellValueChanged', () => {
      const p = { id: 10, total: 1000, totalNeto: 1000, motivoDebito: '', importeDebitado: 300 } as Prestacion;
      const eventMock: any = {
        data: p,
        colDef: { field: 'motivoDebito' },
        newValue: 'Falta firma',
        oldValue: '',
        api: { refreshCells: () => {} },
        node: { setDataValue: () => {} }
      };

      component.onCellValueChanged(eventMock);
      expect(component.modalVisible).toBe(true);

      // Si el usuario cancela, asigna el motivo pero mantiene el importe ingresado
      component.modalCancelarCb();
      expect(p.motivoDebito).toBe('Falta firma');
      expect(p.importeDebitado).toBe(300);
    });

    it('debería consultar confirmación al cambiar debitoAceptado a NO si ya tenía importeDebitado cargado', () => {
      const p = { id: 10, total: 1000, totalNeto: 1000, debitoAceptado: '', importeDebitado: 400 } as Prestacion;
      const eventMock: any = {
        data: p,
        colDef: { field: 'debitoAceptado' },
        newValue: 'NO',
        oldValue: '',
        api: { refreshCells: () => {} },
        node: { setDataValue: () => {} }
      };

      component.onCellValueChanged(eventMock);

      expect(component.modalVisible).toBe(true);
      expect(component.modalMensaje).toContain('ya tiene un importe debitado ingresado');

      // Si cancela, se mantiene el importe
      component.modalCancelarCb();
      expect(p.importeDebitado).toBe(400);

      // Si confirma, se limpia el importe
      component.onCellValueChanged(eventMock);
      component.modalAceptarCb();
      expect(p.importeDebitado).toBeUndefined();
    });

    it('debería consultar confirmación al aplicar masivamente debitoAceptado = NO si hay filas con importeDebitado', () => {
      component.prestacionesFiltradas = [
        { id: 1, seleccionada: true, debitoAceptado: '', importeDebitado: 300 },
        { id: 2, seleccionada: true, debitoAceptado: '', importeDebitado: undefined }
      ] as any;
      component.actualizarEstadoSeleccion();
      component.debitoAceptadoMasivoSeleccionado = 'NO';

      component.aplicarDebitoAceptadoMasivo();

      expect(component.modalVisible).toBe(true);

      // Cancelar -> Conserva importe previo
      component.modalCancelarCb();
      expect(component.prestacionesFiltradas[0].debitoAceptado).toBe('NO');
      expect(component.prestacionesFiltradas[0].importeDebitado).toBe(300);

      // Aceptar -> Limpia importe
      component.debitoAceptadoMasivoSeleccionado = 'NO';
      component.aplicarDebitoAceptadoMasivo();
      component.modalAceptarCb();
      expect(component.prestacionesFiltradas[0].importeDebitado).toBeUndefined();
    });

    it('debería asignar el total a importeRefactura cuando debitoAceptado sea "NO" y se seleccione motivo de refactura', () => {
      const p = { id: 12, total: 1500, totalNeto: 1500, debitoAceptado: 'NO', motivoRefactura: '' } as Prestacion;
      component.ejecutarIndividualRefactura(p, 'Falta documentación');
      expect(p.motivoRefactura).toBe('Falta documentación');
      expect(p.importeRefactura).toBe(1500);

      const p2 = { id: 13, total: 800, totalNeto: 800, debitoAceptado: 'SI', motivoRefactura: '' } as Prestacion;
      component.ejecutarIndividualRefactura(p2, 'Falta documentación');
      expect(p2.motivoRefactura).toBe('Falta documentación');
      expect(p2.importeRefactura).toBeUndefined();
    });

    it('no debería trasladar el importe a importeRefactura cuando motivoRefactura sea "No aplica"', () => {
      const p = { id: 14, total: 1500, totalNeto: 1500, debitoAceptado: 'NO', motivoRefactura: '', importeRefactura: 1500 } as Prestacion;
      component.ejecutarIndividualRefactura(p, 'No aplica');
      expect(p.motivoRefactura).toBe('No aplica');
      expect(p.importeRefactura).toBeUndefined();

      // Prueba masiva
      component.registrosSeleccionados = [{ id: 15, total: 2000, debitoAceptado: 'NO', motivoRefactura: '', importeRefactura: 2000 } as Prestacion];
      component.ejecutarMasivoRefactura('No aplica', true);
      expect(component.registrosSeleccionados[0].motivoRefactura).toBe('No aplica');
      expect(component.registrosSeleccionados[0].importeRefactura).toBeUndefined();

      // Prueba al cambiar debitoAceptado masivo con motivoRefactura "No aplica"
      component.registrosSeleccionados = [{ id: 16, total: 2000, debitoAceptado: '', motivoRefactura: 'No aplica' } as Prestacion];
      component.ejecutarMasivoDebitoAceptado('NO', true);
      expect(component.registrosSeleccionados[0].importeRefactura).toBeUndefined();
    });
  });

  describe('Lógica de Guardado Parcial', () => {
    beforeEach(() => {
      // PREPARACIÓN: Simulamos que el usuario buscó una Factura
      component.busquedaForm.setValue({ tipo: 'FC', letra: 'a', puntoVenta: '10', numero: '100' });
      component.tipoBusquedaRealizada = 'FC';
    });

    it('debería armar el payload correcto y enviarlo a la API (Camino Feliz)', () => {
      // PREPARACIÓN: Dos registros, pero solo uno tiene el motivo cargado
      component.prestaciones = [
        { id: 1, motivoDebito: 'Falta firma' },
        { id: 2, motivoDebito: '' }
      ] as unknown as Prestacion[];

      // Secuestramos la función para atrapar el payload justo antes de que salga
      let payloadEnviado: any = null;
      auditoriaServiceSpy.guardarParcialmente = (payload: any) => {
        payloadEnviado = payload;
        return of({}); // Simulamos que el servidor responde OK
      };

      // Espiamos la alerta de éxito usando JS puro
      let alertaMostrada = '';
      component.mostrarAlerta = (mensaje: string) => { alertaMostrada = mensaje; };

      // ACCIÓN
      component.guardarParcialmente();

      // VERIFICACIÓN DEL PAYLOAD
      expect(payloadEnviado).toBeTruthy();
      expect(payloadEnviado.documentoOrigen).toBe('FC');
      expect(payloadEnviado.letra).toBe('A'); // Tiene que forzar mayúscula
      expect(payloadEnviado.ptovta).toBe('10');

      // Verifica que filtró bien: solo debe mandar el registro 1 (el que tiene motivo)
      expect(payloadEnviado.registros.length).toBe(1);
      expect(payloadEnviado.registros[0].id).toBe(1);

      // Verifica UI
      expect(alertaMostrada).toBe('¡Los registros se guardaron parcialmente con éxito!');
      expect(component.cargando).toBe(false);
    });

    it('debería abortar el guardado y avisar si no hay registros válidos (Camino de Error)', () => {
      // PREPARACIÓN: Ningún registro tiene motivo
      component.prestaciones = [
        { id: 1, motivoDebito: '' }
      ] as unknown as Prestacion[];

      let alertaMostrada = '';
      component.mostrarAlerta = (mensaje: string) => { alertaMostrada = mensaje; };

      let servicioLlamado = false;
      auditoriaServiceSpy.guardarParcialmente = () => { servicioLlamado = true; return of({}); };

      // ACCIÓN
      component.guardarParcialmente();

      // VERIFICACIÓN: Crucial asegurarnos de que la petición HTTP NUNCA salió
      expect(alertaMostrada).toBe('No hay registros con motivos asignados para guardar.');
      expect(servicioLlamado).toBe(false);
    });
  });

  describe('Lógica de Nueva Nota (NC/ND)', () => {
    beforeEach(() => {
      // PREPARACIÓN: Simulamos que estamos viendo una Factura
      component.busquedaForm.setValue({ tipo: 'FC', letra: 'a', puntoVenta: '10', numero: '123' });
      component.tipoBusquedaRealizada = 'FC';
    });

    it('debería impedir abrir el modal de NC a partir de una ND con ajuste de IVA (Camino de Error)', () => {
      component.tipoBusquedaRealizada = 'ND';
      component.prestaciones = [{ id: 1, motivoRefactura: 'Por ajuste de IVA' }] as any;
      let alerta = '';
      component.mostrarAlerta = (msg: string) => alerta = msg;

      // ACCIÓN
      component.abrirModalNuevaNota('NC');

      // VERIFICACIÓN
      expect(alerta).toContain('No se puede generar una Nota de Crédito a partir de una Nota de Débito');
      expect(component.modalNuevaNotaVisible).toBe(false);
    });

    it('debería abrir el modal y pre-cargar el tipo si hay registros válidos (Camino Feliz)', () => {
      component.prestaciones = [{ id: 1, motivoDebito: 'Falta documentación' }] as any;

      component.abrirModalNuevaNota('NC');

      expect(component.tipoNuevaNota).toBe('NC');
      expect(component.nuevaNotaForm.value.tipo).toBe('NC');
      expect(component.modalNuevaNotaVisible).toBe(true);
    });

    it('debería armar el payload completo Todo-en-Uno al guardar la nueva nota', () => {
      // 1. Preparar registros válidos
      component.prestaciones = [{ id: 1, motivoDebito: 'Falta documentación' }] as any;
      component.tipoNuevaNota = 'NC';
      component.modalNuevaNotaVisible = true;

      // 2. Llenar el formulario del modal
      component.nuevaNotaForm.patchValue({
        tipo: 'NC', letra: 'b', puntoVenta: '12', numero: '456', fecha: '2026-04-27'
      });

      // 3. Atrapar el payload
      let payloadEnviado: any = null;
      auditoriaServiceSpy.guardarNuevaNotaCredito = (payload: any) => {
        payloadEnviado = payload;
        return of({}); // Respuesta OK del servidor
      };

      // 4. Ejecutar
      component.guardarNuevaNotaBD();

      // 5. Verificar que el payload tiene la estructura "Todo en Uno"
      expect(payloadEnviado).toBeTruthy();
      expect(payloadEnviado.origen).toBe('FC');
      expect(payloadEnviado.letraOriginal).toBe('A'); // De la búsqueda original (Forzada a mayúscula)

      // Verificar datos del nuevo documento (La letra "b" minúscula del modal debe pasar a "B")
      expect(payloadEnviado.datosNota.letra).toBe('B');
      expect(payloadEnviado.datosNota.numero).toBe('456');

      // Verificar que incluyó los registros a impactar
      expect(payloadEnviado.registros.length).toBe(1);

      // Verificar que cerró el modal tras el éxito
      expect(component.modalNuevaNotaVisible).toBe(false);
    });
  });

  describe('Lógica de Exportación a Excel', () => {
    beforeEach(() => {
      component.busquedaForm.setValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '100' });
      component.tipoBusquedaRealizada = 'FC';
    });

    it('debería exportar solo las prestaciones con Débito Aceptado "SI" o "NO"', () => {
      component.prestacionesFiltradas = [
        { id: 1, paciente: 'Perez', debitoAceptado: 'SI' },
        { id: 2, paciente: 'Gomez', debitoAceptado: 'NO' },
        { id: 3, paciente: 'Lopez', debitoAceptado: '' },
        { id: 4, paciente: 'Diaz', debitoAceptado: undefined }
      ] as any;

      let datosExportados: any[] = [];
      excelServiceSpy.exportarPrestaciones = (data: any[]) => {
        datosExportados = data;
      };

      component.exportarAExcel();

      expect(datosExportados.length).toBe(2);
      expect(datosExportados[0].id).toBe(1);
      expect(datosExportados[1].id).toBe(2);
    });

    it('debería mostrar alerta si no hay prestaciones con Débito Aceptado "SI" o "NO"', () => {
      component.prestacionesFiltradas = [
        { id: 1, paciente: 'Perez', debitoAceptado: '' },
        { id: 2, paciente: 'Gomez', debitoAceptado: undefined }
      ] as any;

      let alertaMostrada = '';
      component.mostrarAlerta = (mensaje: string) => { alertaMostrada = mensaje; };

      let llamado = false;
      excelServiceSpy.exportarPrestaciones = () => { llamado = true; };

      component.exportarAExcel();

      expect(alertaMostrada).toContain('No hay prestaciones con Débito Aceptado (SI o NO)');
      expect(llamado).toBe(false);
    });
  });

  describe('Configuración de Tooltips en Columnas de Comentarios', () => {
    it('debería tener configurado tooltipValueGetter en las columnas de comentarios', () => {
      component.tipoBusquedaRealizada = 'FC';
      component.configurarColumnas();

      const colComentariosDebito = component.columnDefs.find(c => c.field === 'comentariosDebito');
      expect(colComentariosDebito).toBeDefined();
      expect(typeof colComentariosDebito?.tooltipValueGetter).toBe('function');
      expect((colComentariosDebito?.tooltipValueGetter as any)({ value: 'Observación de prueba' })).toBe('Observación de prueba');

      const colComentariosRefactura = component.columnDefs.find(c => c.field === 'comentarios');
      expect(colComentariosRefactura).toBeDefined();
      expect(typeof colComentariosRefactura?.tooltipValueGetter).toBe('function');
      expect((colComentariosRefactura?.tooltipValueGetter as any)({ value: 'Observación refactura' })).toBe('Observación refactura');
    });
  });

  describe('Gestión de Estado de Conciliación (cambiarEstadoGrupo)', () => {
    it('debería mostrar alerta de error si idGrupo no está presente', () => {
      let alerta = '';
      component.mostrarAlerta = (msg: string) => { alerta = msg; };

      component.cambiarEstadoGrupo(0 as any, 2);

      expect(alerta).toContain('No se identificó el ID de grupo');
    });

    it('debería abrir modal de confirmación si requiereConfirmacion es true', () => {
      auditoriaServiceSpy.cambiarEstadoGrupo = (idGrupo: any, estado: any, forzar: boolean) => {
        if (!forzar) {
          return of({
            requiereConfirmacion: true,
            mensajeAlerta: 'Diferencia detectada: $ 500.00. ¿Desea forzar el cierre?',
            exito: false
          });
        }
        return of({
          requiereConfirmacion: false,
          mensajeAlerta: null,
          exito: true
        });
      };

      component.cambiarEstadoGrupo(10, 2, false);

      expect(component.modalVisible).toBe(true);
      expect(component.modalMensaje).toContain('Diferencia detectada');

      // Al confirmar en el modal, debe ejecutar llamada recursiva con forzar = true
      let alertaExito = '';
      component.mostrarAlerta = (msg: string) => { alertaExito = msg; };

      component.modalAceptarCb();

      expect(component.modalVisible).toBe(false);
      expect(alertaExito).toContain('finalizado exitosamente');
    });

    it('debería finalizar el trámite directamente si exito es true', () => {
      auditoriaServiceSpy.cambiarEstadoGrupo = () => of({
        requiereConfirmacion: false,
        exito: true
      });

      let alertaExito = '';
      component.mostrarAlerta = (msg: string) => { alertaExito = msg; };

      component.cambiarEstadoGrupo(10, 2, false);

      expect(alertaExito).toContain('finalizado exitosamente');
    });

    it('debería reabrir el trámite directamente cuando nuevoEstado es 1', () => {
      auditoriaServiceSpy.cambiarEstadoGrupo = () => of({
        requiereConfirmacion: false,
        exito: true
      });

      let alertaExito = '';
      component.mostrarAlerta = (msg: string) => { alertaExito = msg; };

      component.cambiarEstadoGrupo(10, 1, false);

      expect(alertaExito).toContain('reabierto exitosamente');
    });

    it('debería calcular correctamente filaFacturaRaiz, idGrupoActual e idEstadoActual', () => {
      component.filasHistorialComprobantes = [
        { tipoDocumento: 'FC', nivel: 0, idGrupo: 105, idEstado: 1 },
        { tipoDocumento: 'NC', nivel: 1, idGrupo: 105, idEstado: 1 }
      ];

      expect(component.filaFacturaRaiz).toEqual({ tipoDocumento: 'FC', nivel: 0, idGrupo: 105, idEstado: 1 });
      expect(component.idGrupoActual).toBe(105);
      expect(component.idEstadoActual).toBe(1);
    });

    it('debería identificar roles sin permisos de cambio de estado (DIRECTORIO, CONSULTA, ADMIN)', () => {
      authServiceSpy.hasAnyRole = (roles: string[]) => false;

      expect(component.authService.hasAnyRole(['OPERADOR', 'AUDITOR'])).toBe(false);
    });
  });

  describe('Lógica de Historial de Comprobantes y Navegación', () => {
    it('abrirModalHistorialComprobantes y cerrarModalHistorialComprobantes deberían alternar visibilidad', () => {
      component.modalHistorialVisible = false;
      component.abrirModalHistorialComprobantes();
      expect(component.modalHistorialVisible).toBe(true);

      component.cerrarModalHistorialComprobantes();
      expect(component.modalHistorialVisible).toBe(false);
    });

    it('exportarHistorialAExcel debería validar filas y llamar a excelService', () => {
      component.filasHistorialComprobantes = [];
      let alerta = '';
      component.mostrarAlerta = (msg: string) => { alerta = msg; };
      component.exportarHistorialAExcel();
      expect(alerta).toContain('No hay comprobantes en el historial');

      component.filasHistorialComprobantes = [{ tipoDocumento: 'FC', letra: 'A', numero: 100 }];
      component.busquedaForm.patchValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '100' });
      component.exportarHistorialAExcel();
      expect(excelServiceSpy.exportarHistorialComprobantes).toHaveBeenCalled();
    });

    it('esDocumentoBuscado debería comparar tipo, letra, ptovta y numero', () => {
      component.busquedaForm.patchValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '100' });

      expect(component.esDocumentoBuscado({ tipoDocumento: 'FC', letra: 'A', puntoVenta: 1, numero: 100 })).toBe(true);
      expect(component.esDocumentoBuscado({ tipoDocumento: 'FC', letra: 'B', puntoVenta: 1, numero: 100 })).toBe(false);
      expect(component.esDocumentoBuscado({ placeholderNdAjusteIva: true })).toBe(false);

      // Para tipo RC
      component.busquedaForm.patchValue({ tipo: 'RC', numero: '50' });
      expect(component.esDocumentoBuscado({ tipoDocumento: 'RC', numero: 50 })).toBe(true);
      expect(component.esDocumentoBuscado({ tipoDocumento: 'RC', numero: 60 })).toBe(false);
    });

    it('cargarDocumentoDesdeHistorial debería cargar parámetros en busquedaForm y ejecutar búsqueda', () => {
      const filaFC = { tipoDocumento: 'FC', letra: 'A', puntoVenta: 2, numero: 200, tienePrestaciones: true };
      let busquedaEjecutada = false;
      component.onBuscar = () => { busquedaEjecutada = true; };

      component.cargarDocumentoDesdeHistorial(filaFC);
      expect(component.busquedaForm.value.tipo).toBe('FC');
      expect(Number(component.busquedaForm.value.numero)).toBe(200);
      expect(busquedaEjecutada).toBe(true);

      // Placeholder de ND
      const filaPlaceholder = { placeholderNdAjusteIva: true };
      let modalNdAbierto = false;
      component.abrirModalCrearNdAjusteIvaDesdeTabla = () => { modalNdAbierto = true; };
      component.cargarDocumentoDesdeHistorial(filaPlaceholder);
      expect(modalNdAbierto).toBe(true);

      // Fila de IVA ya existente
      const filaIva = { origenTipo: 'IVA' };
      busquedaEjecutada = false;
      component.cargarDocumentoDesdeHistorial(filaIva);
      expect(busquedaEjecutada).toBe(false);
    });
  });

  describe('Lógica de Ajuste de IVA y Subtipos', () => {
    it('onTipoNcChange debería reconfigurar validadores para ajuste de IVA y Refactura', () => {
      component.nuevaNotaForm.patchValue({ tipoNc: 'Por ajuste de IVA' });
      component.onTipoNcChange();
      expect(component.nuevaNotaForm.get('subtipoIva')?.validator).toBeDefined();

      component.nuevaNotaForm.patchValue({ tipoNc: 'Refactura' });
      component.onTipoNcChange();
      expect(component.nuevaNotaForm.get('subtipoIva')?.validator).toBeNull();
    });

    it('onSubtipoIvaChange y calcularTotalesIvaPrestacional deberían calcular IVA según prestaciones', () => {
      component.prestaciones = [
        {
          id: 1,
          totalNeto: 1000,
          coseguro: 0,
          total: 1000,
          motivoDebito: 'IVA mal facturado'
        } as any
      ];

      component.nuevaNotaForm.patchValue({ subtipoIva: 'Prestacional', porcIva: 21 });
      component.onSubtipoIvaChange();

      expect(component.hasPrestacionesIvaMalFacturado).toBe(true);
      expect(component.montoNetoPrestacional).toBe(1000);
      expect(component.montoIvaCalculado).toBe(210);
    });

    it('onRadioOptionClick debería prevenir selección si está deshabilitado por ajuste IVA', () => {
      component.deshabilitarPorAjusteIva = true;
      const ev = new MouseEvent('click');
      const preventSpy = vi.spyOn(ev, 'preventDefault');

      component.onRadioOptionClick(ev, 'Por ajuste de IVA');
      expect(preventSpy).toHaveBeenCalled();
    });
  });

  describe('Lógica de Filtros, Limpieza y Exportación', () => {
    it('limpiarFiltro debería reiniciar controles y aplicar filtros', () => {
      component.filtroPaciente = 'Juan';
      component.filtroFecha = '2025-01-01';

      component.limpiarFiltro('paciente');
      expect(component.filtroPaciente).toBe('');

      component.limpiarFiltro('fecha');
      expect(component.filtroFecha).toBe('');
    });

    it('exportarAExcel debería validar prestaciones y llamar a ExcelExportService', () => {
      component.prestacionesFiltradas = [];
      let alerta = '';
      component.mostrarAlerta = (msg: string) => { alerta = msg; };

      component.exportarAExcel();
      expect(alerta).toContain('No hay datos');

      component.prestacionesFiltradas = [{ id: 1, total: 100, debitoAceptado: 'SI' } as any];
      component.tipoBusquedaRealizada = 'FC';
      component.busquedaForm.patchValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '100' });
      component.exportarAExcel();
      expect(excelServiceSpy.exportarPrestaciones).toHaveBeenCalled();
    });
  });

  describe('Acciones Masivas Adicionales', () => {
    it('aplicarImporteDebitadoMasivo debería asignar importe a las filas seleccionadas', () => {
      const p1 = { id: 1, importeDebitado: undefined } as any;
      component.registrosSeleccionados = [p1];
      component.importeDebitadoMasivo = 250;

      component.aplicarImporteDebitadoMasivo();
      expect(p1.importeDebitado).toBe(250);
      expect(component.importeDebitadoMasivo).toBeUndefined();
    });

    it('aplicarImporteRefacturaMasivo debería ignorar filas con débito aceptado SI', () => {
      const p1 = { id: 1, debitoAceptado: 'SI', importeRefactura: undefined } as any;
      const p2 = { id: 2, debitoAceptado: 'NO', importeRefactura: undefined } as any;
      component.registrosSeleccionados = [p1, p2];
      component.importeRefacturaMasivo = 500;

      component.aplicarImporteRefacturaMasivo();
      expect(p1.importeRefactura).toBeUndefined();
      expect(p2.importeRefactura).toBe(500);
    });

    it('aplicarImporteRefacturaMasivo debería alertar si todas las filas tienen débito SI', () => {
      const p1 = { id: 1, debitoAceptado: 'SI' } as any;
      component.registrosSeleccionados = [p1];
      component.importeRefacturaMasivo = 500;

      let alerta = '';
      component.mostrarAlerta = (msg: string) => { alerta = msg; };

      component.aplicarImporteRefacturaMasivo();
      expect(alerta).toContain('No se puede asignar un Importe de Refactura');
    });

    it('aplicarComentariosMasivo y aplicarComentariosDebitoMasivo deberían asignar comentarios a filas seleccionadas', () => {
      const p1 = { id: 1, debitoAceptado: 'NO', motivoDebito: 'Motivo Test', comentarios: '', comentariosDebito: '' } as any;
      component.registrosSeleccionados = [p1];

      component.comentariosMasivo = 'Comentario refactura test';
      component.aplicarComentariosMasivo();
      expect(p1.comentarios).toBe('Comentario refactura test');

      component.comentariosDebitoMasivo = 'Comentario debito test';
      component.aplicarComentariosDebitoMasivo();
      expect(p1.comentariosDebito).toBe('Comentario debito test');
    });
  });

  describe('Cabeceras y Modo Manual para Notas de Ajuste IVA', () => {
    it('cargarCabecerasDisponiblesNdIva debería solicitar cabeceras al backend', () => {
      auditoriaServiceSpy.obtenerCabecerasDisponibles = vi.fn().mockReturnValue(of([
        { id: 10, tipo: 'ND', letra: 'A', ptovta: 1, numero: 50, fecha: '2025-01-01' }
      ]));

      component.busquedaForm.patchValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '100' });
      component.cargarCabecerasDisponiblesNdIva();

      expect(auditoriaServiceSpy.obtenerCabecerasDisponibles).toHaveBeenCalledWith('ND', 'NC', 'A', '1', '100');
      expect(component.cabecerasDisponiblesNdIva.length).toBe(1);
      expect(component.cabeceraSeleccionadaIdNdIva).toBe(10);
    });

    it('alternarModoIngresoManual y alternarModoIngresoManualNdIva deberían limpiar selecciones', () => {
      component.alternarModoIngresoManual(true);
      expect(component.modoIngresoManual).toBe(true);
      expect(component.cabeceraSeleccionadaId).toBeNull();

      component.alternarModoIngresoManualNdIva(true);
      expect(component.modoIngresoManualNdIva).toBe(true);
      expect(component.cabeceraSeleccionadaIdNdIva).toBeNull();
    });

    it('abrirModalCrearNdAjusteIvaDesdeTabla debería pre-cargar datos desde filasResumenAjusteIva', () => {
      component.filasResumenAjusteIva = [
        { tipoDocumento: 'FC' },
        { tipoDocumento: 'NC', letra: 'A', puntoVenta: 1, numero: 50, fechaDocumento: '2025-01-01', montoNeto: 1000, porcentajeIva: 21, montoIva: 210 }
      ];

      component.abrirModalCrearNdAjusteIvaDesdeTabla();
      expect(component.soloCrearNdAjusteIva).toBe(true);
      expect(component.modalNuevaNotaVisible).toBe(true);
      expect(component.nuevaNotaForm.get('tipoNc')?.value).toBe('Por ajuste de IVA');
    });
  });

  describe('Ordenamiento, Selección y Paginación', () => {
    it('onSort debería alternar dirección y ordenar prestaciones', () => {
      component.prestacionesFiltradas = [
        { id: 1, total: 200 } as any,
        { id: 2, total: 100 } as any
      ];

      component.onSort('total');
      expect(component.columnaOrden).toBe('total');
      expect(component.direccionOrden).toBe('asc');
      expect(component.prestacionesFiltradas[0].total).toBe(100);

      component.onSort('total');
      expect(component.direccionOrden).toBe('desc');
      expect(component.prestacionesFiltradas[0].total).toBe(200);

      expect(component.getIcono('total')).toBe('▼');
      expect(component.getIcono('otro')).toBe('');
    });

    it('toggleSelectAll y toggleRow deberían actualizar seleccionados', () => {
      const p1 = { id: 1, seleccionada: false } as any;
      component.prestacionesFiltradas = [p1];

      const eventAll = { target: { checked: true } } as any;
      component.toggleSelectAll(eventAll);
      expect(p1.seleccionada).toBe(true);

      const eventRow = { target: { checked: false } } as any;
      component.toggleRow(p1, eventRow);
      expect(p1.seleccionada).toBe(false);
    });

    it('actualizarPaginacion debería calcular páginas y recortar prestaciones', () => {
      component.itemsPorPagina = 2;
      component.prestacionesFiltradas = [
        { id: 1 } as any,
        { id: 2 } as any,
        { id: 3 } as any
      ];

      component.paginaActual = 1;
      component.actualizarPaginacion();
      expect(component.totalPaginas).toBe(2);
      expect(component.prestacionesPaginadas.length).toBe(2);
    });
  });

  describe('Eventos de Ciclo de Vida, Cierre y Logout', () => {
    it('alIntentarCerrar debería prevenir BeforeUnloadEvent si hay cambios pendientes', () => {
      component.modificadosSinGuardar.add(1);
      const fakeEvent = { preventDefault: vi.fn(), returnValue: '' } as any;

      component.alIntentarCerrar(fakeEvent);
      expect(fakeEvent.preventDefault).toHaveBeenCalled();
      expect(fakeEvent.returnValue).toContain('Tenés cambios sin guardar');
    });

    it('onLogout debería bloquear salida si hay cambios sin guardar', () => {
      component.modificadosSinGuardar.add(1);
      let alerta = '';
      component.mostrarAlerta = (msg: string) => { alerta = msg; };

      component.onLogout();
      expect(alerta).toContain('Tenés registros sin guardar');

      component.modificadosSinGuardar.clear();
      component.onLogout();
      expect(authServiceSpy.logout).toHaveBeenCalled();
    });

    it('reproducirTourCompleto y reproducirTourDesdeAyuda deberían invocar TourService', () => {
      const tourSpy = vi.spyOn((component as any).tourService, 'startFullTour');
      component.prestaciones = [{ id: 1 } as any];

      component.reproducirTourCompleto();
      expect(tourSpy).toHaveBeenCalledWith(true);

      component.isHelpDrawerOpen = true;
      component.reproducirTourDesdeAyuda();
      expect(component.isHelpDrawerOpen).toBe(false);
      expect(tourSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edición y Guardado de NC/ND Ajuste de IVA', () => {
    it('esPorcIvaDeshabilitadoEnNd y prevenirClickSiDeshabilitado deberían controlar interacciones', () => {
      component.nuevaNotaForm.patchValue({
        tipoNc: 'Por ajuste de IVA',
        subtipoIva: 'No prestacional',
        porcIva: 21
      });

      expect(component.esPorcIvaDeshabilitadoEnNd(21)).toBe(true);
      expect(component.esPorcIvaDeshabilitadoEnNd(10.5)).toBe(false);

      const ev = new MouseEvent('click');
      const preventSpy = vi.spyOn(ev, 'preventDefault');
      component.prevenirClickSiDeshabilitado(ev, true);
      expect(preventSpy).toHaveBeenCalled();
    });

    it('iniciarEdicionNcAjusteIva y cancelarEdicionNcAjusteIva deberían alternar estados del formulario', () => {
      component.datosNcCreada = {
        tipo: 'NC',
        letra: 'A',
        puntoVenta: 1,
        numero: 10,
        fecha: '2025-01-01',
        tipoNc: 'Por ajuste de IVA',
        subtipoIva: 'No prestacional',
        netoNc: 1000,
        porcIva: 21,
        ivaNc: 210
      };

      component.iniciarEdicionNcAjusteIva();
      expect(component.editandoNcAjusteIva).toBe(true);
      expect(component.nuevaNotaForm.enabled).toBe(true);

      component.cancelarEdicionNcAjusteIva();
      expect(component.editandoNcAjusteIva).toBe(false);
      expect(component.nuevaNotaForm.disabled).toBe(true);
    });

    it('guardarEdicionNcAjusteIva debería validar formulario y enviar payload', () => {
      auditoriaServiceSpy.editarNcAjusteIva = vi.fn().mockReturnValue(of({}));
      component.busquedaForm.patchValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '100' });
      component.nuevaNotaForm.patchValue({
        tipo: 'NC',
        letra: 'A',
        puntoVenta: '1',
        numero: '10',
        fecha: '2025-01-01',
        tipoNc: 'Por ajuste de IVA',
        subtipoIva: 'No prestacional',
        netoNc: 1000,
        porcIva: 21,
        ivaNc: 210
      });

      component.guardarEdicionNcAjusteIva();
      expect(auditoriaServiceSpy.editarNcAjusteIva).toHaveBeenCalled();
      expect(component.editandoNcAjusteIva).toBe(false);
    });

    it('guardarNotaDebitoAjusteIva debería enviar payload completo de ND', () => {
      auditoriaServiceSpy.guardarNuevaNotaDebitoAjusteIva = vi.fn().mockReturnValue(of({}));
      component.datosNcCreada = {
        tipo: 'NC',
        letra: 'A',
        puntoVenta: '1',
        numero: '10'
      };
      component.netoAjusteIva = 1000;
      component.montoIvaNdCalculado = 105;
      component.nuevaNotaDebitoIvaForm.patchValue({
        tipo: 'ND',
        letra: 'A',
        puntoVenta: '1',
        numero: '11',
        fecha: '2025-01-01',
        porcIva: 10.5,
        ivaNd: 105
      });

      component.guardarNotaDebitoAjusteIva();
      expect(auditoriaServiceSpy.guardarNuevaNotaDebitoAjusteIva).toHaveBeenCalled();
      expect(component.modalNuevaNotaVisible).toBe(false);
    });
  });

  describe('Documento Ausente y Copiado', () => {
    it('copiarDatosDocAusente debería usar clipboard API y mostrar feedback', async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextSpy
        }
      });

      component.docAusenteDetalle = {
        documentoCompleto: 'FC A-0001-00000100',
        tipo: 'FC',
        letra: 'A',
        puntoVenta: 1,
        numero: 100,
        usuario: 'tester',
        fechaHora: '2025-01-01T10:00:00Z',
        mensaje: 'Falta comprobante'
      };

      component.copiarDatosDocAusente();
      await Promise.resolve();
      expect(writeTextSpy).toHaveBeenCalled();
      expect(component.textoCopiadoFeedback).toBe(true);

      component.cerrarModalReporteDocAusente();
      expect(component.modalReporteDocAusenteVisible).toBe(false);
    });
  });

  describe('Guardado Parcial y Telemetría Store-and-Forward', () => {
    it('guardarParcialmente debería enviar cambios pendientes al backend', () => {
      auditoriaServiceSpy.guardarParcialmente = vi.fn().mockReturnValue(of({ exito: true }));
      component.tipoBusquedaRealizada = 'FC';
      component.busquedaForm.patchValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '100' });
      const p1 = { id: 1, motivoDebito: 'Motivo 1', debitoAceptado: 'SI' } as any;
      component.prestaciones = [p1];
      component.modificadosSinGuardar.add(1);

      component.guardarParcialmente(false);
      expect(auditoriaServiceSpy.guardarParcialmente).toHaveBeenCalled();
      expect(component.modificadosSinGuardar.size).toBe(0);
    });

    it('guardarParcialmente con error status 0 debería almacenar en localStorage', () => {
      const errorResponse = { status: 0 };
      auditoriaServiceSpy.guardarParcialmente = vi.fn().mockReturnValue(throwError(() => errorResponse));
      component.tipoBusquedaRealizada = 'FC';
      component.busquedaForm.patchValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '100' });
      const p1 = { id: 1, motivoDebito: 'Motivo 1', debitoAceptado: 'SI' } as any;
      component.prestaciones = [p1];
      component.modificadosSinGuardar.add(1);

      component.guardarParcialmente(false);
      const pendientes = localStorage.getItem('telemetria_pendientes');
      expect(pendientes).toBeDefined();
    });

    it('actualizarValidadoresTipo para RC debería deshabilitar letra y punto de venta', () => {
      component.actualizarValidadoresTipo('RC');
      expect(component.busquedaForm.get('letra')?.disabled).toBe(true);
      expect(component.busquedaForm.get('puntoVenta')?.disabled).toBe(true);

      component.actualizarValidadoresTipo('FC');
      expect(component.busquedaForm.get('letra')?.enabled).toBe(true);
      expect(component.busquedaForm.get('puntoVenta')?.enabled).toBe(true);
    });

    it('onCellValueChanged para importes con coma debería convertirlo a número decimal', () => {
      const p: any = { id: 1 };
      const event: any = {
        data: p,
        colDef: { field: 'importeDebitado' },
        newValue: '123,45',
        oldValue: ''
      };

      component.onCellValueChanged(event);
      expect(p.importeDebitado).toBe(123.45);
    });

    it('onCellValueChanged para motivoRefactura en fila con debito SI debería bloquearse', () => {
      const p: any = { id: 1, debitoAceptado: 'SI' };
      let alerta = '';
      component.mostrarAlerta = (msg: string) => { alerta = msg; };
      const event: any = {
        data: p,
        colDef: { field: 'motivoRefactura' },
        newValue: 'Refactura 1',
        oldValue: '',
        node: { setDataValue: vi.fn() },
        api: { refreshCells: vi.fn() }
      };

      component.onCellValueChanged(event);
      expect(alerta).toContain('No se puede asignar Motivo');
      expect(p.motivoRefactura).toBe('');
    });

    it('onCellValueChanged para motivoRefactura con previo debería abrir modal y permitir aceptar/cancelar', () => {
      const p: any = { id: 1, debitoAceptado: 'NO', motivoRefactura: 'Previo' };
      const event: any = {
        data: p,
        colDef: { field: 'motivoRefactura' },
        newValue: 'Nuevo',
        oldValue: 'Previo',
        node: { setDataValue: vi.fn() },
        api: { refreshCells: vi.fn() }
      };

      component.onCellValueChanged(event);
      expect(component.modalVisible).toBe(true);

      component.modalAceptarCb();
      expect(p.motivoRefactura).toBe('Nuevo');

      component.onCellValueChanged(event);
      component.modalCancelarCb();
      expect(p.motivoRefactura).toBe('Previo');
    });

    it('guardarNuevaNotaBD con ND por ajuste de IVA debería enviar datos correspondientes', () => {
      auditoriaServiceSpy.guardarNuevaNotaDebito = vi.fn().mockReturnValue(of({}));
      component.tipoNuevaNota = 'ND';
      component.tipoBusquedaRealizada = 'NC';
      component.busquedaForm.patchValue({ tipo: 'NC', letra: 'A', puntoVenta: '1', numero: '100' });
      component.nuevaNotaForm.patchValue({
        tipo: 'ND',
        letra: 'A',
        puntoVenta: '1',
        numero: '50',
        fecha: '2025-01-01',
        tipoNd: 'Por ajuste de IVA',
        importeNd: 500
      });

      component.guardarNuevaNotaBD();
      expect(auditoriaServiceSpy.guardarNuevaNotaDebito).toHaveBeenCalled();
    });

    it('guardarNuevaNotaBD con NC por ajuste de IVA no prestacional debería enviar datos', () => {
      auditoriaServiceSpy.guardarNuevaNotaCredito = vi.fn().mockReturnValue(of({}));
      component.tipoNuevaNota = 'NC';
      component.tipoBusquedaRealizada = 'FC';
      component.busquedaForm.patchValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '100' });
      component.nuevaNotaForm.patchValue({
        tipo: 'NC',
        letra: 'A',
        puntoVenta: '1',
        numero: '60',
        fecha: '2025-01-01',
        tipoNc: 'Por ajuste de IVA',
        subtipoIva: 'No prestacional',
        netoNc: 1000,
        porcIva: 21,
        ivaNc: 210
      });

      component.guardarNuevaNotaBD();
      expect(auditoriaServiceSpy.guardarNuevaNotaCredito).toHaveBeenCalled();
    });
  });

  describe('Candidatos de Comprobantes y Modales de Confirmación', () => {
    it('cargarCabecerasDisponibles debería auto-seleccionar si hay solo 1 candidata sin prestaciones imputadas', () => {
      const mockCab = [{ id: 10, label: 'NC A 1-50', tienePrestacionesImputadas: false }];
      auditoriaServiceSpy.obtenerCabecerasDisponibles = vi.fn().mockReturnValue(of(mockCab));
      const spySelect = vi.spyOn(component, 'onSeleccionarCabecera');

      component.tipoNuevaNota = 'NC';
      component.cargarCabecerasDisponibles('NC');

      expect(component.cabecerasDisponibles.length).toBe(1);
      expect(spySelect).toHaveBeenCalledWith(10);
    });

    it('cargarCabecerasDisponibles no debería auto-seleccionar si la única candidata ya tiene prestaciones imputadas', () => {
      const mockCab = [{ id: 10, label: 'NC A 1-50', tienePrestacionesImputadas: true }];
      auditoriaServiceSpy.obtenerCabecerasDisponibles = vi.fn().mockReturnValue(of(mockCab));
      const spySelect = vi.spyOn(component, 'onSeleccionarCabecera');

      component.tipoNuevaNota = 'NC';
      component.cargarCabecerasDisponibles('NC');

      expect(component.cabecerasDisponibles.length).toBe(1);
      expect(spySelect).not.toHaveBeenCalled();
    });

    it('onSeleccionarCabecera debería abrir modal de confirmación si tienePrestacionesImputadas es true', () => {
      const cab = { id: 25, tipo: 'NC', letra: 'A', ptovta: 1, numero: '555', tienePrestacionesImputadas: true };
      component.cabecerasDisponibles = [cab as any];

      component.onSeleccionarCabecera(25);

      expect(component.modalVisible).toBe(true);
      expect(component.modalMensaje).toContain('ya tiene prestaciones imputadas');

      // Prueba de Aceptar en el modal
      component.modalAceptarCb();
      expect(component.modalVisible).toBe(false);
      expect(component.cabeceraSeleccionadaId).toBe(25);
      expect(component.nuevaNotaForm.get('numero')?.value).toBe('555');

      // Prueba de Cancelar en el modal
      component.onSeleccionarCabecera(25);
      expect(component.modalVisible).toBe(true);
      component.modalCancelarCb();
      expect(component.modalVisible).toBe(false);
      expect(component.cabeceraSeleccionadaId).toBeNull();
    });

    it('onSeleccionarCabecera debería limpiar selección si se pasa null o MANUAL', () => {
      component.cabeceraSeleccionadaId = 99;
      component.onSeleccionarCabecera('MANUAL');
      expect(component.cabeceraSeleccionadaId).toBeNull();

      component.cabeceraSeleccionadaId = 99;
      component.onSeleccionarCabecera('');
      expect(component.cabeceraSeleccionadaId).toBeNull();
    });

    it('alternarModoIngresoManual debería conmutar entre selección y manual', () => {
      component.tipoNuevaNota = 'NC';
      component.alternarModoIngresoManual(true);
      expect(component.modoIngresoManual).toBe(true);
      expect(component.cabeceraSeleccionadaId).toBeNull();

      component.cabecerasDisponibles = [{ id: 40 } as any];
      component.cabeceraSeleccionadaId = 40;
      component.alternarModoIngresoManual(false);
      expect(component.modoIngresoManual).toBe(false);
      expect(component.cabeceraSeleccionadaObjeto?.id).toBe(40);
    });

    it('cargarCabecerasDisponiblesNdIva y onSeleccionarCabeceraNdIva deberían gestionar candidatos de ND', () => {
      const mockNd = [{ id: 88, tipo: 'ND', letra: 'A', ptovta: 1, numero: 888, tienePrestacionesImputadas: true }];
      auditoriaServiceSpy.obtenerCabecerasDisponibles = vi.fn().mockReturnValue(of(mockNd));

      component.cargarCabecerasDisponiblesNdIva();
      expect(component.cabecerasDisponiblesNdIva.length).toBe(1);

      component.onSeleccionarCabeceraNdIva(88);
      expect(component.modalVisible).toBe(true);
      expect(component.modalMensaje).toContain('ya tiene prestaciones imputadas');

      component.modalAceptarCb();
      expect(component.cabeceraSeleccionadaIdNdIva).toBe(88);

      component.onSeleccionarCabeceraNdIva('MANUAL');
      expect(component.cabeceraSeleccionadaIdNdIva).toBeNull();
    });

    it('cerrarModalNuevaNota debería restablecer variables del modal', () => {
      component.modalNuevaNotaVisible = true;
      component.cabeceraSeleccionadaId = 5;
      component.cerrarModalNuevaNota();

      expect(component.modalNuevaNotaVisible).toBe(false);
      expect(component.cabeceraSeleccionadaId).toBeNull();
      expect(component.cabecerasDisponibles).toEqual([]);
    });
  });

  describe('Acciones Masivas y Selección Múltiple en Grilla', () => {
    beforeEach(() => {
      component.prestaciones = [
        { id: 1, paciente: 'P1', motivoDebito: '', importeDebitado: 0, debitoAceptado: null, motivoRefactura: '', importeRefactura: 0, comentarios: '', comentariosDebito: '' },
        { id: 2, paciente: 'P2', motivoDebito: '', importeDebitado: 0, debitoAceptado: null, motivoRefactura: '', importeRefactura: 0, comentarios: '', comentariosDebito: '' },
        { id: 3, paciente: 'P3', motivoDebito: '', importeDebitado: 0, debitoAceptado: null, motivoRefactura: '', importeRefactura: 0, comentarios: '', comentariosDebito: '' }
      ] as any;
      component.prestacionesFiltradas = [...component.prestaciones];
    });

    it('actualizarEstadoSeleccion y onSelectionChanged deberían actualizar registrosSeleccionados y todasSeleccionadas', () => {
      component.prestaciones[0].seleccionada = true;
      component.prestaciones[1].seleccionada = true;
      component.actualizarEstadoSeleccion();
      expect(component.registrosSeleccionados.length).toBe(2);
      expect(component.todasSeleccionadas).toBe(false);

      component.prestaciones[2].seleccionada = true;
      component.actualizarEstadoSeleccion();
      expect(component.registrosSeleccionados.length).toBe(3);
      expect(component.todasSeleccionadas).toBe(true);

      component.onSelectionChanged({ api: { getSelectedRows: () => [component.prestaciones[0]] } } as any);
      expect(component.registrosSeleccionados.length).toBe(1);
    });

    it('aplicar acciones masivas a filas seleccionadas', () => {
      component.registrosSeleccionados = [component.prestaciones[0], component.prestaciones[1]];

      component.motivoMasivoSeleccionado = 'Falta firma';
      component.ejecutarMasivoDebito('Falta firma', true, false);
      expect(component.prestaciones[0].motivoDebito).toBe('Falta firma');
      expect(component.prestaciones[1].motivoDebito).toBe('Falta firma');

      component.importeDebitadoMasivo = 250;
      component.aplicarImporteDebitadoMasivo();
      expect(component.prestaciones[0].importeDebitado).toBe(250);

      component.motivoRefacturaMasivoSeleccionado = 'Autorizado';
      component.ejecutarMasivoRefactura('Autorizado', true, 0);
      expect(component.prestaciones[0].motivoRefactura).toBe('Autorizado');

      component.importeRefacturaMasivo = 180;
      component.aplicarImporteRefacturaMasivo();
      expect(component.prestaciones[0].importeRefactura).toBe(180);

      component.debitoAceptadoMasivoSeleccionado = 'SI';
      component.ejecutarMasivoDebitoAceptado('SI', true);
      expect(component.prestaciones[0].debitoAceptado).toBe('SI');

      component.comentariosDebitoMasivo = 'Obs debito';
      component.aplicarComentariosDebitoMasivo();
      expect(component.prestaciones[0].comentariosDebito).toBe('Obs debito');

      // Comentarios refactura aplican si debitoAceptado es NO
      component.prestaciones[0].debitoAceptado = 'NO';
      component.comentariosMasivo = 'Obs refactura';
      component.aplicarComentariosMasivo();
      expect(component.prestaciones[0].comentarios).toBe('Obs refactura');
    });
  });

  describe('Limpieza de Búsqueda, Paginación y Helpers de Tipo', () => {
    it('onLimpiarBusqueda debería bloquear con alerta si hay cambios sin guardar', () => {
      component.modificadosSinGuardar.add(1);
      const alertaSpy = vi.spyOn(component, 'mostrarAlerta');

      component.onLimpiarBusqueda();

      expect(alertaSpy.mock.calls[0][0]).toContain('Tenés registros sin guardar');
      expect(alertaSpy.mock.calls[0][2]).toBe('peligro');
    });

    it('onLimpiarBusqueda debería resetear el formulario y los resultados si no hay pendientes', () => {
      component.modificadosSinGuardar.clear();
      component.prestaciones = [{ id: 1 } as any];
      component.busquedaForm.patchValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '100' });

      component.onLimpiarBusqueda();

      expect(component.prestaciones.length).toBe(0);
      expect(component.busquedaForm.get('tipo')?.value).toBe('');
    });

    it('métodos auxiliares de tipo deben reconocer tipos estándar y electrónicos', () => {
      component.tipoBusquedaRealizada = 'FC';
      expect(component.esTipoFactura()).toBe(true);
      component.tipoBusquedaRealizada = 'FCE';
      expect(component.esTipoFactura()).toBe(true);
      component.tipoBusquedaRealizada = 'FAC';
      expect(component.esTipoFactura()).toBe(true);
      component.tipoBusquedaRealizada = 'NC';
      expect(component.esTipoFactura()).toBe(false);

      expect(component.esTipoNotaCredito('NC')).toBe(true);
      expect(component.esTipoNotaCredito('NCE')).toBe(true);
      expect(component.esTipoNotaCredito('FC')).toBe(false);

      expect(component.esTipoNotaDebito('ND')).toBe(true);
      expect(component.esTipoNotaDebito('NDE')).toBe(true);
      expect(component.esTipoNotaDebito('FC')).toBe(false);

      expect(component.esTipoRecibo('RC')).toBe(true);
      expect(component.esTipoRecibo('REC')).toBe(true);
      expect(component.esTipoRecibo('FC')).toBe(false);
    });

    it('paginación debería permitir navegar entre páginas correctamente', () => {
      component.prestacionesFiltradas = Array.from({ length: 45 }, (_, i) => ({ id: i + 1 } as any));
      component.itemsPorPagina = 10;
      component.paginaActual = 1;
      component.actualizarPaginacion();

      expect(component.totalPaginas).toBe(5);
      expect(component.prestacionesPaginadas.length).toBe(10);

      component.cambiarPagina(2);
      expect(component.paginaActual).toBe(2);

      component.cambiarPagina(1);
      expect(component.paginaActual).toBe(1);

      component.cambiarPagina(5);
      expect(component.paginaActual).toBe(5);

      // Fuera de rango no debe cambiar
      component.cambiarPagina(99);
      expect(component.paginaActual).toBe(5);
    });
  });

  describe('Gestión de Estados del Trámite', () => {
    it('cambiarEstadoGrupo sin idGrupo debe mostrar alerta de error', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');
      component.cambiarEstadoGrupo('', 1);
      expect(alertSpy).toHaveBeenCalledWith('No se identificó el ID de grupo para este comprobante.', undefined, 'error');
    });

    it('cambiarEstadoGrupo a 1 debería ejecutar exitosamente sin confirmación', () => {
      auditoriaServiceSpy.cambiarEstadoGrupo = vi.fn().mockReturnValue(of({ requiereConfirmacion: false, exito: true }));
      component.filasHistorialComprobantes = [{ nivel: 0, idGrupo: 100, idEstado: 1 } as any];

      component.cambiarEstadoGrupo(100, 1);

      expect(auditoriaServiceSpy.cambiarEstadoGrupo).toHaveBeenCalledWith(100, 1, false);
      expect(component.idEstadoActual).toBe(1);
    });

    it('cambiarEstadoGrupo a 2 con requiereConfirmacion debería abrir modal y forzar cierre al confirmar', () => {
      auditoriaServiceSpy.cambiarEstadoGrupo = vi.fn()
        .mockReturnValueOnce(of({ requiereConfirmacion: true, mensajeAlerta: 'Montos no cuadran. ¿Forzar?' }))
        .mockReturnValueOnce(of({ requiereConfirmacion: false, exito: true }));

      component.filasHistorialComprobantes = [{ nivel: 0, idGrupo: 200, idEstado: 1 } as any];
      component.cambiarEstadoGrupo(200, 2);

      expect(component.modalVisible).toBe(true);
      expect(component.modalMensaje).toContain('Montos no cuadran');

      // El usuario confirma forzar el cierre
      component.modalAceptarCb();
      expect(auditoriaServiceSpy.cambiarEstadoGrupo).toHaveBeenCalledWith(200, 2, true);
    });

    it('cambiarEstadoGrupo manejo de error del backend', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');
      auditoriaServiceSpy.cambiarEstadoGrupo = vi.fn().mockReturnValue(throwError(() => ({ error: { mensaje: 'Error al cambiar estado' } })));

      component.cambiarEstadoGrupo(300, 2);

      expect(alertSpy).toHaveBeenCalledWith('Error al cambiar estado', undefined, 'error');
    });

    it('bloquear acciones cuando el trámite está finalizado (idEstadoActual === 2)', () => {
      component.filasHistorialComprobantes = [{ nivel: 0, idGrupo: 200, idEstado: 2 } as any];
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');

      component.guardarParcialmente();
      expect(alertSpy.mock.calls[0][0]).toContain('finalizado');

      alertSpy.mockClear();
      component.abrirModalNuevaNota('NC');
      expect(alertSpy.mock.calls[0][0]).toContain('finalizado');

      alertSpy.mockClear();
      component.guardarNuevaNotaBD();
      expect(alertSpy.mock.calls[0][0]).toContain('finalizado');
    });
  });

  describe('Exportaciones y Notificaciones UI', () => {
    it('exportarAExcel debería alertar si no hay datos visibles o prestaciones con débito aceptado', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');
      component.prestacionesFiltradas = [];
      component.exportarAExcel();
      expect(alertSpy).toHaveBeenCalledWith('No hay datos visibles en la grilla para exportar. Revisá los filtros aplicados.', undefined, 'error');

      component.prestacionesFiltradas = [{ id: 1, debitoAceptado: 'PENDIENTE' } as any];
      component.tipoBusquedaRealizada = 'FC';
      component.exportarAExcel();
      expect(alertSpy).toHaveBeenCalledWith('No hay prestaciones con Débito Aceptado (SI o NO) para exportar.', undefined, 'error');

      component.prestacionesFiltradas = [{ id: 1, debitoAceptado: 'SI' } as any];
      component.exportarAExcel();
      expect(excelServiceSpy.exportarPrestaciones).toHaveBeenCalled();
    });

    it('exportarHistorialAExcel debería alertar si está vacío o llamar al servicio', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');
      component.filasHistorialComprobantes = [];
      component.exportarHistorialAExcel();
      expect(alertSpy).toHaveBeenCalledWith('No hay comprobantes en el historial para exportar.', undefined, 'error');

      component.filasHistorialComprobantes = [{ tipo: 'FC', numero: 1 } as any];
      component.exportarHistorialAExcel();
      expect(excelServiceSpy.exportarHistorialComprobantes).toHaveBeenCalled();
    });

    it('cerrarModalAlerta y cerrarModal deberían cerrar y ejecutar callbacks si existen', () => {
      let cbEjecutado = false;
      component.modalAlertaCallback = () => { cbEjecutado = true; };
      component.modalAlertaVisible = true;

      component.cerrarModalAlerta();
      expect(component.modalAlertaVisible).toBe(false);
      expect(cbEjecutado).toBe(true);

      component.modalVisible = true;
      component.cerrarModal();
      expect(component.modalVisible).toBe(false);
    });
  });

  describe('Cobertura Exhaustiva de AuditoriaComponent', () => {
    it('alIntentarCerrar y guardarMetricaEnLocal deben capturar evento antes de salir', () => {
      component.modificadosSinGuardar.add(1);
      component.tipoBusquedaRealizada = 'FC';
      component.busquedaForm.patchValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '100' });
      const event = { preventDefault: vi.fn(), returnValue: '' } as any;

      auditoriaServiceSpy.registrarMetricaUsabilidad = vi.fn().mockReturnValue(throwError(() => ({ status: 0 })));

      component.alIntentarCerrar(event);

      expect(event.preventDefault).toHaveBeenCalled();
      const local = JSON.parse(localStorage.getItem('telemetria_pendientes') || '[]');
      expect(local.length).toBeGreaterThan(0);
      localStorage.removeItem('telemetria_pendientes');
    });

    it('esAdmin y hayFiltrosActivos deben reflejar el estado actual', () => {
      vi.spyOn(authServiceSpy, 'isAdmin').mockReturnValue(true);
      expect(component.esAdmin).toBe(true);

      expect(component.hayFiltrosActivos).toBe(false);
      component.filtroPaciente = 'Gomez';
      expect(component.hayFiltrosActivos).toBe(true);
    });

    it('onPorcIvaChange y onTipoNdChange', () => {
      // Subtipo no prestacional con mismos porcentajes
      component.nuevaNotaForm.patchValue({ subtipoIva: 'No prestacional', porcIva: 21 });
      component.nuevaNotaDebitoIvaForm.patchValue({ porcIva: 21 });
      component.onPorcIvaChange();
      expect(component.nuevaNotaForm.get('porcIva')?.value).toBeNull();

      // Subtipo prestacional
      component.nuevaNotaForm.patchValue({ subtipoIva: 'Prestacional', porcIva: 10.5 });
      component.onPorcIvaChange();
      expect(component.nuevaNotaForm.get('porcIva')?.value).toBe(10.5);

      // onTipoNdChange
      component.nuevaNotaForm.patchValue({ tipoNd: 'Por ajuste de IVA' });
      component.onTipoNdChange();
      expect(component.nuevaNotaForm.get('importeNd')?.validator).toBeDefined();

      component.nuevaNotaForm.patchValue({ tipoNd: 'Por Refactura' });
      component.onTipoNdChange();
      expect(component.nuevaNotaForm.get('importeNd')?.value).toBeNull();
    });

    it('aplicarMotivoRefacturaMasivo debería manejar avisos de debito SI y reemplazos con modal', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');
      component.registrosSeleccionados = [
        { id: 1, debitoAceptado: 'SI', motivoRefactura: '' } as any
      ];
      component.motivoRefacturaMasivoSeleccionado = 'Autorizado';
      component.aplicarMotivoRefacturaMasivo();
      expect(alertSpy.mock.calls[0][0]).toContain('Motivo de Refactura');

      // Filas con motivo previo
      component.registrosSeleccionados = [
        { id: 2, debitoAceptado: 'NO', motivoRefactura: 'Previo' } as any
      ];
      component.motivoRefacturaMasivoSeleccionado = 'Nuevo';
      component.aplicarMotivoRefacturaMasivo();
      expect(component.modalVisible).toBe(true);

      // Confirmar reemplazo
      component.modalAceptarCb();
      expect(component.registrosSeleccionados[0].motivoRefactura).toBe('Nuevo');

      // Cancelar reemplazo
      component.registrosSeleccionados[0].motivoRefactura = 'Previo';
      component.motivoRefacturaMasivoSeleccionado = 'Otro';
      component.aplicarMotivoRefacturaMasivo();
      component.modalCancelarCb();
      expect(component.modalVisible).toBe(false);
    });

    it('alCambiarMotivoRefactura y alCambiarMotivoDebito deben gestionar confirmación de reemplazo', () => {
      const p = { id: 1, total: 1000, motivoRefactura: 'Nuevo', _motivoRefacturaPrevio: 'Viejo' } as any;
      component.alCambiarMotivoRefactura(p);
      expect(component.modalVisible).toBe(true);

      component.modalAceptarCb();
      expect(p.motivoRefactura).toBe('Nuevo');

      p.motivoRefactura = 'Nuevo';
      component.alCambiarMotivoRefactura(p);
      component.modalCancelarCb();
      expect(p.motivoRefactura).toBe('Viejo');

      // alCambiarMotivoDebito con motivo previo
      const pDeb = { id: 2, total: 1000, importeDebitado: 500, motivoDebito: 'Nuevo Deb', _motivoDebitoPrevio: 'Viejo Deb' } as any;
      component.alCambiarMotivoDebito(pDeb);
      expect(component.modalVisible).toBe(true);
      component.modalAceptarCb();
      expect(component.modalVisible).toBe(true); // Abre confirmación de importe
      component.modalAceptarCb();
      expect(pDeb.importeDebitado).toBe(1000);

      // Cancelar motivo previo
      pDeb.motivoDebito = 'Nuevo Deb';
      pDeb._motivoDebitoPrevio = 'Viejo Deb';
      component.alCambiarMotivoDebito(pDeb);
      component.modalCancelarCb();
      expect(pDeb.motivoDebito).toBe('Viejo Deb');

      // guardarMotivoPrevio helper
      component.guardarMotivoPrevio(pDeb, 'debito');
      expect((pDeb as any)._motivoDebitoPrevio).toBe('Viejo Deb');
      component.guardarMotivoPrevio(pDeb, 'refactura');
      expect((pDeb as any)._motivoRefacturaPrevio).toBe(pDeb.motivoRefactura);
    });

    it('onCellValueChanged debe procesar debitoAceptado, motivos e importes', () => {
      const p = { id: 1, total: 1000, importeDebitado: 500, debitoAceptado: 'SI' } as any;
      const apiMock = { refreshCells: vi.fn() };
      const nodeMock = { setDataValue: vi.fn() };

      // Cambio debitoAceptado a 'NO' teniendo importeDebitado
      component.onCellValueChanged({
        data: p,
        colDef: { field: 'debitoAceptado' },
        oldValue: 'SI',
        newValue: 'NO',
        api: apiMock,
        node: nodeMock
      } as any);

      expect(component.modalVisible).toBe(true);
      component.modalAceptarCb();
      expect(p.importeDebitado).toBeUndefined();

      // Cambio a SI
      p.motivoRefactura = 'Algo';
      p.importeRefactura = 100;
      component.onCellValueChanged({
        data: p,
        colDef: { field: 'debitoAceptado' },
        oldValue: 'NO',
        newValue: 'SI',
        api: apiMock,
        node: nodeMock
      } as any);
      expect(p.motivoRefactura).toBe('');
      expect(p.importeRefactura).toBeUndefined();

      // Cambio en importeDebitado con coma decimal
      component.onCellValueChanged({
        data: p,
        colDef: { field: 'importeDebitado' },
        oldValue: 100,
        newValue: '12,50',
        api: apiMock,
        node: nodeMock
      } as any);
      expect(p.importeDebitado).toBe(12.50);
    });

    it('onSort debe ordenar asc/desc y manejar valores nulos', () => {
      component.prestacionesFiltradas = [
        { id: 1, paciente: 'B' },
        { id: 2, paciente: null },
        { id: 3, paciente: 'A' }
      ] as any;

      component.columnaOrden = '';
      component.onSort('paciente');
      expect(component.direccionOrden).toBe('asc');
      expect(component.columnaOrden).toBe('paciente');

      component.onSort('paciente');
      expect(component.direccionOrden).toBe('desc');
    });

    it('onBuscar errores HTTP (0, 404, 500) y validación de formulario', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');

      // Cambios sin guardar
      component.modificadosSinGuardar.add(99);
      component.onBuscar();
      expect(alertSpy.mock.calls[0][0]).toContain('registros sin guardar');

      // Formulario inválido
      alertSpy.mockClear();
      component.modificadosSinGuardar.clear();
      component.busquedaForm.patchValue({ tipo: '', letra: '', puntoVenta: '', numero: '' });
      component.onBuscar();
      expect(alertSpy.mock.calls[0][0]).toContain('Revise los datos');

      // Error status 0
      alertSpy.mockClear();
      component.busquedaForm.patchValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '10' });
      auditoriaServiceSpy.buscarPrestaciones = vi.fn().mockReturnValue(throwError(() => ({ status: 0 })));
      component.onBuscar();
      expect(alertSpy.mock.calls[0][0]).toContain('No hay conexión con el servidor');

      // Error status 404
      alertSpy.mockClear();
      auditoriaServiceSpy.buscarPrestaciones = vi.fn().mockReturnValue(throwError(() => ({ status: 404 })));
      component.onBuscar();
      expect(component.esDocumentoNoEncontrado).toBe(true);

      // Error status 500
      alertSpy.mockClear();
      auditoriaServiceSpy.buscarPrestaciones = vi.fn().mockReturnValue(throwError(() => ({ status: 500 })));
      component.onBuscar();
      expect(alertSpy.mock.calls[0][0]).toContain('Código 500');
    });

    it('guardarParcialmente con silencioso y errores', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');

      // Sin registros con motivo
      component.prestaciones = [{ id: 1, motivoDebito: '' } as any];
      component.guardarParcialmente(false);
      expect(alertSpy.mock.calls[0][0]).toContain('No hay registros');

      // Éxito silencioso
      component.prestaciones = [{ id: 1, motivoDebito: 'Falta firma' } as any];
      auditoriaServiceSpy.guardarParcialmente = vi.fn().mockReturnValue(of({}));
      component.guardarParcialmente(true);
      expect(component.guardandoSilencioso).toBe(false);

      // Error status 500
      alertSpy.mockClear();
      auditoriaServiceSpy.guardarParcialmente = vi.fn().mockReturnValue(throwError(() => ({ status: 500 })));
      component.guardarParcialmente(false);
      expect(alertSpy.mock.calls[0][0]).toContain('Ocurrió un error al intentar guardar');
    });

    it('onLogout debe bloquear si hay pendientes o desloguear si no los hay', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');
      component.modificadosSinGuardar.add(5);

      component.onLogout();
      expect(alertSpy.mock.calls[0][0]).toContain('Tenés registros sin guardar');

      component.modificadosSinGuardar.clear();
      component.onLogout();
      expect(authServiceSpy.logout).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('guardarNdAjusteIvaSolo validaciones, éxito y errores', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');

      // Formulario inválido
      component.nuevaNotaDebitoIvaForm.reset();
      component.guardarNdAjusteIvaSolo();
      expect(alertSpy.mock.calls[0][0]).toContain('complete todos los campos');

      // Sin fila NC padre
      alertSpy.mockClear();
      component.nuevaNotaDebitoIvaForm.patchValue({
        tipo: 'ND',
        letra: 'A',
        puntoVenta: '1',
        numero: '200',
        fecha: '2026-09-11',
        porcIva: 21
      });
      component.filasResumenAjusteIva = [];
      component.guardarNdAjusteIvaSolo();
      expect(alertSpy.mock.calls[0][0]).toContain('padre');

      // Éxito
      alertSpy.mockClear();
      component.filasResumenAjusteIva = [{} as any, { tipoDocumento: 'NC', letra: 'A', puntoVenta: 1, numero: 100, montoNeto: 1000 } as any];
      auditoriaServiceSpy.guardarNuevaNotaDebitoAjusteIva = vi.fn().mockReturnValue(of({}));
      component.guardarNdAjusteIvaSolo();
      expect(alertSpy.mock.calls[0][0]).toContain('éxito');

      // Error backend
      alertSpy.mockClear();
      component.nuevaNotaDebitoIvaForm.patchValue({
        tipo: 'ND',
        letra: 'A',
        puntoVenta: '1',
        numero: '200',
        fecha: '2026-09-11',
        porcIva: 21
      });
      auditoriaServiceSpy.guardarNuevaNotaDebitoAjusteIva = vi.fn().mockReturnValue(throwError(() => ({ error: { mensaje: 'Fallo BD' } })));
      component.guardarNdAjusteIvaSolo();
      expect(alertSpy.mock.calls[0][0]).toBe('Fallo BD');
    });

    it('documentos asociados, formatearFecha y tracking', () => {
      const spyHistorial = vi.spyOn(component, 'abrirModalHistorialComprobantes');
      component.abrirModalDocumentosAsociados();
      expect(spyHistorial).toHaveBeenCalled();

      const spyCerrar = vi.spyOn(component, 'cerrarModalHistorialComprobantes');
      component.cerrarModalDocumentosAsociados();
      expect(spyCerrar).toHaveBeenCalled();

      expect(component.formatearFecha('2026-09-11')).toBe('11/09/2026');
      expect(component.formatearFecha('')).toBe('');

      expect(component.trackByPrestacion(0, { id: 123 } as any)).toBe(123);
      expect(component.trackByPrestacion(5, {} as any)).toBe(5);

      component.onGridReady({ api: {} } as any);
      expect((component as any).gridApi).toBeDefined();
    });

    it('notificarAdminDocumentoNoEncontrado éxito y error', () => {
      component.documentoBuscadoNoEncontrado = { tipo: 'FC', letra: 'A', puntoVenta: 1, numero: 10 };
      notificacionServiceSpy.reportarDocumentoNoEncontrado = vi.fn().mockReturnValue(of({}));

      component.notificarAdminDocumentoNoEncontrado();
      expect(component.notificacionAdminEnviada).toBe(true);

      notificacionServiceSpy.reportarDocumentoNoEncontrado = vi.fn().mockReturnValue(throwError(() => new Error('fail')));
      component.notificarAdminDocumentoNoEncontrado();
      expect(component.enviandoNotificacionAdmin).toBe(false);
    });

    it('validarLetraInput debe alertar si tiene dígitos y convertir a mayúsculas', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');
      const eventConNumero = { target: { value: 'A1' } } as any;

      component.validarLetraInput(eventConNumero, 'busqueda');
      expect(alertSpy.mock.calls[0][0]).toContain('no puede contener números');

      const eventSinNumero = { target: { value: 'b' } } as any;
      component.validarLetraInput(eventSinNumero, 'busqueda');
      expect(component.busquedaForm.get('letra')?.value).toBe('B');
    });

    it('ngOnInit procesa autoguardado, telemetria pendientes y notificaciones', () => {
      vi.useFakeTimers();
      component.modificadosSinGuardar.add(1);
      const guardarSpy = vi.spyOn(component, 'guardarParcialmente');
      (component as any).autoguardado$.next();
      vi.advanceTimersByTime(60000);
      expect(guardarSpy).toHaveBeenCalledWith(true);
      vi.useRealTimers();

      // Telemetria pendientes en storage (éxito y error)
      localStorage.setItem('telemetria_pendientes', JSON.stringify([{ evento: 'TEST' }]));
      auditoriaServiceSpy.registrarMetricasLote = vi.fn().mockReturnValue(of({}));
      component.ngOnInit();
      expect(localStorage.getItem('telemetria_pendientes')).toBeNull();

      localStorage.setItem('telemetria_pendientes', JSON.stringify([{ evento: 'TEST' }]));
      auditoriaServiceSpy.registrarMetricasLote = vi.fn().mockReturnValue(throwError(() => new Error('err')));
      component.ngOnInit();
      localStorage.removeItem('telemetria_pendientes');

      // Notificaciones seleccionadas
      const notifSub = notificacionServiceSpy.notificacionSeleccionada$ as Subject<any>;
      notifSub.next({
        tipoNotificacion: 'DOC_NO_ENCONTRADO',
        tipoDoc: 'FC',
        letra: 'A',
        puntoVenta: 1,
        numero: 10,
        mensaje: 'Falta'
      });
      expect(component.modalReporteDocAusenteVisible).toBe(true);
      expect(component.docAusenteDetalle).toBeDefined();

      const buscarSpy = vi.spyOn(component, 'onBuscar').mockImplementation(() => {});
      notifSub.next({
        tipoNotificacion: 'OTRO',
        tipoDoc: 'FC',
        letra: 'A',
        puntoVenta: 1,
        numero: 10
      });
      expect(buscarSpy).toHaveBeenCalled();
    });

    it('limpiarFilasSeleccionadas debe vaciar datos de las filas seleccionadas al confirmar', () => {
      component.registrosSeleccionados = [
        { id: 1, debitoAceptado: 'SI', motivoDebito: 'Falta firma', importeDebitado: 100, comentariosDebito: 'c1' } as any
      ];

      (component as any).limpiarFilasSeleccionadas();
      expect(component.modalVisible).toBe(true);

      // Cancelar
      component.modalCancelarCb();
      expect(component.modalVisible).toBe(false);

      // Confirmar
      (component as any).limpiarFilasSeleccionadas();
      component.modalAceptarCb();
      expect(component.registrosSeleccionados[0].debitoAceptado).toBe('');
      expect(component.registrosSeleccionados[0].motivoDebito).toBe('');
      expect(component.registrosSeleccionados[0].importeDebitado).toBeUndefined();
    });

    it('aplicarMotivoMasivo validaciones y confirmaciones de reemplazo', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');

      // Sin filas
      component.registrosSeleccionados = [];
      component.aplicarMotivoMasivo();
      expect(alertSpy.mock.calls[0][0]).toContain('seleccionar al menos una fila');

      // Sin motivo seleccionado
      alertSpy.mockClear();
      component.registrosSeleccionados = [{ id: 1, total: 1000 } as any];
      component.motivoMasivoSeleccionado = '';
      component.aplicarMotivoMasivo();
      expect(alertSpy.mock.calls[0][0]).toContain('motivo de débito');

      // Con motivo previo en filas (modal aceptar y cancelar)
      component.registrosSeleccionados = [
        { id: 1, total: 1000, motivoDebito: 'Previo', importeDebitado: 500 } as any
      ];
      component.motivoMasivoSeleccionado = 'Iva mal facturado';
      component.aplicarMotivoMasivo();
      expect(component.modalVisible).toBe(true);

      // Confirmar reemplazo de motivo -> pasa a verificar importes
      component.modalAceptarCb();
      expect(component.modalVisible).toBe(true); // Modal de reemplazo de importe
      component.modalAceptarCb();
      expect(component.modalVisible).toBe(false);

      // Cancelar reemplazo de motivo
      component.aplicarMotivoMasivo();
      component.modalCancelarCb();
      expect(component.modalVisible).toBe(false);
    });

    it('onCellValueChanged confirmaciones modales para motivoDebito y motivoRefactura', () => {
      const p = { id: 1, total: 1000, importeDebitado: 500, motivoDebito: 'Nuevo' } as any;
      const apiMock = { refreshCells: vi.fn() };
      const nodeMock = { setDataValue: vi.fn() };

      // motivoDebito con previo
      component.onCellValueChanged({
        data: p,
        colDef: { field: 'motivoDebito' },
        oldValue: 'Viejo',
        newValue: 'Nuevo',
        api: apiMock,
        node: nodeMock
      } as any);
      expect(component.modalVisible).toBe(true);
      component.modalAceptarCb();
      expect(component.modalVisible).toBe(true); // Modal reemplazo importe
      component.modalAceptarCb();
      expect(component.modalVisible).toBe(false);

      // Cancelar motivoDebito
      component.onCellValueChanged({
        data: p,
        colDef: { field: 'motivoDebito' },
        oldValue: 'Viejo',
        newValue: 'Nuevo',
        api: apiMock,
        node: nodeMock
      } as any);
      component.modalCancelarCb();
      expect(p.motivoDebito).toBe('Viejo');

      // motivoRefactura con previo
      p.motivoRefactura = 'Nuevo Ref';
      component.onCellValueChanged({
        data: p,
        colDef: { field: 'motivoRefactura' },
        oldValue: 'Viejo Ref',
        newValue: 'Nuevo Ref',
        api: apiMock,
        node: nodeMock
      } as any);
      expect(component.modalVisible).toBe(true);
      component.modalAceptarCb();
      expect(p.motivoRefactura).toBe('Nuevo Ref');

      // Cancelar motivoRefactura
      component.onCellValueChanged({
        data: p,
        colDef: { field: 'motivoRefactura' },
        oldValue: 'Viejo Ref',
        newValue: 'Nuevo Ref',
        api: apiMock,
        node: nodeMock
      } as any);
      component.modalCancelarCb();
      expect(p.motivoRefactura).toBe('Viejo Ref');
    });

    it('guardarNuevaNotaBD errores de red y backend', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');
      component.filasHistorialComprobantes = [{ nivel: 0, idGrupo: 1, idEstado: 1 } as any];
      component.tipoNuevaNota = 'NC';
      component.prestaciones = [{ id: 1, motivoDebito: 'Falta firma' } as any];
      component.nuevaNotaForm.patchValue({
        tipo: 'NC',
        letra: 'A',
        puntoVenta: '1',
        numero: '100',
        fecha: '2026-09-11',
        tipoNc: 'Refactura'
      });

      // Error status 0
      auditoriaServiceSpy.guardarNuevaNotaCredito = vi.fn().mockReturnValue(throwError(() => ({ status: 0 })));
      component.guardarNuevaNotaBD();
      expect(alertSpy.mock.calls[0][0]).toContain('No hay conexión con el servidor');

      // Error status 500
      alertSpy.mockClear();
      auditoriaServiceSpy.guardarNuevaNotaCredito = vi.fn().mockReturnValue(throwError(() => ({ status: 500, error: { message: 'Fallo al procesar' } })));
      component.guardarNuevaNotaBD();
      expect(alertSpy.mock.calls[0][0]).toBe('Fallo al procesar');
    });

    it('renderizado completo del HTML de auditoria en múltiples estados', async () => {
      // 1. Filtros avanzados, contadores y botones de acción
      component.prestaciones = [
        { id: 1, paciente: 'P1', profesional: 'M1', descripcion: 'Pr1', grupo: 'G1', fecha: '2026-09-11', total: 100, motivoDebito: 'M1', debitoAceptado: 'NO', motivoRefactura: 'R1' } as any
      ];
      component.prestacionesFiltradas = [...component.prestaciones];
      component.prestacionesPaginadas = [...component.prestaciones];
      component.pacientesList = ['P1'];
      component.filtroPaciente = 'P1';
      component.profesionalesList = ['M1'];
      component.filtroProfesional = 'M1';
      component.prestacionesList = ['Pr1'];
      component.filtroPrestacion = 'Pr1';
      component.gruposList = ['G1'];
      component.filtroGrupo = 'G1';
      component.fechasList = ['2026-09-11'];
      component.filtroFecha = '2026-09-11';
      component.soloValorizadas = true;
      component.soloConDebitoAceptado = true;
      component.soloSinNC = true;
      component.soloSinMotivoDebito = true;
      component.soloSinMotivoRefactura = true;
      component.modificadosSinGuardar.add(1);
      component.tipoBusquedaRealizada = 'FC';
      component.notaDeCreditoYaCreada = false;
      component.cantidadHistorial = 5;
      authServiceSpy.hasAnyRole = vi.fn().mockReturnValue(true);
      component.filasHistorialComprobantes = [{ nivel: 0, idGrupo: 1, idEstado: 1 } as any];
      component.cdr.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();

      // Cambiar estado trámite a 2 (Finalizado)
      component.filasHistorialComprobantes = [{ nivel: 0, idGrupo: 1, idEstado: 2 } as any];
      component.cdr.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();

      // Cambiar rol a no operador para ver badge de estado
      authServiceSpy.hasAnyRole = vi.fn().mockReturnValue(false);
      component.filasHistorialComprobantes = [{ nivel: 0, idGrupo: 1, idEstado: 1 } as any];
      component.cdr.detectChanges();
      component.filasHistorialComprobantes = [{ nivel: 0, idGrupo: 1, idEstado: 2 } as any];
      component.cdr.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();

      // 2. Acciones masivas
      component.registrosSeleccionados = [{ id: 1 }] as any;
      component.cargando = false;
      component.listaDebitoAceptado = ['SI', 'NO'];
      component.debitoAceptadoMasivoSeleccionado = 'SI';
      component.listaMotivosAgrupados = [{ categoria: 'Cat1', motivos: ['M1'] }];
      component.motivoMasivoSeleccionado = 'M1';
      component.importeDebitadoMasivo = 100;
      component.comentariosDebitoMasivo = 'coment deb';
      component.listaMotivosRefacturaAgrupados = [{ categoria: 'CatR', motivos: ['R1'] }];
      component.motivoRefacturaMasivoSeleccionado = 'R1';
      component.importeRefacturaMasivo = 80;
      component.comentariosMasivo = 'coment ref';
      component.cdr.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();

      // 3. Estados sin datos / placeholders
      component.prestaciones = [];
      component.tipoBusquedaRealizada = 'RC';
      component.cdr.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();

      component.tipoBusquedaRealizada = 'FC';
      component.busquedaForm.markAsDirty();
      component.cdr.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();

      // 4. Modal Nueva Nota (NC con cabecera y selección)
      component.modalNuevaNotaVisible = true;
      component.tipoNuevaNota = 'NC';
      component.modoIngresoManual = false;
      component.cargandoCabeceras = true;
      component.cdr.detectChanges();

      component.cargandoCabeceras = false;
      component.cabecerasDisponibles = [];
      component.cdr.detectChanges();

      component.cabecerasDisponibles = [
        { id: 1, label: 'NC 1', tienePrestacionesImputadas: true } as any,
        { id: 2, label: 'NC 2', tienePrestacionesImputadas: false } as any
      ];
      component.cabeceraSeleccionadaId = 1;
      component.cabeceraSeleccionadaObjeto = {
        tipo: 'NC', letra: 'A', ptovta: 1, numero: 100, fecha: '2026-09-11', haber: 1000, debe: 200, cobertura: 'OSDE'
      } as any;
      component.cdr.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();

      // Ingreso manual NC y ND
      component.modoIngresoManual = true;
      component.tipoNuevaNota = 'NC';
      component.cdr.detectChanges();
      component.tipoNuevaNota = 'ND';
      component.cdr.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();

      // Modal Nueva Nota por Ajuste de IVA (Panel izquierdo y derecho)
      component.tipoNuevaNota = 'NC';
      component.modoIngresoManual = false;
      component.nuevaNotaForm.patchValue({ tipoNc: 'Por ajuste de IVA', subtipoIva: 'No prestacional', porcIva: 21 });
      component.cdr.detectChanges();

      // Subtipo prestacional
      component.nuevaNotaForm.patchValue({ subtipoIva: 'Prestacional' });
      component.hasPrestacionesIvaMalFacturado = false;
      component.cdr.detectChanges();

      component.hasPrestacionesIvaMalFacturado = true;
      component.montoNetoPrestacional = 5000;
      component.montoIvaCalculado = 1050;
      component.cdr.detectChanges();

      // Panel derecho: ND por ajuste de IVA
      component.modoIngresoManualNdIva = false;
      component.cargandoCabecerasNdIva = true;
      component.cdr.detectChanges();

      component.cargandoCabecerasNdIva = false;
      component.cabecerasDisponiblesNdIva = [];
      component.cdr.detectChanges();

      component.cabecerasDisponiblesNdIva = [
        { id: 10, label: 'ND 10', tienePrestacionesImputadas: true } as any
      ];
      component.cabeceraSeleccionadaIdNdIva = 10;
      component.cabeceraSeleccionadaNdIvaObjeto = {
        tipo: 'ND', letra: 'A', ptovta: 1, numero: 200, fecha: '2026-09-11', debe: 1050, haber: 0, cobertura: 'OSDE'
      } as any;
      component.cdr.detectChanges();

      // Ingreso manual ND IVA
      component.modoIngresoManualNdIva = true;
      component.cdr.detectChanges();

      // Estados de guardado del modal
      component.ncGuardadaExitosamente = true;
      component.editandoNcAjusteIva = false;
      component.cdr.detectChanges();
      component.editandoNcAjusteIva = true;
      component.cdr.detectChanges();
      component.modalNuevaNotaVisible = false;
      component.cdr.detectChanges();

      // 5. Modal Alerta con notificación a administradores
      component.modalAlertaVisible = true;
      component.modalAlertaMensaje = 'Alerta de comprobante no encontrado';
      component.esDocumentoNoEncontrado = true;
      authServiceSpy.isAdmin = vi.fn().mockReturnValue(false);
      component.notificacionAdminEnviada = false;
      component.enviandoNotificacionAdmin = false;
      component.cdr.detectChanges();
      component.enviandoNotificacionAdmin = true;
      component.cdr.detectChanges();
      component.notificacionAdminEnviada = true;
      component.cdr.detectChanges();
      component.modalAlertaVisible = false;
      component.cdr.detectChanges();

      // 6. Modal Reporte Documento Ausente
      component.modalReporteDocAusenteVisible = true;
      component.docAusenteDetalle = {
        documentoCompleto: 'FC A-0001-00000001',
        tipo: 'FC',
        letra: 'A',
        puntoVenta: '1',
        numero: '1',
        usuario: 'admin',
        fechaHora: '2026-09-11T12:00:00Z',
        mensaje: 'Falta registrar comprobante'
      };
      component.textoCopiadoFeedback = true;
      component.cdr.detectChanges();
      component.modalReporteDocAusenteVisible = false;
      component.cdr.detectChanges();

      // 7. Modal Historial Comprobantes con diferentes roles y estados
      component.modalHistorialVisible = true;
      component.filasHistorialComprobantes = [
        { nivel: 0, tipoDocumento: 'FC', letra: 'A', puntoVenta: 1, numero: 1001, fechaDocumento: '2026-09-11', montoNeto: 1000, idEstado: 1, origenTipo: 'DEB', tienePrestaciones: true } as any,
        { nivel: 0, tipoDocumento: 'FC', letra: 'B', puntoVenta: 1, numero: 1002, fechaDocumento: '2026-09-11', montoNeto: 2000, idEstado: 2, origenTipo: 'COB', tienePrestaciones: false } as any,
        { nivel: 1, tipoDocumento: 'NC', letra: 'A', puntoVenta: 1, numero: 501, fechaDocumento: '2026-09-12', montoNeto: 300, origenTipo: 'REF', tienePrestaciones: true } as any,
        { nivel: 1, tipoDocumento: 'NC', letra: 'A', puntoVenta: 1, numero: 502, fechaDocumento: '2026-09-12', montoNeto: 200, porcentajeIva: 21, montoIva: 42, origenTipo: 'IVA', placeholderNdAjusteIva: false } as any,
        { nivel: 1, tipoDocumento: 'ND', letra: 'A', puntoVenta: 1, numero: 503, fechaDocumento: '2026-09-12', montoNeto: 200, porcentajeIva: 21, montoIva: 42, origenTipo: 'IVA', placeholderNdAjusteIva: true } as any
      ];
      component.cdr.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();
      component.modalHistorialVisible = false;
      component.cdr.detectChanges();

      // 8. Modal confirmación
      component.modalVisible = true;
      component.modalMensaje = '¿Desea continuar?';
      component.cdr.detectChanges();
      component.modalVisible = false;
      component.cdr.detectChanges();

      // 9. Drawer de ayuda y bloque @defer
      component.isHelpDrawerOpen = true;
      component.cdr.detectChanges();
      const deferBlocks = await fixture.getDeferBlocks();
      if (deferBlocks.length > 0) {
        await deferBlocks[0].render(DeferBlockState.Complete);
      }
      component.cdr.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();
    });

    it('gestión avanzada de ajuste de IVA y validaciones de porcentajes', () => {
      // onTipoNcChange deshabilitado por ajuste previo
      component.deshabilitarPorAjusteIva = true;
      component.nuevaNotaForm.patchValue({ tipoNc: 'Por ajuste de IVA' });
      component.onTipoNcChange();
      expect(component.nuevaNotaForm.get('tipoNc')?.value).toBe('Refactura');

      // onSubtipoIvaChange No prestacional
      component.deshabilitarPorAjusteIva = false;
      component.nuevaNotaForm.patchValue({ tipoNc: 'Por ajuste de IVA', subtipoIva: 'No prestacional' });
      component.onSubtipoIvaChange();
      expect(component.nuevaNotaForm.get('netoNc')?.validator).toBeDefined();

      // esPorcIvaDeshabilitadoEnNc y esPorcIvaDeshabilitadoEnNd
      component.nuevaNotaDebitoIvaForm.patchValue({ porcIva: 21 });
      expect(component.esPorcIvaDeshabilitadoEnNc(21)).toBe(true);
      expect(component.esPorcIvaDeshabilitadoEnNc(10.5)).toBe(false);

      component.nuevaNotaForm.patchValue({ porcIva: 10.5 });
      expect(component.esPorcIvaDeshabilitadoEnNd(10.5)).toBe(true);
      expect(component.esPorcIvaDeshabilitadoEnNd(21)).toBe(false);

      // onPorcIvaNdChange con neto > 0
      component.netoAjusteIva = 1000;
      component.nuevaNotaDebitoIvaForm.patchValue({ porcIva: 21 });
      component.nuevaNotaForm.patchValue({ porcIva: 10.5 });
      component.onPorcIvaNdChange();
      expect(component.montoIvaNdCalculado).toBe(210);

      // Bloqueo de mismo porcentaje en ND
      component.nuevaNotaDebitoIvaForm.patchValue({ porcIva: 10.5 });
      component.onPorcIvaNdChange();
      expect(component.montoIvaNdCalculado).toBe(0);
    });

    it('guardarEdicionNcAjusteIva y guardarNotaDebitoAjusteIva ramas de error y finalizado', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');

      // Finalizado
      component.filasHistorialComprobantes = [{ nivel: 0, idGrupo: 1, idEstado: 2 } as any];
      component.guardarEdicionNcAjusteIva();
      expect(alertSpy.mock.calls[0][0]).toContain('finalizado');

      alertSpy.mockClear();
      component.guardarNotaDebitoAjusteIva();
      expect(alertSpy.mock.calls[0][0]).toContain('finalizado');

      // Formulario inválido
      alertSpy.mockClear();
      component.filasHistorialComprobantes = [{ nivel: 0, idGrupo: 1, idEstado: 1 } as any];
      component.nuevaNotaForm.reset();
      component.guardarEdicionNcAjusteIva();
      expect(alertSpy.mock.calls[0][0]).toContain('completá todos los campos');

      // guardarNotaDebitoAjusteIva soloCrearNdAjusteIva
      const spySolo = vi.spyOn(component, 'guardarNdAjusteIvaSolo').mockImplementation(() => {});
      component.soloCrearNdAjusteIva = true;
      component.guardarNotaDebitoAjusteIva();
      expect(spySolo).toHaveBeenCalled();
      component.soloCrearNdAjusteIva = false;

      // Backend error en guardarEdicionNcAjusteIva
      alertSpy.mockClear();
      component.nuevaNotaForm.patchValue({
        tipo: 'NC',
        letra: 'A',
        puntoVenta: '1',
        numero: '100',
        fecha: '2026-09-11',
        tipoNc: 'Por ajuste de IVA',
        subtipoIva: 'Prestacional'
      });
      auditoriaServiceSpy.editarNcAjusteIva = vi.fn().mockReturnValue(throwError(() => ({ error: { mensaje: 'Error update NC' } })));
      component.guardarEdicionNcAjusteIva();
      expect(alertSpy.mock.calls[0][0]).toBe('Error update NC');

      // Backend error en guardarNotaDebitoAjusteIva
      alertSpy.mockClear();
      component.datosNcCreada = { tipo: 'NC', letra: 'A', puntoVenta: '1', numero: '100' };
      component.nuevaNotaDebitoIvaForm.patchValue({
        tipo: 'ND',
        letra: 'A',
        puntoVenta: '1',
        numero: '200',
        fecha: '2026-09-11',
        porcIva: 21
      });
      auditoriaServiceSpy.guardarNuevaNotaDebitoAjusteIva = vi.fn().mockReturnValue(throwError(() => ({ error: { mensaje: 'Error save ND' } })));
      component.guardarNotaDebitoAjusteIva();
      expect(alertSpy.mock.calls[0][0]).toBe('Error save ND');
    });

    it('acciones masivas comentarios e importes con advertencias parciales', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');

      // aplicarComentariosMasivo: todas con debito SI
      component.registrosSeleccionados = [
        { id: 1, debitoAceptado: 'SI' } as any
      ];
      component.comentariosMasivo = 'Obs';
      component.aplicarComentariosMasivo();
      expect(alertSpy.mock.calls[0][0]).toContain('No se pueden asignar Comentarios');

      // aplicarComentariosMasivo: ninguna en NO
      alertSpy.mockClear();
      component.registrosSeleccionados = [
        { id: 1, debitoAceptado: '' } as any
      ];
      component.comentariosMasivo = 'Obs';
      component.aplicarComentariosMasivo();
      expect(alertSpy.mock.calls[0][0]).toContain('ninguna de las filas seleccionadas tiene el Débito Aceptado marcado como');

      // aplicarComentariosMasivo: algunas en NO y otras en SI
      alertSpy.mockClear();
      component.registrosSeleccionados = [
        { id: 1, debitoAceptado: 'NO' } as any,
        { id: 2, debitoAceptado: 'SI' } as any
      ];
      component.comentariosMasivo = 'Obs';
      component.aplicarComentariosMasivo();
      expect(alertSpy.mock.calls[0][0]).toContain('con Débito en \'NO\'');

      // aplicarComentariosDebitoMasivo: ninguna con motivo
      alertSpy.mockClear();
      component.registrosSeleccionados = [
        { id: 1, motivoDebito: '' } as any
      ];
      component.comentariosDebitoMasivo = 'Obs';
      component.aplicarComentariosDebitoMasivo();
      expect(alertSpy.mock.calls[0][0]).toContain('ninguna fila seleccionada tiene un Motivo de Débito');

      // aplicarComentariosDebitoMasivo: algunas con motivo y otras sin
      alertSpy.mockClear();
      component.registrosSeleccionados = [
        { id: 1, motivoDebito: 'Falta firma' } as any,
        { id: 2, motivoDebito: '' } as any
      ];
      component.comentariosDebitoMasivo = 'Obs';
      component.aplicarComentariosDebitoMasivo();
      expect(alertSpy.mock.calls[0][0]).toContain('solo a 1 fila(s)');

      // aplicarImporteRefacturaMasivo: todas con debito SI
      alertSpy.mockClear();
      component.registrosSeleccionados = [{ id: 1, debitoAceptado: 'SI' } as any];
      component.importeRefacturaMasivo = 150;
      component.aplicarImporteRefacturaMasivo();
      expect(alertSpy.mock.calls[0][0]).toContain('No se puede asignar un Importe de Refactura');

      // aplicarImporteRefacturaMasivo: algunas con debito SI
      alertSpy.mockClear();
      component.registrosSeleccionados = [
        { id: 1, debitoAceptado: 'NO' } as any,
        { id: 2, debitoAceptado: 'SI' } as any
      ];
      component.importeRefacturaMasivo = 150;
      component.aplicarImporteRefacturaMasivo();
      expect(alertSpy.mock.calls[0][0]).toContain('Se ignoraron 1 fila(s)');

      // ejecutarMasivoDebitoAceptado a 'NO' con motivo de refactura
      component.registrosSeleccionados = [{ id: 1, total: 500, motivoRefactura: 'Autorizado' } as any];
      component.ejecutarMasivoDebitoAceptado('NO', true);
      expect(component.registrosSeleccionados[0].importeRefactura).toBe(500);

      // abrirModalNuevaNota ND con filas en NO
      component.prestaciones = [{ id: 1, debitoAceptado: 'NO' } as any];
      component.abrirModalNuevaNota('ND');
      expect(component.tipoNuevaNota).toBe('ND');
      expect(component.modalNuevaNotaVisible).toBe(true);
    });

    it('esDocumentoBuscado y cargarDocumentoDesdeHistorial', () => {
      component.busquedaForm.patchValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '100' });

      expect(component.esDocumentoBuscado({ tipoDocumento: 'FC', letra: 'A', puntoVenta: '1', numero: '100' })).toBe(true);
      expect(component.esDocumentoBuscado({ tipoDocumento: 'NC', letra: 'A', puntoVenta: '1', numero: '100' })).toBe(false);
      expect(component.esDocumentoBuscado({ placeholderNdAjusteIva: true })).toBe(false);

      // Caso RC
      component.busquedaForm.patchValue({ tipo: 'RC', numero: '500' });
      expect(component.esDocumentoBuscado({ tipoDocumento: 'RC', numero: '500' })).toBe(true);
      expect(component.esDocumentoBuscado({ tipoDocumento: 'RC', numero: '999' })).toBe(false);

      // cargarDocumentoDesdeHistorial con placeholder
      const spyNdAjuste = vi.spyOn(component, 'abrirModalCrearNdAjusteIvaDesdeTabla').mockImplementation(() => {});
      component.cargarDocumentoDesdeHistorial({ placeholderNdAjusteIva: true });
      expect(spyNdAjuste).toHaveBeenCalled();

      // origenTipo IVA no hace nada
      component.cargarDocumentoDesdeHistorial({ origenTipo: 'IVA' });

      // NC e ND cargan formulario y buscan
      const buscarSpy = vi.spyOn(component, 'onBuscar').mockImplementation(() => {});
      component.cargarDocumentoDesdeHistorial({ tipoDocumento: 'NC', letra: 'B', puntoVenta: '2', numero: '50' });
      expect(component.busquedaForm.get('tipo')?.value).toBe('NC');
      expect(buscarSpy).toHaveBeenCalled();

      component.cargarDocumentoDesdeHistorial({ tipoDocumento: 'ND', letra: 'B', puntoVenta: '2', numero: '60' });
      expect(component.busquedaForm.get('tipo')?.value).toBe('ND');
    });

    it('guardarNuevaNotaBD con registros válidos para NC Ajuste IVA Prestacional, NC Refactura y ND Refactura', () => {
      component.filasHistorialComprobantes = [{ nivel: 0, idGrupo: 1, idEstado: 1 } as any];

      // NC Ajuste IVA Prestacional con motivo "Iva mal facturado"
      component.tipoNuevaNota = 'NC';
      component.prestaciones = [{ id: 1, total: 1000, motivoDebito: 'Iva mal facturado' } as any];
      component.nuevaNotaForm.patchValue({
        tipo: 'NC',
        letra: 'A',
        puntoVenta: '1',
        numero: '100',
        fecha: '2026-09-11',
        tipoNc: 'Por ajuste de IVA',
        subtipoIva: 'Prestacional'
      });
      auditoriaServiceSpy.guardarNuevaNotaCredito = vi.fn().mockReturnValue(of({}));
      component.guardarNuevaNotaBD();
      expect(auditoriaServiceSpy.guardarNuevaNotaCredito).toHaveBeenCalled();

      // NC Refactura con prestaciones pendientes
      component.prestaciones = [{ id: 2, motivoDebito: 'Falta firma' } as any];
      component.nuevaNotaForm.patchValue({ tipoNc: 'Refactura', subtipoIva: '' });
      component.guardarNuevaNotaBD();
      expect(auditoriaServiceSpy.guardarNuevaNotaCredito).toHaveBeenCalled();

      // ND Refactura con prestaciones en NO
      component.tipoNuevaNota = 'ND';
      component.prestaciones = [{ id: 3, debitoAceptado: 'NO' } as any];
      component.nuevaNotaForm.patchValue({
        tipo: 'ND',
        letra: 'A',
        puntoVenta: '1',
        numero: '200',
        fecha: '2026-09-11',
        tipoNd: 'Por Refactura'
      });
      auditoriaServiceSpy.guardarNuevaNotaDebito = vi.fn().mockReturnValue(of({}));
      component.guardarNuevaNotaBD();
      expect(auditoriaServiceSpy.guardarNuevaNotaDebito).toHaveBeenCalled();
    });

    it('casos de búsqueda RC y TABLA_AJUSTE_IVA, paginación fuera de rango y ejecuciones individuales', () => {
      // Búsqueda RC
      component.busquedaForm.patchValue({ tipo: 'RC', numero: '100' });
      auditoriaServiceSpy.buscarPrestaciones = vi.fn().mockReturnValue(of({ historialComprobantes: [] }));
      component.onBuscar();
      expect(component.modalHistorialVisible).toBe(true);

      // Búsqueda con TABLA_AJUSTE_IVA
      component.busquedaForm.patchValue({ tipo: 'FC', letra: 'A', puntoVenta: '1', numero: '100' });
      auditoriaServiceSpy.buscarPrestaciones = vi.fn().mockReturnValue(of({ tipoVista: 'TABLA_AJUSTE_IVA', historialComprobantes: [] }));
      component.onBuscar();
      expect(component.modalHistorialVisible).toBe(true);

      // Paginación fuera de rango
      component.prestacionesFiltradas = [{ id: 1 } as any];
      component.itemsPorPagina = 10;
      component.paginaActual = 5;
      component.actualizarPaginacion();
      expect(component.paginaActual).toBe(1);

      // ejecutarIndividualDebito con 'Borrar'
      const p = { id: 1, total: 500, motivoDebito: 'Falta', importeDebitado: 500, comentariosDebito: 'obs' } as any;
      component.ejecutarIndividualDebito(p, 'Borrar');
      expect(p.motivoDebito).toBe('');
      expect(p.importeDebitado).toBeUndefined();
      expect(p.comentariosDebito).toBe('');

      // limpiarFiltros individuales
      component.limpiarFiltro('profesional');
      component.limpiarFiltro('prestacion');
      component.limpiarFiltro('grupo');
      component.limpiarFiltro('fecha');
      expect(component.filtroFecha).toBe('');
    });

    it('gestión modal en onSeleccionarCabeceraNdIva y alternarModoIngresoManualNdIva', () => {
      // onSeleccionarCabeceraNdIva con prestaciones imputadas
      component.cabecerasDisponiblesNdIva = [
        { id: 99, tienePrestacionesImputadas: true, label: 'ND A 1-99' }
      ];
      component.onSeleccionarCabeceraNdIva(99);
      expect(component.modalVisible).toBe(true);
      component.modalCancelarCb();
      expect(component.cabeceraSeleccionadaIdNdIva).toBeNull();

      // alternarModoIngresoManualNdIva false con cabecera existente
      component.cabeceraSeleccionadaIdNdIva = 99;
      component.alternarModoIngresoManualNdIva(false);
      expect(component.cabeceraSeleccionadaNdIvaObjeto).toBeDefined();

      // abrirModalCrearNdAjusteIvaDesdeTabla cuando finalizado
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');
      component.filasHistorialComprobantes = [{ nivel: 0, idGrupo: 1, idEstado: 2 } as any];
      component.abrirModalCrearNdAjusteIvaDesdeTabla();
      expect(alertSpy.mock.calls[0][0]).toContain('finalizado');
    });

    it('onCellValueChanged ramas de nuevo igual a previo y debitoAceptado sin importe previo', () => {
      const p = { id: 1, total: 1000, motivoRefactura: 'Autorizado' } as any;
      const apiMock = { refreshCells: vi.fn() };
      const nodeMock = { setDataValue: vi.fn() };

      // nuevo === previo
      component.onCellValueChanged({
        data: p,
        colDef: { field: 'debitoAceptado' },
        oldValue: 'SI',
        newValue: 'SI',
        api: apiMock,
        node: nodeMock
      } as any);
      expect(apiMock.refreshCells).not.toHaveBeenCalled();

      // debitoAceptado a 'NO' sin importe previo (aplica total a importeRefactura directamente)
      component.onCellValueChanged({
        data: p,
        colDef: { field: 'debitoAceptado' },
        oldValue: '',
        newValue: 'NO',
        api: apiMock,
        node: nodeMock
      } as any);
      expect(p.importeRefactura).toBe(1000);

      // debitoAceptado a '' (limpia comentarios)
      p.comentarios = 'Algo';
      component.onCellValueChanged({
        data: p,
        colDef: { field: 'debitoAceptado' },
        oldValue: 'NO',
        newValue: '',
        api: apiMock,
        node: nodeMock
      } as any);
      expect(p.comentarios).toBe('');
    });

    it('guardarNuevaNotaBD validaciones y guardado parcial previo', () => {
      const alertSpy = vi.spyOn(component, 'mostrarAlerta');
      component.filasHistorialComprobantes = [{ nivel: 0, idGrupo: 1, idEstado: 1 } as any];

      // Formulario inválido
      component.nuevaNotaForm.reset();
      component.guardarNuevaNotaBD();
      expect(alertSpy.mock.calls[0][0]).toContain('complete todos los campos');

      // Modificados con NC previa dispara guardado parcial
      const spyParcial = vi.spyOn(component, 'guardarParcialmente').mockImplementation(() => {});
      component.tipoNuevaNota = 'NC';
      component.tipoBusquedaRealizada = 'FC';
      component.prestaciones = [{ id: 10, ncNumero: 50, motivoDebito: 'Falta' } as any];
      component.modificadosSinGuardar.add(10);
      component.nuevaNotaForm.patchValue({
        tipo: 'NC',
        letra: 'A',
        puntoVenta: '1',
        numero: '100',
        fecha: '2026-09-11',
        tipoNc: 'Refactura'
      });
      auditoriaServiceSpy.guardarNuevaNotaCredito = vi.fn().mockReturnValue(of({}));
      component.guardarNuevaNotaBD();
      expect(spyParcial).toHaveBeenCalledWith(true);

      // Default callbacks
      component.modalAceptarCb();
      component.modalCancelarCb();
    });
  });
});



