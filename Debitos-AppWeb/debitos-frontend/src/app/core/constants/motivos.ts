export const LISTA_MOTIVOS_DEBITO = [
  {
    categoria: '1. ADMINISTRATIVOS',
    motivos: [
      'Afiliado dado de baja', 'Afiliado capitado', 'Coseguro no cobrado/ No descontado', 'Débito sin motivo', 'Diferencia de coseguro',
      'Error de carga (códigos-inclusiones)', 'Error en el cálculo de porcentaje de códigos múltiples',
      'Facturación duplicada', 'Facturado a financiador incorrecto', 'Falta de autorización/Token',
      'Honorarios profesionales pagados en forma directa', 'Iva mal facturado', 'Prestación fuera de término',
      'Prestación incluida en otra liquidación', 'Prestación no realizada', 'Supera tope'
    ]
  },
  {
    categoria: '2. MÉDICOS / AUDITORÍA',
    motivos: [
      'Alta demorada', 'Demora en Inter Consulta', 'Demora en resolución quirúrgica', 'Diagnóstico ilegible',
      'Diagnóstico no reconocido', 'Diferencia de criterio médico', 'Falta de sello médico', 'Prestación no prescrita',
      'Prestación no reconocida(Prestacional/ Medicamento/ Material Descartable)', 'Prestación no justificada', 'Refactura con HC firmada',
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
      'Descripción aclaratoria de procedimiento realizado', "Justificación Médica", 'Medico externo sin HC en Sanatorio',
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

export function normalizarTextoMotivo(txt: string): string {
  if (!txt) return '';
  return txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function obtenerCategoriaDeMotivo(motivo: string): string {
  if (!motivo) return '6. OTROS / SIN CLASIFICAR';
  const norm = normalizarTextoMotivo(motivo);
  if (!norm || norm === 'borrar' || norm === 'no aplica' || norm === 'sin motivo' || norm === 'sin motivo especificado') {
    return '6. OTROS / SIN CLASIFICAR';
  }

  // 1. Coincidencia exacta con catálogo oficial
  for (const catObj of LISTA_MOTIVOS_DEBITO) {
    for (const m of catObj.motivos) {
      if (norm === normalizarTextoMotivo(m)) {
        return catObj.categoria;
      }
    }
  }

  // 2. Coincidencia por inclusión de subcadenas del catálogo
  for (const catObj of LISTA_MOTIVOS_DEBITO) {
    for (const m of catObj.motivos) {
      const normCat = normalizarTextoMotivo(m);
      if (normCat.length >= 6 && (norm.includes(normCat) || normCat.includes(norm))) {
        return catObj.categoria;
      }
    }
  }

  // 3. Reglas semánticas para variantes históricas
  if (norm.includes('criterio medico') || norm.includes('inter consulta') || norm.includes('resolucion quirurgica')
    || norm.includes('alta demorada') || norm.includes('prestacion no justificada')
    || norm.includes('no reconoce prestacion') || norm.includes('reconoce prestacion')
    || norm.includes('diagnostico') || norm.includes('sello medico') || norm.includes('hc firmada')) {
    return '2. MÉDICOS / AUDITORÍA';
  }

  if (norm.includes('arancel') || norm.includes('nomenclador') || norm.includes('normas operativas')
    || norm.includes('normas contractuales') || norm.includes('medicamentos descartables')
    || norm.includes('medicamentos/descartables') || norm.includes('incluida en otra')
    || norm.includes('inclusiones modulares') || norm.includes('apb') || norm.includes('convenio')
    || norm.includes('homologada') || norm.includes('presupuesto acordado')) {
    return '3. CONTRACTUALES / NOMENCLADOR';
  }

  if (norm.includes('firma paciente') || norm.includes('firma profesional') || norm.includes('historia clinica')
    || norm.includes('historia/informe') || norm.includes('documentacion avalatoria') || norm.includes('documentacion')
    || norm.includes('exceso de facturacion') || norm.includes('troquel') || norm.includes('hojas de enfermeria')
    || norm.includes('no suministrada') || norm.includes('no utilizado')) {
    return '4. OPERATIVOS Y DOCUMENTALES (administrativo)';
  }

  if (norm.includes('impuesto') || norm.includes('departamento comercial') || norm.includes('gestion comercial')
    || norm.includes('rechazo de refactura') || norm.includes('tesoreria')) {
    return '5. AJUSTES Y GESTIÓN COMERCIAL';
  }

  if (norm.includes('autorizacion') || norm.includes('token') || norm.includes('duplicada')
    || norm.includes('error de carga') || norm.includes('codigos multiples') || norm.includes('coseguro')
    || norm.includes('iva') || norm.includes('afiliado') || norm.includes('fuera de termino')
    || norm.includes('capitado') || norm.includes('honorarios')) {
    return '1. ADMINISTRATIVOS';
  }

  return '6. OTROS / SIN CLASIFICAR';
}
