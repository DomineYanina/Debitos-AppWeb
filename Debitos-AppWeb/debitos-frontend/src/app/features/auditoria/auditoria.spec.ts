import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditoriaComponent } from './auditoria';
import { AuditoriaService } from '../../core/services/auditoria';
import { AuthService } from '../../core/services/auth';
import { ExcelExportService } from '../../core/services/excel-export';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { Prestacion } from '../../core/models/prestacion';

describe('AuditoriaComponent', () => {
  let component: AuditoriaComponent;
  let fixture: ComponentFixture<AuditoriaComponent>;

  // Usamos 'any' para hacer Mocks en JavaScript puro
  let auditoriaServiceSpy: any;
  let authServiceSpy: any;
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
      verificarTieneNC: () => of([]),
      verificarTieneND: () => of([]),
      verificarTieneNCParaND: () => of(null),
      obtenerDocumentoAsociadoParaNC: () => of(null)
    };
    authServiceSpy = { obtenerUsuario: () => 'tester', logout: () => {} };
    excelServiceSpy = { exportarPrestaciones: () => {}, exportarHistorialComprobantes: () => {} };
    routerSpy = { navigate: () => {} };

    await TestBed.configureTestingModule({
      imports: [AuditoriaComponent, ReactiveFormsModule],
      providers: [
        { provide: AuditoriaService, useValue: auditoriaServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ExcelExportService, useValue: excelServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuditoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
        api: { refreshCells: jasmine.createSpy('refreshCells') },
        node: { setDataValue: jasmine.createSpy('setDataValue') }
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
        api: { refreshCells: jasmine.createSpy('refreshCells') },
        node: { setDataValue: jasmine.createSpy('setDataValue') }
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
        api: { refreshCells: jasmine.createSpy('refreshCells') },
        node: { setDataValue: jasmine.createSpy('setDataValue') }
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

    it('debería impedir abrir el modal de NC si no hay motivos de débito cargados (Camino de Error)', () => {
      component.prestaciones = [{ id: 1, motivoDebito: '' }] as any;
      let alerta = '';
      component.mostrarAlerta = (msg: string) => alerta = msg;

      // ACCIÓN
      component.abrirModalNuevaNota('NC');

      // VERIFICACIÓN
      expect(alerta).toContain('No hay registros con Motivo de Débito cargado');
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

});

