-- =============================================================================
-- Script de Creación de Índices Estratégicos para Optimización de Rendimiento
-- Motor: PostgreSQL
-- Aplicación: Debitos-AppWeb
-- =============================================================================

-- 1. Índices en tabla 'cabecera' para filtros temporales, tipos y agrupamientos de familia
CREATE INDEX IF NOT EXISTS idx_cabecera_tipo_fecha ON cabecera (tipo, fecha);
CREATE INDEX IF NOT EXISTS idx_cabecera_asociadogrupo ON cabecera (asociadogrupo);
CREATE INDEX IF NOT EXISTS idx_cabecera_grupo ON cabecera (grupo);
CREATE INDEX IF NOT EXISTS idx_cabecera_asociado ON cabecera (asociado);
CREATE INDEX IF NOT EXISTS idx_cabecera_codigo_cobertura ON cabecera (codigo_cobertura);
CREATE INDEX IF NOT EXISTS idx_cabecera_periodo ON cabecera (periodo);

-- 2. Índices en tabla 'notadecredito' para resolución de relaciones con cabecera y prestaciones
CREATE INDEX IF NOT EXISTS idx_notadecredito_idcabecera ON notadecredito (idcabecera);
CREATE INDEX IF NOT EXISTS idx_notadecredito_id_prestacion ON notadecredito (id_prestacion);
CREATE INDEX IF NOT EXISTS idx_notadecredito_id_notadedebito ON notadecredito (id_notadedebito);

-- 3. Índices en tabla 'notadedebito' para resolución de relaciones con cabecera y notas de crédito padre
CREATE INDEX IF NOT EXISTS idx_notadedebito_idcabecera ON notadedebito (idcabecera);
CREATE INDEX IF NOT EXISTS idx_notadedebito_id_prestacion ON notadedebito (id_prestacion);
CREATE INDEX IF NOT EXISTS idx_notadedebito_id_notadecredito ON notadedebito (id_notadecredito);

-- 4. Índices en 'amb_liquidado' y 'nd_ajustedeiva' para subconsultas y trazabilidad
CREATE INDEX IF NOT EXISTS idx_amb_liquidado_idcabecera ON amb_liquidado (idcabecera);
CREATE INDEX IF NOT EXISTS idx_nd_ajustedeiva_idcabecera ON nd_ajustedeiva (idcabecera);
CREATE INDEX IF NOT EXISTS idx_nc_ajustedeiva_idcabecera ON nc_ajustedeiva (idcabecera);

-- 5. Índices para Analistas de Débito, Trazabilidad y Bucles de Insistencia
CREATE INDEX IF NOT EXISTS idx_notadecredito_usuario ON notadecredito (usuario) WHERE usuario IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notadedebito_usuario ON notadedebito (usuario) WHERE usuario IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cabecera_fecha_id ON cabecera (fecha ASC, id ASC);
CREATE INDEX IF NOT EXISTS idx_cabecera_coalesce_grupo ON cabecera (COALESCE(asociadogrupo, grupo));
CREATE INDEX IF NOT EXISTS idx_cabecera_upper_trim_tipo ON cabecera (UPPER(TRIM(tipo)));

-- 6. Índices parciales y funcionales para gráficos de Aging, Recaudación y Pareto
CREATE INDEX IF NOT EXISTS idx_cabecera_fc_saldo_pendiente ON cabecera (fecha, debe, haber) 
  WHERE tipo IN ('FC','FAC','FCE','FCA') AND (debe - COALESCE(haber, 0)) > 0;
CREATE INDEX IF NOT EXISTS idx_cabecera_recaudacion_anio ON cabecera (CAST(EXTRACT(YEAR FROM fecha) AS INTEGER), UPPER(TRIM(tipo))) 
  WHERE fecha IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notadecredito_motivo ON notadecredito (motivodedebito) 
  WHERE motivodedebito IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notadecredito_lower_motivo ON notadecredito (LOWER(TRIM(motivodedebito)));
CREATE INDEX IF NOT EXISTS idx_notadedebito_cabecera_notacredito ON notadedebito (idcabecera, id_notadecredito) 
  WHERE id_notadecredito IS NOT NULL;
