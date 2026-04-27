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
      guardarNuevaNotaDebito: () => of({})
    };
    authServiceSpy = { obtenerUsuario: () => 'tester', logout: () => {} };
    excelServiceSpy = { exportarPrestaciones: () => {} };
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
        { id: 1, paciente: 'Perez', total: 1000, debitoAceptado: true },
        { id: 2, paciente: 'Gomez', total: 2000, debitoAceptado: false }
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
      component.nuevaNotaForm.setValue({
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
});
