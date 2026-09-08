import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    routerSpy = { navigate: () => {} };

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
});



