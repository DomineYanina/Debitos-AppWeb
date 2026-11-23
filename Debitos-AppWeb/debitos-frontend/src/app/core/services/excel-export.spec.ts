import { TestBed } from '@angular/core/testing';
import { ExcelExportService } from './excel-export';
import { vi } from 'vitest';

vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}));

import { saveAs } from 'file-saver';

describe('ExcelExportService', () => {
  let service: ExcelExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExcelExportService]
    });
    service = TestBed.inject(ExcelExportService);
    vi.clearAllMocks();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('exportarPrestaciones no debería ejecutar si la lista está vacía', async () => {
    await service.exportarPrestaciones([], 'FC', 'test.xlsx');
    expect(saveAs).not.toHaveBeenCalled();

    await service.exportarPrestaciones(null as any, 'FC', 'test.xlsx');
    expect(saveAs).not.toHaveBeenCalled();
  });

  it('exportarPrestaciones debería exportar para tipo NC y guardar archivo', async () => {
    const data: any[] = [
      {
        carnet: '123',
        paciente: 'Perez Juan',
        cobertura: 'OSDE',
        plan: '210',
        grupomodulo: 'MOD1',
        medico: 'Dr. House',
        fecha: '2025-05-10',
        codigo: '420101',
        descripcion: 'Consulta',
        cantidad: 1,
        totalNeto: 1000,
        coseguro: 0,
        total: 1000,
        comentarioPrevio: 'Obs previa',
        motivoRefactura: '01',
        importeRefactura: 500,
        comentarios: 'Refacturado'
      }
    ];

    await service.exportarPrestaciones(data, 'NC', 'export_nc.xlsx');
    expect(saveAs).toHaveBeenCalled();
  });

  it('exportarPrestaciones debería filtrar registros con debitoAceptado SI/NO para tipo FC e incluir agrupamiento de motivo de débito', async () => {
    const data: any[] = [
      { carnet: '1', paciente: 'P1', debitoAceptado: 'SI', motivoDebito: 'Demora en resolución quirúrgica', fecha: '2025-01-01T00:00:00' },
      { carnet: '2', paciente: 'P2', debitoAceptado: 'NO', motivoDebito: 'Falta de autorización', fecha: '' },
      { carnet: '3', paciente: 'P3', debitoAceptado: '', fecha: null }
    ];

    await service.exportarPrestaciones(data, 'FC', 'export_fc.xlsx');
    expect(saveAs).toHaveBeenCalled();
  });

  it('exportarHistorialComprobantes no debería ejecutar si no hay filas', async () => {
    await service.exportarHistorialComprobantes([], null, 'historial.xlsx');
    expect(saveAs).not.toHaveBeenCalled();
  });

  it('exportarHistorialComprobantes debería procesar árbol jerárquico con diferentes orígenes y niveles', async () => {
    const filas: any[] = [
      {
        nivel: 0,
        tipoDocumento: 'FAC',
        letra: 'A',
        puntoVenta: 1,
        numero: 1000,
        fechaDocumento: '2025-01-01',
        montoNeto: 10000,
        porcentajeIva: 21,
        montoIva: 2100,
        origenTipo: null
      },
      {
        nivel: 1,
        tipoDocumento: 'NC',
        letra: 'A',
        puntoVenta: 1,
        numero: 2000,
        fechaDocumento: '2025-01-05',
        montoNeto: 2000,
        porcentajeIva: null,
        montoIva: null,
        origenTipo: 'DEB'
      },
      {
        nivel: 2,
        tipoDocumento: 'ND',
        letra: 'A',
        puntoVenta: 1,
        numero: 3000,
        fechaDocumento: '2025-01-10',
        montoNeto: 1500,
        porcentajeIva: 21,
        montoIva: 315,
        origenTipo: 'REF'
      },
      {
        nivel: 1,
        tipoDocumento: 'RC',
        letra: 'X',
        puntoVenta: 1,
        numero: 50,
        fechaDocumento: '2025-01-15',
        montoNeto: 8000,
        origenTipo: 'COB'
      },
      {
        nivel: 1,
        tipoDocumento: 'NC',
        letra: 'A',
        puntoVenta: 1,
        numero: 2005,
        fechaDocumento: '2025-01-20',
        montoNeto: 500,
        origenTipo: 'IVA'
      }
    ];

    const buscado = { tipo: 'FC', letra: 'A', puntoVenta: 1, numero: 1000 };

    await service.exportarHistorialComprobantes(filas, buscado, 'historial_completo.xlsx');
    expect(saveAs).toHaveBeenCalled();
  });

  it('exportarHistorialComprobantes debería exportar correctamente filas con marcas de anulado y anulador', async () => {
    const filasAnuladas: any[] = [
      {
        nivel: 0,
        tipoDocumento: 'FC',
        letra: 'A',
        puntoVenta: 31,
        numero: 1865,
        fechaDocumento: '2026-05-01',
        montoNeto: 151804189.73,
        origenTipo: null
      },
      {
        nivel: 1,
        tipoDocumento: 'NCE',
        letra: 'A',
        puntoVenta: 31,
        numero: 888,
        fechaDocumento: '2026-08-19',
        montoNeto: 34749129.17,
        origenTipo: 'DEB',
        anulado: true,
        detalleAnulacion: 'Anulado por NDE A-0031-00000494 del 2026-08-24 ($ 34.749.129,17)'
      },
      {
        nivel: 2,
        tipoDocumento: 'NDE',
        letra: 'A',
        puntoVenta: 31,
        numero: 494,
        fechaDocumento: '2026-08-24',
        montoNeto: 34749129.17,
        origenTipo: 'REF',
        anulador: true,
        detalleAnulacion: 'Documento anulador de contrapartida de NCE A-0031-00000888'
      }
    ];

    await service.exportarHistorialComprobantes(filasAnuladas, null, 'historial_anulados.xlsx');
    expect(saveAs).toHaveBeenCalled();
  });

  describe('Exportación de las 10 Solapas del Tablero de Control Financiero', () => {
    const contextoBase = {
      solapaTitulo: 'Solapa de Prueba',
      coberturaTexto: 'Todas las Instituciones',
      tipoComprobanteTexto: 'Todos los Tipos',
      criterioFechaTexto: 'Período de Factura Madre',
      rangoFechasTexto: '01/05/2026 al 31/05/2026'
    };

    it('debería exportar Solapa 1: Tablero de Control (KPIs + Balance Financiero)', async () => {
      await service.exportarTableroControl(
        {
          totalFacturado: 100000,
          cantidadFacturas: 10,
          totalIncrementosNd: 5000,
          totalDebitosNc: 10000,
          totalRefacturacionNd: 6000,
          tasaRecupero: 60,
          totalCobranzas: 80000,
          efectividadCobro: 76.2,
          saldoPendienteReal: 21000,
          dsoPonderadoDias: 45
        },
        [
          {
            financiador: '750 - OMINT',
            facturacionFc: 100000,
            incrementosNd: 5000,
            debitosNc: 10000,
            refacturadoNd: 6000,
            cobradoRc: 80000,
            saldoPendiente: 21000
          }
        ],
        {
          facturacionFc: 100000,
          incrementosNd: 5000,
          debitosNc: 10000,
          refacturadoNd: 6000,
          cobradoRc: 80000,
          saldoPendiente: 21000
        },
        contextoBase,
        'tablero.xlsx'
      );
      expect(saveAs).toHaveBeenCalled();
    });

    it('debería exportar Solapa 2A: Cuenta Corriente Imputados con 3 niveles y outlineLevel', async () => {
      await service.exportarCuentaCorrienteImputados(
        [
          {
            financiador: '513 - WILLIAM HOPE',
            facturacionFc: 50000,
            incrementosNd: 0,
            debitosNc: 5000,
            refacturacionNd: 2000,
            cobranzasRc: 40000,
            saldo: 7000,
            periodos: [
              {
                periodo: '05/2026',
                facturacionFc: 50000,
                incrementosNd: 0,
                debitosNc: 5000,
                refacturacionNd: 2000,
                cobranzasRc: 40000,
                saldo: 7000,
                comprobantes: [
                  {
                    tipo: 'FC',
                    comprobante: 'FAC A0030-00001234',
                    fecha: '2026-05-10',
                    facturacionFc: 50000,
                    incrementosNd: 0,
                    debitosNc: 5000,
                    refacturacionNd: 2000,
                    cobranzasRc: 40000,
                    saldo: 7000,
                    hijos: [
                      {
                        tipo: 'NC',
                        comprobante: 'NC A0030-00000099',
                        fecha: '2026-05-15',
                        facturacionFc: 0,
                        incrementosNd: 0,
                        debitosNc: 5000,
                        refacturacionNd: 0,
                        cobranzasRc: 0,
                        saldo: -5000
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        {
          facturacion: 50000,
          incrementos: 0,
          debitos: 5000,
          refacturacion: 2000,
          cobranzas: 40000,
          saldo: 7000
        },
        contextoBase,
        'cc_imputados.xlsx'
      );
      expect(saveAs).toHaveBeenCalled();
    });

    it('debería exportar Solapa 2B: Cuenta Corriente Recibos No Imputados', async () => {
      await service.exportarCuentaCorrienteNoImputados(
        [
          {
            id: 1,
            tipo: 'RC',
            letra: 'X',
            ptovta: 1,
            numero: 555,
            comprobante: 'RC X0001-00000555',
            fecha: '2026-05-20',
            periodo: '2026-05-01',
            debe: 0,
            haber: 15000,
            importe: 15000,
            codigoCobertura: '750',
            cobertura: 'OMINT'
          }
        ],
        15000,
        contextoBase,
        'cc_no_imputados.xlsx'
      );
      expect(saveAs).toHaveBeenCalled();
    });

    it('debería exportar Solapa 3: Tiempos de Cobranza (Aging)', async () => {
      await service.exportarTiemposCobranza(
        {
          dsoGlobal: 42,
          cobroRealPromedio: 38,
          saldoTotalMora: 120000,
          detalles: [
            { rango: 'De 0 a 45 días', cantidadComprobantes: 15, saldoEnMora: 80000, porcentajeCartera: 66.7 },
            { rango: 'Aún no cobrados', cantidadComprobantes: 5, saldoEnMora: 40000, porcentajeCartera: 33.3 }
          ]
        },
        contextoBase,
        'tiempos.xlsx'
      );
      expect(saveAs).toHaveBeenCalled();
    });

    it('debería exportar Solapa 4: Matriz de Cobranzas', async () => {
      await service.exportarMatrizCobranzas(
        {
          anioSeleccionado: 2026,
          aniosDisponibles: [2025, 2026],
          filas: [
            {
              financiador: '750 - OMINT',
              meses: [1000, 2000, 0, 0, 5000, 0, 0, 0, 0, 0, 0, 0],
              totalAnual: 8000
            }
          ],
          totalesMes: [1000, 2000, 0, 0, 5000, 0, 0, 0, 0, 0, 0, 0],
          granTotal: 8000
        },
        contextoBase,
        'matriz.xlsx'
      );
      expect(saveAs).toHaveBeenCalled();
    });

    it('debería exportar Solapa 5: Motivos de Débito y Refacturación', async () => {
      await service.exportarMotivosDebito(
        [
          {
            motivo: 'Falta de autorización',
            cantidadCasos: 12,
            montoTotal: 50000,
            porcentaje: 100,
            montoAceptado: 10000,
            porcentajeAceptados: 20,
            montoRefacturado: 40000,
            porcentajeRefacturados: 80
          }
        ],
        {
          totalDebitado: 50000,
          totalCasos: 12,
          debitoAceptado: 10000,
          tasaPerdida: 20,
          totalRefacturado: 40000,
          tasaRecupero: 80,
          diferencia: 0,
          tasaDiferencia: 0,
          motivosIdentificados: 1
        },
        contextoBase,
        'motivos.xlsx'
      );
      expect(saveAs).toHaveBeenCalled();
    });

    it('debería exportar Solapa 6, 8 y 9: Analistas, Usuarios de Carga y Prestadores/Médicos a 3 niveles', async () => {
      const motivosMock = [
        {
          motivo: 'Falta de autorización',
          casos: 4,
          montoDebitado: 20000,
          aceptado: 5000,
          refacturado: 15000,
          diferencia: 0,
          financiadores: [
            {
              financiador: '750 - OMINT',
              casos: 4,
              monto: 20000,
              montoDebitado: 20000,
              aceptado: 5000,
              refacturado: 15000,
              diferencia: 0
            }
          ]
        }
      ];

      await service.exportarAnalistasDebito(
        [
          {
            analista: 'FernandaCortes',
            cantidadFinanciadores: 1,
            cantidadRegistros: 4,
            totalTramitado: 20000,
            debitosAceptados: 5000,
            debitosRefacturados: 15000,
            diferencia: 0,
            ticketPromedio: 5000,
            tasaRecupero: 75,
            distribucionAtencion: '0% Amb / 100% Int',
            motivos: motivosMock
          }
        ],
        { financiadores: 1, casos: 4, montoDebitado: 20000, aceptados: 5000, refacturados: 15000, diferencia: 0 },
        contextoBase
      );

      await service.exportarUsuariosCarga(
        [
          {
            operador: 'BALBELLASAN',
            cantidadRegistros: 4,
            totalTramitado: 20000,
            debitosAceptados: 5000,
            debitosRefacturados: 15000,
            diferencia: 0,
            ticketPromedio: 5000,
            tasaRecupero: 75,
            motivos: motivosMock
          }
        ],
        { casos: 4, montoDebitado: 20000, aceptados: 5000, refacturados: 15000, diferencia: 0 },
        contextoBase
      );

      await service.exportarPrestadoresMedicos(
        [
          {
            medico: 'ROSSINI GUILLERMO',
            cantidadRegistros: 4,
            totalTramitado: 20000,
            debitosAceptados: 5000,
            debitosRefacturados: 15000,
            diferencia: 0,
            ticketPromedio: 5000,
            tasaRecupero: 75,
            motivos: motivosMock
          }
        ],
        { motivos: 1, casos: 4, montoDebitado: 20000, aceptados: 5000, refacturados: 15000, diferencia: 0 },
        contextoBase
      );

      expect(saveAs).toHaveBeenCalledTimes(3);
    });

    it('debería exportar Solapa 7 (Bucles de Insistencia) y Solapa 10 (Detalle y Trazabilidad)', async () => {
      const cadenasMock = [
        {
          idPrestacion: 'FAC A0030-00005364',
          descripcion: 'Factura FAC A0030-00005364',
          financiador: '431 - OSAP',
          medico: 'Dr. Perez',
          montoFacturadoOriginal: 100000,
          totalDebitado: 20000,
          historialEventos: [
            {
              tipo: 'FC',
              comprobante: 'FAC A0030-00005364',
              fecha: '2026-05-01',
              monto: 100000,
              descripcion: 'Emisión original',
              responsable: 'Operador 1'
            }
          ],
          prestaciones: [
            {
              codigo: '420101',
              descripcion: 'Consulta',
              paciente: 'Juan Gomez',
              carnet: '9988',
              medico: 'Dr. Perez',
              montoFacturadoOriginal: 100000,
              totalDebitado: 20000,
              cantidadRefacturaciones: 2,
              historialEventos: [
                {
                  tipo: 'ND',
                  comprobante: 'ND A0030-00000111',
                  fecha: '2026-05-12',
                  monto: 20000,
                  descripcion: 'Refacturación 1',
                  responsable: 'Analista 1'
                }
              ]
            }
          ]
        }
      ];

      await service.exportarBuclesInsistencia(cadenasMock, contextoBase);
      await service.exportarTrazabilidad(cadenasMock, contextoBase);
      expect(saveAs).toHaveBeenCalledTimes(2);
    });

    it('debería exportar Detalle por Motivo (Drill-Down de Prestaciones)', async () => {
      const prestacionesMock = [
        {
          id: 1,
          paciente: 'GARCIA MARIA',
          carnet: '123456',
          plan: 'PLAN 210',
          efector: 'SANATORIO CENTRAL',
          medico: 'DR LOPEZ',
          fechaPrestacion: '2026-08-20',
          codigo: '420101',
          descripcion: 'CONSULTA MEDICA',
          tipoDoc: 'NC',
          letraDoc: 'A',
          ptovtaDoc: 30,
          numeroDoc: 1062,
          fechaDoc: '2026-08-20',
          motivoDebito: 'Falta de autorización',
          comentariosDebito: 'Sin orden médica',
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
          fechaPrestacion: '2026-08-22',
          codigo: '340101',
          descripcion: 'ECOGRAFIA',
          tipoDoc: 'NC',
          letraDoc: 'A',
          ptovtaDoc: 30,
          numeroDoc: 1063,
          fechaDoc: '2026-08-22',
          motivoDebito: 'Falta de autorización',
          comentariosDebito: '',
          importeDebitado: 8000,
          debitoAceptado: false
        }
      ];

      await service.exportarDetalleMotivo(
        prestacionesMock,
        {
          motivo: 'Falta de autorización',
          totalDebitado: 12500,
          totalCasos: 2
        },
        contextoBase
      );

      expect(saveAs).toHaveBeenCalled();
    });

    it('debería exportar Solapa 11: Prestaciones Facturadas en Factura Madre', async () => {
      const itemsMock = [
        {
          id: 101,
          tipoDoc: 'FC',
          letraDoc: 'A',
          ptovtaDoc: 30,
          numeroDoc: 5364,
          fechaPrestacion: '2026-05-10',
          paciente: 'GONZALEZ JUAN',
          carnet: '778899',
          plan: 'OSDE 210',
          codigoPrestacion: '420101',
          descripcionPrestacion: 'CONSULTA MEDICA EN CONSULTORIO',
          especialidad: 'CLINICA MEDICA',
          cantidad: 1,
          importeTotal: 15000,
          medico: 'DR. LOPEZ CARLOS',
          cobertura: 'SANATORIO CENTRAL',
          tipoRegistro: 'Ambulatorios' as const
        }
      ];

      await service.exportarPrestacionesFacturadas(
        itemsMock,
        {
          totalRegistros: 1,
          totalMonto: 15000,
          cantidadMedicos: 1,
          cantidadPacientes: 1
        },
        contextoBase
      );

      expect(saveAs).toHaveBeenCalled();
    });
  });

  describe('Gestión Contable Exports', () => {
    it('exportarGestionCoberturas debería generar archivo y llamar a saveAs', async () => {
      const data = [
        { codigoCobertura: '443', nombreOriginal: 'OSDE', nombreMostrar: 'OSDE BINARIO' }
      ];
      await service.exportarGestionCoberturas(data, 'OSDE', 'coberturas.xlsx');
      expect(saveAs).toHaveBeenCalled();
    });

    it('exportarGestionCoberturas no debería ejecutar si la lista está vacía', async () => {
      await service.exportarGestionCoberturas([], '', 'coberturas.xlsx');
      expect(saveAs).not.toHaveBeenCalled();
    });

    it('exportarGestionPeriodos debería generar archivo y llamar a saveAs', async () => {
      const data = [
        {
          idCabecera: 1,
          tipo: 'FC',
          letra: 'A',
          ptovta: 30,
          numero: 1001,
          fecha: '2026-05-10',
          periodoOriginal: '2026-05-01',
          periodoCorregido: '2026-06-01',
          codigoCobertura: '443',
          cobertura: 'OSDE',
          importe: 50000
        }
      ];
      await service.exportarGestionPeriodos(data, 'periodos.xlsx');
      expect(saveAs).toHaveBeenCalled();
    });

    it('exportarGestionPrestaciones debería generar archivo y llamar a saveAs', async () => {
      const data = [
        { codigo: '420101', descripcion: 'CONSULTA', estado: 'Considerar', estadoAmbulatorio: 'Considerar', estadoInternado: 'No considerar' }
      ];
      await service.exportarGestionPrestaciones(data, '', 'prestaciones.xlsx');
      expect(saveAs).toHaveBeenCalled();
    });

    it('exportarGestionFacturasAnuladas debería generar archivo y llamar a saveAs', async () => {
      const data = [
        {
          idCabecera: 10,
          comprobante: 'FC A 0030-00001001',
          tipo: 'FC',
          letra: 'A',
          ptovta: 30,
          numero: 1001,
          fecha: '2026-05-10',
          periodo: '2026-05-01',
          codigoCobertura: '443',
          cobertura: 'OSDE',
          importe: 15000,
          anulada: true,
          origenAnulacion: 'MANUAL' as const,
          idCabeceraAnulador: 25,
          comprobanteAnulador: 'NCE A 0030-00000888'
        }
      ];
      await service.exportarGestionFacturasAnuladas(data, 'facturas_anuladas.xlsx');
      expect(saveAs).toHaveBeenCalled();
    });

    it('exportarGestionHistorial debería generar archivo y llamar a saveAs', async () => {
      const data = [
        {
          id: 1,
          tipoOperacionCodigo: 'CAMBIO_ALIAS_COBERTURA',
          tipoOperacionDescripcion: 'Cambio de Alias Cobertura',
          referencia: '443',
          valorAnterior: 'OSDE',
          valorNuevo: 'OSDE BINARIO',
          usuario: 'admin',
          fechaHora: '2026-05-10 10:00:00'
        }
      ];
      await service.exportarGestionHistorial(data, '', 'historial.xlsx');
      expect(saveAs).toHaveBeenCalled();
    });
  });
});
