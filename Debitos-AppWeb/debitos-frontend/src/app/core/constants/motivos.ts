export const LISTA_MOTIVOS_DEBITO = [
  {
    categoria: '1. ADMINISTRATIVOS',
    motivos: [
      'Afiliado dado de baja', 'Afiliado capitado', 'Coseguro no cobrado', 'Diferencia de coseguro',
      'Error de carga (códigos-inclusiones)', 'Error en el cálculo de porcentaje de códigos múltiples',
      'Facturación duplicada', 'Facturado a financiador incorrecto', 'Falta de autorización',
      'Honorarios profesionales pagados en forma directa', 'Iva mal facturado', 'Prestación fuera de término',
      'Prestación incluida en otra liquidación', 'Supera tope'
    ]
  },
  {
    categoria: '2. MÉDICOS / AUDITORÍA',
    motivos: [
      'Alta demorada', 'Demora en Inter Consulta', 'Demora en resolución quirúrgica', 'Diagnóstico ilegible',
      'Diagnóstico no reconocido', 'Diferencia de criterio médico', 'Prestación no prescrita',
      'Prestación no reconocida', 'Prestación no justificada', 'Refactura con HC firmada',
      'Tratamiento Medico justificado en Auditoria'
    ]
  },
  {
    categoria: '3. CONTRACTUALES / NOMENCLADOR',
    motivos: [
      'Débito por normas operativas', 'Débito 20% urgencia módulos', 'Débito 20% urgencia prestaciones',
      'Débito por diferencia en la inclusiones modulares', 'Débito por normas contractuales (ejemplo veda+vcc)',
      'Débito según normas del nomenclador', 'Diferencia de aranceles', 'Prestaciones incluidas en otra',
      'Incluido en APB', 'Diferencia de valor en medicamentos/descartables', 'Prestación no homologada',
      'Prestación sin convenio', 'Prestación brindada previa a la Internación',
      'Prestación facturada según módulos vigentes', 'Prestación facturada según presupuesto acordado',
      'Prestación homologada', 'Prestación no incluida según norma del Nomenclador Nacional',
      'Recargo por urgencia según norma del Nomenclador Nacional', 'Se adjunta norma del Nomenclador Nacional'
    ]
  },
  {
    categoria: '4. OPERATIVOS Y DOCUMENTALES (administrativo)',
    motivos: [
      'Conteo de medicación erróneo hojas de enfermería no identificadas con fecha', 'Débito por falta de historia clínica',
      'Débito por historias clínicas de distintos pacientes en la misma internación', 'Documentación adulterada',
      'Exceso de facturación en medicamentos y descartables', 'Falta de documentación avalatoria',
      'Falta de troqueles-stickers de medicación o materiales', 'Falta firma paciente', 'Falta firma profesional',
      'Falta informe', 'Historia clínica incompleta', 'Material/ Medicamentos provistos por O.S.',
      'Material no utilizado', 'Medicación no suministrada', 'Orden sin diagnóstico'
    ]
  },
  {
    categoria: '5. AJUSTES Y GESTIÓN COMERCIAL',
    motivos: [
      'Débitos varios, informados fuera de término por Tesorería, emisión de NC a efectos del cobro de la factura',
      'El costo de los impuestos en el proceso de la refactura superan el importe posible de cobro de la misma',
      'Prestación/Presupuesto facturado con nota rechazados', 'Rechazo de refactura por mantener motivos de débitos originales'
    ]
  },
  {
    categoria: '6. OTROS / SIN CLASIFICAR',
    motivos: ['Borrar', 'No aplica']
  }
];

export const LISTA_MOTIVOS_REFACTURA = [
  {
    categoria: '1. ADMINISTRATIVOS',
    motivos: [
      'Afiliado activo', 'Ajuste de coseguro mal debitado', 'Facturado en tiempo y forma',
      'Información filiatoria completa y vigente', 'Refacturación con Iva correspondiente a la afiliación'
    ]
  },
  {
    categoria: '2. MÉDICOS / AUDITORÍA',
    motivos: [
      'Ajuste por demora en alta medica por pedido de derivación', 'Aclaración de diagnóstico ilegible (adjunto HC)',
      'Descripción aclaratoria de procedimiento realizado', 'Medico externo sin HC en Sanatorio',
      'Normas Medico Sanatoriales', 'Norma para tratamiento de infecciones', 'Normas post operatorias/antibioticoterapia',
      'Prestación de urgencia sin consentimiento', 'Procedimiento quirúrgico ampliado', 'Refactura con HC firmada',
      'Tratamiento Medico justificado en Auditoria'
    ]
  },
  {
    categoria: '3. CONTRACTUALES / NOMENCLADOR',
    motivos: [
      'APB aranceles vigentes -Colegio Bioquímico-', 'Ajuste de valores por acuerdo de presupuesto  post facturación',
      'Aplicación de normas acordadas según convenio vigentes', 'Aranceles facturados según convenio vigente',
      'Contraste facturado a valores vigentes.', 'Discrepancia en alcance de la cobertura de pensiones',
      'Exclusiones no detalladas explícitamente', 'Materiales Radioactivos facturados según valores CEDIM',
      'Medicación, descartable, materiales facturados según convenio vigente', 'No corresponde ajuste de valores medicación /materiales',
      'No corresponde aplicación de Normas unilateralmente', 'Obligación de cobertura avalada por Ley',
      'Prestación brindada previa a la Internación', 'Prestación facturada según módulos vigentes',
      'Prestación facturada según presupuesto acordado', 'Prestación homologada',
      'Prestación no incluida según norma del Nomenclador Nacional', 'Recargo por urgencia según norma del Nomenclador Nacional',
      'Se adjunta norma del Nomenclador Nacional'
    ]
  },
  {
    categoria: '4. OPERATIVOS Y DOCUMENTALES (administrativo)',
    motivos: [
      'Autorización no respondida por el financiador', 'Autorización recibida post cierre de facturación',
      'Autorización vigente al momento de la facturación', 'Corrección de error en S. Operativo',
      'Documentación completa enviada al Financiador', 'Incompatibilidad de normas aplicadas para la aplicación del débito',
      'Orden con diagnóstico, se adjunta HC como ampliación diag.', 'Prestación justificada en HC',
      'Se adjunta troquel/stiker', 'Refacturación de medicación según consumo correcto',
      'Refacturación en ámbito de realización correcto', 'Refacturación por corrección de los módulos liquidados',
      'Se adjunta documentación omitida en facturación original'
    ]
  },
  {
    categoria: '5. AJUSTES Y GESTIÓN COMERCIAL',
    motivos: [
      'Acuerdo de bonificación de medicación administrada', 'Acuerdo de bonificación en prestación brindada',
      'Excepciones refacturas acordadas'
    ]
  },
  {
    categoria: '6. OTROS / SIN CLASIFICAR',
    motivos: [
      'Borrar', 'Débito erróneamente aplicado', 'No aplica'
    ]
  }
];
